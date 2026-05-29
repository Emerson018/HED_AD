"""
Email service for the HED AD platform.

Provides transactional email sending with retry logic and provider abstraction.
Handles credentials emails (account creation) and password reset emails.
"""

import logging
import re
import time

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.template.loader import render_to_string

from signage.models import AuditoriaLog, Usuario
from signage.services.email_adapters import (
    BrevoAdapter,
    EmailProviderAdapter,
    ResendAdapter,
    SendGridAdapter,
)

logger = logging.getLogger(__name__)

# Simple email regex for configuration validation
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Supported provider mapping
PROVIDER_MAP = {
    "resend": ResendAdapter,
    "sendgrid": SendGridAdapter,
    "brevo": BrevoAdapter,
}


class EmailService:
    """Transactional email service with retry logic and provider abstraction."""

    def __init__(self):
        self._skip_sending = False
        self._validate_configuration()
        if not self._skip_sending:
            self.provider = self._get_provider()
            self.from_address = settings.EMAIL_FROM_ADDRESS

    def send_credentials_email(self, user: Usuario, password: str) -> bool:
        """
        Send welcome email with login credentials.

        Args:
            user: The newly created user.
            password: The plaintext password to include in the email.

        Returns:
            True if email was sent successfully, False otherwise.
        """
        login_url = f"{settings.FRONTEND_URL}/login"

        if self._skip_sending:
            logger.warning(
                "E-mail de credenciais para %s ignorado (configuração incompleta).",
                user.email,
            )
            return False

        context = {
            "platform_name": "HED Campanhas",
            "username": user.username,
            "password": password,
            "login_url": login_url,
        }

        html = render_to_string("emails/credentials_email.html", context)
        subject = "HED Campanhas - Suas Credenciais de Acesso"

        success = self._send_with_retry(
            to=user.email,
            subject=subject,
            html=html,
        )

        # Audit logging
        if success:
            AuditoriaLog.objects.create(
                usuario=user,
                usuario_str=user.username,
                acao="EMAIL_CREDENCIAIS",
                descricao=f"E-mail de credenciais enviado com sucesso para {user.email}.",
            )
        else:
            AuditoriaLog.objects.create(
                usuario=user,
                usuario_str=user.username,
                acao="EMAIL_CREDENCIAIS_FALHA",
                descricao=(
                    f"Falha ao enviar e-mail de credenciais para {user.email} "
                    f"após todas as tentativas."
                ),
            )

        return success

    def send_reset_email(self, user: Usuario, token: str) -> bool:
        """
        Send password reset email with reset link.

        Args:
            user: The user requesting the password reset.
            token: The reset token string.

        Returns:
            True if email was sent successfully, False otherwise.
        """
        reset_url = f"{settings.FRONTEND_URL}/redefinir-senha/{token}"

        if self._skip_sending:
            logger.warning(
                "E-mail de redefinição de senha para %s ignorado (configuração incompleta).",
                user.email,
            )
            return False

        context = {
            "platform_name": "HED Campanhas",
            "first_name": user.first_name or user.username,
            "reset_url": reset_url,
        }

        html = render_to_string("emails/password_reset_email.html", context)
        subject = "HED Campanhas - Redefinição de Senha"

        success = self._send_with_retry(
            to=user.email,
            subject=subject,
            html=html,
        )

        return success

    def _send_with_retry(
        self, to: str, subject: str, html: str, max_retries: int = 2
    ) -> bool:
        """
        Send email with up to max_retries attempts, 1s delay between retries.
        Does not retry on non-transient errors (auth, config, import errors).

        Args:
            to: Recipient email address.
            subject: Email subject line.
            html: HTML body content.
            max_retries: Maximum number of attempts (default 2).

        Returns:
            True if email was sent successfully, False if all attempts failed.
        """
        NON_RETRYABLE = (ImportError, ModuleNotFoundError, TypeError, ValueError)

        for attempt in range(1, max_retries + 1):
            try:
                self.provider.send(
                    from_addr=self.from_address,
                    to=to,
                    subject=subject,
                    html_body=html,
                )
                logger.info(
                    "E-mail enviado com sucesso para %s (tentativa %d/%d)",
                    to,
                    attempt,
                    max_retries,
                )
                return True
            except NON_RETRYABLE as e:
                logger.error(
                    "Erro não-recuperável ao enviar e-mail para %s: %s",
                    to,
                    str(e),
                )
                return False
            except Exception as e:
                logger.warning(
                    "Falha ao enviar e-mail para %s (tentativa %d/%d): %s",
                    to,
                    attempt,
                    max_retries,
                    str(e),
                )
                if attempt < max_retries:
                    time.sleep(1)

        logger.error(
            "Todas as %d tentativas de envio de e-mail para %s falharam.",
            max_retries,
            to,
        )
        return False

    def _get_provider(self) -> EmailProviderAdapter:
        """
        Resolve provider adapter from EMAIL_PROVIDER setting.

        Returns:
            An instance of the appropriate EmailProviderAdapter.

        Raises:
            ImproperlyConfigured: If the provider is not supported.
        """
        provider_name = settings.EMAIL_PROVIDER.strip().lower()

        if provider_name not in PROVIDER_MAP:
            raise ImproperlyConfigured(
                f"Provedor de e-mail '{provider_name}' não é suportado. "
                f"Provedores disponíveis: {', '.join(PROVIDER_MAP.keys())}"
            )

        adapter_class = PROVIDER_MAP[provider_name]
        return adapter_class(api_key=settings.EMAIL_API_KEY)

    def _validate_configuration(self) -> None:
        """
        Validate email configuration settings.

        In DEBUG mode: logs warnings and allows the service to operate in a
        degraded mode (emails will be skipped).
        In production (DEBUG=False): raises ImproperlyConfigured for missing
        or invalid configuration.

        Raises:
            ImproperlyConfigured: In production mode when configuration is invalid.
        """
        api_key = getattr(settings, "EMAIL_API_KEY", "")
        from_address = getattr(settings, "EMAIL_FROM_ADDRESS", "")
        provider = getattr(settings, "EMAIL_PROVIDER", "")

        missing_keys = []
        if not api_key:
            missing_keys.append("EMAIL_API_KEY")
        if not from_address:
            missing_keys.append("EMAIL_FROM_ADDRESS")

        if missing_keys:
            if settings.DEBUG:
                logger.warning(
                    "Configuração de e-mail incompleta (modo DEBUG): %s não configurado(s). "
                    "E-mails serão ignorados.",
                    ", ".join(missing_keys),
                )
                self._skip_sending = True
                return
            else:
                raise ImproperlyConfigured(
                    f"Configuração de e-mail obrigatória ausente: "
                    f"{', '.join(missing_keys)}. "
                    f"Defina as variáveis de ambiente correspondentes."
                )

        # Validate email format for FROM address
        if from_address and not EMAIL_REGEX.match(from_address):
            raise ImproperlyConfigured(
                f"EMAIL_FROM_ADDRESS '{from_address}' não é um endereço de e-mail válido."
            )

        # Validate provider
        provider_name = provider.strip().lower()
        if provider_name not in PROVIDER_MAP:
            raise ImproperlyConfigured(
                f"Provedor de e-mail '{provider_name}' não é suportado. "
                f"Provedores disponíveis: {', '.join(PROVIDER_MAP.keys())}"
            )

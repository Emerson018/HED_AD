"""
Email provider adapters for the HED AD platform.

Implements the adapter pattern to abstract email sending across multiple
transactional email providers (Resend, SendGrid, Brevo, EmailJS).
"""

import logging
import re
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class EmailProviderAdapter(ABC):
    """Abstract base class for email provider adapters."""

    @abstractmethod
    def send(self, from_addr: str, to: str, subject: str, html_body: str) -> bool:
        """
        Send a single email.

        Args:
            from_addr: Sender email address.
            to: Recipient email address.
            subject: Email subject line.
            html_body: HTML content of the email body.

        Returns:
            True on success.

        Raises:
            Exception: On failure to send.
        """
        ...


class ResendAdapter(EmailProviderAdapter):
    """Adapter for the Resend email provider using HTTP API directly."""

    RESEND_API_URL = "https://api.resend.com/emails"

    def __init__(self, api_key: str):
        self.api_key = api_key

    def send(self, from_addr: str, to: str, subject: str, html_body: str) -> bool:
        import requests

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "from": from_addr,
            "to": [to],
            "subject": subject,
            "html": html_body,
        }

        try:
            response = requests.post(
                self.RESEND_API_URL,
                json=payload,
                headers=headers,
                timeout=10,
            )
            if response.status_code >= 400:
                error_detail = response.text[:200]
                logger.error(
                    "Resend API retornou status %d para %s: %s",
                    response.status_code, to, error_detail,
                )
                raise Exception(
                    f"Resend API error {response.status_code}: {error_detail}"
                )
            logger.info("Email enviado com sucesso via Resend para %s", to)
            return True
        except requests.exceptions.RequestException as e:
            logger.error("Falha ao enviar email via Resend para %s: %s", to, str(e))
            raise


class SendGridAdapter(EmailProviderAdapter):
    """Adapter for the SendGrid email provider."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    def send(self, from_addr: str, to: str, subject: str, html_body: str) -> bool:
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail

            message = Mail(
                from_email=from_addr,
                to_emails=to,
                subject=subject,
                html_content=html_body,
            )
            client = SendGridAPIClient(self.api_key)
            response = client.send(message)

            if response.status_code >= 400:
                raise Exception(
                    f"SendGrid retornou status {response.status_code}: "
                    f"{response.body}"
                )

            logger.info("Email enviado com sucesso via SendGrid para %s", to)
            return True
        except Exception as e:
            logger.error("Falha ao enviar email via SendGrid para %s: %s", to, str(e))
            raise


class BrevoAdapter(EmailProviderAdapter):
    """Adapter for the Brevo (formerly Sendinblue) email provider."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    def send(self, from_addr: str, to: str, subject: str, html_body: str) -> bool:
        try:
            import sib_api_v3_sdk
            from sib_api_v3_sdk.rest import ApiException

            configuration = sib_api_v3_sdk.Configuration()
            configuration.api_key["api-key"] = self.api_key

            api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
                sib_api_v3_sdk.ApiClient(configuration)
            )

            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                sender={"email": from_addr},
                to=[{"email": to}],
                subject=subject,
                html_content=html_body,
            )

            api_instance.send_transac_email(send_smtp_email)
            logger.info("Email enviado com sucesso via Brevo para %s", to)
            return True
        except ApiException as e:
            logger.error("Falha ao enviar email via Brevo para %s: %s", to, str(e))
            raise
        except Exception as e:
            logger.error("Falha ao enviar email via Brevo para %s: %s", to, str(e))
            raise


class EmailJSHTTPError(Exception):
    """Exceção para erros HTTP da API do EmailJS com classificação de status."""

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"EmailJS API error {status_code}: {detail}")

    @property
    def is_retryable(self) -> bool:
        """Retorna True se o erro é transiente e vale a pena tentar novamente."""
        return self.status_code == 429 or self.status_code >= 500


class EmailJSAdapter(EmailProviderAdapter):
    """Adapter para o provedor EmailJS usando API REST."""

    EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send"
    MAX_HTML_CONTENT_LENGTH = 50_000

    # Padrões regex para extração de variáveis de e-mail de credenciais
    PLATFORM_NAME_PATTERN = r'<strong>([^<]+)</strong>\s*foi criada'
    USERNAME_PATTERN = r'Usuário</p>\s*<p[^>]*>([^<]+)</p>'
    PASSWORD_PATTERN = r'Senha</p>\s*<p[^>]*>([^<]+)</p>'
    LOGIN_URL_PATTERN = (
        r'<a\s+href="([^"]+)"[^>]*>[^<]*</a>\s*</td>\s*</tr>\s*</table>'
        r'\s*</td>\s*</tr>\s*</table>'
    )

    # Padrões regex para extração de variáveis de e-mail de redefinição
    RESET_PLATFORM_PATTERN = r'<h1[^>]*>([^<]+)</h1>'
    FIRST_NAME_PATTERN = r'Olá,\s*<strong>([^<]+)</strong>'
    RESET_URL_PATTERN = r'<a\s+href="([^"]+)"[^>]*>\s*Redefinir Senha\s*</a>'

    def __init__(
        self,
        service_id: str,
        user_id: str,
        template_credentials_id: str,
        template_reset_id: str,
        private_key: str = "",
    ):
        """
        Inicializa o adaptador EmailJS.

        Args:
            service_id: Identificador do serviço no EmailJS.
            user_id: Chave pública (public key) da conta EmailJS.
            template_credentials_id: ID do template para e-mails de credenciais.
            template_reset_id: ID do template para e-mails de redefinição de senha.
            private_key: Chave privada (accessToken) para modo estrito (opcional).

        Raises:
            ValueError: Se qualquer parâmetro obrigatório for vazio ou apenas espaços.
        """
        params = {
            "service_id": service_id,
            "user_id": user_id,
            "template_credentials_id": template_credentials_id,
            "template_reset_id": template_reset_id,
        }
        for param_name, param_value in params.items():
            if not isinstance(param_value, str) or not param_value.strip():
                raise ValueError(
                    f"Parâmetro '{param_name}' não pode ser vazio ou apenas espaços."
                )

        self._service_id = service_id
        self._user_id = user_id
        self._template_credentials_id = template_credentials_id
        self._template_reset_id = template_reset_id
        self._private_key = private_key.strip() if private_key else ""

    def send(
        self,
        from_addr: str,
        to: str,
        subject: str,
        html_body: str,
        template_params: dict | None = None,
    ) -> bool:
        """
        Envia e-mail via API REST do EmailJS.

        Args:
            from_addr: Endereço do remetente.
            to: Endereço do destinatário.
            subject: Assunto do e-mail.
            html_body: Conteúdo HTML (usado para extração de variáveis ou fallback).
            template_params: Dicionário opcional de parâmetros (ignora extração).

        Returns:
            True em caso de sucesso.

        Raises:
            EmailJSHTTPError: Para respostas HTTP com status >= 400.
            requests.exceptions.RequestException: Para falhas de rede.
        """
        import requests

        template_id = self._select_template_id(subject)
        final_params = self._build_template_params(
            from_addr, to, subject, html_body, template_params, template_id
        )

        payload = {
            "service_id": self._service_id,
            "template_id": template_id,
            "user_id": self._user_id,
            "template_params": final_params,
        }

        # Inclui accessToken (private key) se configurado (modo estrito)
        if self._private_key:
            payload["accessToken"] = self._private_key

        headers = {"Content-Type": "application/json"}

        try:
            response = requests.post(
                self.EMAILJS_API_URL,
                json=payload,
                headers=headers,
                timeout=10,
            )
            if response.status_code >= 400:
                error_detail = response.text[:200]
                logger.error(
                    "EmailJS API retornou status %d para %s: %s",
                    response.status_code,
                    to,
                    error_detail,
                )
                raise EmailJSHTTPError(response.status_code, error_detail)

            logger.info("Email enviado com sucesso via EmailJS para %s", to)
            return True
        except requests.exceptions.RequestException as e:
            logger.error(
                "Falha ao enviar email via EmailJS para %s: %s", to, str(e)
            )
            raise

    def _select_template_id(self, subject: str) -> str:
        """
        Seleciona o template ID baseado em palavras-chave do assunto.

        Prioridade: credenciais > redefinição > fallback (credenciais).
        """
        subject_lower = subject.lower()

        if "credenciais" in subject_lower:
            return self._template_credentials_id

        if "redefinição" in subject_lower or "senha" in subject_lower:
            return self._template_reset_id

        return self._template_credentials_id

    def _extract_credentials_params(self, html_body: str) -> dict:
        """
        Extrai variáveis do template de credenciais a partir do HTML renderizado.

        Extrai: platform_name, username, password, login_url.
        """
        fields = {
            "platform_name": self.PLATFORM_NAME_PATTERN,
            "username": self.USERNAME_PATTERN,
            "password": self.PASSWORD_PATTERN,
            "login_url": self.LOGIN_URL_PATTERN,
        }
        result = {}
        for field_name, pattern in fields.items():
            match = re.search(pattern, html_body, re.DOTALL)
            if match:
                result[field_name] = match.group(1)
            else:
                logger.warning(
                    "Variável '%s' não extraída do HTML para template de credenciais",
                    field_name,
                )
                result[field_name] = ""
        return result

    def _extract_reset_params(self, html_body: str) -> dict:
        """
        Extrai variáveis do template de redefinição de senha a partir do HTML.

        Extrai: platform_name, first_name, reset_url.
        """
        fields = {
            "platform_name": self.RESET_PLATFORM_PATTERN,
            "first_name": self.FIRST_NAME_PATTERN,
            "reset_url": self.RESET_URL_PATTERN,
        }
        result = {}
        for field_name, pattern in fields.items():
            match = re.search(pattern, html_body, re.DOTALL)
            if match:
                result[field_name] = match.group(1)
            else:
                logger.warning(
                    "Variável '%s' não extraída do HTML para template de redefinição",
                    field_name,
                )
                result[field_name] = ""
        return result

    def _build_template_params(
        self,
        from_addr: str,
        to: str,
        subject: str,
        html_body: str,
        template_params: dict | None,
        template_id: str,
    ) -> dict:
        """
        Constrói o dicionário final de template_params para o payload da API.

        Lógica:
        1. Se template_params fornecido e não-vazio, usa diretamente
        2. Se template corresponde a credenciais, extrai variáveis de credenciais
        3. Se template corresponde a redefinição, extrai variáveis de redefinição
        4. Caso contrário, envia html_body truncado como html_content
        """
        base_params = {
            "from_addr": from_addr,
            "to": to,
            "to_email": to,
            "email": to,
            "subject": subject,
        }

        # 1. Se template_params fornecido e não-vazio, usa diretamente
        if template_params:
            return {**base_params, **template_params}

        # 2. Se template corresponde a credenciais, extrai variáveis
        if template_id == self._template_credentials_id:
            extracted = self._extract_credentials_params(html_body)
            return {**base_params, **extracted}

        # 3. Se template corresponde a redefinição, extrai variáveis
        if template_id == self._template_reset_id:
            extracted = self._extract_reset_params(html_body)
            return {**base_params, **extracted}

        # 4. Fallback: envia HTML truncado
        truncated_html = html_body[: self.MAX_HTML_CONTENT_LENGTH]
        return {**base_params, "html_content": truncated_html}

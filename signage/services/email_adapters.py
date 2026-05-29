"""
Email provider adapters for the HED AD platform.

Implements the adapter pattern to abstract email sending across multiple
transactional email providers (Resend, SendGrid, Brevo).
"""

import logging
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

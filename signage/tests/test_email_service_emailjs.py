"""
Testes unitários para EmailService com integração EmailJS.

Validates: Requirements 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3, 8.1, 8.2, 8.3, 8.4

Este módulo testa:
- Instanciação do EmailJSAdapter via EMAIL_PROVIDER=emailjs com parâmetros corretos
- Backward compatibility: EMAIL_PROVIDER=resend continua funcionando
- Default provider: EMAIL_PROVIDER='' usa emailjs
- ImproperlyConfigured para provedor inválido
- Retry para 429 e 5xx, não-retry para 400/401/403
- _validate_configuration com variáveis ausentes (DEBUG=True e DEBUG=False)
"""

from unittest.mock import MagicMock, patch

import pytest
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, override_settings

from signage.services.email_adapters import (
    EmailJSAdapter,
    EmailJSHTTPError,
    ResendAdapter,
)
from signage.services.email_service import EmailService, PROVIDER_MAP


# --- Configurações base para testes ---

EMAILJS_SETTINGS = {
    "EMAIL_PROVIDER": "emailjs",
    "EMAIL_FROM_ADDRESS": "noreply@hedcampanhas.com.br",
    "EMAILJS_SERVICE_ID": "service_abc123",
    "EMAILJS_USER_ID": "user_public_key_456",
    "EMAILJS_TEMPLATE_CREDENTIALS_ID": "template_cred_789",
    "EMAILJS_TEMPLATE_RESET_ID": "template_reset_012",
    "DEBUG": False,
    "FRONTEND_URL": "https://hedcampanhas.com.br",
}

RESEND_SETTINGS = {
    "EMAIL_PROVIDER": "resend",
    "EMAIL_FROM_ADDRESS": "noreply@hedcampanhas.com.br",
    "EMAIL_API_KEY": "re_test_api_key_123",
    "DEBUG": False,
    "FRONTEND_URL": "https://hedcampanhas.com.br",
}


def _mock_settings(overrides: dict) -> MagicMock:
    """Cria um MagicMock de settings com os valores fornecidos."""
    mock = MagicMock()
    for key, value in overrides.items():
        setattr(mock, key, value)
    return mock


# --- Testes de instanciação do provedor ---


class TestEmailServiceProviderInstantiation(SimpleTestCase):
    """
    Testa que EMAIL_PROVIDER=emailjs instancia EmailJSAdapter com parâmetros corretos.

    **Validates: Requirements 4.1, 4.2**
    """

    def test_emailjs_provider_instantiates_emailjs_adapter(self):
        """EMAIL_PROVIDER=emailjs deve instanciar EmailJSAdapter com parâmetros do settings."""
        mock_settings = _mock_settings(EMAILJS_SETTINGS)

        with patch("signage.services.email_service.settings", mock_settings):
            service = EmailService()

        self.assertIsInstance(service.provider, EmailJSAdapter)

    def test_emailjs_adapter_receives_correct_service_id(self):
        """EmailJSAdapter deve receber service_id do settings."""
        mock_settings = _mock_settings(EMAILJS_SETTINGS)

        with patch("signage.services.email_service.settings", mock_settings):
            service = EmailService()

        self.assertEqual(service.provider._service_id, "service_abc123")

    def test_emailjs_adapter_receives_correct_user_id(self):
        """EmailJSAdapter deve receber user_id do settings."""
        mock_settings = _mock_settings(EMAILJS_SETTINGS)

        with patch("signage.services.email_service.settings", mock_settings):
            service = EmailService()

        self.assertEqual(service.provider._user_id, "user_public_key_456")

    def test_emailjs_adapter_receives_correct_template_credentials_id(self):
        """EmailJSAdapter deve receber template_credentials_id do settings."""
        mock_settings = _mock_settings(EMAILJS_SETTINGS)

        with patch("signage.services.email_service.settings", mock_settings):
            service = EmailService()

        self.assertEqual(
            service.provider._template_credentials_id, "template_cred_789"
        )

    def test_emailjs_adapter_receives_correct_template_reset_id(self):
        """EmailJSAdapter deve receber template_reset_id do settings."""
        mock_settings = _mock_settings(EMAILJS_SETTINGS)

        with patch("signage.services.email_service.settings", mock_settings):
            service = EmailService()

        self.assertEqual(service.provider._template_reset_id, "template_reset_012")


# --- Testes de backward compatibility ---


class TestEmailServiceBackwardCompatibility(SimpleTestCase):
    """
    Testa que EMAIL_PROVIDER=resend continua funcionando sem alteração.

    **Validates: Requirements 4.3, 6.2**
    """

    def test_resend_provider_instantiates_resend_adapter(self):
        """EMAIL_PROVIDER=resend deve instanciar ResendAdapter."""
        mock_settings = _mock_settings(RESEND_SETTINGS)

        with patch("signage.services.email_service.settings", mock_settings):
            service = EmailService()

        self.assertIsInstance(service.provider, ResendAdapter)

    def test_resend_adapter_receives_api_key(self):
        """ResendAdapter deve receber api_key do settings."""
        mock_settings = _mock_settings(RESEND_SETTINGS)

        with patch("signage.services.email_service.settings", mock_settings):
            service = EmailService()

        self.assertEqual(service.provider.api_key, "re_test_api_key_123")

    def test_provider_map_contains_all_expected_providers(self):
        """PROVIDER_MAP deve conter emailjs, resend, sendgrid e brevo."""
        expected_providers = {"emailjs", "resend", "sendgrid", "brevo"}
        self.assertEqual(set(PROVIDER_MAP.keys()), expected_providers)


# --- Testes de default provider ---


class TestEmailServiceDefaultProvider(SimpleTestCase):
    """
    Testa que EMAIL_PROVIDER='' (vazio) usa emailjs como padrão.

    **Validates: Requirements 6.1**
    """

    def test_empty_provider_defaults_to_emailjs(self):
        """EMAIL_PROVIDER='' deve usar emailjs como provedor padrão."""
        settings_with_empty_provider = {
            **EMAILJS_SETTINGS,
            "EMAIL_PROVIDER": "",
        }
        mock_settings = _mock_settings(settings_with_empty_provider)

        with patch("signage.services.email_service.settings", mock_settings):
            service = EmailService()

        self.assertIsInstance(service.provider, EmailJSAdapter)

    def test_whitespace_provider_defaults_to_emailjs(self):
        """EMAIL_PROVIDER='   ' (apenas espaços) deve usar emailjs como padrão."""
        settings_with_whitespace_provider = {
            **EMAILJS_SETTINGS,
            "EMAIL_PROVIDER": "   ",
        }
        mock_settings = _mock_settings(settings_with_whitespace_provider)

        with patch("signage.services.email_service.settings", mock_settings):
            service = EmailService()

        self.assertIsInstance(service.provider, EmailJSAdapter)


# --- Testes de provedor inválido ---


class TestEmailServiceInvalidProvider(SimpleTestCase):
    """
    Testa que provedor inválido lança ImproperlyConfigured.

    **Validates: Requirements 4.4, 6.3**
    """

    def test_invalid_provider_raises_improperly_configured(self):
        """Provedor não suportado deve lançar ImproperlyConfigured."""
        settings_invalid = {
            **EMAILJS_SETTINGS,
            "EMAIL_PROVIDER": "mailgun",
        }
        mock_settings = _mock_settings(settings_invalid)

        with patch("signage.services.email_service.settings", mock_settings):
            with self.assertRaises(ImproperlyConfigured) as ctx:
                EmailService()

        error_msg = str(ctx.exception)
        self.assertIn("mailgun", error_msg)

    def test_invalid_provider_error_lists_available_providers(self):
        """Mensagem de erro deve listar todos os provedores disponíveis."""
        settings_invalid = {
            **EMAILJS_SETTINGS,
            "EMAIL_PROVIDER": "sparkpost",
        }
        mock_settings = _mock_settings(settings_invalid)

        with patch("signage.services.email_service.settings", mock_settings):
            with self.assertRaises(ImproperlyConfigured) as ctx:
                EmailService()

        error_msg = str(ctx.exception)
        for provider in ("emailjs", "resend", "sendgrid", "brevo"):
            self.assertIn(provider, error_msg)

    def test_numeric_provider_raises_improperly_configured(self):
        """Provedor numérico deve lançar ImproperlyConfigured."""
        settings_invalid = {
            **EMAILJS_SETTINGS,
            "EMAIL_PROVIDER": "12345",
        }
        mock_settings = _mock_settings(settings_invalid)

        with patch("signage.services.email_service.settings", mock_settings):
            with self.assertRaises(ImproperlyConfigured):
                EmailService()


# --- Testes de retry ---


class TestEmailServiceRetryBehavior(SimpleTestCase):
    """
    Testa retry para 429 e 5xx, e não-retry para 400/401/403.

    **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
    """

    def _build_service_with_mock_provider(self):
        """Cria EmailService com provider mockado para testar retry."""
        with patch.object(EmailService, "_validate_configuration"):
            with patch.object(EmailService, "_get_provider"):
                service = EmailService.__new__(EmailService)
                service._skip_sending = False
                service.provider = MagicMock()
                service.from_address = "noreply@test.com"
        return service

    @patch("time.sleep")
    def test_retry_on_429_rate_limit(self, mock_sleep):
        """Status 429 (rate limit) deve fazer retry até max_retries."""
        service = self._build_service_with_mock_provider()
        service.provider.send.side_effect = EmailJSHTTPError(
            status_code=429, detail="Too Many Requests"
        )

        result = service._send_with_retry(
            to="dest@test.com",
            subject="Test",
            html="<p>Test</p>",
            max_retries=2,
        )

        self.assertFalse(result)
        self.assertEqual(service.provider.send.call_count, 2)
        mock_sleep.assert_called_once_with(1)

    @patch("time.sleep")
    def test_retry_on_500_server_error(self, mock_sleep):
        """Status 500 (server error) deve fazer retry até max_retries."""
        service = self._build_service_with_mock_provider()
        service.provider.send.side_effect = EmailJSHTTPError(
            status_code=500, detail="Internal Server Error"
        )

        result = service._send_with_retry(
            to="dest@test.com",
            subject="Test",
            html="<p>Test</p>",
            max_retries=2,
        )

        self.assertFalse(result)
        self.assertEqual(service.provider.send.call_count, 2)
        mock_sleep.assert_called_once_with(1)

    @patch("time.sleep")
    def test_retry_on_502_bad_gateway(self, mock_sleep):
        """Status 502 (bad gateway) deve fazer retry até max_retries."""
        service = self._build_service_with_mock_provider()
        service.provider.send.side_effect = EmailJSHTTPError(
            status_code=502, detail="Bad Gateway"
        )

        result = service._send_with_retry(
            to="dest@test.com",
            subject="Test",
            html="<p>Test</p>",
            max_retries=2,
        )

        self.assertFalse(result)
        self.assertEqual(service.provider.send.call_count, 2)

    @patch("time.sleep")
    def test_retry_on_503_service_unavailable(self, mock_sleep):
        """Status 503 (service unavailable) deve fazer retry até max_retries."""
        service = self._build_service_with_mock_provider()
        service.provider.send.side_effect = EmailJSHTTPError(
            status_code=503, detail="Service Unavailable"
        )

        result = service._send_with_retry(
            to="dest@test.com",
            subject="Test",
            html="<p>Test</p>",
            max_retries=2,
        )

        self.assertFalse(result)
        self.assertEqual(service.provider.send.call_count, 2)

    @patch("time.sleep")
    def test_no_retry_on_400_bad_request(self, mock_sleep):
        """Status 400 (bad request) NÃO deve fazer retry."""
        service = self._build_service_with_mock_provider()
        service.provider.send.side_effect = EmailJSHTTPError(
            status_code=400, detail="Bad Request"
        )

        result = service._send_with_retry(
            to="dest@test.com",
            subject="Test",
            html="<p>Test</p>",
            max_retries=2,
        )

        self.assertFalse(result)
        self.assertEqual(service.provider.send.call_count, 1)
        mock_sleep.assert_not_called()

    @patch("time.sleep")
    def test_no_retry_on_401_unauthorized(self, mock_sleep):
        """Status 401 (unauthorized) NÃO deve fazer retry."""
        service = self._build_service_with_mock_provider()
        service.provider.send.side_effect = EmailJSHTTPError(
            status_code=401, detail="Unauthorized"
        )

        result = service._send_with_retry(
            to="dest@test.com",
            subject="Test",
            html="<p>Test</p>",
            max_retries=2,
        )

        self.assertFalse(result)
        self.assertEqual(service.provider.send.call_count, 1)
        mock_sleep.assert_not_called()

    @patch("time.sleep")
    def test_no_retry_on_403_forbidden(self, mock_sleep):
        """Status 403 (forbidden) NÃO deve fazer retry."""
        service = self._build_service_with_mock_provider()
        service.provider.send.side_effect = EmailJSHTTPError(
            status_code=403, detail="Forbidden"
        )

        result = service._send_with_retry(
            to="dest@test.com",
            subject="Test",
            html="<p>Test</p>",
            max_retries=2,
        )

        self.assertFalse(result)
        self.assertEqual(service.provider.send.call_count, 1)
        mock_sleep.assert_not_called()

    @patch("time.sleep")
    def test_successful_send_returns_true_no_retry(self, mock_sleep):
        """Envio bem-sucedido deve retornar True sem retry."""
        service = self._build_service_with_mock_provider()
        service.provider.send.return_value = True

        result = service._send_with_retry(
            to="dest@test.com",
            subject="Test",
            html="<p>Test</p>",
            max_retries=2,
        )

        self.assertTrue(result)
        self.assertEqual(service.provider.send.call_count, 1)
        mock_sleep.assert_not_called()

    @patch("time.sleep")
    def test_retry_succeeds_on_second_attempt(self, mock_sleep):
        """Se a primeira tentativa falha com erro transiente e a segunda sucede, retorna True."""
        service = self._build_service_with_mock_provider()
        service.provider.send.side_effect = [
            EmailJSHTTPError(status_code=500, detail="Server Error"),
            True,
        ]

        result = service._send_with_retry(
            to="dest@test.com",
            subject="Test",
            html="<p>Test</p>",
            max_retries=2,
        )

        self.assertTrue(result)
        self.assertEqual(service.provider.send.call_count, 2)
        mock_sleep.assert_called_once_with(1)


# --- Testes de _validate_configuration ---


class TestEmailServiceValidateConfiguration(SimpleTestCase):
    """
    Testa _validate_configuration com variáveis EmailJS ausentes.

    **Validates: Requirements 5.5, 5.6**
    """

    def test_missing_service_id_debug_false_raises(self):
        """EMAILJS_SERVICE_ID ausente com DEBUG=False deve lançar ImproperlyConfigured."""
        settings_missing = {
            **EMAILJS_SETTINGS,
            "EMAILJS_SERVICE_ID": "",
        }
        mock_settings = _mock_settings(settings_missing)

        with patch("signage.services.email_service.settings", mock_settings):
            with self.assertRaises(ImproperlyConfigured) as ctx:
                EmailService()

        self.assertIn("EMAILJS_SERVICE_ID", str(ctx.exception))

    def test_missing_user_id_debug_false_raises(self):
        """EMAILJS_USER_ID ausente com DEBUG=False deve lançar ImproperlyConfigured."""
        settings_missing = {
            **EMAILJS_SETTINGS,
            "EMAILJS_USER_ID": "",
        }
        mock_settings = _mock_settings(settings_missing)

        with patch("signage.services.email_service.settings", mock_settings):
            with self.assertRaises(ImproperlyConfigured) as ctx:
                EmailService()

        self.assertIn("EMAILJS_USER_ID", str(ctx.exception))

    def test_missing_template_credentials_id_debug_false_raises(self):
        """EMAILJS_TEMPLATE_CREDENTIALS_ID ausente com DEBUG=False deve lançar ImproperlyConfigured."""
        settings_missing = {
            **EMAILJS_SETTINGS,
            "EMAILJS_TEMPLATE_CREDENTIALS_ID": "",
        }
        mock_settings = _mock_settings(settings_missing)

        with patch("signage.services.email_service.settings", mock_settings):
            with self.assertRaises(ImproperlyConfigured) as ctx:
                EmailService()

        self.assertIn("EMAILJS_TEMPLATE_CREDENTIALS_ID", str(ctx.exception))

    def test_missing_template_reset_id_debug_false_raises(self):
        """EMAILJS_TEMPLATE_RESET_ID ausente com DEBUG=False deve lançar ImproperlyConfigured."""
        settings_missing = {
            **EMAILJS_SETTINGS,
            "EMAILJS_TEMPLATE_RESET_ID": "",
        }
        mock_settings = _mock_settings(settings_missing)

        with patch("signage.services.email_service.settings", mock_settings):
            with self.assertRaises(ImproperlyConfigured) as ctx:
                EmailService()

        self.assertIn("EMAILJS_TEMPLATE_RESET_ID", str(ctx.exception))

    def test_missing_vars_debug_true_sets_skip_sending(self):
        """Variáveis ausentes com DEBUG=True deve definir _skip_sending=True."""
        settings_debug = {
            **EMAILJS_SETTINGS,
            "EMAILJS_SERVICE_ID": "",
            "DEBUG": True,
        }
        mock_settings = _mock_settings(settings_debug)

        with patch("signage.services.email_service.settings", mock_settings):
            service = EmailService()

        self.assertTrue(service._skip_sending)

    def test_all_vars_present_debug_false_no_skip(self):
        """Todas as variáveis presentes com DEBUG=False não deve definir _skip_sending."""
        mock_settings = _mock_settings(EMAILJS_SETTINGS)

        with patch("signage.services.email_service.settings", mock_settings):
            service = EmailService()

        self.assertFalse(service._skip_sending)

    def test_whitespace_only_vars_treated_as_missing(self):
        """Variáveis com apenas espaços devem ser tratadas como ausentes."""
        settings_whitespace = {
            **EMAILJS_SETTINGS,
            "EMAILJS_SERVICE_ID": "   ",
        }
        mock_settings = _mock_settings(settings_whitespace)

        with patch("signage.services.email_service.settings", mock_settings):
            with self.assertRaises(ImproperlyConfigured):
                EmailService()

    def test_multiple_missing_vars_all_listed_in_error(self):
        """Múltiplas variáveis ausentes devem ser listadas na mensagem de erro."""
        settings_multiple_missing = {
            **EMAILJS_SETTINGS,
            "EMAILJS_SERVICE_ID": "",
            "EMAILJS_USER_ID": "",
        }
        mock_settings = _mock_settings(settings_multiple_missing)

        with patch("signage.services.email_service.settings", mock_settings):
            with self.assertRaises(ImproperlyConfigured) as ctx:
                EmailService()

        error_msg = str(ctx.exception)
        self.assertIn("EMAILJS_SERVICE_ID", error_msg)
        self.assertIn("EMAILJS_USER_ID", error_msg)

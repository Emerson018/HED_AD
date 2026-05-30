"""
Property-based tests for EmailService.

# Feature: emailjs-provider, Property 10: Invalid provider names are rejected
# Feature: emailjs-provider, Property 11: Missing EmailJS configuration is detected
# Feature: emailjs-provider, Property 13: Retry classification by error type

Validates: Requirements 4.4, 5.5, 5.6, 6.3, 8.1, 8.2, 8.3, 8.4, 8.5

This module tests:
- Property 10: For any string that, after stripping whitespace and converting
  to lowercase, is NOT one of 'emailjs', 'resend', 'sendgrid', or 'brevo',
  the EmailService._get_provider() method SHALL raise ImproperlyConfigured
  with a message listing available providers.
- Property 11: For any subset of the required EmailJS variables that is empty
  or undefined when EMAIL_PROVIDER='emailjs', the EmailService SHALL raise
  ImproperlyConfigured when DEBUG=False, or set _skip_sending=True when DEBUG=True.
- Property 13: For any error raised by EmailJSAdapter.send(), the
  EmailService._send_with_retry() SHALL:
  - Retry (up to 2 attempts, 1s delay) for network errors, timeouts,
    5xx status codes, and 429 (rate limit)
  - NOT retry for 400 (bad request), 401 (unauthorized), or 403 (forbidden)
  - Return False after all retry attempts are exhausted
"""

from unittest.mock import MagicMock, patch

import pytest
from hypothesis import given, settings as h_settings
from hypothesis import strategies as st
from requests.exceptions import ConnectionError, ReadTimeout, RequestException

from signage.services.email_adapters import EmailJSHTTPError


# --- Hypothesis Strategies ---

retryable_status_codes = st.one_of(
    st.just(429),
    st.integers(min_value=500, max_value=599),
)

non_retryable_status_codes = st.sampled_from([400, 401, 403])


# --- Helper to build an EmailService with mocked provider ---


def _build_email_service_with_mock_provider():
    """
    Cria uma instância de EmailService com provider mockado,
    sem depender de settings Django reais.
    """
    from signage.services.email_service import EmailService

    with patch.object(EmailService, "_validate_configuration"):
        with patch.object(EmailService, "_get_provider"):
            service = EmailService.__new__(EmailService)
            service._skip_sending = False
            service.provider = MagicMock()
            service.from_address = "noreply@test.com"
    return service


# --- Property 13: Retry classification by error type ---


class TestRetryClassificationByErrorType:
    """
    # Feature: emailjs-provider, Property 13: Retry classification by error type

    For any error raised by EmailJSAdapter.send(), the
    EmailService._send_with_retry() SHALL:
    - Retry (up to 2 attempts, 1s delay) for network errors, timeouts,
      5xx status codes, and 429 (rate limit)
    - NOT retry for 400 (bad request), 401 (unauthorized), or 403 (forbidden)
    - Return False after all retry attempts are exhausted

    **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
    """

    @given(status_code=retryable_status_codes)
    @h_settings(max_examples=100)
    @patch("time.sleep")
    def test_retryable_http_errors_are_retried(
        self, mock_sleep, status_code: int
    ):
        """
        Para qualquer status code retryable (429, 5xx), _send_with_retry
        DEVE chamar send() exatamente 2 vezes (max_retries=2) e retornar False.

        **Validates: Requirements 8.1, 8.3**
        """
        service = _build_email_service_with_mock_provider()
        service.provider.send.side_effect = EmailJSHTTPError(
            status_code=status_code, detail="Server error"
        )

        result = service._send_with_retry(
            to="dest@test.com",
            subject="Test Subject",
            html="<p>Test</p>",
            max_retries=2,
        )

        assert result is False, (
            f"_send_with_retry deve retornar False após esgotar tentativas "
            f"para status {status_code}"
        )
        assert service.provider.send.call_count == 2, (
            f"Para status retryable {status_code}, send() deve ser chamado "
            f"exatamente 2 vezes (max_retries=2), mas foi chamado "
            f"{service.provider.send.call_count} vezes"
        )

    @given(status_code=non_retryable_status_codes)
    @h_settings(max_examples=100)
    @patch("time.sleep")
    def test_non_retryable_http_errors_are_not_retried(
        self, mock_sleep, status_code: int
    ):
        """
        Para status codes não-retryable (400, 401, 403), _send_with_retry
        DEVE chamar send() exatamente 1 vez e retornar False imediatamente.

        **Validates: Requirements 8.2, 8.4**
        """
        service = _build_email_service_with_mock_provider()
        service.provider.send.side_effect = EmailJSHTTPError(
            status_code=status_code, detail="Client error"
        )

        result = service._send_with_retry(
            to="dest@test.com",
            subject="Test Subject",
            html="<p>Test</p>",
            max_retries=2,
        )

        assert result is False, (
            f"_send_with_retry deve retornar False para status "
            f"não-retryable {status_code}"
        )
        assert service.provider.send.call_count == 1, (
            f"Para status não-retryable {status_code}, send() deve ser chamado "
            f"exatamente 1 vez (sem retry), mas foi chamado "
            f"{service.provider.send.call_count} vezes"
        )
        # time.sleep NÃO deve ser chamado para erros não-retryable
        mock_sleep.assert_not_called()

    @given(
        error_type=st.sampled_from([
            RequestException("Connection failed"),
            ConnectionError("Network unreachable"),
            ReadTimeout("Read timed out"),
        ])
    )
    @h_settings(max_examples=100)
    @patch("time.sleep")
    def test_network_errors_are_retried(self, mock_sleep, error_type):
        """
        Para erros de rede (RequestException, ConnectionError, ReadTimeout),
        _send_with_retry DEVE chamar send() exatamente 2 vezes e retornar False.

        **Validates: Requirements 8.1, 8.5**
        """
        service = _build_email_service_with_mock_provider()
        service.provider.send.side_effect = error_type

        result = service._send_with_retry(
            to="dest@test.com",
            subject="Test Subject",
            html="<p>Test</p>",
            max_retries=2,
        )

        assert result is False, (
            f"_send_with_retry deve retornar False após esgotar tentativas "
            f"para erro de rede: {type(error_type).__name__}"
        )
        assert service.provider.send.call_count == 2, (
            f"Para erro de rede ({type(error_type).__name__}), send() deve ser "
            f"chamado exatamente 2 vezes (max_retries=2), mas foi chamado "
            f"{service.provider.send.call_count} vezes"
        )

    @given(status_code=retryable_status_codes)
    @h_settings(max_examples=100)
    @patch("time.sleep")
    def test_retryable_errors_return_false_after_exhaustion(
        self, mock_sleep, status_code: int
    ):
        """
        Após esgotar todas as tentativas com erros retryable,
        _send_with_retry DEVE retornar False.

        **Validates: Requirements 8.5**
        """
        service = _build_email_service_with_mock_provider()
        service.provider.send.side_effect = EmailJSHTTPError(
            status_code=status_code, detail="Transient error"
        )

        result = service._send_with_retry(
            to="dest@test.com",
            subject="Test Subject",
            html="<p>Test</p>",
            max_retries=2,
        )

        assert result is False, (
            "Deve retornar False após esgotar todas as tentativas"
        )

    @given(status_code=retryable_status_codes)
    @h_settings(max_examples=100)
    @patch("time.sleep")
    def test_retryable_errors_sleep_between_attempts(
        self, mock_sleep, status_code: int
    ):
        """
        Para erros retryable, _send_with_retry DEVE chamar time.sleep(1)
        entre tentativas (1 vez para max_retries=2).

        **Validates: Requirements 8.1**
        """
        service = _build_email_service_with_mock_provider()
        service.provider.send.side_effect = EmailJSHTTPError(
            status_code=status_code, detail="Transient error"
        )

        service._send_with_retry(
            to="dest@test.com",
            subject="Test Subject",
            html="<p>Test</p>",
            max_retries=2,
        )

        # Com max_retries=2, sleep deve ser chamado 1 vez (entre tentativa 1 e 2)
        mock_sleep.assert_called_once_with(1)


# --- Hypothesis Strategies for Property 10 ---

# Nomes de provedores válidos (após normalização: strip + lower)
VALID_PROVIDERS = ("emailjs", "resend", "sendgrid", "brevo")

# Gera strings que NÃO são nomes de provedores válidos após normalização
# Exclui strings vazias (que resultam em fallback para 'emailjs')
invalid_providers = st.text(min_size=1, max_size=50).filter(
    lambda s: s.strip().lower() not in VALID_PROVIDERS and s.strip() != ""
)


# --- Property 10: Invalid provider names are rejected ---


# Feature: emailjs-provider, Property 10: Invalid provider names are rejected
class TestInvalidProviderNamesAreRejected:
    """
    Property 10: Invalid provider names are rejected.

    For any string that, after stripping whitespace and converting to lowercase,
    is NOT one of 'emailjs', 'resend', 'sendgrid', or 'brevo', the
    EmailService._get_provider() method SHALL raise ImproperlyConfigured with
    a message listing available providers.

    **Validates: Requirements 4.4, 6.3**
    """

    @given(provider_name=invalid_providers)
    @h_settings(max_examples=100)
    def test_invalid_provider_raises_improperly_configured(
        self, provider_name: str
    ):
        """
        Para qualquer string que, após strip e lower, NÃO seja um provedor
        válido, o EmailService DEVE lançar ImproperlyConfigured com mensagem
        listando provedores disponíveis.

        **Validates: Requirements 4.4, 6.3**
        """
        from django.core.exceptions import ImproperlyConfigured
        from signage.services.email_service import EmailService

        # Mock Django settings para configurar o provedor inválido
        mock_settings = MagicMock()
        mock_settings.EMAIL_PROVIDER = provider_name
        mock_settings.EMAIL_FROM_ADDRESS = "test@example.com"
        mock_settings.DEBUG = False
        # Configurar EMAIL_API_KEY para que a validação de config não falhe
        # por falta de API key antes de checar o provedor
        mock_settings.EMAIL_API_KEY = "fake_api_key_for_test"

        with patch(
            "signage.services.email_service.settings", mock_settings
        ):
            with pytest.raises(ImproperlyConfigured) as exc_info:
                EmailService()

            # Verifica que a mensagem lista os provedores disponíveis
            error_message = str(exc_info.value)
            for valid_provider in VALID_PROVIDERS:
                assert valid_provider in error_message, (
                    f"Mensagem de erro deve listar o provedor '{valid_provider}'. "
                    f"Mensagem recebida: '{error_message}'"
                )


# --- Hypothesis Strategies for Property 11 ---

# Bitmask para decidir quais variáveis EmailJS estão vazias (1-15 garante ao menos uma vazia)
emailjs_var_mask = st.integers(min_value=1, max_value=15)

# Valores válidos para variáveis EmailJS (não-vazios, não-whitespace)
valid_emailjs_values = st.text(min_size=3, max_size=30).filter(lambda s: s.strip())

# Valores inválidos para variáveis EmailJS (vazios ou apenas whitespace)
invalid_emailjs_values = st.one_of(
    st.just(""),
    st.text(alphabet=" \t\n\r", min_size=1, max_size=10),
)

# E-mail válido para EMAIL_FROM_ADDRESS (para não falhar na validação de e-mail primeiro)
valid_from_email = st.from_regex(
    r"[a-z]{3,10}@[a-z]{3,8}\.[a-z]{2,4}", fullmatch=True
)

# Nomes das 4 variáveis EmailJS obrigatórias
EMAILJS_VARS = [
    "EMAILJS_SERVICE_ID",
    "EMAILJS_USER_ID",
    "EMAILJS_TEMPLATE_CREDENTIALS_ID",
    "EMAILJS_TEMPLATE_RESET_ID",
]


def _build_mock_settings(mask: int, valid_values: list, invalid_value: str, from_email: str, debug: bool):
    """
    Constrói um MagicMock de settings com base no bitmask.

    Cada bit do mask (0-3) corresponde a uma variável EmailJS.
    Se o bit estiver setado (1), a variável recebe um valor inválido (vazio/whitespace).
    Se o bit estiver limpo (0), a variável recebe um valor válido.
    """
    mock_settings = MagicMock()
    mock_settings.EMAIL_PROVIDER = "emailjs"
    mock_settings.EMAIL_FROM_ADDRESS = from_email
    mock_settings.DEBUG = debug

    for i, var_name in enumerate(EMAILJS_VARS):
        if mask & (1 << i):
            # Bit setado = variável inválida
            setattr(mock_settings, var_name, invalid_value)
        else:
            # Bit limpo = variável válida
            setattr(mock_settings, var_name, valid_values[i])

    return mock_settings


# --- Property 11: Missing EmailJS configuration is detected ---


# Feature: emailjs-provider, Property 11: Missing EmailJS configuration is detected
class TestMissingEmailJSConfigurationDetected:
    """
    Property 11: Missing EmailJS configuration is detected.

    For any subset of the required EmailJS variables (EMAILJS_SERVICE_ID,
    EMAILJS_USER_ID, EMAILJS_TEMPLATE_CREDENTIALS_ID, EMAILJS_TEMPLATE_RESET_ID)
    that is empty or undefined when EMAIL_PROVIDER='emailjs':
    - The EmailService SHALL raise ImproperlyConfigured when DEBUG=False
    - The EmailService SHALL set _skip_sending=True when DEBUG=True

    **Validates: Requirements 5.5, 5.6**
    """

    @given(
        mask=emailjs_var_mask,
        valid_val_1=valid_emailjs_values,
        valid_val_2=valid_emailjs_values,
        valid_val_3=valid_emailjs_values,
        valid_val_4=valid_emailjs_values,
        invalid_val=invalid_emailjs_values,
        from_email=valid_from_email,
    )
    @h_settings(max_examples=100)
    def test_raises_improperly_configured_when_debug_false(
        self,
        mask: int,
        valid_val_1: str,
        valid_val_2: str,
        valid_val_3: str,
        valid_val_4: str,
        invalid_val: str,
        from_email: str,
    ):
        """
        Quando DEBUG=False e ao menos uma variável EmailJS está ausente/vazia,
        EmailService.__init__ DEVE lançar ImproperlyConfigured.

        **Validates: Requirements 5.5**
        """
        from django.core.exceptions import ImproperlyConfigured
        from signage.services.email_service import EmailService

        valid_values = [valid_val_1, valid_val_2, valid_val_3, valid_val_4]
        mock_settings = _build_mock_settings(
            mask, valid_values, invalid_val, from_email, debug=False
        )

        with patch("signage.services.email_service.settings", mock_settings):
            with pytest.raises(ImproperlyConfigured):
                EmailService()

    @given(
        mask=emailjs_var_mask,
        valid_val_1=valid_emailjs_values,
        valid_val_2=valid_emailjs_values,
        valid_val_3=valid_emailjs_values,
        valid_val_4=valid_emailjs_values,
        invalid_val=invalid_emailjs_values,
        from_email=valid_from_email,
    )
    @h_settings(max_examples=100)
    def test_sets_skip_sending_when_debug_true(
        self,
        mask: int,
        valid_val_1: str,
        valid_val_2: str,
        valid_val_3: str,
        valid_val_4: str,
        invalid_val: str,
        from_email: str,
    ):
        """
        Quando DEBUG=True e ao menos uma variável EmailJS está ausente/vazia,
        EmailService.__init__ DEVE definir _skip_sending=True sem lançar exceção.

        **Validates: Requirements 5.6**
        """
        from signage.services.email_service import EmailService

        valid_values = [valid_val_1, valid_val_2, valid_val_3, valid_val_4]
        mock_settings = _build_mock_settings(
            mask, valid_values, invalid_val, from_email, debug=True
        )

        with patch("signage.services.email_service.settings", mock_settings):
            service = EmailService()
            assert service._skip_sending is True, (
                f"_skip_sending deve ser True quando DEBUG=True e variáveis "
                f"EmailJS estão ausentes (mask={mask}, invalid='{invalid_val}')"
            )

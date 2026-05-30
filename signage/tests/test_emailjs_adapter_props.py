"""
Property-based tests for EmailJSAdapter.

# Feature: emailjs-provider, Property 1: Constructor rejects invalid parameters
# Feature: emailjs-provider, Property 8: Explicit template_params bypasses extraction
# Feature: emailjs-provider, Property 9: HTML fallback respects truncation limit

Validates: Requirements 1.1, 2.1, 3.4, 3.5

This module tests:
- Property 1: Constructor validation (invalid params raise ValueError, valid params don't)
- Property 8: When a non-empty template_params dictionary is provided to
  _build_template_params(), the adapter uses it directly without HTML extraction.
- Property 9: HTML fallback respects truncation limit (max 50,000 chars).
"""

import logging

import pytest
from hypothesis import given, settings as h_settings
from hypothesis import strategies as st

from django.test import SimpleTestCase

from signage.services.email_adapters import EmailJSAdapter


# --- Hypothesis Strategies ---

# Strings válidas: não-vazias e não apenas whitespace
non_empty_strings = st.text(min_size=1, max_size=50).filter(lambda s: s.strip())

# Strings inválidas: vazias ou apenas whitespace
invalid_strings = st.one_of(
    st.just(""),
    st.text(alphabet=" \t\n\r", min_size=1, max_size=20),
)

# Generate non-empty dictionaries with string keys and values
template_params_strategy = st.dictionaries(
    keys=st.text(min_size=1, max_size=20).filter(lambda s: s.strip()),
    values=st.text(min_size=0, max_size=100),
    min_size=1,
    max_size=10,
)


# --- Property 1: Constructor rejects invalid parameters ---


class TestConstructorRejectsInvalidParameters:
    """
    Property 1: Constructor rejects invalid parameters.

    For any combination of service_id, user_id, template_credentials_id, and
    template_reset_id where at least one is an empty string or contains only
    whitespace characters, the EmailJSAdapter constructor SHALL raise ValueError.
    Also tests that valid (non-empty, non-whitespace) parameters do NOT raise ValueError.

    **Validates: Requirements 1.1, 2.1**
    """

    @given(
        service_id=non_empty_strings,
        user_id=non_empty_strings,
        template_credentials_id=non_empty_strings,
        template_reset_id=non_empty_strings,
    )
    @h_settings(max_examples=100)
    def test_valid_params_do_not_raise(
        self,
        service_id: str,
        user_id: str,
        template_credentials_id: str,
        template_reset_id: str,
    ):
        """Parâmetros válidos (não-vazios, não-whitespace) NÃO devem lançar ValueError."""
        adapter = EmailJSAdapter(
            service_id=service_id,
            user_id=user_id,
            template_credentials_id=template_credentials_id,
            template_reset_id=template_reset_id,
        )
        assert adapter is not None

    @given(
        valid1=non_empty_strings,
        valid2=non_empty_strings,
        valid3=non_empty_strings,
        invalid=invalid_strings,
        position=st.integers(min_value=0, max_value=3),
    )
    @h_settings(max_examples=100)
    def test_any_invalid_param_raises_valueerror(
        self,
        valid1: str,
        valid2: str,
        valid3: str,
        invalid: str,
        position: int,
    ):
        """Se qualquer parâmetro for vazio ou apenas whitespace, DEVE lançar ValueError."""
        params = [valid1, valid2, valid3, valid3]
        params[position] = invalid

        with pytest.raises(ValueError):
            EmailJSAdapter(
                service_id=params[0],
                user_id=params[1],
                template_credentials_id=params[2],
                template_reset_id=params[3],
            )

    @given(
        service_id=invalid_strings,
        user_id=invalid_strings,
        template_credentials_id=invalid_strings,
        template_reset_id=invalid_strings,
    )
    @h_settings(max_examples=100)
    def test_all_invalid_params_raise_valueerror(
        self,
        service_id: str,
        user_id: str,
        template_credentials_id: str,
        template_reset_id: str,
    ):
        """Se TODOS os parâmetros forem inválidos, DEVE lançar ValueError."""
        with pytest.raises(ValueError):
            EmailJSAdapter(
                service_id=service_id,
                user_id=user_id,
                template_credentials_id=template_credentials_id,
                template_reset_id=template_reset_id,
            )


# --- Property 8: Explicit template_params bypasses extraction ---


class TestExplicitTemplateParamsBypassesExtraction(SimpleTestCase):
    """
    Property 8: Explicit template_params bypasses extraction.

    For any non-empty dictionary provided as template_params to the
    _build_template_params() method, the adapter SHALL use that dictionary
    directly in the result (merged with from_addr, to, subject) without
    performing HTML extraction.

    **Validates: Requirements 3.4**
    """

    def setUp(self):
        """Create a valid EmailJSAdapter instance for testing."""
        self.adapter = EmailJSAdapter(
            service_id="service_test123",
            user_id="user_test456",
            template_credentials_id="template_cred_789",
            template_reset_id="template_reset_012",
        )

    @given(
        template_params=template_params_strategy,
        from_addr=st.from_regex(r"[a-z]{3,10}@[a-z]{3,8}\.[a-z]{2,4}", fullmatch=True),
        to=st.from_regex(r"[a-z]{3,10}@[a-z]{3,8}\.[a-z]{2,4}", fullmatch=True),
        subject=st.text(min_size=1, max_size=100),
        html_body=st.text(min_size=0, max_size=500),
        template_id=st.sampled_from(["template_cred_789", "template_reset_012"]),
    )
    @h_settings(max_examples=100)
    def test_explicit_template_params_bypasses_extraction(
        self, template_params, from_addr, to, subject, html_body, template_id
    ):
        """
        When template_params is a non-empty dict, _build_template_params SHALL
        return a dict containing all keys from template_params plus from_addr,
        to, and subject — without performing HTML extraction.

        **Validates: Requirements 3.4**
        """
        result = self.adapter._build_template_params(
            from_addr=from_addr,
            to=to,
            subject=subject,
            html_body=html_body,
            template_params=template_params,
            template_id=template_id,
        )

        # The merge is {**base_params, **template_params}, so template_params
        # values take precedence over base params when keys collide.
        # Base params that are NOT overridden by template_params must be present.
        base_keys = {"from_addr", "to", "subject"}
        for key in base_keys:
            self.assertIn(key, result)
            if key in template_params:
                # template_params overrides base params
                self.assertEqual(result[key], template_params[key])
            else:
                # base param value is preserved
                expected = {"from_addr": from_addr, "to": to, "subject": subject}
                self.assertEqual(result[key], expected[key])

        # All keys from template_params must be present in the result
        for key, value in template_params.items():
            self.assertIn(key, result)
            self.assertEqual(result[key], value)

        # No extraction-specific keys should appear unless they were
        # explicitly provided in template_params (proves extraction was bypassed)
        extraction_keys = {
            "platform_name", "username", "password", "login_url",
            "first_name", "reset_url", "html_content",
        }
        for key in extraction_keys:
            if key not in template_params:
                self.assertNotIn(
                    key,
                    result,
                    f"Key '{key}' should not be in result unless explicitly "
                    f"provided in template_params (extraction was bypassed).",
                )


# --- Property 5: Template selection follows priority rules ---

# Hypothesis Strategies for template selection
credential_subjects = st.text(min_size=1, max_size=100).map(
    lambda s: s + " Credenciais"
)

reset_subjects = st.one_of(
    st.text(min_size=1, max_size=100).map(lambda s: s + " Redefinição"),
    st.text(min_size=1, max_size=100).map(lambda s: s + " Senha"),
)

neutral_subjects = st.text(min_size=1, max_size=100).filter(
    lambda s: "credenciais" not in s.lower()
    and "redefinição" not in s.lower()
    and "senha" not in s.lower()
)

credential_and_reset_subjects = st.one_of(
    st.text(min_size=1, max_size=50).map(
        lambda s: s + " Credenciais Redefinição"
    ),
    st.text(min_size=1, max_size=50).map(
        lambda s: s + " Credenciais Senha"
    ),
    st.text(min_size=1, max_size=50).map(
        lambda s: s + " Senha Credenciais"
    ),
    st.text(min_size=1, max_size=50).map(
        lambda s: "Redefinição " + s + " Credenciais"
    ),
)

# Template IDs conhecidos para testes
TEMPLATE_CREDENTIALS_ID = "tmpl_credentials_test"
TEMPLATE_RESET_ID = "tmpl_reset_test"


def _make_adapter() -> EmailJSAdapter:
    """Cria um EmailJSAdapter com IDs de template conhecidos para testes."""
    return EmailJSAdapter(
        service_id="svc_test",
        user_id="user_test",
        template_credentials_id=TEMPLATE_CREDENTIALS_ID,
        template_reset_id=TEMPLATE_RESET_ID,
    )


class TestTemplateSelectionProperty:
    """
    # Feature: emailjs-provider, Property 5: Template selection follows priority rules

    For any email subject string, the _select_template_id method SHALL return:
    - template_credentials_id if subject contains "Credenciais" (case-insensitive)
    - template_reset_id if subject contains "Redefinição" or "Senha" (case-insensitive)
      but NOT "Credenciais"
    - template_credentials_id (fallback) if subject matches none of the above

    **Validates: Requirements 2.2, 2.3, 2.4, 2.5**
    """

    @given(subject=credential_subjects)
    @h_settings(max_examples=100)
    def test_credential_keyword_selects_credentials_template(self, subject: str):
        """
        Para qualquer subject contendo 'Credenciais' (case-insensitive),
        _select_template_id deve retornar template_credentials_id.

        **Validates: Requirements 2.2**
        """
        adapter = _make_adapter()
        result = adapter._select_template_id(subject)
        assert result == TEMPLATE_CREDENTIALS_ID, (
            f"Expected template_credentials_id for subject containing 'Credenciais', "
            f"got '{result}' for subject='{subject}'"
        )

    @given(subject=reset_subjects)
    @h_settings(max_examples=100)
    def test_reset_keyword_selects_reset_template(self, subject: str):
        """
        Para qualquer subject contendo 'Redefinição' ou 'Senha' (case-insensitive)
        mas NÃO 'Credenciais', _select_template_id deve retornar template_reset_id.

        **Validates: Requirements 2.3**
        """
        from hypothesis import assume

        adapter = _make_adapter()
        # Garantir que o subject NÃO contém 'Credenciais' para testar a regra de reset
        assume("credenciais" not in subject.lower())
        result = adapter._select_template_id(subject)
        assert result == TEMPLATE_RESET_ID, (
            f"Expected template_reset_id for subject with reset keyword, "
            f"got '{result}' for subject='{subject}'"
        )

    @given(subject=neutral_subjects)
    @h_settings(max_examples=100)
    def test_no_keyword_falls_back_to_credentials_template(self, subject: str):
        """
        Para qualquer subject que NÃO contém 'Credenciais', 'Redefinição' nem 'Senha',
        _select_template_id deve retornar template_credentials_id (fallback).

        **Validates: Requirements 2.5**
        """
        adapter = _make_adapter()
        result = adapter._select_template_id(subject)
        assert result == TEMPLATE_CREDENTIALS_ID, (
            f"Expected template_credentials_id as fallback, "
            f"got '{result}' for subject='{subject}'"
        )

    @given(subject=credential_and_reset_subjects)
    @h_settings(max_examples=100)
    def test_credential_takes_priority_over_reset(self, subject: str):
        """
        Para qualquer subject contendo AMBOS 'Credenciais' e 'Senha'/'Redefinição',
        _select_template_id deve retornar template_credentials_id (prioridade).

        **Validates: Requirements 2.4**
        """
        adapter = _make_adapter()
        result = adapter._select_template_id(subject)
        assert result == TEMPLATE_CREDENTIALS_ID, (
            f"Expected template_credentials_id (priority over reset), "
            f"got '{result}' for subject='{subject}'"
        )


# --- Property 9: HTML fallback respects truncation limit ---

# HTML bodies de tamanhos variados (para teste de truncamento)
html_bodies = st.text(min_size=0, max_size=100_000)


# Feature: emailjs-provider, Property 9: HTML fallback respects truncation limit
class TestHTMLFallbackRespectsTrancationLimit:
    """
    Property 9: HTML fallback respects truncation limit.

    Para qualquer HTML body string, quando nenhum template_params é fornecido
    e o subject não corresponde a templates conhecidos (sem "Credenciais",
    "Redefinição" ou "Senha"), o valor de `html_content` nos template_params
    retornados DEVE ter no máximo 50.000 caracteres e DEVE ser igual aos
    primeiros 50.000 caracteres do `html_body` original.

    **Validates: Requirements 3.5**
    """

    @given(
        html_body=html_bodies,
        subject=neutral_subjects,
        from_addr=st.from_regex(
            r"[a-z]{3,10}@[a-z]{3,8}\.[a-z]{2,4}", fullmatch=True
        ),
        to=st.from_regex(
            r"[a-z]{3,10}@[a-z]{3,8}\.[a-z]{2,4}", fullmatch=True
        ),
    )
    @h_settings(max_examples=100)
    def test_html_content_truncated_to_max_length(
        self, html_body: str, subject: str, from_addr: str, to: str
    ):
        """
        html_content no fallback deve ter no máximo 50.000 caracteres
        e ser igual a html_body[:50_000].

        **Validates: Requirements 3.5**
        """
        adapter = EmailJSAdapter(
            service_id="svc_test",
            user_id="uid_test",
            template_credentials_id="tmpl_cred",
            template_reset_id="tmpl_reset",
        )

        # Usa um template_id que NÃO corresponde a nenhum dos IDs armazenados
        # para forçar o caminho de fallback (HTML truncado)
        custom_template_id = "tmpl_unknown_fallback"

        result = adapter._build_template_params(
            from_addr=from_addr,
            to=to,
            subject=subject,
            html_body=html_body,
            template_params=None,
            template_id=custom_template_id,
        )

        # Verifica que html_content está presente no resultado
        assert "html_content" in result, (
            "html_content deve estar presente no fallback"
        )

        # Verifica que html_content tem no máximo 50.000 caracteres
        assert len(result["html_content"]) <= 50_000, (
            f"html_content deve ter no máximo 50.000 chars, "
            f"mas tem {len(result['html_content'])}"
        )

        # Verifica que html_content é igual aos primeiros 50.000 chars do html_body
        assert result["html_content"] == html_body[:50_000], (
            "html_content deve ser igual a html_body[:50_000]"
        )

        # Verifica que os parâmetros base estão presentes e corretos
        assert result["from_addr"] == from_addr
        assert result["to"] == to
        assert result["subject"] == subject


# --- Property 3: HTTP error responses raise exceptions ---

# Feature: emailjs-provider, Property 3: HTTP error responses raise exceptions

# Hypothesis Strategies for HTTP error testing
error_status_codes = st.integers(min_value=400, max_value=599)


class TestHTTPErrorResponsesRaiseExceptions:
    """
    Property 3: HTTP error responses raise exceptions.

    For any HTTP response with status code >= 400, the EmailJSAdapter.send()
    method SHALL raise an EmailJSHTTPError exception containing the status code
    and response detail (first 200 characters).

    **Validates: Requirements 1.4**
    """

    @given(
        status_code=error_status_codes,
        response_text=st.text(min_size=0, max_size=500),
        from_addr=st.from_regex(
            r"[a-z]{3,10}@[a-z]{3,8}\.[a-z]{2,4}", fullmatch=True
        ),
        to=st.from_regex(
            r"[a-z]{3,10}@[a-z]{3,8}\.[a-z]{2,4}", fullmatch=True
        ),
        subject=st.text(min_size=1, max_size=100),
        html_body=st.text(min_size=1, max_size=200),
    )
    @h_settings(max_examples=100)
    def test_http_error_raises_emailjs_http_error(
        self,
        status_code: int,
        response_text: str,
        from_addr: str,
        to: str,
        subject: str,
        html_body: str,
    ):
        """
        Para qualquer resposta HTTP com status >= 400, send() DEVE lançar
        EmailJSHTTPError com o status_code correto e detail com no máximo
        200 caracteres do texto da resposta.

        **Validates: Requirements 1.4**
        """
        from unittest.mock import patch, MagicMock
        from signage.services.email_adapters import EmailJSHTTPError

        adapter = EmailJSAdapter(
            service_id="svc_test",
            user_id="uid_test",
            template_credentials_id="tmpl_cred",
            template_reset_id="tmpl_reset",
        )

        # Create a mock response with the generated status code and text
        mock_response = MagicMock()
        mock_response.status_code = status_code
        mock_response.text = response_text

        with patch("requests.post", return_value=mock_response):
            with pytest.raises(EmailJSHTTPError) as exc_info:
                adapter.send(
                    from_addr=from_addr,
                    to=to,
                    subject=subject,
                    html_body=html_body,
                )

            # Verify the exception's status_code matches the response status code
            assert exc_info.value.status_code == status_code, (
                f"Expected status_code={status_code}, "
                f"got {exc_info.value.status_code}"
            )

            # Verify the exception's detail contains at most 200 characters
            assert len(exc_info.value.detail) <= 200, (
                f"Expected detail to have at most 200 chars, "
                f"got {len(exc_info.value.detail)} chars"
            )

            # Verify the detail is the first 200 characters of response text
            expected_detail = response_text[:200]
            assert exc_info.value.detail == expected_detail, (
                f"Expected detail='{expected_detail}', "
                f"got '{exc_info.value.detail}'"
            )


# --- Property 2: API request is correctly formed ---

# Feature: emailjs-provider, Property 2: API request is correctly formed

valid_emails = st.from_regex(r"[a-z]{3,10}@[a-z]{3,8}\.[a-z]{2,4}", fullmatch=True)


class TestAPIRequestIsCorrectlyFormed:
    """
    Property 2: API request is correctly formed.

    For any valid from_addr, to, subject, and html_body strings, the
    EmailJSAdapter.send() method SHALL issue an HTTP POST to
    https://api.emailjs.com/api/v1.0/email/send with Content-Type: application/json
    header, timeout of 10 seconds, and a JSON payload containing service_id,
    template_id, user_id, and template_params with at minimum the keys
    from_addr, to, and subject.

    **Validates: Requirements 1.2, 1.3, 7.3**
    """

    @given(
        from_addr=valid_emails,
        to=valid_emails,
        subject=st.text(min_size=1, max_size=100),
        html_body=st.text(min_size=0, max_size=500),
    )
    @h_settings(max_examples=100)
    def test_send_issues_correct_post_request(
        self, from_addr: str, to: str, subject: str, html_body: str
    ):
        """
        Para quaisquer from_addr, to, subject e html_body válidos, send() deve
        emitir um POST para a URL correta com headers, timeout e payload corretos.

        **Validates: Requirements 1.2, 1.3, 7.3**
        """
        from unittest.mock import patch, MagicMock

        adapter = EmailJSAdapter(
            service_id="svc_prop2_test",
            user_id="uid_prop2_test",
            template_credentials_id="tmpl_cred_prop2",
            template_reset_id="tmpl_reset_prop2",
        )

        # Mock requests.post para capturar os argumentos da chamada
        mock_response = MagicMock()
        mock_response.status_code = 200

        with patch("requests.post", return_value=mock_response) as mock_post:
            result = adapter.send(
                from_addr=from_addr,
                to=to,
                subject=subject,
                html_body=html_body,
            )

            # Verifica que send() retornou True
            assert result is True

            # Verifica que requests.post foi chamado exatamente uma vez
            mock_post.assert_called_once()

            # Captura os argumentos da chamada
            call_args = mock_post.call_args

            # Verifica a URL
            assert call_args[0][0] == "https://api.emailjs.com/api/v1.0/email/send", (
                f"URL incorreta: {call_args[0][0]}"
            )

            # Verifica o header Content-Type
            headers = call_args[1].get("headers", {})
            assert headers.get("Content-Type") == "application/json", (
                f"Header Content-Type incorreto: {headers}"
            )

            # Verifica o timeout de 10 segundos
            timeout = call_args[1].get("timeout")
            assert timeout == 10, (
                f"Timeout deve ser 10 segundos, mas é {timeout}"
            )

            # Verifica o payload JSON
            payload = call_args[1].get("json", {})

            # Verifica campos obrigatórios no payload
            assert "service_id" in payload, "Payload deve conter 'service_id'"
            assert "template_id" in payload, "Payload deve conter 'template_id'"
            assert "user_id" in payload, "Payload deve conter 'user_id'"
            assert "template_params" in payload, "Payload deve conter 'template_params'"

            # Verifica valores de service_id e user_id
            assert payload["service_id"] == "svc_prop2_test", (
                f"service_id incorreto: {payload['service_id']}"
            )
            assert payload["user_id"] == "uid_prop2_test", (
                f"user_id incorreto: {payload['user_id']}"
            )

            # Verifica que template_params contém as chaves mínimas obrigatórias
            template_params = payload["template_params"]
            assert "from_addr" in template_params, (
                "template_params deve conter 'from_addr'"
            )
            assert "to" in template_params, (
                "template_params deve conter 'to'"
            )
            assert "subject" in template_params, (
                "template_params deve conter 'subject'"
            )

            # Verifica que os valores de from_addr, to e subject estão corretos
            assert template_params["from_addr"] == from_addr, (
                f"from_addr incorreto: {template_params['from_addr']}"
            )
            assert template_params["to"] == to, (
                f"to incorreto: {template_params['to']}"
            )
            assert template_params["subject"] == subject, (
                f"subject incorreto: {template_params['subject']}"
            )


# --- Property 4: Network exceptions propagate ---

# Feature: emailjs-provider, Property 4: Network exceptions propagate


# Generate different types of network exceptions
import requests.exceptions


network_exceptions = st.sampled_from([
    requests.exceptions.ConnectionError("Connection refused"),
    requests.exceptions.Timeout("Request timed out"),
    requests.exceptions.ReadTimeout("Read timed out"),
    requests.exceptions.ConnectTimeout("Connect timed out"),
    requests.exceptions.RequestException("Generic network error"),
])


class TestNetworkExceptionsPropagate:
    """
    Property 4: Network exceptions propagate.

    For any requests.exceptions.RequestException raised during the HTTP call,
    the EmailJSAdapter.send() method SHALL re-raise the original exception
    after logging the error.

    **Validates: Requirements 1.5**
    """

    @given(
        exception=network_exceptions,
        from_addr=st.from_regex(r"[a-z]{3,10}@[a-z]{3,8}\.[a-z]{2,4}", fullmatch=True),
        to=st.from_regex(r"[a-z]{3,10}@[a-z]{3,8}\.[a-z]{2,4}", fullmatch=True),
        subject=st.text(min_size=1, max_size=100),
        html_body=st.text(min_size=0, max_size=500),
    )
    @h_settings(max_examples=100)
    def test_network_exception_is_reraised(
        self,
        exception,
        from_addr: str,
        to: str,
        subject: str,
        html_body: str,
    ):
        """
        Para qualquer RequestException levantada durante o HTTP POST,
        o método send() DEVE relançar a mesma exceção (mesmo tipo e mensagem).

        **Validates: Requirements 1.5**
        """
        from unittest.mock import patch

        adapter = EmailJSAdapter(
            service_id="svc_test",
            user_id="uid_test",
            template_credentials_id="tmpl_cred",
            template_reset_id="tmpl_reset",
        )

        with patch("requests.post", side_effect=exception):
            with pytest.raises(type(exception)) as exc_info:
                adapter.send(
                    from_addr=from_addr,
                    to=to,
                    subject=subject,
                    html_body=html_body,
                )

            # Verifica que o tipo da exceção é preservado
            assert type(exc_info.value) is type(exception), (
                f"Expected exception type {type(exception).__name__}, "
                f"got {type(exc_info.value).__name__}"
            )

            # Verifica que a mensagem da exceção é preservada
            assert str(exc_info.value) == str(exception), (
                f"Expected exception message '{str(exception)}', "
                f"got '{str(exc_info.value)}'"
            )

    @given(
        exception=network_exceptions,
        to=st.from_regex(r"[a-z]{3,10}@[a-z]{3,8}\.[a-z]{2,4}", fullmatch=True),
    )
    @h_settings(max_examples=100)
    def test_network_exception_is_logged_before_reraise(
        self,
        exception,
        to: str,
    ):
        """
        Para qualquer RequestException, o método send() DEVE registrar o erro
        no logger (incluindo destinatário e descrição do erro) antes de relançar.

        **Validates: Requirements 1.5**
        """
        import logging
        from unittest.mock import patch

        adapter = EmailJSAdapter(
            service_id="svc_test",
            user_id="uid_test",
            template_credentials_id="tmpl_cred",
            template_reset_id="tmpl_reset",
        )

        with patch("requests.post", side_effect=exception):
            with patch(
                "signage.services.email_adapters.logger"
            ) as mock_logger:
                with pytest.raises(type(exception)):
                    adapter.send(
                        from_addr="sender@test.com",
                        to=to,
                        subject="Test Subject",
                        html_body="<p>Test</p>",
                    )

                # Verifica que logger.error foi chamado
                mock_logger.error.assert_called_once()

                # Verifica que a chamada ao logger contém o destinatário
                call_args = mock_logger.error.call_args
                log_message = call_args[0][0] % call_args[0][1:]
                assert to in log_message, (
                    f"Log message should contain recipient '{to}', "
                    f"got: '{log_message}'"
                )


# --- Property 6: Variable extraction round-trip ---
# Feature: emailjs-provider, Property 6: Variable extraction round-trip


# Hypothesis Strategies para round-trip de extração de variáveis
# Strings sem caracteres especiais HTML para garantir round-trip limpo
safe_text = st.text(
    alphabet=st.characters(blacklist_characters='<>"&\n\r'),
    min_size=1,
    max_size=50,
).filter(lambda s: s.strip())

# URLs sem caracteres especiais
safe_urls = st.from_regex(
    r"https://[a-z]{3,10}\.[a-z]{2,4}/[a-z0-9/]{1,30}", fullmatch=True
)


class TestVariableExtractionRoundTrip:
    """
    # Feature: emailjs-provider, Property 6: Variable extraction round-trip

    For any valid platform_name, username, password, login_url (credentials)
    or platform_name, first_name, reset_url (reset) values that do NOT contain
    HTML special characters, rendering those values into the corresponding email
    template structure and then extracting them via the adapter's extraction
    methods SHALL produce the original values.

    **Validates: Requirements 3.1, 3.2**
    """

    @given(
        platform_name=safe_text,
        username=safe_text,
        password=safe_text,
        login_url=safe_urls,
    )
    @h_settings(max_examples=100)
    def test_credentials_extraction_round_trip(
        self,
        platform_name: str,
        username: str,
        password: str,
        login_url: str,
    ):
        """
        Para quaisquer valores válidos de platform_name, username, password e
        login_url (sem caracteres HTML especiais), renderizar esses valores em
        uma estrutura HTML de credenciais e extraí-los via _extract_credentials_params
        DEVE produzir os valores originais.

        **Validates: Requirements 3.1**
        """
        adapter = _make_adapter()

        # Construir HTML que corresponde aos padrões regex do adapter
        html_body = (
            f'<strong>{platform_name}</strong> foi criada '
            f'Usuário</p>\n<p class="value">{username}</p> '
            f'Senha</p>\n<p class="value">{password}</p> '
            f'<a href="{login_url}" class="btn">Acessar</a></td></tr></table>'
            f'</td></tr></table>'
        )

        result = adapter._extract_credentials_params(html_body)

        assert result["platform_name"] == platform_name, (
            f"Expected platform_name='{platform_name}', got '{result['platform_name']}'"
        )
        assert result["username"] == username, (
            f"Expected username='{username}', got '{result['username']}'"
        )
        assert result["password"] == password, (
            f"Expected password='{password}', got '{result['password']}'"
        )
        assert result["login_url"] == login_url, (
            f"Expected login_url='{login_url}', got '{result['login_url']}'"
        )

    @given(
        platform_name=safe_text,
        first_name=safe_text,
        reset_url=safe_urls,
    )
    @h_settings(max_examples=100)
    def test_reset_extraction_round_trip(
        self,
        platform_name: str,
        first_name: str,
        reset_url: str,
    ):
        """
        Para quaisquer valores válidos de platform_name, first_name e reset_url
        (sem caracteres HTML especiais), renderizar esses valores em uma estrutura
        HTML de redefinição de senha e extraí-los via _extract_reset_params DEVE
        produzir os valores originais.

        **Validates: Requirements 3.2**
        """
        adapter = _make_adapter()

        # Construir HTML que corresponde aos padrões regex do adapter
        html_body = (
            f'<h1 class="title">{platform_name}</h1> '
            f'Olá, <strong>{first_name}</strong> '
            f'<a href="{reset_url}" class="btn"> Redefinir Senha </a>'
        )

        result = adapter._extract_reset_params(html_body)

        assert result["platform_name"] == platform_name, (
            f"Expected platform_name='{platform_name}', got '{result['platform_name']}'"
        )
        assert result["first_name"] == first_name, (
            f"Expected first_name='{first_name}', got '{result['first_name']}'"
        )
        assert result["reset_url"] == reset_url, (
            f"Expected reset_url='{reset_url}', got '{result['reset_url']}'"
        )


# --- Property 7: Failed extraction produces empty strings with warnings ---

# Feature: emailjs-provider, Property 7: Failed extraction produces empty strings with warnings

# Random HTML that won't match extraction patterns
random_html_no_credentials = st.text(min_size=0, max_size=500).filter(
    lambda s: '<strong>' not in s
    and 'Usuário</p>' not in s
    and 'Senha</p>' not in s
    and 'foi criada' not in s
)

random_html_no_reset = st.text(min_size=0, max_size=500).filter(
    lambda s: '<h1' not in s
    and 'Olá,' not in s
    and 'Redefinir Senha' not in s
)

# Combined: HTML that won't match either pattern
random_html_no_match = st.text(min_size=0, max_size=500).filter(
    lambda s: '<strong>' not in s
    and 'Usuário</p>' not in s
    and 'Senha</p>' not in s
    and 'foi criada' not in s
    and '<h1' not in s
    and 'Olá,' not in s
    and 'Redefinir Senha' not in s
)


class LogCapture:
    """
    Context manager para capturar mensagens de log de um logger específico.

    Uso:
        with LogCapture("signage.services.email_adapters", level=logging.WARNING) as cap:
            # código que gera logs
        assert len(cap.warnings) == 4
    """

    def __init__(self, logger_name: str, level: int = logging.WARNING):
        import logging as _logging

        self.logger_name = logger_name
        self.level = level
        self.warnings: list[str] = []
        self._handler = None
        self._logger = None

    def __enter__(self):
        import logging as _logging

        self._logger = _logging.getLogger(self.logger_name)
        self._handler = _CaptureHandler(self)
        self._handler.setLevel(self.level)
        self._logger.addHandler(self._handler)
        # Ensure the logger level allows our messages through
        self._original_level = self._logger.level
        if self._logger.level > self.level:
            self._logger.setLevel(self.level)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._handler and self._logger:
            self._logger.removeHandler(self._handler)
            self._logger.setLevel(self._original_level)
        return False


class _CaptureHandler(logging.Handler):
    """Handler que captura mensagens de log em uma lista."""

    def __init__(self, capture: LogCapture):
        super().__init__()
        self.capture = capture

    def emit(self, record):
        import logging as _logging

        if record.levelno >= _logging.WARNING:
            self.capture.warnings.append(self.format(record))


class TestFailedExtractionProducesEmptyStringsWithWarnings:
    """
    # Feature: emailjs-provider, Property 7: Failed extraction produces empty strings with warnings

    For any HTML body that does NOT match the expected template structure,
    the extraction methods SHALL return a dictionary containing all expected
    keys with empty string values, and SHALL log a warning for each missing
    variable.

    **Validates: Requirements 3.3**
    """

    def _make_adapter(self) -> EmailJSAdapter:
        """Cria um EmailJSAdapter válido para testes."""
        return EmailJSAdapter(
            service_id="svc_prop7_test",
            user_id="uid_prop7_test",
            template_credentials_id="tmpl_cred_prop7",
            template_reset_id="tmpl_reset_prop7",
        )

    @given(html_body=random_html_no_credentials)
    @h_settings(max_examples=100)
    def test_credentials_extraction_returns_empty_strings_for_non_matching_html(
        self, html_body: str
    ):
        """
        Para qualquer HTML que NÃO corresponde à estrutura do template de
        credenciais, _extract_credentials_params DEVE retornar um dicionário
        com as chaves platform_name, username, password e login_url, todas
        com valores de string vazia.

        **Validates: Requirements 3.3**
        """
        import logging

        adapter = self._make_adapter()

        # Use logging capture to verify warnings
        with LogCapture(
            "signage.services.email_adapters", level=logging.WARNING
        ) as log_capture:
            result = adapter._extract_credentials_params(html_body)

        # Verify all expected keys are present
        expected_keys = {"platform_name", "username", "password", "login_url"}
        assert set(result.keys()) == expected_keys, (
            f"Expected keys {expected_keys}, got {set(result.keys())}"
        )

        # Verify all values are empty strings
        for key in expected_keys:
            assert result[key] == "", (
                f"Expected empty string for key '{key}', got '{result[key]}'"
            )

        # Verify that 4 warnings were logged (one per missing variable)
        assert len(log_capture.warnings) == 4, (
            f"Expected 4 warnings for credentials extraction, "
            f"got {len(log_capture.warnings)}"
        )

    @given(html_body=random_html_no_reset)
    @h_settings(max_examples=100)
    def test_reset_extraction_returns_empty_strings_for_non_matching_html(
        self, html_body: str
    ):
        """
        Para qualquer HTML que NÃO corresponde à estrutura do template de
        redefinição, _extract_reset_params DEVE retornar um dicionário com
        as chaves platform_name, first_name e reset_url, todas com valores
        de string vazia.

        **Validates: Requirements 3.3**
        """
        import logging

        adapter = self._make_adapter()

        with LogCapture(
            "signage.services.email_adapters", level=logging.WARNING
        ) as log_capture:
            result = adapter._extract_reset_params(html_body)

        # Verify all expected keys are present
        expected_keys = {"platform_name", "first_name", "reset_url"}
        assert set(result.keys()) == expected_keys, (
            f"Expected keys {expected_keys}, got {set(result.keys())}"
        )

        # Verify all values are empty strings
        for key in expected_keys:
            assert result[key] == "", (
                f"Expected empty string for key '{key}', got '{result[key]}'"
            )

        # Verify that 3 warnings were logged (one per missing variable)
        assert len(log_capture.warnings) == 3, (
            f"Expected 3 warnings for reset extraction, "
            f"got {len(log_capture.warnings)}"
        )

    @given(html_body=random_html_no_match)
    @h_settings(max_examples=100)
    def test_both_extractions_produce_empty_strings_and_log_warnings(
        self, html_body: str
    ):
        """
        Para qualquer HTML que NÃO corresponde a NENHUM template, ambos os
        métodos de extração DEVEM retornar dicionários com todas as chaves
        esperadas como strings vazias e registrar warnings para cada variável.

        **Validates: Requirements 3.3**
        """
        import logging

        adapter = self._make_adapter()

        # Test credentials extraction
        with LogCapture(
            "signage.services.email_adapters", level=logging.WARNING
        ) as cred_log:
            cred_result = adapter._extract_credentials_params(html_body)

        # Test reset extraction
        with LogCapture(
            "signage.services.email_adapters", level=logging.WARNING
        ) as reset_log:
            reset_result = adapter._extract_reset_params(html_body)

        # Credentials: all 4 keys must be empty strings
        cred_keys = {"platform_name", "username", "password", "login_url"}
        assert set(cred_result.keys()) == cred_keys
        for key in cred_keys:
            assert cred_result[key] == ""

        # Reset: all 3 keys must be empty strings
        reset_keys = {"platform_name", "first_name", "reset_url"}
        assert set(reset_result.keys()) == reset_keys
        for key in reset_keys:
            assert reset_result[key] == ""

        # Verify warning counts
        assert len(cred_log.warnings) == 4, (
            f"Expected 4 credential warnings, got {len(cred_log.warnings)}"
        )
        assert len(reset_log.warnings) == 3, (
            f"Expected 3 reset warnings, got {len(reset_log.warnings)}"
        )


# --- Property 12: Thread-safe concurrent execution ---

# Feature: emailjs-provider, Property 12: Thread-safe concurrent execution

import threading
from unittest.mock import patch, MagicMock


# Generate a list of unique email parameters for concurrent calls
thread_params_strategy = st.lists(
    st.tuples(
        st.from_regex(r"[a-z]{3,10}@[a-z]{3,8}\.[a-z]{2,4}", fullmatch=True),  # from_addr
        st.from_regex(r"[a-z]{3,10}@[a-z]{3,8}\.[a-z]{2,4}", fullmatch=True),  # to
        st.text(min_size=1, max_size=50),  # subject
        st.text(min_size=1, max_size=100),  # html_body
    ),
    min_size=3,
    max_size=8,
)


class TestThreadSafeConcurrentExecution:
    """
    Property 12: Thread-safe concurrent execution.

    For any set of concurrent send() invocations from multiple threads with
    different parameters, each invocation SHALL produce results independent of
    other concurrent invocations — no shared mutable state SHALL cause one
    invocation's parameters to appear in another's payload.

    **Validates: Requirements 7.1, 7.2, 7.5**
    """

    @given(params_list=thread_params_strategy)
    @h_settings(max_examples=100)
    def test_concurrent_sends_produce_independent_payloads(
        self, params_list: list
    ):
        """
        Para qualquer conjunto de invocações concorrentes de send() com
        parâmetros diferentes, cada invocação DEVE produzir resultados
        independentes — nenhum estado mutável compartilhado DEVE causar
        que os parâmetros de uma invocação apareçam no payload de outra.

        **Validates: Requirements 7.1, 7.2, 7.5**
        """
        adapter = EmailJSAdapter(
            service_id="svc_thread_test",
            user_id="uid_thread_test",
            template_credentials_id="tmpl_cred_thread",
            template_reset_id="tmpl_reset_thread",
        )

        # Thread-safe list to collect payloads from each call
        captured_payloads = []
        payload_lock = threading.Lock()

        # Mock response that returns 200
        def mock_post(*args, **kwargs):
            # Capture the json payload in a thread-safe manner
            payload = kwargs.get("json", {})
            with payload_lock:
                captured_payloads.append(payload)
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            return mock_resp

        # Use a barrier to ensure all threads start concurrently
        num_threads = len(params_list)
        barrier = threading.Barrier(num_threads)
        errors = []

        def thread_target(from_addr, to, subject, html_body):
            try:
                barrier.wait(timeout=5)
                adapter.send(
                    from_addr=from_addr,
                    to=to,
                    subject=subject,
                    html_body=html_body,
                )
            except Exception as e:
                with payload_lock:
                    errors.append(e)

        with patch("requests.post", side_effect=mock_post):
            threads = []
            for from_addr, to, subject, html_body in params_list:
                t = threading.Thread(
                    target=thread_target,
                    args=(from_addr, to, subject, html_body),
                )
                threads.append(t)

            # Start all threads
            for t in threads:
                t.start()

            # Wait for all threads to complete
            for t in threads:
                t.join(timeout=10)

        # No errors should have occurred
        assert not errors, f"Threads raised errors: {errors}"

        # We should have captured exactly one payload per thread
        assert len(captured_payloads) == num_threads, (
            f"Expected {num_threads} payloads, got {len(captured_payloads)}"
        )

        # Verify each payload contains the correct parameters for its call
        # and no cross-contamination occurred
        expected_tos = {to for _, to, _, _ in params_list}
        expected_froms = {from_addr for from_addr, _, _, _ in params_list}

        # Collect all (from_addr, to) pairs from captured payloads
        captured_pairs = set()
        for payload in captured_payloads:
            tp = payload.get("template_params", {})
            captured_from = tp.get("from_addr")
            captured_to = tp.get("to")
            captured_pairs.add((captured_from, captured_to))

        # Each captured pair must correspond to one of the original param sets
        original_pairs = {(from_addr, to) for from_addr, to, _, _ in params_list}
        for captured_pair in captured_pairs:
            assert captured_pair in original_pairs, (
                f"Captured payload pair {captured_pair} does not match any "
                f"original parameter set. Cross-contamination detected! "
                f"Original pairs: {original_pairs}"
            )

        # Verify that each payload's template_params has consistent from/to/subject
        # (i.e., the from_addr and to in a single payload belong to the same call)
        for payload in captured_payloads:
            tp = payload.get("template_params", {})
            payload_from = tp.get("from_addr")
            payload_to = tp.get("to")
            payload_subject = tp.get("subject")

            # Find the matching original params
            matching = [
                (f, t, s, h)
                for f, t, s, h in params_list
                if f == payload_from and t == payload_to
            ]
            assert len(matching) >= 1, (
                f"No matching original params for payload with "
                f"from_addr='{payload_from}', to='{payload_to}'. "
                f"Cross-contamination detected!"
            )

            # Verify subject matches one of the matching entries
            matching_subjects = {s for _, _, s, _ in matching}
            assert payload_subject in matching_subjects, (
                f"Payload subject '{payload_subject}' does not match expected "
                f"subjects {matching_subjects} for from='{payload_from}', "
                f"to='{payload_to}'. Cross-contamination detected!"
            )

        # Additional check: verify service_id and user_id are consistent
        for payload in captured_payloads:
            assert payload.get("service_id") == "svc_thread_test", (
                f"service_id mismatch: {payload.get('service_id')}"
            )
            assert payload.get("user_id") == "uid_thread_test", (
                f"user_id mismatch: {payload.get('user_id')}"
            )

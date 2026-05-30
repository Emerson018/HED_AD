"""
Testes unitários para EmailJSAdapter.

Valida o comportamento do adaptador EmailJS com mocks de requests.post,
incluindo seleção de template, timeout, logging e tratamento de erros.

Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 2.2, 2.3, 7.3
"""

import logging
from unittest.mock import MagicMock, patch

import pytest

from signage.services.email_adapters import EmailJSAdapter, EmailJSHTTPError


# --- Fixtures ---


@pytest.fixture
def adapter():
    """Cria instância do EmailJSAdapter com parâmetros de teste."""
    return EmailJSAdapter(
        service_id="svc_test",
        user_id="user_test",
        template_credentials_id="tmpl_cred",
        template_reset_id="tmpl_reset",
    )


@pytest.fixture
def html_credenciais():
    """HTML simulando e-mail de credenciais com variáveis extraíveis."""
    return (
        '<p>Sua conta na plataforma <strong>HED AD</strong> foi criada com sucesso.</p>'
        '<p>Usuário</p>\n<p class="value">admin@hed.com</p>'
        '<p>Senha</p>\n<p class="value">S3nh@Forte!</p>'
        '<a href="https://hed.example.com/login" class="btn">Acessar</a>'
        '</td></tr></table></td></tr></table>'
    )


@pytest.fixture
def html_redefinicao():
    """HTML simulando e-mail de redefinição de senha com variáveis extraíveis."""
    return (
        '<h1 class="title">HED AD</h1>'
        '<p>Olá, <strong>João</strong></p>'
        '<a href="https://hed.example.com/reset/abc123" class="btn"> Redefinir Senha </a>'
    )


# --- Testes de envio de credenciais com template correto ---


class TestEnvioCredenciais:
    """Testa envio de e-mail de credenciais com template correto (mock requests.post)."""

    @patch("requests.post")
    def test_envia_com_template_credenciais_quando_subject_contem_credenciais(
        self, mock_post, adapter, html_credenciais
    ):
        """
        Quando subject contém 'Credenciais', deve usar template_credentials_id.
        Validates: Requirements 1.2, 1.3, 2.2
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        result = adapter.send(
            from_addr="noreply@hed.com",
            to="user@example.com",
            subject="Suas Credenciais de Acesso",
            html_body=html_credenciais,
        )

        assert result is True
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args
        payload = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")

        assert payload["service_id"] == "svc_test"
        assert payload["user_id"] == "user_test"
        assert payload["template_id"] == "tmpl_cred"
        assert "template_params" in payload

    @patch("requests.post")
    def test_payload_contem_campos_obrigatorios_em_template_params(
        self, mock_post, adapter, html_credenciais
    ):
        """
        O payload deve conter from_addr, to e subject em template_params.
        Validates: Requirements 1.3
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        adapter.send(
            from_addr="noreply@hed.com",
            to="user@example.com",
            subject="Credenciais",
            html_body=html_credenciais,
        )

        call_kwargs = mock_post.call_args
        payload = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
        params = payload["template_params"]

        assert params["from_addr"] == "noreply@hed.com"
        assert params["to"] == "user@example.com"
        assert params["subject"] == "Credenciais"


# --- Testes de envio de redefinição com template correto ---


class TestEnvioRedefinicao:
    """Testa envio de e-mail de redefinição com template correto."""

    @patch("requests.post")
    def test_envia_com_template_reset_quando_subject_contem_redefinicao(
        self, mock_post, adapter, html_redefinicao
    ):
        """
        Quando subject contém 'Redefinição', deve usar template_reset_id.
        Validates: Requirements 2.3
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        result = adapter.send(
            from_addr="noreply@hed.com",
            to="user@example.com",
            subject="Redefinição de Senha",
            html_body=html_redefinicao,
        )

        assert result is True
        call_kwargs = mock_post.call_args
        payload = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")

        assert payload["template_id"] == "tmpl_reset"

    @patch("requests.post")
    def test_envia_com_template_reset_quando_subject_contem_senha(
        self, mock_post, adapter, html_redefinicao
    ):
        """
        Quando subject contém 'Senha', deve usar template_reset_id.
        Validates: Requirements 2.3
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        adapter.send(
            from_addr="noreply@hed.com",
            to="user@example.com",
            subject="Recuperar Senha",
            html_body=html_redefinicao,
        )

        call_kwargs = mock_post.call_args
        payload = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")

        assert payload["template_id"] == "tmpl_reset"


# --- Testes de fallback para template_credentials_id ---


class TestFallbackTemplate:
    """Testa fallback para template_credentials_id quando subject não corresponde."""

    @patch("requests.post")
    def test_fallback_para_template_credenciais_quando_subject_nao_corresponde(
        self, mock_post, adapter
    ):
        """
        Quando subject não contém palavras-chave, deve usar template_credentials_id.
        Validates: Requirements 2.2 (fallback)
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        adapter.send(
            from_addr="noreply@hed.com",
            to="user@example.com",
            subject="Notificação Geral",
            html_body="<p>Conteúdo genérico</p>",
        )

        call_kwargs = mock_post.call_args
        payload = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")

        assert payload["template_id"] == "tmpl_cred"

    @patch("requests.post")
    def test_fallback_envia_campos_base_em_template_params(
        self, mock_post, adapter
    ):
        """
        No fallback, template_params deve conter from_addr, to e subject.
        Validates: Requirements 2.2
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        adapter.send(
            from_addr="noreply@hed.com",
            to="user@example.com",
            subject="Aviso Importante",
            html_body="<p>Conteúdo genérico</p>",
        )

        call_kwargs = mock_post.call_args
        payload = call_kwargs.kwargs.get("json") or call_kwargs[1].get("json")
        params = payload["template_params"]

        assert params["from_addr"] == "noreply@hed.com"
        assert params["to"] == "user@example.com"
        assert params["subject"] == "Aviso Importante"


# --- Testes de timeout de 10s ---


class TestTimeout:
    """Testa timeout de 10s (mock com side_effect de timeout)."""

    @patch("requests.post")
    def test_requisicao_usa_timeout_de_10_segundos(self, mock_post, adapter):
        """
        A requisição HTTP deve ser feita com timeout=10.
        Validates: Requirements 7.3
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        adapter.send(
            from_addr="noreply@hed.com",
            to="user@example.com",
            subject="Credenciais",
            html_body="<p>test</p>",
        )

        call_kwargs = mock_post.call_args
        timeout = call_kwargs.kwargs.get("timeout") or call_kwargs[1].get("timeout")
        assert timeout == 10

    @patch("requests.post")
    def test_timeout_lanca_request_exception(self, mock_post, adapter):
        """
        Quando ocorre timeout, deve relançar a exceção de rede.
        Validates: Requirements 1.5, 7.3
        """
        import requests.exceptions

        mock_post.side_effect = requests.exceptions.ReadTimeout("Timeout de leitura")

        with pytest.raises(requests.exceptions.ReadTimeout):
            adapter.send(
                from_addr="noreply@hed.com",
                to="user@example.com",
                subject="Credenciais",
                html_body="<p>test</p>",
            )

    @patch("requests.post")
    def test_connect_timeout_lanca_request_exception(self, mock_post, adapter):
        """
        Quando ocorre timeout de conexão, deve relançar a exceção.
        Validates: Requirements 1.5, 7.3
        """
        import requests.exceptions

        mock_post.side_effect = requests.exceptions.ConnectTimeout(
            "Timeout de conexão"
        )

        with pytest.raises(requests.exceptions.ConnectTimeout):
            adapter.send(
                from_addr="noreply@hed.com",
                to="user@example.com",
                subject="Credenciais",
                html_body="<p>test</p>",
            )


# --- Testes de logging em pt-BR para sucesso e falha ---


class TestLogging:
    """Testa logging em pt-BR para sucesso e falha."""

    @patch("requests.post")
    def test_log_info_em_ptbr_no_sucesso(self, mock_post, adapter, caplog):
        """
        Em caso de sucesso, deve registrar log INFO em pt-BR.
        Validates: Requirements 1.6
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        with caplog.at_level(logging.INFO, logger="signage.services.email_adapters"):
            adapter.send(
                from_addr="noreply@hed.com",
                to="destinatario@example.com",
                subject="Credenciais",
                html_body="<p>test</p>",
            )

        # Verifica que a mensagem de sucesso está em pt-BR
        assert any(
            "Email enviado com sucesso via EmailJS" in record.message
            and "destinatario@example.com" in record.message
            for record in caplog.records
        )

    @patch("requests.post")
    def test_log_error_em_ptbr_para_erro_http(self, mock_post, adapter, caplog):
        """
        Em caso de erro HTTP (>=400), deve registrar log ERROR em pt-BR.
        Validates: Requirements 1.4
        """
        mock_response = MagicMock()
        mock_response.status_code = 422
        mock_response.text = "Unprocessable Entity"
        mock_post.return_value = mock_response

        with caplog.at_level(logging.ERROR, logger="signage.services.email_adapters"):
            with pytest.raises(EmailJSHTTPError):
                adapter.send(
                    from_addr="noreply@hed.com",
                    to="destinatario@example.com",
                    subject="Credenciais",
                    html_body="<p>test</p>",
                )

        assert any(
            "EmailJS API retornou status 422" in record.message
            and "destinatario@example.com" in record.message
            for record in caplog.records
        )

    @patch("requests.post")
    def test_log_error_em_ptbr_para_erro_de_rede(self, mock_post, adapter, caplog):
        """
        Em caso de erro de rede, deve registrar log ERROR em pt-BR.
        Validates: Requirements 1.5
        """
        import requests.exceptions

        mock_post.side_effect = requests.exceptions.ConnectionError(
            "Falha na conexão"
        )

        with caplog.at_level(logging.ERROR, logger="signage.services.email_adapters"):
            with pytest.raises(requests.exceptions.ConnectionError):
                adapter.send(
                    from_addr="noreply@hed.com",
                    to="destinatario@example.com",
                    subject="Credenciais",
                    html_body="<p>test</p>",
                )

        assert any(
            "Falha ao enviar email via EmailJS" in record.message
            and "destinatario@example.com" in record.message
            for record in caplog.records
        )

    @patch("requests.post")
    def test_erro_http_lanca_emailjs_http_error(self, mock_post, adapter):
        """
        Erro HTTP >= 400 deve lançar EmailJSHTTPError com status e detalhe.
        Validates: Requirements 1.4
        """
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_post.return_value = mock_response

        with pytest.raises(EmailJSHTTPError) as exc_info:
            adapter.send(
                from_addr="noreply@hed.com",
                to="user@example.com",
                subject="Credenciais",
                html_body="<p>test</p>",
            )

        assert exc_info.value.status_code == 500
        assert "Internal Server Error" in exc_info.value.detail

    @patch("requests.post")
    def test_requisicao_enviada_para_url_correta(self, mock_post, adapter):
        """
        A requisição deve ser enviada para a URL da API do EmailJS.
        Validates: Requirements 1.2
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        adapter.send(
            from_addr="noreply@hed.com",
            to="user@example.com",
            subject="Credenciais",
            html_body="<p>test</p>",
        )

        call_args = mock_post.call_args
        url = call_args.args[0] if call_args.args else call_args[0][0]
        assert url == "https://api.emailjs.com/api/v1.0/email/send"

    @patch("requests.post")
    def test_header_content_type_json(self, mock_post, adapter):
        """
        A requisição deve incluir header Content-Type: application/json.
        Validates: Requirements 1.2
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        adapter.send(
            from_addr="noreply@hed.com",
            to="user@example.com",
            subject="Credenciais",
            html_body="<p>test</p>",
        )

        call_kwargs = mock_post.call_args
        headers = call_kwargs.kwargs.get("headers") or call_kwargs[1].get("headers")
        assert headers["Content-Type"] == "application/json"

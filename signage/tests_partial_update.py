"""Unit tests for UsuarioViewSet.partial_update action."""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from signage.models import Parceiro, AuditoriaLog

Usuario = get_user_model()


class UsuarioPartialUpdateTest(TestCase):
    """Tests for PATCH /api/usuarios/:id/"""

    def setUp(self):
        # Create admin user
        self.admin = Usuario.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='Admin123!',
            tipo_usuario='ADMIN_HED',
        )
        # Create target parceiro user
        self.parceiro_user = Usuario.objects.create_user(
            username='parceiro1',
            email='parceiro1@test.com',
            password='Parceiro1!',
            tipo_usuario='PARCEIRO',
        )
        self.parceiro = Parceiro.objects.create(
            usuario=self.parceiro_user,
            nome_empresa='Empresa Original',
            cnpj='12345678901234',
            telefone='51999999999',
        )
        # Create another parceiro for uniqueness tests
        self.other_user = Usuario.objects.create_user(
            username='parceiro2',
            email='parceiro2@test.com',
            password='Parceiro2!',
            tipo_usuario='PARCEIRO',
        )
        self.other_parceiro = Parceiro.objects.create(
            usuario=self.other_user,
            nome_empresa='Outra Empresa',
            cnpj='99999999999999',
            telefone='51888888888',
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
        self.url = f'/api/usuarios/{self.parceiro_user.id}/'

    def test_successful_update_all_fields(self):
        """Should update email, nome_empresa, cnpj, telefone."""
        payload = {
            'email': 'newemail@test.com',
            'nome_empresa': 'Nova Empresa',
            'cnpj': '11111111111111',
            'telefone': '51777777777',
        }
        response = self.client.patch(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.parceiro_user.refresh_from_db()
        self.parceiro.refresh_from_db()
        self.assertEqual(self.parceiro_user.email, 'newemail@test.com')
        self.assertEqual(self.parceiro.nome_empresa, 'Nova Empresa')
        self.assertEqual(self.parceiro.cnpj, '11111111111111')
        self.assertEqual(self.parceiro.telefone, '51777777777')

    def test_password_update(self):
        """Should update password when provided."""
        payload = {
            'email': 'parceiro1@test.com',
            'password': 'NewPass1!',
            'nome_empresa': 'Empresa Original',
            'cnpj': '12345678901234',
            'telefone': '51999999999',
        }
        response = self.client.patch(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.parceiro_user.refresh_from_db()
        self.assertTrue(self.parceiro_user.check_password('NewPass1!'))

    def test_empty_password_keeps_current(self):
        """Should keep current password when password is empty."""
        payload = {
            'email': 'parceiro1@test.com',
            'password': '',
            'nome_empresa': 'Empresa Original',
            'cnpj': '12345678901234',
            'telefone': '51999999999',
        }
        response = self.client.patch(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.parceiro_user.refresh_from_db()
        self.assertTrue(self.parceiro_user.check_password('Parceiro1!'))

    def test_duplicate_email_returns_400(self):
        """Should return 400 if email belongs to another user."""
        payload = {
            'email': 'parceiro2@test.com',  # belongs to other_user
            'nome_empresa': 'Empresa Original',
            'cnpj': '12345678901234',
            'telefone': '51999999999',
        }
        response = self.client.patch(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data['field_errors'])

    def test_duplicate_cnpj_returns_400(self):
        """Should return 400 if CNPJ belongs to another parceiro."""
        payload = {
            'email': 'parceiro1@test.com',
            'nome_empresa': 'Empresa Original',
            'cnpj': '99999999999999',  # belongs to other_parceiro
            'telefone': '51999999999',
        }
        response = self.client.patch(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cnpj', response.data['field_errors'])

    def test_own_email_and_cnpj_allowed(self):
        """Should allow keeping own email and CNPJ."""
        payload = {
            'email': 'parceiro1@test.com',
            'nome_empresa': 'Empresa Atualizada',
            'cnpj': '12345678901234',
            'telefone': '51999999999',
        }
        response = self.client.patch(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_audit_log_created(self):
        """Should create AuditoriaLog with EDICAO_USUARIO action."""
        initial_count = AuditoriaLog.objects.filter(acao='EDICAO_USUARIO').count()
        payload = {
            'email': 'changed@test.com',
            'nome_empresa': 'Empresa Mudada',
            'cnpj': '12345678901234',
            'telefone': '51999999999',
        }
        response = self.client.patch(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        logs = AuditoriaLog.objects.filter(acao='EDICAO_USUARIO')
        self.assertEqual(logs.count(), initial_count + 1)

        log = logs.latest('criado_em')
        self.assertEqual(log.usuario, self.admin)
        self.assertEqual(log.usuario_str, self.admin.username)
        self.assertIn('email', log.descricao)
        self.assertIn('nome_empresa', log.descricao)

    def test_audit_log_lists_changed_fields(self):
        """Audit log description should list only changed fields."""
        payload = {
            'email': 'parceiro1@test.com',  # same
            'nome_empresa': 'Empresa Original',  # same
            'cnpj': '00000000000000',  # changed
            'telefone': '51999999999',  # same
        }
        response = self.client.patch(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        log = AuditoriaLog.objects.filter(acao='EDICAO_USUARIO').latest('criado_em')
        self.assertIn('cnpj', log.descricao)
        self.assertNotIn('email', log.descricao)
        self.assertNotIn('nome_empresa', log.descricao)

    def test_validation_error_returns_400(self):
        """Should return 400 with field_errors on invalid payload."""
        payload = {
            'email': 'not-an-email',
            'nome_empresa': 'AB',  # too short (min 3)
        }
        response = self.client.patch(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('field_errors', response.data)

    def test_parceiro_user_cannot_access(self):
        """PARCEIRO users should get 403."""
        self.client.force_authenticate(user=self.parceiro_user)
        payload = {
            'email': 'parceiro1@test.com',
            'nome_empresa': 'Empresa Original',
        }
        response = self.client.patch(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_returns_401(self):
        """Unauthenticated requests should get 401."""
        self.client.force_authenticate(user=None)
        payload = {
            'email': 'parceiro1@test.com',
            'nome_empresa': 'Empresa Original',
        }
        response = self.client.patch(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

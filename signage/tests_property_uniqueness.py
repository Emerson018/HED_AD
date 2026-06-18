"""
Property-based tests for uniqueness constraints.

Feature: admin-user-management, Property 5: Uniqueness constraints reject duplicate values

**Validates: Requirements 3.9, 5.6, 5.7**

Property definition: For any existing user in the database, attempting to create
or update another user with the same username, email, or cnpj SHALL return a
field-specific error indicating the value is already in use, without modifying any data.
"""
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status as http_status

from hypothesis import given, settings, HealthCheck, assume
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from unittest.mock import patch

from signage.models import Parceiro

Usuario = get_user_model()


# --- Strategies ---

def username_strategy():
    """Generate valid usernames: 3+ chars, only lowercase letters, digits, dot, comma.
    Prefixed with 'u' to avoid collision with admin username 'adminpbt'."""
    return st.builds(
        lambda s: f"u{s}",
        st.from_regex(r'^[a-z0-9]{3,8}$', fullmatch=True),
    )


def email_strategy():
    """Generate valid unique-looking email addresses."""
    local_part = st.from_regex(r'^[a-z][a-z0-9]{2,8}$', fullmatch=True)
    domain = st.sampled_from(['example.com', 'test.org', 'mail.net', 'demo.io'])
    return st.builds(lambda l, d: f"{l}@{d}", local_part, domain)


def cnpj_strategy():
    """Generate valid CNPJ strings: exactly 14 digits."""
    return st.from_regex(r'^[0-9]{14}$', fullmatch=True)


def password_strategy():
    """Generate valid passwords: >=6 chars, uppercase, lowercase, digit, special."""
    return st.builds(
        lambda prefix: f"Aa1!{prefix}",
        st.from_regex(r'^[A-Za-z0-9]{2,6}$', fullmatch=True),
    )


def nome_empresa_strategy():
    """Generate valid company names: 3-30 chars."""
    return st.from_regex(r'^[A-Za-z]{3,15}$', fullmatch=True)


def telefone_strategy():
    """Generate valid phone numbers: 10 or 11 digits."""
    return st.one_of(
        st.from_regex(r'^[0-9]{10}$', fullmatch=True),
        st.from_regex(r'^[0-9]{11}$', fullmatch=True),
    )


@patch('signage.views.RegisterView.throttle_classes', [])
class UniquenessConstraintsPropertyTest(TestCase):
    """
    Property 5: Uniqueness constraints reject duplicate values.

    For any existing user in the database, attempting to create or update another
    user with the same username, email, or cnpj SHALL return a field-specific error
    indicating the value is already in use, without modifying any data.
    """

    @classmethod
    def setUpTestData(cls):
        """Create admin user once for all tests (persists across examples via savepoints)."""
        cls.admin = Usuario.objects.create_user(
            username='adminpbt',
            email='adminpbt@test.com',
            password='Admin1!x',
            tipo_usuario='ADMIN_HED',
        )

    def setUp(self):
        """Set up API client for each test method."""
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    @given(
        username=username_strategy(),
        email=email_strategy(),
        password=password_strategy(),
        nome_empresa=nome_empresa_strategy(),
        cnpj=cnpj_strategy(),
        telefone=telefone_strategy(),
        dup_password=password_strategy(),
        dup_nome_empresa=nome_empresa_strategy(),
    )
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.too_slow])
    def test_duplicate_username_rejected_on_create(
        self, username, email, password, nome_empresa, cnpj, telefone,
        dup_password, dup_nome_empresa,
    ):
        """
        Creating a user with a duplicate username returns 400 with field-specific error.

        **Validates: Requirements 3.9**
        """
        assume(username != 'adminpbt')
        assume(email != 'adminpbt@test.com')

        # Create existing user
        existing_user = Usuario.objects.create_user(
            username=username,
            email=email,
            password=password,
            tipo_usuario='PARCEIRO',
        )
        Parceiro.objects.create(
            usuario=existing_user,
            nome_empresa=nome_empresa,
            cnpj=cnpj,
            telefone=telefone,
        )

        user_count_before = Usuario.objects.count()

        # Attempt to create another user with the same username
        response = self.client.post('/api/register/', {
            'username': username,
            'email': f'dup_{email}',
            'password': dup_password,
            'nome_empresa': dup_nome_empresa,
            'cnpj': '',
            'telefone': '',
        }, format='json')

        # Must return 400 with field-specific error for username
        self.assertEqual(response.status_code, http_status.HTTP_400_BAD_REQUEST)
        self.assertIn('field_errors', response.data)
        self.assertIn('username', response.data['field_errors'])

        # No new user should have been created
        self.assertEqual(Usuario.objects.count(), user_count_before)

    @given(
        username=username_strategy(),
        email=email_strategy(),
        password=password_strategy(),
        nome_empresa=nome_empresa_strategy(),
        cnpj=cnpj_strategy(),
        telefone=telefone_strategy(),
        dup_username=username_strategy(),
        dup_password=password_strategy(),
        dup_nome_empresa=nome_empresa_strategy(),
    )
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.too_slow])
    def test_duplicate_email_rejected_on_create(
        self, username, email, password, nome_empresa, cnpj, telefone,
        dup_username, dup_password, dup_nome_empresa,
    ):
        """
        Creating a user with a duplicate email returns 400 with field-specific error.

        **Validates: Requirements 3.9**
        """
        assume(username != 'adminpbt')
        assume(dup_username != 'adminpbt')
        assume(username != dup_username)
        assume(email != 'adminpbt@test.com')

        # Create existing user
        existing_user = Usuario.objects.create_user(
            username=username,
            email=email,
            password=password,
            tipo_usuario='PARCEIRO',
        )
        Parceiro.objects.create(
            usuario=existing_user,
            nome_empresa=nome_empresa,
            cnpj=cnpj,
            telefone=telefone,
        )

        user_count_before = Usuario.objects.count()

        # Attempt to create another user with the same email
        response = self.client.post('/api/register/', {
            'username': dup_username,
            'email': email,
            'password': dup_password,
            'nome_empresa': dup_nome_empresa,
            'cnpj': '',
            'telefone': '',
        }, format='json')

        # Must return 400 with field-specific error for email
        self.assertEqual(response.status_code, http_status.HTTP_400_BAD_REQUEST)
        self.assertIn('field_errors', response.data)
        self.assertIn('email', response.data['field_errors'])

        # No new user should have been created
        self.assertEqual(Usuario.objects.count(), user_count_before)

    @given(
        username=username_strategy(),
        email=email_strategy(),
        password=password_strategy(),
        nome_empresa=nome_empresa_strategy(),
        cnpj=cnpj_strategy(),
        telefone=telefone_strategy(),
        dup_username=username_strategy(),
        dup_email=email_strategy(),
        dup_password=password_strategy(),
        dup_nome_empresa=nome_empresa_strategy(),
    )
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.too_slow])
    def test_duplicate_cnpj_rejected_on_create(
        self, username, email, password, nome_empresa, cnpj, telefone,
        dup_username, dup_email, dup_password, dup_nome_empresa,
    ):
        """
        Creating a user with a duplicate CNPJ returns 400 with field-specific error.

        **Validates: Requirements 3.9**
        """
        assume(username != 'adminpbt')
        assume(dup_username != 'adminpbt')
        assume(username != dup_username)
        assume(email != dup_email)
        assume(email != 'adminpbt@test.com')
        assume(dup_email != 'adminpbt@test.com')

        # Create existing user
        existing_user = Usuario.objects.create_user(
            username=username,
            email=email,
            password=password,
            tipo_usuario='PARCEIRO',
        )
        Parceiro.objects.create(
            usuario=existing_user,
            nome_empresa=nome_empresa,
            cnpj=cnpj,
            telefone=telefone,
        )

        user_count_before = Usuario.objects.count()

        # Attempt to create another user with the same CNPJ
        response = self.client.post('/api/register/', {
            'username': dup_username,
            'email': dup_email,
            'password': dup_password,
            'nome_empresa': dup_nome_empresa,
            'cnpj': cnpj,
            'telefone': '',
        }, format='json')

        # Must return 400 with field-specific error for cnpj
        self.assertEqual(response.status_code, http_status.HTTP_400_BAD_REQUEST)
        self.assertIn('field_errors', response.data)
        self.assertIn('cnpj', response.data['field_errors'])

        # No new user should have been created
        self.assertEqual(Usuario.objects.count(), user_count_before)

    @given(
        username1=username_strategy(),
        email1=email_strategy(),
        password1=password_strategy(),
        nome_empresa1=nome_empresa_strategy(),
        cnpj1=cnpj_strategy(),
        telefone1=telefone_strategy(),
        username2=username_strategy(),
        email2=email_strategy(),
        password2=password_strategy(),
        nome_empresa2=nome_empresa_strategy(),
        cnpj2=cnpj_strategy(),
        telefone2=telefone_strategy(),
    )
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.too_slow])
    def test_duplicate_email_rejected_on_update(
        self, username1, email1, password1, nome_empresa1, cnpj1, telefone1,
        username2, email2, password2, nome_empresa2, cnpj2, telefone2,
    ):
        """
        Updating a user with another user's email returns 400 with field-specific error.

        **Validates: Requirements 5.6**
        """
        # Ensure distinct values for the two users and no admin collision
        assume(username1 != username2)
        assume(email1 != email2)
        assume(cnpj1 != cnpj2)
        assume(username1 != 'adminpbt')
        assume(username2 != 'adminpbt')
        assume(email1 != 'adminpbt@test.com')
        assume(email2 != 'adminpbt@test.com')

        # Create first user (target of the update)
        user1 = Usuario.objects.create_user(
            username=username1,
            email=email1,
            password=password1,
            tipo_usuario='PARCEIRO',
        )
        Parceiro.objects.create(
            usuario=user1,
            nome_empresa=nome_empresa1,
            cnpj=cnpj1,
            telefone=telefone1,
        )

        # Create second user (whose email we'll try to steal)
        user2 = Usuario.objects.create_user(
            username=username2,
            email=email2,
            password=password2,
            tipo_usuario='PARCEIRO',
        )
        Parceiro.objects.create(
            usuario=user2,
            nome_empresa=nome_empresa2,
            cnpj=cnpj2,
            telefone=telefone2,
        )

        # Attempt to update user1 with user2's email
        response = self.client.patch(f'/api/usuarios/{user1.id}/', {
            'email': email2,
            'nome_empresa': nome_empresa1,
            'cnpj': cnpj1,
            'telefone': telefone1,
        }, format='json')

        # Must return 400 with field-specific error for email
        self.assertEqual(response.status_code, http_status.HTTP_400_BAD_REQUEST)
        self.assertIn('field_errors', response.data)
        self.assertIn('email', response.data['field_errors'])

        # Original data should be unchanged
        user1.refresh_from_db()
        self.assertEqual(user1.email, email1)

    @given(
        username1=username_strategy(),
        email1=email_strategy(),
        password1=password_strategy(),
        nome_empresa1=nome_empresa_strategy(),
        cnpj1=cnpj_strategy(),
        telefone1=telefone_strategy(),
        username2=username_strategy(),
        email2=email_strategy(),
        password2=password_strategy(),
        nome_empresa2=nome_empresa_strategy(),
        cnpj2=cnpj_strategy(),
        telefone2=telefone_strategy(),
    )
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.too_slow])
    def test_duplicate_cnpj_rejected_on_update(
        self, username1, email1, password1, nome_empresa1, cnpj1, telefone1,
        username2, email2, password2, nome_empresa2, cnpj2, telefone2,
    ):
        """
        Updating a user with another user's CNPJ returns 400 with field-specific error.

        **Validates: Requirements 5.7**
        """
        # Ensure distinct values for the two users and no admin collision
        assume(username1 != username2)
        assume(email1 != email2)
        assume(cnpj1 != cnpj2)
        assume(username1 != 'adminpbt')
        assume(username2 != 'adminpbt')
        assume(email1 != 'adminpbt@test.com')
        assume(email2 != 'adminpbt@test.com')

        # Create first user (target of the update)
        user1 = Usuario.objects.create_user(
            username=username1,
            email=email1,
            password=password1,
            tipo_usuario='PARCEIRO',
        )
        Parceiro.objects.create(
            usuario=user1,
            nome_empresa=nome_empresa1,
            cnpj=cnpj1,
            telefone=telefone1,
        )

        # Create second user (whose CNPJ we'll try to steal)
        user2 = Usuario.objects.create_user(
            username=username2,
            email=email2,
            password=password2,
            tipo_usuario='PARCEIRO',
        )
        Parceiro.objects.create(
            usuario=user2,
            nome_empresa=nome_empresa2,
            cnpj=cnpj2,
            telefone=telefone2,
        )

        # Attempt to update user1 with user2's CNPJ
        response = self.client.patch(f'/api/usuarios/{user1.id}/', {
            'email': email1,
            'nome_empresa': nome_empresa1,
            'cnpj': cnpj2,
            'telefone': telefone1,
        }, format='json')

        # Must return 400 with field-specific error for cnpj
        self.assertEqual(response.status_code, http_status.HTTP_400_BAD_REQUEST)
        self.assertIn('field_errors', response.data)
        self.assertIn('cnpj', response.data['field_errors'])

        # Original data should be unchanged
        user1.perfil_parceiro.refresh_from_db()
        self.assertEqual(user1.perfil_parceiro.cnpj, cnpj1)

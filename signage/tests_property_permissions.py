"""
Property-based tests for Permission enforcement by role.

Feature: admin-user-management, Property 8: Permission enforcement by role

**Validates: Requirements 7.1, 7.2, 7.3, 8.5**

Property definition: For any API request to the user management endpoints:
- If the requester is unauthenticated, the response SHALL be HTTP 401
- If the requester is authenticated with tipo_usuario='PARCEIRO', the response SHALL be HTTP 403
  without revealing user data
- Only requests authenticated with tipo_usuario='ADMIN_HED' SHALL be permitted to execute the operation
"""
import uuid

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase

from signage.models import Parceiro

Usuario = get_user_model()


# Strategy: generate a random endpoint + method combination for user management
endpoint_strategy = st.sampled_from([
    ('get', '/api/usuarios/'),
    ('get', '/api/usuarios/{id}/'),
    ('patch', '/api/usuarios/{id}/'),
    ('delete', '/api/usuarios/{id}/'),
])


class PermissionEnforcementPropertyTest(TestCase):
    """
    Feature: admin-user-management, Property 8: Permission enforcement by role

    **Validates: Requirements 7.1, 7.2, 7.3, 8.5**
    """

    def _get_or_create_admin(self):
        """Get or create the ADMIN_HED user."""
        user, _ = Usuario.objects.get_or_create(
            username='admin_perm_test',
            defaults={
                'email': 'admin_perm@test.com',
                'tipo_usuario': 'ADMIN_HED',
            },
        )
        if not user.has_usable_password():
            user.set_password('Admin123!')
            user.save()
        return user

    def _get_or_create_parceiro(self):
        """Get or create the PARCEIRO user with profile."""
        user, _ = Usuario.objects.get_or_create(
            username='parceiro_perm_test',
            defaults={
                'email': 'parceiro_perm@test.com',
                'tipo_usuario': 'PARCEIRO',
            },
        )
        if not user.has_usable_password():
            user.set_password('Parceiro123!')
            user.save()
        Parceiro.objects.get_or_create(
            usuario=user,
            defaults={
                'nome_empresa': 'Empresa Teste Permissao',
                'cnpj': '11111111111111',
                'telefone': '51999990000',
            },
        )
        return user

    def _get_or_create_target(self):
        """Get or create a target PARCEIRO user for detail/update/delete endpoints."""
        try:
            user = Usuario.objects.get(username='target_perm_test')
        except Usuario.DoesNotExist:
            user = Usuario.objects.create_user(
                username='target_perm_test',
                email='target_perm@test.com',
                password='Target123!',
                tipo_usuario='PARCEIRO',
            )
        Parceiro.objects.get_or_create(
            usuario=user,
            defaults={
                'nome_empresa': 'Empresa Alvo',
                'cnpj': '22222222222222',
                'telefone': '51888880000',
            },
        )
        return user

    def _resolve_url(self, url_template, target_user):
        """Replace {id} placeholder with the target user's ID."""
        return url_template.replace('{id}', str(target_user.id))

    def _make_request(self, client, method, url):
        """Execute an HTTP request with the given method and URL."""
        if method == 'get':
            return client.get(url)
        elif method == 'patch':
            suffix = uuid.uuid4().hex[:8]
            payload = {
                'email': f'updated_{suffix}@test.com',
                'nome_empresa': 'Empresa Atualizada',
                'cnpj': '',
                'telefone': '',
            }
            return client.patch(url, payload, format='json')
        elif method == 'delete':
            return client.delete(url)
        else:
            raise ValueError(f"Unsupported method: {method}")

    @given(endpoint=endpoint_strategy)
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.too_slow])
    def test_unauthenticated_returns_401(self, endpoint):
        """
        Property: Unauthenticated requests to any user management endpoint
        SHALL receive HTTP 401.

        **Validates: Requirements 7.1, 7.2, 7.3, 8.5**
        """
        method, url_template = endpoint
        target = self._get_or_create_target()
        url = self._resolve_url(url_template, target)

        client = APIClient()
        # No authentication
        response = self._make_request(client, method, url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
            f"Expected 401 for unauthenticated {method.upper()} {url}, "
            f"got {response.status_code}",
        )

    @given(endpoint=endpoint_strategy)
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.too_slow])
    def test_parceiro_returns_403_without_user_data(self, endpoint):
        """
        Property: PARCEIRO-authenticated requests to any user management endpoint
        SHALL receive HTTP 403 and the response body SHALL NOT contain user data.

        **Validates: Requirements 7.1, 7.2, 7.3, 8.5**
        """
        method, url_template = endpoint
        parceiro_user = self._get_or_create_parceiro()
        target = self._get_or_create_target()
        url = self._resolve_url(url_template, target)

        client = APIClient()
        client.force_authenticate(user=parceiro_user)

        response = self._make_request(client, method, url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            f"Expected 403 for PARCEIRO {method.upper()} {url}, "
            f"got {response.status_code}",
        )

        # Verify response does NOT reveal user data
        response_text = str(response.data) if response.data else ''
        self.assertNotIn(target.email, response_text)
        self.assertNotIn(target.username, response_text)
        parceiro_profile = getattr(target, 'perfil_parceiro', None)
        if parceiro_profile:
            self.assertNotIn(parceiro_profile.nome_empresa, response_text)
            if parceiro_profile.cnpj:
                self.assertNotIn(parceiro_profile.cnpj, response_text)

    @given(endpoint=endpoint_strategy)
    @settings(max_examples=100, deadline=None, suppress_health_check=[HealthCheck.too_slow])
    def test_admin_hed_is_permitted(self, endpoint):
        """
        Property: ADMIN_HED-authenticated requests to any user management endpoint
        SHALL be permitted to execute the operation (HTTP 200 or 204).

        **Validates: Requirements 7.1, 7.2, 7.3, 8.5**
        """
        method, url_template = endpoint
        admin_user = self._get_or_create_admin()

        # For delete, create a fresh disposable target to avoid conflicts
        if method == 'delete':
            import uuid
            suffix = uuid.uuid4().hex[:8]
            target = Usuario.objects.create_user(
                username=f'del_target_{suffix}',
                email=f'del_target_{suffix}@test.com',
                password='Target123!',
                tipo_usuario='PARCEIRO',
            )
            Parceiro.objects.create(
                usuario=target,
                nome_empresa=f'Empresa Del {suffix}',
            )
        else:
            target = self._get_or_create_target()

        url = self._resolve_url(url_template, target)

        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = self._make_request(client, method, url)

        # ADMIN_HED should get a success response
        allowed_statuses = [
            status.HTTP_200_OK,
            status.HTTP_204_NO_CONTENT,
        ]
        self.assertIn(
            response.status_code,
            allowed_statuses,
            f"Expected 200/204 for ADMIN_HED {method.upper()} {url}, "
            f"got {response.status_code}",
        )

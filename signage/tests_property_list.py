"""
Property-based tests for the list endpoint of UsuarioViewSet.

Feature: admin-user-management, Property 1: List endpoint returns only PARCEIRO users

**Validates: Requirements 2.1, 2.3**

Property definition: For any set of users in the database (with mixed tipo_usuario values),
calling GET /api/usuarios/?page=N as ADMIN_HED SHALL return only users with
tipo_usuario='PARCEIRO', with at most 10 results per page, ordered by criado_em descending
(most recent first).
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st

from signage.models import Parceiro

Usuario = get_user_model()


# --- Strategies ---

user_type_strategy = st.sampled_from(['ADMIN_HED', 'PARCEIRO'])


@st.composite
def user_set_strategy(draw):
    """Generate a list of user specs with mixed tipo_usuario values.

    Each user spec is a dict with tipo_usuario and a unique index.
    """
    num_users = draw(st.integers(min_value=1, max_value=12))
    users = []
    for i in range(num_users):
        tipo = draw(user_type_strategy)
        users.append({
            'tipo_usuario': tipo,
            'index': i,
        })
    return users


@override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class PropertyListEndpointTest(TestCase):
    """
    Feature: admin-user-management, Property 1: List endpoint returns only PARCEIRO users

    **Validates: Requirements 2.1, 2.3**
    """

    def setUp(self):
        self.admin = Usuario.objects.create_user(
            username='admin_prop_test',
            email='admin_prop@test.com',
            password='Admin123!',
            tipo_usuario='ADMIN_HED',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_list_returns_only_parceiro_users_paginated_and_ordered(self):
        """
        Property 1: List endpoint returns only PARCEIRO users, paginated and ordered.

        For any set of users in the database (with mixed tipo_usuario values),
        calling GET /api/usuarios/?page=N as ADMIN_HED SHALL return only users with
        tipo_usuario='PARCEIRO', with at most 10 results per page, ordered by
        criado_em descending (most recent first).

        Uses Hypothesis to generate 100 random user sets and verifies the property
        holds for each one.
        """
        client = self.client
        admin_id = self.admin.id
        # Pre-hash password once to avoid repeated hashing
        hashed_pw = make_password('Test123!')

        @given(user_set=user_set_strategy())
        @settings(
            max_examples=100,
            suppress_health_check=[
                HealthCheck.too_slow,
                HealthCheck.function_scoped_fixture,
            ],
            deadline=None,
            database=None,
        )
        def check_property(user_set):
            # Clean previous iteration data
            Parceiro.objects.all().delete()
            Usuario.objects.exclude(id=admin_id).delete()

            # Create users from the generated set with distinct criado_em timestamps
            base_time = timezone.now() - timedelta(hours=1)
            parceiro_count = 0

            # Bulk create users for efficiency
            users_to_create = []
            for spec in user_set:
                idx = spec['index']
                tipo = spec['tipo_usuario']
                users_to_create.append(Usuario(
                    username=f'user_{tipo.lower()}_{idx}',
                    email=f'user_{tipo.lower()}_{idx}@test.com',
                    password=hashed_pw,
                    tipo_usuario=tipo,
                ))

            created_users = Usuario.objects.bulk_create(users_to_create)

            # Create Parceiro records for PARCEIRO users
            parceiros_to_create = []
            for user_obj, spec in zip(created_users, user_set):
                if spec['tipo_usuario'] == 'PARCEIRO':
                    parceiros_to_create.append(Parceiro(
                        usuario=user_obj,
                        nome_empresa=f'Empresa {spec["index"]}',
                        cnpj=None,
                        telefone=None,
                    ))
                    parceiro_count += 1

            created_parceiros = Parceiro.objects.bulk_create(parceiros_to_create)

            # Set distinct criado_em via individual updates to ensure ordering
            for i, parceiro in enumerate(created_parceiros):
                distinct_time = base_time + timedelta(minutes=i)
                Parceiro.objects.filter(pk=parceiro.pk).update(criado_em=distinct_time)

            # Paginate through all pages and collect results
            all_results = []
            page = 1
            while True:
                response = client.get(f'/api/usuarios/?page={page}')
                # Should always succeed for ADMIN_HED
                assert response.status_code == status.HTTP_200_OK, (
                    f"Expected 200, got {response.status_code}"
                )

                results = response.data['results']

                # Property: at most 10 results per page
                assert len(results) <= 10, (
                    f"Expected at most 10 results per page, got {len(results)}"
                )

                # Property: all returned users must be PARCEIRO
                for user_data in results:
                    assert user_data['tipo_usuario'] == 'PARCEIRO', (
                        f"Expected tipo_usuario='PARCEIRO', "
                        f"got '{user_data['tipo_usuario']}'"
                    )

                all_results.extend(results)

                # Check if there are more pages
                if response.data['next'] is None:
                    break
                page += 1

            # Property: total count matches the number of PARCEIRO users created
            assert response.data['count'] == parceiro_count, (
                f"Expected count={parceiro_count}, got {response.data['count']}"
            )
            assert len(all_results) == parceiro_count, (
                f"Expected {parceiro_count} total results, got {len(all_results)}"
            )

            # Property: results are ordered by criado_em descending (most recent first)
            if len(all_results) > 1:
                criado_em_values = [r['criado_em'] for r in all_results]
                for i in range(len(criado_em_values) - 1):
                    assert criado_em_values[i] >= criado_em_values[i + 1], (
                        f"Results not ordered by criado_em DESC: "
                        f"{criado_em_values[i]} should be >= "
                        f"{criado_em_values[i + 1]}"
                    )

        check_property()

"""
Property-based tests for the detail endpoint serialization of UsuarioViewSet.

Feature: admin-user-management, Property 2: Serialization includes all required fields

**Validates: Requirements 2.2, 4.2**

Property definition: For any Usuario with an associated Parceiro profile, the detail
response from GET /api/usuarios/:id/ SHALL include all of: username, email, tipo_usuario,
nome_empresa, cnpj, telefone, criado_em, and total_campanhas.
"""
from datetime import date

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework import status

from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st

from signage.models import Parceiro, Campanha

Usuario = get_user_model()


# --- Strategies ---

@st.composite
def parceiro_data_strategy(draw):
    """Generate random Parceiro profile data with some fields filled, some empty/null."""
    nome_empresa = draw(st.text(
        alphabet=st.characters(whitelist_categories=('L', 'N', 'Zs')),
        min_size=3,
        max_size=50,
    ).filter(lambda s: s.strip()))

    # CNPJ: either None/empty or exactly 14 digits
    cnpj = draw(st.one_of(
        st.none(),
        st.just(''),
        st.text(alphabet='0123456789', min_size=14, max_size=14),
    ))

    # Telefone: either None/empty or 10-11 digits
    telefone = draw(st.one_of(
        st.none(),
        st.just(''),
        st.text(alphabet='0123456789', min_size=10, max_size=11),
    ))

    # Number of campaigns to associate (0 to 5)
    num_campanhas = draw(st.integers(min_value=0, max_value=5))

    return {
        'nome_empresa': nome_empresa,
        'cnpj': cnpj if cnpj else None,
        'telefone': telefone if telefone else None,
        'num_campanhas': num_campanhas,
    }


REQUIRED_FIELDS = {
    'username', 'email', 'tipo_usuario',
    'nome_empresa', 'cnpj', 'telefone',
    'criado_em', 'total_campanhas',
}


@override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
class PropertySerializationFieldsTest(TestCase):
    """
    Feature: admin-user-management, Property 2: Serialization includes all required fields

    **Validates: Requirements 2.2, 4.2**
    """

    def setUp(self):
        self.admin = Usuario.objects.create_user(
            username='admin_serial_test',
            email='admin_serial@test.com',
            password='Admin123!',
            tipo_usuario='ADMIN_HED',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_detail_response_includes_all_required_fields(self):
        """
        Property 2: Serialization includes all required fields.

        For any Usuario with an associated Parceiro profile, the detail response from
        GET /api/usuarios/:id/ SHALL include all of: username, email, tipo_usuario,
        nome_empresa, cnpj, telefone, criado_em, and total_campanhas.

        Uses Hypothesis to generate 100 random Parceiro profiles and verifies the
        property holds for each one.
        """
        client = self.client
        admin_id = self.admin.id
        hashed_pw = make_password('Test123!')
        counter = [0]

        @given(parceiro_data=parceiro_data_strategy())
        @settings(
            max_examples=100,
            suppress_health_check=[
                HealthCheck.too_slow,
                HealthCheck.function_scoped_fixture,
            ],
            deadline=None,
            database=None,
        )
        def check_property(parceiro_data):
            counter[0] += 1
            idx = counter[0]

            # Create a PARCEIRO user with random data
            user = Usuario.objects.create(
                username=f'parceiro_ser_{idx}',
                email=f'parceiro_ser_{idx}@test.com',
                password=hashed_pw,
                tipo_usuario='PARCEIRO',
            )

            parceiro = Parceiro.objects.create(
                usuario=user,
                nome_empresa=parceiro_data['nome_empresa'],
                cnpj=parceiro_data['cnpj'],
                telefone=parceiro_data['telefone'],
            )

            # Create associated campaigns
            for c in range(parceiro_data['num_campanhas']):
                Campanha.objects.create(
                    parceiro=parceiro,
                    nome=f'Campanha {idx}_{c}',
                    status='EM_ANALISE',
                    duracao=15,
                    data_inicio=date(2025, 1, 1),
                    data_fim=date(2025, 12, 31),
                )

            # Call GET /api/usuarios/:id/ as ADMIN_HED
            response = client.get(f'/api/usuarios/{user.id}/')

            # Should succeed
            assert response.status_code == status.HTTP_200_OK, (
                f"Expected 200, got {response.status_code}: {response.data}"
            )

            data = response.data

            # Property: response contains ALL required fields
            for field in REQUIRED_FIELDS:
                assert field in data, (
                    f"Required field '{field}' missing from response. "
                    f"Response keys: {list(data.keys())}"
                )

            # Verify field values match what was stored in the database
            assert data['username'] == user.username, (
                f"username mismatch: expected '{user.username}', got '{data['username']}'"
            )
            assert data['email'] == user.email, (
                f"email mismatch: expected '{user.email}', got '{data['email']}'"
            )
            assert data['tipo_usuario'] == 'PARCEIRO', (
                f"tipo_usuario mismatch: expected 'PARCEIRO', got '{data['tipo_usuario']}'"
            )
            assert data['nome_empresa'] == parceiro_data['nome_empresa'], (
                f"nome_empresa mismatch: expected '{parceiro_data['nome_empresa']}', "
                f"got '{data['nome_empresa']}'"
            )

            # cnpj and telefone may be None/null in response
            expected_cnpj = parceiro_data['cnpj']
            assert data['cnpj'] == expected_cnpj, (
                f"cnpj mismatch: expected '{expected_cnpj}', got '{data['cnpj']}'"
            )

            expected_telefone = parceiro_data['telefone']
            assert data['telefone'] == expected_telefone, (
                f"telefone mismatch: expected '{expected_telefone}', "
                f"got '{data['telefone']}'"
            )

            # criado_em should be a non-null string (ISO datetime)
            assert data['criado_em'] is not None, (
                "criado_em should not be None"
            )

            # total_campanhas should be an integer matching the count of campaigns
            assert isinstance(data['total_campanhas'], int), (
                f"total_campanhas should be int, got {type(data['total_campanhas'])}"
            )
            assert data['total_campanhas'] == parceiro_data['num_campanhas'], (
                f"total_campanhas mismatch: expected {parceiro_data['num_campanhas']}, "
                f"got {data['total_campanhas']}"
            )

            # Cleanup to avoid unique constraint issues across iterations
            user.delete()

        check_property()

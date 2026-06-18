"""
Property-Based Test: Cascade deletion removes all associated data.

Feature: admin-user-management, Property 7: Cascade deletion removes all associated data

Validates: Requirements 6.2
"""

import string
import uuid
from datetime import date, timedelta

from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework.test import APIClient

from signage.models import Campanha, Midia, Parceiro, Usuario


# --- Strategies ---

nome_empresa_st = st.text(
    alphabet=st.sampled_from(string.ascii_letters + string.digits + " "),
    min_size=3,
    max_size=50,
).filter(lambda s: len(s.strip()) >= 3)

# Number of campanhas to create (1-5 to keep tests fast)
num_campanhas_st = st.integers(min_value=1, max_value=5)

# Number of midias per campanha (1-3 to keep tests fast)
num_midias_st = st.integers(min_value=1, max_value=3)


class TestCascadeDeletionRemovesAllData(TestCase):
    """
    **Validates: Requirements 6.2**

    Property 7: For any Usuario with an associated Parceiro, Campanhas, and Mídias,
    deleting the Usuario via DELETE /api/usuarios/:id/ SHALL remove the Usuario,
    the Parceiro, all associated Campanhas, and all associated Mídias from the database.
    """

    def setUp(self):
        """Create an ADMIN_HED user for authentication."""
        self.admin = Usuario.objects.create_user(
            username="admin_cascade_test",
            password="Admin123!",
            email="admin_cascade@test.com",
            tipo_usuario="ADMIN_HED",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    @given(
        nome_empresa=nome_empresa_st,
        num_campanhas=num_campanhas_st,
        num_midias=num_midias_st,
    )
    @settings(
        max_examples=100,
        database=None,
        deadline=None,
        suppress_health_check=[HealthCheck.too_slow, HealthCheck.function_scoped_fixture],
    )
    def test_cascade_deletion_removes_all_associated_data(
        self, nome_empresa, num_campanhas, num_midias
    ):
        """
        Feature: admin-user-management, Property 7: Cascade deletion removes all associated data
        """
        uid = str(uuid.uuid4().int)[:8]

        # 1. Create a PARCEIRO user with Parceiro profile
        parceiro_user = Usuario.objects.create_user(
            username=f"parceiro_{uid}",
            password="Parceiro123!",
            email=f"parceiro_{uid}@test.com",
            tipo_usuario="PARCEIRO",
        )
        parceiro = Parceiro.objects.create(
            usuario=parceiro_user,
            nome_empresa=nome_empresa,
            cnpj=None,
            telefone=None,
        )

        # 2. Create a random number of Campanhas associated with the Parceiro
        #    Use EM_ANALISE status to avoid inventory validation in clean()
        campanhas = []
        today = date.today()
        campanha_objs = [
            Campanha(
                parceiro=parceiro,
                nome=f"Campanha_{uid}_{i}",
                status="EM_ANALISE",
                duracao=15,
                data_inicio=today,
                data_fim=today + timedelta(days=30),
            )
            for i in range(num_campanhas)
        ]
        campanhas = Campanha.objects.bulk_create(campanha_objs)

        # 3. Create a random number of Mídias associated with each Campanha
        midias = []
        for campanha in campanhas:
            for j in range(num_midias):
                midia = Midia.objects.create(
                    campanha=campanha,
                    tipo="VIDEO",
                    arquivo_url=f"https://storage.example.com/{uid}_{campanha.id}_{j}.mp4",
                )
                midias.append(midia)

        # Record IDs for verification
        user_id = parceiro_user.id
        parceiro_id = parceiro.id
        campanha_ids = [c.id for c in campanhas]
        midia_ids = [m.id for m in midias]

        # 4. Call DELETE /api/usuarios/:id/ as ADMIN_HED
        response = self.client.delete(f"/api/usuarios/{user_id}/")

        # 5. Verify the response is 204 No Content
        self.assertEqual(
            response.status_code,
            204,
            f"Expected 204 but got {response.status_code}: {getattr(response, 'data', '')}",
        )

        # 6. Verify the Usuario is removed from the database
        self.assertFalse(
            Usuario.objects.filter(id=user_id).exists(),
            "Usuario should be deleted from the database",
        )

        # 7. Verify the Parceiro is removed from the database
        self.assertFalse(
            Parceiro.objects.filter(id=parceiro_id).exists(),
            "Parceiro should be deleted from the database (cascade)",
        )

        # 8. Verify all Campanhas are removed from the database
        remaining_campanhas = Campanha.objects.filter(id__in=campanha_ids).count()
        self.assertEqual(
            remaining_campanhas,
            0,
            f"All {num_campanhas} Campanhas should be deleted (cascade), but {remaining_campanhas} remain",
        )

        # 9. Verify all Mídias are removed from the database
        remaining_midias = Midia.objects.filter(id__in=midia_ids).count()
        self.assertEqual(
            remaining_midias,
            0,
            f"All {len(midias)} Mídias should be deleted (cascade), but {remaining_midias} remain",
        )

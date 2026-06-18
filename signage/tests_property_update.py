"""
Property-Based Test: Update persists changes and handles optional password.

Feature: admin-user-management, Property 6: Update persists changes and handles optional password

Validates: Requirements 5.4, 5.8
"""

import string
import uuid

from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework.test import APIClient

from signage.models import Parceiro, Usuario


# --- Strategies ---

# Valid email strategy
email_local_st = st.from_regex(r"[a-z0-9]{3,10}", fullmatch=True)
email_domain_st = st.from_regex(r"[a-z]{3,8}", fullmatch=True)
email_st = st.builds(lambda local, domain: f"{local}@{domain}.com", email_local_st, email_domain_st)

# nome_empresa: min 3 chars, max 150
nome_empresa_st = st.text(
    alphabet=st.sampled_from(string.ascii_letters + string.digits + " "),
    min_size=3,
    max_size=50,
).filter(lambda s: len(s.strip()) >= 3)

# CNPJ: either empty or exactly 14 digits
cnpj_st = st.one_of(
    st.just(""),
    st.from_regex(r"[0-9]{14}", fullmatch=True),
)

# Telefone: either empty or 10-11 digits
telefone_st = st.one_of(
    st.just(""),
    st.from_regex(r"[0-9]{10,11}", fullmatch=True),
)

# Password strategy: either absent/empty (no change) or a valid password
# Valid password: ≥6 chars with uppercase, lowercase, digit, special char
valid_password_st = st.builds(
    lambda upper, lower, digit, special, extra: upper + lower + digit + special + extra,
    st.from_regex(r"[A-Z]{1,3}", fullmatch=True),
    st.from_regex(r"[a-z]{1,3}", fullmatch=True),
    st.from_regex(r"[0-9]{1,2}", fullmatch=True),
    st.sampled_from(list("!@#$%^&*()")),
    st.from_regex(r"[a-zA-Z0-9]{2,4}", fullmatch=True),
).filter(lambda p: len(p) >= 6)

# Password can be: absent (None), empty string, or a valid password
password_option_st = st.one_of(
    st.just(None),       # absent from payload
    st.just(""),         # empty string
    valid_password_st,   # valid password
)


class TestUpdatePersistsChangesAndHandlesPassword(TestCase):
    """
    **Validates: Requirements 5.4, 5.8**

    Property 6: For any valid update payload sent via PATCH /api/usuarios/:id/,
    the system SHALL persist the new email, nome_empresa, cnpj, and telefone values.
    If a valid password is provided, the user's password SHALL be updated;
    if password is empty or absent, the existing password SHALL remain unchanged.
    """

    def setUp(self):
        """Create an ADMIN_HED user and a target PARCEIRO user for testing."""
        self.admin = Usuario.objects.create_user(
            username="admin_update_test",
            password="Admin123!",
            email="admin_update@test.com",
            tipo_usuario="ADMIN_HED",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    @given(
        email=email_st,
        nome_empresa=nome_empresa_st,
        cnpj=cnpj_st,
        telefone=telefone_st,
        password_option=password_option_st,
    )
    @settings(
        max_examples=100,
        database=None,
        deadline=None,
        suppress_health_check=[HealthCheck.too_slow, HealthCheck.function_scoped_fixture, HealthCheck.differing_executors],
    )
    def test_update_persists_changes_and_handles_optional_password(
        self, email, nome_empresa, cnpj, telefone, password_option
    ):
        """
        Feature: admin-user-management, Property 6: Update persists changes and handles optional password
        """
        # Create a fresh PARCEIRO user for each iteration to avoid state leakage
        uid = str(uuid.uuid4().int)[:8]
        original_password = "Original1!"

        parceiro_user = Usuario.objects.create_user(
            username=f"parceiro_{uid}",
            password=original_password,
            email=f"parceiro_{uid}@original.com",
            tipo_usuario="PARCEIRO",
        )
        Parceiro.objects.create(
            usuario=parceiro_user,
            nome_empresa="Empresa Original",
            cnpj=None,
            telefone=None,
        )

        # Build unique email to avoid collisions with other users
        unique_email = f"{uid}.{email}"

        # Build unique CNPJ to avoid collisions
        unique_cnpj = cnpj
        if cnpj:
            unique_cnpj = cnpj[:6] + uid[:8]

        # Build the update payload
        payload = {
            "email": unique_email,
            "nome_empresa": nome_empresa,
            "cnpj": unique_cnpj,
            "telefone": telefone,
        }

        # Include password in payload only if not None (simulates absent vs empty)
        if password_option is not None:
            payload["password"] = password_option

        url = f"/api/usuarios/{parceiro_user.id}/"
        response = self.client.patch(url, payload, format="json")

        # The request should succeed
        self.assertEqual(
            response.status_code,
            200,
            f"Expected 200 but got {response.status_code}: {response.data}",
        )

        # Refresh from database
        parceiro_user.refresh_from_db()
        parceiro = parceiro_user.perfil_parceiro

        # 1. Verify email is persisted
        self.assertEqual(parceiro_user.email, unique_email)

        # 2. Verify nome_empresa is persisted
        self.assertEqual(parceiro.nome_empresa, nome_empresa)

        # 3. Verify cnpj is persisted
        self.assertEqual(parceiro.cnpj, unique_cnpj)

        # 4. Verify telefone is persisted
        self.assertEqual(parceiro.telefone, telefone)

        # 5. Verify password handling
        if password_option and len(password_option) > 0:
            # Password was provided and non-empty: should be updated
            self.assertTrue(
                parceiro_user.check_password(password_option),
                f"Password should have been updated to '{password_option}' but check_password failed.",
            )
            self.assertFalse(
                parceiro_user.check_password(original_password),
                "Original password should no longer work after update.",
            )
        else:
            # Password was absent (None) or empty string: original should remain
            self.assertTrue(
                parceiro_user.check_password(original_password),
                "Original password should remain unchanged when password is empty/absent.",
            )

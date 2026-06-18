"""
Property-Based Test: Creation produces both Usuario and Parceiro with correct data.

Feature: admin-user-management, Property 4: Creation produces both Usuario and Parceiro

Validates: Requirements 3.7
"""

import string
import uuid
from unittest.mock import patch

from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework.test import APIClient

from signage.models import Parceiro, Usuario


# --- Strategies ---

username_st = st.from_regex(r"[a-z0-9.,]{3,12}", fullmatch=True)

email_local_st = st.from_regex(r"[a-z0-9]{3,10}", fullmatch=True)
email_domain_st = st.from_regex(r"[a-z]{3,8}", fullmatch=True)
email_st = st.builds(lambda local, domain: f"{local}@{domain}.com", email_local_st, email_domain_st)

# Password: ≥6 chars with uppercase, lowercase, digit, special char
# Ensure minimum 6 characters by generating enough parts
password_st = st.builds(
    lambda upper, lower, digit, special, extra: upper + lower + digit + special + extra,
    st.from_regex(r"[A-Z]{1,3}", fullmatch=True),
    st.from_regex(r"[a-z]{1,3}", fullmatch=True),
    st.from_regex(r"[0-9]{1,2}", fullmatch=True),
    st.sampled_from(list("!@#$%^&*()")),
    st.from_regex(r"[a-zA-Z0-9]{2,4}", fullmatch=True),
).filter(lambda p: len(p) >= 6)

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


class TestCreationProducesUsuarioAndParceiro(TestCase):
    """
    **Validates: Requirements 3.7**

    Property 4: For any valid registration payload, submitting to the register
    endpoint SHALL create a Usuario with tipo_usuario='PARCEIRO' and an associated
    Parceiro record containing the provided nome_empresa, cnpj, and telefone.
    """

    def setUp(self):
        """Create an ADMIN_HED user for authentication."""
        self.admin = Usuario.objects.create_user(
            username="admin_test",
            password="Admin123!",
            email="admin@test.com",
            tipo_usuario="ADMIN_HED",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    @given(
        username=username_st,
        email=email_st,
        password=password_st,
        nome_empresa=nome_empresa_st,
        cnpj=cnpj_st,
        telefone=telefone_st,
    )
    @settings(
        max_examples=100,
        database=None,
        deadline=None,
        suppress_health_check=[HealthCheck.too_slow, HealthCheck.function_scoped_fixture],
    )
    def test_creation_produces_usuario_and_parceiro(
        self, username, email, password, nome_empresa, cnpj, telefone
    ):
        """
        Feature: admin-user-management, Property 4: Creation produces both Usuario and Parceiro
        """
        with patch("threading.Thread") as mock_thread, \
             patch("signage.views.RegisterView.throttle_classes", []):
            mock_thread.return_value.start.return_value = None

            # Use a numeric counter to guarantee uniqueness across iterations
            uid = str(uuid.uuid4().int)[:8]
            unique_username = (username + uid)[:30].lower()
            unique_email = f"{uid}.{email}"

            # Make CNPJ unique if non-empty (replace last 8 digits with numeric uid)
            unique_cnpj = cnpj
            if cnpj:
                unique_cnpj = cnpj[:6] + uid[:8]

            payload = {
                "username": unique_username,
                "email": unique_email,
                "password": password,
                "nome_empresa": nome_empresa,
                "cnpj": unique_cnpj,
                "telefone": telefone,
            }

            response = self.client.post("/api/register/", payload, format="json")

        # 1. Response is 201
        self.assertEqual(
            response.status_code,
            201,
            f"Expected 201 but got {response.status_code}: {response.data}",
        )

        # 2. A Usuario with the given username exists with tipo_usuario='PARCEIRO'
        user = Usuario.objects.get(username=unique_username)
        self.assertEqual(user.tipo_usuario, "PARCEIRO")
        self.assertEqual(user.email, unique_email)

        # 3. A Parceiro associated with that user exists with correct data
        parceiro = Parceiro.objects.get(usuario=user)
        self.assertEqual(parceiro.nome_empresa, nome_empresa)
        self.assertEqual(parceiro.cnpj, unique_cnpj)
        self.assertEqual(parceiro.telefone, telefone)

"""
Property-Based Test: Audit logging invariant.

Feature: admin-user-management, Property 9: Audit logging invariant

Validates: Requirements 7.5, 8.1, 8.2, 8.3, 8.4
"""

import string
import uuid
from unittest.mock import patch

from django.utils import timezone
from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework.test import APIClient

from signage.models import AuditoriaLog, Parceiro, Usuario


# --- Strategies ---

username_st = st.from_regex(r"[a-z0-9.,]{3,12}", fullmatch=True)

email_local_st = st.from_regex(r"[a-z0-9]{3,10}", fullmatch=True)
email_domain_st = st.from_regex(r"[a-z]{3,8}", fullmatch=True)
email_st = st.builds(
    lambda local, domain: f"{local}@{domain}.com", email_local_st, email_domain_st
)

# Password: ≥6 chars with uppercase, lowercase, digit, special char
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

cnpj_st = st.one_of(
    st.just(""),
    st.from_regex(r"[0-9]{14}", fullmatch=True),
)

telefone_st = st.one_of(
    st.just(""),
    st.from_regex(r"[0-9]{10,11}", fullmatch=True),
)


class TestAuditLoggingInvariant(TestCase):
    """
    **Validates: Requirements 7.5, 8.1, 8.2, 8.3, 8.4**

    Property 9: For any successful create, edit, or delete operation on a user,
    the system SHALL create an AuditoriaLog entry containing: a reference to the
    admin who performed the action (usuario), the admin's username as text
    (usuario_str), the correct action type (REGISTRO_PARCEIRO for create,
    EDICAO_USUARIO for edit, EXCLUSAO_USUARIO for delete), a description
    mentioning the target user's username, and an auto-generated criado_em
    timestamp.
    """

    def setUp(self):
        """Create an ADMIN_HED user for authentication."""
        self.admin, _ = Usuario.objects.get_or_create(
            username="admin_audit",
            defaults={
                "password": "placeholder",
                "email": "admin_audit@test.com",
                "tipo_usuario": "ADMIN_HED",
            },
        )
        if not self.admin.has_usable_password():
            self.admin.set_password("Admin123!")
            self.admin.save()
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
    def test_create_operation_produces_audit_log(
        self, username, email, password, nome_empresa, cnpj, telefone
    ):
        """
        Feature: admin-user-management, Property 9: Audit logging invariant

        Verifies that POST /api/register/ creates an AuditoriaLog with
        acao=REGISTRO_PARCEIRO, referencing the admin, and mentioning the
        target user's username in the description.
        """
        with patch("threading.Thread") as mock_thread, \
             patch("signage.views.RegisterView.throttle_classes", []):
            mock_thread.return_value.start.return_value = None

            uid = str(uuid.uuid4().int)[:8]
            unique_username = (username + uid)[:30].lower()
            unique_email = f"{uid}.{email}"
            unique_cnpj = cnpj
            if cnpj:
                unique_cnpj = cnpj[:6] + uid[:8]

            time_before = timezone.now()

            payload = {
                "username": unique_username,
                "email": unique_email,
                "password": password,
                "nome_empresa": nome_empresa,
                "cnpj": unique_cnpj,
                "telefone": telefone,
            }

            response = self.client.post("/api/register/", payload, format="json")

        # Only verify audit log if creation was successful
        self.assertEqual(
            response.status_code,
            201,
            f"Expected 201 but got {response.status_code}: {response.data}",
        )

        # Verify AuditoriaLog entry was created
        log = AuditoriaLog.objects.filter(
            acao="REGISTRO_PARCEIRO",
            descricao__contains=unique_username,
        ).latest("criado_em")

        # 1. Log references the admin who performed the action
        self.assertEqual(log.usuario, self.admin)

        # 2. Log contains the admin's username as text
        self.assertEqual(log.usuario_str, self.admin.username)

        # 3. Correct action type
        self.assertEqual(log.acao, "REGISTRO_PARCEIRO")

        # 4. Description mentions the target user's username
        self.assertIn(unique_username, log.descricao)

        # 5. criado_em is auto-generated and recent
        self.assertIsNotNone(log.criado_em)
        self.assertGreaterEqual(log.criado_em, time_before)

    @given(
        new_email=email_st,
        new_nome_empresa=nome_empresa_st,
        new_cnpj=cnpj_st,
        new_telefone=telefone_st,
    )
    @settings(
        max_examples=100,
        database=None,
        deadline=None,
        suppress_health_check=[HealthCheck.too_slow, HealthCheck.function_scoped_fixture],
    )
    def test_edit_operation_produces_audit_log(
        self, new_email, new_nome_empresa, new_cnpj, new_telefone
    ):
        """
        Feature: admin-user-management, Property 9: Audit logging invariant

        Verifies that PATCH /api/usuarios/:id/ creates an AuditoriaLog with
        acao=EDICAO_USUARIO, referencing the admin, and mentioning the
        target user's username in the description.
        """
        # Create a target user for editing
        uid = str(uuid.uuid4().int)[:8]
        target_username = f"target{uid}"[:30]
        target_user = Usuario.objects.create_user(
            username=target_username,
            email=f"{uid}@edit.com",
            password="Pass123!",
            tipo_usuario="PARCEIRO",
        )
        Parceiro.objects.create(
            usuario=target_user,
            nome_empresa="Empresa Original",
            cnpj=None,
            telefone=None,
        )

        # Make email and CNPJ unique
        unique_email = f"{uid}.{new_email}"
        unique_cnpj = new_cnpj
        if new_cnpj:
            unique_cnpj = new_cnpj[:6] + uid[:8]

        time_before = timezone.now()

        payload = {
            "email": unique_email,
            "nome_empresa": new_nome_empresa,
            "cnpj": unique_cnpj,
            "telefone": new_telefone,
        }

        response = self.client.patch(
            f"/api/usuarios/{target_user.id}/", payload, format="json"
        )

        # Only verify audit log if update was successful
        self.assertEqual(
            response.status_code,
            200,
            f"Expected 200 but got {response.status_code}: {response.data}",
        )

        # Verify AuditoriaLog entry was created
        log = AuditoriaLog.objects.filter(
            acao="EDICAO_USUARIO",
            descricao__contains=target_username,
        ).latest("criado_em")

        # 1. Log references the admin who performed the action
        self.assertEqual(log.usuario, self.admin)

        # 2. Log contains the admin's username as text
        self.assertEqual(log.usuario_str, self.admin.username)

        # 3. Correct action type
        self.assertEqual(log.acao, "EDICAO_USUARIO")

        # 4. Description mentions the target user's username
        self.assertIn(target_username, log.descricao)

        # 5. criado_em is auto-generated and recent
        self.assertIsNotNone(log.criado_em)
        self.assertGreaterEqual(log.criado_em, time_before)

    @given(
        username=username_st,
        nome_empresa=nome_empresa_st,
    )
    @settings(
        max_examples=100,
        database=None,
        deadline=None,
        suppress_health_check=[HealthCheck.too_slow, HealthCheck.function_scoped_fixture],
    )
    def test_delete_operation_produces_audit_log(self, username, nome_empresa):
        """
        Feature: admin-user-management, Property 9: Audit logging invariant

        Verifies that DELETE /api/usuarios/:id/ creates an AuditoriaLog with
        acao=EXCLUSAO_USUARIO, referencing the admin, and mentioning the
        target user's username in the description.
        """
        # Create a target user for deletion
        uid = str(uuid.uuid4().int)[:8]
        target_username = (username + uid)[:30].lower()
        target_user = Usuario.objects.create_user(
            username=target_username,
            email=f"{uid}@delete.com",
            password="Pass123!",
            tipo_usuario="PARCEIRO",
        )
        Parceiro.objects.create(
            usuario=target_user,
            nome_empresa=nome_empresa,
            cnpj=None,
            telefone=None,
        )

        time_before = timezone.now()

        response = self.client.delete(f"/api/usuarios/{target_user.id}/")

        # Only verify audit log if deletion was successful
        self.assertEqual(
            response.status_code,
            204,
            f"Expected 204 but got {response.status_code}",
        )

        # Verify AuditoriaLog entry was created
        log = AuditoriaLog.objects.filter(
            acao="EXCLUSAO_USUARIO",
            descricao__contains=target_username,
        ).latest("criado_em")

        # 1. Log references the admin who performed the action
        self.assertEqual(log.usuario, self.admin)

        # 2. Log contains the admin's username as text
        self.assertEqual(log.usuario_str, self.admin.username)

        # 3. Correct action type
        self.assertEqual(log.acao, "EXCLUSAO_USUARIO")

        # 4. Description mentions the target user's username
        self.assertIn(target_username, log.descricao)

        # 5. criado_em is auto-generated and recent
        self.assertIsNotNone(log.criado_em)
        self.assertGreaterEqual(log.criado_em, time_before)

import re

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from signage.models import AuditoriaLog
from signage.services.email_service import EmailService
from signage.services.token_manager import TokenManager
from signage.throttles import PasswordResetEmailThrottle, PasswordResetIPThrottle

Usuario = get_user_model()


class PasswordResetRequestView(APIView):
    """
    POST /api/password-reset/request/

    Accepts {email} and sends a password reset email if the email exists.
    Always returns the same response regardless of whether the email exists
    (anti-enumeration protection).
    """

    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetEmailThrottle, PasswordResetIPThrottle]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()

        if not email:
            return Response(
                {"message": "Instruções enviadas para o e-mail informado."},
                status=status.HTTP_200_OK,
            )

        # Send email in background to avoid blocking the response
        import threading

        def _send_reset_background(email_addr):
            try:
                user = Usuario.objects.get(email=email_addr)
                token_manager = TokenManager()
                token_str = token_manager.generate_token(user)

                email_service = EmailService()
                email_service.send_reset_email(user, token_str)
            except Usuario.DoesNotExist:
                pass
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(
                    "Erro ao enviar e-mail de reset em background para %s: %s",
                    email_addr, str(e)
                )

        email_thread = threading.Thread(
            target=_send_reset_background,
            args=(email,),
            daemon=True,
        )
        email_thread.start()

        # Always return the same response (anti-enumeration)
        return Response(
            {"message": "Instruções enviadas para o e-mail informado."},
            status=status.HTTP_200_OK,
        )

    def throttled(self, request, wait):
        """
        Override to provide a user-friendly anti-enumeration message on 429.
        DRF automatically includes the Retry-After header from the wait parameter.
        """
        from rest_framework.exceptions import Throttled

        detail = "Muitas tentativas. Aguarde antes de tentar novamente."
        raise Throttled(wait=wait, detail=detail)


class ValidateResetTokenView(APIView):
    """
    GET /api/password-reset/validate-token/?token=xxx

    Validates a password reset token and returns its validity status.
    Returns {valid: true} if the token is valid, or {valid: false, reason: '...'}
    with the appropriate reason ('expired', 'used', or 'invalid').
    """

    permission_classes = [AllowAny]

    def get(self, request):
        token_str = request.query_params.get("token", "")

        if not token_str:
            return Response(
                {"valid": False, "reason": "invalid"},
                status=status.HTTP_200_OK,
            )

        token_manager = TokenManager()
        is_valid, reason, user = token_manager.validate_token(token_str)

        if is_valid:
            return Response({"valid": True}, status=status.HTTP_200_OK)

        return Response(
            {"valid": False, "reason": reason},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """
    POST /api/password-reset/confirm/

    Accepts {token, password, password_confirm}.
    Validates the token, validates the new password against Politica_Senha,
    updates the user's password, marks the token as used, and logs
    SENHA_REDEFINIDA to AuditoriaLog.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get("token", "")
        password = request.data.get("password", "")
        password_confirm = request.data.get("password_confirm", "")

        # Validate token
        token_manager = TokenManager()
        is_valid, reason, user = token_manager.validate_token(token_str)

        if not is_valid:
            error_messages = {
                "expired": "Este link expirou. Solicite uma nova redefinição de senha.",
                "used": "Este link já foi utilizado. Solicite uma nova redefinição de senha.",
                "invalid": "Link inválido. Solicite uma nova redefinição de senha.",
            }
            return Response(
                {"error": error_messages.get(reason, error_messages["invalid"]), "reason": reason},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate password confirmation match
        if password != password_confirm:
            return Response(
                {"field_errors": {"password_confirm": "As senhas não coincidem."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate password against Politica_Senha
        password_errors = self._validate_password(password)
        if password_errors:
            return Response(
                {"field_errors": {"password": password_errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update user password
        user.set_password(password)
        user.save()

        # Mark token as used
        token_manager.mark_used(token_str)

        # Log SENHA_REDEFINIDA to AuditoriaLog
        AuditoriaLog.objects.create(
            usuario=user,
            usuario_str=user.username,
            acao="SENHA_REDEFINIDA",
            descricao=f"Senha redefinida com sucesso para o usuário '{user.username}'.",
        )

        return Response(
            {"message": "Senha redefinida com sucesso."},
            status=status.HTTP_200_OK,
        )

    def _validate_password(self, password: str) -> list[str]:
        """
        Validate password against Politica_Senha rules.
        Returns a list of error messages for each unmet rule.
        """
        errors = []

        if len(password) < 6:
            errors.append("A senha deve ter no mínimo 6 caracteres.")
        if not re.search(r"[A-Z]", password):
            errors.append("A senha deve conter pelo menos uma letra maiúscula.")
        if not re.search(r"[a-z]", password):
            errors.append("A senha deve conter pelo menos uma letra minúscula.")
        if not re.search(r"[0-9]", password):
            errors.append("A senha deve conter pelo menos um número.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("A senha deve conter pelo menos um caractere especial.")

        return errors

import secrets

from django.utils import timezone

from signage.models import PasswordResetToken, Usuario


class TokenManager:
    """Handles creation, validation, and invalidation of password reset tokens."""

    TOKEN_EXPIRY_MINUTES = 30

    def generate_token(self, user: Usuario) -> str:
        """
        Generate a new reset token, invalidating any existing ones for this user.

        Existing unused/unexpired tokens for the user are invalidated (marked as used)
        before creating a new token.
        """
        # Invalidate all existing unused tokens for this user
        PasswordResetToken.objects.filter(
            user=user,
            is_used=False,
        ).update(is_used=True, used_at=timezone.now())

        # Generate a new cryptographically secure token
        token_str = secrets.token_urlsafe(48)

        PasswordResetToken.objects.create(
            user=user,
            token=token_str,
        )

        return token_str

    def validate_token(self, token_str: str) -> tuple[bool, str, Usuario | None]:
        """
        Validate a token string.

        Returns (is_valid, error_reason, user).
        error_reason: 'expired' | 'used' | 'invalid' | ''
        """
        try:
            token_obj = PasswordResetToken.objects.select_related("user").get(
                token=token_str
            )
        except PasswordResetToken.DoesNotExist:
            return (False, "invalid", None)

        if token_obj.is_used:
            return (False, "used", token_obj.user)

        if token_obj.is_expired:
            return (False, "expired", token_obj.user)

        return (True, "", token_obj.user)

    def mark_used(self, token_str: str) -> None:
        """Mark a token as used after successful password reset."""
        PasswordResetToken.objects.filter(token=token_str).update(
            is_used=True,
            used_at=timezone.now(),
        )

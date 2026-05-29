from rest_framework.throttling import SimpleRateThrottle


class PasswordResetEmailThrottle(SimpleRateThrottle):
    """Limits reset requests to 3 per email per hour."""

    rate = '3/hour'

    def get_cache_key(self, request, view):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return None
        return f'password_reset_email_{email}'


class PasswordResetIPThrottle(SimpleRateThrottle):
    """Limits reset requests to 10 per IP per hour."""

    rate = '10/hour'

    def get_cache_key(self, request, view):
        return self.get_ident(request)

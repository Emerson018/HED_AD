from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

Usuario = get_user_model()


class EmailOrUsernameBackend(ModelBackend):
    """
    Backend de autenticação que permite login com username ou email.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None

        # Tenta buscar pelo username primeiro
        try:
            user = Usuario.objects.get(username=username)
        except Usuario.DoesNotExist:
            # Se não encontrou pelo username, tenta pelo email
            try:
                user = Usuario.objects.get(email__iexact=username)
            except Usuario.DoesNotExist:
                return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

from django.apps import AppConfig

class SignageConfig(AppConfig):
    name = 'signage'

    def ready(self):
        # Criação automatizada e self-healing do superusuário admin nos dois bancos
        try:
            from django.contrib.auth import get_user_model
            Usuario = get_user_model()
            
            for db_alias in ['default', 'supabase']:
                try:
                    if not Usuario.objects.using(db_alias).filter(username='emerson.lima').exists():
                        Usuario.objects.using(db_alias).create_superuser(
                            username='emerson.lima',
                            password='admin123',
                            email='emerson.lima@hed.com.br',
                            tipo_usuario='ADMIN_HED'
                        )
                        print(f"[SignageConfig] Superusuário 'emerson.lima' garantido com sucesso no banco '{db_alias}'!")
                except Exception as e:
                    # Pode falhar se as migrations ainda não foram executadas, o que é normal na primeira vez
                    pass
        except Exception:
            pass

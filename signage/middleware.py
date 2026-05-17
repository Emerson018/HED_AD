from django.utils.deprecation import MiddlewareMixin
from .db_router import set_active_db

class DatabaseSelectorMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Lê o cabeçalho personalizado enviado pelo frontend
        # Ex: "local" ou "supabase"
        active_db = request.headers.get('X-Active-DB', 'supabase')
        
        # Mapeia para as chaves reais do DATABASES do settings.py
        if active_db == 'local':
            set_active_db('default')
        else:
            set_active_db('supabase')

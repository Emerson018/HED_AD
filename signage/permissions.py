from rest_framework import permissions

class IsAdminOuDonoDaCampanha(permissions.BasePermission):
    """
    Permissão customizada para permitir que o ADMIN_HED edite e veja qualquer campanha,
    mas o PARCEIRO só possa ver e editar suas próprias campanhas.
    """
    
    def has_permission(self, request, view):
        # Todos precisam estar autenticados
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # Admin ou Superuser tem acesso total
        user = request.user
        if user.is_superuser or (hasattr(user, 'tipo_usuario') and user.tipo_usuario == 'ADMIN_HED'):
            return True
            
        # Verifica se o usuário é o dono (Parceiro associado)
        if hasattr(obj, 'parceiro'):
            return obj.parceiro.usuario == user
            
        # O objeto obj pode ser um Parceiro
        if hasattr(obj, 'usuario'):
            return obj.usuario == user
            
        return False

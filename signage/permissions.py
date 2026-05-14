from rest_framework import permissions

class IsAdminOuDonoDaCampanha(permissions.BasePermission):
    """
    Permissão customizada para permitir que o ADMIN_HED edite e veja qualquer campanha,
    mas o PARCEIRO só possa ver e editar suas próprias campanhas.
    """
    
    def has_permission(self, request, view):
        # Todos precisam estar autenticados
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Admin tem acesso total
        if hasattr(request.user, 'tipo_usuario') and request.user.tipo_usuario == 'ADMIN_HED':
            return True
            
        # Verifica se o usuário é o dono (Parceiro associado)
        # O objeto obj pode ser uma Campanha
        if hasattr(obj, 'parceiro'):
            return obj.parceiro.usuario == request.user
            
        # O objeto obj pode ser um Parceiro
        if hasattr(obj, 'usuario'):
            return obj.usuario == request.user
            
        return False

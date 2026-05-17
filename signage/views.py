from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Parceiro, Campanha, Midia, Agendamento, CampanhaLog, AuditoriaLog
import datetime
from .serializers import (
    UsuarioSerializer, 
    ParceiroSerializer, 
    CampanhaSerializer, 
    MidiaSerializer, 
    AgendamentoSerializer,
    AuditoriaLogSerializer
)
from .permissions import IsAdminOuDonoDaCampanha
from django.db.models import Q
from rest_framework_simplejwt.views import TokenObtainPairView

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)


Usuario = get_user_model()

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

class ParceiroViewSet(viewsets.ModelViewSet):
    queryset = Parceiro.objects.all()
    serializer_class = ParceiroSerializer
    permission_classes = [permissions.IsAuthenticated]

class CampanhaViewSet(viewsets.ModelViewSet):
    serializer_class = CampanhaSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOuDonoDaCampanha]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or (hasattr(user, 'tipo_usuario') and user.tipo_usuario == 'ADMIN_HED'):
            return Campanha.objects.all()
        # Se for Parceiro, retorna só as campanhas do perfil vinculado a ele
        if hasattr(user, 'perfil_parceiro'):
            return Campanha.objects.filter(parceiro=user.perfil_parceiro)
        return Campanha.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'perfil_parceiro'):
            campanha = serializer.save(parceiro=user.perfil_parceiro)
        else:
            campanha = serializer.save()
        
        AuditoriaLog.objects.create(
            usuario=user,
            usuario_str=user.username,
            acao='CAMPANHA_CRIACAO',
            descricao=f"Criou a campanha '{campanha.nome}' (ID: {campanha.id}) no turno {campanha.turno}."
        )

    def perform_update(self, serializer):
        user = self.request.user
        old_instance = self.get_object()
        old_status = old_instance.status
        
        campanha = serializer.save()
        
        # Log se o status mudou (ex: aprovada, pausada)
        if old_status != campanha.status:
            if campanha.status == 'APROVADA':
                acao = 'CAMPANHA_APROVACAO'
                desc = f"Aprovou a campanha '{campanha.nome}' (ID: {campanha.id})."
            elif campanha.status == 'PAUSADA':
                acao = 'CAMPANHA_PAUSA'
                desc = f"Pausou a campanha '{campanha.nome}' (ID: {campanha.id})."
            else:
                acao = 'CAMPANHA_PAUSA'
                desc = f"Alterou o status da campanha '{campanha.nome}' (ID: {campanha.id}) para {campanha.status}."
            
            AuditoriaLog.objects.create(
                usuario=user,
                usuario_str=user.username,
                acao=acao,
                descricao=desc
            )
        else:
            AuditoriaLog.objects.create(
                usuario=user,
                usuario_str=user.username,
                acao='CAMPANHA_CRIACAO',
                descricao=f"Atualizou os dados da campanha '{campanha.nome}' (ID: {campanha.id})."
            )

    def perform_destroy(self, instance):
        user = self.request.user
        campanha_nome = instance.nome
        campanha_id = instance.id
        instance.delete()
        
        AuditoriaLog.objects.create(
            usuario=user,
            usuario_str=user.username,
            acao='CAMPANHA_EXCLUSAO',
            descricao=f"Excluiu a campanha '{campanha_nome}' (ID: {campanha_id})."
        )

class MidiaViewSet(viewsets.ModelViewSet):
    queryset = Midia.objects.all()
    serializer_class = MidiaSerializer
    permission_classes = [permissions.IsAuthenticated]

class AgendamentoViewSet(viewsets.ModelViewSet):
    queryset = Agendamento.objects.all()
    serializer_class = AgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

class TVPlaylistView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        now = datetime.datetime.now().time()
        
        # Determina o turno atual
        if datetime.time(7, 0) <= now < datetime.time(12, 0):
            turno_atual = 'MANHA'
        elif datetime.time(12, 0) <= now < datetime.time(18, 0):
            turno_atual = 'TARDE'
        else:
            turno_atual = 'NOITE'

        # Filtra campanhas aprovadas para o turno atual ou Integrais
        campanhas_ativas = Campanha.objects.filter(
            status='APROVADA'
        ).filter(
            Q(turno=turno_atual) | Q(turno='INTEGRAL')
        )
        
        serializer = CampanhaSerializer(campanhas_ativas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class PlayerLogView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        campanha_id = request.data.get('campanha_id')
        try:
            campanha = Campanha.objects.get(id=campanha_id)
            CampanhaLog.objects.create(campanha=campanha)
            return Response({"status": "log gravado"}, status=status.HTTP_201_CREATED)
        except Campanha.DoesNotExist:
            return Response({"error": "Campanha não encontrada"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data
        try:
            # 1. Criar o Usuário
            user = Usuario.objects.create_user(
                username=data['username'],
                password=data['password'],
                email=data.get('email', ''),
                tipo_usuario='PARCEIRO'
            )
            
            # 2. Criar o Perfil de Parceiro associado
            parceiro = Parceiro.objects.create(
                usuario=user,
                nome_empresa=data['nome_empresa'],
                cnpj=data.get('cnpj', ''),
                telefone=data.get('telefone', '')
            )
            
            # Gravar Log de Auditoria
            AuditoriaLog.objects.create(
                usuario=user,
                usuario_str=user.username,
                acao='REGISTRO_PARCEIRO',
                descricao=f"Novo parceiro cadastrado: '{parceiro.nome_empresa}' (ID Usuário: {user.id})."
            )

            return Response({"message": "Usuário criado com sucesso!"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AuditedTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        try:
            response = super().post(request, *args, **kwargs)
            # Se chegou aqui, login deu certo
            user = get_user_model().objects.get(username=username)
            AuditoriaLog.objects.create(
                usuario=user,
                usuario_str=username,
                acao='LOGIN_SUCESSO',
                descricao=f"Usuário '{username}' autenticou-se com sucesso no painel."
            )
            return response
        except Exception as e:
            # Login falhou
            AuditoriaLog.objects.create(
                usuario=None,
                usuario_str=username or "desconhecido",
                acao='LOGIN_FALHA',
                descricao=f"Tentativa de login malsucedida para o usuário '{username}'. Erro: {str(e)}"
            )
            raise e

class AuditoriaLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditoriaLog.objects.all().order_by('-criado_em')
    serializer_class = AuditoriaLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Apenas admins podem ver logs do sistema
        if user.is_superuser or (hasattr(user, 'tipo_usuario') and user.tipo_usuario == 'ADMIN_HED'):
            return AuditoriaLog.objects.all().order_by('-criado_em')
        return AuditoriaLog.objects.none()

class DatabaseSelectorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Apenas admins podem ler/ver o status do banco de dados
        user = request.user
        if not (user.is_superuser or (hasattr(user, 'tipo_usuario') and user.tipo_usuario == 'ADMIN_HED')):
            return Response({"error": "Acesso negado"}, status=status.HTTP_403_FORBIDDEN)
        
        # Lê o banco atualmente selecionado no servidor
        from .db_router import get_active_db
        db = get_active_db()
        active_name = 'local' if db == 'default' else 'supabase'
        return Response({"active_db": active_name}, status=status.HTTP_200_OK)

    def post(self, request):
        # Apenas admins podem alterar o banco de dados ativo no servidor
        user = request.user
        if not (user.is_superuser or (hasattr(user, 'tipo_usuario') and user.tipo_usuario == 'ADMIN_HED')):
            return Response({"error": "Acesso negado"}, status=status.HTTP_403_FORBIDDEN)
        
        new_db = request.data.get('database') # 'local' ou 'supabase'
        if new_db not in ('local', 'supabase'):
            return Response({"error": "Banco inválido"}, status=status.HTTP_400_BAD_REQUEST)
        
        from .db_router import set_active_db
        mapped_db = 'default' if new_db == 'local' else 'supabase'
        set_active_db(mapped_db)
        
        # Grava log na auditoria do banco recém-selecionado para deixar registrado!
        # Passamos usuario=None para evitar erros de Foreign Key / Database Alias mismatch entre bancos.
        AuditoriaLog.objects.create(
            usuario=None,
            usuario_str=user.username,
            acao='LOGIN_SUCESSO',
            descricao=f"Alterou o banco de dados ativo de todo o sistema para: '{new_db.upper()}'."
        )

        return Response({"message": f"Banco de dados alterado para {new_db} com sucesso!"}, status=status.HTTP_200_OK)

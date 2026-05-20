from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework.throttling import ScopedRateThrottle
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
from django.db.models import Q, Count
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
            return Campanha.objects.select_related('parceiro').prefetch_related('midias', 'agendamentos').annotate(
                num_exibicoes=Count('logs')
            )
        # Se for Parceiro, retorna só as campanhas do perfil vinculado a ele
        if hasattr(user, 'perfil_parceiro'):
            return Campanha.objects.filter(parceiro=user.perfil_parceiro).select_related('parceiro').prefetch_related('midias', 'agendamentos').annotate(
                num_exibicoes=Count('logs')
            )
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
            descricao=f"Criou a campanha '{campanha.nome}' (ID: {campanha.id}) nos turnos {', '.join(campanha.turnos or [])}."
        )

    def perform_update(self, serializer):
        user = self.request.user
        old_instance = self.get_object()
        old_status = old_instance.status
        
        is_parceiro = hasattr(user, 'tipo_usuario') and user.tipo_usuario == 'PARCEIRO'
        
        if is_parceiro:
            # 1. Se a campanha não estiver pendente (ou seja, status != 'EM_ANALISE'), parceiro não pode alterar as datas
            if old_status != 'EM_ANALISE':
                for field in ['data_inicio', 'data_fim']:
                    if field in serializer.validated_data:
                        old_val = getattr(old_instance, field)
                        new_val = serializer.validated_data[field]
                        old_str = old_val.strftime('%Y-%m-%d') if hasattr(old_val, 'strftime') else str(old_val)
                        new_str = new_val.strftime('%Y-%m-%d') if hasattr(new_val, 'strftime') else str(new_val)
                        if old_str != new_str:
                            from rest_framework.exceptions import ValidationError
                            raise ValidationError({field: "Você não pode alterar as datas de uma campanha aprovada/ativa. Entre em contato com o suporte ou administrador."})

            # 2. Se for Parceiro, força o status a retornar para 'EM_ANALISE' apenas se alterou outros campos além de nome/categoria
            needs_review = False
            for field in ['duracao', 'turnos', 'dias_semana', 'data_inicio', 'data_fim', 'is_institucional']:
                if field in serializer.validated_data:
                    old_val = getattr(old_instance, field)
                    new_val = serializer.validated_data[field]
                    
                    if field in ['turnos', 'dias_semana']:
                        if set(old_val or []) != set(new_val or []):
                            needs_review = True
                            break
                    elif field in ['data_inicio', 'data_fim']:
                        old_str = old_val.strftime('%Y-%m-%d') if hasattr(old_val, 'strftime') else str(old_val)
                        new_str = new_val.strftime('%Y-%m-%d') if hasattr(new_val, 'strftime') else str(new_val)
                        if old_str != new_str:
                            needs_review = True
                            break
                    else:
                        if old_val != new_val:
                            needs_review = True
                            break
            
            if needs_review:
                campanha = serializer.save(status='EM_ANALISE')
            else:
                campanha = serializer.save(status=old_status)
        else:
            campanha = serializer.save()
        
        # Log se o status mudou (ex: aprovada, pausada, ou de volta para análise)
        if old_status != campanha.status:
            if campanha.status == 'APROVADA':
                acao = 'CAMPANHA_APROVACAO'
                desc = f"Aprovou a campanha '{campanha.nome}' (ID: {campanha.id})."
            elif campanha.status == 'PAUSADA':
                acao = 'CAMPANHA_PAUSA'
                desc = f"Pausou a campanha '{campanha.nome}' (ID: {campanha.id})."
            elif campanha.status == 'EM_ANALISE':
                acao = 'CAMPANHA_EDICAO'
                desc = f"Atualizou a campanha '{campanha.nome}' (ID: {campanha.id}) - Status retornado para Pendente para revisão."
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
                acao='CAMPANHA_EDICAO',
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

    def perform_create(self, serializer):
        midia = serializer.save()
        user = self.request.user
        is_parceiro = hasattr(user, 'tipo_usuario') and user.tipo_usuario == 'PARCEIRO'
        if is_parceiro:
            campanha = midia.campanha
            campanha.status = 'EM_ANALISE'
            campanha.save()

    def perform_update(self, serializer):
        midia = serializer.save()
        user = self.request.user
        is_parceiro = hasattr(user, 'tipo_usuario') and user.tipo_usuario == 'PARCEIRO'
        if is_parceiro:
            campanha = midia.campanha
            campanha.status = 'EM_ANALISE'
            campanha.save()

class AgendamentoViewSet(viewsets.ModelViewSet):
    queryset = Agendamento.objects.all()
    serializer_class = AgendamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

class TVPlaylistView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        turno_param = request.query_params.get('turno')
        
        if turno_param in ['MANHA', 'TARDE', 'NOITE', 'MADRUGADA']:
            turno_atual = turno_param
        else:
            now = datetime.datetime.now().time()
            # Determina o turno atual
            if datetime.time(6, 0) <= now < datetime.time(12, 0):
                turno_atual = 'MANHA'
            elif datetime.time(12, 0) <= now < datetime.time(18, 0):
                turno_atual = 'TARDE'
            elif datetime.time(18, 0) <= now <= datetime.time(23, 59, 59):
                turno_atual = 'NOITE'
            else:
                turno_atual = 'MADRUGADA'

        # Filtra campanhas aprovadas ou ativas (mesma lógica do simulador)
        campanhas_hoje = Campanha.objects.filter(
            status__in=['APROVADA', 'ATIVA']
        ).select_related('parceiro').prefetch_related('midias', 'agendamentos')
        
        # Filtra pelo turno selecionado/atual
        campanhas_ativas = []
        for c in campanhas_hoje:
            turnos_list = c.turnos or []
            if turno_atual in turnos_list:
                campanhas_ativas.append(c)
        
        # Separa as comerciais das institucionais
        comerciais = [c for c in campanhas_ativas if not c.is_institucional]
        institucionais = [c for c in campanhas_ativas if c.is_institucional]
        
        # Lógica de preenchimento de tempo remanescente (Tapa-buracos)
        tempo_ocupado = sum(c.duracao for c in comerciais)
        tempo_livre = max(0, 300 - tempo_ocupado)
        
        institucionais_selecionados = []
        tempo_acumulado_institucional = 0
        for c in institucionais:
            if tempo_acumulado_institucional + c.duracao <= tempo_livre:
                institucionais_selecionados.append(c)
                tempo_acumulado_institucional += c.duracao
        
        # Lista final estática: Comerciais primeiro, depois Institucionais Selecionados
        playlist_final = comerciais + institucionais_selecionados
        
        serializer = CampanhaSerializer(playlist_final, many=True)
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
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'

    def post(self, request):
        data = request.data
        errors = {}

        # Sanitizar e padronizar entradas
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        nome_empresa = data.get('nome_empresa', '').strip()
        cnpj = data.get('cnpj', '').strip()
        telefone = data.get('telefone', '').strip()

        # Validação do Nome de Usuário
        if not username:
            errors['username'] = 'O nome de usuário é obrigatório.'
        elif len(username) < 3:
            errors['username'] = 'O usuário deve ter pelo menos 3 caracteres.'
        elif Usuario.objects.filter(username=username).exists():
            errors['username'] = 'Este nome de usuário já está em uso.'

        # Validação do Email
        if not email:
            errors['email'] = 'O e-mail é obrigatório.'
        elif Usuario.objects.filter(email=email).exists():
            errors['email'] = 'Este e-mail já está em uso.'

        # Validação da Senha
        if not password:
            errors['password'] = 'A senha é obrigatória.'
        else:
            import re
            if len(password) < 6:
                errors['password'] = 'A senha deve ter no mínimo 6 caracteres.'
            if not re.search(r'[A-Z]', password):
                errors['password'] = 'A senha deve conter pelo menos uma letra maiúscula.'
            if not re.search(r'[a-z]', password):
                errors['password'] = 'A senha deve conter pelo menos uma letra minúscula.'
            if not re.search(r'[0-9]', password):
                errors['password'] = 'A senha deve conter pelo menos um número.'
            if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
                errors['password'] = 'A senha deve conter pelo menos um caractere especial.'

        # Validação da Empresa
        if not nome_empresa:
            errors['nome_empresa'] = 'O nome da empresa é obrigatório.'

        # Validação de CNPJ único
        if cnpj:
            import re
            clean_cnpj = re.sub(r'\D', '', cnpj)
            # Buscar no banco batendo o valor mascarado ou limpo
            if Parceiro.objects.filter(Q(cnpj=cnpj) | Q(cnpj=clean_cnpj)).exists():
                errors['cnpj'] = 'Este CNPJ já está cadastrado por outro parceiro.'

        if errors:
            return Response({"field_errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Criar o Usuário
            user = Usuario.objects.create_user(
                username=username,
                password=password,
                email=email,
                tipo_usuario='PARCEIRO'
            )
            
            # 2. Criar o Perfil de Parceiro associado
            parceiro = Parceiro.objects.create(
                usuario=user,
                nome_empresa=nome_empresa,
                cnpj=cnpj,
                telefone=telefone
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
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

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

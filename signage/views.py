from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Parceiro, Campanha, Midia, Agendamento, CampanhaLog
import datetime
from .serializers import (
    UsuarioSerializer, 
    ParceiroSerializer, 
    CampanhaSerializer, 
    MidiaSerializer, 
    AgendamentoSerializer
)
from .permissions import IsAdminOuDonoDaCampanha
from django.db.models import Q

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
            serializer.save(parceiro=user.perfil_parceiro)
        else:
            # Caso o ADMIN_HED tente criar, teríamos que exigir o parceiro no payload.
            # Por hora, como o fluxo é o Parceiro criando, salvaremos normalmente.
            serializer.save()

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
            Parceiro.objects.create(
                usuario=user,
                nome_empresa=data['nome_empresa'],
                cnpj=data.get('cnpj', ''),
                telefone=data.get('telefone', '')
            )
            
            return Response({"message": "Usuário criado com sucesso!"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

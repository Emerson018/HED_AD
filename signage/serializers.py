from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Parceiro, Campanha, Midia, Agendamento, AuditoriaLog

Usuario = get_user_model()

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'tipo_usuario', 'is_superuser', 'is_staff', 'first_name', 'last_name']

class ParceiroSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)

    class Meta:
        model = Parceiro
        fields = ['id', 'usuario', 'nome_empresa', 'cnpj', 'telefone', 'criado_em', 'atualizado_em']

class MidiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Midia
        fields = ['id', 'campanha', 'tipo', 'arquivo_url', 'criado_em']

class AgendamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agendamento
        fields = ['id', 'campanha', 'dias_semana', 'horario_inicio', 'horario_fim', 'duracao_segundos']

class CampanhaSerializer(serializers.ModelSerializer):
    midias = MidiaSerializer(many=True, read_only=True)
    agendamentos = AgendamentoSerializer(many=True, read_only=True)
    parceiro = serializers.PrimaryKeyRelatedField(read_only=True)
    parceiro_nome = serializers.CharField(source='parceiro.nome_empresa', read_only=True)
    total_exibicoes = serializers.SerializerMethodField()

    class Meta:
        model = Campanha
        fields = [
            'id', 'parceiro', 'parceiro_nome', 'nome', 'status', 
            'duracao', 'turnos', 'categoria', 'total_exibicoes',
            'data_inicio', 'data_fim', 'midias', 'agendamentos', 
            'dias_semana', 'is_institucional', 'tvs', 'criado_em', 'atualizado_em'
        ]

    def get_total_exibicoes(self, obj):
        if hasattr(obj, 'num_exibicoes'):
            return obj.num_exibicoes
        return obj.logs.count()

class UsuarioDetailSerializer(serializers.ModelSerializer):
    nome_empresa = serializers.CharField(source='perfil_parceiro.nome_empresa', read_only=True)
    cnpj = serializers.CharField(source='perfil_parceiro.cnpj', read_only=True)
    telefone = serializers.CharField(source='perfil_parceiro.telefone', read_only=True)
    criado_em = serializers.DateTimeField(source='perfil_parceiro.criado_em', read_only=True)
    total_campanhas = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'tipo_usuario', 'nome_empresa', 'cnpj', 'telefone', 'criado_em', 'total_campanhas']

    def get_total_campanhas(self, obj):
        if hasattr(obj, 'perfil_parceiro'):
            return obj.perfil_parceiro.campanhas.count()
        return 0


class UsuarioUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=False, allow_blank=True)
    nome_empresa = serializers.CharField(required=True, min_length=3, max_length=150)
    cnpj = serializers.CharField(required=False, allow_blank=True)
    telefone = serializers.CharField(required=False, allow_blank=True)


class AuditoriaLogSerializer(serializers.ModelSerializer):
    acao_display = serializers.CharField(source='get_acao_display', read_only=True)
    class Meta:
        model = AuditoriaLog
        fields = ['id', 'usuario', 'usuario_str', 'acao', 'acao_display', 'descricao', 'criado_em']

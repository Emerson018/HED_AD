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
            'duracao', 'turno', 'categoria', 'total_exibicoes',
            'data_inicio', 'data_fim', 'midias', 'agendamentos', 
            'criado_em', 'atualizado_em'
        ]

    def get_total_exibicoes(self, obj):
        return obj.logs.count()

class AuditoriaLogSerializer(serializers.ModelSerializer):
    acao_display = serializers.CharField(source='get_acao_display', read_only=True)
    class Meta:
        model = AuditoriaLog
        fields = ['id', 'usuario', 'usuario_str', 'acao', 'acao_display', 'descricao', 'criado_em']

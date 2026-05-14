from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Parceiro, Campanha, Midia, Agendamento

Usuario = get_user_model()

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'tipo_usuario', 'first_name', 'last_name']

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

    class Meta:
        model = Campanha
        fields = ['id', 'parceiro', 'nome', 'status', 'data_inicio', 'data_fim', 'midias', 'agendamentos', 'criado_em', 'atualizado_em']

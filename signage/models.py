from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    TIPO_USUARIO_CHOICES = (
        ('ADMIN_HED', 'Administrador HED'),
        ('PARCEIRO', 'Parceiro'),
    )
    tipo_usuario = models.CharField(max_length=20, choices=TIPO_USUARIO_CHOICES, default='PARCEIRO')

    def __str__(self):
        return f"{self.username} ({self.get_tipo_usuario_display()})"

class Parceiro(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='perfil_parceiro')
    nome_empresa = models.CharField(max_length=150)
    cnpj = models.CharField(max_length=18, unique=True, null=True, blank=True)
    telefone = models.CharField(max_length=20, null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome_empresa

class Campanha(models.Model):
    STATUS_CHOICES = (
        ('EM_ANALISE', 'Em Análise'),
        ('APROVADA', 'Aprovada'),
        ('ATIVA', 'Ativa'),
        ('PAUSADA', 'Pausada'),
    )
    parceiro = models.ForeignKey(Parceiro, on_delete=models.CASCADE, related_name='campanhas')
    nome = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EM_ANALISE')
    data_inicio = models.DateField()
    data_fim = models.DateField()
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome

class Midia(models.Model):
    TIPO_CHOICES = (
        ('VIDEO', 'Vídeo (MP4)'),
        ('IMAGEM', 'Imagem'),
    )
    campanha = models.ForeignKey(Campanha, on_delete=models.CASCADE, related_name='midias')
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='VIDEO')
    arquivo_url = models.URLField(max_length=500, help_text="URL do arquivo no Supabase Storage")
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Mídia da {self.campanha.nome}"

class Agendamento(models.Model):
    campanha = models.ForeignKey(Campanha, on_delete=models.CASCADE, related_name='agendamentos')
    # Pode armazenar algo como "[0, 1, 2, 3, 4]" onde 0=Segunda, 6=Domingo
    dias_semana = models.JSONField(help_text="Lista de dias da semana (ex: [0, 1, 2]) onde 0 é Segunda-feira e 6 é Domingo.")
    horario_inicio = models.TimeField()
    horario_fim = models.TimeField()
    duracao_segundos = models.PositiveIntegerField(help_text="Tempo de exibição da campanha na tela, em segundos")
    
    def __str__(self):
        return f"Agendamento de {self.campanha.nome} ({self.horario_inicio} - {self.horario_fim})"

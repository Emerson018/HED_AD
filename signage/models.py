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

def default_dias_semana():
    return [0, 1, 2, 3, 4, 5, 6]

def default_turnos():
    return ['MANHA', 'TARDE', 'NOITE', 'MADRUGADA']

class Campanha(models.Model):
    STATUS_CHOICES = (
        ('EM_ANALISE', 'Pendente'),
        ('APROVADA', 'Aprovada'),
        ('ATIVA', 'Ativa'),
        ('PAUSADA', 'Pausada'),
        ('EXPIRADA', 'Expirada'),
    )
    DURACAO_CHOICES = (
        (15, '15 Segundos'),
        (30, '30 Segundos'),
        (60, '60 Segundos'),
    )

    parceiro = models.ForeignKey(Parceiro, on_delete=models.CASCADE, related_name='campanhas')
    nome = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EM_ANALISE')
    duracao = models.PositiveIntegerField(default=15)
    turnos = models.JSONField(default=default_turnos, help_text="Lista de turnos selecionados.")
    categoria = models.CharField(max_length=100, blank=True, null=True)
    is_institucional = models.BooleanField(default=False, help_text="Se True, é uma campanha institucional do hospital usada para preencher tempo ocioso.")
    
    data_inicio = models.DateField()
    data_fim = models.DateField()
    dias_semana = models.JSONField(default=default_dias_semana, help_text="Lista de dias da semana (ex: [0, 1, 2]) onde 0 é Segunda-feira e 6 é Domingo.")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome

    def clean(self):
        from django.core.exceptions import ValidationError
        # Validação estrita de 300 segundos apenas ao aprovar/ativar campanhas comerciais (não-institucionais)
        if self.status in ['APROVADA', 'ATIVA'] and not self.is_institucional:
            turnos_afetados = self.turnos or []
            
            for t in turnos_afetados:
                # Filtra apenas campanhas comerciais aprovadas/ativas (excluindo a atual)
                qs = Campanha.objects.filter(status__in=['APROVADA', 'ATIVA'], is_institucional=False).exclude(id=self.id)
                
                # Soma a duração de todas as campanhas comerciais do turno (filtrando em Python para evitar incompatibilidade com SQLite)
                total_turno = sum(c.duracao for c in qs if c.turnos and t in c.turnos)
                
                if total_turno + self.duracao > 300:
                    raise ValidationError(f"Inventário do turno {t} está cheio ({total_turno}/300s ocupados).")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

class CampanhaLog(models.Model):
    campanha = models.ForeignKey(Campanha, on_delete=models.CASCADE, related_name='logs')
    tocado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Log: {self.campanha.nome} em {self.tocado_em}"

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

class AuditoriaLog(models.Model):
    ACAO_CHOICES = (
        ('LOGIN_SUCESSO', 'Tentativa de Login (Sucesso)'),
        ('LOGIN_FALHA', 'Tentativa de Login (Falha)'),
        ('CAMPANHA_CRIACAO', 'Criação de Campanha'),
        ('CAMPANHA_EDICAO', 'Edição de Campanha'),
        ('CAMPANHA_APROVACAO', 'Aprovação de Campanha'),
        ('CAMPANHA_EXCLUSAO', 'Exclusão de Campanha'),
        ('CAMPANHA_PAUSA', 'Pausa de Campanha'),
        ('CAMPANHA_EXPIRADA', 'Campanha Expirada'),
        ('UPLOAD_VIDEO', 'Upload de Vídeo/Imagem'),
        ('REGISTRO_PARCEIRO', 'Cadastro de Parceiro'),
    )
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs_auditoria')
    usuario_str = models.CharField(max_length=150, help_text="Nome de usuário para auditoria")
    acao = models.CharField(max_length=50, choices=ACAO_CHOICES)
    descricao = models.TextField()
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.criado_em} - {self.usuario_str} - {self.acao}"

from datetime import timedelta

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid

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

def default_tvs():
    return ['sala_espera', 'recepcao', 'sala_cirurgia', 'corredor']

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
    tvs = models.JSONField(default=default_tvs, help_text="Lista de TVs selecionadas.")
    
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
            dias_afetados = self.dias_semana or []
            tvs_afetadas = self.tvs or []
            
            for t in turnos_afetados:
                for d in dias_afetados:
                    for tv in tvs_afetadas:
                        # Filtra apenas campanhas comerciais aprovadas/ativas (excluindo a atual)
                        qs = Campanha.objects.filter(status__in=['APROVADA', 'ATIVA'], is_institucional=False).exclude(id=self.id)
                        
                        # Soma a duração de todas as campanhas comerciais do turno, dia e TV específicos
                        total_turno = sum(
                            c.duracao for c in qs 
                            if c.turnos and t in c.turnos and isinstance(c.dias_semana, list) and d in c.dias_semana and isinstance(c.tvs, list) and tv in c.tvs
                        )
                        
                        if total_turno + self.duracao > 300:
                            dia_nome = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'][d]
                            tv_nome = {
                                'sala_espera': 'Sala de Espera',
                                'recepcao': 'Recepção',
                                'sala_cirurgia': 'Sala de Cirurgia',
                                'corredor': 'Corredor Principal'
                            }.get(tv, tv)
                            raise ValidationError(f"Inventário do turno {t} está cheio na {tv_nome} para {dia_nome}-feira ({total_turno}/300s ocupados).")

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
        ('EMAIL_CREDENCIAIS', 'Envio de Credenciais por E-mail'),
        ('EMAIL_CREDENCIAIS_FALHA', 'Falha no Envio de Credenciais'),
        ('SENHA_REDEFINIDA', 'Redefinição de Senha'),
        ('EDICAO_USUARIO', 'Edição de Usuário'),
        ('EXCLUSAO_USUARIO', 'Exclusão de Usuário'),
    )
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs_auditoria')
    usuario_str = models.CharField(max_length=150, help_text="Nome de usuário para auditoria")
    acao = models.CharField(max_length=50, choices=ACAO_CHOICES)
    descricao = models.TextField()
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.criado_em} - {self.usuario_str} - {self.acao}"


class MonitorTV(models.Model):
    """
    Modelo de segurança para controle de dispositivos (mini-PCs/TVs).
    Cada TV física recebe um token UUID único. Se o token vazar ou a TV for
    roubada, o admin pode desativar o monitor com 1 clique (is_active=False),
    bloqueando instantaneamente o acesso à playlist.
    """
    LOCALIZACAO_CHOICES = (
        ('sala_espera', 'Sala de Espera'),
        ('recepcao', 'Recepção'),
        ('sala_cirurgia', 'Sala de Cirurgia'),
        ('corredor', 'Corredor Principal'),
    )

    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, help_text="Token único de autenticação do dispositivo.")
    nome = models.CharField(max_length=100, help_text="Nome identificador do monitor (ex: TV Recepção 01)")
    localizacao = models.CharField(max_length=50, choices=LOCALIZACAO_CHOICES, help_text="Local físico onde a TV está instalada.")
    is_active = models.BooleanField(default=True, help_text="Se False, o token é revogado e a TV não recebe mais conteúdo.")
    ultimo_ping = models.DateTimeField(null=True, blank=True, help_text="Último momento em que o player fez uma requisição.")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Monitor TV'
        verbose_name_plural = 'Monitores TV'

    def __str__(self):
        status = '✓ Ativo' if self.is_active else '✗ Desativado'
        return f"{self.nome} ({self.localizacao}) [{status}]"


class PasswordResetToken(models.Model):
    """Single-use, time-limited token for password reset."""

    user = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.created_at + timedelta(minutes=30)

    @property
    def is_valid(self) -> bool:
        return not self.is_used and not self.is_expired

    def __str__(self):
        return f"ResetToken for {self.user.username} (valid={self.is_valid})"

from django.contrib import admin
from .models import Usuario, Parceiro, Campanha, Midia, Agendamento, AuditoriaLog, MonitorTV


@admin.register(MonitorTV)
class MonitorTVAdmin(admin.ModelAdmin):
    list_display = ('nome', 'localizacao', 'token', 'is_active', 'ultimo_ping', 'criado_em')
    list_filter = ('is_active', 'localizacao')
    search_fields = ('nome', 'token')
    readonly_fields = ('token', 'criado_em', 'atualizado_em', 'ultimo_ping')
    actions = ['desativar_monitores', 'ativar_monitores']

    @admin.action(description='Desativar monitores selecionados (revogar token)')
    def desativar_monitores(self, request, queryset):
        queryset.update(is_active=False)

    @admin.action(description='Reativar monitores selecionados')
    def ativar_monitores(self, request, queryset):
        queryset.update(is_active=True)


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'tipo_usuario', 'is_active')
    list_filter = ('tipo_usuario', 'is_active')
    search_fields = ('username', 'email')


@admin.register(Parceiro)
class ParceiroAdmin(admin.ModelAdmin):
    list_display = ('nome_empresa', 'cnpj', 'telefone', 'criado_em')
    search_fields = ('nome_empresa', 'cnpj')


@admin.register(Campanha)
class CampanhaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'parceiro', 'status', 'duracao', 'is_institucional', 'data_inicio', 'data_fim')
    list_filter = ('status', 'is_institucional')
    search_fields = ('nome',)


@admin.register(AuditoriaLog)
class AuditoriaLogAdmin(admin.ModelAdmin):
    list_display = ('criado_em', 'usuario_str', 'acao', 'descricao')
    list_filter = ('acao',)
    search_fields = ('usuario_str', 'descricao')
    readonly_fields = ('criado_em',)

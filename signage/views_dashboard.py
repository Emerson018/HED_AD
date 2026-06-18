"""
Dashboard Analytics API - Admin only.
Provides KPIs, chart data, and per-client filtering for the admin dashboard.
"""
import datetime
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from .models import Parceiro, Campanha, CampanhaLog, MonitorTV
from .permissions import IsAdminHED


class DashboardAnalyticsView(APIView):
    """
    GET /api/dashboard/analytics/
    Query params:
      - parceiro_id (optional): filter by specific partner. If omitted, returns global data.
      - data_inicio (required): start date in YYYY-MM-DD format.
      - data_fim (required): end date in YYYY-MM-DD format.
    """
    permission_classes = [IsAdminHED]

    def get(self, request):
        parceiro_id = request.query_params.get('parceiro_id')
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')

        # Date range - parse explicit dates or default to last 30 days
        now = timezone.now()
        date_from = None
        date_to = None

        if data_inicio:
            try:
                date_from = timezone.make_aware(
                    datetime.datetime.strptime(data_inicio, '%Y-%m-%d')
                )
            except (ValueError, TypeError):
                date_from = now - datetime.timedelta(days=30)

        if data_fim:
            try:
                date_to = timezone.make_aware(
                    datetime.datetime.strptime(data_fim, '%Y-%m-%d')
                ) + datetime.timedelta(days=1)  # Include the entire end day
            except (ValueError, TypeError):
                date_to = None

        # Fallback: if no dates provided, default to last 30 days
        if not date_from and not data_inicio:
            date_from = now - datetime.timedelta(days=30)

        # Base querysets
        campanhas_qs = Campanha.objects.filter(is_institucional=False)
        logs_qs = CampanhaLog.objects.all()

        if parceiro_id:
            campanhas_qs = campanhas_qs.filter(parceiro_id=parceiro_id)
            logs_qs = logs_qs.filter(campanha__parceiro_id=parceiro_id)

        if date_from:
            logs_qs = logs_qs.filter(tocado_em__gte=date_from)
        if date_to:
            logs_qs = logs_qs.filter(tocado_em__lt=date_to)

        # === KPIs ===
        total_parceiros = Parceiro.objects.count()
        total_campanhas = campanhas_qs.count()
        campanhas_ativas = campanhas_qs.filter(status__in=['APROVADA', 'ATIVA']).count()
        campanhas_pendentes = campanhas_qs.filter(status='EM_ANALISE').count()
        campanhas_pausadas = campanhas_qs.filter(status='PAUSADA').count()
        campanhas_expiradas = campanhas_qs.filter(status='EXPIRADA').count()
        total_exibicoes = logs_qs.count()

        # Inventory usage (300s per shift per TV per day)
        inventario_usado = campanhas_qs.filter(
            status__in=['APROVADA', 'ATIVA']
        ).aggregate(total_duracao=Sum('duracao'))['total_duracao'] or 0

        # === Charts data ===

        # 1. Exibições por dia (line chart)
        exibicoes_por_dia = list(
            logs_qs
            .annotate(dia=TruncDate('tocado_em'))
            .values('dia')
            .annotate(total=Count('id'))
            .order_by('dia')
        )
        exibicoes_chart = [
            {'data': item['dia'].strftime('%d/%m'), 'exibicoes': item['total']}
            for item in exibicoes_por_dia
        ]

        # 2. Campanhas por status (pie chart)
        status_distribution = [
            {'name': 'Ativas', 'value': campanhas_ativas},
            {'name': 'Pendentes', 'value': campanhas_pendentes},
            {'name': 'Pausadas', 'value': campanhas_pausadas},
            {'name': 'Expiradas', 'value': campanhas_expiradas},
        ]

        # 3. Top parceiros por exibições (bar chart) - only when viewing global
        top_parceiros = []
        if not parceiro_id:
            top_parceiros_qs = (
                CampanhaLog.objects
                .filter(campanha__is_institucional=False)
            )
            if date_from:
                top_parceiros_qs = top_parceiros_qs.filter(tocado_em__gte=date_from)
            if date_to:
                top_parceiros_qs = top_parceiros_qs.filter(tocado_em__lt=date_to)

            top_parceiros_qs = (
                top_parceiros_qs
                .values('campanha__parceiro__nome_empresa')
                .annotate(total=Count('id'))
                .order_by('-total')[:10]
            )
            top_parceiros = [
                {'parceiro': item['campanha__parceiro__nome_empresa'], 'exibicoes': item['total']}
                for item in top_parceiros_qs
            ]

        # 4. Exibições por turno (bar chart)
        turnos_data = []
        turno_labels = {'MANHA': 'Manhã', 'TARDE': 'Tarde', 'NOITE': 'Noite', 'MADRUGADA': 'Madrugada'}
        # SQLite-compatible: filter in Python (JSONField __contains not supported)
        active_campaigns = list(campanhas_qs.filter(status__in=['APROVADA', 'ATIVA']))
        for turno_key, turno_label in turno_labels.items():
            count = sum(1 for c in active_campaigns if c.turnos and turno_key in c.turnos)
            turnos_data.append({'turno': turno_label, 'campanhas': count})

        # 5. Ocupação de inventário por turno (para gauge/bar)
        ocupacao_por_turno = []
        active_campaigns_list = list(campanhas_qs.filter(status__in=['APROVADA', 'ATIVA']))
        for turno_key, turno_label in turno_labels.items():
            duracao_total = sum(
                c.duracao for c in active_campaigns_list
                if c.turnos and turno_key in c.turnos
            )
            ocupacao_por_turno.append({
                'turno': turno_label,
                'usado': duracao_total,
                'limite': 300,
                'percentual': round((duracao_total / 300) * 100, 1) if duracao_total > 0 else 0
            })

        # 6. Exibições por hora do dia (bar chart)
        # Converte para horário local (settings.TIME_ZONE) antes de extrair a hora
        from django.utils import timezone as tz
        import zoneinfo
        from django.conf import settings
        local_tz = zoneinfo.ZoneInfo(settings.TIME_ZONE)

        exibicoes_por_hora = [{'hora': f'{h:02d}:00', 'exibicoes': 0} for h in range(24)]
        logs_com_hora = logs_qs.values_list('tocado_em', flat=True)
        for tocado_em in logs_com_hora:
            if tocado_em:
                local_time = tocado_em.astimezone(local_tz)
                hora = local_time.hour
                exibicoes_por_hora[hora]['exibicoes'] += 1

        # === Parceiros list for filter dropdown ===
        parceiros_list = list(
            Parceiro.objects.values('id', 'nome_empresa').order_by('nome_empresa')
        )

        return Response({
            'kpis': {
                'total_parceiros': total_parceiros,
                'total_campanhas': total_campanhas,
                'campanhas_ativas': campanhas_ativas,
                'campanhas_pendentes': campanhas_pendentes,
                'campanhas_pausadas': campanhas_pausadas,
                'campanhas_expiradas': campanhas_expiradas,
                'total_exibicoes': total_exibicoes,
                'inventario_usado_segundos': inventario_usado,
            },
            'charts': {
                'exibicoes_por_dia': exibicoes_chart,
                'status_distribution': status_distribution,
                'top_parceiros': top_parceiros,
                'campanhas_por_turno': turnos_data,
                'ocupacao_por_turno': ocupacao_por_turno,
                'exibicoes_por_hora': exibicoes_por_hora,
            },
            'parceiros': parceiros_list,
        })

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet, 
    ParceiroViewSet, 
    CampanhaViewSet, 
    MidiaViewSet, 
    AgendamentoViewSet,
    TVPlaylistView,
    RegisterView,
    MeView,
    PlayerLogView,
    AuditoriaLogViewSet,
    ResendCredentialsView
)
from .views_password_reset import PasswordResetRequestView, ValidateResetTokenView, PasswordResetConfirmView
from .views_dashboard import DashboardAnalyticsView

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'parceiros', ParceiroViewSet, basename='parceiro')
router.register(r'campanhas', CampanhaViewSet, basename='campanha')
router.register(r'midias', MidiaViewSet, basename='midia')
router.register(r'agendamentos', AgendamentoViewSet, basename='agendamento')
router.register(r'logs', AuditoriaLogViewSet, basename='logs')

urlpatterns = [
    path('tv/playlist/', TVPlaylistView.as_view(), name='tv_playlist'),
    path('player/log/', PlayerLogView.as_view(), name='player_log'),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', MeView.as_view(), name='me'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password-reset/validate-token/', ValidateResetTokenView.as_view(), name='password_reset_validate_token'),
    path('resend-credentials/<int:user_id>/', ResendCredentialsView.as_view(), name='resend_credentials'),
    path('dashboard/analytics/', DashboardAnalyticsView.as_view(), name='dashboard_analytics'),
    path('', include(router.urls)),
]

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
    DatabaseSelectorView
)

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
    path('admin/database/', DatabaseSelectorView.as_view(), name='database_selector'),
    path('', include(router.urls)),
]

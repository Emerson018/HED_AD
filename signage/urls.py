from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet, 
    ParceiroViewSet, 
    CampanhaViewSet, 
    MidiaViewSet, 
    AgendamentoViewSet,
    TVPlaylistView,
    RegisterView
)

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'parceiros', ParceiroViewSet, basename='parceiro')
router.register(r'campanhas', CampanhaViewSet, basename='campanha')
router.register(r'midias', MidiaViewSet, basename='midia')
router.register(r'agendamentos', AgendamentoViewSet, basename='agendamento')

urlpatterns = [
    path('tv/playlist/', TVPlaylistView.as_view(), name='tv_playlist'),
    path('register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),
]

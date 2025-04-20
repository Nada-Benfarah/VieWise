# agents/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgentViewSet, DataSourceViewSet, ModeleViewSet, AgentFileViewSet, AgentCreateWithFilesView, AgentUpdateWithFilesView

router = DefaultRouter()
router.register(r'agents', AgentViewSet)
router.register(r'datasources', DataSourceViewSet)
router.register(r'modeles', ModeleViewSet)
router.register(r'agent-files', AgentFileViewSet)

urlpatterns = [
    # ✅ Ces deux lignes sous le préfixe 'agents/'
    path('agents/create-with-files/', AgentCreateWithFilesView.as_view(), name='agent-create-with-files'),
    path('agents/<int:pk>/update-with-files/', AgentUpdateWithFilesView.as_view(), name='agent-update-with-files'),

    # ✅ Router DRF
    path('', include(router.urls)),
]

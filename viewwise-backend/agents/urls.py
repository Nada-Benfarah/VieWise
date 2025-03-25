from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgentViewSet, DataSourceViewSet, ModeleViewSet

router = DefaultRouter()
router.register(r'agents', AgentViewSet)
router.register(r'datasources', DataSourceViewSet)
router.register(r'modeles', ModeleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

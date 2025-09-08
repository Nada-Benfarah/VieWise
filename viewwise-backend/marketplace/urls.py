from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MarketplaceViewSet, MarketplaceWorkflowViewSet

router = DefaultRouter()
router.register(r'workflows', MarketplaceWorkflowViewSet, basename='marketplace-workflows')
router.register(r'', MarketplaceViewSet, basename='marketplace-agents')

urlpatterns = [
    path('', include(router.urls)),
]

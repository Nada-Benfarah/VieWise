from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkflowViewSet, ToolViewSet, TriggerViewSet

router = DefaultRouter()
router.register(r'workflows', WorkflowViewSet)
router.register(r'triggers', TriggerViewSet)
router.register(r'tools', ToolViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

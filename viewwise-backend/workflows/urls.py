from rest_framework.routers import DefaultRouter
from .views import WorkflowViewSet, ToolViewSet, TriggerViewSet

router = DefaultRouter()
router.register(r'', WorkflowViewSet)  # ceci expose /api/workflows/
router.register(r'tools', ToolViewSet)
router.register(r'triggers', TriggerViewSet)

urlpatterns = router.urls

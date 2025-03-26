from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, RoleViewSet, PermissionViewSet

router = DefaultRouter()
router.register('companies', CompanyViewSet)
router.register('roles', RoleViewSet)
router.register('permissions', PermissionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

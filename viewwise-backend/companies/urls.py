from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, RoleViewSet

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'roles', RoleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

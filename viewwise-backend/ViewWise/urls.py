from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('accounts.urls')),
    path('auth/', include('allauth.account.urls')),
    path('api/agents/', include('agents.urls')),
    path('api/workflows/', include('workflows.urls')),
    path('api/companies/', include('companies.urls')),
    path('api/users/', include('users.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),




]

if settings.DEBUG:urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

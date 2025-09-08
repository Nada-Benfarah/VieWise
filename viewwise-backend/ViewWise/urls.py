from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve as dj_serve


def media_serve_with_headers(request, path, document_root=None, show_indexes=False):
    resp = dj_serve(request, path, document_root=document_root, show_indexes=show_indexes)
    # évite “ERR_BLOCKED_BY_ORB” quand l’image est utilisée depuis une autre origine (localhost:4200)
    resp["Cross-Origin-Resource-Policy"] = "cross-origin"
    return resp

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('accounts.urls')),
    path('auth/', include('allauth.account.urls')),
    path('api/', include('agents.urls')),
    path('api/workflows/', include('workflows.urls')),
    path('api/companies/', include('companies.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/monitoring/', include('monitoring.urls')),
    path('api/marketplace/', include('marketplace.urls')),
    path('api/invitations/', include('invitations.urls'))






]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$',
            media_serve_with_headers,
            {'document_root': settings.MEDIA_ROOT, 'show_indexes': False}),
]
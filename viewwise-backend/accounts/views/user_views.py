# user_views.py
from rest_framework import status
from rest_framework.generics import ListAPIView
from django.contrib.auth import get_user_model
from ..permissions import IsSuperUser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from accounts.serializers.user_serializers import UserSerializer, UserUpdateSerializer, AvatarUploadSerializer
from rest_framework import viewsets, decorators, response
from rest_framework.filters import SearchFilter, OrderingFilter
from accounts.serializers.user_serializers import AdminUserSerializer
from accounts.permissions import IsSuperUser, IsAdminOrStaff
import logging
from rest_framework.decorators import action
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings

from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, decorators, response, status
from rest_framework.filters import SearchFilter, OrderingFilter
from accounts.serializers.user_serializers import AdminUserSerializer


logger = logging.getLogger(__name__)
User = get_user_model()

class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


def profile_payload(user, request):
    def abs_url(file_field):
        try:
            return request.build_absolute_uri(file_field.url)
        except Exception:
            return None
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone_number": user.phone_number,
        "is_superuser": user.is_superuser,
        "is_staff": user.is_staff,
        "email_verified": user.email_verified,
        "is_admin": user.is_superuser or user.is_staff,
        "avatar_url": abs_url(user.avatar) if getattr(user, "avatar", None) else None,
    }

# ✅ User Profile
class UserProfileView(APIView):
    """Retrieve authenticated user profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
            return Response(profile_payload(request.user, request))

    def patch(self, request):
        user = request.user
        # pour la mise à jour, utilise le serializer de mise à jour
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # renvoie le payload complet (avatar_url inclus)
        return Response(profile_payload(user, request), status=status.HTTP_200_OK)

    def delete(self, request):
            user = request.user
            user.delete()
            return Response({"detail": "Compte supprimé avec succès."}, status=status.HTTP_204_NO_CONTENT)


# ✅ List All Users (SuperUser Only)
class UserListView(ListAPIView):
    """List all users (only accessible to superusers)."""
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperUser]

    def get_serializer_context(self):
            ctx = super().get_serializer_context()
            ctx["request"] = self.request            # 👈 nécessaire pour build_absolute_uri
            return ctx

class UserAvatarView(APIView):
    """
    PATCH /auth/me/avatar/  (multipart: avatar=<File>)
    DELETE /auth/me/avatar/
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = AvatarUploadSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(profile_payload(user, request), status=status.HTTP_200_OK)

    def delete(self, request):
        user = request.user
        if user.avatar:
            user.avatar.delete(save=False)
            user.avatar = None
            user.save(update_fields=['avatar'])
        return Response(profile_payload(user, request), status=status.HTTP_200_OK)



class AdminUserViewSet(viewsets.ModelViewSet):
    """
    /auth/users/ : CRUD complet sur tous les utilisateurs (hors superusers)
    """
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminOrStaff]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["email", "first_name", "last_name", "phone_number"]
    ordering_fields = ["date_joined", "email", "first_name"]

    def get_queryset(self):
        # Exclure les superusers
        return User.objects.filter(is_superuser=False).order_by("-date_joined")

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    @action(detail=True, methods=['patch'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        is_active = bool(request.data.get('is_active'))
        user.is_active = is_active
        user.save(update_fields=['is_active'])

        subject  = "Votre compte a été activé" if is_active else "Votre compte a été désactivé"
        template = 'account/email/account_activated.html' if is_active else 'account/email/account_deactivated.html'

        # rendu HTML + fallback texte
        try:
            html_body = render_to_string(template, {"user": user})
            text_body = ""
        except Exception:
            html_body = None
            text_body = (
                f"Bonjour {user.first_name},\n\n"
                f"Votre compte ViewWise a été {'activé' if is_active else 'désactivé'}.\n"
                f"Cordialement,\nL’équipe ViewWise"
            )

        try:
            send_mail(
                subject=subject,
                message=text_body or " ",
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[user.email],
                fail_silently=False,
                html_message=html_body if html_body else None,
            )
        except Exception as e:
            logger.exception("Echec envoi email toggle_active: %s", e)

        data = self.get_serializer(user, context=self.get_serializer_context()).data
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='toggle-staff')
    def toggle_staff(self, request, pk=None):
        u = self.get_object()
        val = request.data.get("is_staff", None)
        if isinstance(val, bool):
            u.is_staff = val
            if not val:
                u.is_superuser = False  # sécurité
            u.save(update_fields=["is_staff", "is_superuser"])
            return Response(self.get_serializer(u).data, status=status.HTTP_200_OK)
        return Response({"detail": "is_staff (bool) requis"}, status=status.HTTP_400_BAD_REQUEST)

class AdminStaffViewSet(viewsets.ModelViewSet):
    """
    /auth/admins/ : Gestion des "admins" non-superuser (is_staff=True, is_superuser=False)
    (CRUD réservé aux superusers)
    """
    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperUser]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["email", "first_name", "last_name", "phone_number"]
    ordering_fields = ["date_joined", "email", "first_name"]

    def get_queryset(self):
        return User.objects.filter(is_staff=True, is_superuser=False).order_by("-date_joined")

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        # force admin non-superuser
        obj = serializer.save(is_staff=True, is_superuser=False, is_active=True, email_verified=True)
        return obj

    def perform_update(self, serializer):
        # empêche l’élévation en superuser via ce ViewSet
        obj = serializer.save(is_superuser=False)
        return obj

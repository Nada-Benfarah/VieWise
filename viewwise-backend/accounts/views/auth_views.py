# auth_views.py
from rest_framework import status, permissions
from rest_framework.generics import CreateAPIView
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.email import send_activation_email
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from accounts.serializers.auth_serializers import RegisterSerializer, CustomTokenObtainPairSerializer, CustomTokenRefreshSerializer
import logging
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.http import HttpResponseRedirect



User = get_user_model()
logger = logging.getLogger(__name__)


# ✅ User Registration
class RegisterView(CreateAPIView):
    """User registration - creates an account and sends a confirmation email."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        logger.info(f" User {user.email} registered successfully.")
        try:
            send_activation_email(self.request, user)
            logger.info(f" Activation email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send activation email to {user.email}: {e}")


# ✅ Custom Login (JWT)
class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login returning access & refresh tokens."""
    serializer_class = CustomTokenObtainPairSerializer

# ✅ Custom Refresh Token
class CustomTokenRefreshView(TokenRefreshView):
    """Refresh JWT access token."""
    serializer_class = CustomTokenRefreshSerializer


# ✅ Secure Logout (Blacklist Refresh Token)
class LogoutView(APIView):
    """Secure logout - blacklist refresh token & clear cookies."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh_token")
        if not refresh_token:
            return Response({"error": "Refresh token is required"}, status=400)

        try:
            RefreshToken(refresh_token).blacklist()
        except Exception:
            return Response({"error": "Invalid refresh token"}, status=400)

        response = Response({"message": "Logout successful"}, status=200)
        response.delete_cookie("access_token")  # ✅ Remove token from cookies
        response.delete_cookie("refresh_token")  # ✅ Remove refresh token from cookies
        return response

class ActivateAccountRedirectView(APIView):
    permission_classes = []

    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
            if default_token_generator.check_token(user, token):
                user.is_active = True
                user.save()
                logger.info(f"✅ Compte activé pour {user.email}")
                return HttpResponseRedirect("http://localhost:4200/login?activated=true")
            else:
                logger.warning("❌ Token invalide")
                return HttpResponseRedirect("http://localhost:4200/login?error=invalid-token")
        except Exception as e:
            logger.error(f"⚠️ Erreur activation : {e}")
            return HttpResponseRedirect("http://localhost:4200/login?error=activation-failed")
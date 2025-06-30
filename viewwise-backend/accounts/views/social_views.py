# social_views.py
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from allauth.socialaccount.providers.apple.views import AppleOAuth2Adapter
from allauth.socialaccount.providers.microsoft.views import MicrosoftGraphOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from django.conf import settings
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from allauth.socialaccount.models import SocialAccount
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.authentication import SessionAuthentication, BasicAuthentication


User = get_user_model()

class GoogleLogin(SocialLoginView):
    authentication_classes = []
    permission_classes = [AllowAny]

    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = settings.LOGIN_REDIRECT_URL

    def validate(self, attrs):
        # Récupérer l’e-mail depuis le token Google
        email = self.adapter.parse_token(attrs['access_token']).get('email')
        user = User.objects.filter(email=email).first()

        if user:
            # ✅ Activer automatiquement le compte si désactivé
            if not user.is_active:
                user.is_active = True
                user.save()

            # ✅ Si un compte existe sans être lié à Google → conflit
            if not SocialAccount.objects.filter(user=user, provider='google').exists():
                raise ValidationError({
                    "detail": "Un compte existe déjà avec cette adresse email, mais sans connexion Google. Veuillez vous connecter avec votre mot de passe."
                })

        return super().validate(attrs)

    def get_response(self):
        original_response = super().get_response()
        data = original_response.data
        data["user"] = {
            "id": self.user.id,
            "email": self.user.email,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name
        }
        return Response(data)

class FacebookLogin(SocialLoginView):
    """Login using Facebook OAuth"""
    adapter_class = FacebookOAuth2Adapter
    client_class = OAuth2Client
    callback_url = settings.LOGIN_REDIRECT_URL

class AppleLogin(SocialLoginView):
    """Login using Apple OAuth"""
    adapter_class = AppleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = settings.LOGIN_REDIRECT_URL

class OutlookLogin(SocialLoginView):
    """Login using Microsoft (Outlook) OAuth"""
    adapter_class = MicrosoftGraphOAuth2Adapter
    client_class = OAuth2Client
    callback_url = settings.LOGIN_REDIRECT_URL
# social_views.py
from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from allauth.socialaccount.providers.apple.views import AppleOAuth2Adapter
from allauth.socialaccount.providers.microsoft.views import MicrosoftGraphOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from django.conf import settings

class GoogleLogin(SocialLoginView):
    """Login using Google OAuth"""
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = settings.LOGIN_REDIRECT_URL

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
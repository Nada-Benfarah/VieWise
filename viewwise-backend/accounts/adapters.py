from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

class CustomAccountAdapter(DefaultAccountAdapter):
    def send_account_already_exists_mail(self, email):  # ❌ Supprime `request` ici
        context = {
            "email": email,
            "password_reset_url": "http://localhost:8000/auth/password/reset/"
        }
        subject = "Votre compte ViewWise existe déjà"
        html_content = render_to_string("account/email/existing_account.html", context)

        msg = EmailMultiAlternatives(subject, '', settings.DEFAULT_FROM_EMAIL, [email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        user = sociallogin.user
        if not user.is_active:
            user.is_active = True

from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMessage

def send_activation_email(request, user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    activation_link = f"http://localhost:8000/auth/activate/{uid}/{token}/"

    message = render_to_string("account/email/email_confirmation_message.html", {
        'user': user,
        'activate_url': activation_link
    })

    mail_subject = "Confirmez votre compte ViewWise"
    to_email = user.email
    email = EmailMessage(mail_subject, message, to=[to_email])
    email.content_subtype = "html"
    email.send()

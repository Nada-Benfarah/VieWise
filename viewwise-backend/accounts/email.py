from allauth.account.utils import send_email_confirmation

def send_activation_email(request, user):
    send_email_confirmation(request, user)
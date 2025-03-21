from django.dispatch import receiver
from allauth.account.signals import email_confirmed
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@receiver(email_confirmed)
def activate_user_after_confirmation(request, email_address, **kwargs):
    """
    Activates the user account when the email confirmation is successfully completed.
    """
    try:
        user = email_address.user
        if user and not user.is_active:
            user.is_active = True
            user.save()
            logger.info(f"✅ User {user.email} activated after email confirmation.")
        else:
            logger.warning(f"⚠️ User {user.email} was already active or not found.")
    except Exception as e:
        logger.error(f"❌ Error activating user after email confirmation: {e}")

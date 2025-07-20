from django.dispatch import receiver
from allauth.account.signals import email_confirmed
from django.contrib.auth import get_user_model
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import CustomUser
from subscriptions.models import Subscriber, Subscription, Plan
from datetime import date, timedelta



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

@receiver(post_save, sender=CustomUser)
def assign_default_plan(sender, instance, created, **kwargs):
    if created:
        try:
            free_plan = Plan.objects.get(name__iexact="FREE")
        except Plan.DoesNotExist:
            return  # Assure-toi que ce plan existe

        subscriber = Subscriber.objects.create(user=instance, company=instance.company)
        Subscription.objects.create(
            subscriber=subscriber,
            plan=free_plan,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=14),
            is_active=True
        )
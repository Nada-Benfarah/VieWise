from django.db import models
from companies.models import Company
from accounts.models import CustomUser  # Abonné lié à un utilisateur

class Subscriber(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='subscriber_profile')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='subscribers')
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.company.name}"

class Subscription(models.Model):
    subscriber = models.ForeignKey(Subscriber, on_delete=models.CASCADE, related_name='subscriptions')
    plan_name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.subscriber.user.email} - {self.plan_name}"

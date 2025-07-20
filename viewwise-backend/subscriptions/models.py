from django.db import models
from accounts.models import CustomUser
from companies.models import Company

class Subscriber(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='subscriber_profile')
#     company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='subscribers')
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email}"

class Plan(models.Model):
    name = models.CharField(max_length=100)
    price = models.FloatField()
    agent_nbr = models.CharField(max_length=20)
    workflow_nbr = models.BooleanField(default=False)
    channel_nbr = models.BooleanField(default=False)
    invitation_nbr = models.IntegerField()
    credits_nbr = models.IntegerField()
    data_source_size = models.CharField(max_length=50)
    tools_nbr = models.CharField(max_length=20)
    scheduled_tasks = models.BooleanField(default=False)
    voice_agent = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Subscription(models.Model):
    subscriber = models.ForeignKey(Subscriber, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='subscriptions')
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.subscriber.user.email} - {self.plan.name}"

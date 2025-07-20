from django.db import models
from subscriptions.models import Subscriber
from companies.models import Company
from django.conf import settings

class Invitation(models.Model):
    sender = models.ForeignKey(Subscriber, on_delete=models.CASCADE, related_name='sent_invitations')
    receiver_email = models.EmailField()
    status = models.CharField(max_length=50, choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('declined', 'Declined')],default='En cours')
    created_at = models.DateTimeField(auto_now_add=True)
    expiration_date = models.DateTimeField()

#     company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='invitations')
    role = models.CharField(max_length=50, choices=[('Éditeur', 'Éditeur'), ('Visiteur', 'Visiteur')])
    selected_agents = models.JSONField(default=list, blank=True)
    selected_workflows = models.JSONField(default=list, blank=True)
    invited_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='received_invitations'
    )

    def __str__(self):
        return f"{self.receiver_email} - {self.status}"
from django.db import models
from subscriptions.models import Subscriber
from companies.models import Company

class Invitation(models.Model):
    sender = models.ForeignKey(Subscriber, on_delete=models.CASCADE, related_name='sent_invitations')
    receiver_email = models.EmailField()
    status = models.CharField(max_length=50, choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('declined', 'Declined')])
    created_at = models.DateTimeField(auto_now_add=True)
    expiration_date = models.DateTimeField()
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='invitations')

    def __str__(self):
        return f"{self.receiver_email} - {self.status}"
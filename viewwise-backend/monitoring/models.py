from django.db import models
from agents.models import Agent

class Report(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='reports')

    def __str__(self):
        return self.title

class Log(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='logs')
    message = models.TextField()
    level = models.CharField(max_length=50, choices=[
        ('info', 'Info'),
        ('warning', 'Avertissement'),
        ('error', 'Erreur'),
    ])
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.level.upper()} - {self.timestamp}"

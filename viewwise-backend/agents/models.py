from django.db import models
from accounts.models import CustomUser

class DataSource(models.Model):
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=100)
    config = models.JSONField(default=dict)

    def __str__(self):
        return self.name

class Modele(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()

    def __str__(self):
        return self.name

class Agent(models.Model):
    agentId = models.AutoField(primary_key=True)
    agentName = models.CharField(max_length=255)
    agentRole = models.CharField(max_length=100)
    agentObjective = models.TextField()
    agentInstructions = models.TextField()
    creator = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    etat = models.CharField(max_length=50, choices=[('draft', 'Draft'), ('deployed', 'Deployed')])
    datasource = models.ForeignKey(DataSource, on_delete=models.CASCADE)
    modele = models.ForeignKey(Modele, on_delete=models.CASCADE)

    def __str__(self):
        return self.agentName

class AgentFile(models.Model):
    agent = models.ForeignKey(Agent, related_name='files', on_delete=models.CASCADE)
    file = models.FileField(upload_to='agent_files/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name
from django.db import models
from accounts.models import CustomUser

class DataSource(models.Model):
    TYPE_CHOICES = [
        ('local', 'Fichier local'),
        ('custom_links', 'Liens personnalisés'),
        ('external_api', 'API externe'),
    ]

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=100, choices=TYPE_CHOICES, default='local')
    config = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    etat = models.CharField(max_length=50, choices=[('draft', 'Brouillon'), ('deployed', 'Déployé')])
    datasource = models.ForeignKey(DataSource, on_delete=models.CASCADE)
    modele = models.ForeignKey(Modele, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    shared_with = models.ManyToManyField(CustomUser, related_name='shared_agents', blank=True)  # pour Agent


    def __str__(self):
        return self.agentName

class Link(models.Model):
    url = models.JSONField()  # Remplace TextField par JSONField
    agent = models.ForeignKey(Agent, related_name='links', on_delete=models.CASCADE)
    source_name = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.url

class AgentFile(models.Model):
    agent = models.ForeignKey(Agent, related_name='files', on_delete=models.CASCADE)
    file = models.FileField(upload_to='agent_files/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name

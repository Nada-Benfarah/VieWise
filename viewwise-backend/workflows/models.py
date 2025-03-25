from django.db import models
from agents.models import Agent  # relation vers Agent

class Tool(models.Model):
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=100)
    config = models.JSONField()

    def __str__(self):
        return self.name

class Trigger(models.Model):
    name = models.CharField(max_length=255)
    condition = models.TextField()

    def __str__(self):
        return self.name

class Workflow(models.Model):
    workflowId = models.AutoField(primary_key=True)
    workflowName = models.CharField(max_length=255)
    description = models.TextField()
    agents = models.ManyToManyField(Agent, related_name='workflows')
    trigger = models.ForeignKey(Trigger, on_delete=models.SET_NULL, null=True, blank=True)
    tools = models.ManyToManyField(Tool, related_name='workflows')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.workflowName

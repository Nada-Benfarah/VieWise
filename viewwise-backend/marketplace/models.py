from django.db import models
from agents.models import Agent
from workflows.models import Workflow  # 👈 import

class Marketplace(models.Model):
    agent = models.OneToOneField(Agent, on_delete=models.CASCADE, related_name='marketplace_entry')
    category = models.CharField(max_length=100)
    tags = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.category} - {self.agent.agentName}"


# 👇 Nouveau : entrée marketplace pour Workflow
class MarketplaceWorkflow(models.Model):
    workflow = models.OneToOneField(Workflow, on_delete=models.CASCADE, related_name='marketplace_entry')
    category = models.CharField(max_length=100)
    tags = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.category} - {self.workflow.workflowName}"

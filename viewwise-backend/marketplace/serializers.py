# marketplace/serializers.py
from rest_framework import serializers
from agents.models import Agent
from .models import Marketplace, MarketplaceWorkflow
from workflows.models import Workflow

class AgentMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ("agentId", "agentName", "agentObjective", "agentRole",           # 👈 ajouté
                                                                       "agentInstructions")  # adapte si tu veux d'autres champs

class WorkflowMiniSerializer(serializers.ModelSerializer):
    agents = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    class Meta:
        model = Workflow
        fields = ("workflowId", "workflowName", "description", "agents",  "nodes",        # ✅
                                                                                    "relations", )

class MarketplaceWorkflowSerializer(serializers.ModelSerializer):
    workflow = WorkflowMiniSerializer(read_only=True)

    class Meta:
        model = MarketplaceWorkflow
        fields = ("id", "category", "tags", "workflow")

class MarketplaceSerializer(serializers.ModelSerializer):
    # write: accepte agent_id
    agent_id = serializers.PrimaryKeyRelatedField(
        source="agent", queryset=Agent.objects.all(), write_only=True, required=False
    )
    # read: renvoie objet agent mini
    agent = AgentMiniSerializer(read_only=True)

    class Meta:
        model = Marketplace
        fields = ("id", "category", "tags", "agent", "agent_id")

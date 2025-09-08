from rest_framework import serializers
from agents.models import Agent
from workflows.models import Workflow
from .models import Marketplace, MarketplaceWorkflow

class AgentMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ('agentId', 'agentName', 'agentObjective')

class MarketplaceSerializer(serializers.ModelSerializer):
    agent = AgentMiniSerializer(read_only=True)
    agent_id = serializers.PrimaryKeyRelatedField(
        queryset=Agent.objects.all(),
        source='agent',
        write_only=True,
        required=True
    )

    class Meta:
        model = Marketplace
        fields = ['id', 'category', 'tags', 'agent', 'agent_id']


# 👇 Nouveau pour workflows
class WorkflowMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workflow
        fields = ('workflowId', 'workflowName', 'description')

class MarketplaceWorkflowSerializer(serializers.ModelSerializer):
    workflow = WorkflowMiniSerializer(read_only=True)
    workflow_id = serializers.PrimaryKeyRelatedField(
        queryset=Workflow.objects.all(),
        source='workflow',
        write_only=True,
        required=True
    )

    class Meta:
        model = MarketplaceWorkflow
        fields = ['id', 'category', 'tags', 'workflow', 'workflow_id']

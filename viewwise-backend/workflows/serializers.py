from rest_framework import serializers
from .models import Workflow, Tool, Trigger
from agents.models import Agent

class ToolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tool
        fields = '__all__'

class TriggerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trigger
        fields = '__all__'

class WorkflowSerializer(serializers.ModelSerializer):
    agents = serializers.PrimaryKeyRelatedField(many=True, queryset=Agent.objects.all())
    tools = serializers.PrimaryKeyRelatedField(many=True, queryset=Tool.objects.all())
    trigger = serializers.PrimaryKeyRelatedField(queryset=Trigger.objects.all(), allow_null=True)
    nodes = serializers.JSONField()
    relations = serializers.JSONField()
    class Meta:
        model = Workflow
        fields = [
            'workflowId', 'workflowName', 'description',
            'agents', 'trigger', 'tools', 'is_active', 'nodes','relations'
        ]

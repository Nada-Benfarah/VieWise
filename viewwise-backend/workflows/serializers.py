from rest_framework import serializers
from .models import Workflow, Tool, Trigger
from agents.models import Agent
from invitations.models import Invitation

class ToolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tool
        fields = '__all__'
        read_only_fields = ['creator']

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
    owner = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = Workflow
        fields = [
            'workflowId', 'workflowName', 'description',
            'agents', 'trigger', 'tools', 'is_active', 'nodes', 'relations',
            'owner', 'role'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        print(f"✅ Création d’un workflow par {user}")
        validated_data['creator'] = user
        return super().create(validated_data)

    def get_owner(self, obj):
        return obj.creator == self.context['request'].user

    def get_role(self, obj):
        user = self.context['request'].user

        if obj.creator == user:
            return "Éditeur"

        invitations = Invitation.objects.filter(
            invited_user=user,
            status="Accepté"
        ).order_by('-created_at')

        for inv in invitations:
            if str(obj.pk) in map(str, inv.selected_workflows):
                return inv.role

        return "Visiteur"

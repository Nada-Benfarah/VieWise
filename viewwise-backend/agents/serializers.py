from rest_framework import serializers
from .models import Agent, DataSource, Modele

class DataSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = '__all__'

class ModeleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modele
        fields = '__all__'

class AgentSerializer(serializers.ModelSerializer):
    creator_email = serializers.CharField(source='creator.email', read_only=True)

    class Meta:
        model = Agent
        fields = [
            'agentId', 'agentName', 'agentRole', 'agentObjective', 'agentInstructions',
            'creator', 'creator_email', 'etat', 'datasource', 'modele'
        ]

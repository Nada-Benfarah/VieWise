from rest_framework import serializers
from agents.models import Agent
from .models import Marketplace

class AgentMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ('agentName', 'agentObjective')

class MarketplaceSerializer(serializers.ModelSerializer):
    agent = AgentMiniSerializer(read_only=True)

    class Meta:
        model = Marketplace
        fields = ['id', 'category', 'tags', 'agent']

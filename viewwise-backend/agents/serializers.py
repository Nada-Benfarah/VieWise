
from rest_framework import serializers
from .models import Agent, DataSource, Modele, AgentFile, Link
from invitations.models import Invitation

class DataSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = '__all__'

class ModeleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Modele
        fields = '__all__'

class AgentFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentFile
        fields = ['id', 'file', 'uploaded_at']

class LinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Link
        fields = ['id', 'url', 'source_name']

class AgentSerializer(serializers.ModelSerializer):
    creator_email = serializers.CharField(source='creator.email', read_only=True)
    files = serializers.SerializerMethodField()
    links = LinkSerializer(many=True, required=False)  # ← champs imbriqué via related_name='links'
    role = serializers.SerializerMethodField(read_only=True)
    owner = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Agent
        fields = [
            'agentId', 'agentName', 'agentRole', 'agentObjective', 'agentInstructions',
            'creator', 'creator_email', 'etat', 'datasource', 'modele', 'files', 'links', 'role', 'owner'
        ]

    def get_files(self, obj):
        return [
            {
                'id': f.id,
                'name': f.file.name.split('/')[-1],
                'url': f.file.url,
                'size': f.file.size
            }
            for f in obj.files.all()
        ]

    def create(self, validated_data):
        links_data = validated_data.pop('links', [])
        agent = Agent.objects.create(**validated_data)
        for link_data in links_data:
            Link.objects.create(agent=agent, **link_data)
        return agent

    def update(self, instance, validated_data):
        links_data = validated_data.pop('links', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if links_data is not None:
            # Supprime les anciens liens et les remplace
            instance.links.all().delete()
            for link_data in links_data:
                Link.objects.create(agent=instance, **link_data)

        return instance

    def get_owner(self, obj):
            user = self.context['request'].user
            return obj.creator == user

    def get_role(self, obj):
        user = self.context['request'].user

        if obj.creator == user:
            return "Éditeur"

        # 🔍 On regarde si une invitation "Acceptée" contient cet agent
        invitations = Invitation.objects.filter(
            invited_user=user,
            status="Accepté"
        ).order_by('-created_at')

        for inv in invitations:
            if str(obj.pk) in map(str, inv.selected_agents):
                return inv.role

        return "Visiteur"



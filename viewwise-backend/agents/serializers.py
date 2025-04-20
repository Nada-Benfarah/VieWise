
from rest_framework import serializers
from .models import Agent, DataSource, Modele, AgentFile

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

class AgentSerializer(serializers.ModelSerializer):
    creator_email = serializers.CharField(source='creator.email', read_only=True)
    files = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = [
            'agentId', 'agentName', 'agentRole', 'agentObjective', 'agentInstructions',
            'creator', 'creator_email', 'etat', 'datasource', 'modele', 'files'
        ]

    def get_files(self, obj):
        return [
            {
                'id': f.id,
                'name': f.file.name.split('/')[-1],
                'url': f.file.url,
                'size': f.file.size
            }
            for f in obj.files.all()  # ✅ grâce au related_name défini plus haut
        ]

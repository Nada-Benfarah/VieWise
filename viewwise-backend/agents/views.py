from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction

from .models import Agent, DataSource, Modele, AgentFile
from .serializers import AgentSerializer, DataSourceSerializer, ModeleSerializer, AgentFileSerializer
from rest_framework.generics import UpdateAPIView


# ✅ Vue pour la gestion CRUD des agents
class AgentViewSet(viewsets.ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer


# ✅ Vue pour la gestion CRUD des sources de données
class DataSourceViewSet(viewsets.ModelViewSet):
    queryset = DataSource.objects.all()
    serializer_class = DataSourceSerializer


# ✅ Vue pour la gestion CRUD des modèles
class ModeleViewSet(viewsets.ModelViewSet):
    queryset = Modele.objects.all()
    serializer_class = ModeleSerializer


# ✅ Vue pour la gestion CRUD des fichiers liés à un agent
class AgentFileViewSet(viewsets.ModelViewSet):
    queryset = AgentFile.objects.all()
    serializer_class = AgentFileSerializer
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ✅ Vue personnalisée pour créer un agent + fichiers d’un coup
class AgentCreateWithFilesView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):
        # Étape 1 : récupérer les données de l’agent depuis le formulaire
        agent_data = {
            'agentName': request.data.get('agentName'),
            'agentRole': request.data.get('agentRole'),
            'agentObjective': request.data.get('agentObjective'),
            'agentInstructions': request.data.get('agentInstructions'),
            'creator': request.data.get('creator'),
            'etat': request.data.get('etat'),
            'datasource': request.data.get('datasource'),
            'modele': request.data.get('modele')
        }

        # Étape 2 : création de l’agent
        agent_serializer = AgentSerializer(data=agent_data)
        if agent_serializer.is_valid():
            agent = agent_serializer.save()
        else:
            return Response(agent_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Étape 3 : enregistrement des fichiers s’ils existent
        files = request.FILES.getlist('files')
        for f in files:
            AgentFile.objects.create(agent=agent, file=f)

        return Response({
            "message": "Agent et fichiers enregistrés avec succès",
            "agent": agent_serializer.data
        }, status=status.HTTP_201_CREATED)

class AgentUpdateWithFilesView(UpdateAPIView):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def put(self, request, *args, **kwargs):
        instance = self.get_object()

        # Mise à jour de l'agent
        agent_data = {
            'agentName': request.data.get('agentName'),
            'agentRole': request.data.get('agentRole'),
            'agentObjective': request.data.get('agentObjective'),
            'agentInstructions': request.data.get('agentInstructions'),
            'etat': request.data.get('etat'),
            'creator': request.data.get('creator'),
            'datasource': request.data.get('datasource'),
            'modele': request.data.get('modele')
        }

        serializer = AgentSerializer(instance, data=agent_data)
        if serializer.is_valid():
            agent = serializer.save()
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Ajout des fichiers supplémentaires
        files = request.FILES.getlist('files')
        for f in files:
            AgentFile.objects.create(agent=agent, file=f)

        return Response({
            "message": "Agent mis à jour avec fichiers",
            "agent": serializer.data
        }, status=status.HTTP_200_OK)
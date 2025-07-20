from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.generics import UpdateAPIView
from django.db import transaction
import json

from .models import Agent, DataSource, Modele, AgentFile, Link
from .serializers import AgentSerializer, DataSourceSerializer, ModeleSerializer, AgentFileSerializer, LinkSerializer
from .document_loader import DocumentLoader

# ✅ Vue pour CRUD des agents
class AgentViewSet(viewsets.ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer

# ✅ Vue pour CRUD des DataSources
class DataSourceViewSet(viewsets.ModelViewSet):
    queryset = DataSource.objects.all()
    serializer_class = DataSourceSerializer

# ✅ Vue pour CRUD des Modèles IA
class ModeleViewSet(viewsets.ModelViewSet):
    queryset = Modele.objects.all()
    serializer_class = ModeleSerializer

# ✅ Vue pour CRUD des fichiers liés à un agent
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

class AgentCreateWithFilesView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):
        try:
            # ⚙️ Données principales de l'agent
            agent_data = {
                'agentName': request.data.get('agentName'),
                'agentRole': request.data.get('agentRole'),
                'agentObjective': request.data.get('agentObjective'),
                'agentInstructions': request.data.get('agentInstructions'),
                'creator': request.data.get('creator'),
                'etat': request.data.get('etat'),
                'datasource': request.data.get('datasource'),
                'modele': request.data.get('modele'),
            }

            # 📦 Création de l'agent
            agent_serializer = AgentSerializer(data=agent_data)
            agent_serializer.is_valid(raise_exception=True)
            agent = agent_serializer.save()

            # 📁 Fichiers liés
            files = request.FILES.getlist('files')
            for f in files:
                AgentFile.objects.create(agent=agent, file=f)

            # 🌐 Gestion des liens d’un seul site web
            site_web = request.data.get('site_web')  # ex: "https://example.com"
            website_links = request.data.get('website_links')  # JSON array de liens

            if site_web and website_links:
                links = json.loads(website_links)  # liste de chaînes d'URLs
                for url in links:
                    Link.objects.create(agent=agent, url=url, source_name=site_web)

            return Response({
                "message": "Agent, fichiers et liens créés avec succès",
                "agent": AgentSerializer(agent).data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AgentUpdateWithFilesView(UpdateAPIView):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def put(self, request, *args, **kwargs):
        agent = self.get_object()

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

        serializer = AgentSerializer(agent, data=agent_data)
        serializer.is_valid(raise_exception=True)
        agent = serializer.save()

        # 📁 Ajout de fichiers supplémentaires
        files = request.FILES.getlist('files')
        for f in files:
            AgentFile.objects.create(agent=agent, file=f)

        # 🔁 Mise à jour des liens (remplace les anciens)
        site_web = request.data.get('site_web')
        website_links = request.data.get('website_links')

        if site_web and website_links:
            links = json.loads(website_links)
            agent.links.all().delete()  # supprime les anciens liens
            for url in links:
                Link.objects.create(agent=agent, url=url, source_name=site_web)

        return Response({
            "message": "Agent mis à jour avec succès",
            "agent": AgentSerializer(agent).data
        }, status=status.HTTP_200_OK)


# ✅ Vue pour récupérer les liens d'un site web
class FetchLinksFromWebsite(APIView):
    def post(self, request):
        url = request.data.get('websiteUrl')
        if not url:
            return Response({"error": "URL manquante."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            loader = DocumentLoader()
            links = loader.get_urls_from_html_sitemap(url)
            return Response({"links": links}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

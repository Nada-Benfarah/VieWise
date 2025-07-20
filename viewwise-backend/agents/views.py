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
from subscriptions.models import Subscription  # ajuste l'import selon ton app
from datetime import date
from django.db.models import Q
from rest_framework.decorators import action
from invitations.models import Invitation

# ✅ Vue pour CRUD des agents
class AgentViewSet(viewsets.ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer

    def get_queryset(self):
        user = self.request.user
        return Agent.objects.filter(Q(creator=user) | Q(shared_with=user)).distinct()
        
    @action(detail=False, methods=["get"])
    def shared(self, request):
        queryset = self.get_queryset().filter(shared_with=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)



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
            creator_id = request.data.get('creator')

            # Vérifie si le champ creator est fourni
            if not creator_id:
                return Response({"error": "Le champ 'creator' est requis."}, status=status.HTTP_400_BAD_REQUEST)

            # 🔍 Vérifie l'abonnement actif du user
            try:
                subscription = Subscription.objects.get(
                    subscriber__user__id=creator_id,
                    is_active=True,
                    start_date__lte=date.today(),
                    end_date__gte=date.today()
                )
            except Subscription.DoesNotExist:
                return Response({"error": "Aucun abonnement actif trouvé."}, status=status.HTTP_403_FORBIDDEN)

            plan = subscription.plan

            # 🔢 Nombre max d'agents autorisés
            try:
                max_agents = int(plan.agent_nbr)
            except ValueError:
                return Response({"error": "La limite d'agents du plan est invalide."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 📊 Compte les agents créés par ce user
            existing_agents = Agent.objects.filter(creator_id=creator_id).count()

            if existing_agents >= max_agents:
                return Response({
                    "error": "Limite d'agents atteinte pour votre plan actuel."
                }, status=status.HTTP_403_FORBIDDEN)

            # ⚙️ Création de l'agent si tout est OK
            agent_data = {
                'agentName': request.data.get('agentName'),
                'agentRole': request.data.get('agentRole'),
                'agentObjective': request.data.get('agentObjective'),
                'agentInstructions': request.data.get('agentInstructions'),
                'creator': creator_id,
                'etat': request.data.get('etat'),
                'datasource': request.data.get('datasource'),
                'modele': request.data.get('modele'),
            }

            agent_serializer = AgentSerializer(data=agent_data)
            agent_serializer.is_valid(raise_exception=True)
            agent = agent_serializer.save()

            # 📁 Ajout de fichiers
            files = request.FILES.getlist('files')
            for f in files:
                AgentFile.objects.create(agent=agent, file=f)

            # 🌐 Ajout des liens web
            site_web = request.data.get('site_web')
            website_links = request.data.get('website_links')
            if site_web and website_links:
                links = json.loads(website_links)
                for url in links:
                    Link.objects.create(agent=agent, url=url, source_name=site_web)

            return Response({
                "message": "Agent, fichiers et liens créés avec succès",
                "agent": AgentSerializer(agent, context={"request": request}).data
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
            "message": "Agent, fichiers, liens  mis à jour avec succès",
            "agent": AgentSerializer(agent, context={"request": request}).data
        }, status=status.HTTP_201_CREATED)


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


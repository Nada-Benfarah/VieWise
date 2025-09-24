from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.generics import UpdateAPIView
from django.db import transaction
import json
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Agent, DataSource, Modele, AgentFile, Link
from .serializers import AgentSerializer, DataSourceSerializer, ModeleSerializer, AgentFileSerializer, LinkSerializer
from .document_loader import DocumentLoader
from subscriptions.models import Subscription  # ajuste l'import selon ton app
from datetime import date
from django.db.models import Q
from rest_framework.decorators import action
from invitations.models import Invitation
from django.db.models import Sum

import logging
logger = logging.getLogger(__name__)

# ✅ Vue pour CRUD des agents
class AgentViewSet(viewsets.ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer


    @action(detail=False, methods=['get'], url_path='storage-usage', permission_classes=[IsAuthenticated])
    def storage_usage(self, request):
        user = request.user
        total = (
            AgentFile.objects
            .filter(agent__creator=user)   # 👈 règle de calcul : fichiers des agents créés par l'utilisateur
            .aggregate(total=Sum('size'))
            .get('total') or 0
        )

        def humanize(n: int) -> str:
            units = ['B', 'KB', 'MB', 'GB', 'TB']
            size = float(n)
            for u in units:
                if size < 1024 or u == 'TB':
                    return f"{int(size)} {u}" if u == 'B' else f"{size:.2f} {u}"
                size /= 1024.0

        return Response({
            "bytes_used": int(total),
            "human": humanize(total)
        })

    @action(detail=True, methods=['post'], url_path='clone')
    @transaction.atomic
    def clone(self, request, pk=None):
          user = request.user
          source = get_object_or_404(Agent, pk=pk)

          # Bypass admin-like
          is_admin_like = bool(
              getattr(user, 'is_superuser', False)
              or getattr(user, 'is_staff', False)
              or getattr(user, 'is_admin', False)
          )
          if not is_admin_like:
              sub = find_active_subscription_for_user(user)
              if not sub:
                  return Response({"error": "Aucun abonnement actif trouvé."}, status=status.HTTP_403_FORBIDDEN)
              limit = parse_plan_limit(getattr(sub.plan, 'agent_nbr', None))
              if limit is not None and Agent.objects.filter(creator=user).count() >= limit:
                  return Response({"error": "Limite d'agents atteinte pour votre plan actuel."},
                                  status=status.HTTP_403_FORBIDDEN)

          # Création du clone
          clone = Agent.objects.create(
              agentName=f"{source.agentName} (Copie)",
              agentRole=source.agentRole,
              agentObjective=source.agentObjective,
              agentInstructions=source.agentInstructions,
              creator=user,
              etat='draft',
              datasource=source.datasource,
              modele=source.modele,
              parent_agent=source,
          )

          # Liens
          for link in source.links.all():
              Link.objects.create(agent=clone, url=link.url, source_name=link.source_name)

          # Fichiers (référence partagée au même fichier)
          for f in source.files.all():
              # Assigne le même chemin de fichier sans duppliquer physiquement
              new_af = AgentFile(agent=clone,  size=f.size)
              new_af.file.name = f.file.name
              new_af.save()

          data = AgentSerializer(clone, context={"request": request}).data
          return Response(data, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        user = self.request.user
        qs = Agent.objects.all()

        # Admin-like → voit tout, sinon owner/partagé
        is_admin_like = bool(getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False))
        if not is_admin_like:
            qs = qs.filter(Q(creator=user) | Q(shared_with=user)).distinct()

        # helpers
        def truthy(v):
            return str(v).lower() in {'1', 'true', 'yes', 'y', 'on'}

        # filtres marketplace
        if truthy(self.request.query_params.get('not_in_marketplace')):
            qs = qs.filter(marketplace_entry__isnull=True)
        elif truthy(self.request.query_params.get('in_marketplace')):
            qs = qs.filter(marketplace_entry__isnull=False)

        return qs.order_by('-agentId')
        
    @action(detail=False, methods=["get"])
    def shared(self, request):
        queryset = self.get_queryset().filter(shared_with=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=["get"], url_path="clones-stats")
    def clones_stats(self, request):
        # Stats globales par agent (basé sur le FK parent_agent avec related_name='clones')
        rows = Agent.objects.all()
        data = [
            {
                "agentId": a.agentId,
                "agentName": a.agentName,
                "clone_count": a.clones.count()
            }
            for a in rows
        ]
        return Response(data)



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
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        try:
            user = request.user
            logger.info("AgentCreateWithFiles by user id=%s email=%s", user.id, getattr(user, 'email', None))

            # ✅ Admin-like : superuser / staff / is_admin custom → pas de vérification de plan
            is_admin_like = bool(
                getattr(user, 'is_superuser', False)
                or getattr(user, 'is_staff', False)
                or getattr(user, 'is_admin', False)  # si votre CustomUser a ce champ
            )

            # ⚠️ on ignore le creator envoyé par le client
            creator_id = user.id

            # 🔍 Vérifications de plan UNIQUEMENT pour les non-admins
            if not is_admin_like:
                active_sub = (
                    Subscription.objects
                    .filter(
                        subscriber__user=user,
                        is_active=True,
                        start_date__lte=date.today(),
                        end_date__gte=date.today()
                    )
                    .select_related('plan').first()
                )
                if not active_sub:
                    logger.warning("No active subscription for user id=%s", user.id)
                    return Response({"error": "Aucun abonnement actif trouvé."}, status=status.HTTP_403_FORBIDDEN)

                plan = active_sub.plan

                def parse_plan_limit(value):
                    s = str(value).strip().lower()
                    return None if s in {"unlimited", "illimité", "illimite", "∞", "no_limit", "nolimit"} else int(s)

                max_agents = parse_plan_limit(plan.agent_nbr)
                if max_agents is not None:
                    existing = Agent.objects.filter(creator_id=creator_id).count()
                    if existing >= max_agents:
                        return Response({"error": "Limite d'agents atteinte pour votre plan actuel."},
                                        status=status.HTTP_403_FORBIDDEN)

            # ✅ Création de l'agent (commune admin / non-admin)
            agent_data = {
                'agentName': request.data.get('agentName'),
                'agentRole': request.data.get('agentRole'),
                'agentObjective': request.data.get('agentObjective'),
                'agentInstructions': request.data.get('agentInstructions'),
                'creator': creator_id,  # forcé côté serveur
                'etat': request.data.get('etat'),
                'datasource': request.data.get('datasource'),
                'modele': request.data.get('modele'),
            }

            parent_agent_id = request.data.get('parent_agent')
            if parent_agent_id not in (None, '', 'null'):
                agent_data['parent_agent'] = parent_agent_id

            ser = AgentSerializer(data=agent_data)
            ser.is_valid(raise_exception=True)
            agent = ser.save()

            # 📁 Fichiers
            for f in request.FILES.getlist('files'):
                AgentFile.objects.create(agent=agent, file=f, size=f.size)

            # 🔗 Liens
            site_web = request.data.get('site_web')
            website_links = request.data.get('website_links')
            if site_web and website_links:
                links = json.loads(website_links)
                for url in links:
                    Link.objects.create(agent=agent, url=url, source_name=site_web)

            return Response({"message": "Agent, fichiers et liens créés avec succès",
                             "agent": AgentSerializer(agent, context={"request": request}).data},
                            status=status.HTTP_201_CREATED)
        except Exception:
            logger.exception("Agent creation failed")
            return Response({"error": "Erreur serveur"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            AgentFile.objects.create(agent=agent, file=f, size=f.size)

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

def find_active_subscription_for_user(user, SubscriptionModel=Subscription):
    """
    Retourne la souscription active (ou None) pour l'utilisateur donné,
    entre dates et is_active=True.
    """
    if not user or not user.is_authenticated:
        return None

    sub = (
        SubscriptionModel.objects
        .filter(
            subscriber__user=user,
            is_active=True,
            start_date__lte=date.today(),
            end_date__gte=date.today()
        )
        .select_related('plan', 'subscriber', 'subscriber__user')
        .first()
    )
    return sub


def parse_plan_limit(value):
    """
    Convertit 'agent_nbr' du plan en entier (limite) ou None si illimité.
    """
    if value is None:
        return 0
    s = str(value).strip().lower()
    if s in {'unlimited', 'illimite', 'illimité', '∞', 'no_limit', 'nolimit'}:
        return None  # None = pas de limite
    try:
        return int(s)
    except ValueError:
        return 0
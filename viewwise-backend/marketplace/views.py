from rest_framework import viewsets, status
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Marketplace, MarketplaceWorkflow
from .serializers import MarketplaceSerializer, MarketplaceWorkflowSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

class MarketplaceViewSet(viewsets.ModelViewSet):
    queryset = Marketplace.objects.select_related('agent').all().order_by('-id')
    serializer_class = MarketplaceSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['category', 'tags', 'agent__agentName', 'agent__agentObjective']
    ordering_fields = ['id', 'category']

    # ✅ Blocage côté serveur (sécurité) si l’agent est utilisé
    def destroy(self, request, *args, **kwargs):
        instance: Marketplace = self.get_object()
        agent = instance.agent

        # ⚠️ suppose un M2M Workflow.agents → adaptez si nécessaire
        used_qs = MarketplaceWorkflow.objects.select_related('workflow').filter(
            workflow__agents__pk=agent.pk
        )
        if used_qs.exists():
            return Response({
                "error": "AGENT_IN_USE",
                "message": "Cet agent est utilisé par des workflows du marketplace. Supprimez ces workflows d’abord.",
                "workflows": [
                    {
                        "id": w.id,
                        "workflowId": w.workflow.workflowId,
                        "workflowName": w.workflow.workflowName,
                        "category": w.category,
                        "tags": w.tags,
                    } for w in used_qs
                ]
            }, status=status.HTTP_409_CONFLICT)

        return super().destroy(request, *args, **kwargs)


class MarketplaceWorkflowViewSet(viewsets.ModelViewSet):
    queryset = (
        MarketplaceWorkflow.objects
        .select_related("workflow")
        .prefetch_related("workflow__agents")   # 👈 important pour perf
        .all()
        .order_by("-id")
    )
    serializer_class = MarketplaceWorkflowSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['category', 'tags', 'workflow__workflowName', 'workflow__description']
    ordering_fields = ['id', 'category']

    # ✅ Endpoint de vérification d’usage d’un agent par les workflows marketplace
    @action(detail=False, methods=['get'], url_path=r'agent-usage/(?P<agent_id>\d+)')
    def agent_usage(self, request, agent_id=None):
        qs = self.queryset.filter(workflow__agents__pk=agent_id)  # M2M → adapte si autre stockage
        data = [{
            "id": r.id,
            "workflowId": r.workflow.workflowId,
            "workflowName": r.workflow.workflowName,
            "category": r.category,
            "tags": r.tags,
        } for r in qs]
        return Response({
            "in_use": qs.exists(),
            "count": qs.count(),
            "workflows": data
        })
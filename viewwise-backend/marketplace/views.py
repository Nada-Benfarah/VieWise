from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Marketplace, MarketplaceWorkflow
from .serializers import MarketplaceSerializer, MarketplaceWorkflowSerializer

class MarketplaceViewSet(viewsets.ModelViewSet):
    queryset = Marketplace.objects.select_related('agent').all().order_by('-id')
    serializer_class = MarketplaceSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['category', 'tags', 'agent__agentName', 'agent__agentObjective']
    ordering_fields = ['id', 'category']


# 👇 Nouveau
class MarketplaceWorkflowViewSet(viewsets.ModelViewSet):
    queryset = MarketplaceWorkflow.objects.select_related('workflow').all().order_by('-id')
    serializer_class = MarketplaceWorkflowSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['category', 'tags', 'workflow__workflowName', 'workflow__description']
    ordering_fields = ['id', 'category']

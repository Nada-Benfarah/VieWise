from rest_framework import viewsets
from .models import Agent, DataSource, Modele
from .serializers import AgentSerializer, DataSourceSerializer, ModeleSerializer

class AgentViewSet(viewsets.ModelViewSet):
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer

class DataSourceViewSet(viewsets.ModelViewSet):
    queryset = DataSource.objects.all()
    serializer_class = DataSourceSerializer

class ModeleViewSet(viewsets.ModelViewSet):
    queryset = Modele.objects.all()
    serializer_class = ModeleSerializer

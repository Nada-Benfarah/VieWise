from rest_framework import viewsets
from .models import Workflow, Tool, Trigger
from .serializers import WorkflowSerializer, ToolSerializer, TriggerSerializer
from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.response import Response

class WorkflowViewSet(viewsets.ModelViewSet):
    queryset = Workflow.objects.all()  # ✅ Ajoute cette ligne
    serializer_class = WorkflowSerializer

    def get_queryset(self):
        if self.request.query_params.get('all') == 'true':
                return Workflow.objects.all()
        user = self.request.user
        return Workflow.objects.filter(Q(creator=user) | Q(shared_with=user)).distinct()

    @action(detail=False, methods=["get"])
    def shared(self, request):
        shared_workflows = self.get_queryset().filter(shared_with=request.user)
        serializer = self.get_serializer(shared_workflows, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=201)

    def perform_create(self, serializer):
        serializer.save()  # Pas besoin de passer creator, il est géré dans le serializer

class ToolViewSet(viewsets.ModelViewSet):
    queryset = Tool.objects.all()
    serializer_class = ToolSerializer

class TriggerViewSet(viewsets.ModelViewSet):
    queryset = Trigger.objects.all()
    serializer_class = TriggerSerializer

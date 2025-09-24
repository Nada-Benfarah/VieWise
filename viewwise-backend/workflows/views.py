from rest_framework import viewsets
from .models import Workflow, Tool, Trigger
from .serializers import WorkflowSerializer, ToolSerializer, TriggerSerializer
from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from subscriptions.models import Subscription
from datetime import date
import json
from copy import deepcopy




def find_active_subscription_for_user(user):
    if not user or not user.is_authenticated:
        return None
    return (Subscription.objects
            .filter(
                subscriber__user=user,
                is_active=True,
                start_date__lte=date.today(),
                end_date__gte=date.today()
            )
            .select_related('plan')
            .first())

class WorkflowViewSet(viewsets.ModelViewSet):
    queryset = Workflow.objects.all()  # ✅ Ajoute cette ligne
    serializer_class = WorkflowSerializer


    def get_queryset(self):
        user = self.request.user
        # ✅ Les admins voient TOUT (donc DELETE fonctionne sans ?all=true)
        if user.is_staff or user.is_superuser:
            return Workflow.objects.all()

        # Sinon : seulement ses workflows (créés ou partagés)
        from django.db.models import Q
        return Workflow.objects.filter(Q(creator=user) | Q(shared_with=user)).distinct()
#     def get_object(self):
#         queryset = Workflow.objects.filter(
#             Q(creator=self.request.user) | Q(shared_with=self.request.user)
#         ).distinct()
#         return queryset.get(pk=self.kwargs["pk"])
#
    @action(detail=True, methods=["get"], url_path="public")
    def get_public_workflow(self, request, pk=None):
        try:
            workflow = Workflow.objects.get(pk=pk)
            serializer = self.get_serializer(workflow)
            return Response(serializer.data)
        except Workflow.DoesNotExist:
            return Response({"detail": "Workflow introuvable."}, status=status.HTTP_404_NOT_FOUND)

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

    @action(detail=True, methods=['post'], url_path='clone')
    @transaction.atomic
    def clone(self, request, pk=None):
        user = request.user
        source = get_object_or_404(Workflow, pk=pk)

        # Bypass admin-like
        is_admin_like = bool(getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False) or getattr(user, 'is_admin', False))
        if not is_admin_like:
            sub = find_active_subscription_for_user(user)
            if not sub:
                return Response({"error": "Aucun abonnement actif trouvé."}, status=403)
            if (getattr(sub.plan, 'name', '') or '').lower() != 'business':
                return Response({"error": "Fonctionnalité disponible uniquement pour le plan Business."}, status=403)

        # ✅ Deep copy uniquement des champs JSON (adaptez aux vôtres)
        json_like_fields = ['nodes', 'relations', 'config', 'payload']  # ⚠️ retirez 'tools', 'agents', 'trigger'
        base = {}
        for f in json_like_fields:
            if hasattr(source, f):
                val = getattr(source, f)
                base[f] = None if val is None else deepcopy(val)

        # ✅ Création du clone (sauvé immédiatement)
        clone = Workflow.objects.create(
            workflowName=f"{source.workflowName} (Copie)",
            description=source.description,
            creator=user,
            parent_workflow=source,
            **base
        )

        # ✅ Copier les relations M2M si elles existent
        # tools
        if hasattr(source, 'tools') and hasattr(clone, 'tools'):
            try:
                clone.tools.set(source.tools.all())
            except Exception:
                pass
        # agents
        if hasattr(source, 'agents') and hasattr(clone, 'agents'):
            try:
                clone.agents.set(source.agents.all())
            except Exception:
                pass

        # ✅ Dupliquer un éventuel Trigger (OneToOne/ForeignKey)
        if hasattr(source, 'trigger') and getattr(source, 'trigger', None):
            t = source.trigger
            # Copie générique des champs simples (hors PK et FK vers workflow)
            field_values = {}
            for field in t._meta.fields:
                name = field.name
                if name in ('id', 'pk', 'workflow'):
                    continue
                field_values[name] = getattr(t, name)
            try:
                Trigger.objects.create(workflow=clone, **field_values)
            except Exception:
                # Si votre modèle Trigger ne suit pas ce schéma, ignorez/ajustez.
                pass

        data = WorkflowSerializer(clone, context={"request": request}).data
        return Response(data, status=201)

    @action(detail=False, methods=['get'], url_path='clones-stats')
    def clones_stats(self, request):
        rows = Workflow.objects.all()
        data = [
            {
                "workflowId": w.workflowId,
                "workflowName": w.workflowName,
                "clone_count": w.clones.count()
            } for w in rows
        ]
        return Response(data)

class ToolViewSet(viewsets.ModelViewSet):
    queryset = Tool.objects.all()
    serializer_class = ToolSerializer

class TriggerViewSet(viewsets.ModelViewSet):
    queryset = Trigger.objects.all()
    serializer_class = TriggerSerializer

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .models import Invitation
from .serializers import InvitationSerializer
from agents.models import Agent
from workflows.models import Workflow
from django.shortcuts import redirect
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.contrib.auth import get_user_model

CustomUser = get_user_model()


class InvitationViewSet(viewsets.ModelViewSet):
    queryset = Invitation.objects.all()
    serializer_class = InvitationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        data = self.request.data
        invitation = serializer.save(
            sender=self.request.user.subscriber_profile,
            status="En cours",
            selected_agents=data.get("selected_agents", []),
            selected_workflows=data.get("selected_workflows", [])
        )
        invitation_id = invitation.pk
        activation_link = f"http://localhost:8000/api/invitations/{invitation_id}/accept/"
        rejection_link = f"http://localhost:8000/api/invitations/{invitation_id}/reject/"

        subject = "Invitation à rejoindre un projet sur VieWise"
        # Ajouter avant render_to_string
        agent_names = Agent.objects.filter(pk__in=invitation.selected_agents).values_list('agentName', flat=True)
        workflow_names = Workflow.objects.filter(pk__in=invitation.selected_workflows).values_list('workflowName', flat=True)

        html_message = render_to_string("account/email/invitation_email.html", {
            "receiver_name": invitation.receiver_email.split('@')[0],
            "sender_email": invitation.sender.user.email,
            "role": invitation.role,
            "expiration_date": invitation.expiration_date.strftime('%d/%m/%Y'),
            "activation_link": activation_link,
            "rejection_link": rejection_link,
            "selected_agents": list(agent_names),
            "selected_workflows": list(workflow_names)
        })


        plain_message = strip_tags(html_message)

        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [invitation.receiver_email],
            html_message=html_message
        )



    @action(detail=False, methods=['get'], url_path='projects')
    def get_projects(self, request):
        user = request.user
        agents = Agent.objects.filter(creator=user).values('agentId', 'agentName')
        workflows = Workflow.objects.filter(agents__creator=user).distinct().values('workflowId', 'workflowName')

        projects = [{"id": a["agentId"], "name": a["agentName"], "type": "agent"} for a in agents]
        projects += [{"id": w["id"], "name": w["workflowName"], "type": "workflow"} for w in workflows]

        return Response(projects)

    @action(detail=False, methods=['get'], url_path='remaining')
    def remaining_invitations(self, request):
        user = request.user

        if not hasattr(user, 'subscriber_profile'):
            return Response({"error": "Profil abonné introuvable."}, status=400)

        subscriber = user.subscriber_profile

        # ✅ Déclarer active_subscription ici
        active_subscription = subscriber.subscriptions.filter(is_active=True).first()

        if not active_subscription:
            return Response({"error": "Aucun abonnement actif trouvé."}, status=400)

        plan = active_subscription.plan
        total_limit = plan.invitation_nbr

        used = Invitation.objects.filter(
            sender=subscriber,
            status__in=["En cours", "Accepté"]
        ).count()

        remaining = max(total_limit - used, 0)

        return Response({
            "used": used,
            "remaining": remaining,
            "total": total_limit
        })

    @action(detail=True, methods=['patch'], url_path='set-status')
    def set_status(self, request, pk=None):
        invitation = self.get_object()
        new_status = request.data.get("status")

        if new_status not in ["Accepté", "Rejeté"]:
            return Response({"error": "Statut invalide."}, status=400)

        invitation.status = new_status
        invitation.save()

        return Response({"status": invitation.status}, status=200)

    @action(detail=False, methods=['get'], url_path='sent')
    def get_sent_invitations(self, request):
        subscriber = request.user.subscriber_profile
        invitations = Invitation.objects.filter(sender=subscriber)

        response_data = []
        for inv in invitations:
            agent_names = Agent.objects.filter(pk__in=inv.selected_agents).values_list('agentName', flat=True)
            workflow_names = Workflow.objects.filter(pk__in=inv.selected_workflows).values_list('workflowName', flat=True)

            response_data.append({
                "id": inv.id,
                "receiver_email": inv.receiver_email,
                "status": inv.status,
                "created_at": inv.created_at,
                "expiration_date": inv.expiration_date,
                "role": inv.role,
                "selected_agents": list(agent_names),
                "selected_workflows": list(workflow_names)
            })

        return Response(response_data)

    @action(detail=True, methods=['get'], url_path='accept', permission_classes=[])
    def accept_invitation(self, request, pk=None):
        invitation = get_object_or_404(Invitation, pk=pk)

        if invitation.status != "En cours":
            return HttpResponse("Invitation déjà traitée.", status=400)

        # ✅ Créer ou récupérer l'utilisateur invité
        invited_email = invitation.receiver_email.lower().strip()
        invited_user, created = CustomUser.objects.get_or_create(
            email=invited_email,
            defaults={
                'is_active': True,
                'first_name': invited_email.split('@')[0].title(),
                'last_name': '',
                'password': CustomUser.objects.make_random_password(),
            }
        )

        # ✅ 🟡 Ajoute CETTE LIGNE ICI (important pour le get_role)
        invitation.invited_user = invited_user
        invitation.save()

        # ✅ Partager les agents
        for agent_id in invitation.selected_agents:
            try:
                agent = Agent.objects.get(pk=agent_id)
                agent.shared_with.add(invited_user)
            except Agent.DoesNotExist:
                pass

        # ✅ Partager les workflows
        for workflow_id in invitation.selected_workflows:
            try:
                workflow = Workflow.objects.get(pk=workflow_id)
                workflow.shared_with.add(invited_user)
            except Workflow.DoesNotExist:
                pass

        # ✅ Mettre à jour le statut
        invitation.status = "Accepté"
        invitation.save()

        # ✅ Rediriger vers login frontend
        return redirect("http://localhost:4200/login")


    @action(detail=True, methods=['get'], url_path='reject', permission_classes=[])
    def reject_invitation(self, request, pk=None):
        invitation = get_object_or_404(Invitation, pk=pk)
        if invitation.status != "En cours":
            return HttpResponse("Invitation déjà traitée.", status=400)
        invitation.status = "Rejeté"
        invitation.save()
        return HttpResponse("Invitation refusée pour réjoidre VieWise. Merci de votre réponse.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # 🔒 Vérifie qu'on a un invited_user pour nettoyer proprement
        if instance.invited_user:
            invited_user = instance.invited_user

            # ✅ Supprimer tous les agents partagés par cette invitation
            for agent_id in instance.selected_agents:
                try:
                    agent = Agent.objects.get(pk=agent_id)
                    agent.shared_with.remove(invited_user)
                except Agent.DoesNotExist:
                    pass

            # ✅ (Optionnel) Supprimer aussi les workflows partagés
            for workflow_id in instance.selected_workflows:
                try:
                    workflow = Workflow.objects.get(pk=workflow_id)
                    workflow.shared_with.remove(invited_user)
                except:
                    pass

        return super().destroy(request, *args, **kwargs)

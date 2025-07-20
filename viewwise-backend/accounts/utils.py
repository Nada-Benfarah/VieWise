from invitations.models import Invitation

def post_signup_logic(user):
    invitation = Invitation.objects.filter(
        receiver_email=user.email,
        status="Accepté",
        invited_user__isnull=True
    ).first()

    if invitation:
        invitation.invited_user = user
        invitation.save()

        for agent in invitation.selected_agents.all():
            agent.shared_with.add(user)
            agent.save()

        for workflow in invitation.selected_workflows.all():
            workflow.shared_with.add(user)
            workflow.save()


from rest_framework import viewsets
from .models import Invitation
from .serializers import InvitationSerializer
from rest_framework.permissions import IsAuthenticated

class InvitationViewSet(viewsets.ModelViewSet):
    queryset = Invitation.objects.all()
    serializer_class = InvitationSerializer
    permission_classes = [IsAuthenticated]
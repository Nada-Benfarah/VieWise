
from rest_framework import serializers
from .models import Invitation

class InvitationSerializer(serializers.ModelSerializer):
    selected_agents = serializers.ListField(child=serializers.CharField(), required=False)
    selected_workflows = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Invitation
        fields = [
            'id',
            'receiver_email',
            'status',
            'created_at',
            'expiration_date',
            'role',
            'selected_agents',
            'selected_workflows',
        ]


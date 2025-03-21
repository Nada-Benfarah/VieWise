# social_serializers.py
from rest_framework import serializers
from accounts.models import CustomUser

class SocialUserSerializer(serializers.ModelSerializer):
    """Serializer for social login user data."""
    class Meta:
        model = CustomUser
        fields = ["id", "email", "first_name", "last_name", "phone_number"]
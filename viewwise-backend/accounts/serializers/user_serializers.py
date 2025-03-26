from rest_framework import serializers
from ..models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    """Serializer for displaying user information."""
    class Meta:
        model = CustomUser
        fields = ["id", "email", "phone_number", "first_name", "last_name", "is_active", "is_staff"]
        read_only_fields = ["id", "email", "is_active", "is_staff"]
# password_serializers.py
from rest_framework import serializers
from ..models import CustomUser
# ✅ Password Reset Request Serializer
class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting password reset"""
    email = serializers.EmailField()

    def validate_email(self, value):
        """Ensure the email exists in the database before allowing reset."""
        value = value.lower().strip()
        if not CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("No account found with this email.")
        return value


# ✅ Password Reset Confirmation Serializer
class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming password reset"""
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    new_password2 = serializers.CharField(write_only=True, required=True, min_length=8, label="Confirm Password")

    def validate(self, data):
        """Ensure passwords match."""
        if data["new_password"] != data["new_password2"]:
            raise serializers.ValidationError({"new_password2": "Passwords do not match."})
        return data

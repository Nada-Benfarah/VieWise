# auth_serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from datetime import timedelta
import re
from ..models import CustomUser


# ✅ Register Serializer
class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration with advanced validation."""
#     email = serializers.EmailField(
#         required=True,
#         validators=[
#             UniqueValidator(queryset=CustomUser.objects.all(), message="An account already exists with this email.")]
#     )
#     phone_number = serializers.CharField(required=False, allow_blank=True)
#     password = serializers.CharField(write_only=True, required=True, min_length=8)
#     password2 = serializers.CharField(write_only=True, required=True, min_length=8, label="Confirm Password")

    username = serializers.CharField(write_only=True)  # on le mappe sur first_name
    password = serializers.CharField(write_only=True, required=True, min_length=8)

    class Meta:
        model = CustomUser
#         fields = ["email", "phone_number", "first_name", "last_name", "password", "password2"]
        fields = ["username", "email", "password"]  # ✅ Ajoute bien 'username' ici


    def validate_email(self, value):
        """Ensure email is always stored in lowercase and stripped of spaces."""
        return value.strip().lower()

    def validate_phone_number(self, value):
        """Ensure phone number format is valid."""
        if value:
            value = value.strip()
            if not re.match(r"^\+?[1-9]\d{6,14}$", value):
                raise serializers.ValidationError("Invalid phone number format. Use +123456789 or 0123456789 format.")
        return value

    def validate_password(self, value):
        """Validate password complexity and prevent personal data usage."""
        validate_password(value)  # Enforce Django's built-in password strength rules
        password_lower = value.lower()

        # Prevent usage of email, name, or phone in password
        forbidden_values = [
            self.initial_data.get("email", "").split("@")[0].lower(),
            self.initial_data.get("first_name", "").lower(),
            self.initial_data.get("last_name", "").lower(),
            re.sub(r"\D", "", self.initial_data.get("phone_number", "")) if self.initial_data.get(
                "phone_number") else "",
        ]
        if any(value and value in password_lower for value in forbidden_values):
            raise serializers.ValidationError("The password must not contain your name, email, or phone number.")

        return value

    def validate(self, data):
        return data

    def create(self, validated_data):
        first_name = validated_data.pop("username")
        email = validated_data["email"]
        password = validated_data["password"]

        user = CustomUser.objects.create_user(
            email=email,
            first_name=first_name,
            last_name="",
            password=password
        )
#         user.is_active = False  # 👈 Désactive le compte à la création
        user.save()
        return user


# ✅ JWT Token Serializer
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer that includes user details and token expiration."""

    def validate(self, attrs):
        data = super().validate(attrs)

        # Include user details in response
        data["user"] = {
            "id": self.user.id,
            "email": self.user.email,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "phone_number": self.user.phone_number if self.user.phone_number else None,
            "is_superuser": self.user.is_superuser,
        }

        # Include token expiration time
        access_token_lifetime = settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME", timedelta(minutes=60))
        data["expires_in"] = int(access_token_lifetime.total_seconds())

        # Include token type
        data["token_type"] = "Bearer"

        return data


# ✅ JWT Refresh Token Serializer
class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    """Custom serializer to add token expiration info in refresh response."""

    def validate(self, attrs):
        data = super().validate(attrs)

        # Include expiration time
        access_token_lifetime = settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME", timedelta(minutes=60))
        data["expires_in"] = int(access_token_lifetime.total_seconds())
        data["token_type"] = "Bearer"

        return data

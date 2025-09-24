from rest_framework import serializers
from ..models import CustomUser
import re

class UserSerializer(serializers.ModelSerializer):
    """Serializer for displaying user information."""
    class Meta:
        model = CustomUser
        fields = ["id", "email", "phone_number", "first_name", "last_name", "is_active", "is_staff","email_verified"]
        read_only_fields = ["id", "email", "is_active", "is_staff","email_verified"]


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ("first_name", "phone_number")

    def validate_first_name(self, value):
        return value.strip().title()

    def validate_phone_number(self, value):
        if value in (None, ""):
            return value
        value = value.strip()
        # E.164 “souple” : + ou 0 en tête, 7–15 chiffres
        if not re.match(r"^\+?[0-9]\d{6,14}$", value):
            raise serializers.ValidationError(
                "Format invalide. Exemple: +33123456789 ou 0123456789."
            )
        return value


class AvatarUploadSerializer(serializers.Serializer):
    avatar = serializers.ImageField()

    def validate_avatar(self, value):
        max_mb = 5
        if value.size > max_mb * 1024 * 1024:
            raise serializers.ValidationError(f"Image trop volumineuse (>{max_mb}MB).")
        content_type = getattr(value, 'content_type', '')
        if content_type not in ('image/jpeg', 'image/png', 'image/webp'):
            raise serializers.ValidationError("Formats autorisés: JPEG, PNG, WEBP.")
        return value

    def save(self, **kwargs):
        user: CustomUser = self.context['request'].user
        new_file = self.validated_data['avatar']

        # Supprime l'ancienne si existe
        if user.avatar:
            user.avatar.delete(save=False)

        user.avatar = new_file
        user.save(update_fields=['avatar'])
        return user


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id", "email", "first_name", "last_name", "phone_number",
            "is_active", "is_staff", "is_superuser", "date_joined",
            "password", "avatar_url","email_verified",
        ]
        read_only_fields = ["id", "date_joined"]

    def get_avatar_url(self, obj):
        req = self.context.get("request")
        if obj.avatar and req:
            try:
                return req.build_absolute_uri(obj.avatar.url)
            except Exception:
                return None
        return None

    def validate_email(self, v):
        return v.strip().lower()

    def validate_first_name(self, v):
        return (v or "").strip().title()

    def validate_last_name(self, v):
        return (v or "").strip().title()

    def validate_phone_number(self, v):
        if v in (None, ""): return v
        v = v.strip()
        if not re.match(r"^\+?[0-9]\d{6,14}$", v):
            raise serializers.ValidationError("Format invalide (+33123456789 ou 0123456789).")
        return v

    def create(self, validated):
        pwd = validated.pop("password", None)
        user = CustomUser.objects.create(**validated)
        user.set_password(pwd or CustomUser.objects.make_random_password())
        user.save()
        return user

    def update(self, instance, validated):
        pwd = validated.pop("password", None)
        for k, v in validated.items():
            setattr(instance, k, v)
        if pwd:
            instance.set_password(pwd)
        instance.save()
        return instance
# accounts/serializers/onboarding_serializers.py
from rest_framework import serializers
from accounts.models import UserOnboarding

class UserOnboardingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserOnboarding
        fields = ['discovery', 'role', 'goal', 'company_size']

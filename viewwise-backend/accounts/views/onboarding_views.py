# accounts/views/onboarding_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.models import UserOnboarding
from accounts.serializers.onboarding_serializers import UserOnboardingSerializer

class UserOnboardingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UserOnboardingSerializer(data=request.data)
        if serializer.is_valid():
            UserOnboarding.objects.update_or_create(
                user=request.user,
                defaults=serializer.validated_data
            )
            return Response({"message": "Onboarding sauvegardé avec succès."})
        return Response(serializer.errors, status=400)

    def get(self, request):
        onboarding = getattr(request.user, "onboarding", None)
        if onboarding:
            serializer = UserOnboardingSerializer(onboarding)
            return Response(serializer.data)
        return Response({"detail": "Aucune donnée trouvée."}, status=404)

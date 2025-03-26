# user_views.py
from rest_framework import status
from rest_framework.generics import ListAPIView
from django.contrib.auth import get_user_model
from ..permissions import IsSuperUser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from accounts.serializers.user_serializers import UserSerializer

import logging

User = get_user_model()
logger = logging.getLogger(__name__)

# ✅ User Profile
class UserProfileView(APIView):
    """Retrieve authenticated user profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
            user = request.user
            data = {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone_number": user.phone_number,
            }
            return Response(data)

    def delete(self, request):
            user = request.user
            user.delete()
            return Response({"detail": "Compte supprimé avec succès."}, status=status.HTTP_204_NO_CONTENT)


# ✅ List All Users (SuperUser Only)
class UserListView(ListAPIView):
    """List all users (only accessible to superusers)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsSuperUser]


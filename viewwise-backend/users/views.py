from rest_framework import viewsets, permissions
from accounts.models import CustomUser
from .serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]  # uniquement admin par défaut

    def get_queryset(self):
        # Permet à un utilisateur normal de voir uniquement son propre profil
        user = self.request.user
        if user.is_staff:
            return CustomUser.objects.all()
        return CustomUser.objects.filter(id=user.id)

    def perform_update(self, serializer):
        # Empêche un utilisateur lambda de modifier des champs sensibles
        user = self.request.user
        if not user.is_staff:
            serializer.save(is_active=user.is_active, is_staff=user.is_staff)
        else:
            serializer.save()


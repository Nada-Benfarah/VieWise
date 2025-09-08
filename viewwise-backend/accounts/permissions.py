from rest_framework import permissions
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSuperUser(permissions.BasePermission):
    """
    ✅ Custom permission to allow only superusers to access a specific API view.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    ✅ Custom permission that allows:
        - Read-only access to all users.
        - Write access (POST, PUT, DELETE) only for staff/admin users.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:  # GET, HEAD, OPTIONS
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    ✅ Custom permission that allows:
        - Users to edit their own profile.
        - Read-only access for other users.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:  # GET, HEAD, OPTIONS
            return True
        return obj == request.user  # User can only modify their own account


class IsAuthenticatedAndVerified(permissions.BasePermission):
    """
    ✅ Custom permission that allows only authenticated users with verified emails.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_active)

class IsSuperOrStaffReadOnly(BasePermission):
    """
    - SAFE_METHODS (GET, HEAD, OPTIONS): staff OU superuser
    - autres méthodes (POST, PATCH, DELETE...): superuser uniquement
    """
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return user.is_staff or user.is_superuser
        return user.is_superuser

class IsAdminOrStaff(BasePermission):
    """
    Autorise l'accès si l'utilisateur est staff ou superuser.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser))

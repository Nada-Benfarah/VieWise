from rest_framework import permissions


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

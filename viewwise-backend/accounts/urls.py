from django.urls import path, include
from accounts.views.auth_views import (
    RegisterView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    LogoutView,
    ActivateAccountRedirectView  # ✅ Import ajouté ici
)
from accounts.views.password_views import (
    PasswordResetRequestView,
    PasswordResetConfirmView
)
from accounts.views.social_views import (
    GoogleLogin,
    FacebookLogin,
    AppleLogin,
    OutlookLogin
)
from accounts.views.user_views import (
    UserProfileView,
    UserListView,
    UserAvatarView
)
from accounts.views.onboarding_views import UserOnboardingView
from accounts.views.user_views import AdminUserViewSet, AdminStaffViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-users')
router.register(r'admins', AdminStaffViewSet, basename='admin-staff')  # 👈

urlpatterns = [
    # ✅ Authentication
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("onboarding/", UserOnboardingView.as_view(), name="user-onboarding"),


    # ✅ Password Reset
    path("password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("reset-password/<uidb64>/<token>/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm_post"),

    # ✅ Account Activation
    path("activate/<uidb64>/<token>/", ActivateAccountRedirectView.as_view(), name="activate_account"),

    # ✅ Social Logins
    path("social/google/", GoogleLogin.as_view(), name="google_login"),
    path("social/facebook/", FacebookLogin.as_view(), name="facebook_login"),
    path("social/apple/", AppleLogin.as_view(), name="apple_login"),
    path("social/outlook/", OutlookLogin.as_view(), name="outlook_login"),

    # ✅ User Management
    path("me/", UserProfileView.as_view(), name="user-profile"),
    path("me/avatar/", UserAvatarView.as_view(), name="user-avatar"),
#     path("users/", UserListView.as_view(), name="user-list"),

    path("", include(router.urls)),

]

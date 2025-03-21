# password_serializers.py
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from django.contrib.sites.shortcuts import get_current_site
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import CustomUser
from accounts.serializers.password_serializers import PasswordResetRequestSerializer
import logging
from django.conf import settings

User = get_user_model()
logger = logging.getLogger(__name__)


# ✅ Password Reset Request
class PasswordResetRequestView(APIView):
    """Request password reset via email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            try:
                user = User.objects.get(email=email)
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                # ✅ Get frontend URL from settings instead of hardcoding
                frontend_url = settings.FRONTEND_URL.rstrip("/")  # Remove trailing slash if exists
                reset_link = f"{frontend_url}/reset-password?uid={uid}&token={token}"

                # ✅ Render Email Template
                email_subject = settings.PASSWORD_RESET_SUBJECT
                email_body = render_to_string("account/email/password_reset_message.html", {
                    "user": user,
                    "reset_link": reset_link,
                })

                send_mail(
                    subject=email_subject,
                    message=email_body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )

                logger.info(f"✅ Password reset email sent to {email}")
                return Response({"message": "Password reset email sent!"}, status=status.HTTP_200_OK)

            except User.DoesNotExist:
                logger.warning(f"⚠️ Password reset attempted for non-existing email: {email}")
                return Response({"error": "Invalid email"}, status=status.HTTP_400_BAD_REQUEST)


# ✅ Confirm Password Reset
class PasswordResetConfirmView(APIView):
    """Confirm password reset using token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("password")

        if not uidb64 or not token or not new_password:
            return Response({"error": "Missing required fields"}, status=400)

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = CustomUser.objects.get(pk=uid)

            if not default_token_generator.check_token(user, token):
                return Response({"error": "Invalid token"}, status=400)

            user.set_password(new_password)
            user.save()
            return Response({"message": "Password reset successful"}, status=200)

        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            return Response({"error": "Invalid request"}, status=400)

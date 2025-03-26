from django.contrib.auth.models import BaseUserManager
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    """Custom manager for CustomUser, using email as the unique identifier."""

    use_in_migrations = True  # Ensures this manager is used during migrations

    def create_user(self, email, first_name, last_name="", password=None, **extra_fields):
        if not email:
            raise ValueError(_("The email field must be set"))
        if not first_name:
            raise ValueError(_("First name is required"))

        email = self.normalize_email(email.strip().lower())
        first_name = first_name.strip().title()
        last_name = last_name.strip().title() if last_name else ""

        extra_fields.setdefault("is_active", False)
        user = self.model(email=email, first_name=first_name, last_name=last_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, first_name, last_name, password=None, **extra_fields):
        """Creates and returns a superuser with admin privileges."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if not extra_fields.get("is_staff"):
            raise ValueError(_("Superuser must have is_staff=True."))
        if not extra_fields.get("is_superuser"):
            raise ValueError(_("Superuser must have is_superuser=True."))

        return self.create_user(email, first_name, last_name, password, **extra_fields)

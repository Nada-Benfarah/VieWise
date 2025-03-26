from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from .managers import CustomUserManager

# ✅ Utilisateur principal
class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=15, null=True, blank=True, verbose_name="Phone number")

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    def save(self, *args, **kwargs):
        self.email = self.email.lower().strip()
        self.first_name = self.first_name.strip().title()
        self.last_name = self.last_name.strip().title()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


# ✅ Rôle et permissions
class Role(models.Model):
    name = models.CharField(max_length=100)
    permissions = models.JSONField()

    def __str__(self):
        return self.name


class Permission(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.name} ({self.code})"


class SuperAdministrator(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='admin_profile')
    can_manage_settings = models.BooleanField(default=True)

    def __str__(self):
        return f"Super Admin - {self.user.email}"






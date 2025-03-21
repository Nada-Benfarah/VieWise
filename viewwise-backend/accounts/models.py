from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from allauth.account.signals import email_confirmed
from django.dispatch import receiver
from .managers import CustomUserManager

class CustomUser(AbstractBaseUser, PermissionsMixin):
    """Custom user model using email as the unique identifier."""
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=15,null=True,blank=True,verbose_name="Phone number")

    # Permissions & Status Fields
    is_staff = models.BooleanField(default=False)  # Can access the admin panel?
    is_active = models.BooleanField(default=False)  # Is the account activated?
    date_joined = models.DateTimeField(default=timezone.now)

    # Custom manager
    objects = CustomUserManager()  # ✅ Link the custom manager

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    def save(self, *args, **kwargs):
        """Ensure email is always saved in lowercase."""
        self.email = self.email.lower().strip()
        self.first_name = self.first_name.strip().title()
        self.last_name = self.last_name.strip().title()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email

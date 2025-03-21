from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import CustomUser

# Custom forms for creating and updating users in Django admin
class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = CustomUser
        fields = ("email", "first_name", "last_name")

class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = CustomUser
        fields = ("email", "phone_number", "first_name", "last_name", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    form = CustomUserChangeForm  # Use the custom change form
    add_form = CustomUserCreationForm  # Use the custom creation form

    list_display = ("email", "phone_number", "first_name", "last_name", "is_active", "is_staff", "is_superuser")
    search_fields = ("email", "phone_number", "first_name", "last_name")
    list_filter = ("is_staff", "is_active", "is_superuser")
    ordering = ("email",)

    fieldsets = (
        ("Informations personnelles", {"fields": ("email", "phone_number", "password", "first_name", "last_name")}),
        ("Statut et Permissions", {
            "fields": ("is_active", "is_staff", "is_superuser"),
            "classes": ("collapse",),  # ✅ Make permissions collapsible in UI
        }),
        ("Groupes et Permissions", {
            "fields": ("groups", "user_permissions"),
            "classes": ("collapse",),
        }),
        ("Dates Importantes", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        ("Informations personnelles", {
            "classes": ("wide",),
            "fields": (
                "email", "phone_number", "first_name", "last_name",
                "password1", "password2", "is_active", "is_staff", "is_superuser"
            ),
        }),
    )

admin.site.register(CustomUser, CustomUserAdmin)

# Generated by Django 4.2.20 on 2025-07-19 17:04

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('invitations', '0005_invitation_selected_agents_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='invitation',
            name='invited_user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='received_invitations', to=settings.AUTH_USER_MODEL),
        ),
    ]

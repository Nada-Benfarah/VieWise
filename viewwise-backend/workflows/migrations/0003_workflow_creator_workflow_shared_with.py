# Generated by Django 4.2.20 on 2025-07-20 21:41

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('workflows', '0002_workflow_nodes_workflow_relations'),
    ]

    operations = [
        migrations.AddField(
            model_name='workflow',
            name='creator',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='created_workflows', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='workflow',
            name='shared_with',
            field=models.ManyToManyField(blank=True, related_name='shared_workflows', to=settings.AUTH_USER_MODEL),
        ),
    ]

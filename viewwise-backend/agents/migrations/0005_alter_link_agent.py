# Generated by Django 4.2.20 on 2025-05-17 13:23

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('agents', '0004_agent_link_list_link'),
    ]

    operations = [
        migrations.AlterField(
            model_name='link',
            name='agent',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='agent_links', to='agents.agent'),
        ),
    ]

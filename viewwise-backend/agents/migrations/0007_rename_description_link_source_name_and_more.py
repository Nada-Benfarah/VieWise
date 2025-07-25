# Generated by Django 4.2.20 on 2025-05-17 17:34

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('agents', '0006_rename_link_list_agent_links'),
    ]

    operations = [
        migrations.RenameField(
            model_name='link',
            old_name='description',
            new_name='source_name',
        ),
        migrations.RemoveField(
            model_name='agent',
            name='links',
        ),
        migrations.AlterField(
            model_name='link',
            name='agent',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='links', to='agents.agent'),
        ),
    ]

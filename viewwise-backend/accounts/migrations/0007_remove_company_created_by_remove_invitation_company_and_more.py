# Generated by Django 4.2.20 on 2025-03-26 00:24

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_company_datasource_modele_permission_role_subscriber_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='company',
            name='created_by',
        ),
        migrations.RemoveField(
            model_name='invitation',
            name='company',
        ),
        migrations.RemoveField(
            model_name='log',
            name='user',
        ),
        migrations.RemoveField(
            model_name='report',
            name='created_by',
        ),
        migrations.RemoveField(
            model_name='subscriber',
            name='role',
        ),
        migrations.RemoveField(
            model_name='subscriber',
            name='user',
        ),
        migrations.RemoveField(
            model_name='subscription',
            name='subscriber',
        ),
        migrations.RemoveField(
            model_name='tool',
            name='workflow',
        ),
        migrations.RemoveField(
            model_name='trigger',
            name='workflow',
        ),
        migrations.RemoveField(
            model_name='workflow',
            name='creator',
        ),
        migrations.DeleteModel(
            name='Agent',
        ),
        migrations.DeleteModel(
            name='Company',
        ),
        migrations.DeleteModel(
            name='DataSource',
        ),
        migrations.DeleteModel(
            name='Invitation',
        ),
        migrations.DeleteModel(
            name='Log',
        ),
        migrations.DeleteModel(
            name='Modele',
        ),
        migrations.DeleteModel(
            name='Report',
        ),
        migrations.DeleteModel(
            name='Subscriber',
        ),
        migrations.DeleteModel(
            name='Subscription',
        ),
        migrations.DeleteModel(
            name='Tool',
        ),
        migrations.DeleteModel(
            name='Trigger',
        ),
        migrations.DeleteModel(
            name='Workflow',
        ),
    ]

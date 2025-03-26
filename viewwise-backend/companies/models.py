from django.db import models

class Company(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Role(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='roles')
    subscriber = models.ForeignKey('subscriptions.Subscriber', on_delete=models.CASCADE, related_name='roles')
    workflow = models.ForeignKey('workflows.Workflow', on_delete=models.CASCADE, related_name='roles')

    def __str__(self):
        return self.name

class Permission(models.Model):
    role = models.ForeignKey('companies.Role', on_delete=models.CASCADE, related_name='permissions')
    actions = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.role.name} - {self.actions}"

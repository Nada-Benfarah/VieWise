from django.contrib import admin
from .models import Workflow, Tool, Trigger

admin.site.register(Workflow)
admin.site.register(Tool)
admin.site.register(Trigger)

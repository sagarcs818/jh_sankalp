from django.contrib import admin
from .models import Challenge

@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'location', 'status', 'priority', 'reported_by', 'created_at')
    list_filter = ('status', 'category', 'priority')
    search_fields = ('title', 'location', 'description')
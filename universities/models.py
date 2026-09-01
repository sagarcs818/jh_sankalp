from django.db import models

class University(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    district = models.CharField(max_length=100)
    specialization_domains = models.JSONField(default=list, help_text="List of categories (e.g. ['water', 'infrastructure', 'disaster'])")
    incubation_center = models.CharField(max_length=255, blank=True)
    contact_email = models.EmailField()
    active_faculty_count = models.PositiveIntegerField(default=20)

    def __str__(self):
        return self.name
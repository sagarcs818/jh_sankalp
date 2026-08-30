from django.db import models
from django.conf import settings

class Challenge(models.Model):
    CATEGORY_CHOICES = (
        ('disaster', 'Disaster & Flooding'),
        ('infrastructure', 'Infrastructure & Roads'),
        ('water', 'Water & Sanitation'),
        ('electricity', 'Power & Electricity'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending Review'),
        ('forwarded_to_univ', 'Forwarded to University'),
        ('researching', 'University Researching'),
        ('proposal_submitted', 'Proposal Submitted'),
        ('in_progress', 'Implementation In Progress'),
        ('resolved', 'Resolved'),
    )

    # Fields matching your React form
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='disaster')
    location = models.CharField(max_length=255)
    description = models.TextField()
    evidence = models.ImageField(upload_to='challenge_evidence/', blank=True, null=True)
    
    # New Fields for SIH Flow (University Collaboration)
    assigned_university = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='assigned_challenges', blank=True, null=True)
    proposal_details = models.TextField(blank=True, null=True)

    # ADD THIS FOR INDUSTRY CSR FUNDING:
    assigned_industry = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='funded_challenges', blank=True, null=True)

    # Internal tracking fields
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, default='Medium') # AI will calculate this later!
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reported_challenges')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # AI Triage Logic: Analyze text for severity keywords
        text_to_analyze = f"{self.title} {self.description}".lower()
        
        critical_keywords = ['flood', 'collapse', 'trapped', 'emergency', 'death', 'casualty', 'earthquake']
        high_keywords = ['broken', 'leak', 'fire', 'accident', 'power cut', 'outage', 'blocked']
        
        # Determine priority based on keywords
        if any(word in text_to_analyze for word in critical_keywords):
            self.priority = 'Critical'
        elif any(word in text_to_analyze for word in high_keywords):
            self.priority = 'High'
        else:
            self.priority = 'Medium'
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
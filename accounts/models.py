from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'SUPER_ADMIN')
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    ROLE_CHOICES = (
        ('CITIZEN', 'Citizen'),
        ('COMMUNITY_ORG', 'Community Organization'),
        ('GOVERNMENT_OFFICER', 'Government Officer'),
        ('UNIVERSITY', 'University Hub'),
        ('UNIVERSITY_ADMIN', 'University Admin'),
        ('FACULTY', 'Faculty Mentor'),
        ('STUDENT', 'Student Innovator'),
        ('INDUSTRY', 'Industry Partner'),
        ('STARTUP', 'Startup'),
        ('CSR_ORG', 'CSR Organization'),
        ('RESEARCH_LAB', 'Research Lab'),
        ('MENTOR', 'Mentor'),
        ('ADMIN', 'System Admin'),
        ('SUPER_ADMIN', 'Super Admin'),
    )

    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='CITIZEN')
    phone = models.CharField(max_length=15, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    organization_name = models.CharField(max_length=255, blank=True, null=True)
    
    # --- UI & Dashboard Fields ---
    avatar_or_logo = models.ImageField(upload_to='avatars/', blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    accepting_projects = models.BooleanField(default=True, help_text="Uncheck if University/Industry is currently overloaded")

    # --- AI Matchmaking Fields (Upgraded) ---
    expertise_domain = models.TextField(blank=True, null=True, help_text="Comma-separated keywords for AI Matching (e.g., Traffic, Water, IoT)")
    tech_capabilities = models.TextField(blank=True, null=True, help_text="Lab infrastructure or tech stack")
    
    # --- Industry / CSR Specific Fields ---
    preferred_districts = models.CharField(max_length=255, blank=True, null=True, help_text="Comma-separated districts for local CSR matching")
    csr_budget_pool = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, help_text="Available funding capacity")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"
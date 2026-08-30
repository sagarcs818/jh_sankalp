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
    expertise_domain = models.CharField(max_length=255, blank=True, null=True)
    tech_capabilities = models.TextField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"
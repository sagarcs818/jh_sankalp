from django.core.management.base import BaseCommand
from accounts.models import User

class Command(BaseCommand):
    help = 'Seeds standard demo accounts for hackathon evaluation'

    def handle(self, *args, **kwargs):
        demo_users = [
            {
                "email": "citizen@demo.com",
                "role": "CITIZEN",
                "first_name": "Ramesh",
                "last_name": "Kumar",
                "district": "Ranchi",
            },
            {
                "email": "government@demo.com",
                "role": "GOVERNMENT_OFFICER",
                "first_name": "Ananya",
                "last_name": "Singh",
                "district": "Ranchi",
                "organization_name": "Dept. of Higher & Technical Education",
            },
            {
                "email": "university@demo.com",
                "role": "UNIVERSITY_ADMIN",
                "first_name": "Prof. S.K.",
                "last_name": "Mishra",
                "district": "Ranchi",
                "organization_name": "BIT Mesra (Demo)",
            },
            {
                "email": "faculty@demo.com",
                "role": "FACULTY",
                "first_name": "Dr. Sunita",
                "last_name": "Prasad",
                "district": "Dhanbad",
                "organization_name": "IIT ISM Dhanbad (Demo)",
            },
            {
                "email": "student@demo.com",
                "role": "STUDENT",
                "first_name": "Aryan",
                "last_name": "Verma",
                "district": "Ranchi",
                "organization_name": "BIT Mesra (Demo)",
            },
            {
                "email": "industry@demo.com",
                "role": "INDUSTRY",
                "first_name": "Vikram",
                "last_name": "Mehta",
                "district": "Jamshedpur",
                "organization_name": "Tata Steel CSR / Innovation (Demo)",
            },
            {
                "email": "admin@demo.com",
                "role": "SUPER_ADMIN",
                "first_name": "System",
                "last_name": "Administrator",
                "district": "Ranchi",
                "is_staff": True,
                "is_superuser": True,
            },
        ]

        default_password = "demoPassword123"

        for user_data in demo_users:
            email = user_data["email"]
            if not User.objects.filter(email=email).exists():
                is_super = user_data.pop("is_superuser", False)
                if is_super:
                    User.objects.create_superuser(
                        password=default_password,
                        **user_data
                    )
                else:
                    User.objects.create_user(
                        password=default_password,
                        **user_data
                    )
                self.stdout.write(self.style.SUCCESS(f"Created: {email} ({user_data['role']})"))
            else:
                self.stdout.write(self.style.WARNING(f"Already exists: {email}"))

        self.stdout.write(self.style.SUCCESS(f"\nAll demo accounts seeded! Default password: {default_password}"))
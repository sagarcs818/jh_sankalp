from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Challenge
from .serializers import ChallengeSerializer

class ChallengeViewSet(viewsets.ModelViewSet):
    serializer_class = ChallengeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Check if the user is a Government Official or Admin
        if hasattr(user, 'role') and user.role in ['GOVERNMENT_OFFICER', 'ADMIN', 'SYSTEM_ADMIN']:
            # Government gets to see EVERY report in the state
            return Challenge.objects.all().order_by('-created_at')
            
        # Universities see challenges forwarded to the academic hub
        if hasattr(user, 'role') and user.role == 'UNIVERSITY':
            return Challenge.objects.exclude(status='pending').order_by('-created_at')
            
        # Normal Citizens ONLY see the reports they created themselves
        return Challenge.objects.filter(reported_by=user).order_by('-created_at')

    def perform_create(self, serializer):
        # Automatically assign the logged-in user as the person who reported it
        serializer.save(reported_by=self.request.user)
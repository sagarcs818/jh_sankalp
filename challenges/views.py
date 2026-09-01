import re
from difflib import SequenceMatcher
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import F, Case, When, Value, IntegerField
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Challenge
from .serializers import ChallengeSerializer

User = get_user_model()

# --- HELPER LOGGING FUNCTION ---
def log_action(challenge, message):
    """Appends a timestamped log to the challenge's audit trail."""
    timestamp = timezone.now().strftime("%b %d, %Y %I:%M %p")
    log_entry = f"[{timestamp}] {message}\n"
    if challenge.action_logs:
        # If React sent some logs, append our new message to the END of them
        if not challenge.action_logs.endswith('\n'):
             challenge.action_logs += '\n'
        challenge.action_logs += log_entry
    else:
        challenge.action_logs = log_entry
    challenge.save(update_fields=['action_logs'])


def analyze_priority_with_nlp(description):
    text = description.lower()
    critical_keywords = ['dead', 'death', 'trapped', 'explosion', 'fire', 'collapsed', 'blood', 'drowning', 'casualty', 'emergency']
    high_keywords = ['injured', 'accident', 'destroyed', 'flood', 'power cut', 'short circuit', 'blocked', 'bleeding', 'burst']
    medium_keywords = ['broken', 'leak', 'pothole', 'garbage', 'smell', 'delay', 'dirty', 'stray']
    multipliers = ['massive', 'huge', 'multiple', 'many', 'severe', 'entire', 'completely']
    
    score = 0
    for word in critical_keywords:
        if re.search(r'\b' + word + r'\b', text): score += 10
    for word in high_keywords:
        if re.search(r'\b' + word + r'\b', text): score += 5
    for word in medium_keywords:
        if re.search(r'\b' + word + r'\b', text): score += 2
    for mult in multipliers:
        if re.search(r'\b' + mult + r'\b', text): score = int(score * 1.5)
        
    if score >= 10: return 'Critical'
    elif score >= 5: return 'High'
    elif score >= 2: return 'Medium'
    return 'Normal'


class ChallengeViewSet(viewsets.ModelViewSet):
    serializer_class = ChallengeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        priority_weight = Case(
            When(priority='Critical', then=Value(4)),
            When(priority='High', then=Value(3)),
            When(priority='Medium', then=Value(2)),
            default=Value(1),
            output_field=IntegerField()
        )

        if hasattr(user, 'role') and user.role in ['GOVERNMENT_OFFICER', 'ADMIN', 'SYSTEM_ADMIN']:
            return Challenge.objects.all().annotate(p_weight=priority_weight).order_by('-p_weight', '-report_count', '-created_at')
            
        if hasattr(user, 'role') and user.role == 'UNIVERSITY':
            return Challenge.objects.exclude(status='pending').annotate(p_weight=priority_weight).order_by('-p_weight', '-report_count')
            
        if hasattr(user, 'role') and user.role == 'INDUSTRY':
            return Challenge.objects.filter(status__in=['proposal_submitted', 'in_progress', 'resolved']).annotate(p_weight=priority_weight).order_by('-p_weight', '-created_at')

        return Challenge.objects.filter(reported_by=user).order_by('-created_at')

    def perform_create(self, serializer):
        description = serializer.validated_data.get('description', '')
        title = serializer.validated_data.get('title', '')
        location = serializer.validated_data.get('location', '')
        category = serializer.validated_data.get('category', '')
        
        calculated_priority = analyze_priority_with_nlp(description)

        potential_dupes = Challenge.objects.filter(category=category, status='pending')
        for existing in potential_dupes:
            title_sim = SequenceMatcher(None, title.lower(), existing.title.lower()).ratio()
            loc_sim = SequenceMatcher(None, location.lower(), existing.location.lower()).ratio()
            
            if title_sim > 0.65 and loc_sim > 0.6:
                existing.report_count += 1
                if existing.report_count >= 5 and existing.priority != 'Critical':
                    existing.priority = 'High'
                if existing.report_count >= 10:
                    existing.priority = 'Critical'
                existing.save()
                return 

        instance = serializer.save(reported_by=self.request.user, priority=calculated_priority, report_count=1)
        log_action(instance, f"Issue logged by citizen. AI assigned {calculated_priority} priority.")

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        # Save the instance FIRST so it writes the React action_logs to the DB
        instance = serializer.save()

        # THEN append our automated message so it doesn't overwrite React's message
        if old_status != instance.status:
            if instance.status == 'proposal_submitted':
                univ_name = getattr(instance.assigned_university, 'organization_name', 'University')
                log_action(instance, f"Automated Alert: Proposal officially received from {univ_name}.")
            elif instance.status == 'in_progress':
                ind_name = getattr(instance.assigned_industry, 'organization_name', 'Industry Partner')
                log_action(instance, f"Automated Alert: CSR Funding officially secured via {ind_name}.")
            elif instance.status == 'resolved':
                log_action(instance, f"Automated Alert: Project verified and marked as fully resolved.")

    @action(detail=True, methods=['get'])
    def smart_match_universities(self, request, pk=None):
        challenge = self.get_object()
        universities = User.objects.filter(role='UNIVERSITY')
        ranked_list = []

        challenge_text = f"{challenge.title} {challenge.description} {challenge.category}".lower()

        for univ in universities:
            match_score = 40  # Base Score
            reasons = []

            # 1. District Proximity Math (+20 points)
            if univ.district and univ.district.lower() in challenge.location.lower():
                match_score += 20
                reasons.append(f"Local Proximity ({univ.district} District)")

            # 2. Domain & Keyword Math (+30 points)
            if univ.expertise_domain:
                expertise_lower = univ.expertise_domain.lower()
                
                # Direct Category Match
                if challenge.category in expertise_lower:
                    match_score += 15
                    reasons.append(f"Domain Expertise in {challenge.get_category_display()}")
                
                # Semantic Keyword Match (5 points per matching word, up to 15)
                expertise_keywords = [k.strip() for k in expertise_lower.split(',')]
                overlap = sum(1 for kw in expertise_keywords if kw and kw in challenge_text)
                if overlap > 0:
                    added_points = min(overlap * 5, 15)
                    match_score += added_points
                    reasons.append(f"Matched {overlap} specific technical keywords in proposal")

            # 3. Lab/Tech Capability Check (+10 points)
            if univ.tech_capabilities:
                match_score += 10
                reasons.append("Active Research Labs & Infrastructure Available")

            match_score = min(match_score, 99) # Cap at 99%
            org_name = getattr(univ, 'organization_name', None) or f"{univ.first_name} {univ.last_name}".strip() or f'University #{univ.id}'

            ranked_list.append({
                'id': univ.id,
                'name': org_name,
                'district': univ.district or 'Jharkhand',
                'active_faculty': 25, 
                'match_score': match_score,
                'reasons': reasons if reasons else ["General Academic capabilities"]
            })

        ranked_list.sort(key=lambda x: x['match_score'], reverse=True)
        return Response(ranked_list)

    @action(detail=True, methods=['post'])
    def assign_university(self, request, pk=None):
        challenge = self.get_object()
        university_id = request.data.get('university_id')
        try:
            univ = User.objects.get(id=university_id, role='UNIVERSITY')
            challenge.assigned_university = univ
            challenge.status = 'forwarded_to_univ'
            challenge.save()
            
            # 🚀 LOG THE ROUTING ACTION!
            org_name = getattr(univ, 'organization_name', 'University')
            log_action(challenge, f"Government Official securely routed problem to {org_name}.")
            
            return Response({'status': 'assigned', 'university': org_name}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'University not found'}, status=status.HTTP_404_NOT_FOUND)
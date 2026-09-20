import re
from difflib import SequenceMatcher
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import F, Case, When, Value, IntegerField, Q
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Challenge, SystemSetting
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
            # FIX: Universities can now directly view 'pending' citizen reports and request to solve them!
            return Challenge.objects.filter(
                Q(status='pending') | 
                Q(status='forwarded_to_univ') | 
                Q(status='proposal_submitted') | 
                Q(status='in_progress') | 
                Q(status='resolved')
            ).annotate(p_weight=priority_weight).order_by('-p_weight', '-report_count')
            
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

        # 1. NLP Pre-processing: Clean the challenge text and remove stop words
        raw_text = f"{challenge.title} {challenge.description} {challenge.category}".lower()
        stop_words = {'and', 'the', 'in', 'to', 'of', 'a', 'is', 'for', 'with', 'on', 'pls', 'please', 'help', 'our', 'we', 'are'}
        
        # Extract meaningful words only
        challenge_words = [w for w in re.findall(r'\b\w+\b', raw_text) if w not in stop_words]
        cleaned_challenge_text = " ".join(challenge_words)

        for univ in universities:
            match_score = 40  # Base Score
            reasons = []

            # 1. District Proximity Math (+20 points)
            if univ.district and univ.district.lower() in challenge.location.lower():
                match_score += 20
                reasons.append(f"Local Proximity ({univ.district} District)")

            # 2. Advanced NLP Keyword Math (+30 points)
            if univ.expertise_domain:
                expertise_lower = univ.expertise_domain.lower()
                
                # Direct Category Match
                if challenge.category in expertise_lower:
                    match_score += 15
                    reasons.append(f"Domain Expertise in {challenge.get_category_display()}")
                
                # Fuzzy & Semantic Keyword Match
                expertise_keywords = [k.strip() for k in expertise_lower.split(',')]
                matched_words = []
                
                for kw in expertise_keywords:
                    if not kw: continue
                    # Exact subset check
                    if kw in cleaned_challenge_text:
                        matched_words.append(kw)
                    else:
                        # Fuzzy matching (handles plurals like "roads" vs "road", or slight typos)
                        for word in challenge_words:
                            if SequenceMatcher(None, kw, word).ratio() > 0.8:
                                matched_words.append(kw)
                                break
                
                if matched_words:
                    unique_matches = list(set(matched_words))
                    added_points = min(len(unique_matches) * 8, 25) # Give up to 25 points for keyword overlap
                    match_score += added_points
                    
                    display_words = ", ".join(unique_matches[:3])
                    reasons.append(f"Matched technical keywords: {display_words}")

            # 3. Lab/Tech Capability Check (+10 points)
            if univ.tech_capabilities:
                tech_lower = univ.tech_capabilities.lower()
                tech_keywords = [k.strip() for k in tech_lower.split(',')]
                
                # Check if specific lab equipment matches the problem context
                if any(tk in cleaned_challenge_text for tk in tech_keywords if tk):
                    match_score += 10
                    reasons.append("Lab Infrastructure aligns precisely with problem scope")
                else:
                    match_score += 5
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
        
        # NEW LOGIC: If university_id is None, route it to the Open State Pool!
        if not university_id:
            challenge.assigned_university = None
            challenge.status = 'forwarded_to_univ'
            challenge.save()
            log_action(challenge, "Government Official routed problem to the Open State Marketplace.")
            return Response({'status': 'assigned', 'university': 'Open State Pool'}, status=status.HTTP_200_OK)

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

class SystemAdminStatsView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def ecosystem_stats(self, request):
        user = request.user
        if not hasattr(user, 'role') or user.role not in ['ADMIN', 'SYSTEM_ADMIN']:
            return Response({"detail": "Unauthorized. System Admin clearance required."}, status=status.HTTP_403_FORBIDDEN)

        users = User.objects.all()
        user_stats = {
            'citizens': users.filter(role='CITIZEN').count(),
            'government': users.filter(role='GOVERNMENT_OFFICER').count(),
            'universities': users.filter(role='UNIVERSITY').count(),
            'industries': users.filter(role='INDUSTRY').count(),
            'total_users': users.count()
        }

        challenges = Challenge.objects.all()
        challenge_stats = {
            'total_reports': challenges.count(),
            'open_pool': challenges.filter(status='pending').count(),
            'university_requested': challenges.filter(status='forwarded_to_univ').count(),
            'awaiting_csr': challenges.filter(status='proposal_submitted').count(),
            'in_progress': challenges.filter(status='in_progress').count(),
            'resolved': challenges.filter(status='resolved').count(),
        }

        return Response({'user_stats': user_stats, 'challenge_stats': challenge_stats})

    # NEW: Fetch all users for User Management
    @action(detail=False, methods=['get'])
    def all_users(self, request):
        user = request.user
        if not hasattr(user, 'role') or user.role not in ['ADMIN', 'SYSTEM_ADMIN']:
            return Response({"detail": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)
        
        # We use .values() to explicitly select fields and prevent returning passwords!
        users = User.objects.all().values(
            'id', 'first_name', 'last_name', 'email', 'role', 'organization_name', 'is_active', 'date_joined'
        ).order_by('-date_joined')
        
        return Response(list(users))

    # NEW: Aggregate all action logs for the Server Logs view
    @action(detail=False, methods=['get'])
    def system_logs(self, request):
        user = request.user
        if not hasattr(user, 'role') or user.role not in ['ADMIN', 'SYSTEM_ADMIN']:
            return Response({"detail": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)
        
        # Grab the latest 100 challenges that have logs
        challenges = Challenge.objects.exclude(action_logs__isnull=True).exclude(action_logs__exact='').order_by('-created_at')[:100]
        
        global_logs = []
        for c in challenges:
            lines = c.action_logs.strip().split('\n')
            for line in lines:
                if line.strip():
                    # Format it to look like a server log
                    global_logs.append(f"SYS_TICKET_ID: [{c.id}] -> {line.strip()}")
                    
        # Return the logs
        return Response({'logs': global_logs})

    # ==========================================
    # NEW: CHANGE USER PASSWORD API
    # ==========================================
    @action(detail=False, methods=['post'])
    def update_user_password(self, request):
        user = request.user
        if not hasattr(user, 'role') or user.role not in ['ADMIN', 'SYSTEM_ADMIN']:
            return Response({"detail": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)
        
        target_user_id = request.data.get('user_id')
        new_password = request.data.get('new_password')
        
        try:
            target_user = User.objects.get(id=target_user_id)
            target_user.set_password(new_password)
            target_user.save()
            return Response({"status": "Password updated successfully"})
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    # ==========================================
    # NEW: DELETE USER API
    # ==========================================
    @action(detail=False, methods=['delete'])
    def delete_user(self, request):
        user = request.user
        if not hasattr(user, 'role') or user.role not in ['ADMIN', 'SYSTEM_ADMIN']:
            return Response({"detail": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)
        
        target_user_id = request.data.get('user_id')
        
        # Prevent the admin from deleting themselves
        if str(target_user_id) == str(user.id):
            return Response({"detail": "You cannot delete your own admin account."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(id=target_user_id)
            target_user.delete()
            return Response({"status": "User deleted successfully."})
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    # ==========================================
    # NEW: MANAGE GLOBAL SECURITY CODES API
    # ==========================================
    @action(detail=False, methods=['get', 'post'])
    def security_codes(self, request):
        user = request.user
        if not hasattr(user, 'role') or user.role not in ['ADMIN', 'SYSTEM_ADMIN']:
            return Response({"detail": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)
        
        if request.method == 'POST':
            gov_code = request.data.get('gov_code')
            admin_code = request.data.get('admin_code')
            
            if gov_code:
                SystemSetting.objects.update_or_create(key='gov_code', defaults={'value': gov_code})
            if admin_code:
                SystemSetting.objects.update_or_create(key='admin_code', defaults={'value': admin_code})
                
            return Response({"status": "Security codes updated successfully"})
        
        else:
            gov = SystemSetting.objects.filter(key='gov_code').first()
            adm = SystemSetting.objects.filter(key='admin_code').first()
            return Response({
                'gov_code': gov.value if gov else 'gov123',
                'admin_code': adm.value if adm else 'admin123'
            })
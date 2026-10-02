from rest_framework import serializers
from .models import Challenge

class ChallengeSerializer(serializers.ModelSerializer):
    # We want to return the display value for the status (e.g. "Pending Review") 
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    date_formatted = serializers.DateTimeField(source='created_at', format="%b %d, %Y", read_only=True)
    
    # NEW: Fetch the details of the Citizen who reported the issue
    reporter_name = serializers.SerializerMethodField()
    reporter_phone = serializers.SerializerMethodField()
    reporter_email = serializers.SerializerMethodField()
    
    # NEW: University Data
    university_name = serializers.SerializerMethodField()
    
    # ADD THIS NEW FIELD:
    industry_name = serializers.SerializerMethodField()

    # FIX: Force absolute URLs for all file fields
    evidence = serializers.SerializerMethodField()
    proposal_document = serializers.SerializerMethodField()
    resolution_evidence = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = [
            'id', 'title', 'category', 'location', 'description', 
            'evidence', 'status', 'status_display', 'priority', 'report_count',
            'date_formatted', 'created_at', 'reporter_name', 'reporter_phone', 'reporter_email',
            'assigned_university', 'proposal_details', 'university_name',
            'assigned_industry', 'industry_name',
            'action_logs',
            'proposal_document', 
            'resolution_evidence' 
        ]
        # REMOVED 'action_logs' FROM HERE SO REACT CAN EDIT THE TIMELINE!
        read_only_fields = ['priority']

    # Helper methods to safely extract the user data
    def get_reporter_name(self, obj):
        if obj.reported_by:
            name = f"{obj.reported_by.first_name} {obj.reported_by.last_name}".strip()
            return name if name else "Unnamed Citizen"
        return "Anonymous Citizen"

    def get_reporter_phone(self, obj):
        if obj.reported_by and getattr(obj.reported_by, 'phone', None):
            return obj.reported_by.phone
        return None

    def get_reporter_email(self, obj):
        if obj.reported_by and getattr(obj.reported_by, 'email', None):
            return obj.reported_by.email
        return None

    def get_university_name(self, obj):
        if obj.assigned_university and getattr(obj.assigned_university, 'organization_name', None):
            return obj.assigned_university.organization_name
        return "Open to all Universities"

    def get_industry_name(self, obj):
        if obj.assigned_industry and getattr(obj.assigned_industry, 'organization_name', None):
            return obj.assigned_industry.organization_name
        return "Awaiting CSR Funding"

    # FIX: Helper methods to return the full Cloudinary URLs
    def get_evidence(self, obj):
        if obj.evidence:
            return obj.evidence.url
        return None

    def get_proposal_document(self, obj):
        if obj.proposal_document:
            return obj.proposal_document.url
        return None

    def get_resolution_evidence(self, obj):
        if obj.resolution_evidence:
            return obj.resolution_evidence.url
        return None
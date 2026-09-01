from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UniversityRecommendationSerializer(serializers.Serializer):
    """
    Serializer used to return ranked institutional matches to the Government Triage Board.
    """
    id = serializers.IntegerField()
    name = serializers.CharField(max_length=255)
    code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    district = serializers.CharField(max_length=100, required=False, allow_blank=True)
    match_score = serializers.IntegerField()
    reasons = serializers.ListField(
        child=serializers.CharField(max_length=255)
    )
    active_faculty = serializers.IntegerField(required=False, default=20)


class UniversityProfileSerializer(serializers.ModelSerializer):
    """
    Serializer representing the University user profile.
    """
    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'email', 
            'first_name', 
            'last_name', 
            'organization_name', 
            'district', 
            'role'
        ]
        read_only_fields = ['id', 'username', 'role']
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Inject user data into the token response so React can route them correctly
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'role': getattr(self.user, 'role', 'CITIZEN'),
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
        }
        return data

# 1. Profile Serializer (Handles reading and updating profile data)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name',
            'role', 'phone', 'district', 'organization_name',
            'expertise_domain', 'tech_capabilities', # <--- Smart Match Fields
            'is_verified'
        )
        read_only_fields = ('id', 'is_verified', 'role', 'email')


# 2. Registration Serializer (Handles creating NEW users and Security Codes)
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    # Temporary field to validate official registrations
    secret_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            'email', 'password', 'first_name', 'last_name',
            'role', 'phone', 'district', 'organization_name', 'secret_code'
        )
        # Tell Django these fields are completely optional during registration
        extra_kwargs = {
            'phone': {'required': False, 'allow_null': True, 'allow_blank': True},
            'district': {'required': False, 'allow_null': True, 'allow_blank': True},
            'organization_name': {'required': False, 'allow_null': True, 'allow_blank': True},
        }
        
    def validate(self, attrs):
        role = attrs.get('role', 'CITIZEN')
        
        # SECURITY CHECK: Block unauthorized registrations
        if role in ['GOVERNMENT_OFFICER', 'ADMIN', 'SUPER_ADMIN']:
            secret_code = attrs.get('secret_code', '')
            
            # Require 'admin123' for System Admins
            if role in ['ADMIN', 'SUPER_ADMIN'] and secret_code != 'admin123':
                raise serializers.ValidationError({"secret_code": ["Invalid System Admin Clearance Code."]})
                
            # Require 'gov123' for Government Officials
            elif role == 'GOVERNMENT_OFFICER' and secret_code != 'gov123':
                raise serializers.ValidationError({"secret_code": ["Invalid Government Security Code. Unauthorized."]})
                
        return attrs

    def create(self, validated_data):
        # Remove the secret code before saving the user to the database
        validated_data.pop('secret_code', None)
        user = User.objects.create_user(**validated_data)
        return user
# ai_engine/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .services import run_university_matchmaking

@api_view(['POST'])
def trigger_matchmaking(request, challenge_id):
    """
    Endpoint to manually trigger the AI matching for a specific challenge.
    """
    result = run_university_matchmaking(challenge_id)
    
    if "error" in result:
        return Response(result, status=status.HTTP_404_NOT_FOUND)
        
    return Response(result, status=status.HTTP_200_OK)
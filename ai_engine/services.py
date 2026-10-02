import re
from challenges.models import Challenge
from django.contrib.auth import get_user_model

User = get_user_model()

def extract_meaningful_words(text):
    """
    Cleans text by removing punctuation, converting to lowercase, 
    and filtering out useless words.
    """
    if not text:
        return set()
    
    # Remove punctuation using regex and make lowercase
    clean_text = re.sub(r'[^\w\s]', ' ', text.lower())
    
    # Common words to ignore so they don't cause false matches
    stop_words = {'the', 'and', 'for', 'with', 'this', 'that', 'from', 'are', 'was', 'out', 'has'}
    
    # Return a set of unique words longer than 2 characters
    return {word for word in clean_text.split() if word not in stop_words and len(word) > 2}

def run_university_matchmaking(challenge_id):
    try:
        challenge = Challenge.objects.get(id=challenge_id)
    except Challenge.DoesNotExist:
        return {"error": "Challenge not found"}

    # 1. Break the challenge text down into unique core words
    challenge_text = f"{challenge.title} {challenge.description} {challenge.category}"
    challenge_words = extract_meaningful_words(challenge_text)

    # 2. Get all verified R&D / University Accounts
    universities = User.objects.filter(role='UNIVERSITY') 

    best_match = None
    highest_score = 0
    matched_keywords = []

    # 3. Compare word-by-word
    for uni in universities:
        # Break the university's expertise down into unique core words
        uni_words = extract_meaningful_words(getattr(uni, 'expertise_domain', ''))
        
        # Find the intersection (words that exist in both sets)
        current_matches = list(challenge_words.intersection(uni_words))
        score = len(current_matches)

        if score > highest_score:
            highest_score = score
            best_match = uni
            matched_keywords = current_matches

    # 4. Update the Challenge if a match is found
    if best_match and highest_score > 0:
        challenge.assigned_university = best_match
        challenge.status = 'forwarded_to_univ'
        
        # Log the AI action
        log_entry = f"AI matched to {best_match.email} based on common topics: {', '.join(matched_keywords)}."
        if challenge.action_logs:
            challenge.action_logs += f"\n{log_entry}"
        else:
            challenge.action_logs = log_entry
            
        challenge.save()
        
        return {
            "success": True, 
            "matched_to": best_match.email, 
            "score": highest_score,
            "keywords_found": matched_keywords
        }

    return {"success": False, "message": "No suitable university match found based on keywords."}
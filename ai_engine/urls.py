# ai_engine/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('match/<int:challenge_id>/', views.trigger_matchmaking, name='trigger_matchmaking'),
]
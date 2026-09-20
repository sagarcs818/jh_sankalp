from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChallengeViewSet, SystemAdminStatsView

router = DefaultRouter()
router.register(r'reports', ChallengeViewSet, basename='reports')

# ADD THIS LINE:
router.register(r'admin-stats', SystemAdminStatsView, basename='admin-stats')

urlpatterns = [
    path('', include(router.urls)),
]
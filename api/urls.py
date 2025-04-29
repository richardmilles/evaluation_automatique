from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvaluateSubmissionView, PlagiarismCheckView, UserViewSet, ExerciseViewSet, SubmissionViewSet, CorrectionViewSet, PlagiarismCheckViewSet, detect_plagiarism_for_exercise

# 🔹 Création d'un routeur API REST
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'exercises', ExerciseViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'corrections', CorrectionViewSet)
router.register(r'plagiarism_checks', PlagiarismCheckViewSet)

urlpatterns = [
    path('', include(router.urls)),  # Inclure toutes les routes définies dans le routeur
    path('evaluation/<int:submission_id>/', EvaluateSubmissionView.as_view(), name='evaluate_submission'),
    path('plagiarism/', PlagiarismCheckView.as_view(), name='plagiarism_check'),
    path('detect_plagiarism/<int:exercise_id>/', detect_plagiarism_for_exercise, name='detect_plagiarism_for_exercise'),
]
# Compare this snippet from api/serializers.py:
# from rest_framework import serializers
# from .models import User, Exercise, Submission, Correction, PlagiarismCheck
#
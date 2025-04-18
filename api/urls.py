from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from .views import EvaluateSubmissionView, PlagiarismCheckView, UserViewSet, ExerciseViewSet, SubmissionViewSet, CorrectionViewSet, PlagiarismCheckViewSet
from . import views

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
    
    #Pages Front-End
    path('create-exercise/', views.create_exercise_view, name='create_exercise'),
    path('dashboard-etudiant/', views.dashboard_etudiant_view, name='dashboard_etudiant'),
    path('dashboard-prof/', views.dashboard_prof_view, name='dashboard_prof'),
    path('index/', views.index_view, name='index'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('result/', views.result_view, name='result'),
    path('stats/', views.stats_view, name='stats'),
    path('submit/', views.submit_view, name='submit'),
    
]
# Compare this snippet from api/serializers.py:
# from rest_framework import serializers
# from .models import User, Exercise, Submission, Correction, PlagiarismCheck
#
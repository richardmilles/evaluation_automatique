from rest_framework import serializers
from .models import User, Exercise, Submission, Correction, PlagiarismCheck

# 🔹 Sérializer Utilisateur
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from api.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'role'] 

# 🔹 Sérializer Exercices
class ExerciseSerializer(serializers.ModelSerializer):
    professor = UserSerializer(read_only=True)

    class Meta:
        model = Exercise
        fields = ['id', 'title', 'description', 'professor', 'model_answer', 'created_at']

# 🔹 Sérializer Soumissions
class SubmissionSerializer(serializers.ModelSerializer):
    pdf = serializers.FileField(write_only=True, required=True)  # ✅ Ajout du champ PDF

    class Meta:
        model = Submission
        fields = ['id', 'exercise', 'student', 'pdf', 'pdf_url', 'submitted_at']
        read_only_fields = ['student', 'pdf_url', 'submitted_at']

# 🔹 Sérializer Correction IA
class CorrectionSerializer(serializers.ModelSerializer):
    submission = SubmissionSerializer(read_only=True)

    class Meta:
        model = Correction
        fields = ['id', 'submission', 'grade', 'feedback', 'created_at']

# 🔹 Sérializer Détection de Plagiat
class PlagiarismCheckSerializer(serializers.ModelSerializer):
    submission_1 = SubmissionSerializer(read_only=True)
    submission_2 = SubmissionSerializer(read_only=True)

    class Meta:
        model = PlagiarismCheck
        fields = ['id', 'submission_1', 'submission_2', 'similarity_score', 'detected_at']

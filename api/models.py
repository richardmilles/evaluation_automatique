from django.db import models
from django.contrib.auth.models import AbstractUser

# 📌 Modèle Utilisateur (Professeur & Étudiant)
class User(AbstractUser):
    ROLE_CHOICES = [
        ('professor', 'Professor'),
        ('student', 'Student'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    # Résolution des conflits avec auth.User
    groups = models.ManyToManyField(
        "auth.Group",
        related_name="api_users_groups",  # Nom unique
        blank=True
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="api_users_permissions",  # Nom unique
        blank=True
    )

# 📌 Modèle Exercices
class Exercise(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    professor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="exercises")
    model_answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

# 📌 Modèle Soumission
class Submission(models.Model):
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="student_submissions")
    pdf_url = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

# 📌 Modèle Correction
class Correction(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="corrections")
    grade = models.DecimalField(max_digits=5, decimal_places=2)
    feedback = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

# 📌 Modèle Détection de Plagiat
class PlagiarismCheck(models.Model):
    submission_1 = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="plagiarism_checks_1")
    submission_2 = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="plagiarism_checks_2")
    similarity_score = models.DecimalField(max_digits=5, decimal_places=2)
    detected_at = models.DateTimeField(auto_now_add=True)

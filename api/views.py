from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import User, Exercise, Submission, Correction, PlagiarismCheck
from .serializers import (
    UserSerializer, ExerciseSerializer, SubmissionSerializer,
    CorrectionSerializer, PlagiarismCheckSerializer
)
from .permissions import IsProfessor, IsStudent  # ✅ Import des permissions
from .utils import check_plagiarism, extract_grade_from_feedback, jaccard_similarity, preprocess_text, upload_pdf
from api import serializers  # ✅ Importer la fonction upload_pdf

from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Submission, Correction
from .utils import extract_text_from_pdf, evaluate_submission, extract_grade_from_feedback




# 🔹 Vue API Utilisateurs (RESTREINTE : Seuls les utilisateurs authentifiés peuvent voir leur propre profil)
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """ Un utilisateur ne peut voir que ses propres informations """
        return User.objects.filter(id=self.request.user.id)

# 🔹 Vue API Exercices (SEULS LES PROFESSEURS peuvent CRÉER, MODIFIER, SUPPRIMER)
class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsProfessor]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(professor=self.request.user)


# 🔹 Vue API Soumissions (SEULS LES ÉTUDIANTS peuvent soumettre)
class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]

    def perform_create(self, serializer):
        file = self.request.FILES.get('pdf')  # Récupérer le fichier PDF
        if file:
            file_url = upload_pdf(file)  # Téléverser sur Supabase
            serializer.save(student=self.request.user, pdf_url=file_url)
            extracted_text = extract_text_from_pdf(file)  # Extraire le texte
            processed_text = preprocess_text(extracted_text)  # Nettoyer le texte

            # Comparer avec les soumissions existantes
            all_submissions = Submission.objects.exclude(id=self.request.user.id)
            other_texts = [preprocess_text(extract_text_from_pdf(sub.pdf_url)) for sub in all_submissions]

            tfidf_score = check_plagiarism(processed_text, other_texts)
            jaccard_score = max(jaccard_similarity(processed_text, other) for other in other_texts) if other_texts else 0

            # Enregistrer le plagiat s'il dépasse un seuil
            if tfidf_score > 80 or jaccard_score > 80:
                PlagiarismCheck.objects.create(
                    submission_id_1=self.request.user.id,
                    submission_id_2=all_submissions[0].id if all_submissions else None,
                    similarity_score=max(tfidf_score, jaccard_score)
                )

            # Enregistrer la soumission
            serializer.save(student=self.request.user, pdf_url=file_url)
        else:
            raise serializers.ValidationError("Aucun fichier PDF fourni.")

# 🔹 Vue API Corrections (Lecture seule - Tout le monde peut lire, mais seul le professeur peut modifier)
class CorrectionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Correction.objects.all()
    serializer_class = CorrectionSerializer
    permission_classes = [permissions.IsAuthenticated]

# 🔹 Vue API Détection de Plagiat (Lecture seule - Accessible à tout utilisateur connecté)
class PlagiarismCheckViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PlagiarismCheck.objects.all()
    serializer_class = PlagiarismCheckSerializer
    permission_classes = [permissions.IsAuthenticated]
class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudent]  # ✅ Seuls les étudiants peuvent soumettre

    def perform_create(self, serializer):
        file = self.request.FILES.get('pdf')  # Récupérer le fichier PDF
        if file:
            file_url = upload_pdf(file)  # ✅ Téléverser le fichier sur Supabase
            extracted_text = extract_text_from_pdf(file_url)  # Passe l'URL du fichier téléchargé
            processed_text = preprocess_text(extracted_text)
            if file_url:
                serializer.save(student=self.request.user, pdf_url=file_url)  # ✅ Sauvegarde dans la BDD
            else:
                raise serializers.ValidationError("Échec du téléchargement du fichier sur Supabase.")
        else:
            raise serializers.ValidationError("Aucun fichier PDF fourni.")
        


class EvaluateSubmissionView(APIView):
    """Vue pour corriger une soumission avec l'IA"""
    permission_classes = [IsAuthenticated]

    def post(self, request, submission_id):
        try:
            submission = Submission.objects.get(id=submission_id)
            student_pdf = submission.pdf_url  # URL du PDF stocké sur Supabase
            model_answer = submission.exercise.model_answer  # Correction officielle

            # Extraire le texte du PDF soumis
            extracted_text = extract_text_from_pdf(student_pdf)
            if not extracted_text:
                return Response({"error": "Impossible d'extraire le texte du PDF."}, status=400)

            # Envoyer le texte à l'IA pour correction
            feedback = evaluate_submission(extracted_text, model_answer)

            # Extraire la note depuis le feedback
            grade = extract_grade_from_feedback(feedback)

            # Enregistrer la correction dans la base
            correction = Correction.objects.create(
                submission=submission,
                grade=grade,
                feedback=feedback
            )

            return Response({"grade": correction.grade, "feedback": correction.feedback})
        except Submission.DoesNotExist:
            return Response({"error": "Soumission non trouvée."}, status=404)
        

class PlagiarismCheckView(ListAPIView):
    """Liste des cas de plagiat détectés"""
    queryset = PlagiarismCheck.objects.all()
    serializer_class = PlagiarismCheckSerializer
    permission_classes = [permissions.IsAuthenticated, IsProfessor]  # Seuls les professeurs peuvent voir les cas de plagiat
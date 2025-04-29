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
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
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
        """Le professeur voit tous les utilisateurs, l'étudiant voit seulement lui-même"""
        user = self.request.user
        if hasattr(user, 'role') and user.role == 'professor':
            return User.objects.all()
        return User.objects.filter(id=user.id)

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

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [permissions.IsAuthenticated, IsStudent]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        # Log des données reçues pour debug
        print("====== DÉBUT SOUMISSION PDF ======")
        print(f"User: {self.request.user.id} - {self.request.user.email if hasattr(self.request.user, 'email') else 'No email'}")
        print(f"Données POST: {self.request.data}")
        print(f"Fichiers: {self.request.FILES}")
        
        # Vérifier le fichier PDF
        file = self.request.FILES.get('pdf')  # Récupérer le fichier PDF
        if not file:
            print("Erreur: Aucun fichier PDF fourni.")
            raise serializers.ValidationError("Aucun fichier PDF fourni.")
            
        # Vérifier l'exercice
        exercise_id = self.request.data.get('exercise')
        if not exercise_id:
            print("Erreur: ID d'exercice manquant.")
            raise serializers.ValidationError("ID d'exercice manquant.")
            
        # Compter les documents pour éviter les doublons
        try:
            # Tenter d'uploader le PDF
            print(f"Tentative d'upload du fichier: {file.name} ({file.size} bytes)")
            try:
                file_url = upload_pdf(file)  # Téléverser sur Supabase
                print(f"PDF uploadé avec succès: {file_url}")
            except Exception as upload_error:
                print(f"Erreur lors de l'upload du PDF: {upload_error}")
                raise serializers.ValidationError(f"Erreur lors de l'upload du PDF: {str(upload_error)}")
                
            # Tenter de sauvegarder la soumission
            try:
                print("Tentative de sauvegarde de la soumission")
                submission = serializer.save(student=self.request.user, pdf_url=file_url)
                print(f"Soumission créée avec succès: ID={submission.id}")
            except Exception as save_error:
                print(f"Erreur lors de la sauvegarde de la soumission: {save_error}")
                raise serializers.ValidationError(f"Erreur lors de la sauvegarde: {str(save_error)}")

            # Traitement du plagiat (dans un try/except pour ne pas bloquer la soumission)
            try:
                # Extraire le texte depuis l'URL Supabase
                extracted_text = extract_text_from_pdf(file_url)
                processed_text = preprocess_text(extracted_text)  # Nettoyer le texte

                # Comparer avec les soumissions existantes
                all_submissions = Submission.objects.filter(student=self.request.user).exclude(id=submission.id)
                tfidf_score, jaccard_score = 0, 0
                
                if all_submissions.exists():  # S'il y a au moins une soumission antérieure
                    tfidf_score, jaccard_score = check_plagiarism(processed_text, all_submissions)

                # Enregistrer TOUS les scores de plagiat, même faibles
                PlagiarismCheck.objects.create(
                    submission_id_1=submission.id,  # Utiliser l'ID de la soumission actuelle
                    submission_id_2=all_submissions[0].id if all_submissions else None,
                    similarity_score=max(tfidf_score, jaccard_score)
                )
                print(f"Score de plagiat enregistré: {max(tfidf_score, jaccard_score)}")
            except Exception as plagiat_error:
                # Ne pas bloquer la soumission si la vérification de plagiat échoue
                print(f"Erreur lors de la vérification du plagiat: {plagiat_error}")
                
            print("====== FIN SOUMISSION PDF - SUCCÈS ======")
            
        except Exception as e:
            print(f"====== FIN SOUMISSION PDF - ERREUR GÉNÉRALE: {e} ======")
            raise serializers.ValidationError(f"Erreur lors de la soumission: {str(e)}")


# Vue API Corrections (Lecture seule - Tout le monde peut lire, mais seul le professeur peut modifier)
class CorrectionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Correction.objects.all()
    serializer_class = CorrectionSerializer
    permission_classes = [permissions.IsAuthenticated]

# Vue API Détection de Plagiat (Lecture seule - Accessible à tout utilisateur connecté)
class PlagiarismCheckViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PlagiarismCheck.objects.all()
    serializer_class = PlagiarismCheckSerializer
    permission_classes = [permissions.IsAuthenticated]


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

# --- Nouvelle vue pour détecter le plagiat sur toutes les soumissions d'un exercice ---
from django.db import transaction
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsProfessor])
def detect_plagiarism_for_exercise(request, exercise_id):
    """
    Si POST contient 'submission_1' et 'submission_2', compare uniquement ces deux soumissions.
    Sinon, compare toutes les paires de l'exercice (comportement par défaut).
    """
    try:
        submission_1_id = request.data.get('submission_1')
        submission_2_id = request.data.get('submission_2')
        if submission_1_id and submission_2_id:
            # Mode comparaison individuelle
            try:
                sub1 = Submission.objects.get(id=submission_1_id, exercise=exercise_id)
                sub2 = Submission.objects.get(id=submission_2_id, exercise=exercise_id)
            except Submission.DoesNotExist:
                return Response({"status": "error", "message": "Soumission introuvable pour cet exercice."}, status=400)
            text1 = preprocess_text(extract_text_from_pdf(sub1.pdf_url))
            text2 = preprocess_text(extract_text_from_pdf(sub2.pdf_url))
            tfidf_score = check_plagiarism(text1, [text2])
            # Crée ou met à jour dans les deux sens
            PlagiarismCheck.objects.update_or_create(
                submission_1=sub1, submission_2=sub2,
                defaults={"similarity_score": tfidf_score}
            )
            PlagiarismCheck.objects.update_or_create(
                submission_1=sub2, submission_2=sub1,
                defaults={"similarity_score": tfidf_score}
            )
            # Ajout : garantir qu'il existe au moins un PlagiarismCheck (score 0) pour chaque soumission, même si jamais comparée
            subs = Submission.objects.filter(exercise=exercise_id)
            plag_ids = set()
            for pc in PlagiarismCheck.objects.filter(submission_1__in=subs, submission_2__in=subs):
                plag_ids.add(pc.submission_1.id)
                plag_ids.add(pc.submission_2.id)
            for sub in subs:
                if sub.id not in plag_ids:
                    PlagiarismCheck.objects.create(submission_1=sub, submission_2=sub, similarity_score=0)
            return Response({"status": "ok", "message": "Comparaison individuelle effectuée.", "score": tfidf_score})
        # Sinon : mode batch (toutes les paires)
        subs = Submission.objects.filter(exercise=exercise_id)
        with transaction.atomic():
            for i, sub1 in enumerate(subs):
                text1 = preprocess_text(extract_text_from_pdf(sub1.pdf_url))
                for j, sub2 in enumerate(subs):
                    if i >= j:
                        continue
                    text2 = preprocess_text(extract_text_from_pdf(sub2.pdf_url))
                    tfidf_score = check_plagiarism(text1, [text2])
                    PlagiarismCheck.objects.update_or_create(
                        submission_1=sub1, submission_2=sub2,
                        defaults={"similarity_score": tfidf_score}
                    )
        # Ajout : garantir qu'il existe au moins un PlagiarismCheck (score 0) pour chaque soumission, même si elle n'est jamais en submission_1 NI submission_2
        all_ids = set(sub.id for sub in subs)
        plag_ids = set()
        for pc in PlagiarismCheck.objects.filter(submission_1__in=subs, submission_2__in=subs):
            plag_ids.add(pc.submission_1.id)
            plag_ids.add(pc.submission_2.id)
        for sub in subs:
            if sub.id not in plag_ids:
                PlagiarismCheck.objects.create(submission_1=sub, submission_2=sub, similarity_score=0)
        return Response({"status": "ok", "message": "Détection de plagiat terminée."})
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
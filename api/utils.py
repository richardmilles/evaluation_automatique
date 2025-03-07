import supabase
import uuid
import os
import pytesseract
import pdfplumber
from io import BytesIO
import ollama
import re

import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import string
from django.urls import path, include
from rest_framework.routers import DefaultRouter



# Télécharger les ressources nécessaires pour nltk
nltk.download('punkt')
nltk.download('stopwords')

# Initialiser le client Supabase
supabase_client = supabase.create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def upload_pdf(file):
    """Téléverse un fichier PDF sur Supabase Storage et retourne l'URL"""
    file_id = str(uuid.uuid4()) + ".pdf"  # Générer un ID unique pour le fichier
    response = supabase_client.storage.from_("submissions").upload(file_id, file)
    
    # Construire l'URL publique du fichier
    if response:
        return f"{os.getenv('SUPABASE_URL')}/storage/v1/object/public/submissions/{file_id}"
    else:
        return None


def extract_text_from_pdf(pdf_file):
    """ Extrait le texte d'un fichier PDF """
    text = ""
    with pdfplumber.open(BytesIO(pdf_file.read())) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text.strip() if text else None


def evaluate_submission(student_text, model_answer):
    """Évalue une soumission avec DeepSeek et génère une note et un feedback"""
    prompt = f"""
    Corrige cette réponse étudiant en la comparant au modèle :

    Réponse Étudiant :
    {student_text}

    Réponse Modèle :
    {model_answer}

    Donne une note sur 20 et un feedback détaillé.
    """

    if os.getenv("USE_CLOUD_AI", "False") == "True":
        # 🔹 Mode Cloud (DeepSeek API)
        url = os.getenv("CLOUD_AI_URL")
        headers = {"Authorization": f"Bearer {os.getenv('CLOUD_AI_KEY')}"}
        response = requests.post(url, json={"prompt": prompt}, headers=headers)

        if response.status_code == 200:
            return response.json().get("feedback", "Erreur lors de la correction.")
        else:
            return "Erreur avec l’API Cloud."
    else:
        # 🔹 Mode Local (Ollama)
        response = ollama.chat(model="deepseek", messages=[{"role": "user", "content": prompt}])
        return response.get("content", "Erreur lors de la correction.") 



def extract_grade_from_feedback(feedback):
    """
    Extrait la note sur 20 à partir du texte généré par l'IA.
    Ex : "Note attribuée : 15/20" -> retourne 15
    """
    match = re.search(r'(\d{1,2})/20', feedback)  # Cherche une note sur 20 dans le texte
    if match:
        return int(match.group(1))  # Retourne uniquement le chiffre trouvé
    return 0  # Retourne 0 si aucune note n'a été trouvée

def preprocess_text(text):
    """Nettoie et normalise le texte pour le traitement NLP"""
    text = text.lower()  # Convertir en minuscule
    text = text.translate(str.maketrans("", "", string.punctuation))  # Supprimer la ponctuation
    tokens = word_tokenize(text)  # Tokenisation
    tokens = [word for word in tokens if word not in stopwords.words('french')]  # Supprimer les stopwords
    return " ".join(tokens)  # Rejoindre les tokens en une chaîne de texte

def check_plagiarism(submission_text, other_texts):
    """
    Compare une soumission avec les autres en utilisant TF-IDF.
    Retourne le score de similarité le plus élevé.
    """
    texts = [submission_text] + other_texts  # Ajouter la soumission aux autres
    vectorizer = TfidfVectorizer().fit_transform(texts)  # Convertir en vecteurs TF-IDF
    similarity_matrix = cosine_similarity(vectorizer)  # Calculer la similarité

    return max(similarity_matrix[0][1:]) * 100  # Retourne le score de plagiat le plus élevé


def jaccard_similarity(text1, text2):
    """
    Calcule la similarité de Jaccard entre deux textes.
    """
    set1 = set(text1.split())
    set2 = set(text2.split())
    intersection = set1.intersection(set2)
    union = set1.union(set2)
    
    return len(intersection) / len(union) * 100 if union else 0



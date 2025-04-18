from config import settings
import supabase
import uuid
import os
import pytesseract
import pdfplumber
from io import BytesIO
import ollama
import re
from supabase.client import create_client
import requests
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import string
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from dotenv import load_dotenv
load_dotenv()
from distutils.util import strtobool



SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


# Initialisation du client Supabase
supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialiser le client Supabase
def upload_pdf(file):
    """
    Téléverse un fichier PDF sur Supabase Storage depuis un InMemoryUploadedFile
    """
    file_id = f"{uuid.uuid4()}.pdf"
    file_content = file.read()  # Lire le contenu binaire du fichier
    file.seek(0)  # Remettre le pointeur au début pour extraction ultérieure

    # DEBUG : log taille du fichier et id
    print(f"[DEBUG upload_pdf] file_id={file_id}, taille={len(file_content)} bytes")

    # Tentative d'upload avec gestion du timeout (si supporté)
    try:
        response = supabase_client.storage.from_("submissions").upload(
            file_id,
            file_content,
            {"content-type": "application/pdf"}
            # timeout=30  # Décommente si la lib le supporte
        )
        print("[DEBUG upload_pdf] Réponse Supabase:", response)
    except Exception as e:
        print("[DEBUG upload_pdf] Exception lors de l'upload:", e)
        raise

    if response:
        file_url = f"{SUPABASE_URL}/storage/v1/object/public/submissions/{file_id}"
        print(f"[DEBUG upload_pdf] Upload OK. URL: {file_url}")
        return file_url
    else:
        print("[DEBUG upload_pdf] Upload échoué, pas de réponse.")
        raise Exception("Échec du téléchargement sur Supabase")
    
def extract_text_from_pdf(pdf_url):
    """
    Extrait le texte d’un fichier PDF à partir d’une URL Supabase
    """
    response = requests.get(pdf_url)
    if response.status_code == 200:
        pdf_file = BytesIO(response.content)
        text = ""
        with pdfplumber.open(pdf_file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    else:
        raise Exception("Erreur de téléchargement du PDF.")
    
def evaluate_with_deepseek(prompt):
    url = "https://api.deepseek.com/chat/completions"

    headers = {
        "Authorization": f"Bearer {os.getenv('DEEPSEEK_API_KEY')}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "deepseek-chat",  # ou "deepseek-reasoner"
        "messages": [
            {"role": "system", "content": "Tu es un assistant de correction pédagogique."},
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        print("✅ Réponse DeepSeek =", data)
        return data["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        print("🚨 Erreur DeepSeek =", e)
        return f"[Erreur DeepSeek] {str(e)}"


'''
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
'''
import os

def evaluate_submission(student_text, model_answer):
    prompt = f"""
    tu es un assistant pédagogique spécialisé en base de données.

Compare la réponse d’un étudiant à la solution modèle d’un exercice SQL.

Donne une note sur 20 suivie d’un feedback structuré avec :
- les erreurs identifiées
- les points corrects
- et une amélioration suggérée.

    ➤ Réponse Étudiant :
    {student_text}

    ➤ Correction Modèle :
    {model_answer}

    Donne une note sur 20 suivie d'un feedback pédagogique clair.
    """

    use_cloud = settings.USE_CLOUD_AI
    ai_provider = settings.AI_PROVIDER.lower()

    print("🔍 DEBUG USE_CLOUD_AI =", use_cloud)
    print("🔍 DEBUG AI_PROVIDER =", ai_provider)

    if not use_cloud:
        return evaluate_with_ollama(prompt)
    
    if ai_provider == "openrouter":
        return evaluate_with_openrouter(prompt)
    elif ai_provider == "deepseek":
        return evaluate_with_deepseek(prompt)
    else:
        return "[Erreur] Fournisseur IA non supporté."
'''
def evaluate_submission(student_text, model_answer):
    prompt = f"""
    Corrige cette réponse d'étudiant comparée au modèle :

    ➤ Réponse Étudiant :
    {student_text}

    ➤ Correction Modèle :
    {model_answer}

    Donne une note sur 20 suivie d'un feedback pédagogique clair.
    """

    use_cloud = settings.USE_CLOUD_AI
    ai_provider = settings.AI_PROVIDER

    print("🔍 DEBUG USE_CLOUD_AI =", use_cloud)
    print("🔍 DEBUG AI_PROVIDER =", ai_provider)

    if use_cloud and ai_provider.lower() == "openrouter":
        return evaluate_with_openrouter(prompt)
    else:
        return evaluate_with_ollama(prompt)

def evaluate_with_ollama(prompt):
    response = ollama.chat(
        model="deepseek",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.get("message", {}).get("content") or response.get("content")
'''

'''
def evaluate_with_openrouter(prompt):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", ""),
        "X-Title": os.getenv("OPENROUTER_TITLE", "")
    }

    payload = {
        "model": "deepseek/deepseek-v3-base:free",  # ou un autre modèle si tu veux
        "messages": [{"role": "user", "content": prompt}]
    }

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        return f"Erreur OpenRouter : {response.text}"
'''
def evaluate_with_openrouter(prompt):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", ""),
        "X-Title": os.getenv("OPENROUTER_TITLE", "")
    }

    payload = {
 #       "model": "deepseek/deepseek-v3-base:free",
        "model": "meta-llama/llama-3.3-70b-instruct",

        "messages": [{"role": "user", "content": prompt}]
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

        # 🔥 Ajoute ce print pour vérifier précisément ce que renvoie OpenRouter :
        print("✅ Réponse OpenRouter =", data)

        return data["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        print("🚨 Erreur OpenRouter =", e)
        return f"[Erreur OpenRouter] {str(e)}"

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
    """Nettoie et normalise le texte pour le traitement NLP (sans NLTK)"""
    text = text.lower()
    tokens = re.findall(r'\b\w+\b', text)
    stopwords_fr = {
        'le', 'la', 'les', 'un', 'une', 'et', 'de', 'des', 'du', 'en', 'à', 'pour', 'par', 'avec', 'sur', 'dans',
        'ce', 'ces', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'ne', 'pas', 'que', 'qui', 'quoi', 'dont',
        'où', 'mais', 'ou', 'donc', 'or', 'ni', 'car'
    }
    tokens = [word for word in tokens if word not in stopwords_fr]
    return " ".join(tokens)

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



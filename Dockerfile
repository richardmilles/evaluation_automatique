# Utilise une image légère de Python
FROM python:3.12-slim

# Ne pas bufferiser les logs
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Crée le dossier de travail
WORKDIR /app

# Copier et installer les dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier tout le code
COPY . .

# Collecte des fichiers statiques (utile si tu as du CSS/JS Django)
RUN python manage.py collectstatic --noinput || true

# Ouvre le port utilisé par Railway
EXPOSE $PORT

# Lancer l'app avec gunicorn
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]

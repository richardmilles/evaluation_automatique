# Utilise une image légère de Python
FROM python:3.12-slim

# Ne pas bufferiser les logs
ENV PYTHONUNBUFFERED=1

# Port par défaut (utilisé en local, remplacé automatiquement sur Railway)
ENV PORT=8000

# Crée le dossier de travail
WORKDIR /app

# Copier et installer les dépendances
COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# Copier tout le code de l'application
COPY . .

# Expose le port utilisé par Railway
EXPOSE $PORT

# Lancer l'app avec Gunicorn (sur le port dynamique de Railway)
# Et collecter les fichiers statiques au lancement
CMD python manage.py collectstatic --no-input && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT

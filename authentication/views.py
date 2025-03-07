from django.contrib.auth import get_user_model
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer

User = get_user_model()  # 🔥 Utilisation du modèle User défini dans `api`
class RegisterView(CreateAPIView):
    """ Vue pour inscrire un utilisateur (professeur ou étudiant) """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    
    permission_classes = [AllowAny]  # Tout le monde peut s'inscrire
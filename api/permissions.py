from rest_framework.permissions import BasePermission
import json

class IsProfessor(BasePermission):
    """Permission : Seuls les professeurs peuvent accéder à cette vue."""
    def has_permission(self, request, view):
        print("[DEBUG IsProfessor] Auth header:", request.headers.get('Authorization'))
        print("[DEBUG IsProfessor] User authenticated:", request.user.is_authenticated)
        print("[DEBUG IsProfessor] User:", request.user)
        if hasattr(request.user, 'role'):
            print("[DEBUG IsProfessor] User role:", request.user.role)
        return request.user.is_authenticated and request.user.role == 'professor'

from rest_framework_simplejwt.authentication import JWTAuthentication

class IsStudent(BasePermission):
    """Permission : Seuls les étudiants peuvent accéder à cette vue."""
    def has_permission(self, request, view):
        print("\n[DEBUG IsStudent] === Début vérification permission ====")
        print("[DEBUG IsStudent] Auth header:", request.headers.get('Authorization'))
        print("[DEBUG IsStudent] User authenticated:", request.user.is_authenticated)
        print("[DEBUG IsStudent] User:", request.user)
        
        user = request.user
        if user.is_authenticated and hasattr(user, 'role'):
            print("[DEBUG IsStudent] User a un attribut role:", user.role)
            return user.role == 'student'
        else:
            print("[DEBUG IsStudent] User n'a pas d'attribut role ou n'est pas authentifié")
            
        # Si le champ n'existe pas sur user, on tente de le récupérer via le token JWT brut
        auth = JWTAuthentication()
        header = auth.get_header(request)
        if header is None:
            print("[DEBUG IsStudent] Pas de header Authorization")
            return False
            
        print("[DEBUG IsStudent] Header trouvé:", header)
        raw_token = auth.get_raw_token(header)
        if raw_token is None:
            print("[DEBUG IsStudent] Pas de token brut")
            return False
            
        print("[DEBUG IsStudent] Token brut trouvé:", raw_token)
        try:
            validated_token = auth.get_validated_token(raw_token)
            print("[DEBUG IsStudent] Token validé:", validated_token)
            role = validated_token.get('role', None)
            print("[DEBUG IsStudent] Role extrait du token:", role)
            print("[DEBUG IsStudent] === Fin vérification permission ====")
            return role == 'student'
        except Exception as e:
            print("[ERROR IsStudent] Erreur validation token:", str(e))
            print("[DEBUG IsStudent] === Fin vérification permission avec erreur ====")
            return False

from rest_framework.permissions import BasePermission

class IsProfessor(BasePermission):
    """Permission : Seuls les professeurs peuvent accéder à cette vue."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'professor'

class IsStudent(BasePermission):
    """Permission : Seuls les étudiants peuvent accéder à cette vue."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'

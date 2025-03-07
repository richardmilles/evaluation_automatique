from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

User = get_user_model()  # 🔥 Récupère le modèle User

class RegisterSerializer(serializers.ModelSerializer):
    """ Serializer pour l'inscription des utilisateurs """
    class Meta:
        model = User
        fields = ['username','id', 'first_name', 'last_name', 'email', 'password', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])  # Hash du mot de passe
        return User.objects.create(**validated_data)

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Utilisateur

User = get_user_model()

# =============================================================
# 1. UTILISATEUR SERIALIZER - pour lecture/écriture
# =============================================================
class UtilisateurSerializer(serializers.ModelSerializer):
    # Champs User liés
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    is_staff = serializers.BooleanField(source='user.is_staff', read_only=True)
    is_superuser = serializers.BooleanField(source='user.is_superuser', read_only=True)

    class Meta:
        model = Utilisateur
        fields = [
            'user',
            'username',
            'email',
            'nom',
            'avatar',
            'reputation',
            'role',
            'date_derniere_connexion',
            'is_staff',
            'is_superuser'
        ]
        extra_kwargs = {
            'user': {'required': False, 'allow_null': True}
        }

    def update(self, instance, validated_data):
        instance.nom = validated_data.get('nom', instance.nom)
        instance.avatar = validated_data.get('avatar', instance.avatar)
        instance.save()
        return instance

# =============================================================
# 2. CHANGEMENT DE MOT DE PASSE
# =============================================================
class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        validate_password(value, self.context['request'].user)
        return value

    def validate(self, data):
        user = self.context['request'].user
        if not user.check_password(data['old_password']):
            raise serializers.ValidationError({"old_password": "L'ancien mot de passe est incorrect."})
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"new_password": "Les nouveaux mots de passe ne correspondent pas."})
        return data

# =============================================================
# 3. INSCRIPTION UTILISATEUR
# =============================================================
class UserRegistrationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    email = serializers.EmailField(required=False)
    avatar = serializers.ImageField(required=False, allow_null=True) 

    class Meta:
        model = Utilisateur 
        fields = ['username', 'password', 'email', 'avatar']

    def create(self, validated_data):
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        email = validated_data.pop('email', '')
        avatar = validated_data.pop('avatar', None)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        profile = Utilisateur.objects.create(
            user=user,
            avatar=avatar,
            **validated_data
        )
        return profile
# utilisateur/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import IntegrityError
from .models import Utilisateur

User = get_user_model()


# =============================================================
# 1. UTILISATEUR SERIALIZER
# =============================================================
class UtilisateurSerializer(serializers.ModelSerializer):
    # Champs User liés
    id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    is_staff = serializers.BooleanField(source='user.is_staff', read_only=True)
    is_superuser = serializers.BooleanField(source='user.is_superuser', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()  # ✅ Ajout du champ is_admin

    class Meta:
        model = Utilisateur
        fields = [
            'id',
            'user',
            'username',
            'email',
            'nom',
            'avatar',
            'avatar_url',
            'reputation',
            'role',
            'date_derniere_connexion',
            'is_active',
            'is_staff',
            'is_superuser',
            'is_admin',  # ✅ Ajouté dans les fields
        ]
        extra_kwargs = {
            'user': {'required': False, 'allow_null': True},
            'avatar': {'required': False, 'allow_null': True},
        }

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

    def get_is_admin(self, obj):
        """✅ CORRECTION: Méthode correctement indentée"""
        try:
            # Vérifier si l'utilisateur est admin via plusieurs critères
            if hasattr(obj, 'user'):
                user = obj.user
                return (
                    user.is_staff or 
                    user.is_superuser or 
                    obj.role == 'admin'
                )
            return False
        except:
            return False

    def update(self, instance, validated_data):
        instance.nom = validated_data.get('nom', instance.nom)
        if 'avatar' in validated_data:
            instance.avatar = validated_data.get('avatar')
        instance.save()
        return instance


# =============================================================
# 2. USER SERIALIZER (pour l'authentification)
# =============================================================
class UserSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle User Django avec infos du profil"""
    role = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    reputation = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'email', 
            'first_name',
            'last_name',
            'is_staff', 
            'is_superuser',
            'role', 
            'is_admin',
            'reputation'
        ]
    
    def get_role(self, obj):
        """Récupérer le rôle depuis le profil Utilisateur"""
        try:
            profile = Utilisateur.objects.filter(user=obj).first()
            if profile:
                return profile.role
            return 'user'
        except:
            return 'user'
    
    def get_is_admin(self, obj):
        """Vérifier si l'utilisateur est admin"""
        try:
            profile = Utilisateur.objects.filter(user=obj).first()
            return (
                obj.is_staff or 
                obj.is_superuser or 
                (profile and profile.role == 'admin')
            )
        except:
            return False
    
    def get_reputation(self, obj):
        """Récupérer la réputation depuis le profil"""
        try:
            profile = Utilisateur.objects.filter(user=obj).first()
            if profile:
                return profile.reputation
            return 0
        except:
            return 0


# =============================================================
# 3. CHANGEMENT DE MOT DE PASSE
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
            raise serializers.ValidationError({
                "old_password": "L'ancien mot de passe est incorrect."
            })
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                "new_password": "Les nouveaux mots de passe ne correspondent pas."
            })
        return data


# =============================================================
# 4. INSCRIPTION UTILISATEUR
# =============================================================
class UserRegistrationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    email = serializers.EmailField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Utilisateur
        fields = ['username', 'password', 'email', 'avatar']

    def validate_username(self, value):
        """Vérifier que le username n'existe pas déjà"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur existe déjà.")
        return value

    def validate_email(self, value):
        """Vérifier que l'email n'existe pas déjà (si fourni)"""
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def create(self, validated_data):
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        email = validated_data.pop('email', '') or ''
        avatar = validated_data.pop('avatar', None)

        try:
            # Créer le User Django
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )

            # Vérifier si un profil existe déjà (cas rare)
            profile, created = Utilisateur.objects.get_or_create(
                user=user,
                defaults={
                    'nom': username,
                    'avatar': avatar,
                    **validated_data
                }
            )

            # Si le profil existait déjà, mettre à jour l'avatar
            if not created and avatar:
                profile.avatar = avatar
                profile.save()

            return profile

        except IntegrityError:
            # Si erreur d'intégrité, supprimer le user créé
            if 'user' in locals():
                user.delete()
            raise serializers.ValidationError({
                "username": "Erreur lors de la création du compte. Veuillez réessayer."
            })
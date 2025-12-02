from rest_framework import viewsets, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model

from .models import Utilisateur
from .serializers import (
    UtilisateurSerializer,
    PasswordChangeSerializer,
    UserRegistrationSerializer,
)

User = get_user_model()

# ============================
# 👤 1. Vue /utilisateur/me/
# ============================
class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile, created = Utilisateur.objects.get_or_create(
                user=request.user,
                defaults={
                    'username': request.user.username,
                    'email': request.user.email,
                }
            )
            serializer = UtilisateurSerializer(profile)
            data = serializer.data
            data['is_staff'] = request.user.is_staff
            data['is_superuser'] = request.user.is_superuser
            return Response(data)
        except Exception as e:
            print("❌ Erreur /me :", str(e))
            return Response({'error': str(e)}, status=500)

# ============================
# 🟢 2. Vue RegisterView
# ============================
class RegisterView(generics.CreateAPIView):
    """
    Permet à un utilisateur de s'inscrire.
    - Accepte : JSON ou FormData
    - Utilise le serializer UserRegistrationSerializer
    """
    queryset = Utilisateur.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, JSONParser]  # Avatar / fichiers compatibles

# ============================
# 🔄 3. Mise à jour du profil
# ============================
class UpdateProfileView(generics.GenericAPIView):
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, JSONParser]

    def get_object(self):
        return self.request.user.profile

    def patch(self, request, *args, **kwargs):
        profile = self.get_object()
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(UtilisateurSerializer(instance).data, status=200)


# ============================
# 🔐 4. Changement mot de passe
# ============================
class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['post']

    def get_object(self):
        return self.request.user

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = self.get_object()
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Mot de passe changé avec succès.'}, status=200)

# ============================
# ✅ 5. Profile "upsert" automatique
# ============================
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def ensure_profile_view(request):
    try:
        user = request.user
        profil, created = Utilisateur.objects.get_or_create(
            user=user,
            defaults={
                'username': user.username,
                'email': user.email
            }
        )
        return Response({'message': 'Profil assuré.', 'created': created}, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# ============================
# 🌐 6. Admin ViewSet (CRUD)
# ============================
class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAdminUser]
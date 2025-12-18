# utilisateur/views.py

from rest_framework import viewsets, generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser, FormParser
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated  # ✅ Import ajouté
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.db.models import Q  # ✅ Import ajouté

from .models import Utilisateur
from .serializers import (
    UtilisateurSerializer,
    PasswordChangeSerializer,
    UserRegistrationSerializer,
    UserSerializer,  # ✅ Import ajouté
)

User = get_user_model()


# ============================
# 👤 1. Vue /utilisateur/me/
# ============================
class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        """Récupérer le profil de l'utilisateur connecté"""
        try:
            profile, created = Utilisateur.objects.get_or_create(
                user=request.user,
                defaults={'nom': request.user.username}
            )
            
            serializer = UtilisateurSerializer(profile, context={'request': request})
            data = serializer.data
            
            # ✅ Ajouter les infos admin
            data['id'] = request.user.id
            data['username'] = request.user.username
            data['email'] = request.user.email
            data['is_staff'] = request.user.is_staff
            data['is_superuser'] = request.user.is_superuser
            data['is_admin'] = (
                request.user.is_staff or 
                request.user.is_superuser or 
                profile.role == 'admin'
            )
            
            if profile.avatar:
                data['avatar'] = request.build_absolute_uri(profile.avatar.url)
            
            return Response(data)
            
        except Exception as e:
            print("❌ Erreur GET /me :", str(e))
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)

    def patch(self, request):
        """Mettre à jour le profil"""
        try:
            profile, created = Utilisateur.objects.get_or_create(
                user=request.user,
                defaults={'nom': request.user.username}
            )
            
            serializer = UtilisateurSerializer(
                profile, 
                data=request.data, 
                partial=True,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            user = request.user
            if 'username' in request.data:
                user.username = request.data['username']
            if 'email' in request.data:
                user.email = request.data['email']
            user.save()
            
            profile.refresh_from_db()
            
            updated_data = UtilisateurSerializer(profile, context={'request': request}).data
            updated_data['id'] = user.id
            updated_data['username'] = user.username
            updated_data['email'] = user.email
            updated_data['is_staff'] = user.is_staff
            updated_data['is_superuser'] = user.is_superuser
            updated_data['is_admin'] = (
                user.is_staff or 
                user.is_superuser or 
                profile.role == 'admin'
            )
            
            if profile.avatar:
                updated_data['avatar'] = request.build_absolute_uri(profile.avatar.url)
            
            return Response(updated_data, status=200)
            
        except Exception as e:
            print("❌ Erreur PATCH /me :", str(e))
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)

    def put(self, request):
        return self.patch(request)


# ============================
# 🔄 2. UpdateProfileView
# ============================
class UpdateProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request):
        try:
            profile, _ = Utilisateur.objects.get_or_create(
                user=request.user,
                defaults={'nom': request.user.username}
            )
            
            serializer = UtilisateurSerializer(
                profile, 
                data=request.data, 
                partial=True,
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            user = request.user
            if 'username' in request.data:
                user.username = request.data['username']
            if 'email' in request.data:
                user.email = request.data['email']
            user.save()
            
            data = serializer.data
            data['username'] = user.username
            data['email'] = user.email
            
            if profile.avatar:
                data['avatar'] = request.build_absolute_uri(profile.avatar.url)
            
            return Response(data, status=200)
            
        except Exception as e:
            print("❌ Erreur UpdateProfileView:", str(e))
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)

    def put(self, request):
        return self.patch(request)


# ============================
# 📊 3. Vue Stats
# ============================
class UserStatsView(APIView):
    """Vue pour les statistiques utilisateur"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = Utilisateur.objects.filter(user=request.user).first()
            
            favoris_count = 0
            contributions_count = 0
            commentaires_count = 0
            
            try:
                from interaction.models import Favori, Contribution, Commentaire
                
                try:
                    favoris_count = Favori.objects.filter(utilisateurRef=request.user).count()
                except:
                    pass
                    
                try:
                    contributions_count = Contribution.objects.filter(utilisateurRef=request.user).count()
                except:
                    pass
                    
                try:
                    commentaires_count = Commentaire.objects.filter(utilisateurRef=request.user).count()
                except:
                    pass
                    
            except Exception as e:
                print(f"⚠️ Erreur import interaction models: {e}")
            
            return Response({
                'reputation': profile.reputation if profile else 0,
                'favoris_count': favoris_count,
                'contributions_count': contributions_count,
                'commentaires_count': commentaires_count,
            })
            
        except Exception as e:
            print(f"❌ Erreur stats view: {e}")
            return Response({
                'reputation': 0,
                'favoris_count': 0,
                'contributions_count': 0,
                'commentaires_count': 0,
            })


# ============================
# 🟢 4. RegisterView
# ============================
class RegisterView(generics.CreateAPIView):
    queryset = Utilisateur.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


# ============================
# 🔐 5. ChangePasswordView
# ============================
class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Mot de passe changé avec succès.'}, status=200)
        
        return Response(serializer.errors, status=400)


# ============================
# ✅ 6. Ensure Profile
# ============================
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def ensure_profile_view(request):
    try:
        user = request.user
        profil, created = Utilisateur.objects.get_or_create(
            user=user,
            defaults={'nom': user.username}
        )
        return Response({'message': 'Profil assuré.', 'created': created}, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ============================
# 🌐 7. Admin ViewSet
# ============================
class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.select_related('user').all()
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        qs = super().get_queryset()

        params = self.request.query_params
        q = params.get('q')
        role = params.get('role')
        active = params.get('active')
        staff = params.get('staff')

        if q:
            qs = qs.filter(
                Q(user__username__icontains=q) |
                Q(user__email__icontains=q) |
                Q(nom__icontains=q)
            )

        if role:
            qs = qs.filter(role__iexact=role)

        if active in ('true', 'false'):
            is_active = active == 'true'
            qs = qs.filter(user__is_active=is_active)

        if staff in ('true', 'false'):
            is_staff = staff == 'true'
            qs = qs.filter(user__is_staff=is_staff)

        return qs

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        profil = self.get_object()
        user = profil.user
        user.is_active = not user.is_active
        user.save()
        return Response({'id': user.id, 'is_active': user.is_active})

    @action(detail=True, methods=['post'])
    def toggle_staff(self, request, pk=None):
        profil = self.get_object()
        user = profil.user
        user.is_staff = not user.is_staff
        user.save()
        return Response({'id': user.id, 'is_staff': user.is_staff})

    @action(detail=True, methods=['post'])
    def set_role(self, request, pk=None):
        profil = self.get_object()
        role = request.data.get('role', 'user')
        profil.role = role
        profil.save()
        return Response({'id': profil.user.id, 'role': profil.role})

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        profil = self.get_object()
        user = profil.user
        temp_password = User.objects.make_random_password()
        user.set_password(temp_password)
        user.save()
        return Response({'id': user.id, 'temp_password': temp_password})


# ============================
# 👤 8. User Profile & Role Views
# ============================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """✅ Retourne les infos de l'utilisateur connecté avec son rôle"""
    try:
        # Utiliser le UserSerializer pour avoir toutes les infos
        serializer = UserSerializer(request.user)
        data = serializer.data
        
        # Ajouter explicitement is_admin
        profile = Utilisateur.objects.filter(user=request.user).first()
        data['is_admin'] = (
            request.user.is_staff or 
            request.user.is_superuser or 
            (profile and profile.role == 'admin')
        )
        
        return Response(data)
    except Exception as e:
        print(f"❌ Erreur user_profile: {e}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_role(request):
    """✅ Retourne uniquement le rôle de l'utilisateur"""
    try:
        # Récupérer le profil
        profile = Utilisateur.objects.filter(user=request.user).first()
        
        # Déterminer le rôle
        if profile:
            role = profile.role
        else:
            role = 'user'
        
        # Vérifier si admin
        is_admin = (
            request.user.is_staff or 
            request.user.is_superuser or 
            role == 'admin'
        )
        
        return Response({
            'username': request.user.username,
            'role': role,
            'is_admin': is_admin,
            'is_staff': request.user.is_staff,
            'is_superuser': request.user.is_superuser
        })
    except Exception as e:
        print(f"❌ Erreur user_role: {e}")
        return Response({
            'username': request.user.username,
            'role': 'user',
            'is_admin': False,
            'is_staff': False,
            'is_superuser': False
        }, status=200)
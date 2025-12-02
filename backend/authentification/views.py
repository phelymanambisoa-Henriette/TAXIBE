from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from rest_framework_simplejwt.tokens import RefreshToken

from utilisateur.serializers import UtilisateurSerializer  # adapte si ton chemin est différent

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')

        if not username or not password:
            return Response({'detail': 'username et password sont requis.'}, status=400)

        try:
            user = User(username=username, email=email)
            user.password = make_password(password)
            user.save()
        except IntegrityError:
            return Response({'detail': "Nom d'utilisateur déjà utilisé."}, status=400)

        refresh = RefreshToken.for_user(user)
        data = {
            'user': UtilisateurSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        return Response(data, status=status.HTTP_201_CREATED)
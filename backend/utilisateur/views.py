from rest_framework import viewsets
from .models import Utilisateur
from .serializers import UtilisateurSerializer

from rest_framework.permissions import IsAuthenticated, AllowAny

class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    permission_classes = [AllowAny]  # lecture publiqu
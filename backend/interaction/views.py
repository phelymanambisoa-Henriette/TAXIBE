from rest_framework import viewsets
from .models import Commentaire, Contribution, HistoriqueRecherche
from .serializers import CommentaireSerializer, ContributionSerializer, HistoriqueRechercheSerializer

from rest_framework.permissions import IsAuthenticated, AllowAny

class ContributionViewSet(viewsets.ModelViewSet):
    queryset = Contribution.objects.all()
    serializer_class = ContributionSerializer
    permission_classes = [IsAuthenticated]  # POST/PUT uniquement pour utilisateurs connectés

class CommentaireViewSet(viewsets.ModelViewSet):
    queryset = Commentaire.objects.all()
    serializer_class = CommentaireSerializer

    def get_permissions(self):
        if self.request.method in ['GET']:
            return [AllowAny()]
        return [IsAuthenticated()]

class HistoriqueRechercheViewSet(viewsets.ModelViewSet):
    queryset = HistoriqueRecherche.objects.all()
    serializer_class = HistoriqueRechercheSerializer
    permission_classes = [IsAuthenticated]
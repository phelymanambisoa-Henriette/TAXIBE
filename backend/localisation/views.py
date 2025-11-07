from rest_framework import viewsets
from .models import Ville, Quartier, Arret
from .serializers import VilleSerializer, QuartierSerializer, ArretSerializer

from rest_framework.permissions import AllowAny

class VilleViewSet(viewsets.ModelViewSet):
    queryset = Ville.objects.all()
    serializer_class = VilleSerializer
    permission_classes = [AllowAny]

class QuartierViewSet(viewsets.ModelViewSet):
    queryset = Quartier.objects.all()
    serializer_class = QuartierSerializer
    permission_classes = [AllowAny]

class ArretViewSet(viewsets.ModelViewSet):
    queryset = Arret.objects.all()
    serializer_class = ArretSerializer
    permission_classes = [AllowAny]

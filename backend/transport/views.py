from rest_framework import viewsets
from .models import Bus, Trajet, TrajetArret
from .serializers import BusSerializer, TrajetSerializer, TrajetArretSerializer

from rest_framework.permissions import AllowAny, IsAuthenticated

class BusViewSet(viewsets.ModelViewSet):
    queryset = Bus.objects.all()
    serializer_class = BusSerializer
    permission_classes = [AllowAny]  # GET public

class TrajetViewSet(viewsets.ModelViewSet):
    queryset = Trajet.objects.all()
    serializer_class = TrajetSerializer
    permission_classes = [AllowAny]

class TrajetArretViewSet(viewsets.ModelViewSet):
    queryset = TrajetArret.objects.all()
    serializer_class = TrajetArretSerializer
    permission_classes = [AllowAny]
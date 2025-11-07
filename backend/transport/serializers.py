from rest_framework import serializers
from .models import Bus, Trajet, TrajetArret

class BusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bus
        fields = '__all__'

class TrajetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trajet
        fields = '__all__'

class TrajetArretSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrajetArret
        fields = '__all__'

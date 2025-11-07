# localisation/serializers.py
from rest_framework import serializers
from .models import Ville, Quartier, Arret

class ArretSerializer(serializers.ModelSerializer):
    class Meta:
        model = Arret
        fields = '__all__'

class QuartierSerializer(serializers.ModelSerializer):
    arrets = ArretSerializer(many=True, read_only=True, source='arret_set')

    class Meta:
        model = Quartier
        fields = '__all__'
        
class VilleSerializer(serializers.ModelSerializer):
    quartiers = QuartierSerializer(many=True, read_only=True, source='quartier_set')

    class Meta:
        model = Ville
        fields =  '__all__'
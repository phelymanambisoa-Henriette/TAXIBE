from rest_framework import serializers
from .models import Contribution, HistoriqueRecherche, Commentaire
from utilisateur.models import Utilisateur
from localisation.models import Arret


# --- Contribution ---
class ContributionSerializer(serializers.ModelSerializer):
    utilisateurRef = serializers.PrimaryKeyRelatedField(
        queryset=Utilisateur.objects.all()
    )

    class Meta:
        model = Contribution
        fields = '__all__'


# --- Historique Recherche ---
class HistoriqueRechercheSerializer(serializers.ModelSerializer):
    userRef = serializers.PrimaryKeyRelatedField(queryset=Utilisateur.objects.all())
    depart = serializers.PrimaryKeyRelatedField(queryset=Arret.objects.all())
    arrivee = serializers.PrimaryKeyRelatedField(queryset=Arret.objects.all())

    class Meta:
        model = HistoriqueRecherche
        fields = '__all__'


# --- Commentaire ---
class CommentaireSerializer(serializers.ModelSerializer):
    auteurRef = serializers.PrimaryKeyRelatedField(queryset=Utilisateur.objects.all())
    parentRef = serializers.PrimaryKeyRelatedField(
        queryset=Commentaire.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Commentaire
        fields = '__all__'

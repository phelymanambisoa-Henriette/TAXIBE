# backend/interaction/serializers.py
from rest_framework import serializers
from .models import Favori, Contribution, Commentaire, HistoriqueRecherche, SignalementCommentaire

# ========== FAVORI ==========
class FavoriSerializer(serializers.ModelSerializer):
    bus_numero = serializers.SerializerMethodField()

    class Meta:
        model = Favori
        fields = ['id', 'busRef', 'bus_numero', 'date_ajout']
        read_only_fields = ['id', 'date_ajout']

    def get_bus_numero(self, obj):
        try:
            return getattr(obj.busRef, 'numeroBus', None) or getattr(obj.busRef, 'numero', None)
        except Exception:
            return None

# ========== CONTRIBUTION ==========
class ContributionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='utilisateurRef.username', read_only=True)
    bus_numero = serializers.SerializerMethodField()

    class Meta:
        model = Contribution
        fields = [
            'id', 'username', 'type', 'description', 'status',
            'busRef', 'bus_numero', 'date_creation', 'date_modification'
        ]
        read_only_fields = ['id', 'status', 'date_creation', 'date_modification', 'username', 'bus_numero']

    def get_bus_numero(self, obj):
        try:
            return getattr(obj.busRef, 'numeroBus', None) or getattr(obj.busRef, 'numero', None)
        except Exception:
            return None

# ========== COMMENTAIRE ==========
class CommentaireSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='utilisateurRef.username', read_only=True)
    bus_numero = serializers.CharField(source='busRef.numeroBus', read_only=True, allow_null=True)

    class Meta:
        model = Commentaire
        fields = [
            'id', 'username', 'busRef', 'bus_numero', 'contenu', 'note',
            'date_creation', 'date_modification'
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification', 'username', 'bus_numero']

# ========== HISTORIQUE RECHERCHE ==========
class HistoriqueRechercheSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='userRef.username', read_only=True)
    depart_nom = serializers.SerializerMethodField()
    arrivee_nom = serializers.SerializerMethodField()

    class Meta:
        model = HistoriqueRecherche
        fields = [
            'id',
            'userRef', 'username',
            'depart', 'depart_nom',
            'arrivee', 'arrivee_nom',
            'date_recherche'
        ]
        read_only_fields = [
            'id', 'date_recherche', 'username', 'depart_nom', 'arrivee_nom'
        ]

    def get_depart_nom(self, obj):
        a = obj.depart
        return getattr(a, 'nomArret', None) or getattr(a, 'nom', f'Arrêt #{a.id}')

    def get_arrivee_nom(self, obj):
        a = obj.arrivee
        return getattr(a, 'nomArret', None) or getattr(a, 'nom', f'Arrêt #{a.id}')

# ========== SIGNALEMENT COMMENTAIRE ==========
class SignalementCommentaireSerializer(serializers.ModelSerializer):
    reporter = serializers.CharField(source='utilisateurRef.username', read_only=True)
    commentaire_contenu = serializers.CharField(source='commentaireRef.contenu', read_only=True)
    bus_id = serializers.IntegerField(source='commentaireRef.busRef_id', read_only=True)

    class Meta:
        model = SignalementCommentaire
        fields = [
            'id', 'reporter', 'commentaireRef', 'commentaire_contenu', 'bus_id',
            'reason', 'status', 'date_creation'
        ]
        read_only_fields = ['id', 'reporter', 'commentaire_contenu', 'bus_id', 'date_creation']
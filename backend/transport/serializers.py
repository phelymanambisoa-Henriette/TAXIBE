# backend/transport/serializers.py
from rest_framework import serializers
from .models import Bus, Trajet, TrajetArret, PositionBus
from localisation.models import Arret

# ========== ARRET (inline) ==========
class ArretInlineSerializer(serializers.ModelSerializer):
    nom = serializers.SerializerMethodField()

    class Meta:
        model = Arret
        fields = ['id', 'nom', 'latitude', 'longitude']

    def get_nom(self, obj):
        # Compat: nomArret ou nom
        return getattr(obj, 'nomArret', None) or getattr(obj, 'nom', f'Arrêt #{obj.id}')


# ========== TRAJET (inline avec arrets ordonnés) ==========
class TrajetInlineSerializer(serializers.ModelSerializer):
    arrets = serializers.SerializerMethodField()

    class Meta:
        model = Trajet
        fields = ['id', 'typeTrajet', 'description', 'arrets']

    def get_arrets(self, obj):
        tas = TrajetArret.objects.filter(trajetRef=obj).order_by('ordrePassage')
        # On renvoie la liste des arrêts (id, nom, lat, lng)
        return ArretInlineSerializer([ta.arretRef for ta in tas], many=True).data


# ========== BUS LISTE ==========
class BusListSerializer(serializers.ModelSerializer):
    primus_nom = serializers.SerializerMethodField()
    terminus_nom = serializers.SerializerMethodField()
    ville_nom = serializers.SerializerMethodField()
    trajetCount = serializers.SerializerMethodField()

    class Meta:
        model = Bus
        fields = [
            'id', 'numeroBus', 'frais', 'status',
            'primus', 'primus_nom', 'terminus', 'terminus_nom',
            'villeRef', 'ville_nom', 'trajetCount',
        ]

    def get_primus_nom(self, obj):
        a = getattr(obj, 'primus', None)
        if not a:
            return None
        return getattr(a, 'nomArret', None) or getattr(a, 'nom', f'Arrêt #{getattr(a, "id", "")}')

    def get_terminus_nom(self, obj):
        a = getattr(obj, 'terminus', None)
        if not a:
            return None
        return getattr(a, 'nomArret', None) or getattr(a, 'nom', f'Arrêt #{getattr(a, "id", "")}')

    def get_ville_nom(self, obj):
        v = getattr(obj, 'villeRef', None)
        if not v:
            return None
        return getattr(v, 'nomVille', None) or getattr(v, 'nom', f'Ville #{getattr(v, "id", "")}')

    def get_trajetCount(self, obj):
        return Trajet.objects.filter(busRef=obj).count()


# ========== BUS DETAIL ==========
class BusDetailSerializer(serializers.ModelSerializer):
    primus_nom = serializers.SerializerMethodField()
    terminus_nom = serializers.SerializerMethodField()
    ville_nom = serializers.SerializerMethodField()
    trajets = serializers.SerializerMethodField()

    class Meta:
        model = Bus
        fields = [
            'id', 'numeroBus', 'frais', 'status',
            'primus', 'primus_nom', 'terminus', 'terminus_nom',
            'villeRef', 'ville_nom', 'trajets',
        ]

    def get_primus_nom(self, obj):
        a = getattr(obj, 'primus', None)
        if not a:
            return None
        return getattr(a, 'nomArret', None) or getattr(a, 'nom', f'Arrêt #{getattr(a, "id", "")}')

    def get_terminus_nom(self, obj):
        a = getattr(obj, 'terminus', None)
        if not a:
            return None
        return getattr(a, 'nomArret', None) or getattr(a, 'nom', f'Arrêt #{getattr(a, "id", "")}')

    def get_ville_nom(self, obj):
        v = getattr(obj, 'villeRef', None)
        if not v:
            return None
        return getattr(v, 'nomVille', None) or getattr(v, 'nom', f'Ville #{getattr(v, "id", "")}')

    def get_trajets(self, obj):
        trajets = Trajet.objects.filter(busRef=obj)
        return TrajetInlineSerializer(trajets, many=True).data


# ========== NOUVEAU: BUS CREATE / UPDATE (Pour l'écriture depuis l'admin) ==========
class BusCreateSerializer(serializers.ModelSerializer):
    """Sérialiseur utilisé pour la création et l'édition depuis l'interface admin."""
    
    # Champ spécifique pour recevoir la liste ordonnée des arrêts
    arrets_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1), 
        write_only=True,
        required=True,
        min_length=2, # Oblige à avoir au moins 2 arrêts (départ et arrivée)
        error_messages={
            'min_length': "Le trajet doit contenir au moins 2 arrêts (départ et arrivée)."
        }
    )

    class Meta:
        model = Bus
        fields = [
            'numeroBus', 'frais', 'status', 'villeRef', 
            'primus', 'terminus', 'arrets_ids' 
        ]

    def create(self, validated_data):
        # 1. Extrait la liste des IDs d'arrêts du payload
        arrets_ids = validated_data.pop('arrets_ids')
        
        # 2. Vérifie la cohérence du tracé
        primus_id_fk = validated_data.get('primus')
        terminus_id_fk = validated_data.get('terminus')

        # Si le front envoie des IDs (ce qui est le cas ici), on vérifie les valeurs brutes
        if primus_id_fk.id != arrets_ids[0] or terminus_id_fk.id != arrets_ids[-1]:
             raise serializers.ValidationError({
                'arrets_ids': "Les arrêts de départ/arrivée fournis doivent correspondre aux extrémités du tracé."
             })
        
        # 3. Crée l'objet Bus principal (retire arrets_ids car ce n'est pas un champ de modèle)
        # Note: primus et terminus sont gérés par Django car ce sont des FK
        bus = Bus.objects.create(**validated_data)
        
        # 4. Crée un Trajet et les liaisons TrajetArret
        if arrets_ids:
            try:
                # Récupère tous les objets Arrêt en une seule requête pour optimisation
                arret_objects = Arret.objects.in_bulk(arrets_ids) 
                
                trajet = Trajet.objects.create(
                    busRef=bus,
                    typeTrajet='Principal',
                    description=f"Trajet principal pour le Bus {bus.numeroBus}"
                )
                
                # Crée les liaisons TrajetArret dans l'ordre
                for index, arret_id in enumerate(arrets_ids):
                    arret_obj = arret_objects.get(arret_id)
                    if not arret_obj:
                         raise serializers.ValidationError({"arrets_ids": f"Arrêt ID {arret_id} invalide."})
                    
                    TrajetArret.objects.create(
                        trajetRef=trajet,
                        arretRef=arret_obj,
                        ordrePassage=index + 1
                    )
            
            except Exception as e:
                # Nettoyer le bus créé si le trajet échoue
                bus.delete() 
                raise serializers.ValidationError({"trajet": f"Erreur lors de la création du trajet: {e}"})
            
        return bus

class BusMapSerializer(serializers.ModelSerializer):
    primus_nom = serializers.CharField(source='primus.nomArret', read_only=True)
    terminus_nom = serializers.CharField(source='terminus.nomArret', read_only=True)
    ville_nom = serializers.CharField(source='villeRef.nomVille', read_only=True)

    class Meta:
        model = Bus
        fields = [
            'id',
            'numeroBus',
            'ville_nom',
            'quartier',
            'primus_nom',
            'terminus_nom',
            'current_latitude',
            'current_longitude',
            'status',
            'frais',
        ]


class PositionBusSerializer(serializers.ModelSerializer):
    bus_numero = serializers.CharField(source='bus.numeroBus', read_only=True)

    class Meta:
        model = PositionBus
        fields = ['id', 'bus', 'bus_numero', 'latitude', 'longitude', 'timestamp']


class TrajetDetailSerializer(serializers.ModelSerializer):
    arrets = serializers.SerializerMethodField()

    class Meta:
        model = Trajet
        fields = ['id', 'busRef', 'typeTrajet', 'arrets']

    def get_arrets(self, obj):
        tas = TrajetArret.objects.filter(trajetRef=obj).select_related('arretRef').order_by('ordrePassage')
        return [
            {
                'id': ta.arretRef.id,
                'nom': ta.arretRef.nomArret,
                'latitude': ta.arretRef.latitude,
                'longitude': ta.arretRef.longitude,
            }
            for ta in tas
        ]
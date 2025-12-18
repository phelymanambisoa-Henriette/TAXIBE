# transport/views.py - VERSION COMPLÈTE FINALE

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import timedelta
from math import radians, sin, cos, sqrt, atan2
import traceback

from .models import Bus, Trajet, TrajetArret, PositionBus
from localisation.models import Arret, Quartier, Ville
from .serializers import (
    BusListSerializer, 
    BusDetailSerializer, 
    BusCreateSerializer,
    BusMapSerializer, 
    PositionBusSerializer, 
    TrajetDetailSerializer
)

# ========== VIEWSETS BUS ==========

class BusMapViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour la carte (lecture seule)"""
    queryset = Bus.objects.select_related('primus', 'terminus', 'villeRef').all()
    serializer_class = BusMapSerializer
    permission_classes = [AllowAny]


class PositionBusViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les positions GPS des bus"""
    queryset = PositionBus.objects.select_related('bus')
    serializer_class = PositionBusSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        recent = self.request.query_params.get('recent')
        bus_id = self.request.query_params.get('bus_id')

        if recent:
            try:
                seconds = int(recent)
            except ValueError:
                seconds = 30
            since = timezone.now() - timedelta(seconds=seconds)
            qs = qs.filter(timestamp__gte=since)

        if bus_id:
            qs = qs.filter(bus_id=bus_id)

        return qs


class TrajetMapViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les trajets sur la carte"""
    queryset = Trajet.objects.select_related('busRef')
    serializer_class = TrajetDetailSerializer
    permission_classes = [AllowAny]


class BusViewSet(viewsets.ModelViewSet):
    """ViewSet principal pour la gestion des bus"""
    queryset = Bus.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return BusCreateSerializer
        if self.action == 'retrieve':
            return BusDetailSerializer
        return BusListSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except ObjectDoesNotExist:
            return Response({'detail': 'Bus non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ ERREUR RETRIEVE: {type(e).__name__}: {str(e)}")
            traceback.print_exc()
            return Response({'detail': 'Erreur serveur', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except IntegrityError as e:
            return Response({'detail': f'Erreur d\'intégrité: {e}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"❌ ERREUR CRÉATION BUS: {e}")
            traceback.print_exc()
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _enregistrer_historique(self, request, depart_id, arrivee_id):
        """Enregistre la recherche dans l'historique si l'utilisateur est connecté"""
        if not request.user.is_authenticated:
            return None
        
        try:
            from interaction.models import HistoriqueRecherche
            
            since = timezone.now() - timedelta(minutes=30)
            existing = HistoriqueRecherche.objects.filter(
                userRef=request.user,
                depart_id=depart_id,
                arrivee_id=arrivee_id,
                date_recherche__gte=since
            ).first()
            
            if existing:
                existing.date_recherche = timezone.now()
                existing.save(update_fields=['date_recherche'])
                return existing
            else:
                historique = HistoriqueRecherche.objects.create(
                    userRef=request.user,
                    depart_id=depart_id,
                    arrivee_id=arrivee_id
                )
                return historique
                
        except Exception as e:
            print(f"⚠️ Erreur enregistrement historique: {e}")
            return None
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def recherche_itineraire(self, request):
        """Recherche un itinéraire entre deux arrêts"""
        try:
            depart_id = request.query_params.get('depart_id')
            arrivee_id = request.query_params.get('arrivee_id')
            
            if not depart_id or not arrivee_id:
                return Response(
                    {'error': 'depart_id et arrivee_id sont requis'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                arret_depart = Arret.objects.get(id=depart_id)
                arret_arrivee = Arret.objects.get(id=arrivee_id)
            except Arret.DoesNotExist:
                return Response(
                    {'error': 'Arrêt de départ ou d\'arrivée introuvable'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            self._enregistrer_historique(request, depart_id, arrivee_id)
            
            itineraires_directs = self._trouver_itineraires_directs(depart_id, arrivee_id)
            itineraires_correspondances = self._trouver_itineraires_correspondances(depart_id, arrivee_id)
            
            return Response({
                'depart': {
                    'id': arret_depart.id,
                    'nom': arret_depart.nomArret,
                    'latitude': arret_depart.latitude,
                    'longitude': arret_depart.longitude,
                },
                'arrivee': {
                    'id': arret_arrivee.id,
                    'nom': arret_arrivee.nomArret,
                    'latitude': arret_arrivee.latitude,
                    'longitude': arret_arrivee.longitude,
                },
                'itineraires_directs': itineraires_directs,
                'itineraires_correspondances': itineraires_correspondances,
                'total': len(itineraires_directs) + len(itineraires_correspondances),
            })
            
        except Exception as e:
            print(f"❌ Erreur recherche itinéraire: {e}")
            traceback.print_exc()
            return Response(
                {'error': 'Erreur lors de la recherche', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _trouver_itineraires_directs(self, depart_id, arrivee_id):
        """Trouve les bus directs entre deux arrêts"""
        itineraires = []
        
        for bus in Bus.objects.filter(status='Actif'):
            trajets = Trajet.objects.filter(busRef=bus)
            
            for trajet in trajets:
                arrets_trajet = TrajetArret.objects.filter(
                    trajetRef=trajet
                ).select_related('arretRef').order_by('ordrePassage')
                
                arrets_ids = [ta.arretRef.id for ta in arrets_trajet]
                
                if int(depart_id) in arrets_ids and int(arrivee_id) in arrets_ids:
                    idx_depart = arrets_ids.index(int(depart_id))
                    idx_arrivee = arrets_ids.index(int(arrivee_id))
                    
                    if idx_depart < idx_arrivee:
                        nb_arrets = idx_arrivee - idx_depart
                        arrets_list = list(arrets_trajet)
                        arrets_parcours = []
                        
                        for i in range(idx_depart, idx_arrivee + 1):
                            ta = arrets_list[i]
                            arrets_parcours.append({
                                'id': ta.arretRef.id,
                                'nom': ta.arretRef.nomArret,
                                'ordre': ta.ordrePassage,
                                'latitude': ta.arretRef.latitude,
                                'longitude': ta.arretRef.longitude,
                            })
                        
                        itineraires.append({
                            'type': 'direct',
                            'bus': {
                                'id': bus.id,
                                'numero': bus.numeroBus,
                                'frais': float(bus.frais) if bus.frais else 600,
                            },
                            'trajet': {
                                'type': trajet.typeTrajet,
                                'description': trajet.description,
                            },
                            'nb_arrets': nb_arrets,
                            'arrets': arrets_parcours,
                        })
        
        return itineraires
    
    def _trouver_itineraires_correspondances(self, depart_id, arrivee_id):
        """Trouve les itinéraires avec correspondance"""
        itineraires = []
        tous_arrets = Arret.objects.all()[:50]
        
        for arret_correspondance in tous_arrets:
            if arret_correspondance.id == int(depart_id) or arret_correspondance.id == int(arrivee_id):
                continue
            
            trajets1 = self._trouver_itineraires_directs(depart_id, arret_correspondance.id)
            if not trajets1:
                continue
                
            trajets2 = self._trouver_itineraires_directs(arret_correspondance.id, arrivee_id)
            
            if trajets1 and trajets2:
                for t1 in trajets1[:2]:
                    for t2 in trajets2[:2]:
                        if t1['bus']['id'] != t2['bus']['id']:
                            itineraires.append({
                                'type': 'correspondance',
                                'nb_correspondances': 1,
                                'trajet1': t1,
                                'trajet2': t2,
                                'arret_correspondance': {
                                    'id': arret_correspondance.id,
                                    'nom': arret_correspondance.nomArret,
                                    'latitude': arret_correspondance.latitude,
                                    'longitude': arret_correspondance.longitude,
                                },
                                'frais_total': (t1['bus']['frais'] or 600) + (t2['bus']['frais'] or 600),
                                'nb_arrets_total': t1['nb_arrets'] + t2['nb_arrets'],
                            })
                            
                            if len(itineraires) >= 5:
                                return itineraires
        
        return itineraires[:5]


# ========== VUES ARRÊTS ==========

@api_view(['GET'])
def arret_list(request):
    """Liste de tous les arrêts"""
    arrets = Arret.objects.select_related('quartier', 'villeRef').all()
    
    quartier_id = request.query_params.get('quartier', None)
    if quartier_id:
        arrets = arrets.filter(quartier_id=quartier_id)
    
    ville_id = request.query_params.get('ville', None)
    if ville_id:
        arrets = arrets.filter(villeRef_id=ville_id)
    
    data = []
    for arret in arrets:
        data.append({
            'id': arret.id,
            'nom': arret.nomArret,
            'latitude': arret.latitude,
            'longitude': arret.longitude,
            'quartier': arret.quartier.nomQuartier if arret.quartier else None,
            'ville': arret.villeRef.nomVille if arret.villeRef else None,
        })
    
    return Response(data)


@api_view(['GET'])
def arret_detail(request, pk):
    """Détail d'un arrêt"""
    arret = get_object_or_404(Arret, pk=pk)
    
    data = {
        'id': arret.id,
        'nom': arret.nomArret,
        'latitude': arret.latitude,
        'longitude': arret.longitude,
        'quartier': {
            'id': arret.quartier.id,
            'nom': arret.quartier.nomQuartier,
        } if arret.quartier else None,
        'ville': {
            'id': arret.villeRef.id,
            'nom': arret.villeRef.nomVille,
        } if arret.villeRef else None,
    }
    
    return Response(data)


@api_view(['GET'])
def nearby_arrets(request):
    """Arrêts proches d'une position GPS"""
    try:
        lat = float(request.GET.get('lat'))
        lng = float(request.GET.get('lng'))
        radius = float(request.GET.get('radius', 500))
    except (TypeError, ValueError):
        return Response(
            {'error': 'Paramètres lat, lng invalides'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    arrets = Arret.objects.select_related('quartier', 'villeRef').all()
    nearby = []
    
    for arret in arrets:
        distance = calculate_distance(lat, lng, arret.latitude, arret.longitude)
        if distance <= radius:
            nearby.append({
                'id': arret.id,
                'nom': arret.nomArret,
                'latitude': arret.latitude,
                'longitude': arret.longitude,
                'quartier': arret.quartier.nomQuartier if arret.quartier else None,
                'ville': arret.villeRef.nomVille if arret.villeRef else None,
                'distance': round(distance, 2)
            })
    
    nearby.sort(key=lambda x: x['distance'])
    return Response(nearby)


@api_view(['GET'])
def nearest_arret(request):
    """Arrêt le plus proche d'une position GPS"""
    try:
        lat = float(request.GET.get('lat'))
        lng = float(request.GET.get('lng'))
    except (TypeError, ValueError):
        return Response(
            {'error': 'Paramètres lat, lng invalides'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    arrets = Arret.objects.select_related('quartier', 'villeRef').all()
    nearest = None
    min_distance = float('inf')
    
    for arret in arrets:
        distance = calculate_distance(lat, lng, arret.latitude, arret.longitude)
        if distance < min_distance:
            min_distance = distance
            nearest = arret
    
    if nearest:
        return Response({
            'id': nearest.id,
            'nom': nearest.nomArret,
            'latitude': nearest.latitude,
            'longitude': nearest.longitude,
            'quartier': nearest.quartier.nomQuartier if nearest.quartier else None,
            'ville': nearest.villeRef.nomVille if nearest.villeRef else None,
            'distance': round(min_distance, 2)
        })
    
    return Response({'error': 'Aucun arrêt trouvé'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def search_arrets(request):
    """Recherche d'arrêts par nom, quartier ou ville"""
    query = request.GET.get('q', '')
    
    if len(query) < 2:
        return Response([])
    
    arrets = Arret.objects.filter(
        Q(nomArret__icontains=query) | 
        Q(quartier__nomQuartier__icontains=query) |
        Q(villeRef__nomVille__icontains=query)
    ).select_related('quartier', 'villeRef')[:20]
    
    data = []
    for arret in arrets:
        data.append({
            'id': arret.id,
            'nom': arret.nomArret,
            'latitude': arret.latitude,
            'longitude': arret.longitude,
            'quartier': arret.quartier.nomQuartier if arret.quartier else None,
            'ville': arret.villeRef.nomVille if arret.villeRef else None,
        })
    
    return Response(data)


# ========== VUES LIGNES ==========

@api_view(['GET'])
def ligne_list(request):
    """Liste de toutes les lignes (bus actifs)"""
    bus_list = Bus.objects.filter(status='Actif').select_related('primus', 'terminus')
    
    data = []
    for bus in bus_list:
        data.append({
            'id': bus.id,
            'numero': bus.numeroBus,
            'nom': f"Ligne {bus.numeroBus}",
            'terminus_depart': bus.primus.nomArret if bus.primus else '',
            'terminus_arrivee': bus.terminus.nomArret if bus.terminus else '',
            'couleur': generate_color_from_numero(bus.numeroBus),
            'tarif': float(bus.frais) if bus.frais else 600,
            'frequence': '5-10',
            'actif': True,
        })
    
    return Response(data)


@api_view(['GET'])
def lignes_by_arret(request, arret_id):
    """Lignes de bus passant par un arrêt"""
    arret = get_object_or_404(Arret, pk=arret_id)
    
    trajets_arrets = TrajetArret.objects.filter(
        arretRef=arret
    ).select_related('trajetRef__busRef__primus', 'trajetRef__busRef__terminus')
    
    lignes = []
    seen_bus = set()
    
    for ta in trajets_arrets:
        bus = ta.trajetRef.busRef
        if bus.id not in seen_bus and bus.status == 'Actif':
            seen_bus.add(bus.id)
            lignes.append({
                'id': bus.id,
                'numero': bus.numeroBus,
                'nom': f"Ligne {bus.numeroBus}",
                'terminus_depart': bus.primus.nomArret if bus.primus else '',
                'terminus_arrivee': bus.terminus.nomArret if bus.terminus else '',
                'couleur': generate_color_from_numero(bus.numeroBus),
                'tarif': float(bus.frais) if bus.frais else 600,
                'frequence': '5-10',
            })
    
    return Response(lignes)


@api_view(['GET'])
def arrets_by_ligne(request, ligne_id):
    """Arrêts d'une ligne de bus (dans l'ordre)"""
    bus = get_object_or_404(Bus, pk=ligne_id)
    
    trajet = Trajet.objects.filter(busRef=bus, typeTrajet='Principal').first()
    if not trajet:
        trajet = Trajet.objects.filter(busRef=bus).first()
    
    if not trajet:
        return Response([])
    
    trajets_arrets = TrajetArret.objects.filter(
        trajetRef=trajet
    ).select_related('arretRef__quartier', 'arretRef__villeRef').order_by('ordrePassage')
    
    data = []
    for ta in trajets_arrets:
        data.append({
            'id': ta.arretRef.id,
            'nom': ta.arretRef.nomArret,
            'latitude': ta.arretRef.latitude,
            'longitude': ta.arretRef.longitude,
            'quartier': ta.arretRef.quartier.nomQuartier if ta.arretRef.quartier else None,
            'ordre': ta.ordrePassage,
        })
    
    return Response(data)


# ========== ITINÉRAIRES ==========

@api_view(['GET'])
def find_itineraire(request):
    """Trouve un itinéraire entre deux arrêts"""
    try:
        from_arret_id = int(request.GET.get('from'))
        to_arret_id = int(request.GET.get('to'))
    except (TypeError, ValueError):
        return Response(
            {'error': 'Paramètres from, to invalides'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    from_arret = get_object_or_404(Arret, pk=from_arret_id)
    to_arret = get_object_or_404(Arret, pk=to_arret_id)
    
    bus_viewset = BusViewSet()
    directs = bus_viewset._trouver_itineraires_directs(from_arret_id, to_arret_id)
    correspondances = bus_viewset._trouver_itineraires_correspondances(from_arret_id, to_arret_id)
    
    return Response({
        'found': len(directs) > 0 or len(correspondances) > 0,
        'depart': {
            'id': from_arret.id,
            'nom': from_arret.nomArret,
            'latitude': from_arret.latitude,
            'longitude': from_arret.longitude,
        },
        'arrivee': {
            'id': to_arret.id,
            'nom': to_arret.nomArret,
            'latitude': to_arret.latitude,
            'longitude': to_arret.longitude,
        },
        'options': [
            *[{**d, 'id': i+1} for i, d in enumerate(directs)],
            *[{**c, 'id': i+1+len(directs)} for i, c in enumerate(correspondances)]
        ]
    })


@api_view(['GET'])
def find_itineraire_from_position(request):
    """Itinéraire depuis une position GPS vers un arrêt"""
    try:
        lat = float(request.GET.get('lat'))
        lng = float(request.GET.get('lng'))
        to_arret_id = int(request.GET.get('to'))
    except (TypeError, ValueError):
        return Response(
            {'error': 'Paramètres invalides'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    arrets = Arret.objects.select_related('quartier', 'villeRef').all()
    nearest = None
    min_distance = float('inf')
    
    for arret in arrets:
        distance = calculate_distance(lat, lng, arret.latitude, arret.longitude)
        if distance < min_distance:
            min_distance = distance
            nearest = arret
    
    if not nearest:
        return Response({'error': 'Aucun arrêt proche trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    bus_viewset = BusViewSet()
    directs = bus_viewset._trouver_itineraires_directs(nearest.id, to_arret_id)
    correspondances = bus_viewset._trouver_itineraires_correspondances(nearest.id, to_arret_id)
    
    to_arret = get_object_or_404(Arret, pk=to_arret_id)
    
    return Response({
        'found': len(directs) > 0 or len(correspondances) > 0,
        'depart': {'nom': 'Votre position', 'isCurrentLocation': True},
        'arrivee': {
            'id': to_arret.id,
            'nom': to_arret.nomArret,
            'latitude': to_arret.latitude,
            'longitude': to_arret.longitude,
        },
        'marche_depart': {
            'distance': round(min_distance, 2),
            'duree': round(min_distance / 83.33, 0),
            'arret_depart': {
                'id': nearest.id,
                'nom': nearest.nomArret,
                'latitude': nearest.latitude,
                'longitude': nearest.longitude,
                'quartier': nearest.quartier.nomQuartier if nearest.quartier else None,
            }
        },
        'options': [
            *[{**d, 'id': i+1} for i, d in enumerate(directs)],
            *[{**c, 'id': i+1+len(directs)} for i, c in enumerate(correspondances)]
        ]
    })


# ========== VILLES & QUARTIERS ==========

@api_view(['GET'])
def ville_list(request):
    """Liste des villes"""
    villes = Ville.objects.all()
    return Response([{
        'id': v.id,
        'nom': v.nomVille,
        'code_postal': v.codePostal,
        'pays': v.pays,
    } for v in villes])


@api_view(['GET'])
def quartiers_by_ville(request, ville_id):
    """Quartiers d'une ville"""
    ville = get_object_or_404(Ville, pk=ville_id)
    quartiers = Quartier.objects.filter(villeRef=ville)
    return Response([{
        'id': q.id,
        'nom': q.nomQuartier,
        'ville': ville.nomVille,
    } for q in quartiers])


# ========== UTILITAIRES ==========

def calculate_distance(lat1, lon1, lat2, lon2):
    """Formule de Haversine - Distance en mètres"""
    R = 6371000
    lat1_rad, lat2_rad = radians(lat1), radians(lat2)
    delta_lat, delta_lon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


def generate_color_from_numero(numero):
    """Génère une couleur à partir du numéro de bus"""
    colors = ['#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6',
              '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b']
    hash_val = sum(ord(c) for c in str(numero))
    return colors[hash_val % len(colors)]

    # ========== NOUVELLES API TRAJETS ==========

@api_view(['GET'])
def get_bus_trajet(request, bus_id):
    """
    Récupère les trajets d'un bus avec tous ses arrêts ordonnés
    
    Exemple: GET /api/transport/bus/2/trajets/
    
    Retourne:
    - Infos du bus
    - Trajet Aller avec tous les arrêts ordonnés
    - Trajet Retour avec tous les arrêts ordonnés
    """
    try:
        bus = Bus.objects.select_related('primus', 'terminus', 'villeRef').get(id=bus_id)
    except Bus.DoesNotExist:
        return Response({'error': 'Bus non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    trajets_data = []
    
    for trajet in bus.trajets.all():
        arrets = []
        
        for ta in trajet.arrets.select_related('arretRef__quartier').all():
            arrets.append({
                'ordre': ta.ordrePassage,
                'id': ta.arretRef.id,
                'nom': ta.arretRef.nomArret,
                'latitude': ta.arretRef.latitude,
                'longitude': ta.arretRef.longitude,
                'quartier': ta.arretRef.quartier.nomQuartier if ta.arretRef.quartier else None,
            })
        
        trajets_data.append({
            'id': trajet.id,
            'type': trajet.typeTrajet,
            'description': trajet.description,
            'nb_arrets': len(arrets),
            'premier_arret': arrets[0]['nom'] if arrets else None,
            'dernier_arret': arrets[-1]['nom'] if arrets else None,
            'arrets': arrets,
        })
    
    return Response({
        'bus': {
            'id': bus.id,
            'numero': bus.numeroBus,
            'quartier': bus.quartier,
            'frais': float(bus.frais) if bus.frais else 600,
            'status': bus.status,
            'couleur': generate_color_from_numero(bus.numeroBus),
            'primus': {
                'id': bus.primus.id,
                'nom': bus.primus.nomArret,
            } if bus.primus else None,
            'terminus': {
                'id': bus.terminus.id,
                'nom': bus.terminus.nomArret,
            } if bus.terminus else None,
        },
        'trajets': trajets_data,
    })


@api_view(['GET'])
def get_all_bus_trajets(request):
    """
    Récupère tous les bus avec un résumé de leurs trajets
    
    Exemple: GET /api/transport/bus-trajets/
    """
    result = []
    
    for bus in Bus.objects.select_related('primus', 'terminus').filter(status='Actif'):
        trajets_info = []
        
        for trajet in bus.trajets.all():
            arrets = trajet.arrets.select_related('arretRef').all()
            
            if arrets.exists():
                premier = arrets.first()
                dernier = arrets.last()
                
                trajets_info.append({
                    'id': trajet.id,
                    'type': trajet.typeTrajet,
                    'depart': premier.arretRef.nomArret if premier else None,
                    'arrivee': dernier.arretRef.nomArret if dernier else None,
                    'nb_arrets': arrets.count(),
                })
        
        result.append({
            'id': bus.id,
            'numero': bus.numeroBus,
            'frais': float(bus.frais) if bus.frais else 600,
            'couleur': generate_color_from_numero(bus.numeroBus),
            'primus': bus.primus.nomArret if bus.primus else None,
            'terminus': bus.terminus.nomArret if bus.terminus else None,
            'trajets': trajets_info,
        })
    
    return Response(result)


@api_view(['GET'])
def get_trajet_detail(request, trajet_id):
    """
    Récupère le détail d'un trajet spécifique
    
    Exemple: GET /api/transport/trajets/5/
    """
    try:
        trajet = Trajet.objects.select_related('busRef').get(id=trajet_id)
    except Trajet.DoesNotExist:
        return Response({'error': 'Trajet non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    arrets = []
    coordonnees = []  # Pour tracer la ligne sur la carte
    
    for ta in trajet.arrets.select_related('arretRef__quartier').all():
        arrets.append({
            'ordre': ta.ordrePassage,
            'id': ta.arretRef.id,
            'nom': ta.arretRef.nomArret,
            'latitude': ta.arretRef.latitude,
            'longitude': ta.arretRef.longitude,
            'quartier': ta.arretRef.quartier.nomQuartier if ta.arretRef.quartier else None,
        })
        coordonnees.append([ta.arretRef.latitude, ta.arretRef.longitude])
    
    return Response({
        'id': trajet.id,
        'type': trajet.typeTrajet,
        'description': trajet.description,
        'bus': {
            'id': trajet.busRef.id,
            'numero': trajet.busRef.numeroBus,
            'frais': float(trajet.busRef.frais) if trajet.busRef.frais else 600,
            'couleur': generate_color_from_numero(trajet.busRef.numeroBus),
        },
        'nb_arrets': len(arrets),
        'arrets': arrets,
        'coordonnees': coordonnees,  # Pour Leaflet polyline
    })


@api_view(['GET'])
def get_trajet_geojson(request, trajet_id):
    """
    Récupère un trajet au format GeoJSON pour affichage carte
    
    Exemple: GET /api/transport/trajets/5/geojson/
    """
    try:
        trajet = Trajet.objects.select_related('busRef').get(id=trajet_id)
    except Trajet.DoesNotExist:
        return Response({'error': 'Trajet non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    features = []
    coordinates = []
    
    # Créer les points pour chaque arrêt
    for ta in trajet.arrets.select_related('arretRef').all():
        # Point pour l'arrêt
        features.append({
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [ta.arretRef.longitude, ta.arretRef.latitude]
            },
            'properties': {
                'type': 'arret',
                'id': ta.arretRef.id,
                'nom': ta.arretRef.nomArret,
                'ordre': ta.ordrePassage,
            }
        })
        
        # Ajouter aux coordonnées de la ligne
        coordinates.append([ta.arretRef.longitude, ta.arretRef.latitude])
    
    # Créer la ligne du trajet
    if coordinates:
        features.append({
            'type': 'Feature',
            'geometry': {
                'type': 'LineString',
                'coordinates': coordinates
            },
            'properties': {
                'type': 'trajet',
                'id': trajet.id,
                'bus_numero': trajet.busRef.numeroBus,
                'direction': trajet.typeTrajet,
                'couleur': generate_color_from_numero(trajet.busRef.numeroBus),
            }
        })
    
    geojson = {
        'type': 'FeatureCollection',
        'features': features
    }
    
    return Response(geojson)


@api_view(['GET'])
def get_bus_geojson(request, bus_id):
    """
    Récupère les trajets d'un bus au format GeoJSON
    
    Exemple: GET /api/transport/bus/2/geojson/
    """
    try:
        bus = Bus.objects.get(id=bus_id)
    except Bus.DoesNotExist:
        return Response({'error': 'Bus non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    features = []
    couleur = generate_color_from_numero(bus.numeroBus)
    
    for trajet in bus.trajets.all():
        coordinates = []
        
        for ta in trajet.arrets.select_related('arretRef').all():
            # Point pour l'arrêt
            features.append({
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [ta.arretRef.longitude, ta.arretRef.latitude]
                },
                'properties': {
                    'type': 'arret',
                    'id': ta.arretRef.id,
                    'nom': ta.arretRef.nomArret,
                    'ordre': ta.ordrePassage,
                    'direction': trajet.typeTrajet,
                }
            })
            
            coordinates.append([ta.arretRef.longitude, ta.arretRef.latitude])
        
        # Ligne du trajet
        if coordinates:
            features.append({
                'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    'coordinates': coordinates
                },
                'properties': {
                    'type': 'trajet',
                    'id': trajet.id,
                    'bus_numero': bus.numeroBus,
                    'direction': trajet.typeTrajet,
                    'couleur': couleur if trajet.typeTrajet == 'Aller' else adjust_color(couleur),
                }
            })
    
    return Response({
        'type': 'FeatureCollection',
        'features': features
    })


@api_view(['GET'])
def get_all_trajets_geojson(request):
    """
    Récupère tous les trajets au format GeoJSON
    
    Exemple: GET /api/transport/trajets/geojson/
    
    Paramètres optionnels:
    - direction: 'Aller' ou 'Retour'
    - bus_id: ID d'un bus spécifique
    """
    direction = request.GET.get('direction', None)
    bus_id = request.GET.get('bus_id', None)
    
    trajets = Trajet.objects.select_related('busRef').all()
    
    if direction:
        trajets = trajets.filter(typeTrajet=direction)
    
    if bus_id:
        trajets = trajets.filter(busRef_id=bus_id)
    
    features = []
    
    for trajet in trajets:
        coordinates = []
        couleur = generate_color_from_numero(trajet.busRef.numeroBus)
        
        for ta in trajet.arrets.select_related('arretRef').all():
            coordinates.append([ta.arretRef.longitude, ta.arretRef.latitude])
        
        if coordinates:
            features.append({
                'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    'coordinates': coordinates
                },
                'properties': {
                    'type': 'trajet',
                    'id': trajet.id,
                    'bus_id': trajet.busRef.id,
                    'bus_numero': trajet.busRef.numeroBus,
                    'direction': trajet.typeTrajet,
                    'couleur': couleur,
                    'nb_arrets': len(coordinates),
                }
            })
    
    return Response({
        'type': 'FeatureCollection',
        'features': features
    })


def adjust_color(hex_color):
    """Ajuste une couleur pour le trajet retour (plus foncé)"""
    # Enlever le #
    hex_color = hex_color.lstrip('#')
    
    # Convertir en RGB
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)
    
    # Assombrir de 20%
    factor = 0.8
    r = int(r * factor)
    g = int(g * factor)
    b = int(b * factor)
    
    return f'#{r:02x}{g:02x}{b:02x}'
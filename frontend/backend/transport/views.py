# backend/transport/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta
from .models import Bus, Trajet, TrajetArret
from localisation.models import Arret
from .serializers import BusListSerializer, BusDetailSerializer, BusCreateSerializer
import traceback


class BusViewSet(viewsets.ModelViewSet):
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

    def _get_arret_nom(self, arret):
        """Helper pour récupérer le nom de l'arrêt"""
        if hasattr(arret, 'nomArret') and arret.nomArret:
            return arret.nomArret
        if hasattr(arret, 'nom') and arret.nom:
            return arret.nom
        return f'Arrêt #{arret.id}'
    
    def _enregistrer_historique(self, request, depart_id, arrivee_id):
        """Enregistre la recherche dans l'historique si l'utilisateur est connecté"""
        if not request.user.is_authenticated:
            return None
        
        try:
            # Import du modèle Historique
            from interaction.models import HistoriqueRecherche
            
            # Éviter les doublons (même recherche dans les 30 dernières minutes)
            since = timezone.now() - timedelta(minutes=30)
            existing = HistoriqueRecherche.objects.filter(
                userRef=request.user,
                depart_id=depart_id,
                arrivee_id=arrivee_id,
                date_recherche__gte=since
            ).first()
            
            if existing:
                # Mettre à jour la date
                existing.date_recherche = timezone.now()
                existing.save(update_fields=['date_recherche'])
                return existing
            else:
                # Créer une nouvelle entrée
                historique = HistoriqueRecherche.objects.create(
                    userRef=request.user,
                    depart_id=depart_id,
                    arrivee_id=arrivee_id
                )
                return historique
                
        except Exception as e:
            # Ne pas bloquer la recherche si l'historique échoue
            print(f"⚠️ Erreur enregistrement historique: {e}")
            return None
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def recherche_itineraire(self, request):
        """
        Recherche un itinéraire entre deux arrêts
        Paramètres: ?depart_id=1&arrivee_id=5
        
        ✅ Enregistre automatiquement dans l'historique si l'utilisateur est connecté
        """
        try:
            depart_id = request.query_params.get('depart_id')
            arrivee_id = request.query_params.get('arrivee_id')
            
            if not depart_id or not arrivee_id:
                return Response(
                    {'error': 'depart_id et arrivee_id sont requis'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Vérifie que les arrêts existent
            try:
                arret_depart = Arret.objects.get(id=depart_id)
                arret_arrivee = Arret.objects.get(id=arrivee_id)
            except Arret.DoesNotExist:
                return Response(
                    {'error': 'Arrêt de départ ou d\'arrivée introuvable'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # ✅ ENREGISTRER DANS L'HISTORIQUE
            self._enregistrer_historique(request, depart_id, arrivee_id)
            
            # Recherche les itinéraires directs
            itineraires_directs = self._trouver_itineraires_directs(depart_id, arrivee_id)
            
            # Recherche les itinéraires avec correspondance
            itineraires_correspondances = self._trouver_itineraires_correspondances(depart_id, arrivee_id)
            
            return Response({
                'depart': {
                    'id': arret_depart.id,
                    'nom': self._get_arret_nom(arret_depart),
                    'latitude': arret_depart.latitude,
                    'longitude': arret_depart.longitude,
                },
                'arrivee': {
                    'id': arret_arrivee.id,
                    'nom': self._get_arret_nom(arret_arrivee),
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
                        
                        arrets_parcours = []
                        arrets_list = list(arrets_trajet)
                        
                        for i in range(idx_depart, idx_arrivee + 1):
                            ta = arrets_list[i]
                            arrets_parcours.append({
                                'id': ta.arretRef.id,
                                'nom': self._get_arret_nom(ta.arretRef),
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
        
        # Limiter le nombre d'arrêts à tester pour performance
        tous_arrets = Arret.objects.all()[:50]
        
        for arret_correspondance in tous_arrets:
            if arret_correspondance.id == int(depart_id) or arret_correspondance.id == int(arrivee_id):
                continue
            
            trajets1 = self._trouver_itineraires_directs(depart_id, arret_correspondance.id)
            
            if not trajets1:
                continue
                
            trajets2 = self._trouver_itineraires_directs(arret_correspondance.id, arrivee_id)
            
            if trajets1 and trajets2:
                for t1 in trajets1[:2]:  # Limiter pour performance
                    for t2 in trajets2[:2]:
                        if t1['bus']['id'] != t2['bus']['id']:
                            itineraires.append({
                                'type': 'correspondance',
                                'nb_correspondances': 1,
                                'trajet1': t1,
                                'trajet2': t2,
                                'arret_correspondance': {
                                    'id': arret_correspondance.id,
                                    'nom': self._get_arret_nom(arret_correspondance),
                                    'latitude': arret_correspondance.latitude,
                                    'longitude': arret_correspondance.longitude,
                                },
                                'frais_total': (t1['bus']['frais'] or 600) + (t2['bus']['frais'] or 600),
                                'nb_arrets_total': t1['nb_arrets'] + t2['nb_arrets'],
                            })
                            
                            # Limiter à 5 correspondances max
                            if len(itineraires) >= 5:
                                return itineraires
        
        return itineraires[:5]
# transport/management/commands/sync_osm.py
"""
Script pour récupérer les lignes de bus depuis OSM
et associer les arrêts à chaque ligne
"""

import requests
import math
from django.core.management.base import BaseCommand
from django.db import transaction
from transport.models import Bus, Trajet, TrajetArret
from localisation.models import Arret


class Command(BaseCommand):
    help = 'Synchronise les trajets et arrêts depuis OpenStreetMap'

    # URL de l'API Overpass
    OVERPASS_URL = "https://overpass-api.de/api/interpreter"
    
    # Zone de Fianarantsoa (sud, ouest, nord, est)
    BBOX = "(-21.50, 47.05, -21.35, 47.15)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Affiche ce qui serait fait sans modifier la base',
        )

    def handle(self, *args, **options):
        self.dry_run = options['dry_run']
        
        if self.dry_run:
            self.stdout.write(self.style.WARNING('🔍 MODE DRY-RUN : Aucune modification ne sera faite\n'))
        
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('   TAXIBE - Synchronisation OSM → Base de données'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        
        # Étape 1 : Récupérer les données OSM
        self.stdout.write('\n📡 Étape 1 : Récupération des données depuis OSM...')
        osm_data = self.fetch_osm_data()
        
        if not osm_data:
            self.stdout.write(self.style.ERROR('❌ Impossible de récupérer les données OSM'))
            return
        
        # Étape 2 : Parser les données
        self.stdout.write('\n🔍 Étape 2 : Analyse des données...')
        lignes_osm = self.parse_osm_data(osm_data)
        
        self.stdout.write(f'   Trouvé {len(lignes_osm)} lignes de bus dans OSM')
        
        # Étape 3 : Charger les arrêts de la base
        self.stdout.write('\n📍 Étape 3 : Chargement de tes arrêts...')
        mes_arrets = list(Arret.objects.filter(latitude__lt=-20))
        self.stdout.write(f'   {len(mes_arrets)} arrêts réels dans ta base')
        
        # Étape 4 : Matcher et créer les trajets
        self.stdout.write('\n🔗 Étape 4 : Association des lignes et arrêts...\n')
        self.match_and_create(lignes_osm, mes_arrets)
        
        self.stdout.write(self.style.SUCCESS('\n✅ Terminé !'))

    def fetch_osm_data(self):
        """Récupère les données depuis Overpass API"""
        
        query = """
        [out:json][timeout:120];
        
        // Lignes de bus dans la zone de Fianarantsoa
        (
          relation["route"="bus"](-21.50, 47.05, -21.35, 47.15);
          relation["route"="share_taxi"](-21.50, 47.05, -21.35, 47.15);
          relation["route"="minibus"](-21.50, 47.05, -21.35, 47.15);
        )->.routes;
        
        // Récupérer les détails
        .routes out body;
        .routes >;
        .routes >>;
        
        // Tous les noeuds avec géométrie
        node(-21.50, 47.05, -21.35, 47.15);
        
        out body;
        """
        
        try:
            self.stdout.write('   Envoi de la requête (peut prendre 30 secondes)...')
            response = requests.post(
                self.OVERPASS_URL, 
                data={"data": query},
                timeout=120
            )
            response.raise_for_status()
            data = response.json()
            self.stdout.write(self.style.SUCCESS(f'   ✅ Reçu {len(data.get("elements", []))} éléments'))
            return data
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   ❌ Erreur: {e}'))
            return None

    def parse_osm_data(self, data):
        """Organise les données OSM en lignes avec arrêts ordonnés"""
        
        elements = data.get('elements', [])
        
        # Indexer tous les noeuds
        nodes = {}
        for el in elements:
            if el['type'] == 'node':
                nodes[el['id']] = {
                    'id': el['id'],
                    'lat': el.get('lat'),
                    'lon': el.get('lon'),
                    'name': el.get('tags', {}).get('name', ''),
                    'tags': el.get('tags', {})
                }
        
        # Trouver les relations (lignes de bus)
        lignes = []
        for el in elements:
            if el['type'] == 'relation':
                tags = el.get('tags', {})
                
                # Extraire le numéro de ligne
                ref = tags.get('ref', '')
                name = tags.get('name', '')
                
                # Extraire les arrêts dans l'ordre
                stops_aller = []
                stops_retour = []
                
                for member in el.get('members', []):
                    if member['type'] == 'node':
                        role = member.get('role', '')
                        node_id = member['ref']
                        
                        if node_id in nodes and nodes[node_id]['lat']:
                            node = nodes[node_id]
                            
                            # Déterminer si c'est aller ou retour
                            if 'forward' in role or role in ['stop', 'platform', '']:
                                stops_aller.append(node)
                            if 'backward' in role:
                                stops_retour.append(node)
                
                # Si pas de distinction, utiliser les mêmes arrêts inversés
                if not stops_retour and stops_aller:
                    stops_retour = list(reversed(stops_aller))
                
                ligne = {
                    'osm_id': el['id'],
                    'ref': ref,
                    'name': name,
                    'stops_aller': stops_aller,
                    'stops_retour': stops_retour
                }
                
                lignes.append(ligne)
                
                self.stdout.write(
                    f'   📍 Ligne "{ref}" ({name}): '
                    f'{len(stops_aller)} arrêts aller, {len(stops_retour)} arrêts retour'
                )
        
        return lignes

    def distance_km(self, lat1, lon1, lat2, lon2):
        """Calcule la distance entre deux points en km"""
        R = 6371  # Rayon de la Terre en km
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c

    def find_nearest_arret(self, osm_stop, mes_arrets, max_distance_m=100):
        """
        Trouve l'arrêt le plus proche dans ta base de données
        max_distance_m : distance maximum en mètres pour considérer une correspondance
        """
        
        if not osm_stop.get('lat') or not osm_stop.get('lon'):
            return None
        
        best_match = None
        best_distance = float('inf')
        
        for arret in mes_arrets:
            dist = self.distance_km(
                osm_stop['lat'], osm_stop['lon'],
                float(arret.latitude), float(arret.longitude)
            ) * 1000  # Convertir en mètres
            
            if dist < best_distance and dist < max_distance_m:
                best_distance = dist
                best_match = arret
        
        return best_match

    def extract_bus_number(self, bus):
        """Extrait le numéro du bus (ex: '21' depuis 'Bus 21')"""
        numero = bus.numeroBus.strip()
        # Enlever les préfixes communs
        for prefix in ['Bus ', 'Ligne ', 'L']:
            if numero.startswith(prefix):
                numero = numero[len(prefix):]
        return numero

    def match_and_create(self, lignes_osm, mes_arrets):
        """Associe les lignes OSM avec tes Bus et crée les TrajetArret"""
        
        # Charger tous les bus
        tous_bus = Bus.objects.all()
        
        for bus in tous_bus:
            numero = self.extract_bus_number(bus)
            
            self.stdout.write(f'\n🚌 Bus {bus.numeroBus}:')
            
            # Chercher une correspondance dans OSM
            ligne_osm = None
            for ligne in lignes_osm:
                if ligne['ref'] == numero or numero in ligne['name']:
                    ligne_osm = ligne
                    break
            
            if not ligne_osm:
                self.stdout.write(self.style.WARNING(f'   ⚠️  Pas trouvé dans OSM'))
                
                # Alternative : créer un trajet basique avec primus et terminus
                self.create_basic_trajet(bus, mes_arrets)
                continue
            
            self.stdout.write(f'   ✅ Trouvé dans OSM: {ligne_osm["name"]}')
            
            # Matcher les arrêts OSM avec tes arrêts
            arrets_aller = []
            for osm_stop in ligne_osm['stops_aller']:
                arret = self.find_nearest_arret(osm_stop, mes_arrets)
                if arret:
                    arrets_aller.append(arret)
            
            arrets_retour = []
            for osm_stop in ligne_osm['stops_retour']:
                arret = self.find_nearest_arret(osm_stop, mes_arrets)
                if arret:
                    arrets_retour.append(arret)
            
            self.stdout.write(f'   📍 Arrêts matchés: {len(arrets_aller)} aller, {len(arrets_retour)} retour')
            
            if not self.dry_run:
                self.create_trajets(bus, arrets_aller, arrets_retour)
            else:
                self.stdout.write('   [DRY-RUN] Trajets non créés')

    def create_basic_trajet(self, bus, mes_arrets):
        """Crée un trajet basique quand pas de données OSM"""
        
        self.stdout.write(f'   → Création trajet basique (primus → terminus)')
        
        if self.dry_run:
            self.stdout.write('   [DRY-RUN] Non créé')
            return
        
        with transaction.atomic():
            # Supprimer les anciens trajets
            Trajet.objects.filter(busRef=bus).delete()
            
            # Créer trajet Aller
            trajet_aller = Trajet.objects.create(
                busRef=bus,
                typeTrajet='Aller',
                description=f'{bus.primus} → {bus.terminus}'
            )
            
            # Ajouter primus et terminus
            TrajetArret.objects.create(
                trajetRef=trajet_aller,
                arretRef=bus.primus,
                ordrePassage=1,
                direction='Aller'
            )
            TrajetArret.objects.create(
                trajetRef=trajet_aller,
                arretRef=bus.terminus,
                ordrePassage=2,
                direction='Aller'
            )
            
            # Créer trajet Retour
            trajet_retour = Trajet.objects.create(
                busRef=bus,
                typeTrajet='Retour',
                description=f'{bus.terminus} → {bus.primus}'
            )
            
            TrajetArret.objects.create(
                trajetRef=trajet_retour,
                arretRef=bus.terminus,
                ordrePassage=1,
                direction='Retour'
            )
            TrajetArret.objects.create(
                trajetRef=trajet_retour,
                arretRef=bus.primus,
                ordrePassage=2,
                direction='Retour'
            )

    def create_trajets(self, bus, arrets_aller, arrets_retour):
        """Crée les trajets avec tous les arrêts ordonnés"""
        
        with transaction.atomic():
            # Supprimer les anciens trajets
            Trajet.objects.filter(busRef=bus).delete()
            
            # Créer trajet Aller
            if arrets_aller:
                trajet_aller = Trajet.objects.create(
                    busRef=bus,
                    typeTrajet='Aller',
                    description=f'{arrets_aller[0].nomArret} → {arrets_aller[-1].nomArret}'
                )
                
                for ordre, arret in enumerate(arrets_aller, start=1):
                    TrajetArret.objects.create(
                        trajetRef=trajet_aller,
                        arretRef=arret,
                        ordrePassage=ordre,
                        direction='Aller'
                    )
                
                self.stdout.write(self.style.SUCCESS(
                    f'   ✅ Trajet Aller créé: {len(arrets_aller)} arrêts'
                ))
            
            # Créer trajet Retour
            if arrets_retour:
                trajet_retour = Trajet.objects.create(
                    busRef=bus,
                    typeTrajet='Retour',
                    description=f'{arrets_retour[0].nomArret} → {arrets_retour[-1].nomArret}'
                )
                
                for ordre, arret in enumerate(arrets_retour, start=1):
                    TrajetArret.objects.create(
                        trajetRef=trajet_retour,
                        arretRef=arret,
                        ordrePassage=ordre,
                        direction='Retour'
                    )
                
                self.stdout.write(self.style.SUCCESS(
                    f'   ✅ Trajet Retour créé: {len(arrets_retour)} arrêts'
                ))
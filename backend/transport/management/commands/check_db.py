# transport/management/commands/check_db.py
"""
Commande pour vérifier la santé de la base de données TaxiBe
"""

from django.core.management.base import BaseCommand
from django.db.models import Count
from localisation.models import Arret, Ville, Quartier
from transport.models import Bus, Trajet, TrajetArret


class Command(BaseCommand):
    help = 'Vérifie la santé de la base de données TaxiBe'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('   VÉRIFICATION DE LA BASE DE DONNÉES TAXIBE'))
        self.stdout.write(self.style.SUCCESS('=' * 60))

        errors = []
        warnings = []

        # === STATISTIQUES GÉNÉRALES ===
        self.stdout.write('\n📊 STATISTIQUES GÉNÉRALES:')
        
        nb_villes = Ville.objects.count()
        nb_quartiers = Quartier.objects.count()
        nb_arrets = Arret.objects.count()
        nb_bus = Bus.objects.count()
        nb_trajets = Trajet.objects.count()
        nb_trajet_arrets = TrajetArret.objects.count()

        self.stdout.write(f'   Villes: {nb_villes}')
        self.stdout.write(f'   Quartiers: {nb_quartiers}')
        self.stdout.write(f'   Arrêts: {nb_arrets}')
        self.stdout.write(f'   Bus (lignes): {nb_bus}')
        self.stdout.write(f'   Trajets: {nb_trajets}')
        self.stdout.write(f'   TrajetArret: {nb_trajet_arrets}')

        # === VÉRIFICATION DES ARRÊTS ===
        self.stdout.write('\n🔍 VÉRIFICATION DES ARRÊTS:')

        # Arrêts avec coordonnées invalides
        arrets_invalides = Arret.objects.filter(latitude__gte=-20)
        if arrets_invalides.exists():
            errors.append(f'{arrets_invalides.count()} arrêts avec coordonnées invalides')
            self.stdout.write(self.style.ERROR(
                f'   ❌ {arrets_invalides.count()} arrêts avec coordonnées invalides'
            ))
        else:
            self.stdout.write(self.style.SUCCESS('   ✅ Toutes les coordonnées sont valides'))

        # Arrêts sans quartier
        arrets_sans_quartier = Arret.objects.filter(quartier__isnull=True)
        if arrets_sans_quartier.exists():
            warnings.append(f'{arrets_sans_quartier.count()} arrêts sans quartier')
            self.stdout.write(self.style.WARNING(
                f'   ⚠️  {arrets_sans_quartier.count()} arrêts sans quartier'
            ))

        # Arrêts dupliqués (même nom, même coordonnées)
        arrets_dupliques = Arret.objects.values('nomArret', 'latitude', 'longitude') \
            .annotate(count=Count('id')) \
            .filter(count__gt=1)
        if arrets_dupliques.exists():
            warnings.append(f'{len(arrets_dupliques)} groupes d\'arrêts potentiellement dupliqués')
            self.stdout.write(self.style.WARNING(
                f'   ⚠️  {len(arrets_dupliques)} groupes d\'arrêts potentiellement dupliqués'
            ))

        # === VÉRIFICATION DES BUS ===
        self.stdout.write('\n🚌 VÉRIFICATION DES BUS:')

        # Bus sans trajets
        bus_sans_trajets = Bus.objects.annotate(
            nb_trajets=Count('trajets')
        ).filter(nb_trajets=0)
        
        if bus_sans_trajets.exists():
            errors.append(f'{bus_sans_trajets.count()} bus sans trajets')
            self.stdout.write(self.style.ERROR(
                f'   ❌ {bus_sans_trajets.count()} bus sans trajets'
            ))
            for bus in bus_sans_trajets:
                self.stdout.write(f'      - Bus {bus.numeroBus}')
        else:
            self.stdout.write(self.style.SUCCESS('   ✅ Tous les bus ont des trajets'))

        # Bus actifs
        bus_actifs = Bus.objects.filter(status='Actif').count()
        bus_inactifs = Bus.objects.exclude(status='Actif').count()
        self.stdout.write(f'   📍 Bus actifs: {bus_actifs}')
        if bus_inactifs > 0:
            self.stdout.write(f'   📍 Bus inactifs: {bus_inactifs}')

        # === VÉRIFICATION DES TRAJETS ===
        self.stdout.write('\n🛤️  VÉRIFICATION DES TRAJETS:')

        # Trajets sans arrêts
        trajets_vides = Trajet.objects.annotate(
            nb_arrets=Count('arrets')
        ).filter(nb_arrets=0)
        
        if trajets_vides.exists():
            errors.append(f'{trajets_vides.count()} trajets sans arrêts')
            self.stdout.write(self.style.ERROR(
                f'   ❌ {trajets_vides.count()} trajets sans arrêts'
            ))
        else:
            self.stdout.write(self.style.SUCCESS('   ✅ Tous les trajets ont des arrêts'))

        # Trajets par type
        trajets_aller = Trajet.objects.filter(typeTrajet='Aller').count()
        trajets_retour = Trajet.objects.filter(typeTrajet='Retour').count()
        self.stdout.write(f'   📍 Trajets Aller: {trajets_aller}')
        self.stdout.write(f'   📍 Trajets Retour: {trajets_retour}')

        # === STATISTIQUES DES TRAJETS PAR BUS ===
        self.stdout.write('\n📈 DÉTAIL PAR BUS:')
        
        for bus in Bus.objects.all().order_by('numeroBus'):
            trajets = bus.trajets.all()
            total_arrets = sum(t.arrets.count() for t in trajets)
            
            self.stdout.write(
                f'   Bus {bus.numeroBus}: {trajets.count()} trajets, '
                f'{total_arrets} arrêts total'
            )

        # === RÉSUMÉ ===
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('   RÉSUMÉ')
        self.stdout.write('=' * 60)

        if errors:
            self.stdout.write(self.style.ERROR(f'\n❌ {len(errors)} ERREURS:'))
            for error in errors:
                self.stdout.write(self.style.ERROR(f'   • {error}'))
        
        if warnings:
            self.stdout.write(self.style.WARNING(f'\n⚠️  {len(warnings)} AVERTISSEMENTS:'))
            for warning in warnings:
                self.stdout.write(self.style.WARNING(f'   • {warning}'))

        if not errors and not warnings:
            self.stdout.write(self.style.SUCCESS('\n✅ La base de données est en parfait état !'))
        elif not errors:
            self.stdout.write(self.style.SUCCESS('\n✅ Pas d\'erreurs critiques.'))
            
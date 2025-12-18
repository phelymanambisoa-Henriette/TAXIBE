# localisation/management/commands/clean_arrets.py
"""
Commande pour nettoyer les arrêts invalides de la base de données
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from localisation.models import Arret
from transport.models import TrajetArret, Bus


class Command(BaseCommand):
    help = 'Nettoie les arrêts avec des coordonnées invalides'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Affiche ce qui serait supprimé sans modifier la base',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Supprime sans demander confirmation',
        )

    def handle(self, *args, **options):
        self.dry_run = options['dry_run']
        self.force = options['force']

        if self.dry_run:
            self.stdout.write(self.style.WARNING(
                '🔍 MODE DRY-RUN : Aucune modification ne sera faite\n'
            ))

        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('   NETTOYAGE DES ARRÊTS INVALIDES'))
        self.stdout.write(self.style.SUCCESS('=' * 60))

        # Trouver les arrêts invalides
        # Fianarantsoa est autour de lat: -21.4, lon: 47.1
        # On considère invalide tout ce qui n'est pas dans cette zone
        arrets_invalides = Arret.objects.filter(
            Q(latitude__gte=-20) |  # Latitude trop haute (pas à Madagascar)
            Q(latitude__lte=-22) |  # Latitude trop basse
            Q(longitude__lte=46) |  # Longitude trop à l'ouest
            Q(longitude__gte=48) |  # Longitude trop à l'est
            Q(latitude__isnull=True) |
            Q(longitude__isnull=True)
        )

        if not arrets_invalides.exists():
            self.stdout.write(self.style.SUCCESS(
                '\n✅ Aucun arrêt invalide trouvé ! La base est propre.'
            ))
            return

        # Afficher les arrêts à supprimer
        self.stdout.write(f'\n📍 {arrets_invalides.count()} arrêts invalides trouvés:\n')

        for arret in arrets_invalides:
            # Vérifier si cet arrêt est utilisé
            nb_trajets = TrajetArret.objects.filter(arretRef=arret).count()
            nb_bus_primus = Bus.objects.filter(primus=arret).count()
            nb_bus_terminus = Bus.objects.filter(terminus=arret).count()

            usage = []
            if nb_trajets > 0:
                usage.append(f'{nb_trajets} trajets')
            if nb_bus_primus > 0:
                usage.append(f'{nb_bus_primus} bus (primus)')
            if nb_bus_terminus > 0:
                usage.append(f'{nb_bus_terminus} bus (terminus)')

            usage_str = f" ⚠️  Utilisé dans: {', '.join(usage)}" if usage else ""

            self.stdout.write(
                f'  ID {arret.id}: {arret.nomArret} '
                f'({arret.latitude}, {arret.longitude}){usage_str}'
            )

        # Statistiques
        self.stdout.write(f'\n📊 Résumé:')
        self.stdout.write(f'   Arrêts invalides: {arrets_invalides.count()}')
        self.stdout.write(
            f'   Arrêts valides: {Arret.objects.exclude(pk__in=arrets_invalides).count()}'
        )

        if self.dry_run:
            self.stdout.write(self.style.WARNING(
                '\n[DRY-RUN] Aucune suppression effectuée.'
            ))
            return

        # Demander confirmation
        if not self.force:
            self.stdout.write('')
            confirm = input('❓ Voulez-vous supprimer ces arrêts ? (oui/non): ')
            if confirm.lower() not in ['oui', 'o', 'yes', 'y']:
                self.stdout.write(self.style.WARNING('❌ Opération annulée.'))
                return

        # Supprimer
        self.stdout.write('\n🗑️  Suppression en cours...')
        
        with transaction.atomic():
            # D'abord supprimer les références dans TrajetArret
            trajets_supprimes = TrajetArret.objects.filter(
                arretRef__in=arrets_invalides
            ).count()
            TrajetArret.objects.filter(arretRef__in=arrets_invalides).delete()

            if trajets_supprimes > 0:
                self.stdout.write(
                    f'   ✓ {trajets_supprimes} TrajetArret supprimés'
                )

            # Mettre à jour les bus qui utilisent ces arrêts comme primus/terminus
            for arret in arrets_invalides:
                # Trouver un arrêt valide de remplacement si nécessaire
                arret_remplacement = Arret.objects.filter(
                    latitude__lt=-20
                ).first()

                bus_primus = Bus.objects.filter(primus=arret)
                bus_terminus = Bus.objects.filter(terminus=arret)

                if bus_primus.exists() or bus_terminus.exists():
                    if arret_remplacement:
                        for bus in bus_primus:
                            self.stdout.write(
                                f'   ⚠️  Bus {bus.numeroBus}: primus remplacé par '
                                f'{arret_remplacement.nomArret}'
                            )
                            bus.primus = arret_remplacement
                            bus.save()

                        for bus in bus_terminus:
                            self.stdout.write(
                                f'   ⚠️  Bus {bus.numeroBus}: terminus remplacé par '
                                f'{arret_remplacement.nomArret}'
                            )
                            bus.terminus = arret_remplacement
                            bus.save()
                    else:
                        self.stdout.write(self.style.ERROR(
                            f'   ❌ Impossible de remplacer les références du bus'
                        ))

            # Supprimer les arrêts
            nb_supprimes = arrets_invalides.count()
            arrets_invalides.delete()

            self.stdout.write(self.style.SUCCESS(
                f'\n✅ {nb_supprimes} arrêts invalides supprimés !'
            ))

        # Afficher le résultat final
        self.stdout.write(f'\n📊 État final:')
        self.stdout.write(f'   Arrêts restants: {Arret.objects.count()}')
        self.stdout.write(f'   TrajetArret: {TrajetArret.objects.count()}')
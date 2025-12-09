# backend/interaction/views.py (VERSION COMPLÈTE AVEC get_or_create)
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.utils import timezone
from datetime import datetime, timedelta

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response

from django.db import transaction
from django.db.models import Q

from django.http import HttpResponse
from django.db.models.functions import TruncDate, TruncHour
import csv
import json


# 🔥 IMPORT DE VOTRE MODÈLE UTILISATEUR
from utilisateur.models import Utilisateur 

from .models import (
    Favori,
    Contribution,
    Commentaire,
    HistoriqueRecherche,
    SignalementCommentaire,
)
from .serializers import (
    FavoriSerializer,
    ContributionSerializer,
    CommentaireSerializer,
    HistoriqueRechercheSerializer,
    SignalementCommentaireSerializer,
)
from transport.models import Bus

# Helper admin
ADMIN_ROLES = {'admin', 'staff', 'moderator', 'manager', 'superadmin'}
def user_is_admin(user):
    if getattr(user, 'is_staff', False):
        return True
    role = (getattr(user, 'role', '') or '').lower()
    return role in ADMIN_ROLES


# ============ Favoris ============
class FavoriViewSet(viewsets.ModelViewSet):
    queryset = Favori.objects.all()
    serializer_class = FavoriSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favori.objects.filter(utilisateurRef_id=self.request.user.id).select_related('busRef')

    def perform_create(self, serializer):
        serializer.save(utilisateurRef=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        bus_id = request.data.get('busRef')
        if not bus_id:
            return Response({'error': 'busRef requis'}, status=status.HTTP_400_BAD_REQUEST)
        bus = get_object_or_404(Bus, id=bus_id)
        fav = Favori.objects.filter(utilisateurRef=request.user, busRef=bus).first()
        if fav:
            fav.delete()
            return Response({'message': 'Bus retiré des favoris', 'is_favorite': False})
        Favori.objects.create(utilisateurRef=request.user, busRef=bus)
        return Response({'message': 'Bus ajouté aux favoris', 'is_favorite': True}, status=status.HTTP_201_CREATED)


# ============ Contributions ============
class ContributionViewSet(viewsets.ModelViewSet):
    queryset = Contribution.objects.all().order_by('-date_creation')
    serializer_class = ContributionSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        if self.action in ['approve', 'reject']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset().select_related('utilisateurRef', 'busRef')
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        # 🔥 CORRECTION : OBTENIR OU CRÉER le profil Utilisateur
        user_instance = self.request.user
        utilisateur, _ = Utilisateur.objects.get_or_create(
            user=user_instance,
            defaults={'username': user_instance.username} 
        )
        serializer.save(utilisateurRef=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.utilisateurRef_id != self.request.user.id and not user_is_admin(self.request.user):
            raise PermissionDenied("Vous ne pouvez modifier que vos contributions.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.utilisateurRef_id != self.request.user.id and not user_is_admin(self.request.user):
            raise PermissionDenied("Vous ne pouvez supprimer que vos contributions.")
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        contrib = self.get_object()
        contrib.status = 'approved'
        contrib.save()
        return Response(self.get_serializer(contrib).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        contrib = self.get_object()
        contrib.status = 'rejected'
        contrib.save()
        return Response(self.get_serializer(contrib).data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def mes_contributions(self, request):
        qs = self.get_queryset().filter(utilisateurRef=request.user)
        return Response(self.get_serializer(qs, many=True).data)


# ============ Commentaires ============
class CommentaireViewSet(viewsets.ModelViewSet):
    queryset = Commentaire.objects.all().order_by('-date_creation')
    serializer_class = CommentaireSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset().select_related('utilisateurRef', 'busRef')
        bus_id = self.request.query_params.get('bus')
        if bus_id:
            qs = qs.filter(busRef_id=bus_id)
        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        # 🔥 CORRECTION : OBTENIR OU CRÉER le profil Utilisateur
        user_instance = self.request.user
        utilisateur, _ = Utilisateur.objects.get_or_create(
            user=user_instance,
            defaults={'username': user_instance.username} 
        )
        serializer.save(utilisateurRef=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.utilisateurRef_id != self.request.user.id and not user_is_admin(self.request.user):
            raise PermissionDenied("Vous ne pouvez modifier que vos propres commentaires")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.utilisateurRef_id != self.request.user.id and not user_is_admin(self.request.user):
            raise PermissionDenied("Vous ne pouvez supprimer que vos propres commentaires")
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        return Response({'message': 'Like enregistré (stub)'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def report(self, request, pk=None):
        commentaire = self.get_object()
        reason = request.data.get('reason', '')
        
        # 🔥 CORRECTION : OBTENIR OU CRÉER le profil Utilisateur pour le signalement
        report, created = SignalementCommentaire.objects.get_or_create(
            utilisateurRef=request.user,
            commentaireRef=commentaire,
            defaults={'reason': reason, 'status': 'open'}
        )

        if not created:
            report.reason = reason
            report.status = 'open'
            report.save()

        return Response({'ok': True, 'status': report.status})

# ============ Historique de recherches ============

class HistoriqueRechercheViewSet(viewsets.ModelViewSet):
    serializer_class = HistoriqueRechercheSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if getattr(settings, 'DEBUG', False) and self.action in ['list', 'retrieve', 'stats', 'top_trajets', 'top_arrets']:
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        qs = HistoriqueRecherche.objects.select_related(
            'userRef', 'depart', 'arrivee'
        ).order_by('-date_recherche')
        
        user = self.request.user
        
        # Utilisateur normal: ne voit que ses recherches
        if user.is_authenticated and not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            return qs.filter(userRef=user)

        # Admin: filtres avancés
        params = self.request.query_params
        
        # Filtre par période
        periode = params.get('periode', 'semaine')
        qs = self._filter_by_periode(qs, periode)
        
        # Autres filtres
        user_param = params.get('user')
        depart_param = params.get('depart')
        arrivee_param = params.get('arrivee')
        q_param = params.get('q')
        date_from = params.get('date_from')
        date_to = params.get('date_to')

        if user_param:
            if str(user_param).isdigit():
                qs = qs.filter(userRef_id=int(user_param))
            else:
                qs = qs.filter(userRef__username__icontains=user_param)
                
        if depart_param and str(depart_param).isdigit():
            qs = qs.filter(depart_id=int(depart_param))
            
        if arrivee_param and str(arrivee_param).isdigit():
            qs = qs.filter(arrivee_id=int(arrivee_param))

        if date_from:
            d = parse_date(date_from)
            if d:
                qs = qs.filter(date_recherche__date__gte=d)
                
        if date_to:
            d = parse_date(date_to)
            if d:
                qs = qs.filter(date_recherche__date__lte=d)

        if q_param:
            qs = qs.filter(
                Q(depart__nomArret__icontains=q_param) |
                Q(arrivee__nomArret__icontains=q_param) |
                Q(depart__nom__icontains=q_param) |
                Q(arrivee__nom__icontains=q_param) |
                Q(userRef__username__icontains=q_param)
            )
            
        return qs

    def _filter_by_periode(self, qs, periode):
        """Filtre le queryset par période"""
        now = timezone.now()
        
        if periode == 'jour':
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            qs = qs.filter(date_recherche__gte=start)
        elif periode == 'semaine':
            start = now - timedelta(days=7)
            qs = qs.filter(date_recherche__gte=start)
        elif periode == 'mois':
            start = now - timedelta(days=30)
            qs = qs.filter(date_recherche__gte=start)
        elif periode == 'annee':
            start = now - timedelta(days=365)
            qs = qs.filter(date_recherche__gte=start)
        # 'tout' = pas de filtre
        
        return qs

    def create(self, request, *args, **kwargs):
        """Création avec déduplication (30 min)"""
        user = request.user
        depart = request.data.get('depart')
        arrivee = request.data.get('arrivee')
        
        if not depart or not arrivee:
            return Response(
                {'detail': 'depart et arrivee sont requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        since = timezone.now() - timedelta(minutes=30)
        last = HistoriqueRecherche.objects.filter(
            userRef=user, 
            depart_id=depart, 
            arrivee_id=arrivee, 
            date_recherche__gte=since
        ).order_by('-date_recherche').first()

        if last:
            last.date_recherche = timezone.now()
            last.save(update_fields=['date_recherche'])
            ser = self.get_serializer(last)
            return Response(ser.data, status=status.HTTP_200_OK)

        serializer = self.get_serializer(data={'depart': depart, 'arrivee': arrivee})
        serializer.is_valid(raise_exception=True)
        serializer.save(userRef=user)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_destroy(self, instance):
        user = self.request.user
        if not (getattr(user, 'is_staff', False) or instance.userRef_id == user.id):
            raise PermissionDenied("Suppression réservée au propriétaire ou à l'admin.")
        instance.delete()

    # ========== ACTIONS PERSONNALISÉES ==========

    @action(detail=False, methods=['delete'], permission_classes=[IsAuthenticated], url_path='clear')
    def clear(self, request):
        """Effacer tout l'historique de l'utilisateur connecté"""
        deleted, _ = HistoriqueRecherche.objects.filter(userRef=request.user).delete()
        return Response({'deleted': deleted})

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Statistiques globales de l'historique"""
        periode = request.query_params.get('periode', 'semaine')
        now = timezone.now()
        
        # Base queryset filtré par période
        qs = self._filter_by_periode(HistoriqueRecherche.objects.all(), periode)
        
        # Stats de base
        total = qs.count()
        
        # Aujourd'hui
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        aujourdhui = qs.filter(date_recherche__gte=today_start).count()
        
        # Cette semaine
        week_start = now - timedelta(days=7)
        semaine = qs.filter(date_recherche__gte=week_start).count()
        
        # Moyenne par jour
        if periode == 'jour':
            jours = 1
        elif periode == 'semaine':
            jours = 7
        elif periode == 'mois':
            jours = 30
        elif periode == 'annee':
            jours = 365
        else:
            jours = max((now - qs.order_by('date_recherche').first().date_recherche).days, 1) if qs.exists() else 1
            
        moyenne = round(total / jours, 1) if jours > 0 else 0
        
        # Évolution par jour (7 derniers jours)
        evolution = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            count = qs.filter(date_recherche__gte=day_start, date_recherche__lt=day_end).count()
            evolution.append({
                'jour': day.strftime('%a'),  # Lun, Mar, etc.
                'date': day.strftime('%d/%m'),
                'recherches': count
            })
        
        # Utilisateurs uniques
        utilisateurs_uniques = qs.values('userRef').distinct().count()
        
        return Response({
            'total_recherches': total,
            'recherches_aujourdhui': aujourdhui,
            'recherches_semaine': semaine,
            'moyenne_par_jour': moyenne,
            'utilisateurs_uniques': utilisateurs_uniques,
            'evolution': evolution
        })

    @action(detail=False, methods=['get'], url_path='top-trajets')
    def top_trajets(self, request):
        """Top des trajets les plus recherchés"""
        limit = int(request.query_params.get('limit', 10))
        periode = request.query_params.get('periode', 'semaine')
        
        qs = self._filter_by_periode(HistoriqueRecherche.objects.all(), periode)
        
        trajets = qs.values(
            'depart__nomArret', 'depart__nom',
            'arrivee__nomArret', 'arrivee__nom'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:limit]
        
        result = []
        for t in trajets:
            depart_nom = t.get('depart__nomArret') or t.get('depart__nom') or 'Inconnu'
            arrivee_nom = t.get('arrivee__nomArret') or t.get('arrivee__nom') or 'Inconnu'
            result.append({
                'trajet': f"{depart_nom} → {arrivee_nom}",
                'depart': depart_nom,
                'arrivee': arrivee_nom,
                'count': t['count']
            })
            
        return Response(result)

    @action(detail=False, methods=['get'], url_path='top-arrets')
    def top_arrets(self, request):
        """Top des arrêts les plus recherchés (départ + arrivée)"""
        limit = int(request.query_params.get('limit', 10))
        periode = request.query_params.get('periode', 'semaine')
        
        qs = self._filter_by_periode(HistoriqueRecherche.objects.all(), periode)
        
        # Comptage des départs
        departs = qs.values('depart__nomArret', 'depart__nom').annotate(count=Count('id'))
        
        # Comptage des arrivées
        arrivees = qs.values('arrivee__nomArret', 'arrivee__nom').annotate(count=Count('id'))
        
        # Fusion des comptages
        arrets_count = {}
        
        for d in departs:
            nom = d.get('depart__nomArret') or d.get('depart__nom') or 'Inconnu'
            arrets_count[nom] = arrets_count.get(nom, 0) + d['count']
            
        for a in arrivees:
            nom = a.get('arrivee__nomArret') or a.get('arrivee__nom') or 'Inconnu'
            arrets_count[nom] = arrets_count.get(nom, 0) + a['count']
        
        # Tri et limite
        sorted_arrets = sorted(arrets_count.items(), key=lambda x: x[1], reverse=True)[:limit]
        
        result = [{'arret': nom, 'count': count} for nom, count in sorted_arrets]
        
        return Response(result)

    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        """Exporter l'historique en CSV ou JSON"""
        format_type = request.query_params.get('format', 'csv')
        periode = request.query_params.get('periode', 'tout')
        
        qs = self._filter_by_periode(
            HistoriqueRecherche.objects.select_related('userRef', 'depart', 'arrivee'),
            periode
        ).order_by('-date_recherche')
        
        # Limiter pour les gros exports
        qs = qs[:5000]
        
        if format_type == 'json':
            data = []
            for h in qs:
                data.append({
                    'id': h.id,
                    'utilisateur': h.userRef.username if h.userRef else 'Anonyme',
                    'depart': getattr(h.depart, 'nomArret', None) or getattr(h.depart, 'nom', str(h.depart_id)),
                    'arrivee': getattr(h.arrivee, 'nomArret', None) or getattr(h.arrivee, 'nom', str(h.arrivee_id)),
                    'date': h.date_recherche.isoformat()
                })
            
            response = HttpResponse(
                json.dumps(data, ensure_ascii=False, indent=2),
                content_type='application/json'
            )
            response['Content-Disposition'] = f'attachment; filename="historique_{periode}.json"'
            return response
        
        else:  # CSV par défaut
            response = HttpResponse(content_type='text/csv; charset=utf-8')
            response['Content-Disposition'] = f'attachment; filename="historique_{periode}.csv"'
            response.write('\ufeff')  # BOM pour Excel
            
            writer = csv.writer(response, delimiter=';')
            writer.writerow(['ID', 'Utilisateur', 'Départ', 'Arrivée', 'Date'])
            
            for h in qs:
                depart_nom = getattr(h.depart, 'nomArret', None) or getattr(h.depart, 'nom', str(h.depart_id))
                arrivee_nom = getattr(h.arrivee, 'nomArret', None) or getattr(h.arrivee, 'nom', str(h.arrivee_id))
                
                writer.writerow([
                    h.id,
                    h.userRef.username if h.userRef else 'Anonyme',
                    depart_nom,
                    arrivee_nom,
                    h.date_recherche.strftime('%d/%m/%Y %H:%M')
                ])
            
            return response

# ============ Signalements (admin) ============
class SignalementCommentaireViewSet(viewsets.ModelViewSet):
    """Administration des signalements de commentaires"""
    permission_classes = [IsAdminUser]
    serializer_class = SignalementCommentaireSerializer
    queryset = SignalementCommentaire.objects.select_related('utilisateurRef', 'commentaireRef').order_by('-date_creation')

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        q_param = self.request.query_params.get('q')
        if status_param:
            qs = qs.filter(status=status_param)
        if q_param:
            qs = qs.filter(
                Q(reason__icontains=q_param)
                | Q(utilisateurRef__username__icontains=q_param)
                | Q(commentaireRef__contenu__icontains=q_param)
            )
        return qs

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        rep = self.get_object()
        rep.status = 'dismissed'
        rep.save()
        return Response(self.get_serializer(rep).data)

    @action(detail=True, methods=['post'])
    def remove_comment(self, request, pk=None):
        rep = self.get_object()
        cm = rep.commentaireRef
        cm.delete()
        rep.status = 'removed'
        rep.save()
        return Response(self.get_serializer(rep).data)
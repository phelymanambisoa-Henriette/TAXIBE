# backend/interaction/admin.py - VERSION CORRECTE
from django.contrib import admin
from .models import Commentaire, Contribution, HistoriqueRecherche, Favori

@admin.register(Favori)
class FavoriAdmin(admin.ModelAdmin):
    list_display = ['utilisateurRef', 'busRef', 'date_ajout']
    list_filter = ['date_ajout']
    search_fields = ['utilisateurRef__username', 'busRef__numeroBus']
    date_hierarchy = 'date_ajout'
    ordering = ['-date_ajout']

@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display = ['utilisateurRef', 'type', 'busRef', 'status', 'date_creation']
    list_filter = ['type', 'status', 'date_creation']
    search_fields = ['utilisateurRef__username', 'description']
    date_hierarchy = 'date_creation'
    list_editable = ['status']
    ordering = ['-date_creation']

@admin.register(Commentaire)
class CommentaireAdmin(admin.ModelAdmin):
    list_display = ['utilisateurRef', 'busRef', 'note', 'date_creation']
    list_filter = ['note', 'date_creation']
    search_fields = ['utilisateurRef__username', 'contenu', 'busRef__numeroBus']
    date_hierarchy = 'date_creation'
    ordering = ['-date_creation']

@admin.register(HistoriqueRecherche)
class HistoriqueRechercheAdmin(admin.ModelAdmin):
    list_display = ['userRef', 'depart', 'arrivee', 'date_recherche']
    list_filter = ['date_recherche']
    search_fields = ['userRef__username']
    date_hierarchy = 'date_recherche'
    ordering = ['-date_recherche']
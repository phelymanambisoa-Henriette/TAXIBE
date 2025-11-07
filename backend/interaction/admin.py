from django.contrib import admin
from .models import Commentaire, Contribution, HistoriqueRecherche

@admin.register(Commentaire)
class CommentaireAdmin(admin.ModelAdmin):
    list_display = ('id', 'auteurRef', 'contenu', 'dateCreation', 'statut', 'parentRef')
    search_fields = ('contenu', 'auteurRef__nom')
    list_filter = ('statut', 'dateCreation')
    ordering = ('-dateCreation',)

@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display = ('id', 'typeContribution', 'utilisateurRef', 'statut', 'dateSoumission', 'dateValidation')
    search_fields = ('details', 'utilisateurRef__nom')
    list_filter = ('typeContribution', 'statut')
    ordering = ('-dateSoumission',)

@admin.register(HistoriqueRecherche)
class HistoriqueRechercheAdmin(admin.ModelAdmin):
    list_display = ('id', 'userRef', 'depart', 'arrivee', 'dateRecherche')
    search_fields = ('userRef__nom',)
    ordering = ('-dateRecherche',)

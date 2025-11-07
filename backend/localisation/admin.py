from django.contrib import admin
from .models import Ville, Quartier, Arret

@admin.register(Ville)
class VilleAdmin(admin.ModelAdmin):
    list_display = ('id', 'nomVille', 'codePostal', 'pays')
    list_display_links = ('nomVille',)
    search_fields = ('nomVille', 'pays', 'codePostal')
    ordering = ('nomVille',)

@admin.register(Quartier)
class QuartierAdmin(admin.ModelAdmin):
    list_display = ('id', 'nomQuartier', 'villeRef')
    list_display_links = ('nomQuartier',)
    search_fields = ('nomQuartier',)
    list_filter = ('villeRef',)

@admin.register(Arret)
class ArretAdmin(admin.ModelAdmin):
    list_display = ('id', 'nomArret', 'quartierRef', 'latitude', 'longitude')
    list_display_links = ('nomArret', 'quartierRef',)
    search_fields = ('nomArret',)
    list_filter = ('quartierRef',)

from django.contrib import admin
from .models import Ville, Quartier, Arret

@admin.register(Arret)
class ArretAdmin(admin.ModelAdmin):
    list_display = ('nomArret', 'villeRef', 'latitude', 'longitude', 'quartier')
    list_filter = ('villeRef',)
    search_fields = ('nomArret',)  # ← ajouté pour autocomplete_fields

@admin.register(Ville)
class VilleAdmin(admin.ModelAdmin):
    list_display = ('nomVille', 'codePostal', 'pays')
    search_fields = ('nomVille',)

@admin.register(Quartier)
class QuartierAdmin(admin.ModelAdmin):
    list_display = ('nomQuartier', 'villeRef')
    list_filter = ('villeRef',)
    search_fields = ('nomQuartier',)
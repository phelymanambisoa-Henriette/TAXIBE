# transport/admin.py
from django.contrib import admin
from .models import Bus, Trajet, TrajetArret

@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    list_display = ['numeroBus', 'quartier', 'status', 'frais', 'villeRef']
    list_filter = ['status', 'villeRef', 'quartier']
    search_fields = ['numeroBus', 'quartier']
    list_editable = ['status', 'frais']

@admin.register(Trajet)
class TrajetAdmin(admin.ModelAdmin):
    list_display = ['busRef', 'typeTrajet', 'description']
    list_filter = ['typeTrajet']

@admin.register(TrajetArret)
class TrajetArretAdmin(admin.ModelAdmin):
    list_display = ['trajetRef', 'arretRef', 'ordrePassage', 'direction']
    list_filter = ['direction']
    ordering = ['trajetRef', 'ordrePassage']
from django.contrib import admin
from .models import Bus, Trajet, TrajetArret

class TrajetArretInline(admin.TabularInline):
    model = TrajetArret
    extra = 1
    autocomplete_fields = ['arretRef']

@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    list_display = ('id', 'numeroBus', 'villeRef', 'primus', 'terminus')
    search_fields = ('numeroBus',)
    list_filter = ('villeRef',)

@admin.register(Trajet)
class TrajetAdmin(admin.ModelAdmin):
    list_display = ('id', 'busRef', 'typeTrajet', 'description')
    list_filter = ('typeTrajet', 'busRef')
    search_fields = ('description',)
    inlines = [TrajetArretInline]

@admin.register(TrajetArret)
class TrajetArretAdmin(admin.ModelAdmin):
    list_display = ('trajetRef', 'arretRef', 'ordrePassage', 'direction')
    list_filter = ('direction',)
    ordering = ('trajetRef', 'ordrePassage')

from django.contrib import admin
from .models import Utilisateur

@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'date_creation']
    list_filter = ['role', 'date_creation']
    search_fields = ['username', 'email', 'nom']
    readonly_fields = ['date_creation']
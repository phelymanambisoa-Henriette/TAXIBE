from django.contrib import admin
from .models import Utilisateur

@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'email', 'role', 'reputation')
    search_fields = ('nom', 'email')
    list_filter = ('role',)
    ordering = ('nom',)

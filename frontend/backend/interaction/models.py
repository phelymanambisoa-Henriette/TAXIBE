from django.db import models
from django.contrib.auth.models import User
from transport.models import Bus
from localisation.models import Arret

class Commentaire(models.Model):
    """Commentaires sur les bus"""
    utilisateurRef = models.ForeignKey(User, on_delete=models.CASCADE, related_name='commentaires')
    busRef = models.ForeignKey(Bus, on_delete=models.CASCADE, related_name='commentaires', null=True, blank=True)
    contenu = models.TextField(blank=True, default='')
    note = models.IntegerField(default=5, choices=[(i, i) for i in range(1, 6)])
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Commentaire'
        verbose_name_plural = 'Commentaires'
    
    def __str__(self):
        bus_info = f"Bus {self.busRef.numeroBus}" if self.busRef else "Sans bus"
        return f"Commentaire de {self.utilisateurRef.username} sur {bus_info}"

class SignalementCommentaire(models.Model):
    STATUS_CHOICES = [
        ('open', 'Ouvert'),
        ('dismissed', 'Ignoré'),
        ('removed', 'Commentaire supprimé'),
    ]

    utilisateurRef = models.ForeignKey(User, on_delete=models.CASCADE, related_name='signalements')
    commentaireRef = models.ForeignKey('Commentaire', on_delete=models.CASCADE, related_name='signalements')
    reason = models.TextField(blank=True, default='')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='open')
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['utilisateurRef', 'commentaireRef']
        ordering = ['-date_creation']
        verbose_name = 'Signalement commentaire'
        verbose_name_plural = 'Signalements commentaires'

    def __str__(self):
        return f"Signalement #{self.id} par {self.utilisateurRef.username} sur com {self.commentaireRef_id} [{self.status}]"

class Favori(models.Model):
    utilisateurRef = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favoris')
    busRef = models.ForeignKey(Bus, on_delete=models.CASCADE, related_name='favori_par')
    date_ajout = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['utilisateurRef', 'busRef']
        ordering = ['-date_ajout']
        verbose_name = 'Favori'
        verbose_name_plural = 'Favoris'
    
    def __str__(self):
        return f"{self.utilisateurRef.username} - Bus {self.busRef.numeroBus}"

class Contribution(models.Model):
    TYPE_CHOICES = [
        ('horaire', 'Horaire'),
        ('tarif', 'Tarif'),
        ('trajet', 'Trajet'),
        ('incident', 'Incident'),
        ('autre', 'Autre'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
    ]
    
    utilisateurRef = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contributions')
    busRef = models.ForeignKey(Bus, on_delete=models.CASCADE, related_name='contributions', null=True, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='autre')
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')  # ✅ CORRIGÉ ICI
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Contribution'
        verbose_name_plural = 'Contributions'
    
    def __str__(self):
        return f"{self.type} - {self.utilisateurRef.username}"

class HistoriqueRecherche(models.Model):
    """Historique des recherches d'itinéraires"""
    userRef = models.ForeignKey(User, on_delete=models.CASCADE, related_name='historique_recherches')
    depart = models.ForeignKey(Arret, on_delete=models.CASCADE, related_name='depart_hist')
    arrivee = models.ForeignKey(Arret, on_delete=models.CASCADE, related_name='arrivee_hist')
    date_recherche = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date_recherche']
        verbose_name = 'Historique de recherche'
        verbose_name_plural = 'Historiques de recherches'
    
    def __str__(self):
        return f"Recherche de {self.userRef.username}: {self.depart} → {self.arrivee}"
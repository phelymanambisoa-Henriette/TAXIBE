# transport/models.py - VERSION COMPLÈTE AVEC QUARTIER
from django.db import models
from localisation.models import Arret, Ville

class Bus(models.Model):
    numeroBus = models.CharField(max_length=50)
    primus = models.ForeignKey(Arret, related_name='bus_depart', on_delete=models.CASCADE)
    terminus = models.ForeignKey(Arret, related_name='bus_arrivee', on_delete=models.CASCADE)
    villeRef = models.ForeignKey(Ville, on_delete=models.CASCADE)
    quartier = models.CharField(max_length=100, blank=True, null=True)  # 🆕 NOUVEAU
    status = models.CharField(max_length=20, default='Actif')
    current_latitude = models.FloatField(null=True, blank=True)
    current_longitude = models.FloatField(null=True, blank=True)
    frais = models.DecimalField(max_digits=10, decimal_places=2, default=600)
    
    def __str__(self):
        return f"Bus {self.numeroBus}"
    
    class Meta:
        verbose_name = "Bus"
        verbose_name_plural = "Bus"
        ordering = ['numeroBus']


class Trajet(models.Model):
    TYPE_TRAJET_CHOICES = [('Aller', 'Aller'), ('Retour', 'Retour')]
    
    busRef = models.ForeignKey(Bus, on_delete=models.CASCADE, related_name='trajets')
    typeTrajet = models.CharField(max_length=10, choices=TYPE_TRAJET_CHOICES)
    description = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.busRef.numeroBus} - {self.typeTrajet}"
    
    class Meta:
        verbose_name = "Trajet"
        verbose_name_plural = "Trajets"


class TrajetArret(models.Model):
    DIRECTION_CHOICES = [('Aller', 'Aller'), ('Retour', 'Retour'), ('AllerRetour', 'AllerRetour')]
    
    trajetRef = models.ForeignKey(Trajet, on_delete=models.CASCADE, related_name='arrets')
    arretRef = models.ForeignKey(Arret, on_delete=models.CASCADE)
    ordrePassage = models.IntegerField()
    direction = models.CharField(max_length=12, choices=DIRECTION_CHOICES)
    
    class Meta:
        ordering = ['ordrePassage']
        verbose_name = "Trajet Arrêt"
        verbose_name_plural = "Trajets Arrêts"
        unique_together = ['trajetRef', 'arretRef', 'ordrePassage']
    
    def __str__(self):
        # Récupère le nom de l'arrêt peu importe le champ
        try:
            nom_arret = self.arretRef.nomArret
        except AttributeError:
            try:
                nom_arret = self.arretRef.nom
            except AttributeError:
                nom_arret = f"Arrêt #{self.arretRef.id}"
        
        return f"{self.trajetRef} - {nom_arret}"
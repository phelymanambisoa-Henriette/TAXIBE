from django.db import models
from localisation.models import Arret, Ville

# Create your models here.
class Bus(models.Model):
    numeroBus = models.CharField(max_length=50)
    primus = models.ForeignKey(Arret, related_name='bus_depart', on_delete=models.CASCADE)
    terminus = models.ForeignKey(Arret, related_name='bus_arrivee', on_delete=models.CASCADE)
    villeRef = models.ForeignKey(Ville, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, default='Actif')  # optionnel
    current_latitude = models.FloatField(null=True, blank=True)
    current_longitude = models.FloatField(null=True, blank=True)

class Trajet(models.Model):
    TYPE_TRAJET_CHOICES = [('Aller', 'Aller'), ('Retour', 'Retour')]
    
    busRef = models.ForeignKey(Bus, on_delete=models.CASCADE)
    typeTrajet = models.CharField(max_length=10, choices=TYPE_TRAJET_CHOICES)
    description = models.TextField(null=True, blank=True)

class TrajetArret(models.Model):
    DIRECTION_CHOICES = [('Aller', 'Aller'), ('Retour', 'Retour'), ('AllerRetour', 'AllerRetour')]
    
    trajetRef = models.ForeignKey(Trajet, on_delete=models.CASCADE)
    arretRef = models.ForeignKey(Arret, on_delete=models.CASCADE)
    ordrePassage = models.IntegerField()
    direction = models.CharField(max_length=12, choices=DIRECTION_CHOICES)

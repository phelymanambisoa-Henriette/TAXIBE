from django.db import models

class Ville(models.Model):
    nomVille = models.CharField(max_length=100)
    codePostal = models.CharField(max_length=20)
    pays = models.CharField(max_length=50)

    def __str__(self):
        return self.nomVille


class Quartier(models.Model):
    nomQuartier = models.CharField(max_length=100)
    villeRef = models.ForeignKey(Ville, on_delete=models.CASCADE, related_name='quartiers')

    def __str__(self):
        return f"{self.nomQuartier} ({self.villeRef.nomVille})"


class Arret(models.Model):
    nomArret = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    quartierRef = models.ForeignKey(Quartier, on_delete=models.CASCADE, related_name='arrets')

    def __str__(self):
        return self.nomArret

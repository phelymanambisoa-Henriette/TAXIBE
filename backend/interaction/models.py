from django.db import models
from utilisateur.models import Utilisateur
from localisation.models import Arret

class Contribution(models.Model):
    TYPE_CHOICES = [
        ('Ajout_Arret', 'Ajout Arret'),
        ('Modification_Trajet', 'Modification Trajet'),
        ('Ajout_Bus', 'Ajout Bus'),
        ('Signalement_Erreur', 'Signalement Erreur'),
    ]
    STATUT_CHOICES = [
        ('En attente', 'En attente'),
        ('Validée', 'Validée'),
        ('Rejetée', 'Rejetée'),
    ]
    typeContribution = models.CharField(max_length=30, choices=TYPE_CHOICES)
    details = models.TextField()
    utilisateurRef = models.ForeignKey(Utilisateur, on_delete=models.CASCADE)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='En attente')
    dateSoumission = models.DateTimeField(auto_now_add=True)
    dateValidation = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.typeContribution} - {self.utilisateurRef.nom}"


class HistoriqueRecherche(models.Model):
    userRef = models.ForeignKey(Utilisateur, on_delete=models.CASCADE)
    depart = models.ForeignKey(Arret, on_delete=models.CASCADE, related_name='depart_hist')
    arrivee = models.ForeignKey(Arret, on_delete=models.CASCADE, related_name='arrivee_hist')
    dateRecherche = models.DateTimeField(auto_now_add=True)
    resultat = models.TextField()

    def __str__(self):
        return f"Recherche de {self.userRef.nom}"


class Commentaire(models.Model):
    STATUT_CHOICES = [('Visible', 'Visible'), ('Masqué', 'Masqué'), ('Supprimé', 'Supprimé')]
    contenu = models.TextField()
    dateCreation = models.DateTimeField(auto_now_add=True)
    auteurRef = models.ForeignKey(Utilisateur, on_delete=models.CASCADE)
    parentRef = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='Visible')

    def __str__(self):
        return f"Commentaire par {self.auteurRef.nom}"

# utilisateur/models.py
from django.db import models

class Utilisateur(models.Model):
    ROLE_CHOICES = [('Admin', 'Admin'), ('User', 'User')]
    
    nom = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    mot_de_passe = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='User')
    reputation = models.IntegerField(default=0)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_derniere_connexion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom


# DOIT ETRE COMBINER AVEC LE CODE DESSUS APRES

#from django.db import models
#from django.contrib.auth.models import AbstractUser

#class User(AbstractUser):
 #   photo = models.ImageField(upload_to='profils/', null=True, blank=True)

  #  def __str__(self):
  #      return self.username

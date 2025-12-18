from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Utilisateur(models.Model):
    ROLE_CHOICES = [
        ('user', 'Utilisateur'),
        ('admin', 'Administrateur'),
    ]
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile',
        primary_key=True  # ✅ user = clé primaire
    )
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(blank=True, null=True)
    nom = models.CharField(max_length=255, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_derniere_connexion = models.DateTimeField(null=True, blank=True)
    reputation = models.IntegerField(default=0)

    class Meta:
        db_table = 'utilisateur_profile'

    def __str__(self):
        return self.username

# ========================== SIGNALS ======================================

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Utilisateur.objects.get_or_create(
            user=instance,
            defaults={
                'username': instance.username,
                'email': instance.email
            }
        )

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
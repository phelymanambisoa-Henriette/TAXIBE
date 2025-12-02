from django.urls import path
from rest_framework.routers import DefaultRouter
from django.views.decorators.csrf import csrf_exempt

# Correct import des vues
from .views import (
    MeView,
    RegisterView,
    UpdateProfileView,
    ChangePasswordView,
    ensure_profile_view,
    UtilisateurViewSet
)

# Création du routeur pour les views RESTful
router = DefaultRouter()
router.register(r'users', UtilisateurViewSet, basename='users')

# URL patterns manuelles (non gérées par ViewSet)
urlpatterns = [
    path('me/', MeView.as_view(), name='utilisateur-me'),
    path('profile/update/', UpdateProfileView.as_view(), name='update-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('ensure_profile/', ensure_profile_view, name='ensure-profile'),
    path('register/', csrf_exempt(RegisterView.as_view()), name='user-register'),

    # (Optionnel) Si tu exposes une vue "stats" dans ViewSet
    path('stats/', UtilisateurViewSet.as_view({'get': 'stats'}), name='user-stats'),
]

# Ajout automatique des routes : /users/, /users/<id>/...
urlpatterns += router.urls
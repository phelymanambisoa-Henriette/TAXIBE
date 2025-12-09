# utilisateur/urls.py

from django.urls import path
from rest_framework.routers import DefaultRouter
from django.views.decorators.csrf import csrf_exempt

from .views import (
    MeView,
    RegisterView,
    UpdateProfileView,
    ChangePasswordView,
    UserStatsView,
    ensure_profile_view,
    UtilisateurViewSet
)

router = DefaultRouter()
router.register(r'users', UtilisateurViewSet, basename='users')

urlpatterns = [
    path('me/', MeView.as_view(), name='utilisateur-me'),
    path('profile/update/', UpdateProfileView.as_view(), name='update-profile'),
    path('stats/', UserStatsView.as_view(), name='user-stats'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('ensure_profile/', ensure_profile_view, name='ensure-profile'),
    path('register/', csrf_exempt(RegisterView.as_view()), name='user-register'),
]

urlpatterns += router.urls
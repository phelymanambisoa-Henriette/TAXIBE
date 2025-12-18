# backend/taxibe_backend/urls.py (CORRIGÉ ET FONCTIONNEL)

from django.contrib import admin
from django.urls import path, include
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API apps
    path('api/utilisateur/', include('utilisateur.urls')),
    path('api/localisation/', include('localisation.urls')),
    path('api/transport/', include('transport.urls')),
    path('api/interaction/', include('interaction.urls')),

    # JWT (SimpleJWT)
    path('api/auth/token/', csrf_exempt(TokenObtainPairView.as_view()), name='token_obtain_pair'),
    path('api/auth/token/refresh/', csrf_exempt(TokenRefreshView.as_view()), name='token_refresh'),
    path('api/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # UI DRF login (pour tester via navigateur)
    path('api-auth/', include('rest_framework.urls')),
]

# ✅ IMPORTANT: Servir les fichiers media (avatars, images) en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
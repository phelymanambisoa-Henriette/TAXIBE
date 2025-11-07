from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentification.urls')),  # 🔥 Authentification JWT
    path('api/utilisateur/', include('utilisateur.urls')),
    path('api/localisation/', include('localisation.urls')),
    path('api/transport/', include('transport.urls')),
    path('api/interaction/', include('interaction.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

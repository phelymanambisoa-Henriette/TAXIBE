from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VilleViewSet, QuartierViewSet, ArretViewSet

router = DefaultRouter()
router.register('villes', VilleViewSet)
router.register('quartiers', QuartierViewSet)
router.register('arrets', ArretViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

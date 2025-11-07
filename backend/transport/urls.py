from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusViewSet, TrajetViewSet, TrajetArretViewSet

router = DefaultRouter()
router.register('bus', BusViewSet)
router.register('trajets', TrajetViewSet)
router.register('trajets-arrets', TrajetArretViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

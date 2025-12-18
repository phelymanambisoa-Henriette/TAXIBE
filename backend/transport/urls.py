# transport/urls.py - VERSION MISE À JOUR

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'bus', views.BusViewSet, basename='bus')
router.register(r'bus-map', views.BusMapViewSet, basename='bus-map')
router.register(r'positions', views.PositionBusViewSet, basename='positions')
router.register(r'trajets-map', views.TrajetMapViewSet, basename='trajets-map')

urlpatterns = [
    path('', include(router.urls)),
    
    # ========== ARRÊTS ==========
    path('arrets/', views.arret_list, name='arret-list'),
    path('arrets/<int:pk>/', views.arret_detail, name='arret-detail'),
    path('arrets/nearby/', views.nearby_arrets, name='nearby-arrets'),
    path('arrets/search/', views.search_arrets, name='search-arrets'),
    path('arrets/nearest/', views.nearest_arret, name='nearest-arret'),
    path('arrets/<int:arret_id>/lignes/', views.lignes_by_arret, name='lignes-by-arret'),
    
    # ========== LIGNES ==========
    path('lignes/', views.ligne_list, name='ligne-list'),
    path('lignes/<int:ligne_id>/arrets/', views.arrets_by_ligne, name='arrets-by-ligne'),
    
    # ========== TRAJETS (NOUVEAU) ==========
    path('bus-trajets/', views.get_all_bus_trajets, name='all-bus-trajets'),
    path('bus/<int:bus_id>/trajets/', views.get_bus_trajet, name='bus-trajets'),
    path('bus/<int:bus_id>/geojson/', views.get_bus_geojson, name='bus-geojson'),
    path('trajets/<int:trajet_id>/', views.get_trajet_detail, name='trajet-detail'),
    path('trajets/<int:trajet_id>/geojson/', views.get_trajet_geojson, name='trajet-geojson'),
    path('trajets/geojson/', views.get_all_trajets_geojson, name='all-trajets-geojson'),
    
    # ========== ITINÉRAIRES ==========
    path('itineraire/', views.find_itineraire, name='find-itineraire'),
    path('itineraire/from-position/', views.find_itineraire_from_position, name='itineraire-from-position'),
    
    # ========== VILLES & QUARTIERS ==========
    path('villes/', views.ville_list, name='ville-list'),
    path('villes/<int:ville_id>/quartiers/', views.quartiers_by_ville, name='quartiers-by-ville'),
]
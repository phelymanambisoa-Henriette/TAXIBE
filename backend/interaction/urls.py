from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContributionViewSet, CommentaireViewSet, HistoriqueRechercheViewSet

router = DefaultRouter()
router.register('contributions', ContributionViewSet)
router.register('commentaires', CommentaireViewSet)
router.register('historiques', HistoriqueRechercheViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

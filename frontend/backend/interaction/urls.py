# backend/interaction/urls.py
from rest_framework.routers import DefaultRouter
from .views import (
    FavoriViewSet,
    ContributionViewSet,
    CommentaireViewSet,
    HistoriqueRechercheViewSet,
    SignalementCommentaireViewSet,
)

router = DefaultRouter()
router.register(r'favoris', FavoriViewSet, basename='favoris')
router.register(r'contributions', ContributionViewSet, basename='contributions')
router.register(r'commentaires', CommentaireViewSet, basename='commentaires')
router.register(r'historiques', HistoriqueRechercheViewSet, basename='historiques')
router.register(r'reports', SignalementCommentaireViewSet, basename='reports')

urlpatterns = router.urls
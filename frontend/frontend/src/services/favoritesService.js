// src/services/favoritesService.js
import api from './api';

export const favoritesService = {
  // Liste des favoris de l'utilisateur
  async getUserFavorites() {
    return await api.get('/interaction/favoris/');
  },

  // Ajoute ou retire un favori
  async toggleFavorite(busId) {
    return await api.post('/interaction/favoris/toggle/', { busRef: busId });
  },

  // Vérifie si un bus est favori
  async isFavorite(busId) {
    try {
      const response = await api.get('/interaction/favoris/');
      return response.data.some(fav => fav.busRef === busId);
    } catch {
      return false;
    }
  },

  // Retire un favori
  async removeFavorite(favoriId) {
    return await api.delete(`/interaction/favoris/${favoriId}/`);
  },
};

export default favoritesService;
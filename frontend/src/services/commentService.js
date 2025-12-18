// src/services/commentService.js - VERSION FINALE CORRIGÉE
import api from './api';

export const commentService = {
  /**
   * Récupérer les commentaires d'un bus
   */
  getComments: async (busId) => {
    try {
      console.log('📥 Récupération commentaires pour bus:', busId);
      
      const response = await api.get(`/interaction/commentaires/?bus=${busId}`);
      
      console.log('✅ Commentaires reçus:', response.data);
      
      return response;
    } catch (error) {
      console.error('❌ Erreur getComments:', error);
      throw error;
    }
  },

  /**
   * Créer un commentaire
   */
  createComment: async (data) => {
    try {
      console.log('📤 Données reçues:', data);
      
      // ✅ CORRECTION : Transformer pour le backend Django
      const payload = {
        bus: data.bus,
        contenu: data.text || data.commentaire || data.contenu,  // ← CHANGEMENT ICI !
        note: data.rating || data.note || 5,
      };

      console.log('📦 Payload envoyé au backend:', payload);

      const response = await api.post('/interaction/commentaires/', payload);
      
      console.log('✅ Commentaire créé:', response.data);
      
      return response;
    } catch (error) {
      console.error('❌ Erreur createComment:', error);
      console.error('Détails:', error.response?.data);
      throw error;
    }
  },

  /**
   * Liker un commentaire
   */
  likeComment: (id) => api.post(`/interaction/commentaires/${id}/like/`)
};

export default commentService;
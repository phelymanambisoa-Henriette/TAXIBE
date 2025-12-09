// src/services/historiqueService.js

import api from './api';

const historiqueService = {
  /**
   * Récupérer l'historique des recherches
   */
  getSearchHistory: async (params = {}) => {
    try {
      const response = await api.get('/interaction/historiques/', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération historique:', error);
      throw error;
    }
  },

  /**
   * Récupérer les statistiques
   */
  getStats: async (periode = 'semaine') => {
    try {
      const response = await api.get('/interaction/historiques/stats/', {
        params: { periode }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur stats:', error);
      throw error;
    }
  },

  /**
   * Récupérer les trajets les plus recherchés
   */
  getTopTrajets: async (limit = 5, periode = 'semaine') => {
    try {
      const response = await api.get('/interaction/historiques/top-trajets/', {
        params: { limit, periode }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur top trajets:', error);
      throw error;
    }
  },

  /**
   * Récupérer les arrêts les plus recherchés
   */
  getTopArrets: async (limit = 5, periode = 'semaine') => {
    try {
      const response = await api.get('/interaction/historiques/top-arrets/', {
        params: { limit, periode }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur top arrêts:', error);
      throw error;
    }
  },

  /**
   * Supprimer un historique
   */
  deleteHistory: async (id) => {
    try {
      const response = await api.delete(`/interaction/historiques/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Erreur suppression:', error);
      throw error;
    }
  },

  /**
   * Effacer tout l'historique de l'utilisateur
   */
  clearHistory: async () => {
    try {
      const response = await api.delete('/interaction/historiques/clear/');
      return response.data;
    } catch (error) {
      console.error('Erreur clear:', error);
      throw error;
    }
  },

  /**
   * Exporter l'historique
   */
  exportHistory: async (format = 'csv', periode = 'tout') => {
    try {
      const response = await api.get('/interaction/historiques/export/', {
        params: { format, periode },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur export:', error);
      throw error;
    }
  },

  /**
   * Créer une nouvelle entrée d'historique
   */
  createHistory: async (depart, arrivee) => {
    try {
      const response = await api.post('/interaction/historiques/', {
        depart,
        arrivee
      });
      return response.data;
    } catch (error) {
      console.error('Erreur création historique:', error);
      throw error;
    }
  }
};

export default historiqueService;
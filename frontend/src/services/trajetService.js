// src/services/trajetService.js
import api from './api';

const trajetService = {
  /**
   * Récupère tous les bus avec un résumé de leurs trajets
   */
  getAllBusTrajets: async () => {
    try {
      const response = await api.get('/transport/bus-trajets/');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAllBusTrajets:', error);
      throw error;
    }
  },

  /**
   * Récupère le détail complet d'un bus avec tous ses arrêts
   */
  getBusTrajet: async (busId) => {
    try {
      const response = await api.get(`/transport/bus/${busId}/trajets/`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getBusTrajet:', error);
      throw error;
    }
  },

  /**
   * Récupère un bus au format GeoJSON pour la carte
   */
  getBusGeoJSON: async (busId) => {
    try {
      const response = await api.get(`/transport/bus/${busId}/geojson/`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getBusGeoJSON:', error);
      throw error;
    }
  },

  /**
   * Récupère tous les trajets au format GeoJSON
   */
  getAllTrajetsGeoJSON: async (direction = null) => {
    try {
      let url = '/transport/trajets/geojson/';
      if (direction) {
        url += `?direction=${direction}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getAllTrajetsGeoJSON:', error);
      throw error;
    }
  },

  /**
   * Récupère le détail d'un trajet spécifique
   */
  getTrajetDetail: async (trajetId) => {
    try {
      const response = await api.get(`/transport/trajets/${trajetId}/`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getTrajetDetail:', error);
      throw error;
    }
  },
};

export default trajetService;
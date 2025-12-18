// src/services/localisationService.js
import api from './api';

export const localisationService = {
  // ========== ARRETS ==========

  // Tous les arrêts
  getAllArrets: async () => {
    try {
      const response = await api.get('/localisation/arrets/');
      return response;
    } catch (error) {
      console.error('Error fetching arrets:', error);
      throw error;
    }
  },

  // Arrêt par ID
  getArretById: async (id) => {
    try {
      const response = await api.get(`/localisation/arrets/${id}/`);
      return response;
    } catch (error) {
      console.error(`Error fetching arret ${id}:`, error);
      throw error;
    }
  },

  // Créer un arrêt
  createArret: async ({ nomArret, latitude, longitude, villeRef }) => {
    try {
      const payload = { nomArret, latitude, longitude, villeRef };
      const response = await api.post('/localisation/arrets/', payload);
      return response;
    } catch (error) {
      console.error('Error creating arret:', error);
      throw error;
    }
  },

  // ========== VILLES ==========

  // Toutes les villes
  getAllVilles: async () => {
    try {
      const response = await api.get('/localisation/villes/');
      return response;
    } catch (error) {
      console.error('Error fetching villes:', error);
      throw error;
    }
  },

  // Ville par ID
  getVilleById: async (id) => {
    try {
      const response = await api.get(`/localisation/villes/${id}/`);
      return response;
    } catch (error) {
      console.error(`Error fetching ville ${id}:`, error);
      throw error;
    }
  },

  // Créer une ville
  createVille: async ({ nomVille, codePostal, pays }) => {
    try {
      const payload = { nomVille, codePostal, pays };
      const response = await api.post('/localisation/villes/', payload);
      return response;
    } catch (error) {
      console.error('Error creating ville:', error);
      throw error;
    }
  },

  // ========== GEOLOCALISATION BUS (si endpoints présents) ==========

  // Bus proches
  getNearbyBuses: async (latitude, longitude, radius = 5000) => {
    try {
      const response = await api.get('/localisation/nearby/', {
        params: { lat: latitude, lng: longitude, radius },
      });
      return response;
    } catch (error) {
      console.error('Error fetching nearby buses:', error);
      throw error;
    }
  },

  // Mettre à jour la position d'un bus
  updateBusLocation: async (busId, latitude, longitude) => {
    try {
      const response = await api.post('/localisation/update/', {
        bus_id: busId,
        latitude,
        longitude,
      });
      return response;
    } catch (error) {
      console.error('Error updating bus location:', error);
      throw error;
    }
  },
};

export default localisationService;
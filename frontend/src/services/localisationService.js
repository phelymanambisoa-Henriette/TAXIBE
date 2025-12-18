// src/services/localisationService.js - VERSION CORRIGÉE

import api from './api';

const localisationService = {
  // ===== ARRÊTS =====
  
  getAllArrets: async () => {
    try {
      console.log('🔄 getAllArrets - Appel API...');
      const response = await api.get('/transport/arrets/');
      console.log('✅ getAllArrets - Réponse:', response.data.length, 'arrêts');
      return response.data;
    } catch (error) {
      console.error('❌ getAllArrets - Erreur:', error.message);
      throw error;
    }
  },

  getArretById: async (id) => {
    try {
      const response = await api.get(`/transport/arrets/${id}/`);
      return response.data;
    } catch (error) {
      console.error('❌ getArretById - Erreur:', error);
      throw error;
    }
  },

  getNearbyArrets: async (lat, lng, radius = 500) => {
    try {
      const response = await api.get('/transport/arrets/nearby/', {
        params: { lat, lng, radius },
      });
      return response.data;
    } catch (error) {
      console.error('❌ getNearbyArrets - Erreur:', error);
      throw error;
    }
  },

  searchArrets: async (query) => {
    try {
      const response = await api.get('/transport/arrets/search/', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      console.error('❌ searchArrets - Erreur:', error);
      throw error;
    }
  },

  // ===== LIGNES =====

  getAllLignes: async () => {
    try {
      console.log('🔄 getAllLignes - Appel API...');
      const response = await api.get('/transport/lignes/');
      console.log('✅ getAllLignes - Réponse:', response.data.length, 'lignes');
      return response.data;
    } catch (error) {
      console.error('❌ getAllLignes - Erreur:', error);
      throw error;
    }
  },

  getLigneById: async (id) => {
    try {
      const response = await api.get(`/transport/lignes/${id}/`);
      return response.data;
    } catch (error) {
      console.error('❌ getLigneById - Erreur:', error);
      throw error;
    }
  },

  getLignesByArret: async (arretId) => {
    try {
      console.log('🔄 getLignesByArret - Appel API pour arrêt', arretId);
      const response = await api.get(`/transport/arrets/${arretId}/lignes/`);
      console.log('✅ getLignesByArret - Réponse:', response.data.length, 'lignes');
      return response.data;
    } catch (error) {
      console.error('❌ getLignesByArret - Erreur:', error);
      throw error;
    }
  },

  getArretsByLigne: async (ligneId) => {
    try {
      console.log('🔄 getArretsByLigne - Appel API pour ligne', ligneId);
      const response = await api.get(`/transport/lignes/${ligneId}/arrets/`);
      console.log('✅ getArretsByLigne - Réponse:', response.data.length, 'arrêts');
      return response.data;
    } catch (error) {
      console.error('❌ getArretsByLigne - Erreur:', error);
      throw error;
    }
  },

  // ===== ITINÉRAIRES =====

  findItineraire: async (fromArretId, toArretId) => {
    try {
      const response = await api.get('/transport/itineraire/', {
        params: { from: fromArretId, to: toArretId },
      });
      return response.data;
    } catch (error) {
      console.error('❌ findItineraire - Erreur:', error);
      throw error;
    }
  },

  findItineraireFromPosition: async (lat, lng, toArretId) => {
    try {
      const response = await api.get('/transport/itineraire/from-position/', {
        params: { lat, lng, to: toArretId },
      });
      return response.data;
    } catch (error) {
      console.error('❌ findItineraireFromPosition - Erreur:', error);
      throw error;
    }
  },

  findNearestArret: async (lat, lng) => {
    try {
      const response = await api.get('/transport/arrets/nearest/', {
        params: { lat, lng },
      });
      return response.data;
    } catch (error) {
      console.error('❌ findNearestArret - Erreur:', error);
      throw error;
    }
  },

  // ===== VILLES / QUARTIERS =====

  getAllVilles: async () => {
    try {
      const response = await api.get('/transport/villes/');
      return response.data;
    } catch (error) {
      console.error('❌ getAllVilles - Erreur:', error);
      throw error;
    }
  },

  getQuartiersByVille: async (villeId) => {
    try {
      const response = await api.get(`/transport/villes/${villeId}/quartiers/`);
      return response.data;
    } catch (error) {
      console.error('❌ getQuartiersByVille - Erreur:', error);
      throw error;
    }
  },
};

export default localisationService;
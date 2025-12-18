// src/services/busService.js

import api from './api';

const busService = {
  // Récupérer tous les bus
  getAllBus: async () => {
    try {
      console.log('🔄 getAllBus - Appel API...');
      const response = await api.get('/transport/bus/');
      console.log('✅ getAllBus - Réponse:', response.data.length, 'bus');
      return response.data;
    } catch (error) {
      console.error('❌ getAllBus - Erreur:', error);
      throw error;
    }
  },

  // Récupérer un bus par ID
  getBusById: async (id) => {
    try {
      console.log('🔄 getBusById - Appel API pour bus', id);
      const response = await api.get(`/transport/bus/${id}/`);
      console.log('✅ getBusById - Réponse:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ getBusById - Erreur:', error);
      throw error;
    }
  },

  // Créer un bus
  createBus: async (busData) => {
    try {
      const response = await api.post('/transport/bus/', busData);
      return response.data;
    } catch (error) {
      console.error('❌ createBus - Erreur:', error);
      throw error;
    }
  },

  // Mettre à jour un bus
  updateBus: async (id, busData) => {
    try {
      const response = await api.put(`/transport/bus/${id}/`, busData);
      return response.data;
    } catch (error) {
      console.error('❌ updateBus - Erreur:', error);
      throw error;
    }
  },

  // Supprimer un bus
  deleteBus: async (id) => {
    try {
      const response = await api.delete(`/transport/bus/${id}/`);
      return response.data;
    } catch (error) {
      console.error('❌ deleteBus - Erreur:', error);
      throw error;
    }
  },

  // Rechercher des bus
  searchBus: async (query) => {
    try {
      const response = await api.get('/transport/bus/', {
        params: { search: query },
      });
      return response.data;
    } catch (error) {
      console.error('❌ searchBus - Erreur:', error);
      throw error;
    }
  },

  // 🔽 NOUVEAU : Récupérer tous les arrêts desservis par un bus (trajet complet)
  // Cela utilise l’endpoint backend: /transport/lignes/<busId>/arrets/
  getArretsByBus: async (busId) => {
    try {
      console.log('🔄 getArretsByBus - Appel API pour bus', busId);
      const response = await api.get(`/transport/lignes/${busId}/arrets/`);
      console.log('✅ getArretsByBus - Réponse:', response.data.length, 'arrêts');
      return response.data; // tableau d'arrêts: [{id, nom, latitude, longitude, ordre, ...}, ...]
    } catch (error) {
      console.error('❌ getArretsByBus - Erreur:', error);
      throw error;
    }
  },
};

export default busService;
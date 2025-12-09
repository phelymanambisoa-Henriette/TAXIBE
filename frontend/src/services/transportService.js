// src/services/transportService.js

import api from './api';

export const transportService = {
  // Liste tous les bus
  getAllBuses: (params = {}) => api.get('/transport/bus/', { params }),

  // Détail d'un bus
  getBusById: (id) => api.get(`/transport/bus/${id}/`),

  // Détails complets (authentifié)
  getBusDetails: async (id) => {
    const token = localStorage.getItem('access_token');
    return api.get(`/transport/bus/${id}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // 🆕 RECHERCHE D'ITINÉRAIRE (historique enregistré automatiquement côté backend)
  rechercheItineraire: async (departId, arriveeId) => {
    try {
      const response = await api.get('/transport/bus/recherche_itineraire/', {
        params: {
          depart_id: departId,
          arrivee_id: arriveeId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur recherche itinéraire:', error);
      throw error;
    }
  },

  // Alias
  rechercherItineraire: async (departId, arriveeId) => {
    return transportService.rechercheItineraire(departId, arriveeId);
  },

  // CRUD
  createBus: (data) => api.post('/transport/bus/', data),
  updateBus: (id, data) => api.put(`/transport/bus/${id}/`, data),
  deleteBus: (id) => api.delete(`/transport/bus/${id}/`),
};

export default transportService;
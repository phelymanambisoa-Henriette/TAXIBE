// src/services/transportService.js - VERSION COMPLÈTE
import api from './api';

export const transportService = {
  // Liste tous les bus (public)
  getAllBuses: (params = {}) => api.get('/transport/bus/', { params }),

  // Détail d'un bus - VERSION PUBLIQUE (sans auth)
  getBusById: (id) => api.get(`/transport/bus/${id}/`),

  // 🆕 Détails complets - VERSION AUTHENTIFIÉE
  getBusDetails: async (id) => {
    const token = localStorage.getItem('access_token');
    return api.get(`/transport/bus/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // 🆕 RECHERCHE D'ITINÉRAIRE
  rechercheItineraire: async (departId, arriveeId) => {
    return await api.get(`/transport/bus/recherche_itineraire/?depart_id=${departId}&arrivee_id=${arriveeId}`);
  },

  // Optionnels
  getBusStops: (id) => api.get(`/transport/bus/${id}/stops/`),
  getBusTarif: (id) => api.get(`/transport/bus/${id}/tarif/`),
  
  // CRUD
  createBus: (data) => api.post('/transport/bus/', data),
  updateBus: (id, data) => api.put(`/transport/bus/${id}/`, data),
  deleteBus: (id) => api.delete(`/transport/bus/${id}/`),
};

export default transportService;
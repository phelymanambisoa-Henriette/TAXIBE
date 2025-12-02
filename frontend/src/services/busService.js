import api from './api';

export const busService = {
  // Récupérer les bus proches d'une position
  getNearbyBuses: (latitude, longitude, radius = 5000) => {
    return api.get('/bus/nearby', {
      params: {
        lat: latitude,
        lng: longitude,
        radius: radius // en mètres
      }
    });
  },

  // Récupérer tous les bus
  getAllBuses: () => {
    return api.get('/bus');
  },

  // Récupérer un bus par ID
  getBusById: (id) => {
    return api.get(`/bus/${id}`);
  },

  // Récupérer les arrêts d'un bus
  getBusStops: (busId) => {
    return api.get(`/bus/${busId}/stops`);
  },

  // Rechercher des bus
  searchBuses: (query) => {
    return api.get('/bus/search', { params: { q: query } });
  },

  // Obtenir la position en temps réel d'un bus
  getBusRealTimePosition: (busId) => {
    return api.get(`/bus/${busId}/position`);
  }
};
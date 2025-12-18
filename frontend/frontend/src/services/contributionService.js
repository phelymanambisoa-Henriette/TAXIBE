// src/services/contributionService.js
import api from './api';

export const contributionService = {
  // Liste des contributions de l'utilisateur
  async getUserContributions() {
    return await api.get('/interaction/contributions/');
  },

  // Crée une contribution
  async createContribution(data) {
    return await api.post('/interaction/contributions/', data);
  },

  // Détail d'une contribution
  async getContributionById(id) {
    return await api.get(`/interaction/contributions/${id}/`);
  },

  // Met à jour une contribution
  async updateContribution(id, data) {
    return await api.put(`/interaction/contributions/${id}/`, data);
  },

  // Supprime une contribution
  async deleteContribution(id) {
    return await api.delete(`/interaction/contributions/${id}/`);
  },
};

export default contributionService;
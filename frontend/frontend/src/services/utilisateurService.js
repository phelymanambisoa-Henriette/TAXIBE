// src/services/utilisateurService.js

import api from './api';

export const utilisateurService = {
  // Récupérer le profil
  getProfile: async () => {
    const response = await api.get('/utilisateur/me/');
    return response;
  },

  // Mettre à jour le profil - ENDPOINT CORRECT
  updateProfile: async (data, isMultipart = false) => {
    const config = isMultipart 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    
    // TON ENDPOINT EST : /utilisateur/profile/update/
    const response = await api.patch('/utilisateur/profile/update/', data, config);
    return response;
  },

  // Changer le mot de passe
  changePassword: async (data) => {
    const response = await api.post('/utilisateur/change-password/', data);
    return response;
  },

  // Statistiques
  getStats: async () => {
    try {
      const response = await api.get('/utilisateur/stats/');
      return response;
    } catch (error) {
      console.warn('Stats non disponibles:', error);
      return { 
        data: { 
          reputation: 0, 
          favoris_count: 0, 
          contributions_count: 0 
        } 
      };
    }
  },
};

export default utilisateurService;
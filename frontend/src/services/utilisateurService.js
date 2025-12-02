// src/services/utilisateurService.js - VERSION COMPLÈTE ET CORRIGÉE POUR UPLOAD
import api from './api';

const utilisateurService = {
  
  getMe: async function() {
    return await api.get('/utilisateur/me/');
  },

  /**
   * Met à jour le profil. Accepte JSON ou FormData (pour l'avatar).
   * @param {object|FormData} data - Les données du formulaire.
   * @param {boolean} isMultipart - True si l'objet 'data' est un FormData (contient un fichier).
   */
  updateProfile: async function(data, isMultipart = false) {
    const config = {};
    
    // Si nous envoyons un FormData (avec un fichier), nous ne devons PAS spécifier
    // le Content-Type. Axios le fera automatiquement en 'multipart/form-data'.
    if (isMultipart) {
        // Optionnel : s'assurer que le backend accepte PATCH ou PUT
        // On utilisera PATCH pour la mise à jour partielle.
        return await api.patch('/utilisateur/update_profile/', data, config);
    }
    
    // Si c'est du JSON (pas de fichier), on utilise la méthode par défaut.
    return await api.patch('/utilisateur/update_profile/', data);
  },

  changePassword: async function(data) {
    return await api.post('/utilisateur/change_password/', data);
  },

  getStats: async function() {
    return await api.get('/utilisateur/stats/');
  },

  register: async function(userData) {
    return await api.post('/utilisateur/', userData);
  },

  list: async function(params) {
    return await api.get('/utilisateur/', { params });
  },

  // Les autres fonctions de l'admin
  getAllUsers: async function() {
    return await api.get('/utilisateur/');
  },

  getUserById: async function(id) {
    return await api.get(`/utilisateur/${id}/`);
  },

  deleteUser: async function(id) {
    return await api.delete(`/utilisateur/${id}/`);
  },
};

export { utilisateurService };
export default utilisateurService;
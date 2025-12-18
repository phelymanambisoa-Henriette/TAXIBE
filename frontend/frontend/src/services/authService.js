// src/services/authService.js - VERSION COMPLÈTE
const API_URL = 'http://localhost:8000/api';

export const authService = {
  // Connexion
  async login(username, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token reçu');
        
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        
        return { success: true, data };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Identifiants incorrects' };
      }
    } catch (error) {
      console.error('❌ Erreur login:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  // ✅ Vérifie si le token est valide
  isAuthenticated() {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      const isValid = Date.now() < exp;
      
      console.log('🔐 Token valide:', isValid);
      return isValid;
    } catch (e) {
      console.error('❌ Token invalide:', e);
      return false;
    }
  },

  // Déconnexion
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // Récupérer le token
  getToken() {
    return localStorage.getItem('access_token');
  },
};

export default authService;
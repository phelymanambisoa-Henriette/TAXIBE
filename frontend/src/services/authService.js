// services/authService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const authService = {
  login: async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/token/`, {
        username,
        password
      });

      if (response.data) {
        // ✅ Récupérer les infos utilisateur complètes
        const userResponse = await axios.get(`${API_BASE_URL}/user/profile/`, {
          headers: {
            'Authorization': `Bearer ${response.data.access}`
          }
        });

        return {
          ok: true,
          access: response.data.access,
          refresh: response.data.refresh,
          user: {
            ...userResponse.data,
            // ✅ S'assurer que le rôle est bien présent
            role: userResponse.data.role || userResponse.data.user_role,
            is_admin: userResponse.data.is_admin || userResponse.data.is_staff || false
          }
        };
      }
    } catch (error) {
      return {
        ok: false,
        error: error.response?.data?.detail || 'Erreur de connexion'
      };
    }
  },

  // ✅ Nouvelle fonction pour obtenir le rôle
  getUserRole: async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/user/role/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }
};

export default authService;
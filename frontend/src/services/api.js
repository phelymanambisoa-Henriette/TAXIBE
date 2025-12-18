// src/services/api.js - VERSION AMÉLIORÉE

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

// Log de l'URL utilisée au démarrage
console.log('🔗 API Base URL:', API_URL);
console.log('🌍 Environment:', process.env.NODE_ENV);

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 secondes
});

// --- INTERCEPTEUR DE REQUÊTE ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Logs détaillés en mode dev
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 API Request:', {
        method: (config.method || 'get').toUpperCase(),
        url: config.url,
        fullUrl: `${config.baseURL}${config.url}`,
        params: config.params,
        hasAuth: !!config.headers.Authorization,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// --- LOGIQUE DE REFRESH ---
let isRefreshing = false;
let subscribers = [];

const onRefreshed = (newToken) => {
  subscribers.forEach((cb) => cb(newToken));
  subscribers = [];
};

const addSubscriber = (cb) => {
  subscribers.push(cb);
};

// --- INTERCEPTEUR DE RÉPONSE ---
api.interceptors.response.use(
  (res) => {
    // Log succès en mode dev
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', {
        url: res.config.url,
        status: res.status,
        dataType: Array.isArray(res.data) ? `Array(${res.data.length})` : typeof res.data,
      });
    }
    return res;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    
    // Log détaillé des erreurs en mode dev
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: status,
        message: error.message,
        code: error.code,
        responseData: error.response?.data,
      });
      
      // Messages d'aide selon le type d'erreur
      if (error.code === 'ECONNABORTED') {
        console.error('⏱️ TIMEOUT - Le serveur met trop de temps à répondre');
      } else if (error.code === 'ERR_NETWORK') {
        console.error('🌐 ERREUR RÉSEAU - Vérifiez que Django est démarré sur', API_URL);
      } else if (status === 404) {
        console.error('🔍 404 - Route introuvable:', error.config?.url);
        console.error('   Vérifiez backend/urls.py et transport/urls.py');
      } else if (status === 403) {
        console.error('🔒 403 FORBIDDEN - Problème CORS ?');
        console.error('   Vérifiez CORS_ALLOWED_ORIGINS dans settings.py');
      } else if (status === 500) {
        console.error('💥 500 - Erreur serveur Django');
        console.error('   Regardez les logs du terminal Django');
      }
    }

    // Si erreur 401 (Non autorisé) et ce n'est pas déjà une tentative de retry
    if (status === 401 && !originalRequest._retry) {
      
      // Si c'est une erreur sur l'endpoint de login lui-même, on ne fait rien
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/token')) {
        return Promise.reject(error);
      }

      const refresh = localStorage.getItem('refresh_token');

      // Pas de token de refresh ? -> Déconnexion immédiate
      if (!refresh) {
        console.warn('⚠️ Session expirée (Pas de refresh token). Déconnexion.');
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Si un refresh est déjà en cours, on met cette requête en file d'attente
      if (isRefreshing) {
        return new Promise((resolve) => {
          addSubscriber((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        console.log('🔄 Tentative de refresh du token...');
        const resp = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh });
        const newAccess = resp.data?.access;

        if (newAccess) {
          console.log('✅ Token refreshed avec succès');
          localStorage.setItem('access_token', newAccess);
          api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
          onRefreshed(newAccess);
          
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Echec du refresh token. Déconnexion forcée.');
        localStorage.clear();
        window.location.href = '/login';
        return new Promise(() => {});
      } finally {
        isRefreshing = false;
      }
    }

    // Pour toutes les autres erreurs, on laisse passer
    return Promise.reject(error);
  }
);

export default api;
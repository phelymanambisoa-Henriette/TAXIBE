// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- INTERCEPTEUR DE REQUÊTE ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Logs en mode dev seulement pour éviter de polluer
    if (process.env.NODE_ENV === 'development') {
      console.log('API →', (config.method || 'get').toUpperCase(), config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
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
  (res) => res, // Si succès, on renvoie direct
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Si erreur 401 (Non autorisé) et ce n'est pas déjà une tentative de retry
    if (status === 401 && !originalRequest._retry) {
      
      // Si c'est une erreur sur l'endpoint de login lui-même, on ne fait rien (la page login gère l'erreur)
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/token')) {
        return Promise.reject(error);
      }

      const refresh = localStorage.getItem('refresh_token');

      // Pas de token de refresh ? -> Déconnexion immédiate
      if (!refresh) {
        console.warn('Session expirée (Pas de refresh token). Déconnexion.');
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error); // On rejette pour arrêter la chaîne
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
        // Tentative de rafraîchissement
        const resp = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh });
        const newAccess = resp.data?.access;

        if (newAccess) {
          // Succès ! On sauvegarde et on relance les requêtes en attente
          localStorage.setItem('access_token', newAccess);
          api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
          onRefreshed(newAccess);
          
          // On relance la requête originale
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Echec du refresh (Token expiré ou invalide) -> Déconnexion
        console.error('Echec du refresh token. Déconnexion forcée.');
        localStorage.clear(); // On vide tout
        window.location.href = '/login';
        
        // IMPORTANT : On ne rejette pas l'erreur ici pour éviter le crash "Uncaught"
        // On retourne une promesse vide qui ne sera jamais résolue (car on change de page)
        return new Promise(() => {}); 
      } finally {
        isRefreshing = false;
      }
    }

    // Pour toutes les autres erreurs (404, 500, etc.), on laisse passer
    return Promise.reject(error);
  }
);

export default api;
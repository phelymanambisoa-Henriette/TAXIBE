// src/contexts/AuthContext.jsx (COMPLET ET CORRIGÉ)

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- ENSURE PROFILE ---
  const ensureUserProfile = useCallback(async (currentUser) => {
    if (!currentUser || !currentUser.id) return;
    try {
      await api.post('/utilisateur/ensure_profile/', { user_id: currentUser.id });
    } catch (e) {
      console.error("⚠️ Échec de la garantie du profil.", e);
    }
  }, []);

  // --- FETCH USER PROFILE ---
  const fetchMe = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error("Aucun token");

      const res = await api.get('/utilisateur/me/');
      const currentUser = res.data || {};

      // Construire l'URL complète de l'avatar si nécessaire
      let avatarUrl = currentUser.avatar;
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        avatarUrl = avatarUrl.startsWith('/') 
          ? `${baseUrl}${avatarUrl}` 
          : `${baseUrl}/${avatarUrl}`;
      }

      setUser({
        ...currentUser,
        avatar: avatarUrl,
        is_staff: !!currentUser.is_staff,
        is_superuser: !!(currentUser.is_superuser || currentUser.isSuperuser),
        is_staf: !!currentUser.is_staf,
      });

      await ensureUserProfile(currentUser);

    } catch (e) {
      console.warn("Session invalide ou expirée", e);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, [ensureUserProfile]);

  // --- INIT: Charger le profil au démarrage ---
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      fetchMe();
    } else {
      setAuthLoading(false);
    }
  }, [fetchMe]);

  // --- LOGIN ---
  const login = async (username, password) => {
    try {
      const resp = await api.post('/auth/token/', { username, password });
      const { access, refresh } = resp.data || {};

      if (!access || !refresh) throw new Error('Token manquant dans la réponse');

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      api.defaults.headers.common.Authorization = `Bearer ${access}`;

      await fetchMe();
      return { ok: true, success: true };
    } catch (e) {
      console.error('Login error:', e.response?.data || e.message);

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);

      let errorMsg = 'Erreur de connexion';
      if (e.response?.data?.detail) errorMsg = e.response.data.detail;
      else if (e.response?.status === 401) errorMsg = "Identifiants incorrects";

      return { ok: false, success: false, error: errorMsg };
    }
  };

  // --- REGISTER ---
  const register = async (userData, isMultipart = false) => {
    try {
      // Configuration headers si multipart
      const config = isMultipart
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};

      // Appel API inscription
      const response = await api.post('/utilisateur/register/', userData, config);

      if (response.status === 201 || response.status === 200) {
        // Extraire username et password pour auto-login
        const username = isMultipart ? userData.get('username') : userData.username;
        const password = isMultipart ? userData.get('password') : userData.password;

        if (username && password) {
          // Auto-login après inscription
          const loginResult = await login(username, password);
          return loginResult;
        }

        return { ok: true, success: true, message: "Inscription réussie. Veuillez vous connecter." };
      }

      return { ok: false, success: false, error: 'Erreur lors de l\'inscription' };

    } catch (e) {
      console.error("Register error:", e.response?.data || e.message);

      let msg = "Erreur lors de l'inscription";

      if (e.response?.data) {
        const data = e.response.data;
        if (typeof data === 'string') {
          msg = data;
        } else if (data.detail) {
          msg = data.detail;
        } else {
          // Récupérer la première erreur
          const firstKey = Object.keys(data)[0];
          const firstError = data[firstKey];
          if (Array.isArray(firstError)) {
            msg = `${firstKey}: ${firstError[0]}`;
          } else if (typeof firstError === 'string') {
            msg = firstError;
          }
        }
      }

      return { ok: false, success: false, error: msg };
    }
  };

  // --- LOGOUT ---
  const logout = useCallback((redirect = true) => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete api.defaults.headers.common.Authorization;
    setUser(null);

    if (redirect) {
      window.location.href = '/login';
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    authLoading,
    login,
    register,
    logout,
    checkAuth: fetchMe,
    refreshProfile: fetchMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
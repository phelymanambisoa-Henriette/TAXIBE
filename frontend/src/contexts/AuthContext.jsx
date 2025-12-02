// src/contexts/AuthContext.jsx (COMPLET)
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- ENSURE PROFILE (Fonction pour garantir l'existence du profil Utilisateur) ---
  const ensureUserProfile = useCallback(async (currentUser) => {
    if (!currentUser || !currentUser.id) return;
    try {
        await api.post('/utilisateur/ensure_profile/', { user_id: currentUser.id });
    } catch (e) {
        console.error("⚠️ Échec de la garantie du profil.", e);
    }
  }, []);


  // --- FETCH USER PROFILE ---
  // VERSION améliorée du fetchMe
const fetchMe = useCallback(async () => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error("Aucun token");

    // ✨ Appel API
    const res = await api.get('/utilisateur/me/');
    const currentUser = res.data || {};

    setUser({
      ...currentUser,
      is_staff: !!currentUser.is_staff,
      is_superuser: !!(currentUser.is_superuser || currentUser.isSuperuser),
      is_staf: !!currentUser.is_staf,
    });

    await ensureUserProfile(currentUser); 

  } catch (e) {
    console.warn("Session invalide ou expirée", e);

    // ✅ Supprime les données invalides du localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // 🔄 Optionnel : forcer redirection automatique
    // window.location.href = '/login';

    setUser(null);
  } finally {
    setAuthLoading(false);
  }
}, [ensureUserProfile]);
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
      return { ok: true };
    } catch (e) {
      console.error('Login error:', e.response?.data || e.message);
      
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      
      let errorMsg = 'Erreur de connexion';
      if(e.response?.data?.detail) errorMsg = e.response.data.detail;
      else if(e.response?.status === 401) errorMsg = "Identifiants incorrects";
      
      return { ok: false, error: errorMsg };
    }
  };

  // --- REGISTER (Mise à jour pour gérer FormData) ---
  const register = async (userData, isMultipart = false) => {
    try {
      // Configuration pour MultiPart si un fichier est présent (image avatar)
      const config = {};
      if (isMultipart) {
          // Si c'est multipart, Axios envoie le Content-Type: multipart/form-data
          // Aucune modification de header n'est nécessaire ici.
      }
      
      await api.post('/utilisateur/register/', userData, config);
      
      // Après inscription réussie, tentez de vous connecter pour obtenir les tokens.
      // Extrayez le username et le password du payload (qui peut être FormData ou JSON)
      const username = isMultipart ? userData.get('username') : userData.username;
      const password = isMultipart ? userData.get('password') : userData.password;
      
      if (!username || !password) {
         // Cela arrive si l'API d'inscription renvoie 201 mais ne fournit pas les identifiants pour l'auto-login.
         return { ok: true, success: true, message: "Inscription réussie. Veuillez vous connecter." };
      }

      // Auto-login (qui assurera la création/garantie du profil)
      return await login(username, password);
      
    } catch (e) {
      console.error("Register error:", e.response?.data || e.message);
      let msg = "Erreur lors de l'inscription";
      
      if (e.response?.data) {
        const firstKey = Object.keys(e.response.data)[0];
        const firstError = e.response.data[firstKey];
        if(Array.isArray(firstError)) msg = `${firstKey}: ${firstError[0]}`;
        else if(typeof firstError === 'string') msg = firstError;
      }
      return { ok: false, error: msg, success: false }; 
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
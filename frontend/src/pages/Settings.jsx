// src/pages/Settings.jsx (COMPLET et THÈME CORRIGÉ)
import React, { useState, useEffect } from 'react';
import { FaUserCog, FaPalette, FaTrash, FaSync, FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // État local pour l'affichage du thème actuel
  const [currentTheme, setCurrentTheme] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // 🔥 Logique du Thème (Rendue locale car elle manipule le DOM) 🔥
  const handleThemeToggle = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setCurrentTheme(next);
  };

  useEffect(() => {
    // Lire l'attribut data-theme actuel au chargement
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    setCurrentTheme(theme);
    
    // Attacher un observateur pour mettre à jour l'état si le thème est changé via le header
    const observer = new MutationObserver(() => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        setCurrentTheme(current);
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

  // Logique Cache (reprise du Header)
  const clearLocalCacheSafe = () => {
    if (!window.confirm("Voulez-vous vider le cache local ? Vos préférences (mais PAS votre session) seront réinitialisées.")) return;

    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    const userJSON = localStorage.getItem('user');
    
    localStorage.clear();
    sessionStorage.clear();
    
    if (access) localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
    if (userJSON) localStorage.setItem('user', userJSON);
    
    alert('✅ Cache utilisateur nettoyé. Actualisation recommandée.');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Êtes-vous SÛR de vouloir supprimer votre compte ? Cette action est irréversible.")) return;

    setIsDeleting(true);
    try {
      // NOTE: Appel API réel à implémenter ici
      
      logout(false); 
      alert('✅ Votre compte a été supprimé. Merci d\'avoir utilisé TaxiBe.');
      navigate('/register'); 

    } catch (error) {
      alert('❌ Erreur lors de la suppression du compte.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        
        {/* HEADER */}
        <div className="settings-header">
          <h1><FaUserCog /> Paramètres Utilisateur</h1>
          <p>Gérez vos préférences et votre compte.</p>
        </div>

        <div className="settings-grid">
          
          {/* CARTE 1 : Préférences d'affichage */}
          <div className="settings-card">
            <h2><FaPalette /> Apparence</h2>
            
            <div className="setting-item-row">
                <span className="setting-label">Thème Actuel : 
                    <strong className={`theme-status ${currentTheme}`}>
                        {currentTheme === 'dark' ? 'Sombre' : 'Clair'}
                    </strong>
                </span>
                <button 
                    onClick={handleThemeToggle} 
                    className="btn-action primary"
                    title="Bascule entre le mode sombre et clair"
                >
                    {currentTheme === 'dark' ? <FaSun /> : <FaMoon />} Basculer
                </button>
            </div>

            <div className="setting-description">
                Modifie l'apparence de l'interface complète (Le thème est appliqué sur toutes les pages).
            </div>
          </div>
          
          {/* CARTE 2 : Gestion du cache */}
          <div className="settings-card">
            <h2><FaSync /> Données Locales</h2>
            
            <div className="setting-item-row">
                <span className="setting-label">Nettoyer le cache</span>
                <button 
                    onClick={clearLocalCacheSafe} 
                    className="btn-action secondary"
                >
                    Vider le cache
                </button>
            </div>
            <div className="setting-description">
                Supprime les données temporaires (sauf les tokens de connexion) pour résoudre les bugs d'affichage.
            </div>
          </div>

          {/* CARTE 3 : Danger Zone */}
          <div className="settings-card danger-zone">
            <h2><FaTrash /> Gestion du Compte</h2>
            
            <div className="setting-item-row">
                <span className="setting-label">Suppression du compte</span>
                <button 
                    onClick={handleDeleteAccount} 
                    className="btn-action danger"
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Suppression...' : 'Supprimer mon compte'}
                </button>
            </div>
            <div className="setting-description">
                Attention : Supprimer votre compte est irréversible.
            </div>
          </div>
          
        </div>

        <div className="settings-footer">
            <button onClick={() => logout()} className="btn-logout-full">
                <FaSignOutAlt /> Déconnexion Complète
            </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
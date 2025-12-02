// src/components/layout/Header.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { HiSearch, HiHome, HiQuestionMarkCircle, HiChevronDown, HiLogout, HiUser, HiCog } from 'react-icons/hi';
import { FaBus, FaBell, FaEllipsisV, FaUser as FaUserIcon, FaSun, FaMoon } from 'react-icons/fa';

import { interactionService } from '../../services/interactionService';
import { contributionService } from '../../services/contributionService';

import './Header.css';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Nouveaux états séparés pour le contrôle des menus
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false); // Menu Profil/Déconnexion
  const [showSettingsMenu, setShowSettingsMenu] = useState(false); // Menu 3 points (Paramètres/Aide)
  
  // Refs pour la fermeture au clic hors zone
  const notificationsRef = useRef(null);
  const profileToggleRef = useRef(null); // Ref pour le bouton Profil/Nom
  const settingsToggleRef = useRef(null); // Ref pour le bouton 3 points

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  // Fermer les menus au clic extérieur (Rendu plus robuste)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Clôture des menus de manière indépendante
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileToggleRef.current && !profileToggleRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (settingsToggleRef.current && !settingsToggleRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Logique du Thème
  const handleThemeToggle = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };
  
  const clearLocalCacheSafe = () => { /* Logique Cache */ };
  
  // Logique de navigation/fermeture pour le menu 3 points
  const handleSettingsAction = (path) => {
      // Ferme le menu 3 points
      setShowSettingsMenu(false); 
      
      if (path === 'theme') {
          handleThemeToggle();
      } else if (path === 'cache') {
          clearLocalCacheSafe();
      } else {
          navigate(path);
      }
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  // Logique Notifs (simplifiée pour le fonctionnement des boutons)
  const loadNotifications = async () => { /* ... */ };
  useEffect(() => { loadNotifications(); const id = setInterval(loadNotifications, 30000); return () => clearInterval(id); }, [isAuthenticated]);
  const unreadCount = 1; // On garde un count pour l'affichage
  const itemsNotif = useMemo(() => [], []); 
  const markAllRead = () => { /* ... */ };
  const handleNotificationClick = (item) => { /* ... */ };
  const timeAgo = () => '';


  return (
    <header className="header">
      <div className="header-container">
        
        {/* LOGO */}
        <Link to="/" className="header-logo">
          <div className="logo-icon"><FaBus /></div>
          <span className="logo-text">Taxi<span className="highlight">Be</span></span>
        </Link>

        {/* NAVIGATION */}
        <nav className="header-nav">
          <Link to="/" className={`nav-link ${isActive('/')}`}>
            <HiHome /> Accueil
          </Link>
          <Link to="/search" className={`nav-link ${isActive('/search')}`}>
            <HiSearch /> Recherche
          </Link>
        </nav>

        {/* ACTIONS DROITE */}
        <div className="header-actions">
          {!isAuthenticated ? (
            <div className="auth-buttons"> {/* ... */} </div>
          ) : (
            <div className="user-section">
              

              {/* Cloche notifications */}
              <div className="client-notif-container" ref={notificationsRef}>
                <button
                  className={`client-bell-btn ${showNotifications ? 'active' : ''} ${unreadCount > 0 ? 'ringing' : ''}`}
                  onClick={() => setShowNotifications((s) => !s)}
                  aria-label="Notifications" title="Notifications"
                >
                  <FaBell />
                  {unreadCount > 0 && (<span className="client-badge ping">{unreadCount}</span>)}
                </button>

                {showNotifications && (
                  <div className="notification-panel"> {/* ... Notif content ... */} </div>
                )}
              </div>

              {/* Paramètres (3 points) */}
              <div className="client-settings-container" ref={settingsToggleRef}> {/* 🔥 Ref OK */}
                <button
                  className={`client-ellipsis-btn ${showSettingsMenu ? 'active' : ''}`}
                  onClick={() => { setShowSettingsMenu((s) => !s); setShowProfileMenu(false); }} /* 🔥 Faux tous les autres menus */
                  title="Paramètres et Aide"
                  aria-label="Paramètres et Aide"
                >
                  <FaEllipsisV />
                </button>

                {showSettingsMenu && (
                  <div className="client-settings-panel">
                    {/* Les actions spécifiques du menu 3 points */}
                    <button className="settings-item" onClick={() => handleSettingsAction('theme')}>
                      <FaSun /> / <FaMoon /> Basculer Thème
                    </button>
                    <button className="settings-item" onClick={() => handleSettingsAction('cache')}>
                      <HiCog /> Nettoyer cache local
                    </button>
                    <Link className="settings-item" to="/settings" onClick={() => handleSettingsAction('/settings')}>
                      <HiCog /> Préférences
                    </Link>
                    <Link className="settings-item" to="/help" onClick={() => handleSettingsAction('/help')}>
                      <HiQuestionMarkCircle /> Aide & Support
                    </Link>
                  </div>
                )}
              </div>

              {/* Menu Utilisateur PRINCIPAL (Profil et Déconnexion) */}
              <div className="user-menu-container" ref={profileToggleRef}> {/* 🔥 Ref OK */}
                <button
                  className={`user-profile-toggle ${showProfileMenu ? 'active' : ''}`}
                  onClick={() => { setShowProfileMenu((s) => !s); setShowSettingsMenu(false); }} /* 🔥 Faux les autres menus */
                  aria-label="Menu utilisateur"
                >
                  <div className="user-avatar">
                    {user?.avatar ? (<img src={user.avatar} alt="avatar" />) : (<span>{user?.username?.charAt(0).toUpperCase() || <FaUserIcon />}</span>)}
                  </div>
                  <span className="user-name">{user?.username || 'User'}</span>
                  <HiChevronDown className="toggle-arrow" />
                </button>

                {showProfileMenu && (
                  <div className="user-menu-panel profile-only">
                    
                    <div className="user-profile-summary">
                      <div className="user-avatar medium">
                        {user?.avatar ? (<img src={user.avatar} alt="avatar" />) : (<span>{user?.username?.charAt(0).toUpperCase()}</span>)}
                      </div>
                      <div className="user-details">
                        <h4>{user?.username || 'User'}</h4>
                        <p>{user?.email || ''}</p>
                      </div>
                    </div>
                    
                    <div className="menu-separator"></div>

                    <Link to="/profil" className="menu-item" onClick={() => setShowProfileMenu(false)}>
                      <HiUser className="item-icon" /> Mon profil
                    </Link>

                    <div className="menu-separator"></div>

                    <button className="menu-item logout" onClick={handleLogout}>
                      <HiLogout className="item-icon" /> Déconnexion
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
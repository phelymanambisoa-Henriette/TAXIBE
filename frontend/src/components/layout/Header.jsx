// src/components/layout/Header.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  HiSearch, 
  HiHome, 
  HiQuestionMarkCircle, 
  HiChevronDown, 
  HiLogout, 
  HiUser, 
  HiCog 
} from 'react-icons/hi';
import { 
  FaBell, 
  FaEllipsisV, 
  FaUser as FaUserIcon 
} from 'react-icons/fa';

import { useLanguage } from '../../contexts/LanguageContext'; // ← UNIQUE import
import './Header.css';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage(); // ← Hook langue global

  const location = useLocation();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationsRef = useRef(null);
  const profileToggleRef = useRef(null);
  const settingsToggleRef = useRef(null);

  const isActive = (path) => (location.pathname === path ? 'active' : '');

  const handleResetWelcome = () => {
    localStorage.removeItem('taxibe_visited');
    setShowSettingsMenu(false);
    navigate('/welcome');
  };

  const handleThemeToggle = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setShowSettingsMenu(false);
  };

  const clearLocalCacheSafe = () => {
    try {
      const keysToKeep = ['theme', 'taxibe_visited', 'access_token', 'refresh_token', 'language'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      alert('Cache effacé avec succès');
      setShowSettingsMenu(false);
    } catch (error) {
      console.error('Erreur nettoyage cache:', error);
    }
  };

  const handleSettingsAction = (action) => {
    if (action === 'theme') return handleThemeToggle();
    if (action === 'cache') return clearLocalCacheSafe();
    if (action === 'reset-welcome') return handleResetWelcome();
    navigate(action);
    setShowSettingsMenu(false);
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    if (diff < 60) return 'À l’instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return `Il y a ${Math.floor(diff / 86400)} j`;
  };

  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    const mockNotifs = [
      {
        id: 1,
        type: 'info',
        message: 'Bienvenue sur TaxiBe !',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: false,
      },
    ];
    setNotifications(mockNotifs);
    setUnreadCount(mockNotifs.filter((n) => !n.isRead).length);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notif) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setShowNotifications(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
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

  const languageOptions = [
    { code: 'fr', label: 'Français' },
    { code: 'mg', label: 'Malagasy' },
    { code: 'en', label: 'English' },
  ];

  return (
    <header className="header">
      <div className="header-container">
        
        {/* NAVIGATION */}
        <nav className="header-nav">
          <Link to="/home" className={`nav-link ${isActive('/home')}`}>
            <HiHome /> {t('nav.home') || 'Accueil'}
          </Link>
          <Link to="/search" className={`nav-link ${isActive('/search')}`}>
            <HiSearch /> {t('nav.search') || 'Recherche'}
          </Link>
        </nav>

        {/* ACTIONS DROITE */}
        <div className="header-actions">

          {!isAuthenticated ? (
            <div className="auth-buttons">
              <Link to="/register" className="btn-register">
                S'inscrire
              </Link>
            </div>
          ) : (
            <div className="user-section">
              {/* NOTIFS */}
              <div className="client-notif-container" ref={notificationsRef}>
                <button
                  className={`client-bell-btn ${showNotifications ? 'active' : ''} ${
                    unreadCount > 0 ? 'ringing' : ''
                  }`}
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                    setShowSettingsMenu(false);
                  }}
                  aria-label={t('nav.notifications') || 'Notifications'}
                >
                  <FaBell />
                  {unreadCount > 0 && (
                    <span className="client-badge ping">{unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notification-panel">
                    <div className="notif-header">
                      <h4>{t('nav.notifications') || 'Notifications'}</h4>
                      {unreadCount > 0 && (
                        <button className="mark-all-read" onClick={markAllRead}>
                          {t('nav.markAllRead') || 'Tout marquer lu'}
                        </button>
                      )}
                    </div>
                    <div className="notif-list">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`notif-item ${notif.isRead ? 'read' : 'unread'}`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            <p>{notif.message}</p>
                            <span className="notif-time">{timeAgo(notif.timestamp)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="no-notif">
                          {t('nav.noNotifications') || 'Aucune notification'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PARAMÈTRES */}
              <div className="client-settings-container" ref={settingsToggleRef}>
                <button
                  className={`client-ellipsis-btn ${showSettingsMenu ? 'active' : ''}`}
                  onClick={() => {
                    setShowSettingsMenu(!showSettingsMenu);
                    setShowProfileMenu(false);
                    setShowNotifications(false);
                  }}
                  title={t('nav.preferences') || 'Préférences'}
                >
                  <FaEllipsisV />
                </button>
                {showSettingsMenu && (
                  <div className="client-settings-panel">
                    <button
                      className="settings-item"
                      onClick={() => handleSettingsAction('/settings')}
                    >
                      <HiCog /> {t('nav.preferences') || 'Préférences'}
                    </button>
                    <button
                      className="settings-item"
                      onClick={() => handleSettingsAction('/help')}
                    >
                      <HiQuestionMarkCircle /> {t('nav.help') || 'Aide & Support'}
                    </button>
                    <button
                      className="settings-item"
                      onClick={() => handleSettingsAction('theme')}
                    >
                      🌓 {t('nav.theme') || 'Changer thème'}
                    </button>
                    <button
                      className="settings-item"
                      onClick={() => handleSettingsAction('reset-welcome')}
                    >
                      🔄 {t('nav.resetWelcome') || 'Revoir intro'}
                    </button>

                    <div className="menu-separator"></div>
                    <div className="settings-section-title">
                      {t('nav.language') || 'Langue'}
                    </div>
                    <div className="settings-lang-options">
                      {languageOptions.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          className={
                            'settings-lang-btn' +
                            (language === lang.code ? ' active' : '')
                          }
                          onClick={() => setLanguage(lang.code)}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>

                    <div className="menu-separator"></div>
                    <button
                      className="settings-item danger"
                      onClick={() => handleSettingsAction('cache')}
                    >
                      🗑️ {t('nav.clearCache') || 'Effacer cache'}
                    </button>
                  </div>
                )}
              </div>

              {/* PROFIL */}
              <div className="user-menu-container" ref={profileToggleRef}>
                <button
                  className={`user-profile-toggle ${showProfileMenu ? 'active' : ''}`}
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowSettingsMenu(false);
                    setShowNotifications(false);
                  }}
                >
                  <div className="user-avatar">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="avatar" />
                    ) : (
                      <span>
                        {user?.username?.charAt(0).toUpperCase() || <FaUserIcon />}
                      </span>
                    )}
                  </div>
                  <span className="user-name">{user?.username || 'User'}</span>
                  <HiChevronDown className="toggle-arrow" />
                </button>

                {showProfileMenu && (
                  <div className="user-menu-panel profile-only">
                    <div className="user-profile-summary">
                      <div className="user-avatar medium">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="avatar" />
                        ) : (
                          <span>{user?.username?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="user-details">
                        <h4>{user?.username || 'User'}</h4>
                        <p>{user?.email || ''}</p>
                      </div>
                    </div>
                    <div className="menu-separator"></div>
                    <Link
                      to="/profil"
                      className="menu-item"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <HiUser className="item-icon" /> {t('nav.profile') || 'Mon profil'}
                    </Link>
                    <Link
                      to="/profil/historique"
                      className="menu-item"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      🕓 Historique des recherches
                    </Link>
                    <div className="menu-separator"></div>
                    <button className="menu-item logout" onClick={handleLogout}>
                      <HiLogout className="item-icon" /> {t('nav.logout') || 'Déconnexion'}
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
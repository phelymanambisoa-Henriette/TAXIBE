// src/components/layout/AdminLayout.jsx
import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaChartLine,
  FaClipboardList,
  FaComments,
  FaArrowLeft,
  FaHistory,
  FaUsers,
  FaExclamationTriangle,
  FaBus,
  FaSignOutAlt,
  FaBell,
  FaSun,
  FaMoon,
  FaTimes,
  FaChevronRight,
  FaUser,
  FaEllipsisV
} from 'react-icons/fa';
import { HiQuestionMarkCircle } from 'react-icons/hi';
import './AdminLayout.css';

// Services notifications
import { interactionService } from '../../services/interactionService';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Notifs / Settings
  const [showNotif, setShowNotif] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const notifRef = useRef(null);
  const settingsRef = useRef(null);

  // Données des notifications
  const [pendingContribCount, setPendingContribCount] = useState(0);
  const [openReportsCount, setOpenReportsCount] = useState(0);
  const [latestComments, setLatestComments] = useState([]);
  const unreadTotal = pendingContribCount + openReportsCount;

  const loadNotifications = async () => {
    try {
      let c = [];
      try { c = await interactionService.adminListContributions({ status: 'En attente' }); } catch {}
      setPendingContribCount(Array.isArray(c) ? c.length : 0);

      let r = [];
      try { r = await interactionService.adminListReports({ status: 'open' }); } catch {}
      setOpenReportsCount(Array.isArray(r) ? r.length : 0);

      let cm = [];
      try { cm = await interactionService.getComments({}); } catch {}
      setLatestComments(Array.isArray(cm) ? cm.slice(0, 5) : []);
    } catch {}
  };

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 30000);
    return () => clearInterval(id);
  }, []);

  // Fermer dropdowns au clic externe
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Paramètres
  const handleThemeToggle = () => {
    const current = localStorage.getItem('theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const clearLocalCacheSafe = () => {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    const userJSON = localStorage.getItem('user');
    localStorage.clear();
    if (access) localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
    if (userJSON) localStorage.setItem('user', userJSON);
    sessionStorage.clear();
    alert('Cache nettoyé (tokens préservés).');
  };

  const handleLogout = () => {
    if (window.confirm("Déconnexion de l'admin ?")) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="admin-layout" data-admin-layout>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="admin-logo-text">
            TAXI<span className="green-dot">BE</span> <span className="badge-pro">ADMIN</span>
          </div>
        </div>

        <div className="sidebar-menu">
          <p className="menu-label">ANALYSE</p>
          <NavLink to="/admin" end className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <FaChartLine /> Dashboard
          </NavLink>

          <p className="menu-label">GESTION</p>
          <NavLink to="/admin/bus" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <FaBus /> Flotte & Bus
          </NavLink>
          <NavLink to="/admin/utilisateurs" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <FaUsers /> Utilisateurs
          </NavLink>

          <p className="menu-label">MODÉRATION</p>
          <NavLink to="/admin/commentaires" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <FaComments /> Commentaires
          </NavLink>
          <NavLink to="/admin/contributions" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <FaClipboardList /> Contributions
          </NavLink>
          <NavLink to="/admin/signalements" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <FaExclamationTriangle /> Signalements
          </NavLink>

          <p className="menu-label">SYSTÈME</p>
          <NavLink to="/admin/historiques" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <FaHistory /> Logs Historique
          </NavLink>
        </div>

        <div className="sidebar-footer">
          <Link to="/" className="btn-back-site">
            <FaArrowLeft /> Retour Site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <h3 className="page-title">Panneau de Contrôle</h3>
          </div>

          <div className="topbar-right">
            {/* Aide (séparée) */}
            <Link to="/help" className="help-btn" title="Aide & Support" aria-label="Aide">
              <HiQuestionMarkCircle />
            </Link>

            {/* Cloche notifications (icône cloche, pas de bouton rond) */}
            <div className="notif-container" ref={notifRef}>
              <button
                className={`bell-btn ${showNotif ? 'active' : ''} ${unreadTotal > 0 ? 'ringing' : ''}`}
                onClick={() => setShowNotif(s => !s)}
                title="Notifications"
                aria-label="Notifications"
              >
                <FaBell />
                {unreadTotal > 0 && <span className="badge ping">{unreadTotal}</span>}
              </button>

              {showNotif && (
                <div className="notif-panel">
                  <div className="panel-section">
                    <div className="panel-title">
                      Contributions en attente
                      <span className="count">{pendingContribCount}</span>
                    </div>
                    <Link className="panel-link" to="/admin/contributions" onClick={() => setShowNotif(false)}>
                      Gérer <FaChevronRight />
                    </Link>
                  </div>

                  <div className="panel-section">
                    <div className="panel-title">
                      Signalements ouverts
                      <span className="count warn">{openReportsCount}</span>
                    </div>
                    <Link className="panel-link" to="/admin/signalements" onClick={() => setShowNotif(false)}>
                      Gérer <FaChevronRight />
                    </Link>
                  </div>

                  <div className="panel-section">
                    <div className="panel-title">Derniers commentaires</div>
                    <div className="panel-list">
                      {latestComments.length === 0 ? (
                        <div className="panel-empty">Aucun commentaire récent</div>
                      ) : (
                        latestComments.map((c) => {
                          const username = c.username || c.user?.username || 'Utilisateur';
                          const txt = (c.contenu || c.text || '').slice(0, 80);
                          return (
                            <div className="panel-item" key={c.id || `${username}-${txt}`}>
                              <div className="avatar">{(username[0] || 'U').toUpperCase()}</div>
                              <div className="item-col">
                                <div className="item-title">{username}</div>
                                <div className="item-sub">{txt}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="panel-actions">
                    <button className="btn-small" onClick={loadNotifications}>Actualiser</button>
                    <button className="btn-small ghost" onClick={() => setShowNotif(false)}>
                      Fermer <FaTimes />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Paramètres (3 points) séparés du profil */}
            <div className="settings-container" ref={settingsRef}>
              <button
                className={`ellipsis-btn ${showSettings ? 'active' : ''}`}
                onClick={() => setShowSettings(s => !s)}
                title="Paramètres"
                aria-label="Paramètres"
              >
                <FaEllipsisV />
              </button>

              {showSettings && (
                <div className="settings-panel">
                  <button className="settings-item" onClick={handleThemeToggle}>
                    <FaSun /> / <FaMoon /> Basculer thème
                  </button>
                  <button className="settings-item" onClick={clearLocalCacheSafe}>
                    Nettoyer cache local
                  </button>
                  <Link className="settings-item" to="/admin" onClick={() => setShowSettings(false)}>
                    Préférences admin
                  </Link>
                </div>
              )}
            </div>

            {/* Profil (affichage simple) */}
            <div className="admin-profile">
              <div className="admin-avatar">
                {user?.username ? user.username.charAt(0).toUpperCase() : <FaUser />}
              </div>
              <span className="admin-name">{user?.username || 'Admin'}</span>
            </div>

            <button onClick={handleLogout} className="btn-logout-icon" title="Déconnexion">
              <FaSignOutAlt />
            </button>
          </div>
        </header>

        {/* Contenu */}
        <div className="admin-content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
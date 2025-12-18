import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; // Ajout useNavigate
import { useAuth } from '../../contexts/AuthContext';
import { 
  HiMap,
  HiLocationMarker,
  HiChatAlt2,
  HiHand,
  HiViewList,
  HiGlobeAlt,
  HiShieldCheck,
  HiLogout // ✅ Nouvelle icône
} from 'react-icons/hi';
import './Sidebar.css';

// Import du logo
import logoTaxibe from '../../assets/logo-taxibe.png'; 

function Sidebar() {
  const { isAuthenticated, user, logout } = useAuth(); // ✅ Ajout logout
  const navigate = useNavigate();

  const isAdmin = !!(user?.is_staff || user?.isSuperuser || user?.is_staf);

  // ✅ Fonction de déconnexion
  const handleLogout = () => {
    if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
      logout();
      navigate('/login');
    }
  };

  return (
    <aside className="sidebar">
      
      {/* LOGO */}
      <div className="sidebar-logo-container">
        <img src={logoTaxibe} alt="TaxiBe Logo" className="sidebar-logo-img" />
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-nav">
        <NavLink to="/carte" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <HiGlobeAlt className="link-icon" />
          <span className="link-text">Carte Interactive</span>
        </NavLink>

        <NavLink to="/nearby" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <HiLocationMarker className="link-icon" />
          <span className="link-text">Bus proches</span>
        </NavLink>

        <NavLink to="/transport" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <HiViewList className="link-icon" />
          <span className="link-text">Liste des bus</span>
        </NavLink>

        <NavLink to="/commentaires" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <HiChatAlt2 className="link-icon" />
          <span className="link-text">Commentaires</span>
        </NavLink>

        <NavLink to="/contribution" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <HiHand className="link-icon" />
          <span className="link-text">Contribution</span>
        </NavLink>

        {isAdmin && (
          <div className="admin-section">
            <div className="sidebar-divider"></div>
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'sidebar-link admin-link active' : 'sidebar-link admin-link'}>
              <HiShieldCheck className="link-icon" />
              <span className="link-text">Administration</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* FOOTER (Login ou Logout) */}
      <div className="sidebar-footer">
        {isAuthenticated ? (
          /* ✅ BOUTON DECONNEXION */
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <HiLogout /> Se déconnecter
          </button>
        ) : (
          /* BOUTON CONNEXION */
          <>
            <p>Connectez-vous pour plus de fonctionnalités</p>
            <NavLink to="/login" className="sidebar-login-btn">Se connecter</NavLink>
          </>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
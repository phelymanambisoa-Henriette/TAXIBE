import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo-taxibe.png'; // Remplace par ton logo réel
import './Welcome.css'; // Crée ce fichier pour les styles

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <img src={logo} alt="Logo TaxiBe" className="welcome-logo" />

        <h1 className="welcome-title">
          Bienvenue sur <span className="highlight">TaxiBe</span> !
        </h1>
        <p className="welcome-subtitle">
          Explorez l'application librement, sans compte.
        </p>

        <div className="button-group">
          <button className="btn-primary" onClick={() => navigate('/register')}>
            📝 S’inscrire
          </button>
          <button className="btn-secondary" onClick={() => navigate('/transport')}>
            🚍 Voir la liste des bus
          </button>
          <button className="btn-secondary" onClick={() => navigate('/carte')}>
            📍 Se localiser
          </button>
          <button className="btn-outline" onClick={() => navigate('/login')}>
            🔑 Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
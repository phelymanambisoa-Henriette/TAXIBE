import React from 'react';
import { useLocation } from '../../contexts/LocationContext';
import './Header.css'; // Ajustez le chemin si nécessaire

function Header() {
  const { position, getLocation } = useLocation();

  const handleGetLocation = () => {
    getLocation();
  };

  return (
    <header className="header">
      <div className="header-container">
        <h1 className="header-title">Mon Application</h1>
        
        <div className="location-section">
          <button 
            onClick={handleGetLocation}
            className="location-btn"
          >
            📍 Obtenir ma position
          </button>
          
          {position && (
            <div className="location-info">
              <p>Latitude: {position.latitude.toFixed(6)}</p>
              <p>Longitude: {position.longitude.toFixed(6)}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
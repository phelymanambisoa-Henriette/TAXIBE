import React, { useEffect } from 'react';
import { useLocation } from '../../contexts/LocationContext'; // ✅ Changé
import BusMap from './BusMap';
import './MapView.css';

const MapView = () => {
  const { location, getCurrentLocation, loading, error } = useLocation(); // ✅ Utilisation du hook

  useEffect(() => {
    if (!location) {
      getCurrentLocation();
    }
  }, [location, getCurrentLocation]);

  return (
    <div className="map-container">
      <div className="map-view-header">
        <h1>🗺️ Carte des transports</h1>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ Erreur : {error}
        </div>
      )}

      {loading && !location ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Obtention de la position en cours...</p>
        </div>
      ) : location ? (
        <>
          <div className="position-info">
            <p> Position actuelle : {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
            <button onClick={getCurrentLocation} className="btn-refresh">
              🔄 Actualiser
            </button>
          </div>
          
          <BusMap 
            showAllBuses={true}
            showStops={true}
          />
        </>
      ) : (
        <div className="no-location">
          <p>Impossible d'obtenir votre position</p>
          <button onClick={getCurrentLocation} className="btn-retry">
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
};

export default MapView;
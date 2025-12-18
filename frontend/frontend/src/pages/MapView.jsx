import React, { useState } from 'react';
import BusMap from '../components/map/BusMap';
import { useLocation } from '../contexts/LocationContext'; // ✅ Utilisez useLocation
import './MapView.css';

const MapView = () => {
  const { location, getCurrentLocation, loading, error } = useLocation(); // ✅ Hook correct
  const [viewMode, setViewMode] = useState('all');
  const [selectedBusId, setSelectedBusId] = useState(null);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'all') {
      setSelectedBusId(null);
    }
  };

  return (
    <div className="map-view-container">
      <div className="map-view-header">
        <h1>🗺️ Carte des transports</h1>
        
        <div className="view-selector">
          <button
            className={`view-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('all')}
          >
            Tous les bus
          </button>
          <button
            className={`view-btn ${viewMode === 'route' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('route')}
          >
            Trajets
          </button>
        </div>
      </div>

      {!location && (
        <div className="location-prompt">
          <p>📍 Activez la géolocalisation pour voir les bus proches de vous</p>
          <button onClick={getCurrentLocation} disabled={loading}>
            {loading ? 'Localisation...' : 'Activer la localisation'}
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      )}

      <div className="map-wrapper">
        <BusMap
          selectedBus={selectedBusId}
          showAllBuses={viewMode === 'all'}
          showStops={viewMode === 'route'}
        />
      </div>

      <div className="map-info-panel">
        <h3>ℹ️ Informations</h3>
        <ul>
          <li>🟢 Cliquez sur un bus pour voir ses détails</li>
          <li>🟡 Les arrêts sont affichés en orange</li>
          <li>🔵 Votre position est en vert</li>
          <li>📍 Utilisez le bouton "Ma position" pour vous recentrer</li>
        </ul>
      </div>
    </div>
  );
};

export default MapView;
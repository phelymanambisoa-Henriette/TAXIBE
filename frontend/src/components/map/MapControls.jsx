// src/components/map/MapControls.jsx
import React from 'react';
import { useMap } from 'react-leaflet';
import { FaLocationArrow, FaList, FaRoute, FaLayerGroup } from 'react-icons/fa';
import { useLocation } from '../../contexts/LocationContext';

const MapControls = ({ onToggleNearby }) => {
  const leafletMap = useMap();
  const { 
    userLocation, 
    getCurrentPosition, 
    isLocating,
    showNearbyPanel,
    nearbyStops,
    openItineraireMode,
    itineraireMode,
  } = useLocation();

  const handleLocate = async () => {
    try {
      const location = await getCurrentPosition();
      leafletMap.flyTo([location.lat, location.lng], 16);
    } catch (error) {
      console.error('Erreur localisation:', error);
    }
  };

  const handleCenterOnUser = () => {
    if (userLocation) {
      leafletMap.flyTo([userLocation.lat, userLocation.lng], 16);
    } else {
      handleLocate();
    }
  };

  return (
    <div className="map-controls">
      {/* Bouton de localisation */}
      <button
        className={`control-btn ${isLocating ? 'locating' : ''} ${userLocation ? 'active' : ''}`}
        onClick={handleCenterOnUser}
        title="Ma position"
      >
        <FaLocationArrow className={isLocating ? 'spinning' : ''} />
      </button>

      {/* Bouton itinéraire */}
      <button
        className={`control-btn ${itineraireMode ? 'active' : ''}`}
        onClick={openItineraireMode}
        title="Rechercher un itinéraire"
      >
        <FaRoute />
      </button>

      {/* Bouton arrêts proches */}
      <button
        className={`control-btn ${showNearbyPanel ? 'active' : ''}`}
        onClick={onToggleNearby}
        title={`Arrêts proches (${nearbyStops.length})`}
      >
        <FaList />
      </button>

      {/* Bouton couches */}
      <button
        className="control-btn"
        title="Couches de carte"
      >
        <FaLayerGroup />
      </button>
    </div>
  );
};

export default MapControls;
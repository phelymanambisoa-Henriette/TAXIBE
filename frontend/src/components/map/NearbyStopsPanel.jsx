// src/components/map/NearbyStopsPanel.jsx
import React from 'react';
import { FaTimes, FaWalking } from 'react-icons/fa';
import { useLocation } from '../../contexts/LocationContext';
import { formatDistance, estimateWalkTime } from '../../leafletConfig';

const NearbyStopsPanel = ({ onClose }) => {
  const {
    nearbyStops,
    selectStop,
    searchRadius,
    setSearchRadius,
  } = useLocation();

  const handleSelectStop = (stop) => {
    selectStop(stop);
  };

  return (
    <div className="nearby-panel">
      <div className="nearby-header">
        <h3>🚏 Arrêts proches</h3>
        <button className="close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      {/* Sélecteur de rayon */}
      <div className="radius-selector">
        <label>Rayon :</label>
        <select
          value={searchRadius}
          onChange={(e) => setSearchRadius(Number(e.target.value))}
        >
          <option value={250}>250m</option>
          <option value={500}>500m</option>
          <option value={1000}>1 km</option>
          <option value={2000}>2 km</option>
        </select>
      </div>

      {/* Liste des arrêts */}
      <div className="nearby-list">
        {nearbyStops.length > 0 ? (
          nearbyStops.map((stop) => (
            <div
              key={stop.id}
              className="nearby-item"
              onClick={() => handleSelectStop(stop)}
            >
              <div className="stop-icon">🚏</div>
              <div className="stop-details">
                <span className="stop-name">{stop.nom}</span>
                <div className="stop-meta">
                  <span className="distance">
                    <FaWalking /> {formatDistance(stop.distance)}
                  </span>
                  <span className="walk-time">
                    ~{estimateWalkTime(stop.distance)}
                  </span>
                </div>
                {stop.lignes && stop.lignes.length > 0 && (
                  <div className="stop-lines-preview">
                    {stop.lignes.slice(0, 3).map((line) => (
                      <span
                        key={line.id}
                        className="line-badge"
                        style={{ backgroundColor: line.couleur || '#3498db' }}
                      >
                        {line.numero}
                      </span>
                    ))}
                    {stop.lignes.length > 3 && (
                      <span className="more-lines">+{stop.lignes.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-nearby">
            <p>Aucun arrêt dans un rayon de {searchRadius}m</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyStopsPanel;
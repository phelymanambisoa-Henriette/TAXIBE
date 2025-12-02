import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../contexts/LocationContext';
import './BusCard.css';

const BusCard = ({ bus, userLocation }) => {
  const navigate = useNavigate();
  const { calculateDistance } = useLocation();

  // Calculer la distance si on a la position de l'utilisateur et du bus
  const distance = userLocation && bus.currentPosition
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        bus.currentPosition.latitude,
        bus.currentPosition.longitude
      )
    : null;

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const handleClick = () => {
    navigate(`/bus/${bus.id}`);
  };

  return (
    <div className="bus-card" onClick={handleClick}>
      <div className="bus-card-header">
        <div className="bus-number">{bus.lineNumber}</div>
        <div className="bus-status">
          <span className={`status-indicator ${bus.isActive ? 'active' : 'inactive'}`}>
            {bus.isActive ? '● En service' : '○ Hors service'}
          </span>
        </div>
      </div>

      <div className="bus-card-body">
        <div className="bus-route">
          <div className="route-point">
            <span className="label">De:</span>
            <span className="value">{bus.startPoint}</span>
          </div>
          <div className="route-arrow">→</div>
          <div className="route-point">
            <span className="label">À:</span>
            <span className="value">{bus.endPoint}</span>
          </div>
        </div>

        {distance && (
          <div className="bus-distance">
            <span className="distance-icon">📍</span>
            <span className="distance-value">{formatDistance(distance)}</span>
          </div>
        )}

        {bus.nextArrival && (
          <div className="bus-arrival">
            <span className="arrival-icon">⏱</span>
            <span className="arrival-time">
              Prochain passage: {formatTime(bus.nextArrival)}
            </span>
          </div>
        )}

        <div className="bus-info">
          <div className="info-item">
            <span className="info-icon">🚏</span>
            <span className="info-value">{bus.totalStops} arrêts</span>
          </div>
          {bus.estimatedDuration && (
            <div className="info-item">
              <span className="info-icon">⏱</span>
              <span className="info-value">
                Trajet: {formatTime(bus.estimatedDuration)}
              </span>
            </div>
          )}
        </div>

        {bus.crowdLevel && (
          <div className="bus-crowd">
            <span className="crowd-label">Affluence:</span>
            <div className="crowd-indicator">
              <div 
                className={`crowd-level crowd-${bus.crowdLevel}`}
                title={getCrowdText(bus.crowdLevel)}
              >
                {getCrowdIcon(bus.crowdLevel)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Fonctions helper
const getCrowdText = (level) => {
  const texts = {
    low: 'Peu de monde',
    medium: 'Modérément rempli',
    high: 'Très fréquenté'
  };
  return texts[level] || 'Inconnu';
};

const getCrowdIcon = (level) => {
  const icons = {
    low: '🟢',
    medium: '🟡',
    high: '🔴'
  };
  return icons[level] || '⚪';
};

export default BusCard;
// src/components/map/ItineraireResult.jsx
import React from 'react';
import { 
  FaTimes, 
  FaBus, 
  FaWalking, 
  FaClock, 
  FaMoneyBillWave,
  FaRoute,
  FaExchangeAlt,
  FaMapMarkerAlt,
  FaFlag
} from 'react-icons/fa';
import { useLocation } from '../../contexts/LocationContext';
import { formatDistance, estimateWalkTime } from '../../leafletConfig';

const ItineraireResult = () => {
  const {
    itineraireResult,
    setItineraireResult,
    selectLine,
    closeItineraireMode,
  } = useLocation();

  if (!itineraireResult || !itineraireResult.found) {
    return null;
  }

  const { depart, arrivee, options } = itineraireResult;

  const handleSelectOption = (option) => {
    // Sélectionner la première ligne de bus pour l'afficher sur la carte
    const firstBusSegment = option.segments.find((s) => s.type === 'bus');
    if (firstBusSegment) {
      selectLine(firstBusSegment.ligne);
    }
  };

  const handleClose = () => {
    setItineraireResult(null);
  };

  return (
    <div className="itineraire-result-panel">
      <div className="result-header">
        <div className="result-title">
          <FaRoute />
          <div className="route-summary">
            <span className="from">
              {depart.isCurrentLocation ? '📍 Ma position' : depart.nom}
            </span>
            <span className="arrow">→</span>
            <span className="to">{arrivee.nom}</span>
          </div>
        </div>
        <button className="close-btn" onClick={handleClose}>
          <FaTimes />
        </button>
      </div>

      <div className="result-options">
        <h4>{options.length} itinéraire{options.length > 1 ? 's' : ''} trouvé{options.length > 1 ? 's' : ''}</h4>

        {options.map((option, index) => (
          <div 
            key={option.id} 
            className={`option-card ${index === 0 ? 'recommended' : ''}`}
            onClick={() => handleSelectOption(option)}
          >
            {index === 0 && <span className="badge-recommended">Recommandé</span>}
            
            <div className="option-header">
              <div className="option-type">
                {option.type === 'direct' ? (
                  <span className="type-badge direct">Direct</span>
                ) : (
                  <span className="type-badge correspondance">
                    {option.correspondances} correspondance{option.correspondances > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="option-stats">
                <span className="stat">
                  <FaClock /> {option.duree} min
                </span>
                <span className="stat">
                  <FaMoneyBillWave /> {option.prix} Ar
                </span>
              </div>
            </div>

            <div className="option-segments">
              {option.segments.map((segment, segIndex) => (
                <div key={segIndex} className={`segment ${segment.type}`}>
                  {segment.type === 'walk' ? (
                    <div className="segment-walk">
                      <FaWalking className="segment-icon" />
                      <div className="segment-details">
                        <span className="segment-action">
                          Marcher {formatDistance(segment.distance)}
                        </span>
                        <span className="segment-info">
                          ~{segment.duree} min
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="segment-bus">
                      <div 
                        className="bus-badge"
                        style={{ backgroundColor: segment.ligne.couleur }}
                      >
                        <FaBus />
                        <span>{segment.ligne.numero}</span>
                      </div>
                      <div className="segment-details">
                        <span className="segment-route">
                          {segment.from} → {segment.to}
                        </span>
                        <span className="segment-info">
                          {segment.stops} arrêts · ~{segment.duree} min
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="option-footer">
              <span className="walk-total">
                <FaWalking /> {formatDistance(option.marche)} à pied
              </span>
              <button className="btn-select">
                Voir sur la carte
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-new-search" onClick={closeItineraireMode}>
        <FaRoute /> Nouvelle recherche
      </button>
    </div>
  );
};

export default ItineraireResult;
// src/components/map/BusLineInfo.jsx
import React from 'react';
import { FaTimes, FaArrowRight, FaMoneyBillWave, FaClock } from 'react-icons/fa';
import { useLocation } from '../../contexts/LocationContext';

const BusLineInfo = ({ line, stops }) => {
  const { clearSelection } = useLocation();

  if (!line) return null;

  return (
    <div className="line-info-panel">
      <div className="line-info-header">
        <div className="line-title">
          <span
            className="line-number-large"
            style={{ backgroundColor: line.couleur || '#3498db' }}
          >
            {line.numero}
          </span>
          <div className="line-route-info">
            <span className="terminus">{line.terminus_depart}</span>
            <FaArrowRight className="arrow" />
            <span className="terminus">{line.terminus_arrivee}</span>
          </div>
        </div>
        <button className="close-btn" onClick={clearSelection}>
          <FaTimes />
        </button>
      </div>

      <div className="line-info-details">
        <div className="detail-item">
          <FaMoneyBillWave />
          <span>{line.tarif || 400} Ar</span>
        </div>
        <div className="detail-item">
          <FaClock />
          <span>Toutes les {line.frequence || '5-10'} min</span>
        </div>
      </div>

      {/* Liste des arrêts de la ligne */}
      {stops && stops.length > 0 && (
        <div className="line-stops">
          <h4>Arrêts ({stops.length})</h4>
          <div className="stops-timeline">
            {stops.map((stop, index) => (
              <div key={stop.id} className="timeline-item">
                <div className="timeline-dot"></div>
                {index < stops.length - 1 && <div className="timeline-line"></div>}
                <span className="timeline-stop-name">{stop.nom}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusLineInfo;
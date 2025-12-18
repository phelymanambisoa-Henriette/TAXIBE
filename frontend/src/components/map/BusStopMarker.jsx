// src/components/map/BusStopMarker.jsx
import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { FaBus, FaRoute, FaWalking } from 'react-icons/fa';
import { useLocation } from '../../contexts/LocationContext';
import { createBusStopIcon, formatDistance, estimateWalkTime } from '../../leafletConfig';
import localisationService from '../../services/localisationService';

const BusStopMarker = ({ stop, isNearby, isSelected }) => {
  const { selectStop, selectLine, setBusLines } = useLocation();
  const [lines, setLines] = useState([]);
  const [loadingLines, setLoadingLines] = useState(false);
  const [linesLoaded, setLinesLoaded] = useState(false);

  const handleClick = async () => {
    selectStop(stop);
    
    if (!linesLoaded) {
      setLoadingLines(true);
      try {
        const busLines = await localisationService.getLignesByArret(stop.id);
        setLines(busLines);
        setBusLines(busLines);
        setLinesLoaded(true);
      } catch (error) {
        console.error('Erreur chargement lignes:', error);
        // Mock data pour développement
        const mockLines = getMockLines(stop.id);
        setLines(mockLines);
        setBusLines(mockLines);
        setLinesLoaded(true);
      } finally {
        setLoadingLines(false);
      }
    }
  };

  const handleLineClick = (e, line) => {
    e.stopPropagation();
    selectLine(line);
  };

  return (
    <Marker
      position={[stop.latitude, stop.longitude]}
      icon={createBusStopIcon(isNearby, isSelected)}
      eventHandlers={{
        click: handleClick,
      }}
    >
      <Popup className="bus-stop-popup" minWidth={260} maxWidth={320}>
        <div className="stop-popup-content">
          <h3>🚏 {stop.nom}</h3>

          {stop.distance && (
            <p className="stop-distance">
              <FaWalking /> {formatDistance(stop.distance)} · ~{estimateWalkTime(stop.distance)}
            </p>
          )}

          <div className="stop-lines">
            <h4>
              <FaBus /> Lignes disponibles
            </h4>

            {loadingLines ? (
              <div className="loading-lines">
                <span className="spinner-small"></span> Chargement...
              </div>
            ) : lines.length > 0 ? (
              <ul className="lines-list">
                {lines.map((line) => (
                  <li
                    key={line.id}
                    className="line-item"
                    onClick={(e) => handleLineClick(e, line)}
                  >
                    <span
                      className="line-number"
                      style={{ backgroundColor: line.couleur || '#3498db' }}
                    >
                      {line.numero}
                    </span>
                    <span className="line-route">
                      {line.terminus_depart} → {line.terminus_arrivee}
                    </span>
                  </li>
                ))}
              </ul>
            ) : linesLoaded ? (
              <p className="no-lines">Aucune ligne disponible</p>
            ) : (
              <p className="no-lines">Cliquez pour voir les lignes</p>
            )}
          </div>

          {lines.length > 0 && (
            <button
              className="btn-show-route"
              onClick={(e) => handleLineClick(e, lines[0])}
            >
              <FaRoute /> Voir le trajet
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

// Mock data pour développement
const getMockLines = (stopId) => [
  { 
    id: 1, 
    numero: '135', 
    terminus_depart: 'Analakely', 
    terminus_arrivee: 'Ivandry', 
    couleur: '#e74c3c',
    tarif: 400,
    frequence: '5-10'
  },
  { 
    id: 2, 
    numero: '194', 
    terminus_depart: 'Ambohijatovo', 
    terminus_arrivee: 'Ankorondrano', 
    couleur: '#27ae60',
    tarif: 400,
    frequence: '10-15'
  },
  { 
    id: 3, 
    numero: '119', 
    terminus_depart: 'Tsaralalana', 
    terminus_arrivee: '67 Ha', 
    couleur: '#3498db',
    tarif: 400,
    frequence: '8-12'
  },
];

export default BusStopMarker;
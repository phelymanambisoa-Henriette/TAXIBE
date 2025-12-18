// src/components/map/AllTrajetsLayer.jsx - LABELS AU TERMINUS
import React, { useEffect, useState } from 'react';
import { Polyline, Popup } from 'react-leaflet';
import trajetService from '../../services/trajetService';
import BusLineLabel from './BusLineLabel';
import './BusLineLabel.css';

const AllTrajetsLayer = ({ 
  showAller = true, 
  showRetour = true,
  onSelectBus 
}) => {
  const [trajets, setTrajets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrajets = async () => {
      try {
        setLoading(true);
        const data = await trajetService.getAllTrajetsGeoJSON();
        
        const lines = data.features
          .filter(f => f.geometry.type === 'LineString')
          .map(f => ({
            id: f.properties.id,
            busId: f.properties.bus_id,
            busNumero: f.properties.bus_numero,
            direction: f.properties.direction,
            couleur: f.properties.couleur,
            nbArrets: f.properties.nb_arrets,
            coordinates: f.geometry.coordinates.map(c => [c[1], c[0]]),
          }));
        
        setTrajets(lines);
      } catch (err) {
        console.error('❌ Erreur chargement trajets:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTrajets();
  }, []);

  // ✅ FONCTION POUR OBTENIR LE TERMINUS
  const getTerminus = (positions) => {
    if (positions.length === 0) return null;
    return positions[positions.length - 1]; // Dernier point
  };

  if (loading || trajets.length === 0) return null;

  return (
    <>
      {trajets.map(trajet => {
        const isAller = trajet.direction === 'Aller';
        if (isAller && !showAller) return null;
        if (!isAller && !showRetour) return null;

        if (trajet.coordinates.length < 2) return null;

        // ✅ POSITION AU TERMINUS
        const terminusPosition = getTerminus(trajet.coordinates);

        return (
          <React.Fragment key={trajet.id}>
            {/* Ligne du trajet */}
            <Polyline
              positions={trajet.coordinates}
              pathOptions={{
                color: trajet.couleur,
                weight: 4,
                opacity: 0.7,
                dashArray: isAller ? null : '8, 8',
              }}
              eventHandlers={{
                click: () => onSelectBus && onSelectBus({ 
                  id: trajet.busId, 
                  numero: trajet.busNumero 
                }),
              }}
            >
              <Popup>
                <div>
                  <strong>Bus {trajet.busNumero}</strong>
                  <br />
                  <span style={{ color: trajet.couleur }}>● {trajet.direction}</span>
                  <br />
                  <small>{trajet.nbArrets} arrêts</small>
                  <br />
                  <button 
                    onClick={() => onSelectBus && onSelectBus({ 
                      id: trajet.busId, 
                      numero: trajet.busNumero 
                    })}
                    style={{
                      marginTop: '8px',
                      padding: '4px 12px',
                      background: trajet.couleur,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Voir détails
                  </button>
                </div>
              </Popup>
            </Polyline>

            {/* ✅ LABEL AU TERMINUS */}
            {terminusPosition && (
              <BusLineLabel
                position={terminusPosition}
                busNumero={trajet.busNumero}
                couleur={trajet.couleur}
                direction={trajet.direction}
                onClick={() => onSelectBus && onSelectBus({ 
                  id: trajet.busId, 
                  numero: trajet.busNumero 
                })}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default AllTrajetsLayer;
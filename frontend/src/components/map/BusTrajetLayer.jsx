// src/components/map/BusTrajetLayer.jsx - LABELS AU TERMINUS
import React, { useEffect, useState } from 'react';
import { Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import trajetService from '../../services/trajetService';
import BusLineLabel from './BusLineLabel';
import './BusLineLabel.css';

const BusTrajetLayer = ({ 
  busId, 
  showAller = true, 
  showRetour = true,
  fitBounds = true 
}) => {
  const [busData, setBusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const map = useMap();

  useEffect(() => {
    if (!busId) {
      setBusData(null);
      return;
    }

    const loadTrajet = async () => {
      try {
        setLoading(true);
        const data = await trajetService.getBusTrajet(busId);
        setBusData(data);

        if (fitBounds && data.trajets && data.trajets.length > 0) {
          const allCoords = [];
          data.trajets.forEach(trajet => {
            trajet.arrets.forEach(arret => {
              if (arret.latitude && arret.longitude) {
                allCoords.push([arret.latitude, arret.longitude]);
              }
            });
          });

          if (allCoords.length > 0) {
            map.fitBounds(allCoords, { padding: [50, 50] });
          }
        }
      } catch (err) {
        console.error('❌ Erreur chargement trajet:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTrajet();
  }, [busId, map, fitBounds]);

  if (!busData || loading) return null;

  const { bus, trajets } = busData;

  // ✅ FONCTION POUR OBTENIR LE TERMINUS (dernier arrêt)
  const getTerminus = (positions) => {
    if (positions.length === 0) return null;
    return positions[positions.length - 1]; // Dernier point
  };

  return (
    <>
      {trajets.map((trajet, index) => {
        const isAller = trajet.type === 'Aller';
        if (isAller && !showAller) return null;
        if (!isAller && !showRetour) return null;

        const positions = trajet.arrets
          .filter(a => a.latitude && a.longitude)
          .map(a => [a.latitude, a.longitude]);

        if (positions.length < 2) return null;

        const color = isAller ? bus.couleur : adjustColor(bus.couleur);
        const dashArray = isAller ? null : '10, 10';

        // ✅ POSITION AU TERMINUS
        const terminusPosition = getTerminus(positions);
        const terminusName = trajet.arrets[trajet.arrets.length - 1]?.nom || trajet.dernier_arret;

        return (
          <React.Fragment key={trajet.id}>
            {/* Ligne du trajet */}
            <Polyline
              positions={positions}
              pathOptions={{
                color: color,
                weight: 5,
                opacity: 0.8,
                dashArray: dashArray,
              }}
            >
              <Popup>
                <div className="trajet-popup">
                  <strong>Bus {bus.numero}</strong>
                  <br />
                  <span style={{ color: color }}>● {trajet.type}</span>
                  <br />
                  {trajet.premier_arret} → {trajet.dernier_arret}
                  <br />
                  <small>{trajet.nb_arrets} arrêts</small>
                </div>
              </Popup>
            </Polyline>

            {/* ✅ LABEL AU TERMINUS */}
            {terminusPosition && (
              <BusLineLabel
                position={terminusPosition}
                busNumero={bus.numero}
                couleur={color}
                direction={trajet.type}
                terminusName={terminusName}
              />
            )}

            {/* Marqueurs des arrêts */}
            {trajet.arrets.map((arret, arretIndex) => (
              <CircleMarker
                key={`${trajet.id}-${arret.id}-${arretIndex}`}
                center={[arret.latitude, arret.longitude]}
                radius={arretIndex === 0 || arretIndex === trajet.arrets.length - 1 ? 10 : 6}
                pathOptions={{
                  color: color,
                  fillColor: arretIndex === 0 || arretIndex === trajet.arrets.length - 1 
                    ? color 
                    : 'white',
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="arret-popup">
                    <strong>{arret.nom}</strong>
                    <br />
                    <span>Arrêt n°{arret.ordre}</span>
                    <br />
                    <small style={{ color: color }}>
                      Bus {bus.numero} - {trajet.type}
                    </small>
                    {arret.quartier && (
                      <>
                        <br />
                        <small>📍 {arret.quartier}</small>
                      </>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </React.Fragment>
        );
      })}
    </>
  );
};

const adjustColor = (hexColor) => {
  if (!hexColor) return '#666666';
  
  const hex = hexColor.replace('#', '');
  const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - 40);
  const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - 40);
  const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - 40);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export default BusTrajetLayer;
// src/components/map/BusMap.jsx - VERSION MISE À JOUR AVEC TRAJETS

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation } from '../../contexts/LocationContext';
import trajetService from '../../services/trajetService'; // ← NOUVEAU
import './BusMap.css';

// Fix des icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Composant pour ajuster automatiquement la vue
function MapBounds({ trajets }) {
  const map = useMap();

  useEffect(() => {
    if (trajets && trajets.length > 0) {
      const allCoords = [];
      
      trajets.forEach(trajet => {
        if (trajet.arrets) {
          trajet.arrets.forEach(arret => {
            if (arret.latitude && arret.longitude) {
              allCoords.push([arret.latitude, arret.longitude]);
            }
          });
        }
      });

      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [trajets, map]);

  return null;
}

// Composant pour afficher un label de bus
const BusLabel = ({ position, numero, direction, couleur }) => {
  const icon = L.divIcon({
    className: 'bus-label-marker',
    html: `
      <div style="
        background: ${couleur};
        color: white;
        padding: 4px 10px;
        border-radius: 15px;
        font-weight: bold;
        font-size: 13px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
        white-space: nowrap;
      ">
        ${numero} ${direction === 'Aller' ? '↗' : '↙'}
      </div>
    `,
    iconSize: [60, 30],
    iconAnchor: [30, 15],
  });

  return <Marker position={position} icon={icon} />;
};

const BusMap = ({ 
  selectedBus, // ← Renommé de busId pour cohérence
  showAllBuses = false,
  showStops = true 
}) => {
  const { 
    itineraireResult,
    clearItineraire
  } = useLocation();

  const [busData, setBusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrajet = async () => {
      if (!selectedBus) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🗺️ Chargement trajet pour BusMap, bus:', selectedBus);

        // ✅ UTILISER LE SERVICE TRAJETS
        const data = await trajetService.getBusTrajet(selectedBus);
        console.log('✅ Trajet chargé pour BusMap:', data);

        setBusData(data);

      } catch (err) {
        console.error('❌ Erreur chargement trajet BusMap:', err);
        setError('Impossible de charger le trajet du bus');
      } finally {
        setLoading(false);
      }
    };

    fetchTrajet();
  }, [selectedBus]);

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="bus-map-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="bus-map-container">
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  // Si pas de données
  if (!busData) {
    return (
      <div className="bus-map-container">
        <div className="error-message">
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  const { bus, trajets } = busData;

  // Centre par défaut (Fianarantsoa)
  const defaultCenter = [-21.45, 47.09];
  const defaultZoom = 13;

  // Calculer le centre initial
  let initialCenter = defaultCenter;
  if (trajets && trajets.length > 0 && trajets[0].arrets && trajets[0].arrets.length > 0) {
    const firstArret = trajets[0].arrets[0];
    initialCenter = [firstArret.latitude, firstArret.longitude];
  }

  return (
    <div className="bus-map-container">
      {/* Affichage de l'itinéraire sélectionné */}
      {itineraireResult && (
        <div className="itineraire-info">
          <h3>Itinéraire sélectionné</h3>
          <p>
            <strong>Départ :</strong> {itineraireResult.depart?.nom || 'Votre position'}
          </p>
          <p>
            <strong>Arrivée :</strong> {itineraireResult.arrivee?.nom}
          </p>
          <button onClick={clearItineraire} className="btn-clear-itineraire">
            Effacer l'itinéraire
          </button>
        </div>
      )}

      <MapContainer
        center={initialCenter}
        zoom={defaultZoom}
        className="leaflet-map-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Ajustement automatique de la vue */}
        {trajets && trajets.length > 0 && <MapBounds trajets={trajets} />}

        {/* Afficher les trajets */}
        {trajets && trajets.map((trajet, trajetIndex) => {
          if (!trajet.arrets || trajet.arrets.length === 0) return null;

          const isAller = trajet.type === 'Aller';
          
          // Couleurs selon direction (thème vert)
          const couleur = isAller ? '#01c6b2' : '#059669';
          const dashArray = isAller ? null : '10, 10';

          // Créer les coordonnées pour la polyline
          const coords = trajet.arrets
            .filter(a => a.latitude && a.longitude)
            .map(a => [a.latitude, a.longitude]);

          if (coords.length < 2) return null;

          // Position du label (au terminus)
          const labelPosition = coords[coords.length - 1];

          return (
            <React.Fragment key={`trajet-${trajet.id}-${trajetIndex}`}>
              {/* Ligne du trajet */}
              <Polyline
                positions={coords}
                pathOptions={{
                  color: couleur,
                  weight: 5,
                  opacity: 0.8,
                  dashArray: dashArray,
                }}
              >
                <Popup>
                  <div className="popup-content">
                    <h4>Bus {bus.numero}</h4>
                    <p style={{ color: couleur, fontWeight: 'bold' }}>
                      {trajet.type === 'Aller' ? '↗' : '↙'} {trajet.type}
                    </p>
                    <p>
                      {trajet.premier_arret || trajet.arrets[0]?.nom} 
                      → 
                      {trajet.dernier_arret || trajet.arrets[trajet.arrets.length - 1]?.nom}
                    </p>
                    <p><small>{trajet.nb_arrets} arrêts</small></p>
                  </div>
                </Popup>
              </Polyline>

              {/* Label au terminus */}
              {labelPosition && (
                <BusLabel
                  position={labelPosition}
                  numero={bus.numero}
                  direction={trajet.type}
                  couleur={couleur}
                />
              )}

              {/* Marqueurs des arrêts */}
              {showStops && trajet.arrets.map((arret, arretIndex) => {
                if (!arret.latitude || !arret.longitude) return null;

                const isDepart = arretIndex === 0;
                const isArrivee = arretIndex === trajet.arrets.length - 1;
                const isTerminus = isDepart || isArrivee;

                return (
                  <CircleMarker
                    key={`arret-${trajet.id}-${arret.id}-${arretIndex}`}
                    center={[arret.latitude, arret.longitude]}
                    radius={isTerminus ? 8 : 5}
                    pathOptions={{
                      color: couleur,
                      fillColor: isTerminus ? couleur : 'white',
                      fillOpacity: 1,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="popup-content">
                        <h4>{arret.nom}</h4>
                        {isDepart && <p className="badge-depart">🚀 Départ</p>}
                        {isArrivee && <p className="badge-arrivee">🏁 Arrivée</p>}
                        {arret.quartier && <p>📍 {arret.quartier}</p>}
                        <p style={{ color: couleur, fontWeight: 'bold' }}>
                          Bus {bus.numero} - {trajet.type}
                        </p>
                        <p><small>Arrêt n°{arret.ordre}</small></p>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default BusMap;
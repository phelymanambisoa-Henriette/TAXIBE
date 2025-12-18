// src/components/map/LeafletRouteBuilder.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaUndo, FaTrash } from 'react-icons/fa';

// --- CONFIGURATION LEAFLET ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// --- ICONES PERSONNALISÉES ---
// Point gris pour les arrêts disponibles
const neutralIcon = new L.DivIcon({
    className: 'custom-stop-icon',
    html: `<div style="background-color: #A9A9A9; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

// Point vert pour les arrêts sélectionnés (numérotés)
const selectedIcon = (number) => new L.DivIcon({
    className: 'custom-stop-icon-selected',
    html: `<div style="background-color: #00D2A0; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); font-size: 13px;">${number}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
});

// --- COMPOSANT HELPER POUR LA VUE ---
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14);
  }, [center, map]);
  return null;
}

const LeafletRouteBuilder = ({ center, availableStops, onRouteChanged }) => {
  const [selectedStops, setSelectedStops] = useState([]);

  // Gérer l'ajout d'un arrêt
  const handleStopClick = (arret) => {
    const lastStop = selectedStops[selectedStops.length - 1];
    if (lastStop && lastStop.id === arret.id) return; // Pas de doubles clics

    const newSelection = [...selectedStops, arret];
    setSelectedStops(newSelection);
    onRouteChanged(newSelection);
  };

  const handleUndo = () => {
    const newSelection = selectedStops.slice(0, -1);
    setSelectedStops(newSelection);
    onRouteChanged(newSelection);
  };

  const handleReset = () => {
    setSelectedStops([]);
    onRouteChanged([]);
  };

  const polylinePositions = selectedStops.map(s => [s.latitude, s.longitude]);

  return (
    <div className="leaflet-builder-wrapper">
      
      {/* Contrôles au-dessus de la carte */}
      <div className="builder-controls">
        <span className="info-text">
            Cliquez sur les arrêts disponibles ({availableStops.length}) pour tracer le trajet.
        </span>
        <div className="action-buttons">
            <button type="button" onClick={handleUndo} disabled={selectedStops.length === 0} className="btn-map-action">
                <FaUndo /> Annuler
            </button>
            <button type="button" onClick={handleReset} disabled={selectedStops.length === 0} className="btn-map-action danger">
                <FaTrash /> Effacer
            </button>
        </div>
      </div>

      <div className="map-container-area">
        <MapContainer center={center || [-18.8792, 47.5079]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={true}>
          
          {/* Fond de carte CartoDB Voyager pour un look moderne */}
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          <ChangeView center={center} />

          {/* Marqueurs des arrêts disponibles */}
          {availableStops.map((arret) => {
            const isSelected = selectedStops.some(s => s.id === arret.id);
            const order = selectedStops.findIndex(s => s.id === arret.id);

            return (
              <Marker 
                key={arret.id} 
                position={[arret.latitude, arret.longitude]}
                icon={isSelected ? selectedIcon(order + 1) : neutralIcon}
                eventHandlers={{ click: () => handleStopClick(arret) }}
                zIndexOffset={isSelected ? 1000 : 0}
              >
                <Popup>
                  <strong>{isSelected ? `ARRÊT N°${order + 1}` : 'ARRÊT DISPONIBLE'}</strong><br/>
                  {arret.nomArret || arret.nom}
                </Popup>
              </Marker>
            );
          })}

          {/* Tracé Vert */}
          <Polyline 
            positions={polylinePositions}
            pathOptions={{ color: '#00D2A0', weight: 6, opacity: 0.9 }}
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default LeafletRouteBuilder;
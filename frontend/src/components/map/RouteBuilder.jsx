import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaUndo, FaTrash } from 'react-icons/fa';

// --- Configuration des icônes (Fix Webpack) ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// --- Sous-composant pour gérer les clics ---
function MapClickHandler({ onAddPoint }) {
  useMapEvents({
    click(e) {
      onAddPoint(e.latlng); // Renvoie { lat, lng }
    },
  });
  return null;
}

const RouteBuilder = ({ onRouteChanged }) => {
  const [points, setPoints] = useState([]);

  // Ajouter un point
  const handleAddPoint = (latlng) => {
    const newPoints = [...points, { lat: latlng.lat, lng: latlng.lng }];
    setPoints(newPoints);
    onRouteChanged(newPoints); // Remonte l'info au parent
  };

  // Annuler le dernier point
  const handleUndo = () => {
    const newPoints = points.slice(0, -1);
    setPoints(newPoints);
    onRouteChanged(newPoints);
  };

  // Tout effacer
  const handleClear = () => {
    setPoints([]);
    onRouteChanged([]);
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      
      {/* Boutons de contrôle flottants sur la carte */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
        display: 'flex',
        gap: '8px'
      }}>
        <button 
            type="button"
            onClick={handleUndo}
            disabled={points.length === 0}
            style={{
                background: '#fff',
                border: '1px solid #ccc',
                padding: '8px',
                borderRadius: '4px',
                cursor: points.length > 0 ? 'pointer' : 'not-allowed',
                color: '#333',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            title="Annuler dernier point"
        >
            <FaUndo />
        </button>
        <button 
            type="button"
            onClick={handleClear}
            disabled={points.length === 0}
            style={{
                background: '#fff',
                border: '1px solid #ccc',
                padding: '8px',
                borderRadius: '4px',
                cursor: points.length > 0 ? 'pointer' : 'not-allowed',
                color: '#d9534f',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            title="Tout effacer"
        >
            <FaTrash />
        </button>
      </div>

      <MapContainer 
        center={[-18.8792, 47.5079]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer 
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        />

        {/* Gestion des clics */}
        <MapClickHandler onAddPoint={handleAddPoint} />

        {/* Affichage des points (Marqueurs) */}
        {points.map((pt, index) => (
          <Marker key={index} position={[pt.lat, pt.lng]}>
            <Popup>Point #{index + 1}</Popup>
          </Marker>
        ))}

        {/* Tracé de la ligne (Ton thème #aad3c2) */}
        <Polyline 
            positions={points.map(p => [p.lat, p.lng])}
            pathOptions={{ color: '#aad3c2', weight: 5 }}
        />
      </MapContainer>
      
      <div style={{ marginTop: '5px', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>
        {points.length === 0 
            ? "Cliquez sur la carte pour commencer à tracer l'itinéraire." 
            : `${points.length} points ajoutés.`}
      </div>
    </div>
  );
};

export default RouteBuilder;
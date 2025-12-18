// src/components/map/HomeMiniMap.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../../leafletConfig';

// Icône utilisateur
const userIcon = new L.DivIcon({
  className: 'home-user-location-marker',
  html: `
    <div style="
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #01c6b2;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Icône arrêt (simple, personnalisable)
const stopIcon = new L.DivIcon({
  className: 'home-stop-marker',
  html: `
    <div style="
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid #01c6b2;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const HomeMiniMap = ({ center, stops }) => {
  if (!center) return null;

  return (
    <div className="home-mini-map-container">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        dragging={true}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        attributionControl={false}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Position utilisateur + cercle de précision */}
        <Circle
          center={[center.lat, center.lng]}
          radius={center.accuracy || 80}
          pathOptions={{
            color: '#01c6b2',
            fillColor: '#01c6b2',
            fillOpacity: 0.12,
            weight: 1,
          }}
        />
        <Marker position={[center.lat, center.lng]} icon={userIcon} />

        {/* Arrêts proches */}
        {stops.map((stop) =>
          stop.latitude && stop.longitude ? (
            <Marker
              key={stop.id}
              position={[stop.latitude, stop.longitude]}
              icon={stopIcon}
            />
          ) : null
        )}
      </MapContainer>
    </div>
  );
};

export default HomeMiniMap;
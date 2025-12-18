// src/components/map/UserLocationMarker.jsx
import React from 'react';
import { Marker, Popup, Circle } from 'react-leaflet';
import { useLocation } from '../../contexts/LocationContext';
import { userIcon } from '../../leafletConfig';

const UserLocationMarker = () => {
  const { userLocation } = useLocation();

  if (!userLocation) return null;

  return (
    <>
      {/* Cercle de précision */}
      <Circle
        center={[userLocation.lat, userLocation.lng]}
        radius={userLocation.accuracy || 50}
        pathOptions={{
          color: '#4285F4',
          fillColor: '#4285F4',
          fillOpacity: 0.15,
          weight: 2,
        }}
      />

      {/* Marqueur utilisateur */}
      <Marker 
        position={[userLocation.lat, userLocation.lng]} 
        icon={userIcon}
        zIndexOffset={1000}
      >
        <Popup>
          <div className="user-popup">
            <strong>📍 Votre position</strong>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#666' }}>
              Précision: ~{Math.round(userLocation.accuracy || 0)}m
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default UserLocationMarker;
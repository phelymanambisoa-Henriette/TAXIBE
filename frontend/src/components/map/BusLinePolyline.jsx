// src/components/map/BusLinePolyline.jsx
import React from 'react';
import { Polyline, Tooltip } from 'react-leaflet';

const BusLinePolyline = ({ stops, line }) => {
  if (!stops || stops.length < 2) return null;

  // Créer les positions pour la polyline
  const positions = stops.map((stop) => [stop.latitude, stop.longitude]);

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: line?.couleur || '#3498db',
        weight: 6,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    >
      <Tooltip sticky direction="top" offset={[0, -10]}>
        <div style={{ fontWeight: 600 }}>
          Ligne {line?.numero}
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {line?.terminus_depart} → {line?.terminus_arrivee}
        </div>
      </Tooltip>
    </Polyline>
  );
};

export default BusLinePolyline;
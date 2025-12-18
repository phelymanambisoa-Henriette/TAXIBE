// src/components/map/BusLineLabel.jsx - VERSION AMÉLIORÉE
import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

const BusLineLabel = ({ position, busNumero, couleur, direction, terminusName, onClick }) => {
  const busIcon = L.divIcon({
    className: 'bus-line-label',
    html: `
      <div class="bus-label-container" style="background-color: ${couleur || '#01c6b2'}">
        <span class="bus-label-number">${busNumero}</span>
        ${direction ? `<span class="bus-label-direction">${direction === 'Aller' ? '↗' : '↙'}</span>` : ''}
      </div>
    `,
    iconSize: [50, 28],
    iconAnchor: [25, 14],
  });

  return (
    <Marker 
      position={position} 
      icon={busIcon}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Tooltip permanent={false} direction="top" offset={[0, -10]}>
        <div style={{ textAlign: 'center' }}>
          <strong>Bus {busNumero}</strong>
          {direction && (
            <>
              <br />
              <span style={{ fontSize: '12px' }}>{direction}</span>
            </>
          )}
          {terminusName && (
            <>
              <br />
              <span style={{ fontSize: '11px', color: '#666' }}>
                → {terminusName}
              </span>
            </>
          )}
        </div>
      </Tooltip>
    </Marker>
  );
};

export default BusLineLabel;
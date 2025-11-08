import React, { useContext, useEffect } from 'react';
import { LocationContext } from '../../contexts/LocationContext';
import './MapView.css';

const MapView = () => {
  const { position, getLocation } = useContext(LocationContext);

useEffect(() => {
  getLocation();
}, [getLocation]);


  return (
    <div className="map-container">
      {position ? (
        <p>📍 Position actuelle : {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}</p>
      ) : (
        <p>Obtention de la position en cours...</p>
      )}
    </div>
  );
};

export default MapView;

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/61/61088.png',
  iconSize: [30, 30],
});

const ArretMap = ({ arrets, selectedVille }) => {
  if (!selectedVille)
    return <p className="map-message">Sélectionnez une ville pour voir la carte.</p>;

  return (
    <div className="map-container">
      <MapContainer
        center={[selectedVille.latitude, selectedVille.longitude]}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          attribution='© OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {arrets.map((arret) => (
          <Marker key={arret.id} position={[arret.lat, arret.lng]} icon={busIcon}>
            <Popup>
              <strong>{arret.nom}</strong>
              <br />
              {arret.description || 'Aucun détail'}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ArretMap;

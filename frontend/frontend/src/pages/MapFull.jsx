import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { transportService } from '../services/transportService';
import { localisationService } from '../services/localisationService';
import { useLocation } from '../contexts/LocationContext';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import './MapFull.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapFull = () => {
  const { location, getCurrentLocation } = useLocation();
  const [buses, setBuses] = useState([]);
  const [arrets, setArrets] = useState([]);
  const [center, setCenter] = useState([14.6937, -17.4441]); // Dakar

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location) {
      setCenter([location.latitude, location.longitude]);
    }
  }, [location]);

  const loadData = async () => {
    try {
      const [busesRes, arretsRes] = await Promise.all([
        transportService.getAllBuses(),
        localisationService.getAllArrets()
      ]);
      
      setBuses(Array.isArray(busesRes.data) ? busesRes.data : busesRes.data.results || []);
      setArrets(Array.isArray(arretsRes.data) ? arretsRes.data : arretsRes.data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="map-full">
      <div className="map-controls">
        <button onClick={getCurrentLocation}>📍 Ma position</button>
      </div>
      
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Position utilisateur */}
        {location && (
          <Marker position={[location.latitude, location.longitude]}>
            <Popup>📍 Vous êtes ici</Popup>
          </Marker>
        )}
        
        {/* Bus */}
        {buses.map(bus => bus.current_latitude && bus.current_longitude && (
          <Marker key={`bus-${bus.id}`} position={[bus.current_latitude, bus.current_longitude]}>
            <Popup>
              <strong>🚌 Bus N° {bus.numeroBus}</strong><br />
              {bus.status}<br />
              <Link to={`/bus/${bus.id}`}>Voir détails</Link>
            </Popup>
          </Marker>
        ))}
        
        {/* Arrêts */}
        {arrets.map(arret => (
          <Marker key={`arret-${arret.id}`} position={[arret.latitude, arret.longitude]}>
            <Popup>
              <strong>🚏 {arret.nomArret}</strong>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapFull;
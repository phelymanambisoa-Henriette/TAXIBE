// src/leafletConfig.js
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet avec Webpack/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Icônes personnalisées
export const userIcon = new L.DivIcon({
  className: 'user-location-marker',
  html: `
    <div class="user-marker-container">
      <div class="user-marker-pulse"></div>
      <div class="user-marker-dot"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const createBusStopIcon = (isNearby = false, isSelected = false) => {
  const color = isSelected ? '#e74c3c' : isNearby ? '#27ae60' : '#3498db';
  const size = isSelected ? 32 : isNearby ? 28 : 24;

  return new L.DivIcon({
    className: 'bus-stop-marker',
    html: `
      <div class="stop-marker" style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: ${size * 0.45}px;
        font-weight: bold;
      ">
        🚏
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Configuration par défaut de la carte (Antananarivo)
export const DEFAULT_CENTER = [-18.8792, 47.5079];
export const DEFAULT_ZOOM = 13;

// Calcul de distance Haversine
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Formater la distance
export const formatDistance = (distance) => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
};

// Estimer le temps de marche
export const estimateWalkTime = (distance) => {
  const minutes = Math.round(distance / 83.33); // 5 km/h
  return minutes < 1 ? '< 1 min' : `${minutes} min`;
};

export default L;
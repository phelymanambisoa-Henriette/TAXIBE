// src/utils/carteUtils.js

/**
 * Calcule la distance entre deux points GPS (formule de Haversine)
 * @param {number} lat1 - Latitude du point 1
 * @param {number} lon1 - Longitude du point 1
 * @param {number} lat2 - Latitude du point 2
 * @param {number} lon2 - Longitude du point 2
 * @returns {number} Distance en kilomètres
 */
export const calculerDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convertit les degrés en radians
 */
const degToRad = (deg) => {
  return deg * (Math.PI / 180);
};

/**
 * Trouve le centre géographique d'un ensemble de points
 * @param {Array} points - Tableau d'objets {latitude, longitude}
 * @returns {Array} [latitude, longitude] du centre
 */
export const trouverCentre = (points) => {
  if (!points || points.length === 0) {
    return [-18.8792, 47.5079]; // Centre de Madagascar par défaut
  }

  let sumLat = 0;
  let sumLon = 0;

  points.forEach((point) => {
    sumLat += parseFloat(point.latitude);
    sumLon += parseFloat(point.longitude);
  });

  return [sumLat / points.length, sumLon / points.length];
};

/**
 * Calcule les limites (bounds) d'un ensemble de points
 * @param {Array} points - Tableau d'objets {latitude, longitude}
 * @returns {Array} [[minLat, minLon], [maxLat, maxLon]]
 */
export const calculerBounds = (points) => {
  if (!points || points.length === 0) {
    return null;
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  points.forEach((point) => {
    const lat = parseFloat(point.latitude);
    const lon = parseFloat(point.longitude);

    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  });

  return [
    [minLat, minLon],
    [maxLat, maxLon],
  ];
};

/**
 * Génère une couleur aléatoire pour un bus
 * @param {number} id - ID du bus
 * @returns {string} Code couleur hexadécimal
 */
export const genererCouleurBus = (id) => {
  const couleurs = [
    '#FF6B6B', // Rouge
    '#4ECDC4', // Cyan
    '#45B7D1', // Bleu clair
    '#FFA07A', // Saumon
    '#98D8C8', // Vert menthe
    '#F7DC6F', // Jaune
    '#BB8FCE', // Violet
    '#85C1E2', // Bleu ciel
    '#F8B739', // Orange
    '#52C41A', // Vert
  ];

  return couleurs[id % couleurs.length];
};

/**
 * Formate une distance pour l'affichage
 * @param {number} distanceKm - Distance en kilomètres
 * @returns {string} Distance formatée
 */
export const formaterDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Icône personnalisée pour les marqueurs d'arrêt
 */
export const iconeArret = (couleur = '#FF6B6B') => {
  return `
    <div style="
      background-color: ${couleur};
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    ">
      📍
    </div>
  `;
};

/**
 * Icône pour la position de l'utilisateur
 */
export const iconeUtilisateur = () => {
  return `
    <div style="
      background-color: #4285F4;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 10px rgba(66, 133, 244, 0.5);
      animation: pulse 2s infinite;
    "></div>
  `;
};

export default {
  calculerDistance,
  trouverCentre,
  calculerBounds,
  genererCouleurBus,
  formaterDistance,
  iconeArret,
  iconeUtilisateur,
};
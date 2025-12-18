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
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convertir degrés en radians
 */
const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Formater la distance pour l'affichage
 * @param {number} distanceKm - Distance en kilomètres
 * @returns {string} Distance formatée
 */
export const formaterDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

/**
 * Estimer le temps de marche
 * @param {number} distanceKm - Distance en kilomètres
 * @returns {string} Temps estimé
 */
export const estimerTempsMarche = (distanceKm) => {
  const vitesseMoyenne = 5; // km/h
  const heures = distanceKm / vitesseMoyenne;
  const minutes = Math.round(heures * 60);
  
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? m : ''}`;
};
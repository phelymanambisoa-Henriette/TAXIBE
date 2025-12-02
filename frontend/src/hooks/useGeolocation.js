// src/hooks/useGeolocation.js
import { useState, useEffect } from 'react';

const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
      setLoading(false);
      return;
    }

    const handleSuccess = (position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setLoading(false);
      console.log('📍 Position obtenue:', position.coords);
    };

    const handleError = (err) => {
      setError(err.message);
      setLoading(false);
      console.error('❌ Erreur géolocalisation:', err.message);
    };

    // Options de géolocalisation
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    // Demande la position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // Watch position (suivi en temps réel - optionnel)
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    // Cleanup
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { location, error, loading };
};

export default useGeolocation;
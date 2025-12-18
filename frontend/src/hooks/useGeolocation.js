// src/hooks/useGeolocation.js
import { useState, useEffect, useCallback } from 'react';

const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(false);
  const [watchId, setWatchId] = useState(null);

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
    ...options,
  };

  // Vérifier si la géolocalisation est supportée
  const isSupported = 'geolocation' in navigator;

  // Obtenir la position actuelle
  const getCurrentPosition = useCallback(() => {
    if (!isSupported) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      return Promise.reject(new Error('Geolocation not supported'));
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp,
          };
          setLocation(loc);
          setLoading(false);
          resolve(loc);
        },
        (err) => {
          const errorMessages = {
            1: 'Permission refusée',
            2: 'Position indisponible',
            3: 'Délai dépassé',
          };
          const errorMessage = errorMessages[err.code] || 'Erreur inconnue';
          setError(errorMessage);
          setLoading(false);
          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  }, [isSupported, defaultOptions]);

  // Commencer à surveiller la position
  const startWatching = useCallback(() => {
    if (!isSupported) {
      setError("La géolocalisation n'est pas supportée");
      return;
    }

    if (watching) return;

    setWatching(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };
        setLocation(loc);
      },
      (err) => {
        const errorMessages = {
          1: 'Permission refusée',
          2: 'Position indisponible',
          3: 'Délai dépassé',
        };
        setError(errorMessages[err.code] || 'Erreur de suivi');
      },
      {
        ...defaultOptions,
        maximumAge: 5000,
      }
    );

    setWatchId(id);
  }, [isSupported, watching, defaultOptions]);

  // Arrêter la surveillance
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setWatching(false);
    }
  }, [watchId]);

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    location,
    error,
    loading,
    watching,
    isSupported,
    getCurrentPosition,
    startWatching,
    stopWatching,
  };
};

export default useGeolocation;
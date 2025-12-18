// src/contexts/LocationContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { calculateDistance, DEFAULT_CENTER, DEFAULT_ZOOM } from '../leafletConfig';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  // ===== ÉTAT UTILISATEUR =====
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [watchId, setWatchId] = useState(null);

  // ===== ÉTAT CARTE =====
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [mapInstance, setMapInstance] = useState(null);

  // ===== ÉTAT ARRÊTS =====
  const [allStops, setAllStops] = useState([]);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [searchRadius, setSearchRadius] = useState(500);

  // ===== ÉTAT LIGNES DE BUS =====
  const [busLines, setBusLines] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [lineStops, setLineStops] = useState([]);

  // ===== ÉTAT RECHERCHE =====
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // ===== ÉTAT ITINÉRAIRE (NOUVEAU) =====
  const [itineraireMode, setItineraireMode] = useState(false);
  const [departArret, setDepartArret] = useState(null);
  const [arriveeArret, setArriveeArret] = useState(null);
  const [useCurrentLocationAsDepart, setUseCurrentLocationAsDepart] = useState(true);
  const [itineraireResult, setItineraireResult] = useState(null);
  const [isSearchingItineraire, setIsSearchingItineraire] = useState(false);
  const [itineraireError, setItineraireError] = useState(null);

  // ===== ÉTAT UI =====
  const [showNearbyPanel, setShowNearbyPanel] = useState(true);
  const [showLineInfo, setShowLineInfo] = useState(false);
  const [showItinerairePanel, setShowItinerairePanel] = useState(false);
  const [activePanel, setActivePanel] = useState('nearby'); // 'nearby', 'search', 'itineraire', 'lineInfo'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ===== FONCTIONS GÉOLOCALISATION =====
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée par votre navigateur");
      return Promise.reject(new Error('Geolocation not supported'));
    }

    setIsLocating(true);
    setLocationError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          setUserLocation(location);
          setMapCenter([location.lat, location.lng]);
          setIsLocating(false);
          resolve(location);
        },
        (error) => {
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Vous avez refusé la géolocalisation';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Position indisponible';
              break;
            case error.TIMEOUT:
              errorMessage = 'Délai de localisation dépassé';
              break;
            default:
              errorMessage = 'Erreur de géolocalisation';
          }
          setLocationError(errorMessage);
          setIsLocating(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        setUserLocation(location);
      },
      (error) => {
        setLocationError('Erreur de suivi de position');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    setWatchId(id);
  }, []);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // ===== FONCTIONS ARRÊTS PROCHES =====
  const findNearbyStops = useCallback(
    (location = userLocation, radius = searchRadius) => {
      if (!location || !allStops.length) return [];

      const nearby = allStops
        .map((stop) => ({
          ...stop,
          distance: calculateDistance(
            location.lat,
            location.lng,
            stop.latitude,
            stop.longitude
          ),
        }))
        .filter((stop) => stop.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      setNearbyStops(nearby);
      return nearby;
    },
    [allStops, searchRadius, userLocation]
  );

  // Recalculer les arrêts proches quand la position ou le rayon change
  useEffect(() => {
    if (userLocation && allStops.length > 0) {
      findNearbyStops(userLocation, searchRadius);
    }
  }, [userLocation, allStops, searchRadius, findNearbyStops]);

  // ===== FONCTIONS CARTE =====
  const flyTo = useCallback(
    (position, zoom = 16) => {
      if (mapInstance) {
        mapInstance.flyTo(position, zoom);
      } else {
        setMapCenter(position);
        setMapZoom(zoom);
      }
    },
    [mapInstance]
  );

  const centerOnUser = useCallback(() => {
    if (userLocation) {
      flyTo([userLocation.lat, userLocation.lng], 16);
    } else {
      getCurrentPosition().then((location) => {
        flyTo([location.lat, location.lng], 16);
      });
    }
  }, [userLocation, flyTo, getCurrentPosition]);

  // ===== FONCTIONS SÉLECTION =====
  const selectStop = useCallback((stop) => {
    setSelectedStop(stop);
    setSelectedLine(null);
    setLineStops([]);
    if (stop) {
      flyTo([stop.latitude, stop.longitude], 17);
    }
  }, [flyTo]);

  const selectLine = useCallback((line) => {
    setSelectedLine(line);
    setShowLineInfo(true);
    setActivePanel('lineInfo');
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedStop(null);
    setSelectedLine(null);
    setLineStops([]);
    setShowLineInfo(false);
    if (activePanel === 'lineInfo') {
      setActivePanel('nearby');
    }
  }, [activePanel]);

  // ===== FONCTIONS ITINÉRAIRE (NOUVEAU) =====
  const openItineraireMode = useCallback(() => {
    setItineraireMode(true);
    setShowItinerairePanel(true);
    setActivePanel('itineraire');
    setItineraireResult(null);
    setItineraireError(null);
    
    // Par défaut, utiliser la position actuelle comme départ
    if (userLocation) {
      setUseCurrentLocationAsDepart(true);
      setDepartArret(null);
    }
  }, [userLocation]);

  const closeItineraireMode = useCallback(() => {
    setItineraireMode(false);
    setShowItinerairePanel(false);
    setDepartArret(null);
    setArriveeArret(null);
    setItineraireResult(null);
    setItineraireError(null);
    setActivePanel('nearby');
  }, []);

  const setDepartFromStop = useCallback((stop) => {
    setDepartArret(stop);
    setUseCurrentLocationAsDepart(false);
  }, []);

  const setDepartFromCurrentLocation = useCallback(() => {
    setDepartArret(null);
    setUseCurrentLocationAsDepart(true);
  }, []);

  const setArrivee = useCallback((stop) => {
    setArriveeArret(stop);
  }, []);

  const swapDepartArrivee = useCallback(() => {
    if (useCurrentLocationAsDepart && arriveeArret) {
      // Position -> Arrêt devient Arrêt -> ???
      setDepartArret(arriveeArret);
      setArriveeArret(null);
      setUseCurrentLocationAsDepart(false);
    } else if (departArret && arriveeArret) {
      // Arrêt A -> Arrêt B devient Arrêt B -> Arrêt A
      const temp = departArret;
      setDepartArret(arriveeArret);
      setArriveeArret(temp);
    } else if (departArret && !arriveeArret) {
      // Arrêt -> ??? devient Position -> Arrêt
      setArriveeArret(departArret);
      setDepartArret(null);
      setUseCurrentLocationAsDepart(true);
    }
  }, [useCurrentLocationAsDepart, departArret, arriveeArret]);

  const clearItineraire = useCallback(() => {
    setDepartArret(null);
    setArriveeArret(null);
    setItineraireResult(null);
    setItineraireError(null);
    setUseCurrentLocationAsDepart(true);
  }, []);

  // ===== NETTOYAGE =====
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // ===== VALEUR DU CONTEXT =====
  const value = {
    // Localisation utilisateur
    userLocation,
    setUserLocation,
    locationError,
    setLocationError,
    isLocating,
    getCurrentPosition,
    startWatching,
    stopWatching,
    isWatching: watchId !== null,

    // Carte
    mapCenter,
    setMapCenter,
    mapZoom,
    setMapZoom,
    mapInstance,
    setMapInstance,
    flyTo,
    centerOnUser,

    // Arrêts
    allStops,
    setAllStops,
    nearbyStops,
    setNearbyStops,
    selectedStop,
    setSelectedStop,
    selectStop,
    findNearbyStops,
    searchRadius,
    setSearchRadius,

    // Lignes
    busLines,
    setBusLines,
    selectedLine,
    setSelectedLine,
    selectLine,
    lineStops,
    setLineStops,
    clearSelection,

    // Recherche
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,

    // Itinéraire (NOUVEAU)
    itineraireMode,
    setItineraireMode,
    departArret,
    setDepartArret,
    arriveeArret,
    setArriveeArret,
    useCurrentLocationAsDepart,
    setUseCurrentLocationAsDepart,
    itineraireResult,
    setItineraireResult,
    isSearchingItineraire,
    setIsSearchingItineraire,
    itineraireError,
    setItineraireError,
    openItineraireMode,
    closeItineraireMode,
    setDepartFromStop,
    setDepartFromCurrentLocation,
    setArrivee,
    swapDepartArrivee,
    clearItineraire,

    // UI
    showNearbyPanel,
    setShowNearbyPanel,
    showLineInfo,
    setShowLineInfo,
    showItinerairePanel,
    setShowItinerairePanel,
    activePanel,
    setActivePanel,
    loading,
    setLoading,
    error,
    setError,

    // Utils
    calculateDistance,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export default LocationContext;
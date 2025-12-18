// src/components/Carte/CarteInteractive.jsx - VERSION MISE À JOUR
import React, { useEffect, useCallback, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation as useRouterLocation } from 'react-router-dom';

import { useLocation } from '../../contexts/LocationContext';
import localisationService from '../../services/localisationService';

import UserLocationMarker from '../map/UserLocationMarker';
import BusStopMarker from '../map/BusStopMarker';
import BusLinePolyline from '../map/BusLinePolyline';
import SearchPanel from '../map/SearchPanel';
import NearbyStopsPanel from '../map/NearbyStopsPanel';
import BusLineInfo from '../map/BusLineInfo';
import MapControls from '../map/MapControls';
import LoadingSpinner from '../common/LoadingSpinner';

// 🆕 Nouveaux composants pour les trajets
import BusLinesPanel from '../map/BusLinesPanel';
import BusTrajetLayer from '../map/BusTrajetLayer';
import AllTrajetsLayer from '../map/AllTrajetsLayer';

import './CarteInteractive.css';

import BusLineLabel from '../map/BusLineLabel';
import '../map/BusLineLabel.css';

// Composant pour synchroniser le contexte avec la carte Leaflet
const MapSync = () => {
  const map = useMap();
  const { setMapInstance, mapCenter, mapZoom } = useLocation();

  useEffect(() => {
    if (map && setMapInstance) {
      setMapInstance(map);
    }
  }, [map, setMapInstance]);

  useEffect(() => {
    if (map && mapCenter && mapZoom) {
      map.setView(mapCenter, mapZoom);
    }
  }, [map, mapCenter, mapZoom]);

  return null;
};

const CarteInteractive = () => {
  const routerLocation = useRouterLocation();

  const {
    mapCenter,
    mapZoom,
    userLocation,
    allStops,
    setAllStops,
    nearbyStops,
    selectedStop,
    selectedLine,
    lineStops,
    setLineStops,
    showNearbyPanel,
    setShowNearbyPanel,
    showLineInfo,
    loading,
    setLoading,
    error,
    setError,
    getCurrentPosition,
    isLocating,
    findNearbyStops,
  } = useLocation();

  // 🆕 États pour les trajets
  const [showBusLinesPanel, setShowBusLinesPanel] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [showAllTrajets, setShowAllTrajets] = useState(false);
  const [visibleDirections, setVisibleDirections] = useState({
    aller: true,
    retour: true,
  });

  // Pour tracer un itinéraire simple from→to
  const [routeFrom, setRouteFrom] = useState(null);
  const [routeTo, setRouteTo] = useState(null);

  // Charger tous les arrêts au démarrage
  useEffect(() => {
    let mounted = true;

    const loadStops = async () => {
      try {
        setLoading(true);
        console.log('📡 Chargement des arrêts...');

        const stops = await localisationService.getAllArrets();

        if (mounted) {
          console.log('✅ Arrêts chargés:', stops.length);
          setAllStops(stops);
          setError(null);
        }
      } catch (err) {
        console.error('❌ Erreur chargement arrêts:', err);

        if (mounted) {
          setError('Impossible de charger les arrêts. Vérifiez que le serveur Django est démarré.');
          setAllStops(getMockStops());
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStops();

    return () => {
      mounted = false;
    };
  }, [setAllStops, setLoading, setError]);

  // Obtenir la position au démarrage
  useEffect(() => {
    let mounted = true;

    getCurrentPosition()
      .then((location) => {
        if (mounted && location) {
          console.log('✅ Position obtenue:', location);
          findNearbyStops(location);
        }
      })
      .catch(() => {
        if (mounted) {
          console.log('⚠️ Position non disponible.');
        }
      });

    return () => {
      mounted = false;
    };
  }, [getCurrentPosition, findNearbyStops]);

  // Charger les arrêts d'une ligne sélectionnée
  useEffect(() => {
    let mounted = true;

    const loadLineStops = async () => {
      if (selectedLine) {
        try {
          const stops = await localisationService.getArretsByLigne(selectedLine.id);
          if (mounted) {
            setLineStops(stops);
          }
        } catch (err) {
          if (mounted) {
            setLineStops([]);
          }
        }
      } else {
        if (mounted) {
          setLineStops([]);
        }
      }
    };

    loadLineStops();

    return () => {
      mounted = false;
    };
  }, [selectedLine, setLineStops]);

  // Lire les paramètres from/to de l'URL
  useEffect(() => {
    if (!allStops || allStops.length === 0) return;

    const params = new URLSearchParams(routerLocation.search);
    const fromId = params.get('from');
    const toId = params.get('to');

    let fromStop = null;
    let toStop = null;

    if (fromId) {
      fromStop = allStops.find(s => String(s.id) === String(fromId));
    }

    if (toId) {
      toStop = allStops.find(s => String(s.id) === String(toId));
    }

    setRouteFrom(fromStop || null);
    setRouteTo(toStop || null);
  }, [routerLocation.search, allStops]);

  // 🆕 Gérer la sélection d'un bus
  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
    setShowAllTrajets(false);
  };

  // 🆕 Toggle direction
  const handleToggleDirection = (direction) => {
    setVisibleDirections(prev => ({
      ...prev,
      [direction]: !prev[direction],
    }));
  };

  // Déterminer quels arrêts afficher
  const getDisplayStops = useCallback(() => {
    // Si un bus est sélectionné, ne pas afficher les marqueurs génériques
    if (selectedBus) return [];
    
    if (selectedLine && lineStops.length > 0) {
      return lineStops;
    }
    if (nearbyStops.length > 0) {
      return nearbyStops;
    }
    return allStops.slice(0, 50); // Limiter pour performance
  }, [selectedBus, selectedLine, lineStops, nearbyStops, allStops]);

  if (loading && allStops.length === 0) {
    return (
      <div className="carte-loading">
        <LoadingSpinner />
        <p>Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className="carte-interactive-container">
      {/* Panneau de recherche */}
      <SearchPanel />

      {/* 🆕 Bouton pour afficher le panneau des lignes */}
      <button
        className="show-bus-lines-btn"
        onClick={() => setShowBusLinesPanel(!showBusLinesPanel)}
        title="Afficher les lignes de bus"
      >
        🚌 Lignes
      </button>

      {/* 🆕 Panneau des lignes de bus */}
      {showBusLinesPanel && (
        <BusLinesPanel
          onSelectBus={handleSelectBus}
          selectedBusId={selectedBus?.id}
          onClose={() => setShowBusLinesPanel(false)}
          visibleDirections={visibleDirections}
          onToggleDirection={handleToggleDirection}
        />
      )}

      {/* 🆕 Bouton pour afficher tous les trajets */}
      <button
        className={`show-all-trajets-btn ${showAllTrajets ? 'active' : ''}`}
        onClick={() => {
          setShowAllTrajets(!showAllTrajets);
          setSelectedBus(null);
        }}
        title="Afficher tous les trajets"
      >
        🗺️ {showAllTrajets ? 'Masquer trajets' : 'Tous les trajets'}
      </button>

      {/* 🆕 Info bus sélectionné */}
      {selectedBus && (
        <div className="selected-bus-info">
          <span>
            <strong>Bus {selectedBus.numero}</strong>
          </span>
          <button onClick={() => setSelectedBus(null)}>✕ Fermer</button>
        </div>
      )}

      {/* Panneau des arrêts proches */}
      {showNearbyPanel && nearbyStops.length > 0 && (
        <NearbyStopsPanel onClose={() => setShowNearbyPanel(false)} />
      )}

      {/* Info ligne de bus (ancien système) */}
      {showLineInfo && selectedLine && (
        <BusLineInfo line={selectedLine} stops={lineStops} />
      )}

      {/* Carte Leaflet */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="leaflet-map"
        zoomControl={false}
      >
        <MapSync />

        <TileLayer
          attribution='&copy; OSM'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="bottomright" />

        <MapControls
          onToggleNearby={() => setShowNearbyPanel(!showNearbyPanel)}
        />

        {/* Marqueur utilisateur */}
        {userLocation && <UserLocationMarker />}

        {/* 🆕 Afficher tous les trajets */}
        {showAllTrajets && !selectedBus && (
          <AllTrajetsLayer
            showAller={visibleDirections.aller}
            showRetour={visibleDirections.retour}
            onSelectBus={handleSelectBus}
          />
        )}

        {/* 🆕 Afficher le trajet d'un bus sélectionné */}
        {selectedBus && (
          <BusTrajetLayer
            busId={selectedBus.id}
            showAller={visibleDirections.aller}
            showRetour={visibleDirections.retour}
          />
        )}

        {/* Marqueurs des arrêts (quand pas de bus sélectionné) */}
        {!selectedBus && !showAllTrajets && getDisplayStops().map((stop) => (
          <BusStopMarker
            key={stop.id}
            stop={stop}
            isNearby={nearbyStops.some((ns) => ns.id === stop.id)}
            isSelected={selectedStop?.id === stop.id}
          />
        ))}

        {/* Tracé de la ligne sélectionnée (ancien système) */}
        {!selectedBus && !showAllTrajets && selectedLine && lineStops.length > 1 && (
          <BusLinePolyline stops={lineStops} line={selectedLine} />
        )}

        {/* Tracé itinéraire from→to depuis URL */}
        {routeFrom && routeTo && (
          <Polyline
            positions={[
              [routeFrom.latitude, routeFrom.longitude],
              [routeTo.latitude, routeTo.longitude],
            ]}
            pathOptions={{
              color: '#01c6b2',
              weight: 5,
              opacity: 0.8,
            }}
          />
        )}
      </MapContainer>

      {/* Message d'erreur */}
      {error && (
        <div className="carte-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Indicateur de localisation */}
      {isLocating && (
        <div className="carte-locating">
          <LoadingSpinner size="small" />
          <span>Localisation en cours...</span>
        </div>
      )}
    </div>
  );
};

// Mock data
const getMockStops = () => [
  { id: 1, nom: 'Analakely', latitude: -18.9103, longitude: 47.5255, quartier: 'Centre-ville' },
];

export default CarteInteractive;
// src/components/map/GoogleRouteBuilder.jsx (AUTONOME ET STABLE)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { FaUndo, FaTrash } from 'react-icons/fa';

const containerStyle = { width: '100%', height: '100%', };
const pathOptions = { strokeColor: '#00D2A0', strokeOpacity: 1.0, strokeWeight: 5, };
const defaultCenter = { lat: -18.8792, lng: 47.5079 };

const GoogleRouteBuilder = ({ 
    apiKey, center, availableStops, onRouteChanged      
}) => {
    
  // Re-intégration du chargement de l'API ici
  const { isLoaded, loadError } = useJsApiLoader({ 
    id: 'google-map-script-admin-only', // Changer l'ID pour éviter les conflits de nommage
    googleMapsApiKey: apiKey,
    libraries: ['places'],
    preventGoogleFontsLoading: true
  });

  const [map, setMap] = useState(null);
  const [selectedStops, setSelectedStops] = useState([]);

  // Effet : Recentrer la carte quand la ville change
  useEffect(() => {
    if (map && center && center.lat && center.lng) {
      map.panTo(center);
      map.setZoom(14);
    }
  }, [center, map]);

  const onLoad = useCallback((map) => setMap(map), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const handleStopClick = (arret) => {
    const lastStop = selectedStops[selectedStops.length - 1];
    if (lastStop && lastStop.id === arret.id) return;
    const newSelection = [...selectedStops, arret];
    setSelectedStops(newSelection);
    onRouteChanged(newSelection); 
  };

  const handleUndo = () => { /* ... */ };
  const handleReset = () => { /* ... */ };
  
  const routePath = useMemo(() => selectedStops.map(stop => ({
      lat: parseFloat(stop.latitude),
      lng: parseFloat(stop.longitude)
  })), [selectedStops]);

  const getMarkerIcon = (isSelected) => { /* ... Logique d'icône ... */
      if (isSelected) {
          return { path: window.google.maps.SymbolPath.CIRCLE, fillColor: '#00D2A0', fillOpacity: 1, strokeWeight: 4, scale: 8, strokeColor: '#FFFFFF' };
      }
      return { path: window.google.maps.SymbolPath.CIRCLE, fillColor: '#A9A9A9', fillOpacity: 0.8, strokeWeight: 2, scale: 6, strokeColor: '#FFFFFF' };
  };


  // AFFICHAGE DES ÉTATS DE CHARGEMENT
  if (loadError) return <div className="map-error-placeholder">Erreur de clé ou de configuration: API Load Failed.</div>;
  if (!isLoaded) return <div className="map-loading-placeholder">Chargement Google Maps...</div>;


  return (
    <div className="leaflet-builder-wrapper">
      
      {/* Contrôles au-dessus de la carte */}
      <div className="builder-controls">
        <span className="info-text">Arrêts sélectionnés : {selectedStops.length}</span>
        <div className="action-buttons">
            <button type="button" onClick={handleUndo} disabled={selectedStops.length === 0} className="btn-map-action">
                <FaUndo /> Annuler
            </button>
            <button type="button" onClick={handleReset} disabled={selectedStops.length === 0} className="btn-map-action danger">
                <FaTrash /> Effacer
            </button>
        </div>
      </div>

      <div className="map-container-area">
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center || defaultCenter}
            zoom={13}
            onLoad={onLoad}
            onUnmount={onUnmount}
            mapContainerClassName="google-map-forced-style" 
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                disableDefaultUI: true,
                zoomControl: true,
            }}
        >
            {/* 1. Arrêts disponibles (cliquables) */}
            {availableStops.map((arret) => {
                const isSelected = selectedStops.some(s => s.id === arret.id);
                const order = selectedStops.findIndex(s => s.id === arret.id);

                return (
                    <Marker
                        key={arret.id}
                        position={{ lat: parseFloat(arret.latitude), lng: parseFloat(arret.longitude) }}
                        title={arret.nomArret || arret.nom}
                        onClick={() => handleStopClick(arret)}
                        label={isSelected ? {
                            text: `${order + 1}`,
                            color: "white",
                            fontWeight: "bold"
                        } : undefined}
                        icon={getMarkerIcon(isSelected)}
                        zIndex={isSelected ? 1000 : 0}
                    />
                );
            })}

            {/* 2. Tracé de la Polyline */}
            {routePath.length > 1 && (
                <Polyline path={routePath} options={pathOptions} />
            )}
            
        </GoogleMap>
      </div>
    </div>
  );
};

export default GoogleRouteBuilder;
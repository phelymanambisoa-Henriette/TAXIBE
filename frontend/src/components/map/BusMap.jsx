import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { localisationService } from '../../services/localisationService';
import { transportService } from '../../services/transportService';
import useGeolocation from '../../hooks/useGeolocation';
import { useItineraire } from '../../contexts/ItineraireContext';
import { FaBus, FaMapMarkerAlt, FaLocationArrow, FaTimes, FaLayerGroup } from 'react-icons/fa';
import './BusMap.css';

// --- CONFIGURATION LEAFLET ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// --- ICONES PERSONNALISÉES ---
// Position utilisateur (Pulse Bleu)
const userIcon = new L.DivIcon({
  className: 'user-location-marker',
  html: '<div class="pulse"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Arrêt standard (Petit point gris)
const stopIcon = new L.DivIcon({
  className: 'custom-stop-icon',
  html: '<div class="stop-dot"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

// Départ (Vert)
const startIcon = new L.DivIcon({
  className: 'custom-stop-icon',
  html: '<div class="stop-pin start"><i class="fas fa-play"></i></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Arrivée (Rouge)
const endIcon = new L.DivIcon({
  className: 'custom-stop-icon',
  html: '<div class="stop-pin end"><i class="fas fa-flag-checkered"></i></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// --- COMPOSANTS HELPER ---
const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
};

const FitBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) map.fitBounds(bounds, { padding: [50, 50] });
  }, [bounds, map]);
  return null;
};

// --- MAIN COMPONENT ---
const BusMap = ({ selectedBus: initialSelectedBus = null, showStops = true }) => {
  const [buses, setBuses] = useState([]);
  const [trajets, setTrajets] = useState([]);
  const [arrets, setArrets] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState(initialSelectedBus);
  const [mapCenter, setMapCenter] = useState([-18.8792, 47.5079]);
  const [viewMode, setViewMode] = useState('all'); // 'all' ou 'selected'

  const { location: userLocation } = useGeolocation();
  const { itineraireSelectionne, effacerItineraire } = useItineraire();

  // Chargement initial
  useEffect(() => {
    const loadData = async () => {
      try {
        const [busRes, arretRes] = await Promise.all([
          transportService.getAllBuses(),
          localisationService.getAllArrets()
        ]);
        
        const busList = Array.isArray(busRes.data) ? busRes.data : busRes.data.results || [];
        setBuses(busList);
        setArrets(Array.isArray(arretRes.data) ? arretRes.data : arretRes.data.results || []);

        // Charger les trajets (lignes)
        const allTrajets = [];
        for (const bus of busList) {
          try {
            // Note: Idéalement, le backend devrait envoyer les trajets avec getAllBuses pour éviter N requêtes
            const detail = await transportService.getBusById(bus.id);
            if (detail.data.trajets) {
              detail.data.trajets.forEach(t => {
                if (t.arrets?.length > 1) {
                  allTrajets.push({
                    busId: bus.id,
                    busNumero: bus.numeroBus,
                    coords: t.arrets.map(a => [a.latitude, a.longitude]),
                    color: '#00D2A0' // Couleur par défaut (Vert Shibux)
                  });
                }
              });
            }
          } catch (e) { console.warn(`Pas de trajet pour bus ${bus.id}`); }
        }
        setTrajets(allTrajets);

      } catch (err) { console.error(err); }
    };
    loadData();
  }, []);

  // Gestion Itinéraire Context
  useEffect(() => {
    if (itineraireSelectionne) {
      setSelectedBusId(itineraireSelectionne.bus.id);
      setViewMode('selected');
    }
  }, [itineraireSelectionne]);

  // Filtrage pour l'affichage
  const displayedTrajets = useMemo(() => {
    if (selectedBusId) {
      return trajets.filter(t => t.busId === parseInt(selectedBusId));
    }
    return trajets;
  }, [trajets, selectedBusId]);

  // Calcul des bounds (limites de la carte)
  const mapBounds = useMemo(() => {
    if (displayedTrajets.length > 0) {
      const allCoords = displayedTrajets.flatMap(t => t.coords);
      if (allCoords.length > 0) return allCoords;
    }
    return null;
  }, [displayedTrajets]);

  const handleSelectBus = (id) => {
    if (selectedBusId === id) {
      setSelectedBusId(null); // Désélectionner
      setViewMode('all');
    } else {
      setSelectedBusId(id);
      setViewMode('selected');
    }
  };

  const handleRecenter = () => {
    if (userLocation) setMapCenter([userLocation.latitude, userLocation.longitude]);
  };

  return (
    <div className="bus-map-layout">
      
      {/* --- SIDEBAR CARTE --- */}
      <div className="map-sidebar">
        <div className="map-sidebar-header">
          <h3><FaBus /> Réseau TaxiBe</h3>
          <div className="map-stats">
            <span>{buses.length} Lignes</span>
            <span>{arrets.length} Arrêts</span>
          </div>
        </div>

        {/* Itinéraire Actif (si recherche faite) */}
        {itineraireSelectionne && (
          <div className="active-route-card">
            <div className="route-header">
              <strong>Itinéraire en cours</strong>
              <button onClick={effacerItineraire}><FaTimes /></button>
            </div>
            <div className="route-details">
              <span className="badge-bus">Bus {itineraireSelectionne.bus.numero}</span>
              <span>{itineraireSelectionne.nb_arrets} arrêts</span>
            </div>
          </div>
        )}

        {/* Liste des Bus (Boutons filtres) */}
        <div className="bus-filter-list">
          <button 
            className={`bus-filter-item ${!selectedBusId ? 'active' : ''}`}
            onClick={() => { setSelectedBusId(null); setViewMode('all'); }}
          >
            <span className="dot-indicator all"></span>
            Tous les bus
          </button>

          {buses.map(bus => (
            <button 
              key={bus.id}
              className={`bus-filter-item ${selectedBusId === bus.id ? 'active' : ''}`}
              onClick={() => handleSelectBus(bus.id)}
            >
              <span className="dot-indicator"></span>
              Bus <strong>{bus.numeroBus}</strong>
            </button>
          ))}
        </div>

        {userLocation && (
          <button className="btn-locate-me" onClick={handleRecenter}>
            <FaLocationArrow /> Ma position
          </button>
        )}
      </div>

      {/* --- ZONE CARTE --- */}
      <div className="map-wrapper">
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          
          {/* Fond de carte Moderne (CartoDB Voyager) */}
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          <RecenterMap center={mapCenter} />
          {mapBounds && <FitBounds bounds={mapBounds} />}

          {/* Position Utilisateur */}
          {userLocation && (
            <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
              <Popup>Vous êtes ici</Popup>
            </Marker>
          )}

          {/* Lignes des Bus */}
          {displayedTrajets.map((t, i) => (
            <Polyline 
              key={`${t.busId}-${i}`} 
              positions={t.coords}
              pathOptions={{ 
                color: selectedBusId && selectedBusId !== t.busId ? '#ddd' : '#00D2A0', // Griser les autres
                weight: selectedBusId === t.busId ? 6 : 4,
                opacity: selectedBusId && selectedBusId !== t.busId ? 0.3 : 0.8
              }}
            >
              <Popup><strong>Bus {t.busNumero}</strong></Popup>
            </Polyline>
          ))}

          {/* Arrêts (Affichés seulement si zoom suffisant ou bus sélectionné pour éviter surcharge) */}
          {showStops && arrets.map(arret => {
            // On n'affiche l'arrêt que s'il appartient au bus sélectionné (si un bus est sélectionné)
            // Pour simplifier ici, on affiche tout mais petit
            return (
              <Marker 
                key={arret.id} 
                position={[arret.latitude, arret.longitude]} 
                icon={stopIcon}
              >
                <Popup><strong>{arret.nomArret || arret.nom}</strong></Popup>
              </Marker>
            );
          })}

        </MapContainer>
      </div>
    </div>
  );
};

export default BusMap;
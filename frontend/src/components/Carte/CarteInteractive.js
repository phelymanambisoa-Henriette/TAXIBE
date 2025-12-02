import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { localisationService } from '../../services/localisationService';
import { transportService } from '../../services/transportService';
import { trouverCentre, calculerBounds, genererCouleurBus, formaterDistance, calculerDistance } from '../../utils/carteUtils';
import useGeolocation from '../../hooks/useGeolocation';
import { useItineraire } from '../../contexts/ItineraireContext';
import { FaBus, FaMapMarkerAlt, FaLocationArrow, FaTimes, FaRoad } from 'react-icons/fa';
import './CarteInteractive.css';

// --- CONFIGURATION LEAFLET ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// --- COMPOSANTS UTILES ---
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, map.getZoom()); }, [center, map]);
  return null;
};

const FitBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => { if (bounds) map.fitBounds(bounds, { padding: [50, 50] }); }, [bounds, map]);
  return null;
};

// --- ICONES ---
const userIcon = new L.DivIcon({
  className: 'user-location-marker',
  html: '<div class="pulse"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const arretIcon = (isSelected) => new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: ${isSelected ? '#00D2A0' : '#fff'}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid ${isSelected ? '#fff' : '#666'}; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const CarteInteractive = () => {
  const [arrets, setArrets] = useState([]);
  const [buses, setBuses] = useState([]);
  const [trajets, setTrajets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);
  const [showAllRoutes, setShowAllRoutes] = useState(true);
  const [mapCenter, setMapCenter] = useState([-18.8792, 47.5079]);
  const [mapBounds, setMapBounds] = useState(null);

  const { location: userLocation, error: geoError } = useGeolocation();
  const { itineraireSelectionne, departArrivee, effacerItineraire } = useItineraire();

  // Chargement initial
  useEffect(() => { loadData(); }, []);

  // Centrage sur les arrêts
  useEffect(() => {
    if (arrets.length > 0 && !itineraireSelectionne) {
      const center = trouverCentre(arrets);
      const bounds = calculerBounds(arrets);
      setMapCenter(center);
      setMapBounds(bounds);
    }
  }, [arrets, itineraireSelectionne]);

  // Gestion Itinéraire Context
  useEffect(() => {
    if (itineraireSelectionne && itineraireSelectionne.arrets) {
      const bounds = calculerBounds(itineraireSelectionne.arrets);
      setMapBounds(bounds);
      setShowAllRoutes(false);
      setSelectedBus(itineraireSelectionne.bus.id);
    }
  }, [itineraireSelectionne]);

  const loadData = async () => {
    setLoading(true);
    try {
      const arretsResponse = await localisationService.getAllArrets();
      setArrets(arretsResponse.data || []);
      const busesResponse = await transportService.getAllBuses();
      setBuses(busesResponse.data || []);
      await loadAllTrajets(busesResponse.data || []);
    } catch (err) {
      console.error(err);
      setError('Erreur chargement données');
    } finally {
      setLoading(false);
    }
  };

  const loadAllTrajets = async (busList) => {
    const trajetsData = [];
    for (const bus of busList) {
      try {
        const response = await transportService.getBusById(bus.id);
        if (response.data.trajets) {
          response.data.trajets.forEach((trajet) => {
            if (trajet.arrets?.length > 0) {
              trajetsData.push({
                busId: bus.id,
                busNumero: bus.numeroBus,
                trajetId: trajet.id,
                arrets: trajet.arrets,
                couleur: genererCouleurBus(bus.id),
              });
            }
          });
        }
      } catch (err) { console.error(err); }
    }
    setTrajets(trajetsData);
  };

  const handleBusClick = (busId) => {
    setSelectedBus(selectedBus === busId ? null : busId);
  };

  const handleRecenterUser = () => {
    if (userLocation) setMapCenter([userLocation.latitude, userLocation.longitude]);
  };

  const handleEffacerItineraire = () => {
    effacerItineraire();
    setShowAllRoutes(true);
    setSelectedBus(null);
  };

  if (loading) return <div className="carte-loading"><div className="spinner"></div><p>Chargement...</p></div>;
  if (error) return <div className="carte-error"><p>❌ {error}</p><button onClick={loadData}>Réessayer</button></div>;

  return (
    <div className="carte-interactive-container">
      
      {/* --- SIDEBAR GAUCHE --- */}
      <div className="carte-sidebar">
        <div className="sidebar-header">
          <h2><FaBus /> Réseau TaxiBe</h2>
          <p>{buses.length} bus • {arrets.length} arrêts</p>
        </div>

        {/* Affichage Itinéraire Sélectionné */}
        {itineraireSelectionne && departArrivee && (
          <div className="itineraire-card">
            <div className="itineraire-header-card">
              <h3>Trajet Actif</h3>
              <button onClick={handleEffacerItineraire} className="btn-close-route"><FaTimes /></button>
            </div>
            <div className="itineraire-info">
              <div className="itineraire-points">
                <span className="point start">{departArrivee.depart.nom}</span>
                <span className="arrow">➜</span>
                <span className="point end">{departArrivee.arrivee.nom}</span>
              </div>
              <div className="itineraire-meta">
                <span className="badge-bus">Bus {itineraireSelectionne.bus.numero}</span>
                <span>{itineraireSelectionne.nb_arrets} arrêts</span>
              </div>
            </div>
          </div>
        )}

        {/* Contrôles */}
        {!itineraireSelectionne && (
          <div className="carte-controls">
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={showAllRoutes}
                onChange={(e) => {
                  setShowAllRoutes(e.target.checked);
                  if (!e.target.checked) setSelectedBus(null);
                }}
              />
              <span className="checkmark"></span>
              Afficher toutes les lignes
            </label>
          </div>
        )}

        {/* Liste des Bus */}
        {!itineraireSelectionne && (
          <div className="bus-list-container">
            <h3>Lignes Disponibles</h3>
            <div className="bus-list-scroll">
              {buses.map((bus) => {
                const nbTrajets = trajets.filter((t) => t.busId === bus.id).length;
                return (
                  <div
                    key={bus.id}
                    className={`bus-item-row ${selectedBus === bus.id ? 'active' : ''}`}
                    onClick={() => handleBusClick(bus.id)}
                  >
                    <div className="bus-badge-icon" style={{ backgroundColor: genererCouleurBus(bus.id) }}>
                      {bus.numeroBus}
                    </div>
                    <div className="bus-text-info">
                      <span className="bus-name">Bus {bus.numeroBus}</span>
                      <span className="bus-sub">{nbTrajets} trajet(s)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {userLocation && (
          <button onClick={handleRecenterUser} className="btn-locate">
            <FaLocationArrow /> Ma position
          </button>
        )}
      </div>

      {/* --- MAP --- */}
      <div className="carte-map-wrapper">
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            attribution='&copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {mapBounds && <FitBounds bounds={mapBounds} />}
          <RecenterMap center={mapCenter} />

          {/* User Position */}
          {userLocation && (
            <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
              <Popup>Vous êtes ici</Popup>
            </Marker>
          )}

          {/* Arrêts */}
          {arrets.map((arret) => {
            const isOnSelectedRoute = selectedBus && trajets.filter(t => t.busId === selectedBus).some(t => t.arrets.some(a => a.id === arret.id));
            const isDepartOuArrivee = departArrivee && (arret.id === departArrivee.depart.id || arret.id === departArrivee.arrivee.id);
            
            if (isDepartOuArrivee) return null; // On utilise des marqueurs spéciaux pour ça

            // On affiche l'arrêt seulement si on montre tout ou s'il est sur la ligne sélectionnée
            if (!showAllRoutes && !isOnSelectedRoute && !selectedBus) return null;

            return (
              <Marker key={arret.id} position={[arret.latitude, arret.longitude]} icon={arretIcon(isOnSelectedRoute)}>
                <Popup>
                  <strong>{arret.nomArret || arret.nom}</strong>
                </Popup>
              </Marker>
            );
          })}

          {/* Trajets (Lignes) */}
          {trajets.map((trajet) => {
            if (itineraireSelectionne && trajet.busId !== itineraireSelectionne.bus.id) return null;
            const shouldShow = showAllRoutes || selectedBus === trajet.busId;
            if (!shouldShow) return null;

            return (
              <Polyline
                key={`${trajet.busId}-${trajet.trajetId}`}
                positions={trajet.arrets.map(a => [a.latitude, a.longitude])}
                color={selectedBus === trajet.busId ? '#00D2A0' : trajet.couleur}
                weight={selectedBus === trajet.busId ? 6 : 4}
                opacity={selectedBus === trajet.busId ? 1 : 0.6}
              >
                <Popup>Bus {trajet.busNumero}</Popup>
              </Polyline>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default CarteInteractive;
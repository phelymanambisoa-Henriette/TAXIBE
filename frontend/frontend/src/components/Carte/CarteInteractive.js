// src/components/Carte/CarteInteractive.jsx

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { localisationService } from '../../services/localisationService';
import { transportService } from '../../services/transportService';
import { trouverCentre, calculerBounds, genererCouleurBus } from '../../utils/carteUtils';
import useGeolocation from '../../hooks/useGeolocation';
import { useItineraire } from '../../contexts/ItineraireContext';
import { FaBus, FaLocationArrow, FaTimes, FaArrowRight } from 'react-icons/fa';
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
  useEffect(() => { 
    if (center) map.setView(center, map.getZoom()); 
  }, [center, map]);
  return null;
};

const FitBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => { 
    if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (e) {
        console.error('Erreur fitBounds:', e);
      }
    }
  }, [bounds, map]);
  return null;
};

// --- ICONES PERSONNALISÉES ---
const userIcon = new L.DivIcon({
  className: 'user-location-marker',
  html: '<div class="pulse"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const createCustomIcon = (color, label) => new L.DivIcon({
  className: 'custom-marker-icon',
  html: `
    <div class="marker-pin" style="background: ${color};">
      <span>${label}</span>
    </div>
  `,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

const departIcon = createCustomIcon('#2ecc71', 'D');
const arriveeIcon = createCustomIcon('#e74c3c', 'A');
const correspondanceIcon = createCustomIcon('#f39c12', 'C');

const arretIcon = (isSelected) => new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="
    background-color: ${isSelected ? '#00D2A0' : '#fff'}; 
    width: 14px; 
    height: 14px; 
    border-radius: 50%; 
    border: 3px solid ${isSelected ? '#fff' : '#3498db'}; 
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
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

  const { location: userLocation } = useGeolocation();
  const { 
    itineraireSelectionne, 
    depart, 
    arrivee, 
    departArrivee, 
    effacerItineraire 
  } = useItineraire();

  // Chargement initial
  useEffect(() => { 
    loadData(); 
  }, []);

  // Centrage sur les arrêts généraux
  useEffect(() => {
    if (arrets.length > 0 && !itineraireSelectionne) {
      const center = trouverCentre(arrets);
      const bounds = calculerBounds(arrets);
      setMapCenter(center);
      setMapBounds(bounds);
    }
  }, [arrets, itineraireSelectionne]);

  // 🔥 Gestion Itinéraire Context - CORRECTION PRINCIPALE
  useEffect(() => {
    if (itineraireSelectionne) {
      console.log('🗺️ Affichage itinéraire sur la carte:', itineraireSelectionne);
      
      let arretsItineraire = [];
      
      // Récupérer les arrêts selon le type d'itinéraire
      if (itineraireSelectionne.type === 'direct' && itineraireSelectionne.arrets) {
        arretsItineraire = itineraireSelectionne.arrets;
      } else if (itineraireSelectionne.type === 'correspondance') {
        const arrets1 = itineraireSelectionne.trajet1?.arrets || [];
        const arrets2 = itineraireSelectionne.trajet2?.arrets || [];
        arretsItineraire = [...arrets1, ...arrets2];
      }
      
      // Ajouter départ et arrivée si disponibles
      if (depart?.latitude && depart?.longitude) {
        arretsItineraire = [{ 
          id: 'depart', 
          latitude: depart.latitude, 
          longitude: depart.longitude,
          nom: depart.nom 
        }, ...arretsItineraire];
      }
      
      if (arrivee?.latitude && arrivee?.longitude) {
        arretsItineraire = [...arretsItineraire, { 
          id: 'arrivee', 
          latitude: arrivee.latitude, 
          longitude: arrivee.longitude,
          nom: arrivee.nom 
        }];
      }

      if (arretsItineraire.length > 0) {
        const bounds = calculerBounds(arretsItineraire);
        setMapBounds(bounds);
      }
      
      setShowAllRoutes(false);
      
      if (itineraireSelectionne.bus?.id) {
        setSelectedBus(itineraireSelectionne.bus.id);
      }
    }
  }, [itineraireSelectionne, depart, arrivee]);

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
        if (response.data?.trajets) {
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
      } catch (err) { 
        console.error(err); 
      }
    }
    setTrajets(trajetsData);
  };

  const handleBusClick = (busId) => {
    setSelectedBus(selectedBus === busId ? null : busId);
  };

  const handleRecenterUser = () => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
    }
  };

  const handleEffacerItineraire = () => {
    effacerItineraire();
    setShowAllRoutes(true);
    setSelectedBus(null);
  };

  // Obtenir les positions de la polyline pour l'itinéraire
  const getItinerairePositions = () => {
    if (!itineraireSelectionne) return [];

    if (itineraireSelectionne.type === 'direct' && itineraireSelectionne.arrets) {
      return itineraireSelectionne.arrets
        .filter(a => a.latitude && a.longitude)
        .map(a => [a.latitude, a.longitude]);
    }

    return [];
  };

  const getCorrespondancePositions = () => {
    if (!itineraireSelectionne || itineraireSelectionne.type !== 'correspondance') {
      return { trajet1: [], trajet2: [] };
    }

    const trajet1 = (itineraireSelectionne.trajet1?.arrets || [])
      .filter(a => a.latitude && a.longitude)
      .map(a => [a.latitude, a.longitude]);

    const trajet2 = (itineraireSelectionne.trajet2?.arrets || [])
      .filter(a => a.latitude && a.longitude)
      .map(a => [a.latitude, a.longitude]);

    return { trajet1, trajet2 };
  };

  if (loading) {
    return (
      <div className="carte-loading">
        <div className="spinner"></div>
        <p>Chargement de la carte...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="carte-error">
        <p>❌ {error}</p>
        <button onClick={loadData}>Réessayer</button>
      </div>
    );
  }

  const itinerairePositions = getItinerairePositions();
  const correspondancePositions = getCorrespondancePositions();

  return (
    <div className="carte-interactive-container">
      
      {/* --- SIDEBAR GAUCHE --- */}
      <div className="carte-sidebar">
        <div className="sidebar-header">
          <h2><FaBus /> Réseau TaxiBe</h2>
          <p>{buses.length} bus • {arrets.length} arrêts</p>
        </div>

        {/* 🔥 Affichage Itinéraire Sélectionné */}
        {itineraireSelectionne && (depart || arrivee || departArrivee) && (
          <div className="itineraire-card">
            <div className="itineraire-header-card">
              <h3>🗺️ Trajet Actif</h3>
              <button onClick={handleEffacerItineraire} className="btn-close-route">
                <FaTimes />
              </button>
            </div>
            
            <div className="itineraire-info">
              <div className="itineraire-points">
                <div className="point-row">
                  <span className="point-marker start">D</span>
                  <span className="point-name">
                    {depart?.nom || departArrivee?.depart?.nom || 'Départ'}
                  </span>
                </div>
                <div className="point-arrow">
                  <FaArrowRight />
                </div>
                <div className="point-row">
                  <span className="point-marker end">A</span>
                  <span className="point-name">
                    {arrivee?.nom || departArrivee?.arrivee?.nom || 'Arrivée'}
                  </span>
                </div>
              </div>
              
              <div className="itineraire-meta">
                {itineraireSelectionne.type === 'direct' ? (
                  <>
                    <span className="badge-bus">
                      <FaBus /> Bus {itineraireSelectionne.bus?.numero}
                    </span>
                    <span className="badge-arrets">
                      {itineraireSelectionne.nb_arrets} arrêts
                    </span>
                    <span className="badge-prix">
                      {itineraireSelectionne.bus?.frais || 600} Ar
                    </span>
                  </>
                ) : (
                  <>
                    <span className="badge-correspondance">
                      Correspondance
                    </span>
                    <span className="badge-prix">
                      {itineraireSelectionne.frais_total} Ar
                    </span>
                  </>
                )}
              </div>

              {/* Détails correspondance */}
              {itineraireSelectionne.type === 'correspondance' && (
                <div className="correspondance-details">
                  <div className="corresp-leg">
                    <span className="leg-bus blue">
                      Bus {itineraireSelectionne.trajet1?.bus?.numero}
                    </span>
                    <span className="leg-arrow">→</span>
                    <span className="leg-point">
                      {itineraireSelectionne.arret_correspondance?.nom}
                    </span>
                  </div>
                  <div className="corresp-change">
                    🔄 Changer de bus
                  </div>
                  <div className="corresp-leg">
                    <span className="leg-bus red">
                      Bus {itineraireSelectionne.trajet2?.bus?.numero}
                    </span>
                    <span className="leg-arrow">→</span>
                    <span className="leg-point">Arrivée</span>
                  </div>
                </div>
              )}
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
                    <div 
                      className="bus-badge-icon" 
                      style={{ backgroundColor: genererCouleurBus(bus.id) }}
                    >
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
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }} 
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mapBounds && <FitBounds bounds={mapBounds} />}
          <RecenterMap center={mapCenter} />

          {/* Position Utilisateur */}
          {userLocation && (
            <Marker 
              position={[userLocation.latitude, userLocation.longitude]} 
              icon={userIcon}
            >
              <Popup>📍 Vous êtes ici</Popup>
            </Marker>
          )}

          {/* 🔥 MARQUEUR DÉPART */}
          {itineraireSelectionne && depart?.latitude && depart?.longitude && (
            <Marker 
              position={[depart.latitude, depart.longitude]} 
              icon={departIcon}
            >
              <Popup>
                <div className="popup-custom">
                  <strong>🟢 Départ</strong>
                  <p>{depart.nom}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 🔥 MARQUEUR ARRIVÉE */}
          {itineraireSelectionne && arrivee?.latitude && arrivee?.longitude && (
            <Marker 
              position={[arrivee.latitude, arrivee.longitude]} 
              icon={arriveeIcon}
            >
              <Popup>
                <div className="popup-custom">
                  <strong>🔴 Arrivée</strong>
                  <p>{arrivee.nom}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 🔥 MARQUEUR CORRESPONDANCE */}
          {itineraireSelectionne?.type === 'correspondance' && 
           itineraireSelectionne.arret_correspondance?.latitude && (
            <Marker 
              position={[
                itineraireSelectionne.arret_correspondance.latitude, 
                itineraireSelectionne.arret_correspondance.longitude
              ]} 
              icon={correspondanceIcon}
            >
              <Popup>
                <div className="popup-custom">
                  <strong>🟠 Correspondance</strong>
                  <p>{itineraireSelectionne.arret_correspondance.nom}</p>
                  <small>Changez de bus ici</small>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 🔥 POLYLINE ITINÉRAIRE DIRECT */}
          {itineraireSelectionne?.type === 'direct' && itinerairePositions.length > 1 && (
            <Polyline 
              positions={itinerairePositions} 
              color="#3498db" 
              weight={6}
              opacity={0.9}
            />
          )}

          {/* 🔥 POLYLINES CORRESPONDANCE */}
          {itineraireSelectionne?.type === 'correspondance' && (
            <>
              {correspondancePositions.trajet1.length > 1 && (
                <Polyline 
                  positions={correspondancePositions.trajet1} 
                  color="#3498db" 
                  weight={6}
                  opacity={0.9}
                />
              )}
              {correspondancePositions.trajet2.length > 1 && (
                <Polyline 
                  positions={correspondancePositions.trajet2} 
                  color="#e74c3c" 
                  weight={6}
                  opacity={0.9}
                />
              )}
            </>
          )}

          {/* 🔥 ARRÊTS INTERMÉDIAIRES DE L'ITINÉRAIRE */}
          {itineraireSelectionne?.type === 'direct' && itineraireSelectionne.arrets?.map((arret, index) => {
            // Skip premier (départ) et dernier (arrivée)
            if (index === 0 || index === itineraireSelectionne.arrets.length - 1) return null;
            if (!arret.latitude || !arret.longitude) return null;

            return (
              <Marker
                key={`itineraire-arret-${index}`}
                position={[arret.latitude, arret.longitude]}
                icon={arretIcon(true)}
              >
                <Popup>
                  <div className="popup-custom">
                    <strong>📍 Arrêt {index}</strong>
                    <p>{arret.nom}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Arrêts généraux (quand pas d'itinéraire) */}
          {!itineraireSelectionne && arrets.map((arret) => {
            if (!arret.latitude || !arret.longitude) return null;
            
            const isOnSelectedRoute = selectedBus && 
              trajets.filter(t => t.busId === selectedBus)
                .some(t => t.arrets.some(a => a.id === arret.id));

            if (!showAllRoutes && !isOnSelectedRoute) return null;

            return (
              <Marker 
                key={arret.id} 
                position={[arret.latitude, arret.longitude]} 
                icon={arretIcon(isOnSelectedRoute)}
              >
                <Popup>
                  <strong>{arret.nomArret || arret.nom}</strong>
                </Popup>
              </Marker>
            );
          })}

          {/* Trajets généraux (quand pas d'itinéraire sélectionné) */}
          {!itineraireSelectionne && trajets.map((trajet) => {
            const shouldShow = showAllRoutes || selectedBus === trajet.busId;
            if (!shouldShow) return null;

            const positions = trajet.arrets
              .filter(a => a.latitude && a.longitude)
              .map(a => [a.latitude, a.longitude]);

            if (positions.length < 2) return null;

            return (
              <Polyline
                key={`trajet-${trajet.busId}-${trajet.trajetId}`}
                positions={positions}
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
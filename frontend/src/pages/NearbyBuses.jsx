// src/pages/NearbyBuses.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useLocation as useLocationContext } from '../contexts/LocationContext';
import busService from '../services/busService';
import localisationService from '../services/localisationService';

import { 
  HiArrowLeft, 
  HiLocationMarker, 
  HiRefresh, 
  HiArrowRight 
} from 'react-icons/hi';
import { FaBus, FaMapMarkedAlt, FaRoute, FaMoneyBillWave } from 'react-icons/fa';

import './NearbyBuses.css';

/* ========= FONCTIONS UTILITAIRES ========= */

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) *
    Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const formatDistance = (dKm) => {
  if (dKm < 1) return `${Math.round(dKm * 1000)} m`;
  return `${dKm.toFixed(1)} km`;
};

const estimateWalkTime = (dKm) => {
  const minutes = Math.round((dKm / 5) * 60);
  if (minutes < 1) return `< 1 min`;
  return `${minutes} min`;
};

/* ========= COMPOSANT PRINCIPAL ========= */

const NearbyBuses = () => {
  const navigate = useNavigate();
  const { userLocation, getCurrentPosition, isLocating } = useLocationContext();

  const [buses, setBuses] = useState([]);
  const [arrets, setArrets] = useState([]);
  const [arretsToBusesMap, setArretsToBusesMap] = useState({});
  const [radiusKm, setRadiusKm] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const busesData = await busService.getAllBus();
      const arretsData = await localisationService.getAllArrets();

      const busesList = Array.isArray(busesData) ? busesData : busesData.results || [];
      const arretsList = Array.isArray(arretsData) ? arretsData : arretsData.results || [];

      setBuses(busesList);
      setArrets(arretsList);

      const index = {};

      for (const bus of busesList) {
        try {
          const arretsLigne = await busService.getArretsByBus(bus.id);
          arretsLigne.forEach((arret) => {
            if (!index[arret.id]) index[arret.id] = new Set();
            index[arret.id].add(bus.id);
          });
        } catch (e) {
          console.warn('⚠️ Nearby: erreur getArretsByBus pour bus', bus.id, e?.message);
        }
      }

      const arretsToBuses = {};
      Object.keys(index).forEach(arretId => {
        arretsToBuses[arretId] = Array.from(index[arretId]);
      });
      setArretsToBusesMap(arretsToBuses);

    } catch (err) {
      console.error('❌ Nearby loadData - Erreur:', err);
      setError('Impossible de charger les données (bus/arrêts).');
    } finally {
      setLoading(false);
    }
  };

  const nearbyStops = useMemo(() => {
    if (!userLocation || arrets.length === 0) return [];
    const { lat, lng } = userLocation;

    return arrets
      .filter(a => a.latitude != null && a.longitude != null)
      .map(a => {
        const dKm = calculateDistanceKm(
          lat,
          lng,
          parseFloat(a.latitude),
          parseFloat(a.longitude)
        );
        const busIds = arretsToBusesMap[a.id] || [];
        const withBus = buses.filter(b => busIds.includes(b.id));
        return {
          ...a,
          distanceKm: dKm,
          busList: withBus,
        };
      })
      .filter(a => a.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 50);
  }, [userLocation, arrets, arretsToBusesMap, buses, radiusKm]);

  const handleRefreshLocation = () => {
    getCurrentPosition().catch((err) => {
      console.error('Géolocalisation refusée/erreur:', err);
    });
  };

  if (loading) {
    return (
      <div className="nearby-page">
        <div className="nearby-header">
          <button onClick={() => navigate(-1)} className="btn-back">
            <HiArrowLeft /> Retour
          </button>
          <h1>📍 Arrêts à proximité</h1>
        </div>
        <div className="nearby-loading">
          <div className="spinner"></div>
          <p>Chargement des arrêts proches...</p>
        </div>
      </div>
    );
  }

  if (!userLocation && !isLocating) {
    return (
      <div className="nearby-page">
        <div className="nearby-header">
          <button onClick={() => navigate(-1)} className="btn-back">
            <HiArrowLeft /> Retour
          </button>
          <h1>📍 Arrêts à proximité</h1>
        </div>

        <div className="location-prompt">
          <div className="location-icon">
            <HiLocationMarker size={60} />
          </div>
          <h2>Localisation requise</h2>
          <p>Autorisez l'accès à votre position pour trouver les arrêts proches de vous.</p>
          <button 
            className="btn-enable-location"
            onClick={handleRefreshLocation}
            disabled={isLocating}
          >
            {isLocating ? 'Localisation en cours...' : 'Activer la localisation'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nearby-page">
      
      {/* HEADER */}
      <div className="nearby-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          <HiArrowLeft /> Retour
        </button>
        <div className="header-content">
          <h1>📍 Arrêts à proximité</h1>
          {userLocation && (
            <p className="header-subtitle">
              <HiLocationMarker /> Basé sur votre position actuelle (±
              {Math.round(userLocation.accuracy || 0)}m)
            </p>
          )}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="nearby-controls">
        <div className="control-group">
          <label>Rayon de recherche</label>
          <div className="radius-buttons">
            {[0.3, 0.5, 1, 2, 5].map((r) => (
              <button 
                key={r}
                className={`radius-btn ${radiusKm === r ? 'active' : ''}`}
                onClick={() => setRadiusKm(r)}
              >
                {r < 1 ? `${r * 1000} m` : `${r} km`}
              </button>
            ))}
          </div>
        </div>

        <button 
          className="btn-refresh"
          onClick={handleRefreshLocation}
          disabled={isLocating}
        >
          <HiRefresh className={isLocating ? 'spinning' : ''} /> Actualiser
        </button>
      </div>

      {error && (
        <div className="nearby-error">
          <p>{error}</p>
        </div>
      )}

      {/* LISTE DES ARRÊTS */}
      <div className="nearby-list">
        {nearbyStops.length === 0 ? (
          <div className="no-stops">
            <p>Aucun arrêt trouvé dans un rayon de {radiusKm} km.</p>
          </div>
        ) : (
          nearbyStops.map((stop) => (
            <div key={stop.id} className="stop-card">
              <div className="stop-main">
                <div className="stop-distance">
                  {formatDistance(stop.distanceKm)}
                </div>
                <div className="stop-info">
                  <h3>{stop.nomArret || stop.nom}</h3>
                  <p className="stop-meta">
                    🥾 ~{estimateWalkTime(stop.distanceKm)} à pied
                  </p>
                </div>
                <Link 
                  to={`/carte?arret=${stop.id}`} 
                  className="btn-map-link"
                >
                  <FaMapMarkedAlt /> Carte
                </Link>
              </div>

              {/* ✅ BUS EN CARTES */}
              <div className="stop-buses-grid">
                {stop.busList && stop.busList.length > 0 ? (
                  stop.busList.map((bus) => (
                    <Link 
                      key={bus.id} 
                      to={`/bus/${bus.id}`}
                      className="bus-card"
                    >
                      <div className="bus-card-header">
                        <div className="bus-icon">
                          <FaBus />
                        </div>
                        <span className="bus-number">{bus.numeroBus}</span>
                      </div>
                      
                      <div className="bus-card-body">
                        <div className="bus-route">
                          <FaRoute className="route-icon" />
                          <span>{bus.lieuDepart || '?'}</span>
                          <HiArrowRight className="arrow-icon" />
                          <span>{bus.lieuArrivee || '?'}</span>
                        </div>
                        
                        {bus.frais && (
                          <div className="bus-price">
                            <FaMoneyBillWave />
                            <span>{bus.frais} Ar</span>
                          </div>
                        )}
                      </div>

                      <div className="bus-card-footer">
                        <span className="view-details">
                          Voir détails <HiArrowRight />
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="no-bus-card">
                    <FaBus className="no-bus-icon" />
                    <span>Aucune ligne connue</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NearbyBuses;
// src/pages/Home.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useLocation as useLocationContext } from '../contexts/LocationContext';

import busService from '../services/busService';
import localisationService from '../services/localisationService';

import { 
  HiLocationMarker, 
  HiSearch, 
  HiTrendingUp, 
  HiArrowRight 
} from 'react-icons/hi';
import { FaBus, FaMapMarkedAlt } from 'react-icons/fa';

import HomeMiniMap from '../components/map/HomeMiniMap';
import './Home.css';

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

/* ========= COMPOSANT PRINCIPAL ========= */

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const { 
    userLocation,
    getCurrentPosition, 
    isLocating 
  } = useLocationContext();

  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [buses, setBuses] = useState([]);
  const [arrets, setArrets] = useState([]);
  const [arretsMap, setArretsMap] = useState({});
  const [arretsToBusesMap, setArretsToBusesMap] = useState({}); // arretId -> [busId]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger bus + arrêts au démarrage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Home: chargement bus + arrêts...');
      const busesData = await busService.getAllBus();
      const arretsData = await localisationService.getAllArrets();

      const busesList = Array.isArray(busesData) ? busesData : busesData.results || [];
      const arretsList = Array.isArray(arretsData) ? arretsData : arretsData.results || [];

      setBuses(busesList);
      setArrets(arretsList);

      const map = {};
      arretsList.forEach(a => { map[a.id] = a; });
      setArretsMap(map);

      setStats({
        totalBuses: busesList.length,
        totalArrets: arretsList.length,
        totalRoutes: busesList.filter(b => b.status === 'Actif').length,
        activeNow: busesList.filter(b => b.status === 'Actif').length
      });

      // ===== ENRICHIR INDEX ARRET -> BUS AVEC TRAJET COMPLET =====
      const index = {}; // arretId -> Set(busId)

      // Pour chaque bus, on récupère la liste de ses arrêts
      for (const bus of busesList) {
        try {
          const arretsLigne = await busService.getArretsByBus(bus.id);
          // arretsLigne: [{id, nom, latitude, longitude, ordre, ...}, ...]
          arretsLigne.forEach((arret) => {
            if (!index[arret.id]) index[arret.id] = new Set();
            index[arret.id].add(bus.id);
          });
        } catch (e) {
          console.warn('⚠️ Erreur chargement arrêts du bus', bus.id, e?.message);
          // On ne bloque pas pour un bus
        }
      }

      const arretsToBuses = {};
      Object.keys(index).forEach(arretId => {
        arretsToBuses[arretId] = Array.from(index[arretId]);
      });
      setArretsToBusesMap(arretsToBuses);

    } catch (err) {
      console.error('❌ Erreur Home loadData:', err);
      setError('Impossible de charger les données. Affichage en mode démo.');

      // Fallback de démo
      const mockBuses = [
        { id: 1, numeroBus: '135', primus: 1, terminus: 8, frais: 400, status: 'Actif' },
        { id: 2, numeroBus: '194', primus: 2, terminus: 7, frais: 400, status: 'Actif' },
        { id: 3, numeroBus: '119', primus: 5, terminus: 6, frais: 400, status: 'Actif' },
      ];
      const mockArrets = [
        { id: 1, nomArret: 'Analakely', latitude: -18.9103, longitude: 47.5255 },
        { id: 2, nomArret: 'Ambohijatovo', latitude: -18.9150, longitude: 47.5280 },
        { id: 5, nomArret: 'Tsaralalana', latitude: -18.9050, longitude: 47.5180 },
        { id: 6, nomArret: '67 Ha', latitude: -18.8850, longitude: 47.5100 },
        { id: 7, nomArret: 'Ankorondrano', latitude: -18.8780, longitude: 47.5150 },
        { id: 8, nomArret: 'Ivandry', latitude: -18.8700, longitude: 47.5200 },
      ];
      setBuses(mockBuses);
      setArrets(mockArrets);
      const mapDemo = {};
      mockArrets.forEach(a => { mapDemo[a.id] = a; });
      setArretsMap(mapDemo);

      // Index démo (très simple)
      const indexDemo = {};
      mockBuses.forEach(bus => {
        // On ne connaît pas les trajets complets en démo, donc on indexe primus/terminus
        if (bus.primus) {
          if (!indexDemo[bus.primus]) indexDemo[bus.primus] = new Set();
          indexDemo[bus.primus].add(bus.id);
        }
        if (bus.terminus) {
          if (!indexDemo[bus.terminus]) indexDemo[bus.terminus] = new Set();
          indexDemo[bus.terminus].add(bus.id);
        }
      });
      const arretsToBusesDemo = {};
      Object.keys(indexDemo).forEach(arretId => {
        arretsToBusesDemo[arretId] = Array.from(indexDemo[arretId]);
      });
      setArretsToBusesMap(arretsToBusesDemo);

      setStats({
        totalBuses: mockBuses.length,
        totalArrets: mockArrets.length,
        totalRoutes: mockBuses.length,
        activeNow: mockBuses.length,
      });
    } finally {
      setLoading(false);
    }
  };

  // Arrêts proches selon la position
  const nearbyStops = useMemo(() => {
    if (!userLocation || arrets.length === 0) return [];
    const { lat, lng } = userLocation;

    const enriched = arrets
      .filter(a => a.latitude != null && a.longitude != null)
      .map(a => {
        const dKm = calculateDistanceKm(
          lat, 
          lng, 
          parseFloat(a.latitude), 
          parseFloat(a.longitude)
        );
        return { ...a, distanceKm: dKm };
      })
      .filter(a => a.distanceKm <= 5)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 10);

    return enriched;
  }, [userLocation, arrets]);

  // Bus associés aux arrêts proches (grâce à l’index enrichi)
  const nearbyBusesFromStops = useMemo(() => {
    if (!userLocation || nearbyStops.length === 0 || buses.length === 0) return [];

    const busIdsSet = new Set();

    nearbyStops.forEach(stop => {
      const busIds = arretsToBusesMap[stop.id];
      if (busIds && busIds.length > 0) {
        busIds.forEach(id => busIdsSet.add(id));
      }
    });

    const nearbyBusesList = buses.filter(bus => busIdsSet.has(bus.id));

    // Actifs d'abord
    nearbyBusesList.sort((a, b) => {
      if (a.status === 'Actif' && b.status !== 'Actif') return -1;
      if (a.status !== 'Actif' && b.status === 'Actif') return 1;
      return 0;
    });

    return nearbyBusesList;
  }, [userLocation, nearbyStops, arretsToBusesMap, buses]);

  const handleActivateLocation = () => {
    getCurrentPosition().catch((err) => {
      console.error('Géolocalisation refusée/erreur:', err);
    });
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="spinner"></div>
        <p>Chargement de l’application...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      
      {/* --- HERO / ACTIONS PRINCIPALES --- */}
      <section className="hero-section">
        <div className="hero-text">
          <h1>
            Bienvenue sur <span className="highlight-text">TaxiBe</span>
          </h1>
          <p className="hero-subtitle">
            Recherchez des itinéraires, trouvez les arrêts proches et visualisez les lignes sur la carte.
          </p>

          {isAuthenticated && (
            <div className="user-badge">
              👋 Bonjour, {user?.username || 'Voyageur'}
            </div>
          )}
        </div>

        {/* BARRE DE RECHERCHE FLOTTANTE */}
        <div className="search-bar-floating">
          <div className="search-input-group">
            <label>DESTINATION</label>
            <input
              type="text"
              placeholder="Où allez-vous ?"
              className="input-clean"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = e.currentTarget.value.trim();
                  if (value) {
                    navigate(`/search?q=${encodeURIComponent(value)}`);
                  }
                }
              }}
            />
          </div>
          <div className="search-divider"></div>

          <div className="search-input-group mobile-hidden">
            <label>TYPE</label>
            <select className="input-clean">
              <option>Bus (TaxiBe)</option>
              <option>Collectif</option>
            </select>
          </div>

          <Link to="/search" className="btn-search-circle">
            <HiSearch size={24} />
          </Link>
        </div>

        {/* BOUTON GÉOLOCALISATION */}
        {!userLocation && (
          <button 
            onClick={handleActivateLocation} 
            className="btn-location-link" 
            disabled={isLocating}
          >
            <HiLocationMarker /> {isLocating ? 'Localisation...' : 'Activer ma position'}
          </button>
        )}

        {userLocation && (
          <p className="location-info">
            <HiLocationMarker /> Position détectée (±
            {Math.round(userLocation.accuracy || 0)}m)
          </p>
        )}
      </section>

      {/* --- BANDEAU ERREUR BACKEND --- */}
      {error && (
        <div className="home-error-banner">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* --- STATS --- */}
      {stats && (
        <section className="stats-grid">
          <div className="stat-card-clean">
            <div className="icon-bubble green"><FaBus /></div>
            <div>
              <h3>{stats.totalBuses}</h3>
              <p>Bus</p>
            </div>
          </div>
          <div className="stat-card-clean">
            <div className="icon-bubble yellow"><HiTrendingUp /></div>
            <div>
              <h3>{stats.activeNow}</h3>
              <p>Actifs</p>
            </div>
          </div>
          <div className="stat-card-clean">
            <div className="icon-bubble blue"><FaMapMarkedAlt /></div>
            <div>
              <h3>{stats.totalArrets}</h3>
              <p>Arrêts</p>
            </div>
          </div>
        </section>
      )}

      {/* --- MINI-CARTE + ARRÊTS PROCHES --- */}
      {userLocation && (
        <section className="content-section">
          <div className="section-header">
            <h2>Carte autour de vous</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/nearby" className="link-arrow">
                Liste <HiArrowRight />
              </Link>
              <Link to="/carte" className="link-arrow">
                Carte complète 
              </Link>
            </div>
          </div>

          {/* Mini-carte centrée sur la position avec les arrêts proches */}
          <HomeMiniMap
            center={{
              lat: userLocation.lat,
              lng: userLocation.lng,
              accuracy: userLocation.accuracy,
            }}
            stops={nearbyStops}
          />

          {/* Liste d'arrêts proches */}
          {nearbyStops.length > 0 && (
            <>
              <h3 style={{ marginTop: '16px', marginBottom: '10px', fontSize: '1rem', color: '#1F2937' }}>
                Arrêts proches
              </h3>
              <div className="cards-grid">
                {nearbyStops.slice(0, 3).map((stop) => (
                  <div key={stop.id} className="shibux-card">
                    <div className="card-body">
                      <div className="route-line" style={{ fontSize: '1rem' }}>
                        <span className="city">{stop.nomArret || stop.nom}</span>
                      </div>
                      <div className="card-footer">
                        <span className="status-dot on">
                          📏 {formatDistance(stop.distanceKm)}
                        </span>
                        <span className="price-tag">
                          📍 Arrêt
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {userLocation && nearbyStops.length === 0 && (
            <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#4B5563' }}>
              Aucun arrêt trouvé dans un rayon de 5 km.
            </p>
          )}
        </section>
      )}

      {/* --- LIGNES POPULAIRES (avec priorisation des bus proches) --- */}
      <section className="content-section">
        <div className="section-header">
          <h2>🚌 Lignes populaires</h2>
          <Link to="/transport" className="link-arrow">
            Explorer <HiArrowRight />
          </Link>
        </div>

        {buses.length > 0 ? (
          <div className="cards-grid">
            {/* 1. Bus “proches de vous” (issus des arrêts proches) */}
            {nearbyBusesFromStops.slice(0, 3).map((bus) => (
              <BusCard 
                key={`nearby-${bus.id}`} 
                bus={bus} 
                arrets={arretsMap} 
                isNearby 
              />
            ))}

            {/* 2. Compléter avec d'autres bus si besoin */}
            {buses
              .filter(
                b => !nearbyBusesFromStops.some(nb => nb.id === b.id)
              )
              .slice(0, Math.max(0, 6 - nearbyBusesFromStops.length))
              .map((bus) => (
                <BusCard 
                  key={bus.id} 
                  bus={bus} 
                  arrets={arretsMap} 
                />
              ))}
          </div>
        ) : (
          <div className="empty-state">Aucun bus disponible pour le moment.</div>
        )}
      </section>

    </div>
  );
};

/* ========= COMPOSANT BusCard ========= */

const BusCard = ({ bus, arrets, isNearby = false }) => {
  const depart = arrets[bus.primus]?.nomArret || arrets[bus.primus]?.nom || `Arrêt ${bus.primus}`;
  const arrivee = arrets[bus.terminus]?.nomArret || arrets[bus.terminus]?.nom || `Arrêt ${bus.terminus}`;

  return (
    <Link to={`/bus/${bus.id}`} className="shibux-card">
      <div className="card-header-img">
        <FaBus className="card-icon-overlay" />
        <span className="bus-number">{bus.numeroBus}</span>

        {/* Petit label “Proche de vous” si bus issu des arrêts proches */}
        {isNearby && (
          <span className="nearby-label">
            Proche de vous
          </span>
        )}
      </div>

      <div className="card-body">
        <div className="route-line">
          <span className="city">{depart}</span>
          <span className="separator">➝</span>
          <span className="city">{arrivee}</span>
        </div>

        <div className="card-footer">
          <span className={`status-dot ${bus.status === 'Actif' ? 'on' : 'off'}`}>
            {bus.status === 'Actif' ? 'En service' : 'Hors service'}
          </span>
          <span className="price-tag">{bus.frais || 600} Ar</span>
        </div>
      </div>
    </Link>
  );
};

export default Home;
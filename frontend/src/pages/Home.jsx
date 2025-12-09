import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { transportService } from '../services/transportService';
import { localisationService } from '../services/localisationService';
import { HiLocationMarker, HiSearch, HiTrendingUp, HiUsers, HiArrowRight } from 'react-icons/hi';
import { FaBus, FaMapMarkedAlt } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const { location, getCurrentLocation, loading: locationLoading } = useLocation();
  
  const [stats, setStats] = useState(null);
  const [buses, setBuses] = useState([]);
  const [arrets, setArrets] = useState({});
  const [nearbyBuses, setNearbyBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (location) loadNearbyBuses(); }, [location]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const busesResponse = await transportService.getAllBuses();
      const busesData = Array.isArray(busesResponse.data) ? busesResponse.data : busesResponse.data.results || [];
      setBuses(busesData.slice(0, 6));

      const arretsResponse = await localisationService.getAllArrets();
      const arretsMap = {};
      const arretsData = Array.isArray(arretsResponse.data) ? arretsResponse.data : arretsResponse.data.results || [];
      arretsData.forEach(arret => { arretsMap[arret.id] = arret; });
      setArrets(arretsMap);

      setStats({
        totalBuses: busesData.length,
        totalArrets: arretsData.length,
        totalRoutes: busesData.filter(b => b.status === 'Actif').length,
        activeNow: busesData.filter(b => b.status === 'Actif').length
      });
    } catch (err) {
      setError('Impossible de se connecter au backend');
    } finally { setLoading(false); }
  };

  const loadNearbyBuses = async () => {
    try {
      const response = await localisationService.getNearbyBuses(location.latitude, location.longitude, 5000);
      setNearbyBuses(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (err) {
      // Fallback local
      const filtered = buses.filter(bus => {
        if (!bus.current_latitude || !bus.current_longitude) return false;
        return calculateDistance(location.latitude, location.longitude, bus.current_latitude, bus.current_longitude) <= 5;
      });
      setNearbyBuses(filtered);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (loading) return <div className="home-loading"><div className="spinner"></div><p>Chargement...</p></div>;

  if (error) {
    return (
      <div className="home-error">
        <h2>❌ Oups !</h2>
        <p>{error}</p>
        <button onClick={loadData} className="btn-retry">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="home">
      
      {/* --- HERO SECTION STYLE SHIBUX --- */}
      <section className="hero-section">
        <div className="hero-text">
          <h1>
            Votre voyage d'exploration <br />
            <span className="highlight-text">Commence Ici !</span>
          </h1>
          <p className="hero-subtitle">Trouvez votre TaxiBe en temps réel partout à Mada.</p>
          
          {isAuthenticated && (
            <div className="user-badge">
              👋 Bonjour, {user?.username || 'Voyageur'}
            </div>
          )}
        </div>

        {/* BARRE DE RECHERCHE FLOTTANTE (Style Image) */}
        <div className="search-bar-floating">
            <div className="search-input-group">
                <label>DESTINATION</label>
                <input type="text" placeholder="Où allez-vous ?" className="input-clean" />
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

        {!location && (
            <button onClick={getCurrentLocation} className="btn-location-link" disabled={locationLoading}>
              <HiLocationMarker /> {locationLoading ? '...' : 'Activer ma position'}
            </button>
        )}
      </section>

      {/* --- STATS (Style Cartes Blanches) --- */}
      {stats && (
        <section className="stats-grid">
          <div className="stat-card-clean">
            <div className="icon-bubble green"><FaBus /></div>
            <div><h3>{stats.totalBuses}</h3><p>Bus</p></div>
          </div>
          <div className="stat-card-clean">
            <div className="icon-bubble yellow"><HiTrendingUp /></div>
            <div><h3>{stats.activeNow}</h3><p>Actifs</p></div>
          </div>
          <div className="stat-card-clean">
            <div className="icon-bubble blue"><FaMapMarkedAlt /></div>
            <div><h3>{stats.totalArrets}</h3><p>Arrêts</p></div>
          </div>
        </section>
      )}

      {/* --- BUS PROCHES --- */}
      {nearbyBuses.length > 0 && (
        <section className="content-section">
          <div className="section-header">
             <h2>📍 À proximité</h2>
             <Link to="/nearby" className="link-arrow">Tout voir <HiArrowRight /></Link>
          </div>
          <div className="cards-grid">
            {nearbyBuses.slice(0, 3).map(bus => <BusCard key={bus.id} bus={bus} arrets={arrets} />)}
          </div>
        </section>
      )}

      {/* --- BUS DISPONIBLES --- */}
      <section className="content-section">
        <div className="section-header">
            <h2>🚌 Lignes Populaires</h2>
            <Link to="/transport" className="link-arrow">Explorer <HiArrowRight /></Link>
        </div>
        
        {buses.length > 0 ? (
          <div className="cards-grid">
            {buses.map(bus => <BusCard key={bus.id} bus={bus} arrets={arrets} />)}
          </div>
        ) : (
          <div className="empty-state">Aucun bus pour le moment.</div>
        )}
      </section>

    </div>
  );
};

// ✅ Composant BusCard (Style Shibux : Blanc, Ombre, Clean)
const BusCard = ({ bus, arrets }) => {
  const depart = arrets[bus.primus]?.nomArret || `Arrêt ${bus.primus}`;
  const arrivee = arrets[bus.terminus]?.nomArret || `Arrêt ${bus.terminus}`;
  
  return (
    <Link to={`/bus/${bus.id}`} className="shibux-card">
      {/* Image placeholder (comme sur l'image de ref) ou couleur */}
      <div className="card-header-img">
         <FaBus className="card-icon-overlay" />
         <span className="bus-number">{bus.numeroBus}</span>
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
            <span className="price-tag">600 Ar</span>
        </div>
      </div>
    </Link>
  );
};

export default Home;
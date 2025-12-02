import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { transportService } from '../../services/transportService';
import { localisationService } from '../../services/localisationService';
import { HiSearch, HiFilter, HiLocationMarker, HiViewGrid, HiViewList, HiArrowRight } from 'react-icons/hi';
import { FaBus } from 'react-icons/fa';
import './transport.css';

const Transport = () => {
  const [buses, setBuses] = useState([]);
  const [arrets, setArrets] = useState({});
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtres et recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => { loadData(); }, []);
  useEffect(() => { applyFilters(); }, [buses, searchQuery, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const busesResponse = await transportService.getAllBuses();
      const busesData = Array.isArray(busesResponse.data) ? busesResponse.data : busesResponse.data.results || [];
      setBuses(busesData);

      const arretsResponse = await localisationService.getAllArrets();
      const arretsData = Array.isArray(arretsResponse.data) ? arretsResponse.data : arretsResponse.data.results || [];
      const arretsMap = {};
      arretsData.forEach(arret => { arretsMap[arret.id] = arret; });
      setArrets(arretsMap);
    } catch (err) {
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...buses];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bus => 
        (bus.numeroBus?.toLowerCase() || '').includes(query) || 
        (arrets[bus.primus]?.nomArret?.toLowerCase() || '').includes(query) || 
        (arrets[bus.terminus]?.nomArret?.toLowerCase() || '').includes(query)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bus => bus.status === statusFilter);
    }
    setFilteredBuses(filtered);
    setCurrentPage(1);
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBuses = filteredBuses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBuses.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div className="transport-loading"><div className="spinner"></div><p>Chargement...</p></div>;
  if (error) return <div className="transport-error"><h2>❌ {error}</h2><button onClick={loadData} className="btn-retry">Réessayer</button></div>;

  return (
    <div className="transport-page">
      
      {/* --- HEADER --- */}
      <div className="transport-header">
        <h1>🚌 Explorez les <span className="highlight">Lignes</span></h1>
        <p>{filteredBuses.length} bus disponible{filteredBuses.length > 1 ? 's' : ''} sur le réseau</p>
      </div>

      {/* --- BARRE DE CONTRÔLE FLOTTANTE --- */}
      <div className="transport-controls-card">
        
        {/* Recherche */}
        <div className="search-group">
          <HiSearch className="icon-gray" />
          <input
            type="text"
            placeholder="Chercher un numéro, un arrêt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="btn-clear">✕</button>}
        </div>

        {/* Filtres Boutons */}
        <div className="filters-group">
          <button className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
            Tous
          </button>
          <button className={`filter-pill ${statusFilter === 'Actif' ? 'active' : ''}`} onClick={() => setStatusFilter('Actif')}>
            Actifs
          </button>
          <button className={`filter-pill ${statusFilter === 'Inactif' ? 'active' : ''}`} onClick={() => setStatusFilter('Inactif')}>
            Inactifs
          </button>
        </div>

        {/* Toggle Vue */}
        <div className="view-group">
          <button className={`view-icon ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
            <HiViewGrid size={20} />
          </button>
          <button className={`view-icon ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
            <HiViewList size={20} />
          </button>
        </div>
      </div>

      {/* --- LISTE DES RÉSULTATS --- */}
      {currentBuses.length === 0 ? (
        <div className="no-results">
          <div className="emoji">🔍</div>
          <h3>Aucun bus trouvé</h3>
          <p>Essayez une autre recherche ou changez les filtres.</p>
          <button onClick={() => {setSearchQuery(''); setStatusFilter('all');}} className="btn-reset-all">Réinitialiser tout</button>
        </div>
      ) : (
        <>
          <div className={`buses-container ${viewMode}`}>
            {currentBuses.map(bus => (
              <BusItem key={bus.id} bus={bus} arrets={arrets} viewMode={viewMode} />
            ))}
          </div>

          {/* Pagination Moderne */}
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="page-arrow">←</button>
              <span className="page-info">Page {currentPage} / {totalPages}</span>
              <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="page-arrow">→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// --- COMPOSANT ITEM (DESIGN SHIBUX) ---
const BusItem = ({ bus, arrets, viewMode }) => {
  const depart = arrets[bus.primus]?.nomArret || `Arrêt ${bus.primus}`;
  const arrivee = arrets[bus.terminus]?.nomArret || `Arrêt ${bus.terminus}`;

  // --- VUE LISTE (Horizontale) ---
  if (viewMode === 'list') {
    return (
      <Link to={`/bus/${bus.id}`} className="bus-card-list">
        <div className="list-left">
          <div className="bus-badge-list">{bus.numeroBus}</div>
        </div>
        <div className="list-center">
          <div className="route-text">
            <span className="stop">{depart}</span>
            <HiArrowRight className="arrow-icon" />
            <span className="stop">{arrivee}</span>
          </div>
          <div className="status-text">
            <span className={`status-dot ${bus.status === 'Actif' ? 'on' : 'off'}`}></span>
            {bus.status === 'Actif' ? 'En service' : 'Hors service'}
          </div>
        </div>
        <div className="list-right">
          <span className="btn-details">Détails</span>
        </div>
      </Link>
    );
  }

  // --- VUE GRILLE (Verticale - Style Home) ---
  return (
    <Link to={`/bus/${bus.id}`} className="shibux-card">
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
            <span className="price-tag">{bus.frais || 600} Ar</span>
        </div>
      </div>
    </Link>
  );
};

export default Transport;
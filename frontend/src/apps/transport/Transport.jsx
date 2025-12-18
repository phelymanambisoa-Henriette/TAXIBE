// src/apps/transport/Transport.jsx - VERSION AVEC TRAJETS
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import trajetService from '../../services/trajetService'; // ← NOUVEAU SERVICE
import { HiSearch, HiFilter, HiLocationMarker, HiViewGrid, HiViewList, HiArrowRight } from 'react-icons/hi';
import { FaBus } from 'react-icons/fa';
import './transport.css';

const Transport = () => {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all'); // ← NOUVEAU
  const [viewMode, setViewMode] = useState('grid');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => { loadData(); }, []);
  useEffect(() => { applyFilters(); }, [buses, searchQuery, statusFilter, directionFilter]); // ← Ajouté directionFilter

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Chargement des bus avec trajets...');
      
      // ✅ UTILISER LE SERVICE TRAJETS
      const busesData = await trajetService.getAllBusTrajets();
      console.log('✅ Bus avec trajets chargés:', busesData);
      
      setBuses(busesData);
      
    } catch (err) {
      console.error('❌ Erreur chargement Transport:', err);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...buses];
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bus => 
        (bus.numero?.toLowerCase() || '').includes(query) || 
        (bus.primus?.toLowerCase() || '').includes(query) || 
        (bus.terminus?.toLowerCase() || '').includes(query)
      );
    }
    
    // Filtre par statut (si tu veux le garder)
    if (statusFilter !== 'all') {
      // Note: l'API trajets ne renvoie que les bus actifs par défaut
      // Adapte selon tes besoins
    }
    
    // ✅ NOUVEAU : Filtre par direction
    if (directionFilter !== 'all') {
      filtered = filtered.filter(bus => 
        bus.trajets?.some(t => t.type.toLowerCase() === directionFilter)
      );
    }
    
    setFilteredBuses(filtered);
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBuses = filteredBuses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBuses.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return (
    <div className="transport-loading">
      <div className="spinner"></div>
      <p>Chargement des lignes...</p>
    </div>
  );
  
  if (error) return (
    <div className="transport-error">
      <h2>❌ {error}</h2>
      <button onClick={loadData} className="btn-retry">Réessayer</button>
    </div>
  );

  return (
    <div className="transport-page">
      
      <div className="transport-header">
        <h1>🚌 Explorez les <span className="highlight">Lignes</span></h1>
        <p>{filteredBuses.length} bus disponible{filteredBuses.length > 1 ? 's' : ''} - Fianarantsoa</p>
      </div>

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
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="btn-clear">✕</button>
          )}
        </div>

        {/* ✅ NOUVEAUX FILTRES DIRECTION */}
        <div className="filters-group">
          <button 
            className={`filter-pill ${directionFilter === 'all' ? 'active' : ''}`} 
            onClick={() => setDirectionFilter('all')}
          >
            Tous
          </button>
          <button 
            className={`filter-pill aller ${directionFilter === 'aller' ? 'active' : ''}`} 
            onClick={() => setDirectionFilter('aller')}
          >
            ↗ Aller
          </button>
          <button 
            className={`filter-pill retour ${directionFilter === 'retour' ? 'active' : ''}`} 
            onClick={() => setDirectionFilter('retour')}
          >
            ↙ Retour
          </button>
        </div>

        {/* Vue Grid/List */}
        <div className="view-group">
          <button 
            className={`view-icon ${viewMode === 'grid' ? 'active' : ''}`} 
            onClick={() => setViewMode('grid')}
          >
            <HiViewGrid size={20} />
          </button>
          <button 
            className={`view-icon ${viewMode === 'list' ? 'active' : ''}`} 
            onClick={() => setViewMode('list')}
          >
            <HiViewList size={20} />
          </button>
        </div>
      </div>

      {/* Résultats */}
      {currentBuses.length === 0 ? (
        <div className="no-results">
          <div className="emoji">🔍</div>
          <h3>Aucun bus trouvé</h3>
          <p>Essayez une autre recherche ou changez les filtres.</p>
          <button 
            onClick={() => {
              setSearchQuery(''); 
              setStatusFilter('all');
              setDirectionFilter('all');
            }} 
            className="btn-reset-all"
          >
            Réinitialiser tout
          </button>
        </div>
      ) : (
        <>
          <div className={`buses-container ${viewMode}`}>
            {currentBuses.map(bus => (
              <BusItem key={bus.id} bus={bus} viewMode={viewMode} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1} 
                className="page-arrow"
              >
                ←
              </button>
              <span className="page-info">Page {currentPage} / {totalPages}</span>
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages} 
                className="page-arrow"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ========================================
// ✅ COMPOSANT BusItem MODIFIÉ
// ========================================
const BusItem = ({ bus, viewMode }) => {
  const trajetAller = bus.trajets?.find(t => t.type === 'Aller');
  const trajetRetour = bus.trajets?.find(t => t.type === 'Retour');
  const hasTrajets = bus.trajets && bus.trajets.length > 0;

  // ===== MODE LISTE =====
  if (viewMode === 'list') {
    return (
      <Link to={`/bus/${bus.id}`} className="bus-card-list">
        <div className="list-left">
          <div 
            className="bus-badge-list"
            style={{ backgroundColor: bus.couleur || '#01c6b2' }}
          >
            {bus.numero}
          </div>
        </div>

        <div className="list-center">
          <div className="route-text">
            <span className="stop">{bus.primus || 'Départ'}</span>
            <HiArrowRight className="arrow-icon" />
            <span className="stop">{bus.terminus || 'Arrivée'}</span>
          </div>

          {/* ✅ AFFICHER LES TRAJETS */}
          {hasTrajets && (
            <div className="trajets-inline">
              {trajetAller && (
                <span className="trajet-badge aller">
                  ↗ Aller ({trajetAller.nb_arrets} arrêts)
                </span>
              )}
              {trajetRetour && (
                <span className="trajet-badge retour">
                  ↙ Retour ({trajetRetour.nb_arrets} arrêts)
                </span>
              )}
            </div>
          )}
        </div>

        <div className="list-right">
          <span className="price-tag">{bus.frais} Ar</span>
          <span className="btn-details">Détails →</span>
        </div>
      </Link>
    );
  }

  // ===== MODE GRILLE =====
  return (
    <Link to={`/bus/${bus.id}`} className="shibux-card">
      <div 
        className="card-header-img"
        style={{ background: bus.couleur || 'linear-gradient(135deg, #01c6b2 0%, #019d8f 100%)' }}
      >
        <FaBus className="card-icon-overlay" />
        <span className="bus-number">{bus.numero}</span>
      </div>
      
      <div className="card-body">
        <div className="route-line">
          <span className="city">{bus.primus || 'Départ'}</span>
          <span className="separator">➝</span>
          <span className="city">{bus.terminus || 'Arrivée'}</span>
        </div>

        {/* ✅ SECTION TRAJETS */}
        {hasTrajets ? (
          <div className="trajets-section">
            <div className="trajets-title">Trajets :</div>
            <div className="trajets-grid">
              {trajetAller ? (
                <div className="trajet-box aller">
                  <div className="trajet-icon">↗</div>
                  <div className="trajet-info">
                    <div className="trajet-label">Aller</div>
                    <div className="trajet-count">{trajetAller.nb_arrets} arrêts</div>
                  </div>
                </div>
              ) : (
                <div className="trajet-box missing">
                  <span className="trajet-missing-text">Aller N/A</span>
                </div>
              )}

              {trajetRetour ? (
                <div className="trajet-box retour">
                  <div className="trajet-icon">↙</div>
                  <div className="trajet-info">
                    <div className="trajet-label">Retour</div>
                    <div className="trajet-count">{trajetRetour.nb_arrets} arrêts</div>
                  </div>
                </div>
              ) : (
                <div className="trajet-box missing">
                  <span className="trajet-missing-text">Retour N/A</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-trajets-warning">
            ⚠️ Pas de trajet configuré
          </div>
        )}
        
        <div className="card-footer">
          <span className="price-tag">{bus.frais} Ar</span>
          <span className="status-dot on">En service</span>
        </div>
      </div>
    </Link>
  );
};

export default Transport;
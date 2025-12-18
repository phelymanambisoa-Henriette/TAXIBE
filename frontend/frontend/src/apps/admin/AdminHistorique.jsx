// src/apps/admin/AdminHistorique.jsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaSearch, 
  FaClock, 
  FaUser, 
  FaBus,
  FaRedo,
  FaDownload,
  FaChartLine,
  FaFilter,
  FaEye,
  FaTrash
} from 'react-icons/fa';
import historiqueService from '../../services/historiqueService';
import './AdminHistorique.css';

// Données factices pour fallback (si API échoue)
const MOCK_HISTORY = [
  {
    id: 1,
    user: 'Phely',
    query: 'Bus 119 Andohatapenaka',
    bus: '119',
    depart: 'Analakely',
    arrivee: 'Andohatapenaka',
    resultats: 3,
    created_at: '2025-02-23T09:20:00',
  },
  {
    id: 2,
    user: 'Invité',
    query: 'Arrêt Analakely',
    bus: null,
    depart: 'Analakely',
    arrivee: null,
    resultats: 5,
    created_at: '2025-02-23T09:10:00',
  },
  {
    id: 3,
    user: 'Admin',
    query: 'Bus 194 Anosizato',
    bus: '194',
    depart: 'Tanjombato',
    arrivee: 'Anosizato',
    resultats: 2,
    created_at: '2025-02-22T17:34:00',
  },
];

const AdminHistorique = () => {
  const { user } = useAuth();

  // Vérification des permissions
  const deny =
    !!user &&
    user.is_staff === false &&
    user.is_superuser !== true &&
    user.is_staf !== true &&
    user.isSuperuser !== true;

  // États
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showBusOnly, setShowBusOnly] = useState(false);
  const [periode, setPeriode] = useState('semaine');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const itemsPerPage = 10;

  // Statistiques calculées
  const stats = useMemo(() => {
    const total = historique.length;
    const avecBus = historique.filter(h => h.bus).length;
    const aujourd_hui = historique.filter(h => {
      const date = new Date(h.created_at);
      const now = new Date();
      return date.toDateString() === now.toDateString();
    }).length;
    
    return { total, avecBus, aujourd_hui };
  }, [historique]);

  // Charger les données depuis l'API
  const loadHistorique = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await historiqueService.getSearchHistory({ periode });
      setHistorique(data);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
      setError('Impossible de charger l\'historique. Données de démo affichées.');
      // Fallback aux données mockées
      setHistorique(MOCK_HISTORY);
    } finally {
      setLoading(false);
    }
  }, [periode]);

  useEffect(() => {
    loadHistorique();
  }, [loadHistorique]);

  // Filtrage des données
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return historique.filter((item) => {
      if (showBusOnly && !item.bus) return false;
      if (!q) return true;
      return (
        (item.query || '').toLowerCase().includes(q) ||
        (item.user || '').toLowerCase().includes(q) ||
        (item.bus || '').toLowerCase().includes(q) ||
        (item.depart || '').toLowerCase().includes(q) ||
        (item.arrivee || '').toLowerCase().includes(q)
      );
    });
  }, [historique, search, showBusOnly]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Supprimer un élément
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet historique ?')) return;
    
    try {
      await historiqueService.deleteHistory(id);
      setHistorique(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Erreur suppression:', err);
      // Suppression locale en cas d'erreur API
      setHistorique(prev => prev.filter(item => item.id !== id));
    }
  };

  // Exporter les données
  const handleExport = async () => {
    try {
      const blob = await historiqueService.exportHistory('csv', { periode });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historique_${periode}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback: export JSON local
      const dataStr = JSON.stringify(filtered, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'historique.json';
      a.click();
    }
  };

  // Voir les détails
  const handleViewDetail = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  // Formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Page d'accès refusé
  if (deny) {
    return (
      <div className="admin-denied">
        <h2>⛔ Accès Refusé</h2>
        <p>Cette section est réservée aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="admin-history-page">
      
      {/* HEADER */}
      <div className="page-header">
        <div className="header-left">
          <h1><FaClock /> Historique des recherches</h1>
          <p>Visualisez les requêtes les plus récentes effectuées sur TaxiBe.</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadHistorique} disabled={loading}>
            <FaRedo className={loading ? 'spin' : ''} /> Actualiser
          </button>
          <button className="btn-export" onClick={handleExport}>
            <FaDownload /> Exporter
          </button>
        </div>
      </div>

      {/* MESSAGE D'ERREUR */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={loadHistorique}>Réessayer</button>
        </div>
      )}

      {/* STATISTIQUES RAPIDES */}
      <div className="stats-row">
        <div className="stat-box">
          <FaChartLine className="stat-icon" />
          <div>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total recherches</span>
          </div>
        </div>
        <div className="stat-box">
          <FaBus className="stat-icon" />
          <div>
            <span className="stat-value">{stats.avecBus}</span>
            <span className="stat-label">Avec bus trouvé</span>
          </div>
        </div>
        <div className="stat-box">
          <FaClock className="stat-icon" />
          <div>
            <span className="stat-value">{stats.aujourd_hui}</span>
            <span className="stat-label">Aujourd'hui</span>
          </div>
        </div>
      </div>

      {/* BARRE D'OUTILS */}
      <div className="history-toolbar">
        <div className="search-field">
          <FaSearch className="icon-muted" />
          <input
            placeholder="Rechercher par mot-clé, utilisateur, numéro de bus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <FaFilter className="icon-muted" />
          <select value={periode} onChange={(e) => setPeriode(e.target.value)}>
            <option value="jour">Aujourd'hui</option>
            <option value="semaine">Cette semaine</option>
            <option value="mois">Ce mois</option>
            <option value="tout">Tout</option>
          </select>
        </div>

        <label className="toggle-filter">
          <input
            type="checkbox"
            checked={showBusOnly}
            onChange={(e) => setShowBusOnly(e.target.checked)}
          />
          <span className="checkmark"></span>
          Uniquement les recherches liées à un bus
        </label>
      </div>

      {/* TABLEAU HISTORIQUE */}
      <div className="history-table-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement de l'historique...</p>
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th><FaClock /> Date</th>
                <th><FaUser /> Utilisateur</th>
                <th><FaSearch /> Recherche</th>
                <th><FaBus /> Bus concerné</th>
                <th>Résultats</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">
                    <FaSearch className="empty-icon" />
                    <p>Aucune recherche ne correspond à vos filtres.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.created_at)}</td>
                    <td>
                      <span className="user-badge">
                        <FaUser /> {item.user || 'Invité'}
                      </span>
                    </td>
                    <td className="query-cell">{item.query}</td>
                    <td>
                      {item.bus ? (
                        <span className="bus-chip">Bus {item.bus}</span>
                      ) : (
                        <span className="bus-chip neutral">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`result-badge ${item.resultats > 0 ? 'success' : 'empty'}`}>
                        {item.resultats || 0} trouvé(s)
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button 
                          className="btn-icon view" 
                          onClick={() => handleViewDetail(item)}
                          title="Voir détails"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="btn-icon delete" 
                          onClick={() => handleDelete(item.id)}
                          title="Supprimer"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* FOOTER AVEC PAGINATION */}
        <div className="table-footer">
          <span>{filtered.length} recherche(s) au total</span>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                ««
              </button>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                «
              </button>
              <span>Page {currentPage} / {totalPages}</span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                »
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                »»
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DÉTAILS */}
      {showModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FaEye /> Détails de la recherche</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <label>Date & Heure</label>
                <span>{formatDate(selectedItem.created_at)}</span>
              </div>
              <div className="detail-row">
                <label>Utilisateur</label>
                <span>{selectedItem.user || 'Invité'}</span>
              </div>
              <div className="detail-row">
                <label>Recherche</label>
                <span>{selectedItem.query}</span>
              </div>
              <div className="detail-row">
                <label>Départ</label>
                <span>{selectedItem.depart || '-'}</span>
              </div>
              <div className="detail-row">
                <label>Arrivée</label>
                <span>{selectedItem.arrivee || '-'}</span>
              </div>
              <div className="detail-row">
                <label>Bus concerné</label>
                <span>{selectedItem.bus ? `Bus ${selectedItem.bus}` : 'Aucun'}</span>
              </div>
              <div className="detail-row">
                <label>Résultats trouvés</label>
                <span>{selectedItem.resultats || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHistorique;
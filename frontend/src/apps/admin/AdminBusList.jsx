// src/apps/admin/AdminBusList.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transportService } from '../../services/transportService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaBus, FaSearch, FaPlus, FaEdit, FaTrash, FaSync, 
  FaMapMarkerAlt, FaMoneyBillWave, FaRoute, FaEye,
  FaCheckCircle, FaTimesCircle, FaFilter
} from 'react-icons/fa';
import './AdminBusList.css';

const AdminBusList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const hasAccess = user && (
    user.is_staff === true || 
    user.is_superuser === true ||
    user.role === 'admin'
  );

  const [buses, setBuses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, type: 'success', text: '' });

  const showToast = (text, type = 'success', duration = 2500) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type, text: '' }), duration);
  };

  const loadBuses = async () => {
    setLoading(true);
    try {
      const res = await transportService.getAllBuses();
      const data = res.data?.results || res.data || [];
      setBuses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Erreur chargement bus:', e);
      showToast("Impossible de charger les bus", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (hasAccess) loadBuses(); 
  }, [hasAccess]);

  // Filtrage
  const filteredBuses = useMemo(() => {
    return buses.filter(bus => {
      const num = String(bus.numeroBus || bus.numero || '').toLowerCase();
      const status = String(bus.status || '').toLowerCase();
      const primus = String(bus.primus_nom || '').toLowerCase();
      const terminus = String(bus.terminus_nom || '').toLowerCase();
      
      const matchSearch = !searchQuery || 
        num.includes(searchQuery.toLowerCase()) ||
        primus.includes(searchQuery.toLowerCase()) ||
        terminus.includes(searchQuery.toLowerCase());
      
      const matchStatus = !statusFilter || status === statusFilter.toLowerCase();
      
      return matchSearch && matchStatus;
    });
  }, [buses, searchQuery, statusFilter]);

  // Statistiques
  const stats = useMemo(() => ({
    total: buses.length,
    actifs: buses.filter(b => (b.status || '').toLowerCase() === 'actif').length,
    inactifs: buses.filter(b => (b.status || '').toLowerCase() === 'inactif').length,
    maintenance: buses.filter(b => (b.status || '').toLowerCase() === 'maintenance').length,
  }), [buses]);

  const handleDelete = async (id, numero) => {
    if (!window.confirm(`Supprimer le bus "${numero}" ? Cette action est irréversible.`)) return;
    
    try {
      await transportService.deleteBus(id);
      showToast(`Bus ${numero} supprimé avec succès`);
      loadBuses();
    } catch (e) {
      console.error('Erreur suppression:', e);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'actif') return <span className="status-badge active"><FaCheckCircle /> Actif</span>;
    if (s === 'inactif') return <span className="status-badge inactive"><FaTimesCircle /> Inactif</span>;
    if (s === 'maintenance') return <span className="status-badge maintenance">🔧 Maintenance</span>;
    return <span className="status-badge">{status || '-'}</span>;
  };

  if (!hasAccess) {
    return (
      <div className="admin-denied">
        <h2>🔐 Accès refusé</h2>
        <p>Cette page est réservée aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="admin-bus-list">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1><FaBus /> Gestion des Bus</h1>
          <p>Gérez la flotte de bus TaxiBe</p>
        </div>
        <button
          className="btn-primary btn-new-bus"
          onClick={() => navigate('/admin/bus/new')}
        >
          <FaPlus /> Nouveau Bus
        </button>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
          {toast.text}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total"><FaBus /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active"><FaCheckCircle /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.actifs}</span>
            <span className="stat-label">Actifs</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon inactive"><FaTimesCircle /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.inactifs}</span>
            <span className="stat-label">Inactifs</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon maintenance"><FaTimesCircle /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.maintenance}</span>
            <span className="stat-label">Maintenance</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-field">
          <FaSearch />
          <input
            type="text"
            placeholder="Rechercher (numéro, trajet...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-field">
          <FaFilter />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <button className="btn-refresh" onClick={loadBuses}>
          <FaSync /> Actualiser
        </button>
      </div>

      {/* Liste des bus */}
      <div className="bus-table-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement des bus...</p>
          </div>
        ) : filteredBuses.length === 0 ? (
          <div className="empty-state">
            <FaBus />
            <p>Aucun bus trouvé</p>
            {searchQuery && <span>Essayez une autre recherche</span>}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="bus-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th><FaBus /> Numéro</th>
                  <th><FaRoute /> Trajet</th>
                  <th><FaMoneyBillWave /> Tarif</th>
                  <th>Statut</th>
                  <th><FaMapMarkerAlt /> Arrêts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuses.map((bus, index) => (
                  <tr key={bus.id} className={bus.status?.toLowerCase() === 'inactif' ? 'inactive-row' : ''}>
                    <td className="index-cell">{index + 1}</td>
                    <td className="numero-cell">
                      <span className="bus-numero">{bus.numeroBus || bus.numero || '-'}</span>
                    </td>
                    <td className="trajet-cell">
                      <div className="trajet-info">
                        <span className="trajet-depart">{bus.primus_nom || 'Départ'}</span>
                        <span className="trajet-arrow">→</span>
                        <span className="trajet-arrivee">{bus.terminus_nom || 'Arrivée'}</span>
                      </div>
                    </td>
                    <td className="tarif-cell">
                      {bus.frais != null ? (
                        <span className="tarif">{bus.frais.toLocaleString()} Ar</span>
                      ) : '-'}
                    </td>
                    <td className="status-cell">
                      {getStatusBadge(bus.status)}
                    </td>
                    <td className="arrets-cell">
                      <span className="arrets-count">
                        {bus.arrets_count || bus.arrets?.length || '0'} arrêts
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="actions-container">
                        <button
                          className="btn-icon view"
                          onClick={() => navigate(`/bus/${bus.id}`)}
                          title="Voir détails"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="btn-icon edit"
                          onClick={() => navigate(`/admin/bus/edit/${bus.id}`)}
                          title="Modifier"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(bus.id, bus.numeroBus || bus.numero)}
                          title="Supprimer"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer avec compteur */}
        {!loading && filteredBuses.length > 0 && (
          <div className="table-footer">
            <span>{filteredBuses.length} bus affichés sur {buses.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBusList;
// src/apps/admin/AdminHistorique.jsx
import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaSearch, 
  FaClock, 
  FaUser, 
  FaBus 
} from 'react-icons/fa';
import './AdminHistorique.css';

// Données factices pour la démo UI (à remplacer plus tard par un appel API)
const MOCK_HISTORY = [
  {
    id: 1,
    user: 'Phely',
    query: 'Bus 119 Andohatapenaka',
    bus: '119',
    created_at: '2025-02-23T09:20:00',
  },
  {
    id: 2,
    user: 'Invité',
    query: 'Arrêt Analakely',
    bus: null,
    created_at: '2025-02-23T09:10:00',
  },
  {
    id: 3,
    user: 'Admin',
    query: 'Bus 194 Anosizato',
    bus: '194',
    created_at: '2025-02-22T17:34:00',
  },
];

const AdminHistorique = () => {
  const { user } = useAuth();

  const deny =
    !!user &&
    user.is_staff === false &&
    user.is_superuser !== true &&
    user.is_staf !== true &&
    user.isSuperuser !== true;

  const [search, setSearch] = useState('');
  const [showBusOnly, setShowBusOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_HISTORY.filter((item) => {
      if (showBusOnly && !item.bus) return false;
      if (!q) return true;
      return (
        item.query.toLowerCase().includes(q) ||
        (item.user || '').toLowerCase().includes(q) ||
        (item.bus || '').toLowerCase().includes(q)
      );
    });
  }, [search, showBusOnly]);

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
        <h1>Historique des recherches</h1>
        <p>Visualisez les requêtes les plus récentes effectuées sur TaxiBe.</p>
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
        <table className="history-table">
          <thead>
            <tr>
              <th><FaClock /> Date</th>
              <th><FaUser /> Utilisateur</th>
              <th><FaSearch /> Recherche</th>
              <th><FaBus /> Bus concerné</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-row">
                  Aucune recherche ne correspond à vos filtres.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    {new Date(item.created_at).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td>{item.user || 'Invité'}</td>
                  <td className="query-cell">{item.query}</td>
                  <td>
                    {item.bus ? (
                      <span className="bus-chip">Bus {item.bus}</span>
                    ) : (
                      <span className="bus-chip neutral">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="table-footer">
          <span>{filtered.length} recherche(s) affichée(s)</span>
          <span className="hint">Intégration API à faire ici (backend historique).</span>
        </div>
      </div>
    </div>
  );
};

export default AdminHistorique;
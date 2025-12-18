// src/apps/admin/AdminReports.jsx
import React, { useEffect, useState } from 'react';
import { interactionService } from '../../services/interactionService';
import { useAuth } from '../../contexts/AuthContext';
import { FaCheckCircle, FaTimesCircle, FaSearch, FaSync, FaUser, FaClock } from 'react-icons/fa';
import './AdminReports.css';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Ouverts' },
  { value: 'dismissed', label: 'Ignorés' },
  { value: 'removed', label: 'Commentaire supprimé' },
];

const normalize = (s) => (s || '').toLowerCase();
const getStatusClass = (s) => {
  const v = normalize(s);
  if (v === 'dismissed') return 'dismissed';
  if (v === 'removed') return 'removed';
  return 'open';
};
const getStatusLabel = (s) => {
  const v = normalize(s);
  if (v === 'dismissed') return 'Ignoré';
  if (v === 'removed') return 'Commentaire supprimé';
  return 'Ouvert';
};

const AdminReports = () => {
  const { user } = useAuth();
  const deny =
    !!user &&
    user.is_staff === false &&
    user.is_superuser !== true &&
    user.is_staf !== true &&
    user.isSuperuser !== true;

  const [list, setList] = useState([]);
  const [status, setStatus] = useState('open'); // open|dismissed|removed
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, type: 'success', text: '' });

  const showToast = (text, type = 'success', duration = 1800) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type, text: '' }), duration);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await interactionService.adminListReports({ status, q });
      setList(Array.isArray(data) ? data : []);
    } catch {
      showToast('Impossible de charger les signalements', 'error', 2200);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onSubmitSearch = (e) => {
    e.preventDefault();
    load();
  };

  const dismiss = async (id) => {
    try {
      await interactionService.dismissReport(id);
      showToast('Signalement ignoré');
      load();
    } catch {
      showToast('Erreur lors de l’action', 'error');
    }
  };

  const removeComment = async (id) => {
    if (!window.confirm('Supprimer le commentaire lié à ce signalement ?')) return;
    try {
      await interactionService.removeReportComment(id);
      showToast('Commentaire supprimé');
      load();
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  if (deny) {
    return (
      <div className="admin-denied">
        <h2>⛔ Accès Refusé</h2>
        <p>Cette section est réservée aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="admin-reports-page">
      {/* Header */}
      <div className="page-header">
        <h1>Signalements de commentaires</h1>
        <p>Gérez les signalements effectués par les utilisateurs.</p>
      </div>

      {/* Toast */}
      {toast.show && <div className={`ar-toast ${toast.type}`}>{toast.text}</div>}

      {/* Toolbar */}
      <div className="reports-toolbar">
        <div className="select-field">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <form className="search-field" onSubmit={onSubmitSearch}>
          <FaSearch className="icon-muted" />
          <input
            placeholder="Recherche (raison, auteur, contenu)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>

        <button onClick={load} className="btn-refresh">
          <FaSync /> Actualiser
        </button>
      </div>

      {/* List */}
      <div className="reports-list-card">
        {loading ? (
          <div className="state-msg">Chargement…</div>
        ) : list.length === 0 ? (
          <div className="state-msg">Aucun signalement.</div>
        ) : (
          <div className="reports-grid">
            {list.map((r) => {
              const created = r.date_creation || r.created_at || r.date || null;
              const reporter = r.reporter || r.username || 'Utilisateur';

              return (
                <div key={r.id} className="report-card">
                  <div className="report-card-header">
                    <div className="reporter">
                      <div className="avatar">{(reporter[0] || 'U').toUpperCase()}</div>
                      <div className="who">
                        <div className="name"><FaUser /> {reporter}</div>
                        <div className="date"><FaClock /> {created ? new Date(created).toLocaleString('fr-FR') : '—'}</div>
                      </div>
                    </div>

                    <span className={`status-badge ${getStatusClass(r.status)}`}>
                      {getStatusLabel(r.status)}
                    </span>
                  </div>

                  <div className="report-content">
                    <div className="row"><b>Commentaire:</b> <span>{r.commentaire_contenu || r.comment_content || '—'}</span></div>
                    <div className="row"><b>Raison:</b> <span>{r.reason || '—'}</span></div>
                  </div>

                  {normalize(r.status) === 'open' && (
                    <div className="report-actions">
                      <button className="btn-ignore" onClick={() => dismiss(r.id)}>
                        <FaCheckCircle /> Ignorer
                      </button>
                      <button className="btn-remove" onClick={() => removeComment(r.id)}>
                        <FaTimesCircle /> Supprimer le commentaire
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
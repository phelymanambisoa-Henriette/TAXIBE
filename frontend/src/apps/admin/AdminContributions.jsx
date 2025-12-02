// src/apps/admin/AdminContributions.jsx
import React, { useEffect, useState } from 'react';
import { interactionService } from '../../services/interactionService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaSync, 
  FaFilter,
  FaBus,
  FaClock
} from 'react-icons/fa';
import './AdminContributions.css';

const AdminContributions = () => {
  const { user } = useAuth();

  // Refus UNIQUEMENT si on sait explicitement que ce n'est pas un admin
  const deny =
    !!user &&
    user.is_staff === false &&
    user.is_superuser !== true &&
    user.is_staf !== true &&
    user.isSuperuser !== true;

  // Onglet actif: pending | approved | rejected
  const [tab, setTab] = useState('pending');

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Compteurs par statut
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  // Toast
  const [toast, setToast] = useState({ show: false, type: 'success', text: '' });
  const showToast = (text, type = 'success', duration = 2000) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type, text: '' }), duration);
  };

  // Helpers statut
  const normalizeStatus = (s) => (s || '').toLowerCase();
  const getStatusLabel = (s) => {
    const v = normalizeStatus(s);
    if (v === 'pending' || v === 'en_attente') return 'En attente';
    if (v === 'approved' || v === 'validee') return 'Validée';
    if (v === 'rejected' || v === 'rejetee') return 'Rejetée';
    return s || 'Inconnu';
  };
  const getStatusClass = (s) => {
    const v = normalizeStatus(s);
    if (v === 'approved' || v === 'validee') return 'approved';
    if (v === 'rejected' || v === 'rejetee') return 'rejected';
    return 'pending';
  };

  // Pour les requêtes, on mappe nos onglets vers les labels attendus par le backend
  const statusParamForTab = (t) => {
    if (t === 'pending') return 'En attente';
    if (t === 'approved') return 'Approuvées';
    if (t === 'rejected') return 'Rejetées';
    return 'En attente';
  };

  const loadCounts = async () => {
    try {
      const [pend, appr, rej] = await Promise.all([
        interactionService.adminListContributions({ status: 'En attente' }),
        interactionService.adminListContributions({ status: 'Approuvées' }),
        interactionService.adminListContributions({ status: 'Rejetées' }),
      ]);
      setCounts({
        pending: (pend || []).length,
        approved: (appr || []).length,
        rejected: (rej || []).length,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await interactionService.adminListContributions({ status: statusParamForTab(tab) });
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      showToast("Impossible de charger les contributions", 'error', 2500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadCounts();
      await loadList();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const approve = async (id) => {
    try {
      await interactionService.approveContribution(id);
      setList((prev) => prev.filter((c) => c.id !== id));
      setCounts((prev) => ({
        ...prev,
        pending: prev.pending - (tab === 'pending' ? 1 : 0),
        approved: prev.approved + 1,
      }));
      showToast('Contribution validée ✅');
    } catch {
      showToast("Erreur lors de la validation", 'error', 2500);
      await loadCounts();
      await loadList();
    }
  };

  const reject = async (id) => {
    try {
      await interactionService.rejectContribution(id);
      setList((prev) => prev.filter((c) => c.id !== id));
      setCounts((prev) => ({
        ...prev,
        pending: prev.pending - (tab === 'pending' ? 1 : 0),
        rejected: prev.rejected + 1,
      }));
      showToast('Contribution rejetée ❌');
    } catch {
      showToast("Erreur lors du rejet", 'error', 2500);
      await loadCounts();
      await loadList();
    }
  };

  const refreshAll = async () => {
    await loadCounts();
    await loadList();
    showToast('Actualisé', 'success', 1200);
  };

  if (deny) {
    return (
      <div className="admin-denied">
        <h2>⛔ Accès Refusé</h2>
        <p>Réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="admin-contribs-page">
      {/* HEADER */}
      <div className="page-header">
        <h1>Modération Contributions</h1>
        <p>Validez ou rejetez les contributions envoyées par les voyageurs.</p>
      </div>

      {/* TOAST FLOTTANT */}
      {toast.show && (
        <div className={`ac-toast ${toast.type}`}>
          {toast.text}
        </div>
      )}

      {/* ONGLET / FILTRES */}
      <div className="ac-tabs-row">
        {['pending','approved','rejected'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`ac-tab-btn ${tab === t ? 'active' : ''}`}
          >
            <FaFilter />
            <span className="tab-label">
              {t === 'pending' ? 'En attente' : t === 'approved' ? 'Approuvées' : 'Rejetées'}
            </span>
            <span className="tab-count">{counts[t] ?? 0}</span>
          </button>
        ))}

        <button onClick={refreshAll} className="ac-refresh-btn">
          <FaSync /> Actualiser
        </button>
      </div>

      {/* LISTE DES CONTRIBUTIONS */}
      <div className="ac-list-card">
        {loading ? (
          <div className="ac-state-msg">Chargement…</div>
        ) : list.length === 0 ? (
          <div className="ac-state-msg">Aucune contribution pour ce statut.</div>
        ) : (
          <div className="ac-grid">
            {list.map((c) => {
              const status = c.status || c.statut;
              const busNum = c.bus_numero || c.busRef || c.bus || null;

              return (
                <div key={c.id} className="ac-card">
                  <div className="ac-card-header">
                    <div>
                      <h3>{c.title || (c.description || '').split('\n')[0].slice(0, 60)}</h3>
                      <span className={`ac-status-badge ${getStatusClass(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                    </div>
                    <small className="ac-date">
                      <FaClock size={10} />{' '}
                      {new Date(c.date_creation || c.dateCreation).toLocaleString('fr-FR')}
                    </small>
                  </div>

                  <p className="ac-description">
                    {c.description}
                  </p>

                  <div className="ac-meta-row">
                    <span className="ac-meta-chip">Type : {c.type}</span>
                    {busNum && (
                      <span className="ac-meta-chip">
                        <FaBus size={11} /> Bus {busNum}
                      </span>
                    )}
                  </div>

                  {tab === 'pending' && (
                    <div className="ac-actions-row">
                      <button className="btn-approve" onClick={() => approve(c.id)}>
                        <FaCheckCircle /> Valider
                      </button>
                      <button className="btn-reject" onClick={() => reject(c.id)}>
                        <FaTimesCircle /> Rejeter
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

export default AdminContributions;
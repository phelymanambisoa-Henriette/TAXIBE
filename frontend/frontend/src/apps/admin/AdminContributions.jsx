// src/apps/admin/AdminContributions.jsx
import React, { useEffect, useMemo, useState } from 'react';
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

  // Accès : seulement staff ou superuser
  const deny =
    !!user &&
    user.is_staff === false &&
    user.is_superuser !== true &&
    user.is_staf !== true &&
    user.isSuperuser !== true;

  // Onglet actif: pending | approved | rejected
  const [tab, setTab] = useState('pending');

  // Toutes les contributions (tous statuts)
  const [allContribs, setAllContribs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState({ show: false, type: 'success', text: '' });
  const showToast = (text, type = 'success', duration = 2000) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type, text: '' }), duration);
  };

  // Normalisation des statuts (le backend peut renvoyer En attente / en_attente / PENDING / etc.)
  const normalizeStatus = (s) => (s || '').toString().toLowerCase().trim();

  const getStatusKey = (s) => {
    const v = normalizeStatus(s);
    if (v.includes('attente') || v === 'pending') return 'pending';
    if (v.includes('approuv') || v.includes('valid') || v === 'approved') return 'approved';
    if (v.includes('rejet') || v === 'rejected' || v.includes('refus')) return 'rejected';
    return 'pending';
  };

  const getStatusLabel = (s) => {
    const k = getStatusKey(s);
    if (k === 'pending') return 'En attente';
    if (k === 'approved') return 'Validée';
    if (k === 'rejected') return 'Rejetée';
    return s || 'Inconnu';
  };

  const getStatusClass = (s) => {
    const k = getStatusKey(s);
    if (k === 'approved') return 'approved';
    if (k === 'rejected') return 'rejected';
    return 'pending';
  };

  // Charger toutes les contributions (admin)
  const loadAllContribs = async () => {
    setLoading(true);
    try {
      // On ne filtre pas par status côté backend : on récupère tout
      const data = await interactionService.adminListContributions();
      const list = Array.isArray(data) ? data : [];
      setAllContribs(list);
    } catch (e) {
      console.error('Erreur loadAllContribs:', e);
      showToast("Impossible de charger les contributions", 'error', 2500);
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    if (!deny) {
      loadAllContribs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deny]);

  // Compteurs par statut calculés côté frontend
  const counts = useMemo(() => {
    const result = { pending: 0, approved: 0, rejected: 0 };
    allContribs.forEach((c) => {
      const s = c.status || c.statut;
      const key = getStatusKey(s);
      if (result[key] !== undefined) {
        result[key] += 1;
      }
    });
    return result;
  }, [allContribs]);

  // Liste filtrée selon l’onglet
  const filteredList = useMemo(() => {
    return allContribs.filter((c) => {
      const s = c.status || c.statut;
      const key = getStatusKey(s);
      return key === tab;
    });
  }, [allContribs, tab]);

  // Actions admin
  const approve = async (id) => {
    try {
      await interactionService.approveContribution(id);
      // On enlève localement et on met à jour les statuts
      setAllContribs((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'Approuvée' } : c))
      );
      showToast('Contribution validée ✅');
    } catch (e) {
      console.error('Erreur approveContribution:', e);
      showToast("Erreur lors de la validation", 'error', 2500);
      await loadAllContribs();
    }
  };

  const reject = async (id) => {
    try {
      await interactionService.rejectContribution(id);
      setAllContribs((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'Rejetée' } : c))
      );
      showToast('Contribution rejetée ❌');
    } catch (e) {
      console.error('Erreur rejectContribution:', e);
      showToast("Erreur lors du rejet", 'error', 2500);
      await loadAllContribs();
    }
  };

  const refreshAll = async () => {
    await loadAllContribs();
    showToast('Actualisé', 'success', 1200);
  };

  // Accès refusé
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
        {['pending', 'approved', 'rejected'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`ac-tab-btn ${tab === t ? 'active' : ''}`}
          >
            <FaFilter />
            <span className="tab-label">
              {t === 'pending'
                ? 'En attente'
                : t === 'approved'
                ? 'Approuvées'
                : 'Rejetées'}
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
        ) : filteredList.length === 0 ? (
          <div className="ac-state-msg">Aucune contribution pour ce statut.</div>
        ) : (
          <div className="ac-grid">
            {filteredList.map((c) => {
              const status = c.status || c.statut;
              const busNum = c.bus_numero || c.busRef || c.bus || null;

              let dateStr = '';
              const rawDate = c.date_creation || c.dateCreation || c.created_at;
              if (rawDate) {
                try {
                  dateStr = new Date(rawDate).toLocaleString('fr-FR');
                } catch {
                  dateStr = rawDate;
                }
              }

              return (
                <div key={c.id} className="ac-card">
                  <div className="ac-card-header">
                    <div>
                      <h3>
                        {c.title ||
                          (c.description || '')
                            .split('\n')[0]
                            .slice(0, 60)}
                      </h3>
                      <span className={`ac-status-badge ${getStatusClass(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                    </div>
                    {dateStr && (
                      <small className="ac-date">
                        <FaClock size={10} /> {dateStr}
                      </small>
                    )}
                  </div>

                  <p className="ac-description">
                    {c.description}
                  </p>

                  <div className="ac-meta-row">
                    <span className="ac-meta-chip">Type : {c.type || 'Non spécifié'}</span>
                    {busNum && (
                      <span className="ac-meta-chip">
                        <FaBus size={11} /> Bus {busNum}
                      </span>
                    )}
                  </div>

                  {getStatusKey(status) === 'pending' && (
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
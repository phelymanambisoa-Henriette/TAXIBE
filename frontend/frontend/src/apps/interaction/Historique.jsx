// src/apps/interaction/Historique.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { interactionService } from '../../services/interactionService';
import { FaSearch, FaTrash, FaSync, FaExternalLinkAlt, FaDownload } from 'react-icons/fa';

const Historique = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Toast
  const [toast, setToast] = useState({ show: false, type: 'success', text: '' });
  const showToast = (text, type = 'success', duration = 1800) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type, text: '' }), duration);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await interactionService.getHistorique();
      setItems(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (e) {
      showToast("Impossible de charger l'historique", 'error', 2200);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let arr = [...items];
    if (dateFrom) {
      const ts = new Date(dateFrom + 'T00:00:00').getTime();
      arr = arr.filter(it => new Date(it.date_recherche).getTime() >= ts);
    }
    if (dateTo) {
      const ts = new Date(dateTo + 'T23:59:59').getTime();
      arr = arr.filter(it => new Date(it.date_recherche).getTime() <= ts);
    }
    const qq = q.trim().toLowerCase();
    if (qq) {
      arr = arr.filter(it => {
        const d = (it.depart_nom || '').toLowerCase();
        const a = (it.arrivee_nom || '').toLowerCase();
        return d.includes(qq) || a.includes(qq);
      });
    }
    arr.sort((a, b) => new Date(b.date_recherche) - new Date(a.date_recherche));
    return arr;
  }, [items, q, dateFrom, dateTo]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  useEffect(() => setPage(1), [q, dateFrom, dateTo, pageSize]);

  const remove = async (id) => {
    if (!window.confirm('Supprimer cette recherche ?')) return;
    try {
      await interactionService.deleteHistorique(id);
      showToast('Supprimé');
      load();
    } catch {
      showToast('Erreur suppression', 'error', 2000);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Effacer tout votre historique ?')) return;
    try {
      if (interactionService.clearUserHistorique) {
        await interactionService.clearUserHistorique();
      } else {
        for (const it of items) {
          // eslint-disable-next-line no-await-in-loop
          await interactionService.deleteHistorique(it.id);
        }
      }
      showToast('Historique effacé');
      load();
    } catch {
      showToast('Erreur effacement', 'error', 2000);
    }
  };

  // Relancer via /search (pré-remplissage + go=1)
  const relancer = (it, goToMap = false) => {
    const params = new URLSearchParams({
      depart: it.depart,
      arrivee: it.arrivee,
      go: '1',
      ...(goToMap ? { view: 'map' } : {}),
    });
    navigate(`/search?${params.toString()}`);
  };

  const exportCSV = () => {
    if (filtered.length === 0) return showToast('Aucune donnée à exporter', 'error', 1800);
    const header = ['date', 'depart', 'arrivee'];
    const lines = filtered.map(it => {
      const dateStr = new Date(it.date_recherche).toLocaleString('fr-FR');
      const dep = it.depart_nom || `#${it.depart}`;
      const arr = it.arrivee_nom || `#${it.arrivee}`;
      const depCsv = `"${String(dep).replace(/"/g, '""')}"`;
      const arrCsv = `"${String(arr).replace(/"/g, '""')}"`;
      return [dateStr, depCsv, arrCsv].join(';');
    });
    const csv = [header.join(';'), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fname = `historique_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Export CSV généré');
  };

  return (
    <div className="container" style={{ padding: 20 }}>
      <h1>Historique de vos recherches</h1>

      {toast.show && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 99999,
          minWidth: 260, maxWidth: 520, padding: '12px 14px',
          borderRadius: 10, color: '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          background: toast.type === 'success'
            ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.95), rgba(39, 174, 96, 0.95))'
            : 'linear-gradient(135deg, rgba(231, 76, 60, 0.95), rgba(192, 57, 43, 0.95))',
        }}>
          {toast.text}
        </div>
      )}

      {/* Filtres */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        padding: 12,
        boxShadow: 'var(--shadow-sm)',
        margin: '12px 0',
        display: 'grid',
        gap: 10,
        gridTemplateColumns: '1fr 1fr 1fr auto',
      }}>
        <label style={label}>
          <FaSearch />
          <input
            placeholder="Rechercher (départ/arrivée)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={input}
          />
        </label>

        <label style={labelCol}>Du
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={input} />
        </label>
        <label style={labelCol}>Au
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={input} />
        </label>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={load} className="btn-secondary" style={{ padding: '8px 12px' }}>
            <FaSync /> Actualiser
          </button>
          {items.length > 0 && (
            <button onClick={clearAll} className="btn-delete" style={{ padding: '8px 12px' }}>
              <FaTrash /> Tout effacer
            </button>
          )}
        </div>
      </div>

      {/* Outils */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Taille page:
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={smallSelect}>
            {[10, 20, 50].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <button onClick={exportCSV} className="btn-secondary" style={{ padding: '8px 12px' }}>
          <FaDownload /> Export CSV
        </button>
      </div>

      {/* Liste */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        padding: 12,
        boxShadow: 'var(--shadow-sm)',
        minHeight: 120
      }}>
        {loading ? (
          <div className="card">Chargement…</div>
        ) : pageItems.length === 0 ? (
          <div className="card">Aucun historique.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {pageItems.map((it) => (
              <div key={it.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong>
                    {it.depart_nom || `#${it.depart}`} → {it.arrivee_nom || `#${it.arrivee}`}
                  </strong>
                  <small>{new Date(it.date_recherche).toLocaleString('fr-FR')}</small>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn-secondary small"
                    onClick={() => relancer(it, false)}
                    title="Relancer sur la page Recherche"
                  >
                    <FaExternalLinkAlt /> Relancer
                  </button>
                  <button
                    className="btn-secondary small"
                    onClick={() => relancer(it, true)} // go=1 & view=map, Search.jsx se chargera d’ouvrir la carte
                    title="Voir la carte"
                  >
                    <FaExternalLinkAlt /> Voir la carte
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => remove(it.id)}
                    title="Supprimer cette entrée"
                  >
                    <FaTrash /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', marginTop: 12 }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {start + 1}-{Math.min(start + pageSize, total)} / {total}
          </span>
          <button className="btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '6px 10px' }}>
            ← Préc.
          </button>
          <span style={{ color: 'var(--text-secondary)' }}>Page {currentPage} / {totalPages}</span>
          <button className="btn-secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '6px 10px' }}>
            Suiv. →
          </button>
        </div>
      )}
    </div>
  );
};

const label = { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' };
const input = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' };
const labelCol = { display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--text-primary)' };
const smallSelect = { ...input, width: 90, padding: '6px 8px' };

export default Historique;
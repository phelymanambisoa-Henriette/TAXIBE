// src/apps/admin/AdminBusList.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transportService } from '../../services/transportService';
import { useAuth } from '../../contexts/AuthContext';
import { FaBus, FaSearch, FaPlus, FaEdit, FaTrash, FaSync } from 'react-icons/fa';

const AdminBusList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const deny =
    !!user &&
    user.is_staff === false &&
    user.is_superuser !== true &&
    user.is_staf !== true &&
    user.isSuperuser !== true;

  const [buses, setBuses] = useState([]);
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
      const res = await transportService.getAllBuses();
      setBuses(res.data || []);
    } catch (e) {
      showToast("Impossible de charger les bus", 'error', 2200);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return buses;
    return (buses || []).filter(b => {
      const num = String(b.numeroBus || b.numero || '').toLowerCase();
      const typ = String(b.typeTrajet || '').toLowerCase();
      const st = String(b.status || '').toLowerCase();
      return num.includes(qq) || typ.includes(qq) || st.includes(qq);
    });
  }, [buses, q]);

  const remove = async (id) => {
    if (deny) return showToast('Accès refusé', 'error', 1800);
    if (!window.confirm('Supprimer ce bus ?')) return;
    try {
      await transportService.deleteBus(id);
      showToast('Bus supprimé ✅');
      load();
    } catch (e) {
      showToast('Erreur lors de la suppression', 'error', 2200);
    }
  };

  if (deny) {
    return (
      <div className="container" style={{ padding: 20 }}>
        <h1>🔐 Accès refusé</h1>
        <p>Réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: 20 }}>
      <h1>Gestion des bus</h1>

      {toast.show && (
        <div style={toastStyle(toast.type)}>{toast.text}</div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '12px 0' }}>
        <label style={searchWrap}>
          <FaSearch />
          <input
            placeholder="Recherche (numéro, type, statut)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={searchInput}
          />
        </label>

        <button onClick={() => navigate('/admin/bus/new')} className="btn-submit" style={{ padding: '10px 14px' }}>
          <FaPlus /> Nouveau bus
        </button>

        <button onClick={load} className="btn-secondary" style={{ padding: '10px 14px', marginLeft: 'auto' }}>
          <FaSync /> Actualiser
        </button>
      </div>

      <div style={cardWrap}>
        {loading ? (
          <div className="card">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="card">Aucun bus.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                  <th style={th}>#</th>
                  <th style={th}><FaBus /> Numéro</th>
                  <th style={th}>Frais</th>
                  <th style={th}>Statut</th>
                  <th style={th}>Trajets</th>
                  <th style={th} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={td}>{i + 1}</td>
                    <td style={td}>{b.numeroBus || b.numero || '-'}</td>
                    <td style={td}>
                      {b.frais != null ? `${b.frais} Ar` : '-'}
                    </td>
                    <td style={td}>{b.status || '-'}</td>
                    <td style={td}>{b.trajetCount ?? b.trajets?.length ?? '-'}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/admin/bus/${b.id}`)}
                        className="btn-secondary"
                        style={{ padding: '6px 10px', marginRight: 6 }}
                      >
                        <FaEdit /> Éditer
                      </button>
                      <button
                        onClick={() => remove(b.id)}
                        className="btn-delete"
                        style={{ padding: '6px 10px' }}
                      >
                        <FaTrash /> Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const toastStyle = (type) => ({
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 99999,
  minWidth: 260,
  maxWidth: 520,
  padding: '12px 14px',
  borderRadius: 10,
  color: '#fff',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  background:
    type === 'success'
      ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.95), rgba(39, 174, 96, 0.95))'
      : 'linear-gradient(135deg, rgba(231, 76, 60, 0.95), rgba(192, 57, 43, 0.95))',
});

const cardWrap = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 12,
  padding: 12,
  boxShadow: 'var(--shadow-sm)',
  minHeight: 120,
};

const th = { padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' };
const td = { padding: '10px 8px', color: 'var(--text-primary)' };

const searchWrap = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'var(--bg-secondary)',
  border: '2px solid var(--border-color)',
  borderRadius: 8,
  padding: '0 12px',
};
const searchInput = {
  width: 260,
  padding: '10px 6px',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: 'var(--text-primary)',
};

export default AdminBusList;
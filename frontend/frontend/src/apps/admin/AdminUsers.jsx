// src/apps/admin/AdminUsers.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaSearch,
  FaToggleOn,
  FaToggleOff,
  FaUserShield,
  FaUserSlash,
  FaKey,
} from 'react-icons/fa';
import './AdminUsers.css';

const ROLES = ['superadmin', 'admin', 'staff', 'moderator', 'manager', 'user'];

const AdminUsers = () => {
  const { user } = useAuth();
  const deny =
    !!user &&
    user.is_staff === false &&
    user.is_superuser !== true &&
    user.is_staf !== true &&
    user.isSuperuser !== true;

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [active, setActive] = useState(''); // '', 'true', 'false'
  const [staff, setStaff] = useState('');   // '', 'true', 'false'

  // Toast
  const [toast, setToast] = useState({ show: false, type: 'success', text: '' });
  const showToast = (text, type = 'success', duration = 2200) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type, text: '' }), duration);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await userService.list({
        q: q || undefined,
        role: role || undefined,
        active: active || undefined,
        staff: staff || undefined,
      });
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Erreur chargement utilisateurs:', e);
      showToast("Impossible de charger les utilisateurs", 'error', 2500);
    } finally {
      setLoading(false);
    }
  };

  // 1) Chargement initial
  useEffect(() => {
    if (!deny) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deny]);

  // 2) Auto-refresh quand les filtres changent (avec petit délai)
  const firstFiltersChange = useRef(true);
  useEffect(() => {
    if (firstFiltersChange.current) {
      firstFiltersChange.current = false;
      return;
    }
    if (deny) return;

    const timer = setTimeout(() => {
      load();
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, role, active, staff, deny]);

  const onSubmitSearch = (e) => {
    e.preventDefault();
    load(); // en plus du debounce
  };

  const filteredLocal = useMemo(() => list, [list]);

  const onToggleActive = async (id) => {
    try {
      const res = await userService.toggleActive(id);
      showToast(res.is_active ? 'Utilisateur activé' : 'Utilisateur désactivé');
      load();
    } catch {
      showToast('Erreur toggle actif', 'error', 2000);
    }
  };

  const onToggleStaff = async (id) => {
    try {
      const res = await userService.toggleStaff(id);
      if (res.is_staff !== undefined) {
        showToast(res.is_staff ? 'Droits staff accordés' : 'Droits staff retirés');
      } else if (res.role) {
        showToast(`Rôle => ${res.role}`);
      } else {
        showToast('Modif droits effectuée');
      }
      load();
    } catch {
      showToast('Erreur toggle staff', 'error', 2000);
    }
  };

  const onSetRole = async (id, newRole) => {
    try {
      await userService.setRole(id, newRole);
      showToast(`Rôle mis à jour: ${newRole}`);
      load();
    } catch {
      showToast('Erreur mise à jour du rôle', 'error', 2000);
    }
  };

  const onResetPassword = async (id, username) => {
    if (!window.confirm(`Générer un mot de passe temporaire pour ${username} ?`)) return;
    try {
      const res = await userService.resetPassword(id);
      const temp = res.temp_password;
      if (temp) {
        navigator.clipboard?.writeText(temp).catch(() => {});
        showToast(`Mot de passe temp: ${temp} (copié)`);
      } else {
        showToast('Mot de passe réinitialisé');
      }
    } catch {
      showToast('Erreur reset mot de passe', 'error', 2000);
    }
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
    <div className="admin-users-page">
      {/* Header */}
      <div className="page-header">
        <h1>Gestion des utilisateurs</h1>
        <p>Rechercher, filtrer et administrer les comptes.</p>
      </div>

      {/* Toast */}
      {toast.show && <div className={`au-toast ${toast.type}`}>{toast.text}</div>}

      {/* Toolbar */}
      <div className="users-toolbar">
        <form className="search-field" onSubmit={onSubmitSearch}>
          <FaSearch className="icon-muted" />
          <input
            placeholder="Recherche (username, email, nom…)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>

        <div className="select-field">
          <label>Rôle</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Tous</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="select-field">
          <label>Actif</label>
          <select value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="">Tous</option>
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </div>

        <div className="select-field">
          <label>Staff</label>
          <select value={staff} onChange={(e) => setStaff(e.target.value)}>
            <option value="">Tous</option>
            <option value="true">Staff</option>
            <option value="false">Non-staff</option>
          </select>
        </div>
      </div>

      {/* Liste simple */}
      <div className="users-table-card">
        {loading ? (
          <div className="state-msg">Chargement…</div>
        ) : filteredLocal.length === 0 ? (
          <div className="state-msg">Aucun utilisateur.</div>
        ) : (
          <div className="users-list">
            {filteredLocal.map((u) => {
              const displayName = u.nom || u.username || 'Utilisateur';
              const isActive = !!u.is_active;
              const isStaff = !!(u.is_staff || (u.role || '').toLowerCase() === 'admin');

              return (
                <div className="user-row" key={u.id}>
                  {/* Colonne gauche : nom + email */}
                  <div className="user-col user-identite-col">
                    <div className="user-name">{displayName}</div>
                    <div className="user-email">{u.email || '-'}</div>
                  </div>

                  {/* Colonne milieu : rôle + badges */}
                  <div className="user-col user-role-col">
                    <select
                      value={(u.role || 'user').toLowerCase()}
                      onChange={(e) => onSetRole(u.id, e.target.value)}
                      className="role-select"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <div className="user-status-badges">
                      <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                        {isActive ? 'ACTIF' : 'INACTIF'}
                      </span>
                      <span className={`badge ${isStaff ? 'badge-info' : 'badge-muted'}`}>
                        {isStaff ? 'STAFF' : 'NON-STAFF'}
                      </span>
                    </div>
                  </div>

                <td className="actions-cell">
                  {/* Bouton ACTIF : vert quand actif, neutre sinon */}
                  <button
                    onClick={() => onToggleActive(u.id)}
                    className={`btn small btn-status ${u.is_active ? 'status-on' : 'status-off'}`}
                    title={u.is_active ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}
                  >
                    Actif
                  </button>

                  {/* Bouton STAFF : bleu quand staff, neutre sinon */}
                  <button
                    onClick={() => onToggleStaff(u.id)}
                    className={`btn small btn-status ${ (u.is_staff || (u.role || '').toLowerCase() === 'admin') ? 'staff-on' : 'staff-off' }`}
                    title={u.is_staff ? "Retirer droits staff" : "Donner droits staff"}
                  >
                    Staff
                  </button>

                  {/* Bouton RÉINITIALISER : on garde ton style warn existant */}
                  <button
                    onClick={() => onResetPassword(u.id, u.username)}
                    className="btn small warn"
                    title="Réinitialiser mot de passe"
                  >
                    <FaKey /> 
                  </button>
                </td>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
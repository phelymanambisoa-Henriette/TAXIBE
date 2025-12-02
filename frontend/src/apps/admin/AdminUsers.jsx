// src/apps/admin/AdminUsers.jsx
import React, { useEffect, useMemo, useState } from 'react';
import userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { FaSearch, FaSync, FaToggleOn, FaToggleOff, FaUserShield, FaUserSlash, FaKey } from 'react-icons/fa';
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
      showToast("Impossible de charger les utilisateurs", 'error', 2500);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const onSubmitSearch = (e) => {
    e.preventDefault();
    load();
  };

  const filteredLocal = useMemo(() => {
    // Option de filtrage supplémentaire côté client si besoin
    return list;
  }, [list]);

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
      {toast.show && (
        <div className={`au-toast ${toast.type}`}>{toast.text}</div>
      )}

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
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
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

        <button onClick={load} className="btn-refresh">
          <FaSync /> Actualiser
        </button>
      </div>

      {/* Liste */}
      <div className="users-table-card">
        {loading ? (
          <div className="state-msg">Chargement…</div>
        ) : filteredLocal.length === 0 ? (
          <div className="state-msg">Aucun utilisateur.</div>
        ) : (
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Actif</th>
                  <th>Staff</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocal.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{[u.first_name, u.last_name].filter(Boolean).join(' ') || '-'}</td>
                    <td>
                      <select
                        value={(u.role || '').toLowerCase() || 'user'}
                        onChange={(e) => onSetRole(u.id, e.target.value)}
                        className="role-select"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>{'is_active' in u ? (u.is_active ? 'Oui' : 'Non') : '-'}</td>
                    <td>{'is_staff' in u ? (u.is_staff ? 'Oui' : 'Non') : ((u.role || '').toLowerCase() === 'admin' ? 'Oui' : 'Non')}</td>
                    <td className="actions-cell">
                      <button
                        onClick={() => onToggleActive(u.id)}
                        className="btn small"
                        title={u.is_active ? 'Désactiver' : 'Activer'}
                      >
                        {u.is_active ? <FaToggleOn /> : <FaToggleOff />} {u.is_active ? 'Désactiver' : 'Activer'}
                      </button>

                      <button
                        onClick={() => onToggleStaff(u.id)}
                        className="btn small"
                        title="Basculer Staff"
                      >
                        {(u.is_staff || (u.role || '').toLowerCase() === 'admin') ? <FaUserShield /> : <FaUserSlash />} Staff
                      </button>

                      <button
                        onClick={() => onResetPassword(u.id, u.username)}
                        className="btn small warn"
                        title="Réinitialiser mot de passe"
                      >
                        <FaKey /> Réinitialiser mot de passe
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

export default AdminUsers;
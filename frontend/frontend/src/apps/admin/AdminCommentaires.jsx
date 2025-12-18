import React, { useEffect, useMemo, useState } from 'react';
import { interactionService } from '../../services/interactionService';
import { transportService } from '../../services/transportService';
import { useAuth } from '../../contexts/AuthContext';
import { FaTrash, FaFilter, FaBus, FaSearch, FaStar, FaUser, FaCalendarAlt } from 'react-icons/fa';
import './AdminCommentaires.css'; // Nouveau CSS

const AdminCommentaires = () => {
  const { user } = useAuth();
  
  // Droit de modération (Basé sur Staff ou Superuser)
  const canModerate = !!(user?.is_staff || user?.isSuperuser || user?.is_staf);

  const [comments, setComments] = useState([]);
  const [buses, setBuses] = useState([]);
  const [busId, setBusId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, type: '', text: '' });

  const showToast = (text, type = 'success') => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  // Chargement des données
  const load = async () => {
    setLoading(true);
    try {
      const [c, b] = await Promise.all([
        interactionService.getComments(busId ? { bus: busId } : {}),
        transportService.getAllBuses(),
      ]);
      setComments(Array.isArray(c) ? c : []);
      setBuses((b.data || []));
    } catch (e) {
      showToast("Erreur de chargement", 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [busId]);

  // Filtrage local
  const filtered = useMemo(() => {
    if (!search.trim()) return comments;
    const q = search.toLowerCase();
    return comments.filter((c) => {
      const user = (c.username || c.user?.username || '').toLowerCase();
      const txt = (c.contenu || c.text || '').toLowerCase();
      return user.includes(q) || txt.includes(q);
    });
  }, [comments, search]);

  // Suppression
  const remove = async (id) => {
    if (!canModerate) return showToast("Droit requis: Admin", 'error');
    if (!window.confirm('Supprimer définitivement ce commentaire ?')) return;
    
    try {
      await interactionService.deleteComment(id);
      showToast('Commentaire supprimé', 'success');
      load(); // Recharger la liste
    } catch (e) {
      showToast("Erreur suppression", 'error');
    }
  };

  // Rendu Etoiles
  const renderStars = (note) => (
    <div className="stars-display">
      {[...Array(5)].map((_, i) => (
        <FaStar key={i} className={i < note ? 'star filled' : 'star empty'} />
      ))}
    </div>
  );

  if (!canModerate) {
    return (
      <div className="admin-denied">
        <h2>⛔ Accès Refusé</h2>
        <p>Section réservée aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="admin-comments-page">
      
      {/* HEADER */}
      <div className="page-header">
        <h1>Modération Commentaires</h1>
        <p>Gérez les avis utilisateurs sur les lignes de bus.</p>
      </div>

      {/* TOAST */}
      {toast.show && <div className={`toast-float ${toast.type}`}>{toast.text}</div>}

      {/* BARRE D'OUTILS */}
      <div className="toolbar-container">
        <div className="filter-group">
          <FaFilter className="icon-muted" />
          <select value={busId} onChange={(e) => setBusId(e.target.value)}>
            <option value="">Tous les bus</option>
            {buses.map((b) => (
              <option key={b.id} value={b.id}>Bus {b.numeroBus}</option>
            ))}
          </select>
        </div>

        <div className="search-group">
          <FaSearch className="icon-muted" />
          <input 
            type="text" 
            placeholder="Rechercher un mot-clé, un auteur..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* LISTE DES COMMENTAIRES */}
      <div className="comments-grid-admin">
        {loading ? (
          <div className="loading-state">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">Aucun commentaire trouvé.</div>
        ) : (
          filtered.map((c) => {
            const busNum = c.bus_numero || c.busRef || c.bus;
            
            return (
              <div key={c.id} className="admin-comment-card">
                <div className="card-header">
                  <div className="user-info">
                    <div className="avatar-circle">
                      {(c.username?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <span className="username">{c.username || 'Anonyme'}</span>
                      <div className="meta-date">
                        <FaCalendarAlt size={10} /> {new Date(c.date_creation).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="bus-badge-admin">
                    {busNum ? `Bus ${busNum}` : 'Général'}
                  </div>
                </div>

                <div className="card-rating">
                  {renderStars(c.note || c.rating || 0)}
                </div>

                <p className="comment-content">
                  "{c.contenu || c.text}"
                </p>

                <div className="card-actions">
                  <button 
                    className="btn-delete-admin" 
                    onClick={() => remove(c.id)}
                    title="Supprimer"
                  >
                    <FaTrash /> Supprimer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminCommentaires;
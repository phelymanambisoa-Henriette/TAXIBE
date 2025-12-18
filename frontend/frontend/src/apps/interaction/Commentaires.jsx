import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { interactionService } from '../../services/interactionService';
import { transportService } from '../../services/transportService';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FaStar, FaRegStar, FaThumbsUp, FaBus, FaFilter, FaEdit, FaTrash,
  FaCheckCircle, FaTimesCircle, FaPaperPlane, FaReply, FaFlag,
  FaExternalLinkAlt, FaSearch, FaCommentDots, FaTimes
} from 'react-icons/fa';
import './Commentaires.css';

const Commentaires = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [comments, setComments] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulaire
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // États d'édition
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  
  // Likes
  const [likesMap, setLikesMap] = useState({});
  const [likedSet, setLikedSet] = useState(new Set());

  // Filtres
  const busFilterId = searchParams.get('bus');
  const [filterBusId, setFilterBusId] = useState(busFilterId || '');
  const [search, setSearch] = useState('');

  // Initialisation
  useEffect(() => {
    const init = async () => {
      try {
        const busRes = await transportService.getAllBuses();
        setBuses(busRes.data || []);
        await loadComments();
      } catch (e) { console.error(e); }
    };
    init();
  }, []);

  useEffect(() => { loadComments(); }, [filterBusId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const params = filterBusId ? { bus: filterBusId } : {};
      const data = await interactionService.getComments(params);
      setComments(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleFilterChange = (busId) => {
    setFilterBusId(busId);
    setSearchParams(busId ? { bus: busId } : {});
  };

  // --- ACTIONS ---
  
  const submitComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return alert('Connectez-vous !');
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await interactionService.createComment({
        bus: selectedBusId || null,
        text: newComment, 
        contenu: newComment,
        rating: parseInt(rating, 10)
      });
      setNewComment(''); 
      setRating(5); 
      setSelectedBusId('');
      loadComments();
    } catch (e) { 
      alert('Erreur lors de l\'envoi'); 
      console.error(e);
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleLike = async (c) => {
    if (!isAuthenticated) {
      alert('Connectez-vous pour aimer un commentaire');
      return;
    }
    
    const id = c.id;
    const current = likesMap[id] ?? c.likes ?? 0;
    const isLiked = likedSet.has(id);
    
    // Optimistic update
    setLikesMap({ ...likesMap, [id]: isLiked ? current - 1 : current + 1 });
    const newSet = new Set(likedSet);
    isLiked ? newSet.delete(id) : newSet.add(id);
    setLikedSet(newSet);

    try { 
      await interactionService.likeComment(id); 
    } catch (e) {
      // Rollback en cas d'erreur
      setLikesMap({ ...likesMap, [id]: current });
      setLikedSet(new Set(likedSet));
      console.error('Erreur like:', e);
    }
  };

  const deleteComment = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;
    
    try { 
      await interactionService.deleteComment(id); 
      loadComments(); 
    } catch(e) {
      alert('Erreur lors de la suppression');
      console.error(e);
    }
  };

  // 🆕 FONCTION ÉDITION
  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.contenu || comment.text || '');
    setEditRating(comment.note || comment.rating || 5);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditRating(5);
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) {
      alert('Le commentaire ne peut pas être vide');
      return;
    }

    try {
      await interactionService.updateComment(id, {
        contenu: editText,
        text: editText,
        rating: editRating
      });
      setEditingId(null);
      setEditText('');
      setEditRating(5);
      loadComments();
    } catch (e) {
      alert('Erreur lors de la modification');
      console.error(e);
    }
  };

  // 🆕 FONCTION RÉPONSE
  const startReply = (commentId) => {
    setReplyToId(commentId);
    setReplyText('');
  };

  const cancelReply = () => {
    setReplyToId(null);
    setReplyText('');
  };

  const submitReply = async (parentId) => {
    if (!isAuthenticated) {
      alert('Connectez-vous pour répondre');
      return;
    }
    
    if (!replyText.trim()) {
      alert('La réponse ne peut pas être vide');
      return;
    }

    try {
      await interactionService.createComment({
        parentId: parentId,
        text: replyText,
        contenu: replyText,
        rating: 5
      });
      setReplyToId(null);
      setReplyText('');
      loadComments();
    } catch (e) {
      alert('Erreur lors de l\'envoi de la réponse');
      console.error(e);
    }
  };

  // --- RENDER HELPERS ---

  const renderStars = (count, interactive = false, setter = null) => (
    <div className="stars-row">
      {[1, 2, 3, 4, 5].map(star => (
        <span 
          key={star} 
          className={`star ${star <= count ? 'filled' : ''} ${interactive ? 'pointer' : ''}`}
          onClick={() => interactive && setter && setter(star)}
        >
          {star <= count ? <FaStar /> : <FaRegStar />}
        </span>
      ))}
    </div>
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return comments.filter(c => 
      (c.username || '').toLowerCase().includes(q) || 
      (c.contenu || '').toLowerCase().includes(q)
    );
  }, [comments, search]);

  return (
    <div className="page-commentaires">
      <div className="container-large">
        
        {/* HEADER */}
        <div className="page-header-center">
          <h1>💬 Espace <span className="highlight">Communauté</span></h1>
          <p>Partagez vos avis sur les trajets TaxiBe</p>
        </div>

        {/* BARRE D'OUTILS */}
        <div className="toolbar-card">
          <div className="filter-group">
            <FaFilter className="icon-gray" />
            <select value={filterBusId} onChange={(e) => handleFilterChange(e.target.value)}>
              <option value="">Tous les bus</option>
              {buses.map(b => <option key={b.id} value={b.id}>Bus {b.numeroBus}</option>)}
            </select>
          </div>
          <div className="search-group">
            <FaSearch className="icon-gray" />
            <input 
              type="text" 
              placeholder="Rechercher un avis..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>

        <div className="content-grid">
          
          {/* GAUCHE : FORMULAIRE */}
          <div className="sidebar-form">
            {isAuthenticated ? (
              <div className="form-card">
                <h3><FaCommentDots /> Nouvel Avis</h3>
                <form onSubmit={submitComment}>
                  <div className="form-field">
                    <label>Concerne le bus :</label>
                    <select value={selectedBusId} onChange={(e) => setSelectedBusId(e.target.value)}>
                      <option value="">-- Général --</option>
                      {buses.map(b => <option key={b.id} value={b.id}>Bus {b.numeroBus}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Votre note :</label>
                    {renderStars(rating, true, setRating)}
                  </div>
                  <div className="form-field">
                    <textarea 
                      rows="4" 
                      placeholder="Racontez votre expérience..." 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-submit-comment" disabled={submitting}>
                    {submitting ? 'Envoi...' : <><FaPaperPlane /> Publier l'avis</>}
                  </button>
                </form>
              </div>
            ) : (
              <div className="login-promo-card">
                <h3>🔒 Connectez-vous</h3>
                <p>Pour partager votre avis avec la communauté.</p>
                <button onClick={() => navigate('/login')} className="btn-login-small">Connexion</button>
              </div>
            )}
          </div>

          {/* DROITE : LISTE COMMENTAIRES */}
          <div className="comments-feed">
            {loading ? <div className="loader-center">Chargement...</div> : 
             filtered.length === 0 ? <div className="empty-state">Aucun commentaire trouvé 😕</div> : 
             filtered.map(comment => {
               const isOwner = user && (comment.username === user.username);
               const likes = likesMap[comment.id] ?? comment.likes ?? 0;
               const isEditing = editingId === comment.id;
               const isReplying = replyToId === comment.id;

               return (
                 <div key={comment.id} className="comment-item">
                   <div className="comment-avatar">
                     {(comment.username?.[0] || 'U').toUpperCase()}
                   </div>
                   
                   <div className="comment-body">
                     <div className="comment-meta">
                       <span className="author-name">{comment.username || 'Anonyme'}</span>
                       <span className="meta-dot">•</span>
                       <span className="comment-date">
                         {new Date(comment.date_creation).toLocaleDateString()}
                       </span>
                       {comment.busRef && <span className="bus-tag">Bus {comment.bus_numero}</span>}
                     </div>

                     {/* MODE ÉDITION */}
                     {isEditing ? (
                       <div className="edit-form">
                         {renderStars(editRating, true, setEditRating)}
                         <textarea 
                           value={editText}
                           onChange={(e) => setEditText(e.target.value)}
                           rows="3"
                           className="edit-textarea"
                         />
                         <div className="edit-actions">
                           <button onClick={() => saveEdit(comment.id)} className="btn-save">
                             <FaCheckCircle /> Enregistrer
                           </button>
                           <button onClick={cancelEdit} className="btn-cancel">
                             <FaTimes /> Annuler
                           </button>
                         </div>
                       </div>
                     ) : (
                       <>
                         <div className="comment-stars">
                           {renderStars(comment.note || comment.rating || 5)}
                         </div>
                         <p className="comment-content">{comment.contenu || comment.text}</p>
                       </>
                     )}

                     {/* ACTIONS BAR */}
                     {!isEditing && (
                       <div className="comment-actions-bar">
                         <button 
                           className={`action-btn ${likedSet.has(comment.id) ? 'liked' : ''}`} 
                           onClick={() => handleLike(comment)}
                           title="J'aime"
                         >
                           <FaThumbsUp /> {likes > 0 && likes}
                         </button>

                         {isAuthenticated && (
                           <button 
                             className="action-btn" 
                             onClick={() => startReply(comment.id)}
                             title="Répondre"
                           >
                             <FaReply />
                           </button>
                         )}
                         
                         {isOwner && (
                           <>
                             <button 
                               className="action-btn edit" 
                               onClick={() => startEdit(comment)}
                               title="Modifier"
                             >
                               <FaEdit />
                             </button>
                             <button 
                               className="action-btn delete" 
                               onClick={() => deleteComment(comment.id)}
                               title="Supprimer"
                             >
                               <FaTrash />
                             </button>
                           </>
                         )}
                       </div>
                     )}

                     {/* FORMULAIRE RÉPONSE */}
                     {isReplying && (
                       <div className="reply-form">
                         <textarea 
                           value={replyText}
                           onChange={(e) => setReplyText(e.target.value)}
                           placeholder="Écrivez votre réponse..."
                           rows="2"
                           className="reply-textarea"
                         />
                         <div className="reply-actions">
                           <button onClick={() => submitReply(comment.id)} className="btn-save">
                             <FaPaperPlane /> Répondre
                           </button>
                           <button onClick={cancelReply} className="btn-cancel">
                             <FaTimes /> Annuler
                           </button>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               );
             })
            }
          </div>

        </div>
      </div>
    </div>
  );
};

export default Commentaires;
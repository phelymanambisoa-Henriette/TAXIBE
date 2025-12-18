// src/components/Comments.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { commentService } from '../services/commentService';
import { useLanguage } from '../hooks/useLanguage';
import './Comments.css';

const Comments = ({ busId }) => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadComments();
  }, [busId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await commentService.getComments(busId);
      const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setComments(list);
    } catch (err) {
      console.error('❌ Erreur chargement commentaires:', err);
      setError(t('common.error') || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      alert(t('comments.yourComment') || 'Votre commentaire ?');
      return;
    }

    if (!isAuthenticated) {
      alert(t('comments.loginToComment') || 'Connectez-vous pour commenter');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await commentService.createComment({
        bus: busId,
        text: newComment,   // transformé en contenu par commentService
        rating: rating,     // transformé en note
      });

      setNewComment('');
      setRating(5);
      await loadComments();
      alert(t('comments.commentAdded') || 'Commentaire ajouté avec succès !');
    } catch (err) {
      console.error('❌ Erreur envoi:', err);
      setError(t('comments.errorAdding') || 'Erreur lors de l\'envoi du commentaire');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (note) => {
    const n = Math.max(0, Math.min(5, note || 0));
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < n ? 'filled' : ''}>
        ⭐
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="comments">
        <div className="loading">
          <div className="spinner"></div>
          <p>{t('common.loading') || 'Chargement des commentaires...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="comments">
      <div className="comments-header">
        <h3>💬 {t('comments.title') || 'Commentaires'}</h3>
        <span className="comment-count">({comments.length})</span>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <h4>{t('comments.leaveComment') || 'Laisser un avis'}</h4>

          <div className="rating-input">
            <label>{t('comments.rating') || 'Note'} :</label>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={n <= rating ? 'filled' : ''}
                  disabled={submitting}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('comments.yourCommentPlaceholder') || 'Votre avis...'}
            rows={4}
            maxLength={500}
            disabled={submitting}
          />

          <div className="form-footer">
            <span className="char-count">{newComment.length}/500</span>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="btn-submit"
            >
              {submitting
                ? t('comments.publishing') || 'Publication...'
                : t('comments.publish') || 'Publier'}
            </button>
          </div>
        </form>
      ) : (
        <div className="login-prompt">
          <p>{t('comments.loginToComment') || 'Connectez-vous pour laisser un commentaire'}</p>
        </div>
      )}

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            <p>{t('comments.noComments') || 'Aucun commentaire pour le moment'}</p>
            <small>{t('comments.beFirst') || 'Soyez le premier à donner votre avis !'}</small>
          </div>
        ) : (
          comments.map((c) => {
            const texte = c.contenu || '(Aucun texte)';
            const note = c.note || 0;
            const username = c.username || 'Anonyme';
            const date = c.date_creation || c.created_at;

            return (
              <div key={c.id} className="comment">
                <div className="comment-header">
                  <div className="user-info">
                    <div className="user-avatar">
                      {username[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <strong>{username}</strong>
                      <small>{formatDate(date)}</small>
                    </div>
                  </div>
                  <div className="rating-display">
                    {renderStars(note)}
                  </div>
                </div>
                <div className="comment-body">
                  <p className="comment-text">{texte}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Comments;
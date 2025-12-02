import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './commentaireSection.css';

const CommentaireSection = ({ commentaires = [], canComment = false }) => {
  const { user } = useAuth();
  const [localComments, setLocalComments] = useState(commentaires);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !canComment) return;

    const comment = {
      id: Date.now(),
      author: user?.name || user?.nom || 'Anonyme',
      text: newComment,
      rating: rating,
      date: new Date().toISOString()
    };

    setLocalComments([comment, ...localComments]);
    setNewComment('');
    setRating(5);
  };

  return (
    <div className="commentaire-section">
      <div className="commentaire-section-header">
        <h3 className="commentaire-section-title">
          <span className="icon">💬</span>
          Commentaires
          <span className="commentaire-count">{localComments.length}</span>
        </h3>
      </div>

      {canComment ? (
        <form className="commentaire-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <div className="user-avatar">
              {user?.name?.charAt(0) || user?.nom?.charAt(0) || '👤'}
            </div>
            <div className="form-user-info">
              <div className="form-username">{user?.name || user?.nom || 'Utilisateur'}</div>
              <div className="form-hint">Partagez votre expérience</div>
            </div>
          </div>

          <div className="star-rating">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={`star-button ${star <= rating ? 'filled' : ''}`}
                onClick={() => setRating(star)}
              >
                ⭐
              </button>
            ))}
          </div>

          <textarea
            className="commentaire-textarea"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Écrivez votre commentaire..."
            rows="3"
          />

          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={!newComment.trim()}>
              Publier le commentaire
            </button>
          </div>
        </form>
      ) : (
        <div className="commentaires-empty">
          <p>Connectez-vous pour laisser un commentaire</p>
          <a href="/login" className="empty-action">Se connecter</a>
        </div>
      )}

      <div className="commentaires-list">
        {localComments.length === 0 ? (
          <div className="commentaires-empty">
            <div className="empty-icon">💬</div>
            <div className="empty-title">Aucun commentaire</div>
            <div className="empty-message">Soyez le premier à laisser un commentaire!</div>
          </div>
        ) : (
          localComments.map(comment => (
            <div key={comment.id} className="commentaire-item">
              <div className="commentaire-header">
                <div className="commentaire-author">
                  <div className="author-avatar">
                    {comment.author?.charAt(0) || '👤'}
                  </div>
                  <div className="author-info">
                    <div className="author-name">{comment.author}</div>
                    <div className="author-meta">
                      {new Date(comment.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className="commentaire-rating">
                  {'⭐'.repeat(comment.rating || 5)}
                </div>
              </div>
              <p className="commentaire-text">{comment.text}</p>
              {comment.busLine && (
                <div className="comment-tags">
                  <span className="tag">{comment.busLine}</span>
                </div>
              )}
              <div className="commentaire-footer">
                <div className="commentaire-actions">
                  <button className="action-button">
                    👍 <span className="count">{comment.likes || 0}</span>
                  </button>
                  <button className="action-button">
                    💬 Répondre
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentaireSection; // ✅ IMPORTANT : Export par défaut
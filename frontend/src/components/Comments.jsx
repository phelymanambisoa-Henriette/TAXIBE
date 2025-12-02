import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { commentService } from '../services/commentService';
import './Comments.css';

const Comments = ({ busId }) => {
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    loadComments();
  }, [busId]);

  const loadComments = async () => {
    try {
      const res = await commentService.getComments(busId);
      setComments(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    try {
      await commentService.createComment({
        bus: busId,
        text: newComment,
        rating
      });
      setNewComment('');
      setRating(5);
      loadComments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="comments">
      <h3>💬 Commentaires</h3>
      
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <div className="rating">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={n <= rating ? 'filled' : ''}
              >
                ⭐
              </button>
            ))}
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Votre avis..."
            rows="3"
          />
          <button type="submit">Publier</button>
        </form>
      ) : (
        <p>Connectez-vous pour commenter</p>
      )}

      <div className="comments-list">
        {comments.map(c => (
          <div key={c.id} className="comment">
            <div className="comment-header">
              <strong>{c.user?.username || 'Anonyme'}</strong>
              <span>{'⭐'.repeat(c.rating || 5)}</span>
            </div>
            <p>{c.text}</p>
            <small>{new Date(c.created_at).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments;
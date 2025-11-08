import React, { useState } from 'react';
import { addCommentaire } from './InteractionService';

const CommentaireSection = ({ commentaires, canComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addCommentaire({ texte: newComment });
    setNewComment('');
  };

  return (
    <div className="commentaire-section">
      <h3>Commentaires</h3>

      <ul>
        {commentaires.map((c) => (
          <li key={c.id}>
            <strong>{c.auteur}</strong> : {c.texte}
          </li>
        ))}
      </ul>

      {canComment && (
        <div className="comment-form">
          <textarea
            placeholder="Écris ton commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button onClick={handleAddComment}>Envoyer</button>
        </div>
      )}
    </div>
  );
};

export default CommentaireSection;

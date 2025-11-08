
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const Commentaires = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [comments, setComments] = useState([
    { id: 1, user: 'Alice', text: 'Le bus 202 passe souvent en retard.' },
    { id: 2, user: 'Jean', text: 'Un arrêt manque à Anosibe.' },
  ]);
  const [reply, setReply] = useState('');

  const handleReply = (id) => {
    if (!isAuthenticated) {
      alert('Connectez-vous pour répondre.');
      return;
    }
    if (reply.trim() !== '') {
      setComments(prev =>
        prev.map(c =>
          c.id === id
            ? { ...c, responses: [...(c.responses || []), { user: user.email, text: reply }] }
            : c
        )
      );
      setReply('');
    }
  };

  return (
    <div>
      <h2>Commentaires publics</h2>
      {comments.map(comment => (
        <Card key={comment.id} title={comment.user}>
          <p>{comment.text}</p>
          {comment.responses?.map((r, i) => (
            <p key={i} style={{ marginLeft: 20, color: '#555' }}>
              ↳ <strong>{r.user}:</strong> {r.text}
            </p>
          ))}
          {isAuthenticated && (
            <>
              <input
                type="text"
                placeholder="Répondre..."
                value={reply}
                onChange={e => setReply(e.target.value)}
              />
              <Button onClick={() => handleReply(comment.id)}>Envoyer</Button>
            </>
          )}
        </Card>
      ))}
    </div>
  );
};

export default Commentaires;

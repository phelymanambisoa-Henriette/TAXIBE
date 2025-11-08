import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { mockBuses } from '../services/mockData/buses';

const BusDetail = () => {
  const { id } = useParams();
  const bus = mockBuses.find(b => b.id === parseInt(id));
  const [comments, setComments] = useState([
    { id: 1, user: 'Alice', text: 'Bus ponctuel ce matin !' },
    { id: 2, user: 'Bob', text: 'Arrêt manquant sur le trajet retour.' }
  ]);
  const [newComment, setNewComment] = useState('');

  if (!bus) return <p>Bus non trouvé.</p>;

  const handleAddComment = () => {
    if (newComment.trim() !== '') {
      setComments([...comments, { id: comments.length + 1, user: 'Vous', text: newComment }]);
      setNewComment('');
    }
  };

  return (
    <div>
      <h2>{bus.name}</h2>
      <p>Trajet : {bus.trajet.depart} → {bus.trajet.arrivee}</p>

      <Card title="Arrets Aller">
        <ul>
          {bus.trajet.arrets_aller.map((a, idx) => <li key={idx}>{a}</li>)}
        </ul>
      </Card>

      <Card title="Arrets Retour">
        <ul>
          {bus.trajet.arrets_retour.map((a, idx) => <li key={idx}>{a}</li>)}
        </ul>
      </Card>

      <Card title="Commentaires">
        <ul>
          {comments.map(c => <li key={c.id}><strong>{c.user}:</strong> {c.text}</li>)}
        </ul>
        <input
          type="text"
          placeholder="Ajouter un commentaire..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          style={{ width: '100%', padding: '8px', margin: '8px 0', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <Button onClick={handleAddComment}>Envoyer</Button>
      </Card>
    </div>
  );
};

export default BusDetail;

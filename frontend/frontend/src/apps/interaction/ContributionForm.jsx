import React, { useState } from 'react';
import { addContribution } from './InteractionService';

const ContributionForm = ({ userId }) => {
  const [description, setDescription] = useState('');
  const [type, setType] = useState('nouvel_arret');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addContribution({ userId, type, description });
    setDescription('');
  };

  return (
    <div className="contribution-form">
      <h3>📝 Contribution</h3>
      <form onSubmit={handleSubmit}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="nouvel_arret">Proposer un nouvel arrêt</option>
          <option value="signalement">Signaler un arrêt inexistant</option>
          <option value="info_bus">Donner une info sur un bus</option>
        </select>
        <textarea
          placeholder="Décris ta contribution..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <button type="submit">Envoyer</button>
      </form>
    </div>
  );
};

export default ContributionForm;

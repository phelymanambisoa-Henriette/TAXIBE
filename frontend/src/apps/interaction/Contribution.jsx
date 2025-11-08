import React, { useContext, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import './Contribution.css';

const Contribution = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [form, setForm] = useState({
    type: 'nouvel_arret',
    description: '',
    ville: '',
    trajet: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Veuillez vous connecter pour contribuer.');
      return;
    }
    console.log('✅ Contribution envoyée par', user.email, form);
    alert('Merci pour votre contribution !');
    setForm({ type: 'nouvel_arret', description: '', ville: '', trajet: '' });
  };

  return (
    <div className="contribution-container">
      <h2>Contribuer à la communauté</h2>
      <form onSubmit={handleSubmit}>
        <label>Type de contribution</label>
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="nouvel_arret">➕ Ajouter un nouvel arrêt</option>
          <option value="signalement_arret">🚫 Signaler un arrêt inexistant</option>
          <option value="nouveau_trajet">🚌 Ajouter un trajet d’une autre ville</option>
        </select>

        {form.type === 'nouveau_trajet' && (
          <>
            <label>Ville concernée</label>
            <input
              name="ville"
              placeholder="Ex : Antsirabe"
              value={form.ville}
              onChange={handleChange}
              required
            />
            <label>Trajet</label>
            <input
              name="trajet"
              placeholder="Ex : Gare → Université"
              value={form.trajet}
              onChange={handleChange}
              required
            />
          </>
        )}

        <label>Description / Détails</label>
        <textarea
          name="description"
          placeholder="Donnez plus de détails..."
          value={form.description}
          onChange={handleChange}
          required
        ></textarea>

        <Button type="submit">Envoyer la contribution</Button>
      </form>
    </div>
  );
};

export default Contribution;

// src/pages/ProfileHistory.jsx
import React, { useEffect, useState } from 'react';
import historiqueService from '../services/historiqueService'; // ← ton service existant
import { useAuth } from '../contexts/AuthContext';
import './ProfileHistory.css';

const ProfileHistory = () => {
  const { isAuthenticated } = useAuth();

  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtre optionnel (période : semaine / mois / tout)
  const [periode, setPeriode] = useState('semaine');

  useEffect(() => {
    if (!isAuthenticated) return;
    loadHistory();
  }, [isAuthenticated, periode]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Appel ton service : /interaction/historiques/
      const data = await historiqueService.getSearchHistory({
        periode, // si ton backend gère ce paramètre
        limit: 50
      });

      const list = Array.isArray(data) ? data : (data.results || []);
      setHistorique(list);
    } catch (err) {
      console.error('❌ Erreur chargement historique:', err);
      setError("Impossible de charger l'historique");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette entrée de votre historique ?')) return;
    try {
      await historiqueService.deleteHistory(id);
      // Rafraîchir après suppression
      setHistorique((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('❌ Erreur suppression historique:', err);
      alert('Erreur lors de la suppression');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Effacer tout votre historique de recherches ?')) return;
    try {
      await historiqueService.clearHistory();
      setHistorique([]);
    } catch (err) {
      console.error('❌ Erreur clear historique:', err);
      alert('Erreur lors de l’effacement');
    }
  };

  const formatDate = (datetime) => {
    if (!datetime) return '';
    const d = new Date(datetime);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-history-page">
        <h2>🕓 Historique de recherches</h2>
        <p>Connectez-vous pour voir votre historique.</p>
      </div>
    );
  }

  return (
    <div className="profile-history-page">
      <h2>🕓 Historique de recherches</h2>

      {error && <div className="ph-error">{error}</div>}

      <div className="ph-toolbar">
        <div className="ph-filters">
          <label>Filtre période :</label>
          <select
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
          >
            <option value="semaine">7 derniers jours</option>
            <option value="mois">30 derniers jours</option>
            <option value="tout">Tout</option>
          </select>
        </div>

        {historique.length > 0 && (
          <button className="ph-clear-btn" onClick={handleClearAll}>
            🗑️ Effacer tout l’historique
          </button>
        )}
      </div>

      <div className="ph-card">
        {loading ? (
          <p>Chargement de l’historique...</p>
        ) : historique.length === 0 ? (
          <p>Aucune recherche enregistrée pour l’instant.</p>
        ) : (
          <ul className="ph-hist-list">
            {historique.map((h) => {
              // On essaie plusieurs noms possibles pour les champs, 
              // à adapter selon ton backend réel :
              const departNom =
                h.depart_nom ||
                h.depart_name ||
                h.departLabel ||
                h.depart ||
                '???';

              const arriveeNom =
                h.arrivee_nom ||
                h.arrivee_name ||
                h.arriveeLabel ||
                h.arrivee ||
                '???';

              const date =
                h.date_recherche ||
                h.date ||
                h.created_at;

              return (
                <li key={h.id} className="ph-hist-item">
                  <div className="ph-hist-main">
                    <span className="route">
                      {departNom} → {arriveeNom}
                    </span>
                    <span className="date">{formatDate(date)}</span>
                  </div>
                  <div className="ph-hist-actions">
                    <button
                      className="ph-delete-btn"
                      onClick={() => handleDelete(h.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProfileHistory;
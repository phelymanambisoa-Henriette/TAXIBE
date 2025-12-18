// src/pages/ProfileHistory.jsx - VERSION DEBUG HISTORIQUE
import React, { useEffect, useState } from 'react';
import historiqueService from '../services/historiqueService';
import { useAuth } from '../contexts/AuthContext';
import './ProfileHistory.css';

const ProfileHistory = () => {
  const { isAuthenticated } = useAuth();

  const [rawData, setRawData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const debugLoad = async () => {
      try {
        setError(null);
        console.log('📡 Appel historiqueService.getSearchHistory...');
        const data = await historiqueService.getSearchHistory({
          limit: 20,
          periode: 'semaine', // si ton backend le gère
        });
        console.log('✅ Données reçues depuis API:', data);
        setRawData(data);
      } catch (err) {
        console.error('❌ Erreur historique:', err);
        setError('Erreur lors du chargement de l’historique');
      }
    };

    debugLoad();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="profile-history-page">
        <h2>🕓 Historique de recherches (DEBUG)</h2>
        <p>Connectez-vous pour voir votre historique.</p>
      </div>
    );
  }

  return (
    <div className="profile-history-page">
      <h2>🕓 Historique de recherches (DEBUG)</h2>

      {error && (
        <div className="ph-error">
          {error}
        </div>
      )}

      {!rawData ? (
        <p>Chargement ou pas encore de données...</p>
      ) : (
        <div>
          <h3>📦 Données brutes renvoyées par l’API :</h3>
          <pre
            style={{
              background: '#f3f4f6',
              padding: '12px',
              borderRadius: '8px',
              maxHeight: '500px',
              overflow: 'auto',
              fontSize: '12px',
            }}
          >
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ProfileHistory;
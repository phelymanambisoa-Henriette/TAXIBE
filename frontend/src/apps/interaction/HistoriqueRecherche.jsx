import React from 'react';

const HistoriqueRecherche = ({ historique = [] }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="historique-recherche">
      <h3>📊 Historique de recherche</h3>
      {historique.length === 0 ? (
        <p className="empty-state">Aucune recherche récente</p>
      ) : (
        <ul>
          {historique.map(item => (
            <li key={item.id}>
              <span className="search-query">{item.query}</span>
              <span className="search-date">{formatDate(item.date)}</span>
              <span className="search-type">{item.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HistoriqueRecherche;
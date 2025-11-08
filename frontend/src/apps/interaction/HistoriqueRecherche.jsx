import React from 'react';

const HistoriqueRecherche = ({ historique }) => {
  return (
    <div className="historique-section">
      <h3>🕓 Historique de recherche</h3>
      <ul>
        {historique.map((item) => (
          <li key={item.id}>
            <strong>{item.terme}</strong> – {item.date}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HistoriqueRecherche;

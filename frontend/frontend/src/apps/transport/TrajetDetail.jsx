import React from 'react';

const TrajetDetail = ({ trajet }) => {
  return (
    <div className="trajet-detail">
      <h3>Trajet : {trajet.nom}</h3>
      <p>
        <strong>Départ :</strong> {trajet.depart.nom} <br />
        <strong>Arrivée :</strong> {trajet.arrivee.nom}
      </p>

      <h4>🚏 Arrêts (Aller)</h4>
      <ol>
        {trajet.arrets_aller.map((a) => (
          <li key={a.id}>{a.nom}</li>
        ))}
      </ol>

      <h4>↩️ Arrêts (Retour)</h4>
      <ol>
        {trajet.arrets_retour.map((a) => (
          <li key={a.id}>{a.nom}</li>
        ))}
      </ol>
    </div>
  );
};

export default TrajetDetail;

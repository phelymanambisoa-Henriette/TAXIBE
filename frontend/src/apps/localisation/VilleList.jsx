import React from 'react';

const VilleList = ({ villes, onSelectVille }) => {
  return (
    <div className="ville-list">
      <h3>Villes disponibles</h3>
      <ul>
        {villes.map((ville) => (
          <li key={ville.id} onClick={() => onSelectVille(ville)}>
            {ville.nom}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VilleList;

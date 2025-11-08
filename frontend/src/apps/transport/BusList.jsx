import React from 'react';
import Card from '../../components/ui/Card';

const BusList = ({ buses, onSelectBus }) => {
  if (!buses.length) return <p>Aucun bus trouvé.</p>;

  return (
    <div className="bus-list">
      {buses.map((bus) => (
        <Card key={bus.id} onClick={() => onSelectBus(bus)}>
          <h3>{bus.nom}</h3>
          <p>Trajet : {bus.trajet_nom}</p>
          <p>Ville : {bus.ville_nom}</p>
        </Card>
      ))}
    </div>
  );
};

export default BusList;

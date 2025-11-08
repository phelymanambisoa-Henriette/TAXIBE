import React, { useState, useEffect } from 'react';
import BusList from './BusList';
import TrajetDetail from './TrajetDetail';
import { getBuses, getTrajetDetails } from './TransportService';
import './transport.css';

const Transport = () => {
  const [buses, setBuses] = useState([]);
  const [selectedTrajet, setSelectedTrajet] = useState(null);

  useEffect(() => {
    getBuses().then(setBuses);
  }, []);

  const handleSelectBus = async (bus) => {
    const trajet = await getTrajetDetails(bus.trajet_id);
    setSelectedTrajet(trajet);
  };

  return (
    <div className="transport-container">
      <h2>🚍 Liste des bus disponibles</h2>

      <div className="transport-content">
        <BusList buses={buses} onSelectBus={handleSelectBus} />
        {selectedTrajet && <TrajetDetail trajet={selectedTrajet} />}
      </div>
    </div>
  );
};

export default Transport;

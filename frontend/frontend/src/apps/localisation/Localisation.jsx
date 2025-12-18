import React, { useEffect, useState } from 'react';
import VilleList from './VilleList';
import ArretMap from './ArretMap';
import { getVilles, getArrets } from './LocalisationService';
import './localisation.css';

const Localisation = () => {
  const [villes, setVilles] = useState([]);
  const [selectedVille, setSelectedVille] = useState(null);
  const [arrets, setArrets] = useState([]);

  useEffect(() => {
    getVilles().then(setVilles);
  }, []);

  useEffect(() => {
    if (selectedVille) {
      getArrets(selectedVille.id).then(setArrets);
    }
  }, [selectedVille]);

  return (
    <div className="localisation-container">
      <h2>🗺️ Localisation des arrêts</h2>
      <div className="localisation-content">
        <VilleList villes={villes} onSelectVille={setSelectedVille} />
        <ArretMap arrets={arrets} selectedVille={selectedVille} />
      </div>
    </div>
  );
};

export default Localisation;

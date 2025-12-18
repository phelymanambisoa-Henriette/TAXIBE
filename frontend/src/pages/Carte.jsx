// src/pages/Carte.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import CarteInteractive from '../components/Carte/CarteInteractive';
import './Carte.css';

const Carte = () => {
  const navigate = useNavigate();

  return (
    <div className="carte-page-wrapper">
      {/* Bouton retour */}
      <button 
        className="btn-back-carte"
        onClick={() => navigate(-1)}
        title="Retour"
      >
        <FaArrowLeft /> Retour
      </button>
      
      <CarteInteractive />
    </div>
  );
};

export default Carte;
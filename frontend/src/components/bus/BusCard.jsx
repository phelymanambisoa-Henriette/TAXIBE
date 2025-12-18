// src/components/Bus/BusCard.jsx - VERSION AVEC TRAJETS
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BusCard.css';

const BusCard = ({ bus }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/bus/${bus.id}`);
  };

  // Extraire les trajets
  const trajetAller = bus.trajets?.find(t => t.type === 'Aller');
  const trajetRetour = bus.trajets?.find(t => t.type === 'Retour');
  const hasTrajets = bus.trajets && bus.trajets.length > 0;

  return (
    <div className="bus-card" onClick={handleClick}>
      {/* Header avec numéro */}
      <div className="bus-card-header">
        <div 
          className="bus-number"
          style={{ backgroundColor: bus.couleur || '#01c6b2' }}
        >
          {bus.numero}
        </div>
        <div className="bus-status">
          <span className={`status-indicator ${bus.status === 'Actif' ? 'active' : 'inactive'}`}>
            {bus.status === 'Actif' ? '● En service' : '○ Hors service'}
          </span>
        </div>
      </div>

      {/* Route principale */}
      <div className="bus-card-body">
        <div className="bus-route">
          <div className="route-point">
            <span className="label">De:</span>
            <span className="value">{bus.primus || 'Départ'}</span>
          </div>
          <div className="route-arrow">→</div>
          <div className="route-point">
            <span className="label">À:</span>
            <span className="value">{bus.terminus || 'Arrivée'}</span>
          </div>
        </div>

        {/* Section Trajets Aller/Retour */}
        {hasTrajets ? (
          <div className="trajets-section">
            <h4 className="trajets-title">Trajets disponibles :</h4>
            
            <div className="trajets-list">
              {/* Trajet Aller */}
              {trajetAller ? (
                <div className="trajet-item aller">
                  <div className="trajet-icon">↗</div>
                  <div className="trajet-info">
                    <div className="trajet-type">Aller</div>
                    <div className="trajet-details">
                      <span className="trajet-stops">
                        {trajetAller.nb_arrets} arrêts
                      </span>
                      {trajetAller.depart && trajetAller.arrivee && (
                        <span className="trajet-route">
                          {trajetAller.depart} → {trajetAller.arrivee}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="trajet-item missing">
                  <div className="trajet-icon">↗</div>
                  <span>Aller non disponible</span>
                </div>
              )}

              {/* Trajet Retour */}
              {trajetRetour ? (
                <div className="trajet-item retour">
                  <div className="trajet-icon">↙</div>
                  <div className="trajet-info">
                    <div className="trajet-type">Retour</div>
                    <div className="trajet-details">
                      <span className="trajet-stops">
                        {trajetRetour.nb_arrets} arrêts
                      </span>
                      {trajetRetour.depart && trajetRetour.arrivee && (
                        <span className="trajet-route">
                          {trajetRetour.depart} → {trajetRetour.arrivee}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="trajet-item missing">
                  <div className="trajet-icon">↙</div>
                  <span>Retour non disponible</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-trajets">
            <span>⚠️ Aucun trajet configuré</span>
          </div>
        )}

        {/* Prix */}
        <div className="bus-footer">
          <div className="bus-price">
            <span className="price-label">Tarif :</span>
            <span className="price-value">{bus.frais} Ar</span>
          </div>
          <button className="view-btn">
            Voir détails →
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusCard;
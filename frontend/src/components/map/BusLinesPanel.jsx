// src/components/map/BusLinesPanel.jsx
import React, { useState, useEffect } from 'react';
import trajetService from '../../services/trajetService';
import LoadingSpinner from '../common/LoadingSpinner';
import './BusLinesPanel.css';

const BusLinesPanel = ({ 
  onSelectBus, 
  selectedBusId, 
  onClose,
  visibleDirections,
  onToggleDirection 
}) => {
  const [busLines, setBusLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadBusLines = async () => {
      try {
        setLoading(true);
        const data = await trajetService.getAllBusTrajets();
        setBusLines(data);
        setError(null);
      } catch (err) {
        console.error('❌ Erreur chargement lignes:', err);
        setError('Impossible de charger les lignes');
      } finally {
        setLoading(false);
      }
    };

    loadBusLines();
  }, []);

  const filteredLines = busLines.filter(bus => 
    bus.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.primus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.terminus?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bus-lines-panel">
        <div className="panel-header">
          <h3>🚌 Lignes de Bus</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="panel-loading">
          <LoadingSpinner size="small" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bus-lines-panel">
      <div className="panel-header">
        <h3>🚌 Lignes de Bus</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {/* Filtres de direction */}
      <div className="direction-filters">
        <label className="direction-checkbox">
          <input
            type="checkbox"
            checked={visibleDirections.aller}
            onChange={() => onToggleDirection('aller')}
          />
          <span className="checkmark aller"></span>
          Aller
        </label>
        <label className="direction-checkbox">
          <input
            type="checkbox"
            checked={visibleDirections.retour}
            onChange={() => onToggleDirection('retour')}
          />
          <span className="checkmark retour"></span>
          Retour
        </label>
      </div>

      {/* Recherche */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Rechercher une ligne..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="clear-search" onClick={() => setSearchTerm('')}>
            ✕
          </button>
        )}
      </div>

      {error && <div className="panel-error">{error}</div>}

      {/* Liste des lignes */}
      <div className="bus-lines-list">
        {filteredLines.map(bus => (
          <div
            key={bus.id}
            className={`bus-line-item ${selectedBusId === bus.id ? 'selected' : ''}`}
            onClick={() => onSelectBus(bus)}
          >
            <div 
              className="bus-badge"
              style={{ backgroundColor: bus.couleur }}
            >
              {bus.numero}
            </div>
            <div className="bus-info">
              <div className="bus-route">
                {bus.primus} → {bus.terminus}
              </div>
              <div className="bus-details">
                <span className="bus-price">{bus.frais} Ar</span>
                {bus.trajets && bus.trajets.length > 0 && (
                  <span className="bus-stops">
                    {bus.trajets[0].nb_arrets} arrêts
                  </span>
                )}
              </div>
            </div>
            <div className="bus-select-icon">
              {selectedBusId === bus.id ? '✓' : '→'}
            </div>
          </div>
        ))}

        {filteredLines.length === 0 && (
          <div className="no-results">
            Aucune ligne trouvée
          </div>
        )}
      </div>
    </div>
  );
};

export default BusLinesPanel;
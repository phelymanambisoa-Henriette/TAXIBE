// src/pages/Search.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transportService } from '../services/transportService';
import { localisationService } from '../services/localisationService';
import { useItineraire } from '../contexts/ItineraireContext';
import { 
  FaSearch, 
  FaExchangeAlt, 
  FaMapMarkerAlt, 
  FaRoute, 
  FaMap, 
  FaArrowRight 
} from 'react-icons/fa';
import './Search.css';

const Search = () => {
  const [arrets, setArrets] = useState([]);
  const [departId, setDepartId] = useState('');
  const [arriveeId, setArriveeId] = useState('');
  const [resultats, setResultats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingArrets, setLoadingArrets] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { selectionnerItineraire } = useItineraire();

  useEffect(() => {
    loadArrets();
  }, []);

  const loadArrets = async () => {
    setLoadingArrets(true);
    try {
      const response = await localisationService.getAllArrets();
      const data = response.data;
      setArrets(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error('Erreur chargement arrêts:', err);
      setError('Impossible de charger les arrêts.');
    } finally {
      setLoadingArrets(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setResultats(null);

    if (!departId || !arriveeId) {
      return setError('Sélectionnez départ et arrivée');
    }
    if (departId === arriveeId) {
      return setError('Le départ et l\'arrivée doivent être différents');
    }

    setLoading(true);
    try {
      // ✅ L'historique est enregistré automatiquement côté backend
      const data = await transportService.rechercheItineraire(departId, arriveeId);
      setResultats(data);
    } catch (err) {
      console.error('Erreur recherche:', err);
      setError('Aucun itinéraire trouvé ou erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleInverser = () => {
    setDepartId(arriveeId);
    setArriveeId(departId);
  };

  const handleVoirSurCarte = (itineraire) => {
    selectionnerItineraire(itineraire, resultats.depart, resultats.arrivee);
    navigate('/carte');
  };

  return (
    <div className="search-page">
      <div className="search-container">
        
        {/* HEADER */}
        <div className="page-header">
          <h1>Planifiez votre <span className="text-highlight">Trajet</span></h1>
          <p>Trouvez la meilleure connexion TaxiBe.</p>
        </div>

        {/* FORMULAIRE */}
        <div className="search-card">
          <form onSubmit={handleSearch}>
            <div className="inputs-row">
              
              {/* Départ */}
              <div className="input-group">
                <label><FaMapMarkerAlt className="icon-label start" /> DÉPART</label>
                <div className="select-wrapper">
                  <select 
                    value={departId} 
                    onChange={(e) => setDepartId(e.target.value)} 
                    disabled={loadingArrets}
                    required
                  >
                    <option value="">
                      {loadingArrets ? 'Chargement...' : 'Choisir l\'arrêt de départ'}
                    </option>
                    {arrets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nomArret || a.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bouton Inverser */}
              <button type="button" className="btn-swap" onClick={handleInverser}>
                <FaExchangeAlt />
              </button>

              {/* Arrivée */}
              <div className="input-group">
                <label><FaMapMarkerAlt className="icon-label end" /> ARRIVÉE</label>
                <div className="select-wrapper">
                  <select 
                    value={arriveeId} 
                    onChange={(e) => setArriveeId(e.target.value)} 
                    disabled={loadingArrets}
                    required
                  >
                    <option value="">
                      {loadingArrets ? 'Chargement...' : 'Choisir l\'arrêt d\'arrivée'}
                    </option>
                    {arrets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nomArret || a.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button 
              type="submit" 
              className="btn-submit-search" 
              disabled={loading || loadingArrets}
            >
              {loading ? (
                <span className="loader"></span>
              ) : (
                <><FaSearch /> Rechercher l'itinéraire</>
              )}
            </button>
          </form>
        </div>

        {/* RÉSULTATS */}
        {resultats && (
          <div className="results-section">
            <div className="results-summary">
              <h2>{resultats.total} Résultat{resultats.total > 1 ? 's' : ''}</h2>
              <div className="summary-route">
                <span className="badge-loc">{resultats.depart?.nom}</span> 
                <FaArrowRight className="arrow-icon" /> 
                <span className="badge-loc">{resultats.arrivee?.nom}</span>
              </div>
            </div>

            {/* Itinéraires Directs */}
            {resultats.itineraires_directs?.map((itineraire, index) => (
              <div key={`direct-${index}`} className="result-card direct">
                <div className="card-left">
                  <div className="bus-badge">{itineraire.bus?.numero}</div>
                  <div className="price-tag">{itineraire.bus?.frais || 600} Ar</div>
                </div>
                
                <div className="card-middle">
                  <div className="timeline-info">
                    <div className="timeline-line"></div>
                    <div className="timeline-point start"></div>
                    <div className="timeline-point end"></div>
                  </div>
                  <div className="route-text">
                    <div className="stop-name">{resultats.depart?.nom}</div>
                    <div className="duration-info">
                      <FaRoute /> {itineraire.nb_arrets} arrêts intermédiaires
                    </div>
                    <div className="stop-name">{resultats.arrivee?.nom}</div>
                  </div>
                </div>

                <div className="card-right">
                  <button className="btn-map-view" onClick={() => handleVoirSurCarte(itineraire)}>
                    <FaMap /> Carte
                  </button>
                </div>
              </div>
            ))}

            {/* Correspondances */}
            {resultats.itineraires_correspondances?.map((itineraire, index) => (
              <div key={`corr-${index}`} className="result-card correspondance">
                <div className="card-badge-top">Correspondance</div>
                
                <div className="corr-grid">
                  <div className="corr-leg">
                    <div className="bus-badge small">{itineraire.trajet1?.bus?.numero}</div>
                    <div className="leg-details">
                      <span>{itineraire.trajet1?.arrets?.[0]?.nom}</span>
                      <FaArrowRight size={10} color="#999"/>
                      <span>{itineraire.arret_correspondance?.nom}</span>
                    </div>
                  </div>

                  <div className="corr-icon">
                    <FaExchangeAlt />
                  </div>

                  <div className="corr-leg">
                    <div className="bus-badge small">{itineraire.trajet2?.bus?.numero}</div>
                    <div className="leg-details">
                      <span>{itineraire.arret_correspondance?.nom}</span>
                      <FaArrowRight size={10} color="#999"/>
                      <span>{itineraire.trajet2?.arrets?.[itineraire.trajet2?.arrets?.length - 1]?.nom}</span>
                    </div>
                  </div>
                </div>

                <div className="card-footer-corr">
                  <div className="total-price">Total: <b>{itineraire.frais_total} Ar</b></div>
                  <button className="btn-map-view small" onClick={() => handleVoirSurCarte(itineraire)}>
                    <FaMap /> Voir le trajet
                  </button>
                </div>
              </div>
            ))}

            {resultats.total === 0 && (
              <div className="empty-results">
                <div className="emoji">😔</div>
                <h3>Aucun trajet trouvé</h3>
                <p>Essayez de sélectionner des arrêts plus proches.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
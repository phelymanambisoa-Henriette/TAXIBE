// src/pages/Search.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation as useRouterLocation } from 'react-router-dom';

import { useLocation as useLocationContext } from '../contexts/LocationContext';
import localisationService from '../services/localisationService';
import historiqueService from '../services/historiqueService';   // ← AJOUT
import { useAuth } from '../contexts/AuthContext';                // ← AJOUT

import { HiLocationMarker, HiSearch, HiSwitchHorizontal } from 'react-icons/hi';
import { FaMapMarkerAlt, FaRoute, FaMap } from 'react-icons/fa';

import './Search.css';

const Search = () => {
  const routerLocation = useRouterLocation();
  const { userLocation } = useLocationContext();
  const { isAuthenticated } = useAuth();   // ← AJOUT

  const [arrets, setArrets] = useState([]);
  const [loadingArrets, setLoadingArrets] = useState(true);

  const [departUseCurrentLocation, setDepartUseCurrentLocation] = useState(false);
  const [departArret, setDepartArret] = useState(null);
  const [arriveeArret, setArriveeArret] = useState(null);

  const [departQuery, setDepartQuery] = useState('');
  const [arriveeQuery, setArriveeQuery] = useState('');
  const [departResults, setDepartResults] = useState([]);
  const [arriveeResults, setArriveeResults] = useState([]);

  const [itineraire, setItineraire] = useState(null);
  const [loadingItineraire, setLoadingItineraire] = useState(false);
  const [errorItineraire, setErrorItineraire] = useState(null);

  // Charger tous les arrêts
  useEffect(() => {
    const loadArrets = async () => {
      setLoadingArrets(true);
      try {
        const data = await localisationService.getAllArrets();
        const list = Array.isArray(data) ? data : data.results || [];
        setArrets(list);
      } catch (err) {
        console.error('❌ Erreur chargement arrêts (Search):', err);
      } finally {
        setLoadingArrets(false);
      }
    };
    loadArrets();
  }, []);

  // Pré-remplir départ/arrivée depuis les query params (?depart=ID&arrivee=ID)
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const departId = params.get('depart');
    const arriveeId = params.get('arrivee');

    if (arrets.length === 0) return;

    if (departId) {
      const a = arrets.find((x) => String(x.id) === String(departId));
      if (a) {
        setDepartArret(a);
        setDepartQuery(a.nomArret || a.nom || '');
      }
    }

    if (arriveeId) {
      const a = arrets.find((x) => String(x.id) === String(arriveeId));
      if (a) {
        setArriveeArret(a);
        setArriveeQuery(a.nomArret || a.nom || '');
      }
    }
  }, [routerLocation.search, arrets]);

  // Recherche locale sur les arrêts
  const filterArrets = (query) => {
    if (!query || query.length < 2) return [];
    const lower = query.toLowerCase();
    return arrets
      .filter(a =>
        (a.nomArret || a.nom || '').toLowerCase().includes(lower)
      )
      .slice(0, 12);
  };

  useEffect(() => {
    setDepartResults(filterArrets(departQuery));
  }, [departQuery, arrets]);

  useEffect(() => {
    setArriveeResults(filterArrets(arriveeQuery));
  }, [arriveeQuery, arrets]);

  const canSearchItineraire = useMemo(() => {
    if (departUseCurrentLocation) {
      return !!userLocation && !!arriveeArret;
    }
    return !!departArret && !!arriveeArret;
  }, [departUseCurrentLocation, userLocation, departArret, arriveeArret]);

  const handleUseCurrentLocationAsDepart = () => {
    setDepartUseCurrentLocation(true);
    setDepartArret(null);
    setDepartQuery('');
    setDepartResults([]);
    setItineraire(null);
    setErrorItineraire(null);
  };

  const handleSelectDepart = (arret) => {
    setDepartUseCurrentLocation(false);
    setDepartArret(arret);
    setDepartQuery(arret.nomArret || arret.nom || '');
    setDepartResults([]);
    setItineraire(null);
    setErrorItineraire(null);
  };

  const handleSelectArrivee = (arret) => {
    setArriveeArret(arret);
    setArriveeQuery(arret.nomArret || arret.nom || '');
    setArriveeResults([]);
    setItineraire(null);
    setErrorItineraire(null);
  };

  const handleSwap = () => {
    if (departUseCurrentLocation) return;
    const d = departArret;
    const a = arriveeArret;
    setDepartArret(a);
    setArriveeArret(d);
    setDepartQuery(a ? (a.nomArret || a.nom || '') : '');
    setArriveeQuery(d ? (d.nomArret || d.nom || '') : '');
    setItineraire(null);
    setErrorItineraire(null);
  };

  const handleSearchItineraire = async () => {
    if (!canSearchItineraire) return;

    setLoadingItineraire(true);
    setErrorItineraire(null);
    setItineraire(null);

    try {
      let data;
      if (departUseCurrentLocation) {
        if (!userLocation) {
          setErrorItineraire('Position actuelle non disponible.');
          return;
        }
        data = await localisationService.findItineraireFromPosition(
          userLocation.lat,
          userLocation.lng,
          arriveeArret.id
        );
      } else {
        data = await localisationService.findItineraire(
          departArret.id,
          arriveeArret.id
        );
      }

      if (data && data.found && data.options && data.options.length > 0) {
        setItineraire(data);

        // 📝 Enregistrer l'historique côté backend (uniquement si départ = arrêt)
        if (!departUseCurrentLocation && departArret && arriveeArret && isAuthenticated) {
          try {
            await historiqueService.createHistory(departArret.id, arriveeArret.id);
          } catch (e) {
            console.warn('Enregistrement historique échoué (non bloquant):', e);
          }
        }

      } else {
        setErrorItineraire("Aucun itinéraire direct trouvé pour cette combinaison.");
      }

    } catch (err) {
      console.error('❌ Erreur recherche itinéraire:', err);
      setErrorItineraire("Aucun itinéraire trouvé ou erreur lors de la recherche.");
    } finally {
      setLoadingItineraire(false);
    }
  };

  const handleVoirSurCarte = () => {
    window.location.href = '/carte';
  };

  return (
    <div className="search-page">
      <div className="search-container">
        
        {/* HEADER */}
        <div className="page-header">
          <h1>
            <FaRoute /> <span className="text-highlight">Itinéraire TaxiBe</span>
          </h1>
          <p>
            Choisissez un départ et une arrivée pour trouver un trajet en taxi-be.
          </p>
        </div>

        {/* FORMULAIRE */}
        <div className="search-card">
          <div className="inputs-row">
            {/* Départ */}
            <div className="input-group">
              <label>
                <span className="icon-label start"><HiLocationMarker /></span>
                DÉPART
              </label>

              <div className="depart-options">
                <button
                  type="button"
                  className={`depart-option-btn ${departUseCurrentLocation ? 'active' : ''}`}
                  onClick={handleUseCurrentLocationAsDepart}
                  disabled={!userLocation}
                >
                  <HiLocationMarker /> Ma position
                </button>
                <button
                  type="button"
                  className={`depart-option-btn ${!departUseCurrentLocation ? 'active' : ''}`}
                  onClick={() => setDepartUseCurrentLocation(false)}
                >
                  <FaMapMarkerAlt /> Un arrêt
                </button>
              </div>

              {!departUseCurrentLocation && (
                <div className="search-input-wrapper">
                  <HiSearch className="input-icon" />
                  <input
                    type="text"
                    value={departQuery}
                    onChange={(e) => {
                      setDepartQuery(e.target.value);
                      setDepartArret(null);
                    }}
                    placeholder="Saisissez un arrêt de départ..."
                  />
                  {departResults.length > 0 && (
                    <div className="search-results-dropdown">
                      {departResults.map((a) => (
                        <div
                          key={a.id}
                          className="search-result-item"
                          onClick={() => handleSelectDepart(a)}
                        >
                          <FaMapMarkerAlt /> {a.nomArret || a.nom}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {departUseCurrentLocation && !userLocation && (
                <p className="location-warning">
                  Activez la géolocalisation sur la page d’accueil pour utiliser cette option.
                </p>
              )}

              {!departUseCurrentLocation && departArret && (
                <p className="selected-info">
                  Départ : <strong>{departArret.nomArret || departArret.nom}</strong>
                </p>
              )}
            </div>

            {/* Bouton Swap */}
            <button 
              type="button" 
              className="btn-swap" 
              onClick={handleSwap}
              title="Inverser départ et arrivée"
            >
              <HiSwitchHorizontal />
            </button>

            {/* Arrivée */}
            <div className="input-group">
              <label>
                <span className="icon-label end"><FaMapMarkerAlt /></span>
                ARRIVÉE
              </label>

              <div className="search-input-wrapper">
                <HiSearch className="input-icon" />
                <input
                  type="text"
                  value={arriveeQuery}
                  onChange={(e) => {
                    setArriveeQuery(e.target.value);
                    setArriveeArret(null);
                  }}
                  placeholder="Saisissez un arrêt d'arrivée..."
                />
                {arriveeResults.length > 0 && (
                  <div className="search-results-dropdown">
                    {arriveeResults.map((a) => (
                      <div
                        key={a.id}
                        className="search-result-item"
                        onClick={() => handleSelectArrivee(a)}
                      >
                        <FaMapMarkerAlt /> {a.nomArret || a.nom}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {arriveeArret && (
                <p className="selected-info">
                  Arrivée : <strong>{arriveeArret.nomArret || arriveeArret.nom}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Bouton Rechercher */}
          <button
            type="button"
            className="btn-submit-search"
            onClick={handleSearchItineraire}
            disabled={!canSearchItineraire || loadingItineraire || loadingArrets}
          >
            {loadingItineraire ? 'Recherche en cours...' : (
              <>
                <HiSearch /> Rechercher un itinéraire
              </>
            )}
          </button>

          {/* Erreur globale */}
          {errorItineraire && (
            <div className="error-msg">
              {errorItineraire}
            </div>
          )}
        </div>

        {/* RÉSULTATS SIMPLIFIÉS */}
        {itineraire && itineraire.options && itineraire.options.length > 0 && (
          <div className="results-container">
            <div className="results-header">
              <h2>Résultats d’itinéraire</h2>
              <p className="results-subtitle">
                {departUseCurrentLocation ? 'Votre position' : (itineraire.depart?.nom || 'Départ')}
                {' '}→{' '}
                {itineraire.arrivee?.nom || 'Arrivée'}
              </p>
            </div>

            <div className="options-list">
              {itineraire.options.map((opt) => (
                <div key={opt.id} className="result-card">
                  <div className="card-left">
                    <div className="bus-badge">
                      {opt.bus?.numero || opt.trajet1?.bus?.numero || 'Bus'}
                    </div>
                    {opt.frais_total || opt.frais ? (
                      <div className="price-tag">
                        {(opt.frais_total || opt.frais)} Ar
                      </div>
                    ) : null}
                  </div>

                  <div className="card-middle">
                    <span className="stop-name">
                      {itineraire.depart?.nom || 'Départ'} → {itineraire.arrivee?.nom || 'Arrivée'}
                    </span>
                    <span className="duration-info">
                      {opt.nb_arrets_total || opt.nb_arrets
                        ? `${opt.nb_arrets_total || opt.nb_arrets} arrêts`
                        : 'Nombre d’arrêts non disponible'}
                    </span>
                  </div>

                  <div className="card-right">
                    <button 
                      className="btn-map-view"
                      onClick={handleVoirSurCarte}
                    >
                      <FaMap /> Voir sur la carte
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CAS: Aucun itinéraire & pas d’erreur serveur → mini message simple */}
        {(!itineraire || (itineraire && (!itineraire.options || itineraire.options.length === 0))) 
          && !loadingItineraire 
          && !errorItineraire 
          && (departArret || departUseCurrentLocation) 
          && arriveeArret && (
          <div className="results-container">
            <div className="empty-results">
              <span className="emoji">🤷‍♂️</span>
              <p>Aucun itinéraire direct trouvé entre ces deux arrêts.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>
                Essayez de :
              </p>
              <ul style={{ fontSize: '0.85rem', color: '#4B5563', marginTop: '6px', listStyle: 'disc', paddingLeft: '20px' }}>
                <li>Changer d’arrêt de départ ou d’arrivée.</li>
                <li>Vérifier les arrêts proches sur la page "À proximité".</li>
                <li>Explorer la carte pour trouver une correspondance manuelle.</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Search;
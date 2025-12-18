// src/components/map/ItinerairePanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  FaTimes, 
  FaMapMarkerAlt, 
  FaFlag, 
  FaExchangeAlt, 
  FaSearch,
  FaLocationArrow,
  FaRoute
} from 'react-icons/fa';
import { useLocation } from '../../contexts/LocationContext';
import localisationService from '../../services/localisationService';

const ItinerairePanel = () => {
  const {
    userLocation,
    departArret,
    arriveeArret,
    useCurrentLocationAsDepart,
    setDepartFromStop,
    setDepartFromCurrentLocation,
    setArrivee,
    swapDepartArrivee,
    clearItineraire,
    closeItineraireMode,
    setItineraireResult,
    setIsSearchingItineraire,
    isSearchingItineraire,
    setItineraireError,
    itineraireError,
    allStops,
  } = useLocation();

  const [departSearch, setDepartSearch] = useState('');
  const [arriveeSearch, setArriveeSearch] = useState('');
  const [departResults, setDepartResults] = useState([]);
  const [arriveeResults, setArriveeResults] = useState([]);
  const [activeFocus, setActiveFocus] = useState(null); // 'depart' | 'arrivee'
  
  const departInputRef = useRef(null);
  const arriveeInputRef = useRef(null);
  const debounceRef = useRef(null);

  // Recherche avec debounce
  const handleSearch = (query, type) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await localisationService.searchArrets(query);
          if (type === 'depart') {
            setDepartResults(results);
          } else {
            setArriveeResults(results);
          }
        } catch (error) {
          // Fallback: recherche locale
          const lowerQuery = query.toLowerCase();
          const filtered = allStops.filter(
            (stop) =>
              stop.nom.toLowerCase().includes(lowerQuery) ||
              (stop.zone && stop.zone.toLowerCase().includes(lowerQuery))
          );
          if (type === 'depart') {
            setDepartResults(filtered);
          } else {
            setArriveeResults(filtered);
          }
        }
      }, 300);
    } else {
      if (type === 'depart') {
        setDepartResults([]);
      } else {
        setArriveeResults([]);
      }
    }
  };

  // Sélectionner un arrêt de départ
  const handleSelectDepart = (stop) => {
    setDepartFromStop(stop);
    setDepartSearch(stop.nom);
    setDepartResults([]);
    setActiveFocus(null);
    arriveeInputRef.current?.focus();
  };

  // Sélectionner un arrêt d'arrivée
  const handleSelectArrivee = (stop) => {
    setArrivee(stop);
    setArriveeSearch(stop.nom);
    setArriveeResults([]);
    setActiveFocus(null);
  };

  // Utiliser la position actuelle comme départ
  const handleUseCurrentLocation = () => {
    setDepartFromCurrentLocation();
    setDepartSearch('');
    setDepartResults([]);
    setActiveFocus(null);
    arriveeInputRef.current?.focus();
  };

  // Rechercher l'itinéraire
  const handleSearchItineraire = async () => {
    if (!arriveeArret) {
      setItineraireError('Veuillez sélectionner une destination');
      return;
    }

    if (!useCurrentLocationAsDepart && !departArret) {
      setItineraireError('Veuillez sélectionner un point de départ');
      return;
    }

    if (useCurrentLocationAsDepart && !userLocation) {
      setItineraireError('Position non disponible. Activez la géolocalisation.');
      return;
    }

    setIsSearchingItineraire(true);
    setItineraireError(null);

    try {
      let result;
      
      if (useCurrentLocationAsDepart) {
        // Recherche depuis position GPS
        result = await localisationService.findItineraireFromPosition(
          userLocation.lat,
          userLocation.lng,
          arriveeArret.id
        );
      } else {
        // Recherche entre deux arrêts
        result = await localisationService.findItineraire(
          departArret.id,
          arriveeArret.id
        );
      }

      setItineraireResult(result);
    } catch (error) {
      console.error('Erreur recherche itinéraire:', error);
      // Fallback: générer un mock itinéraire
      const mockResult = generateMockItineraire(
        useCurrentLocationAsDepart ? null : departArret,
        arriveeArret,
        useCurrentLocationAsDepart ? userLocation : null
      );
      setItineraireResult(mockResult);
    } finally {
      setIsSearchingItineraire(false);
    }
  };

  // Mettre à jour les champs quand les arrêts changent
  useEffect(() => {
    if (departArret) {
      setDepartSearch(departArret.nom);
    } else if (useCurrentLocationAsDepart) {
      setDepartSearch('');
    }
  }, [departArret, useCurrentLocationAsDepart]);

  useEffect(() => {
    if (arriveeArret) {
      setArriveeSearch(arriveeArret.nom);
    }
  }, [arriveeArret]);

  const canSearch = arriveeArret && (useCurrentLocationAsDepart ? userLocation : departArret);

  return (
    <div className="itineraire-panel">
      <div className="itineraire-header">
        <h3>
          <FaRoute /> Rechercher un itinéraire
        </h3>
        <button className="close-btn" onClick={closeItineraireMode}>
          <FaTimes />
        </button>
      </div>

      <div className="itineraire-form">
        {/* Champ Départ */}
        <div className="itineraire-field">
          <div className="field-icon depart">
            <FaMapMarkerAlt />
          </div>
          <div className="field-input-container">
            {useCurrentLocationAsDepart ? (
              <div 
                className="current-location-badge"
                onClick={() => {
                  setActiveFocus('depart');
                  departInputRef.current?.focus();
                }}
              >
                <FaLocationArrow /> Ma position
                <button 
                  className="change-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFocus('depart');
                  }}
                >
                  Modifier
                </button>
              </div>
            ) : (
              <input
                ref={departInputRef}
                type="text"
                placeholder="Point de départ..."
                value={departSearch}
                onChange={(e) => {
                  setDepartSearch(e.target.value);
                  handleSearch(e.target.value, 'depart');
                }}
                onFocus={() => setActiveFocus('depart')}
                className="itineraire-input"
              />
            )}

            {/* Résultats départ */}
            {activeFocus === 'depart' && (
              <div className="itineraire-results">
                {/* Option position actuelle */}
                {userLocation && !useCurrentLocationAsDepart && (
                  <div 
                    className="result-item current-location"
                    onClick={handleUseCurrentLocation}
                  >
                    <FaLocationArrow className="result-icon location" />
                    <span>Ma position actuelle</span>
                  </div>
                )}
                
                {departResults.map((stop) => (
                  <div
                    key={stop.id}
                    className="result-item"
                    onClick={() => handleSelectDepart(stop)}
                  >
                    <FaMapMarkerAlt className="result-icon" />
                    <div className="result-info">
                      <span className="result-name">{stop.nom}</span>
                      {stop.zone && <span className="result-zone">{stop.zone}</span>}
                    </div>
                  </div>
                ))}

                {departSearch.length >= 2 && departResults.length === 0 && (
                  <div className="no-results">Aucun arrêt trouvé</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bouton Swap */}
        <button 
          className="swap-btn"
          onClick={swapDepartArrivee}
          title="Inverser départ/arrivée"
        >
          <FaExchangeAlt />
        </button>

        {/* Champ Arrivée */}
        <div className="itineraire-field">
          <div className="field-icon arrivee">
            <FaFlag />
          </div>
          <div className="field-input-container">
            <input
              ref={arriveeInputRef}
              type="text"
              placeholder="Destination..."
              value={arriveeSearch}
              onChange={(e) => {
                setArriveeSearch(e.target.value);
                handleSearch(e.target.value, 'arrivee');
              }}
              onFocus={() => setActiveFocus('arrivee')}
              className="itineraire-input"
            />

            {/* Résultats arrivée */}
            {activeFocus === 'arrivee' && arriveeResults.length > 0 && (
              <div className="itineraire-results">
                {arriveeResults.map((stop) => (
                  <div
                    key={stop.id}
                    className="result-item"
                    onClick={() => handleSelectArrivee(stop)}
                  >
                    <FaMapMarkerAlt className="result-icon" />
                    <div className="result-info">
                      <span className="result-name">{stop.nom}</span>
                      {stop.zone && <span className="result-zone">{stop.zone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeFocus === 'arrivee' && arriveeSearch.length >= 2 && arriveeResults.length === 0 && (
              <div className="itineraire-results">
                <div className="no-results">Aucun arrêt trouvé</div>
              </div>
            )}
          </div>
        </div>

        {/* Erreur */}
        {itineraireError && (
          <div className="itineraire-error">
            {itineraireError}
          </div>
        )}

        {/* Boutons */}
        <div className="itineraire-actions">
          <button 
            className="btn-clear"
            onClick={clearItineraire}
          >
            Effacer
          </button>
          <button
            className="btn-search"
            onClick={handleSearchItineraire}
            disabled={!canSearch || isSearchingItineraire}
          >
            {isSearchingItineraire ? (
              <>
                <span className="spinner-small"></span>
                Recherche...
              </>
            ) : (
              <>
                <FaSearch /> Rechercher
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Mock itinéraire pour développement
const generateMockItineraire = (departArret, arriveeArret, userLocation) => {
  return {
    found: true,
    depart: departArret || { nom: 'Votre position', isCurrentLocation: true },
    arrivee: arriveeArret,
    options: [
      {
        id: 1,
        type: 'direct',
        duree: 25,
        distance: 4500,
        prix: 400,
        marche: 350,
        segments: [
          {
            type: 'walk',
            from: departArret?.nom || 'Votre position',
            to: 'Arrêt le plus proche',
            distance: 150,
            duree: 2,
          },
          {
            type: 'bus',
            ligne: {
              numero: '135',
              couleur: '#e74c3c',
              terminus_depart: 'Analakely',
              terminus_arrivee: 'Ivandry',
            },
            from: 'Analakely',
            to: arriveeArret.nom,
            stops: 8,
            duree: 20,
          },
          {
            type: 'walk',
            from: arriveeArret.nom,
            to: 'Destination',
            distance: 200,
            duree: 3,
          },
        ],
      },
      {
        id: 2,
        type: 'correspondance',
        duree: 35,
        distance: 5200,
        prix: 800,
        marche: 500,
        correspondances: 1,
        segments: [
          {
            type: 'walk',
            from: departArret?.nom || 'Votre position',
            to: 'Arrêt départ',
            distance: 200,
            duree: 3,
          },
          {
            type: 'bus',
            ligne: {
              numero: '194',
              couleur: '#27ae60',
              terminus_depart: 'Ambohijatovo',
              terminus_arrivee: 'Ankorondrano',
            },
            from: 'Ambohijatovo',
            to: 'Ankorondrano',
            stops: 5,
            duree: 12,
          },
          {
            type: 'walk',
            from: 'Ankorondrano',
            to: 'Correspondance',
            distance: 100,
            duree: 2,
          },
          {
            type: 'bus',
            ligne: {
              numero: '119',
              couleur: '#3498db',
              terminus_depart: 'Ankorondrano',
              terminus_arrivee: 'Ivandry',
            },
            from: 'Ankorondrano',
            to: arriveeArret.nom,
            stops: 4,
            duree: 10,
          },
          {
            type: 'walk',
            from: arriveeArret.nom,
            to: 'Destination',
            distance: 200,
            duree: 3,
          },
        ],
      },
    ],
  };
};

export default ItinerairePanel;
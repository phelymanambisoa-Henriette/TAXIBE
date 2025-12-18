// src/components/map/SearchPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import { useLocation } from '../../contexts/LocationContext';
import localisationService from '../../services/localisationService';

const SearchPanel = () => {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    selectStop,
    isSearching,
    setIsSearching,
  } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Recherche avec debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.length >= 2) {
      setIsSearching(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await localisationService.searchArrets(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Erreur recherche:', error);
          // Mock search
          setSearchResults(mockSearch(searchQuery));
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, setSearchResults, setIsSearching]);

  const handleSelectStop = (stop) => {
    selectStop(stop);
    setSearchQuery('');
    setSearchResults([]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = () => {
    // Délai pour permettre le clic sur les résultats
    setTimeout(() => {
      if (searchResults.length === 0) {
        setIsOpen(false);
      }
    }, 200);
  };

  return (
    <div className={`search-panel ${isOpen ? 'open' : ''}`}>
      <div className="search-input-container">
        <FaSearch className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Rechercher un arrêt..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="search-input"
        />
        {searchQuery && (
          <button className="clear-btn" onClick={handleClear} type="button">
            <FaTimes />
          </button>
        )}
      </div>

      {/* Résultats de recherche */}
      {isOpen && (searchQuery.length >= 2 || searchResults.length > 0) && (
        <div className="search-results">
          {isSearching ? (
            <div className="search-loading">
              <span className="spinner-small"></span>
              Recherche en cours...
            </div>
          ) : searchResults.length > 0 ? (
            <ul className="results-list">
              {searchResults.map((stop) => (
                <li
                  key={stop.id}
                  className="result-item"
                  onClick={() => handleSelectStop(stop)}
                >
                  <FaMapMarkerAlt className="result-icon" />
                  <div className="result-info">
                    <span className="result-name">{stop.nom}</span>
                    {stop.zone && (
                      <span className="result-zone">{stop.zone}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : searchQuery.length >= 2 ? (
            <div className="no-results">
              Aucun arrêt trouvé pour "{searchQuery}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

// Mock search pour développement
const mockSearch = (query) => {
  const allStops = [
    { id: 1, nom: 'Analakely', zone: 'Centre-ville', latitude: -18.9103, longitude: 47.5255 },
    { id: 2, nom: 'Ambohijatovo', zone: 'Centre-ville', latitude: -18.9150, longitude: 47.5280 },
    { id: 3, nom: 'Antanimena', zone: 'Antanimena', latitude: -18.8950, longitude: 47.5200 },
    { id: 4, nom: 'Behoririka', zone: 'Behoririka', latitude: -18.8920, longitude: 47.5320 },
    { id: 5, nom: 'Ankorondrano', zone: 'Ankorondrano', latitude: -18.8780, longitude: 47.5150 },
    { id: 6, nom: 'Ivandry', zone: 'Ivandry', latitude: -18.8700, longitude: 47.5200 },
    { id: 7, nom: 'Andraharo', zone: 'Andraharo', latitude: -18.8650, longitude: 47.5250 },
    { id: 8, nom: 'Ankadimbahoaka', zone: 'Ankadimbahoaka', latitude: -18.9200, longitude: 47.5100 },
  ];
  
  const lowerQuery = query.toLowerCase();
  return allStops.filter(stop => 
    stop.nom.toLowerCase().includes(lowerQuery) ||
    stop.zone.toLowerCase().includes(lowerQuery)
  );
};

export default SearchPanel;
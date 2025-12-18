// src/contexts/ItineraireContext.jsx

import React, { createContext, useContext, useState, useCallback } from 'react';

const ItineraireContext = createContext();

export const useItineraire = () => {
  const context = useContext(ItineraireContext);
  if (!context) {
    throw new Error('useItineraire doit être utilisé dans un ItineraireProvider');
  }
  return context;
};

export const ItineraireProvider = ({ children }) => {
  const [itineraireSelectionne, setItineraireSelectionne] = useState(null);
  const [depart, setDepart] = useState(null);
  const [arrivee, setArrivee] = useState(null);

  const selectionnerItineraire = useCallback((itineraire, departInfo, arriveeInfo) => {
    console.log('📍 Itinéraire sélectionné:', itineraire);
    console.log('📍 Départ:', departInfo);
    console.log('📍 Arrivée:', arriveeInfo);
    setItineraireSelectionne(itineraire);
    setDepart(departInfo);
    setArrivee(arriveeInfo);
  }, []);

  const effacerItineraire = useCallback(() => {
    console.log('🗑️ Itinéraire effacé');
    setItineraireSelectionne(null);
    setDepart(null);
    setArrivee(null);
  }, []);

  // Helper pour obtenir tous les arrêts de l'itinéraire
  const getArretsItineraire = useCallback(() => {
    if (!itineraireSelectionne) return [];

    if (itineraireSelectionne.type === 'direct') {
      return itineraireSelectionne.arrets || [];
    }

    if (itineraireSelectionne.type === 'correspondance') {
      const arrets1 = itineraireSelectionne.trajet1?.arrets || [];
      const arrets2 = itineraireSelectionne.trajet2?.arrets || [];
      return [...arrets1, ...arrets2];
    }

    return [];
  }, [itineraireSelectionne]);

  return (
    <ItineraireContext.Provider
      value={{
        itineraireSelectionne,
        depart,
        arrivee,
        // Compatibilité avec ton ancien code
        departArrivee: depart && arrivee ? { depart, arrivee } : null,
        selectionnerItineraire,
        effacerItineraire,
        getArretsItineraire,
      }}
    >
      {children}
    </ItineraireContext.Provider>
  );
};

export default ItineraireContext;
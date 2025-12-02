// src/contexts/ItineraireContext.js
import React, { createContext, useContext, useState } from 'react';

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
  const [departArrivee, setDepartArrivee] = useState(null);

  const selectionnerItineraire = (itineraire, depart, arrivee) => {
    setItineraireSelectionne(itineraire);
    setDepartArrivee({ depart, arrivee });
    console.log('📍 Itinéraire sélectionné:', itineraire);
  };

  const effacerItineraire = () => {
    setItineraireSelectionne(null);
    setDepartArrivee(null);
    console.log('🗑️ Itinéraire effacé');
  };

  return (
    <ItineraireContext.Provider
      value={{
        itineraireSelectionne,
        departArrivee,
        selectionnerItineraire,
        effacerItineraire,
      }}
    >
      {children}
    </ItineraireContext.Provider>
  );
};
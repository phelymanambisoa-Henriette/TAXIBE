import { createContext, useState, useContext } from 'react';

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [position, setPosition] = useState(null);

  const getLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (error) => {
          console.error('Erreur de géolocalisation :', error);
        }
      );
    } else {
      console.error('Géolocalisation non supportée par ce navigateur.');
    }
  };

  return (
    <LocationContext.Provider value={{ position, getLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}
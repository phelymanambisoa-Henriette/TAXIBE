// src/contexts/LanguageContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';
import { getCurrentLanguage, setLanguageStorage, tKey } from '../utils/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getCurrentLanguage());

  const setLanguage = (lang) => {
    setLanguageStorage(lang);
    setLanguageState(lang);
    // Si un jour tu veux écouter ailleurs
    window.dispatchEvent(new Event('languageChanged'));
  };

  const t = useCallback(
    (key) => tKey(key, language),
    [language]
  );

  useEffect(() => {
    const handler = () => setLanguageState(getCurrentLanguage());
    window.addEventListener('languageChanged', handler);
    return () => window.removeEventListener('languageChanged', handler);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage doit être utilisé dans <LanguageProvider>');
  }
  return ctx;
};
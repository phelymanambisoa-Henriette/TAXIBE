// src/hooks/useLanguage.js
import { useState, useEffect } from 'react';
import { getCurrentLanguage, setLanguageStorage, tKey } from '../utils/translations';

export const useLanguage = () => {
  const [language, setLanguageState] = useState(getCurrentLanguage());

  const setLanguage = (lang) => {
    setLanguageStorage(lang);
    setLanguageState(lang);
  };

  const t = (key) => tKey(key, language);

  useEffect(() => {
    const handler = () => {
      setLanguageState(getCurrentLanguage());
    };
    window.addEventListener('languageChanged', handler);
    return () => window.removeEventListener('languageChanged', handler);
  }, []);

  return { language, setLanguage, t };
};
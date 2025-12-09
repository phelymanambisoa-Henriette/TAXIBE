// src/hooks/useTranslation.js
import { useTheme } from '../contexts/ThemeContext';
import { translations } from '../utils/translations';

export const useTranslation = () => {
  const { language } = useTheme();

  const t = (path) => {
    const keys = path.split('.');
    let result = translations[language] || translations['fr'];
    
    for (const key of keys) {
      result = result?.[key];
    }
    
    return result || path;
  };

  return { t, language };
};
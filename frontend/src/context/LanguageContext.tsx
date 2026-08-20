import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { detectBrowserLanguage, type LanguageCode, TRANSLATIONS } from '../utils/i18n';

interface LanguageContextType {
  currentLang: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: Record<string, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('jigsaw_lang') as LanguageCode;
    if (saved && TRANSLATIONS[saved]) return saved;
    return detectBrowserLanguage();
  });

  const setLanguage = (lang: LanguageCode) => {
    setCurrentLang(lang);
    localStorage.setItem('jigsaw_lang', lang);
  };

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

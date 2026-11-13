import React, { createContext, useContext, useState } from 'react';
import { Language, TRANSLATIONS, TranslationSchema, detectUserLanguage } from './translations';
export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationSchema;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'ko',
  setLanguage: () => {},
  t: TRANSLATIONS.ko
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('WALWAL_LANGUAGE') as Language;
    return saved || detectUserLanguage();
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem('WALWAL_LANGUAGE', lang);
    setLanguageState(lang);
  };

  const value = {
    language,
    setLanguage,
    t: TRANSLATIONS[language] || TRANSLATIONS.en
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);


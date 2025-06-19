import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { translations, AllTranslations, LanguageCode, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, getInitialLanguage } from '../i18n';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage());

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    if (SUPPORTED_LANGUAGES[lang]) {
      setLanguageState(lang);
    } else {
      setLanguageState(DEFAULT_LANGUAGE);
    }
  };

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    const langTranslations = translations[language] || translations[DEFAULT_LANGUAGE];
    let translation = langTranslations[key] || key;

    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        translation = translation.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value));
      });
    }
    return translation;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

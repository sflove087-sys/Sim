import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import Spinner from '../components/common/Spinner';

type Language = 'bn' | 'en';
type Translations = { [key: string]: any };

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'bn';
  });
  
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const [bnRes, enRes] = await Promise.all([
          fetch('/locales/bn.json'),
          fetch('/locales/en.json'),
        ]);

        if (!bnRes.ok || !enRes.ok) {
          throw new Error('Failed to fetch translation files');
        }

        const [bnData, enData] = await Promise.all([
          bnRes.json(),
          enRes.json(),
        ]);

        setTranslations({ bn: bnData, en: enData });
        setIsLoaded(true);
      } catch (error) {
        console.error("Could not load translations:", error);
        document.body.innerHTML = '<div style="text-align: center; padding: 50px; font-family: sans-serif; color: #333;">Could not load application resources. Please try again later.</div>';
      }
    };
    loadTranslations();
  }, []);


  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
    document.documentElement.lang = lang;
  };
  
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Spinner size="lg" colorClass="border-indigo-500" />
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

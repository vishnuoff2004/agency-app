import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n, { getStoredLanguage, setStoredLanguage } from '../i18n';

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    async function loadLang() {
      const lang = await getStoredLanguage();
      setLanguage(lang);
      i18n.changeLanguage(lang);
    }
    loadLang();
  }, []);

  const changeLanguage = async (lang: string) => {
    setLanguage(lang);
    await i18n.changeLanguage(lang);
    await setStoredLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

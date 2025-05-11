"use client";

import { createContext, useContext, useState, useEffect } from 'react';

// Available languages
export const languages = [
  { code: 'en', name: 'English' },
  { code: 'ta', name: 'தமிழ்' }, // Tamil
  { code: 'te', name: 'తెలుగు' }, // Telugu
  { code: 'hi', name: 'हिंदी' }  // Hindi
];

// Create the context
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get language from localStorage if available
    const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
    if (savedLanguage && languages.some(lang => lang.code === savedLanguage)) {
      setLanguage(savedLanguage);
    }

    loadTranslations(savedLanguage || language);
  }, []);

  const loadTranslations = async (langCode) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/locales/${langCode}.json`);
      const data = await response.json();
      setTranslations(data);
    } catch (error) {
      console.error('Failed to load translations:', error);
      // If there's an error, try to load English as fallback
      if (langCode !== 'en') {
        const fallbackResponse = await fetch('/locales/en.json');
        const fallbackData = await fallbackResponse.json();
        setTranslations(fallbackData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (langCode) => {
    if (languages.some(lang => lang.code === langCode)) {
      setLanguage(langCode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', langCode);
      }
      await loadTranslations(langCode);
    }
  };

  const t = (key) => {
    if (isLoading) return key;
    
    // Split the key by dots to navigate through the translations object
    const keys = key.split('.');
    let result = translations;
    
    for (const k of keys) {
      if (result && result[k]) {
        result = result[k];
      } else {
        return key; // Return the key if translation not found
      }
    }
    
    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, isLoading, languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use the language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 
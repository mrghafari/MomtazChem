import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, Translation, getDirection } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translation;
  direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(() => {
    // Safe localStorage access with fallback
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('language') as Language;
        return saved && (saved === 'en' || saved === 'ar' || saved === 'ku' || saved === 'tr') ? saved : 'en';
      }
    } catch (error) {
      console.warn('Failed to access localStorage:', error);
    }
    return 'en';
  });

  const direction = getDirection(language);
  const t = translations[language];

  // Save language preference and update document direction
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', language);
        document.documentElement.dir = direction;
        document.documentElement.lang = language;
        document.documentElement.className = `lang-${language}`;
      }
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  }, [language, direction]);

  const value = {
    language,
    setLanguage,
    t,
    direction,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
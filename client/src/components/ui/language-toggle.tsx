import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from './button';
import { Globe } from 'lucide-react';

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="language-toggle flex items-center gap-2"
    >
      <Globe className="w-4 h-4" />
      {language === 'ar' ? 'English' : 'العربية'}
    </Button>
  );
};
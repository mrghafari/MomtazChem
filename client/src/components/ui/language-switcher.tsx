import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

// SVG Flag components for better performance and customization
const UKFlag = ({ className }: { className?: string }) => (
  <svg className={cn("w-5 h-4", className)} viewBox="0 0 60 40" fill="none">
    <rect width="60" height="40" fill="#012169"/>
    <path d="M0 0L60 40M60 0L0 40" stroke="#fff" strokeWidth="6.67"/>
    <path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" strokeWidth="4"/>
    <path d="M30 0V40M0 20H60" stroke="#fff" strokeWidth="13.33"/>
    <path d="M30 0V40M0 20H60" stroke="#C8102E" strokeWidth="8"/>
  </svg>
);

const ArabFlag = ({ className }: { className?: string }) => (
  <svg className={cn("w-5 h-4", className)} viewBox="0 0 60 40" fill="none">
    <rect width="60" height="13.33" fill="#000"/>
    <rect y="13.33" width="60" height="13.33" fill="#fff"/>
    <rect y="26.67" width="60" height="13.33" fill="#DA0000"/>
    <polygon points="0,0 20,20 0,40" fill="#239F40"/>
  </svg>
);

const KurdishFlag = ({ className }: { className?: string }) => (
  <svg className={cn("w-5 h-4", className)} viewBox="0 0 60 40" fill="none">
    <rect width="60" height="13.33" fill="#DA0000"/>
    <rect y="13.33" width="60" height="13.33" fill="#fff"/>
    <rect y="26.67" width="60" height="13.33" fill="#239F40"/>
    <circle cx="30" cy="20" r="8" fill="#FFD700" stroke="#DA0000" strokeWidth="1"/>
  </svg>
);

const TurkishFlag = ({ className }: { className?: string }) => (
  <svg className={cn("w-5 h-4", className)} viewBox="0 0 60 40" fill="none">
    <rect width="60" height="40" fill="#E30A17"/>
    <circle cx="19" cy="20" r="8" fill="#E30A17" stroke="#fff" strokeWidth="1"/>
    <circle cx="21" cy="20" r="6" fill="#E30A17"/>
    <path d="M27 16 L31 20 L27 24 L29 20 Z" fill="#fff"/>
  </svg>
);

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: React.ComponentType<{ className?: string }>;
}

const languages: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: UKFlag,
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: ArabFlag,
  },
  {
    code: 'ku',
    name: 'Kurdish',
    nativeName: 'کوردی',
    flag: KurdishFlag,
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: TurkishFlag,
  },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 h-9 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
        >
          <motion.div
            key={currentLanguage.code}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center flag-container"
          >
            <currentLanguage.flag className="rounded-sm shadow-sm flag-wave" />
          </motion.div>
          
          <span className="hidden sm:inline font-medium text-sm">
            {currentLanguage.nativeName}
          </span>
          
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3 w-3 opacity-70" />
          </motion.div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-48 p-1"
        sideOffset={5}
      >
        <AnimatePresence>
          {languages.map((lang, index) => {
            const isSelected = lang.code === language;
            
            return (
              <motion.div
                key={lang.code}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.15, 
                  delay: index * 0.05 
                }}
              >
                <DropdownMenuItem
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    "flex items-center gap-3 p-2 cursor-pointer rounded-md transition-all duration-200",
                    isSelected 
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-shrink-0 flag-container"
                  >
                    <lang.flag className="rounded-sm shadow-sm border border-gray-200 dark:border-gray-700 flag-wave" />
                  </motion.div>
                  
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium">
                      {lang.nativeName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {lang.name}
                    </span>
                  </div>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-blue-600 rounded-full"
                    />
                  )}
                </DropdownMenuItem>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        <motion.div 
          className="h-px bg-gray-200 dark:bg-gray-700 mx-2 my-1"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="px-2 py-1"
        >
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Globe className="h-3 w-3" />
            <span>Language</span>
          </div>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile/limited space
export function LanguageSwitcherCompact() {
  const { language, setLanguage } = useLanguage();
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  const toggleLanguage = () => {
    const currentIndex = languages.findIndex(lang => lang.code === language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex].code);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
    >
      <motion.div
        key={currentLanguage.code}
        initial={{ rotateY: -180, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.3, type: "spring" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <currentLanguage.flag className="rounded-sm shadow-sm" />
      </motion.div>
    </Button>
  );
}
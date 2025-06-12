import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'fa';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.services': 'Services',
    'nav.products': 'Products',
    'nav.contact': 'Contact',
    'nav.shop': 'Shop',
    'nav.admin': 'Admin',
    'nav.crm': 'CRM',
    
    // Home page
    'home.hero.title': 'Leading Chemical Solutions',
    'home.hero.subtitle': 'Momtazchem provides premium chemical products for fuel additives, water treatment, paint & thinner, and agricultural fertilizers.',
    'home.hero.cta': 'Explore Products',
    'home.categories.title': 'Our Product Categories',
    'home.categories.fuel': 'Fuel Additives',
    'home.categories.water': 'Water Treatment',
    'home.categories.paint': 'Paint & Thinner',
    'home.categories.agri': 'Agricultural Fertilizers',
    
    // About page
    'about.title': 'About Momtazchem',
    'about.description': 'Leading provider of chemical solutions in Erbil, Kurdistan',
    
    // Contact page
    'contact.title': 'Contact Us',
    'contact.form.firstName': 'First Name',
    'contact.form.lastName': 'Last Name',
    'contact.form.email': 'Email',
    'contact.form.company': 'Company',
    'contact.form.interest': 'Product Interest',
    'contact.form.message': 'Message',
    'contact.form.submit': 'Send Message',
    'contact.form.success': 'Message sent successfully!',
    'contact.form.error': 'Failed to send message. Please try again.',
    
    // Products
    'products.title': 'Our Products',
    'products.category.all': 'All Categories',
    'products.viewDetails': 'View Details',
    'products.downloadCatalog': 'Download Catalog',
    
    // Admin
    'admin.title': 'Admin Panel',
    'admin.login': 'Login',
    'admin.logout': 'Logout',
    'admin.products.title': 'Product Management',
    'admin.products.add': 'Add Product',
    'admin.products.edit': 'Edit Product',
    'admin.products.delete': 'Delete Product',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
  },
  fa: {
    // Navigation
    'nav.home': 'خانه',
    'nav.about': 'درباره ما',
    'nav.services': 'خدمات',
    'nav.products': 'محصولات',
    'nav.contact': 'تماس با ما',
    'nav.shop': 'فروشگاه',
    'nav.admin': 'مدیریت',
    'nav.crm': 'مدیریت ارتباط',
    
    // Home page
    'home.hero.title': 'راه‌حل‌های پیشرو شیمیایی',
    'home.hero.subtitle': 'ممتازکم محصولات شیمیایی درجه یک برای افزودنی‌های سوخت، تصفیه آب، رنگ و تینر، و کودهای کشاورزی ارائه می‌دهد.',
    'home.hero.cta': 'مشاهده محصولات',
    'home.categories.title': 'دسته‌بندی محصولات ما',
    'home.categories.fuel': 'افزودنی‌های سوخت',
    'home.categories.water': 'تصفیه آب',
    'home.categories.paint': 'رنگ و تینر',
    'home.categories.agri': 'کودهای کشاورزی',
    
    // About page
    'about.title': 'درباره ممتازکم',
    'about.description': 'ارائه‌دهنده پیشرو راه‌حل‌های شیمیایی در اربیل، کردستان',
    
    // Contact page
    'contact.title': 'تماس با ما',
    'contact.form.firstName': 'نام',
    'contact.form.lastName': 'نام خانوادگی',
    'contact.form.email': 'ایمیل',
    'contact.form.company': 'شرکت',
    'contact.form.interest': 'علاقه به محصول',
    'contact.form.message': 'پیام',
    'contact.form.submit': 'ارسال پیام',
    'contact.form.success': 'پیام با موفقیت ارسال شد!',
    'contact.form.error': 'ارسال پیام ناموفق بود. لطفاً دوباره تلاش کنید.',
    
    // Products
    'products.title': 'محصولات ما',
    'products.category.all': 'همه دسته‌ها',
    'products.viewDetails': 'مشاهده جزئیات',
    'products.downloadCatalog': 'دانلود کاتالوگ',
    
    // Admin
    'admin.title': 'پنل مدیریت',
    'admin.login': 'ورود',
    'admin.logout': 'خروج',
    'admin.products.title': 'مدیریت محصولات',
    'admin.products.add': 'افزودن محصول',
    'admin.products.edit': 'ویرایش محصول',
    'admin.products.delete': 'حذف محصول',
    
    // Common
    'common.loading': 'در حال بارگذاری...',
    'common.error': 'خطا',
    'common.success': 'موفقیت',
    'common.save': 'ذخیره',
    'common.cancel': 'لغو',
    'common.delete': 'حذف',
    'common.edit': 'ویرایش',
    'common.view': 'مشاهده',
    'common.close': 'بستن',
    'common.back': 'بازگشت',
    'common.next': 'بعدی',
    'common.previous': 'قبلی',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fa')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Update document direction and language
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Add language class to body for CSS styling
    document.body.classList.remove('lang-en', 'lang-fa');
    document.body.classList.add(`lang-${language}`);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  const isRTL = language === 'fa';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
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
export type Language = 'en' | 'ar' | 'ku' | 'tr';

export interface ValidationMessages {
  emailExists: string;
  phoneExists: string;
  requiredFields: string;
}

export const validationMessages: Record<Language, ValidationMessages> = {
  en: {
    emailExists: 'Email already exists in our system',
    phoneExists: 'Phone number already exists - a customer with this number is already registered',
    requiredFields: 'Phone, country, city, and address are required fields',
  },
  ar: {
    emailExists: 'البريد الإلكتروني موجود بالفعل في نظامنا',
    phoneExists: 'رقم الهاتف موجود بالفعل - عميل بهذا الرقم مسجل سابقاً',
    requiredFields: 'الهاتف والدولة والمدينة والعنوان حقول مطلوبة',
  },
  ku: {
    emailExists: 'ئەم ئیمەیلە پێشتر بەکارهاتووە لە سیستەمەکەماندا',
    phoneExists: 'ئەم ژمارە تەلەفۆنە پێشتر بەکارهاتووە - کڕیارێک بەم ژمارەیە تۆمارکراوە',
    requiredFields: 'تەلەفۆن، وڵات، شار و ناونیشان خانە پێویستەکانن',
  },
  tr: {
    emailExists: 'E-posta sistemimizde zaten mevcut',
    phoneExists: 'Telefon numarası zaten mevcut - bu numarayla bir müşteri kayıtlı',
    requiredFields: 'Telefon, ülke, şehir ve adres zorunlu alanlar',
  }
};

export function getLanguageFromRequest(req: any): Language {
  // Try to get language from Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  const langHeader = req.headers['x-language'] || req.headers['language'];
  
  // Priority: explicit language header > query parameter > accept-language > default
  let language = langHeader || req.query.lang || 'en';
  
  if (acceptLanguage && !langHeader && !req.query.lang) {
    if (acceptLanguage.includes('ar')) language = 'ar';
    else if (acceptLanguage.includes('ku')) language = 'ku';
    else if (acceptLanguage.includes('tr')) language = 'tr';
    else language = 'en';
  }
  
  // Validate language is supported
  const supportedLanguages: Language[] = ['en', 'ar', 'ku', 'tr'];
  return supportedLanguages.includes(language as Language) ? language as Language : 'en';
}

export function getValidationMessage(req: any, messageKey: keyof ValidationMessages): string {
  const language = getLanguageFromRequest(req);
  return validationMessages[language][messageKey];
}
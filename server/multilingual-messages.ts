// Multilingual message templates for automated communications
// Supports Persian (fa), English (en), Arabic (ar), Kurdish (ku), and Turkish (tr)

export interface MessageTemplates {
  orderConfirmation: Record<string, string>;
  passwordReset: Record<string, string>;
  welcomeMessage: Record<string, string>;
  lowInventoryAlert: Record<string, string>;
  paymentConfirmation: Record<string, string>;
  inquiryResponse: Record<string, string>;
  smsVerification: Record<string, string>;
  smsOrderUpdate: Record<string, string>;
}

export const multilingualMessages: MessageTemplates = {
  orderConfirmation: {
    fa: 'سفارش شما با شماره {{orderNumber}} با موفقیت ثبت شد. مجموع مبلغ: {{amount}} تومان. وضعیت سفارش: {{status}}',
    en: 'Your order #{{orderNumber}} has been successfully placed. Total amount: {{amount}} IQD. Order status: {{status}}',
    ar: 'تم تأكيد طلبك رقم {{orderNumber}} بنجاح. المبلغ الإجمالي: {{amount}} دينار عراقي. حالة الطلب: {{status}}',
    ku: 'داواکاریت ژمارە {{orderNumber}} بە سەرکەوتوویی تۆمار کرا. کۆی بڕە: {{amount}} دینار عێراقی. ڕەوشی داواکاری: {{status}}',
    tr: 'Siparişiniz #{{orderNumber}} başarıyla oluşturuldu. Toplam tutar: {{amount}} Irak Dinarı. Sipariş durumu: {{status}}'
  },

  passwordReset: {
    fa: 'درخواست بازیابی رمز عبور برای حساب کاربری {{email}} دریافت شد. برای تغییر رمز عبور روی لینک زیر کلیک کنید: {{resetLink}}',
    en: 'Password reset request received for account {{email}}. Click the following link to reset your password: {{resetLink}}',
    ar: 'تم استلام طلب إعادة تعيين كلمة المرور للحساب {{email}}. انقر على الرابط التالي لإعادة تعيين كلمة المرور: {{resetLink}}',
    ku: 'داوای گەڕاندنەوەی تێپەڕەوشە بۆ ئەکاونتی {{email}} وەرگیرا. کلیک لەسەر بەستەری خوارەوە بکە بۆ دووبارە دانانی تێپەڕەوشەت: {{resetLink}}',
    tr: '{{email}} hesabı için şifre sıfırlama isteği alındı. Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın: {{resetLink}}'
  },

  welcomeMessage: {
    fa: 'به شرکت ممتاز شیمی خوش آمدید، {{customerName}}! ما افتخار داریم که شما را به عنوان مشتری جدید در خانواده خود داشته باشیم.',
    en: 'Welcome to Momtaz Chemistry, {{customerName}}! We are honored to have you as our new customer in our family.',
    ar: 'مرحباً بك في شركة ممتاز للكيماويات، {{customerName}}! نحن نتشرف بوجودك كعميل جديد في عائلتنا.',
    ku: 'بەخێربێی بۆ کۆمپانیای کیمیای ممتاز، {{customerName}}! شانازی پێوە دەکەین کە وەک کڕیارێکی نوێ لە خێزانەکەماندا هەتە.',
    tr: 'Momtaz Kimya\'ya hoş geldiniz, {{customerName}}! Sizi ailemizde yeni bir müşteri olarak ağırlamaktan onur duyuyoruz.'
  },

  lowInventoryAlert: {
    fa: 'هشدار موجودی کم: محصول {{productName}} تنها {{quantity}} عدد در انبار باقی مانده است.',
    en: 'Low inventory alert: Product {{productName}} has only {{quantity}} units remaining in stock.',
    ar: 'تنبيه انخفاض المخزون: المنتج {{productName}} لم يتبق منه سوى {{quantity}} وحدة في المخزون.',
    ku: 'ئاگاداری کەمی کاڵا: بەرهەمی {{productName}} تەنها {{quantity}} یەکە لە کۆگادا ماوەتەوە.',
    tr: 'Düşük stok uyarısı: {{productName}} ürününden stokta sadece {{quantity}} adet kaldı.'
  },

  paymentConfirmation: {
    fa: 'پرداخت شما با موفقیت انجام شد. مبلغ: {{amount}} تومان. شماره تراکنش: {{transactionId}}',
    en: 'Your payment has been successfully processed. Amount: {{amount}} IQD. Transaction ID: {{transactionId}}',
    ar: 'تمت معالجة دفعتك بنجاح. المبلغ: {{amount}} دينار عراقي. رقم المعاملة: {{transactionId}}',
    ku: 'پارەدانەکەت بە سەرکەوتوویی جێبەجێ کرا. بڕە: {{amount}} دینار عێراقی. ژمارەی مامەڵە: {{transactionId}}',
    tr: 'Ödemeniz başarıyla işleme alındı. Tutar: {{amount}} Irak Dinarı. İşlem ID: {{transactionId}}'
  },

  inquiryResponse: {
    fa: '{{customerName}} عزیز، از درخواست شماره {{inquiryNumber}} شما در خصوص {{inquirySubject}} در دسته‌بندی {{inquiryCategory}} سپاس‌گزاریم. درخواست شما را با دقت بررسی کردیم و پاسخ تفصیلی ما این است: {{responseText}}. اگر به کمک بیشتری نیاز دارید یا سوالات اضافی دارید، لطفاً از تماس با ما دریغ نکنید: +964 770 999 6771 یا support@momtazchem.com. از همکاری شما قدردانی می‌کنیم و مشتاقانه منتظر خدمت‌رسانی به شما هستیم. با احترام، تیم شیمی ممتاز - ارائه‌دهنده پیشرو راه‌حل‌های شیمیایی.',
    en: 'Dear {{customerName}}, thank you for your inquiry #{{inquiryNumber}} regarding {{inquirySubject}} in the {{inquiryCategory}} category. We have carefully reviewed your request and here is our detailed response: {{responseText}}. If you need further assistance or have additional questions, please do not hesitate to contact us at +964 770 999 6771 or support@momtazchem.com. We appreciate your business and look forward to serving you. Best regards, Momtaz Chemistry Team - Leading Chemical Solutions Provider.',
    ar: 'عزيزي {{customerName}}، شكراً لاستفسارك رقم {{inquiryNumber}} بخصوص {{inquirySubject}} في فئة {{inquiryCategory}}. لقد راجعنا طلبك بعناية وإليك ردنا التفصيلي: {{responseText}}. إذا كنت بحاجة لمساعدة إضافية أو لديك أسئلة إضافية، يرجى عدم التردد في الاتصال بنا على +964 770 999 6771 أو support@momtazchem.com. نقدر أعمالك ونتطلع لخدمتك. مع أطيب التحيات، فريق ممتاز للكيماويات - مزود الحلول الكيميائية الرائد.',
    ku: 'Birêz {{customerName}}, spas ji bo pirsên we ya #{{inquiryNumber}} li ser {{inquirySubject}} di kategoriya {{inquiryCategory}} de. Em daxwaza we bi baldarî nirxandin û li vir bersiva me ya berfireh e: {{responseText}}. Heke alîkariya zêdetir hewce be an pirsên zêde hene, ji kerema xwe nedudilî bike ku bi me re bi +964 770 999 6771 an support@momtazchem.com re têkilî daynin. Em karsaziya we pîroz dikin û li benda xizmetkirina we ne. Bi hurmet, Tîma Kemîk a Momtaz - Pêşkêşkara Çareseriyên Kemîk a Pêşeng.',
    tr: 'Sayın {{customerName}}, {{inquiryCategory}} kategorisinde {{inquirySubject}} konusundaki #{{inquiryNumber}} numaralı sorgunuz için teşekkür ederiz. Talebinizi dikkatli bir şekilde inceledik ve ayrıntılı yanıtımız şu şekilde: {{responseText}}. Daha fazla yardıma ihtiyacınız varsa veya ek sorularınız varsa, lütfen +964 770 999 6771 veya support@momtazchem.com adresinden bizimle iletişime geçmekten çekinmeyin. İşinizi takdir ediyoruz ve size hizmet etmeyi dört gözle bekliyoruz. Saygılarımızla, Momtaz Kimya Ekibi - Önde Gelen Kimyasal Çözümler Sağlayıcısı.'
  },

  smsVerification: {
    fa: 'کد تایید شما: {{verificationCode}}. این کد تا 10 دقیقه معتبر است.',
    en: 'Your verification code: {{verificationCode}}. This code is valid for 10 minutes.',
    ar: 'رمز التحقق الخاص بك: {{verificationCode}}. هذا الرمز صالح لمدة 10 دقائق.',
    ku: 'کۆدی پشتڕاستکردنەوەت: {{verificationCode}}. ئەم کۆدە بۆ ماوەی ١٠ خولەک بەکارهێنراوە.',
    tr: 'Doğrulama kodunuz: {{verificationCode}}. Bu kod 10 dakika geçerlidir.'
  },

  smsOrderUpdate: {
    fa: 'وضعیت سفارش {{orderNumber}} به {{status}} تغییر کرد.',
    en: 'Order {{orderNumber}} status changed to {{status}}.',
    ar: 'تم تغيير حالة الطلب {{orderNumber}} إلى {{status}}.',
    ku: 'ڕەوشی داواکاری {{orderNumber}} گۆڕا بۆ {{status}}.',
    tr: 'Sipariş {{orderNumber}} durumu {{status}} olarak güncellendi.'
  }
};

// Language mapping for customer preferences
export const languageLabels = {
  fa: 'فارسی',
  en: 'English',
  ar: 'العربية',
  ku: 'کوردی',
  tr: 'Türkçe'
};

// Helper function to get message in customer's preferred language
export function getLocalizedMessage(
  messageType: keyof MessageTemplates,
  customerLanguage: string,
  variables: Record<string, string>
): string {
  const template = multilingualMessages[messageType][customerLanguage] || 
                  multilingualMessages[messageType]['fa']; // Fallback to Persian
  
  let message = template;
  Object.entries(variables).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  
  return message;
}

// Enhanced SMS message generation with language preference
export function generateSMSMessage(
  messageType: keyof MessageTemplates,
  customerLanguage: string,
  variables: Record<string, string>
): string {
  return getLocalizedMessage(messageType, customerLanguage, variables);
}

// Enhanced email subject generation with language preference
export function getLocalizedEmailSubject(
  subjectType: string,
  customerLanguage: string
): string {
  const subjects = {
    orderConfirmation: {
      fa: 'تایید سفارش - شرکت ممتاز شیمی',
      en: 'Order Confirmation - Momtaz Chemistry',
      ar: 'تأكيد الطلب - شركة ممتاز للكيماويات',
      ku: 'پشتڕاستکردنەوەی داواکاری - کۆمپانیای کیمیای ممتاز',
      tr: 'Sipariş Onayı - Momtaz Kimya'
    },
    passwordReset: {
      fa: 'بازیابی رمز عبور - شرکت ممتاز شیمی',
      en: 'Password Reset - Momtaz Chemistry',
      ar: 'إعادة تعيين كلمة المرور - شركة ممتاز للكيماويات',
      ku: 'گەڕاندنەوەی تێپەڕەوشە - کۆمپانیای کیمیای ممتاز',
      tr: 'Şifre Sıfırlama - Momtaz Kimya'
    },
    welcome: {
      fa: 'خوش آمدید - شرکت ممتاز شیمی',
      en: 'Welcome - Momtaz Chemistry',
      ar: 'مرحباً بك - شركة ممتاز للكيماويات',
      ku: 'بەخێربێی - کۆمپانیای کیمیای ممتاز',
      tr: 'Hoş Geldiniz - Momtaz Kimya'
    },
    inquiryResponse: {
      fa: 'پاسخ درخواست - شرکت ممتاز شیمی',
      en: 'Inquiry Response - Momtaz Chemistry',
      ar: 'رد على الاستفسار - شركة ممتاز للكيماويات',
      ku: 'وەڵامی پرسیار - کۆمپانیای کیمیای ممتاز',
      tr: 'Soru Yanıtı - Momtaz Kimya'
    }
  };
  
  return subjects[subjectType]?.[customerLanguage] || 
         subjects[subjectType]?.['fa'] || 
         'شرکت ممتاز شیمی'; // Ultimate fallback
}
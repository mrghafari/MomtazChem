/**
 * راهنمای استفاده از Universal Email Service
 * 
 * این فایل راهنمای کاملی برای استفاده از Universal Email Service
 * و تعریف شرایط و موقعیت‌های مختلف ارسال ایمیل فراهم می‌کند.
 */

export interface EmailServiceUsage {
  categoryKey: string;
  categoryName: string;
  description: string;
  whenToUse: string[];
  emailAddress: string;
  examples: string[];
  priority: 'high' | 'medium' | 'low';
  autoSend: boolean;
}

/**
 * تعریف کاربردهای مختلف Universal Email Service
 */
export const EMAIL_SERVICE_USAGE: EmailServiceUsage[] = [
  {
    categoryKey: 'admin',
    categoryName: 'مدیریت عمومی',
    description: 'برای ایمیل‌های مدیریتی عمومی و پیام‌های سیستمی مهم',
    whenToUse: [
      'پیام‌های مدیریتی عمومی',
      'اطلاعات سیستمی مهم',
      'گزارش‌های عملکرد کلی',
      'تغییرات سیستمی عمده'
    ],
    emailAddress: 'admin@momtazchem.com',
    examples: [
      'گزارش عملکرد ماهانه سیستم',
      'اطلاع‌رسانی تغییرات مهم',
      'پیام‌های فوری مدیریت'
    ],
    priority: 'high',
    autoSend: true
  },
  {
    categoryKey: 'agricultural-fertilizers',
    categoryName: 'بخش کود کشاورزی',
    description: 'برای استعلامات و سفارشات محصولات کشاورزی و کود',
    whenToUse: [
      'استعلام محصولات کشاورزی',
      'سفارش کود و نهاده‌های کشاورزی',
      'مشاوره فنی کشاورزی',
      'گزارش کیفیت محصولات کشاورزی'
    ],
    emailAddress: 'agricultural@momtazchem.com',
    examples: [
      'درخواست کود NPK برای مزرعه گندم',
      'استعلام قیمت کود اوره',
      'مشاوره استفاده از کود در باغات'
    ],
    priority: 'medium',
    autoSend: true
  },
  {
    categoryKey: 'fuel-additives',
    categoryName: 'بخش افزودنی‌های سوخت',
    description: 'برای استعلامات محصولات مرتبط با سوخت و افزودنی‌ها',
    whenToUse: [
      'استعلام افزودنی‌های سوخت',
      'سفارش محصولات دیزل و بنزین',
      'مشاوره فنی سوخت',
      'گزارش کیفیت محصولات سوخت'
    ],
    emailAddress: 'fuel@momtazchem.com',
    examples: [
      'درخواست افزودنی اکتان بوستر',
      'استعلام قیمت افزودنی دیزل',
      'مشاوره بهبود کیفیت سوخت'
    ],
    priority: 'medium',
    autoSend: true
  },
  {
    categoryKey: 'paint-thinner',
    categoryName: 'بخش رنگ و تینر',
    description: 'برای استعلامات محصولات رنگ، تینر و حلال‌ها',
    whenToUse: [
      'استعلام محصولات رنگ',
      'سفارش تینر و حلال‌ها',
      'مشاوره فنی رنگ',
      'گزارش کیفیت محصولات رنگ'
    ],
    emailAddress: 'thinner@momtazchem.com',
    examples: [
      'درخواست تینر صنعتی',
      'استعلام قیمت حلال‌های رنگ',
      'مشاوره انتخاب رنگ مناسب'
    ],
    priority: 'medium',
    autoSend: true
  },
  {
    categoryKey: 'water-treatment',
    categoryName: 'بخش تصفیه آب',
    description: 'برای استعلامات محصولات تصفیه آب و تیمار آب',
    whenToUse: [
      'استعلام محصولات تصفیه آب',
      'سفارش مواد شیمیایی تیمار آب',
      'مشاوره فنی تصفیه آب',
      'گزارش کیفیت محصولات آب'
    ],
    emailAddress: 'water@momtazchem.com',
    examples: [
      'درخواست مواد ضدعفونی آب',
      'استعلام قیمت تصفیه‌کننده آب',
      'مشاوره سیستم تصفیه آب صنعتی'
    ],
    priority: 'medium',
    autoSend: true
  },
  {
    categoryKey: 'sales',
    categoryName: 'بخش فروش',
    description: 'برای استعلامات فروش عمومی و پیگیری سفارشات',
    whenToUse: [
      'استعلامات فروش عمومی',
      'پیگیری سفارشات',
      'درخواست قیمت محصولات',
      'مذاکرات تجاری'
    ],
    emailAddress: 'sales@momtazchem.com',
    examples: [
      'استعلام قیمت محصولات شیمیایی',
      'پیگیری وضعیت سفارش',
      'درخواست تخفیف برای خرید عمده'
    ],
    priority: 'high',
    autoSend: true
  },
  {
    categoryKey: 'support',
    categoryName: 'پشتیبانی مشتریان',
    description: 'برای مسائل فنی، شکایات و پشتیبانی مشتریان',
    whenToUse: [
      'مشکلات فنی محصولات',
      'شکایات مشتریان',
      'راهنمایی استفاده از محصولات',
      'پشتیبانی فنی'
    ],
    emailAddress: 'support@momtazchem.com',
    examples: [
      'مشکل در استفاده از محصول',
      'شکایت از کیفیت محصول',
      'درخواست راهنمایی فنی'
    ],
    priority: 'high',
    autoSend: true
  },
  {
    categoryKey: 'inventory-alerts',
    categoryName: 'هشدارهای موجودی',
    description: 'برای هشدارهای کمبود موجودی و مدیریت انبار',
    whenToUse: [
      'کمبود موجودی محصولات',
      'هشدار سطح بحرانی موجودی',
      'گزارش‌های موجودی',
      'درخواست تأمین مجدد'
    ],
    emailAddress: 'inventory@momtazchem.com',
    examples: [
      'هشدار کمبود کود NPK',
      'موجودی تینر به حد بحرانی رسیده',
      'گزارش موجودی ماهانه'
    ],
    priority: 'high',
    autoSend: true
  },
  {
    categoryKey: 'order-confirmations',
    categoryName: 'تأیید سفارشات',
    description: 'برای تأیید سفارشات و اطلاع‌رسانی وضعیت سفارش',
    whenToUse: [
      'تأیید دریافت سفارش',
      'اطلاع‌رسانی تغییر وضعیت سفارش',
      'تأیید آماده‌سازی سفارش',
      'اطلاع ارسال سفارش'
    ],
    emailAddress: 'orders@momtazchem.com',
    examples: [
      'تأیید سفارش شماره 1001',
      'سفارش شما آماده ارسال است',
      'تغییر وضعیت سفارش به "در حال آماده‌سازی"'
    ],
    priority: 'high',
    autoSend: true
  },
  {
    categoryKey: 'payment-notifications',
    categoryName: 'اطلاعات پرداخت',
    description: 'برای اطلاع‌رسانی پرداخت‌ها و مسائل مالی',
    whenToUse: [
      'تأیید دریافت پرداخت',
      'اطلاع‌رسانی مشکلات پرداخت',
      'فاکتور و رسید پرداخت',
      'یادآوری پرداخت'
    ],
    emailAddress: 'payments@momtazchem.com',
    examples: [
      'تأیید پرداخت 5,000,000 تومان',
      'مشکل در پردازش پرداخت',
      'ارسال فاکتور رسمی'
    ],
    priority: 'high',
    autoSend: true
  },
  {
    categoryKey: 'password-reset',
    categoryName: 'بازیابی رمز عبور',
    description: 'برای درخواست‌های بازیابی و تغییر رمز عبور',
    whenToUse: [
      'درخواست بازیابی رمز عبور',
      'تأیید تغییر رمز عبور',
      'هشدارهای امنیتی',
      'اطلاع‌رسانی ورود مشکوک'
    ],
    emailAddress: 'noreply@momtazchem.com',
    examples: [
      'لینک بازیابی رمز عبور',
      'تأیید تغییر رمز عبور',
      'ورود مشکوک به حساب کاربری'
    ],
    priority: 'high',
    autoSend: true
  },
  {
    categoryKey: 'system-notifications',
    categoryName: 'اطلاعات سیستم',
    description: 'برای اطلاع‌رسانی‌های سیستمی و تکنیکال',
    whenToUse: [
      'اطلاع‌رسانی تعمیرات سیستم',
      'هشدارهای تکنیکال',
      'به‌روزرسانی‌های سیستم',
      'گزارش‌های خرابی'
    ],
    emailAddress: 'system@momtazchem.com',
    examples: [
      'تعمیرات برنامه‌ریزی شده سیستم',
      'خرابی سرور پایگاه داده',
      'به‌روزرسانی سیستم مدیریت'
    ],
    priority: 'medium',
    autoSend: true
  },
  {
    categoryKey: 'security-alerts',
    categoryName: 'هشدارهای امنیتی',
    description: 'برای هشدارهای امنیتی و مسائل حساس',
    whenToUse: [
      'تلاش‌های ورود مشکوک',
      'هشدارهای امنیتی',
      'نقض قوانین امنیتی',
      'گزارش‌های امنیتی'
    ],
    emailAddress: 'security@momtazchem.com',
    examples: [
      'تلاش ورود غیرمجاز',
      'هشدار امنیتی سیستم',
      'گزارش فعالیت مشکوک'
    ],
    priority: 'high',
    autoSend: true
  },
  {
    categoryKey: 'user-management',
    categoryName: 'مدیریت کاربران',
    description: 'برای مدیریت کاربران و اطلاع‌رسانی‌های مرتبط',
    whenToUse: [
      'ایجاد حساب کاربری جدید',
      'تغییر سطح دسترسی',
      'غیرفعال‌سازی حساب',
      'اطلاع‌رسانی تغییرات کاربری'
    ],
    emailAddress: 'users@momtazchem.com',
    examples: [
      'ایجاد حساب کاربری برای کارمند جدید',
      'تغییر سطح دسترسی مدیر',
      'غیرفعال‌سازی حساب کاربری'
    ],
    priority: 'medium',
    autoSend: true
  },
  {
    categoryKey: 'crm-notifications',
    categoryName: 'اطلاعات CRM',
    description: 'برای اطلاع‌رسانی‌های سیستم مدیریت ارتباط با مشتری',
    whenToUse: [
      'فعالیت‌های جدید مشتری',
      'گزارش‌های CRM',
      'یادآوری پیگیری مشتری',
      'تحلیل‌های مشتری'
    ],
    emailAddress: 'crm@momtazchem.com',
    examples: [
      'مشتری جدید در سیستم ثبت شد',
      'گزارش فعالیت مشتریان',
      'یادآوری پیگیری مشتری VIP'
    ],
    priority: 'medium',
    autoSend: true
  }
];

/**
 * تعریف قوانین استفاده از Universal Email Service
 */
export const EMAIL_SERVICE_RULES = {
  automaticSending: {
    description: 'ایمیل‌های خودکار که بدون دخالت کاربر ارسال می‌شوند',
    conditions: [
      'کمبود موجودی محصولات (زیر حد آستانه)',
      'ثبت سفارش جدید توسط مشتری',
      'تأیید پرداخت توسط بانک',
      'تغییر وضعیت سفارش',
      'ورود مشکوک به سیستم',
      'خرابی سیستم یا خطاهای بحرانی'
    ]
  },
  
  manualSending: {
    description: 'ایمیل‌های دستی که توسط کاربر یا مدیر ارسال می‌شوند',
    conditions: [
      'پاسخ به استعلامات مشتریان',
      'ارسال اطلاعات فنی محصولات',
      'مکاتبات تجاری',
      'اطلاع‌رسانی‌های خاص',
      'گزارش‌های دوره‌ای'
    ]
  },
  
  priorityLevels: {
    high: {
      description: 'اولویت بالا - ارسال فوری',
      categories: ['admin', 'sales', 'support', 'inventory-alerts', 'order-confirmations', 'payment-notifications', 'password-reset', 'security-alerts'],
      responseTime: 'حداکثر 1 ساعت'
    },
    medium: {
      description: 'اولویت متوسط - ارسال در ساعات کاری',
      categories: ['agricultural-fertilizers', 'fuel-additives', 'paint-thinner', 'water-treatment', 'system-notifications', 'user-management', 'crm-notifications'],
      responseTime: 'حداکثر 4 ساعت'
    },
    low: {
      description: 'اولویت پایین - ارسال طبق برنامه',
      categories: [],
      responseTime: 'حداکثر 24 ساعت'
    }
  }
};

/**
 * راهنمای استفاده برای توسعه‌دهندگان
 */
export const DEVELOPER_GUIDE = {
  usage: {
    basic: `
      // استفاده ساده از Universal Email Service
      import { UniversalEmailService } from './universal-email-service';
      
      await UniversalEmailService.sendEmail({
        categoryKey: 'sales',
        to: ['customer@example.com'],
        subject: 'استعلام محصول',
        html: '<p>پیام شما...</p>'
      });
    `,
    
    withTemplate: `
      // استفاده با template
      await UniversalEmailService.sendEmail({
        categoryKey: 'order-confirmations',
        to: ['customer@example.com'],
        subject: 'تأیید سفارش',
        template: 'order-confirmation',
        variables: {
          orderNumber: '1001',
          customerName: 'علی احمدی'
        }
      });
    `,
    
    inventoryAlert: `
      // هشدار موجودی
      await UniversalEmailService.sendInventoryAlertEmail(
        'کود NPK',
        5,
        10
      );
    `,
    
    systemNotification: `
      // اطلاع‌رسانی سیستم
      await UniversalEmailService.sendSystemNotificationEmail(
        'تعمیرات سیستم',
        'سیستم در ساعت 2 صبح تعمیر خواهد شد',
        'high'
      );
    `
  },
  
  bestPractices: [
    'همیشه از category مناسب استفاده کنید',
    'برای ایمیل‌های خودکار از priority مناسب استفاده کنید',
    'متن ایمیل‌ها را به زبان مناسب (فارسی/انگلیسی) بنویسید',
    'از template استفاده کنید تا format یکسان باشد',
    'برای ایمیل‌های حساس از security-alerts استفاده کنید'
  ]
};
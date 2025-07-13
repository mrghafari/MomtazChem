export const getMultilingualMessage = (language: string, key: string) => {
  const messages = {
    // Abandoned Cart Messages
    'abandoned_cart_title': {
      'fa': 'مدیریت سبد خرید رها شده',
      'ar': 'إدارة السلة المهجورة',
      'ku': 'بەڕێوەبەرایەتی سەبەتەی بەجێهێڵراو',
      'en': 'Abandoned Cart Management'
    },
    'settings_updated': {
      'fa': 'تنظیمات به‌روزرسانی شد',
      'ar': 'تم تحديث الإعدادات',
      'ku': 'ڕێکخستنەکان نوێ کرانەوە',
      'en': 'Settings Updated'
    },
    'settings_saved_successfully': {
      'fa': 'تنظیمات سبد خرید رها شده با موفقیت ذخیره شد',
      'ar': 'تم حفظ إعدادات السلة المهجورة بنجاح',
      'ku': 'ڕێکخستنەکانی سەبەتەی بەجێهێڵراو بە سەرکەوتوویی پاشەکەوت کرا',
      'en': 'Abandoned cart settings saved successfully'
    },
    'error': {
      'fa': 'خطا',
      'ar': 'خطأ',
      'ku': 'هەڵە',
      'en': 'Error'
    },
    'error_updating_settings': {
      'fa': 'خطا در به‌روزرسانی تنظیمات',
      'ar': 'خطأ في تحديث الإعدادات',
      'ku': 'هەڵە لە نوێکردنەوەی ڕێکخستنەکان',
      'en': 'Error updating settings'
    },
    'notification_sent': {
      'fa': 'اعلان ارسال شد',
      'ar': 'تم إرسال الإشعار',
      'ku': 'ئاگاداری نێردرا',
      'en': 'Notification Sent'
    },
    'notification_sent_successfully': {
      'fa': 'اعلان با موفقیت ارسال شد',
      'ar': 'تم إرسال الإشعار بنجاح',
      'ku': 'ئاگاداری بە سەرکەوتوویی نێردرا',
      'en': 'Notification sent successfully'
    },
    'error_sending_notification': {
      'fa': 'خطا در ارسال اعلان',
      'ar': 'خطأ في إرسال الإشعار',
      'ku': 'هەڵە لە ناردنی ئاگاداری',
      'en': 'Error sending notification'
    },
    'abandoned_cart_settings': {
      'fa': 'تنظیمات سبد خرید رها شده',
      'ar': 'إعدادات السلة المهجورة',
      'ku': 'ڕێکخستنەکانی سەبەتەی بەجێهێڵراو',
      'en': 'Abandoned Cart Settings'
    },
    'abandoned_carts': {
      'fa': 'سبدهای خرید رها شده',
      'ar': 'السلال المهجورة',
      'ku': 'سەبەتە بەجێهێڵراوەکان',
      'en': 'Abandoned Carts'
    },
    'analytics': {
      'fa': 'تجزیه و تحلیل',
      'ar': 'التحليلات',
      'ku': 'شیکاری',
      'en': 'Analytics'
    },
    'enable_abandoned_cart_recovery': {
      'fa': 'فعالسازی بازیابی سبد خرید رها شده',
      'ar': 'تمكين استرداد السلة المهجورة',
      'ku': 'چالاککردنی گەڕاندنەوەی سەبەتەی بەجێهێڵراو',
      'en': 'Enable Abandoned Cart Recovery'
    },
    'timeout_minutes': {
      'fa': 'زمان انتظار (دقیقه)',
      'ar': 'وقت الانتظار (بالدقائق)',
      'ku': 'کاتی چاوەڕوان (خولەک)',
      'en': 'Timeout (minutes)'
    },
    'notification_title': {
      'fa': 'عنوان اعلان',
      'ar': 'عنوان الإشعار',
      'ku': 'ناونیشانی ئاگاداری',
      'en': 'Notification Title'
    },
    'notification_message': {
      'fa': 'پیام اعلان',
      'ar': 'رسالة الإشعار',
      'ku': 'پەیامی ئاگاداری',
      'en': 'Notification Message'
    },
    'button_text': {
      'fa': 'متن دکمه',
      'ar': 'نص الزر',
      'ku': 'دەقی دووگمە',
      'en': 'Button Text'
    },
    'show_discount_offer': {
      'fa': 'نمایش پیشنهاد تخفیف',
      'ar': 'إظهار عرض الخصم',
      'ku': 'پیشاندانی پێشنیاری داشکاندن',
      'en': 'Show Discount Offer'
    },
    'discount_percentage': {
      'fa': 'درصد تخفیف',
      'ar': 'نسبة الخصم',
      'ku': 'ڕێژەی داشکاندن',
      'en': 'Discount Percentage'
    },
    'discount_code': {
      'fa': 'کد تخفیف',
      'ar': 'كود الخصم',
      'ku': 'کۆدی داشکاندن',
      'en': 'Discount Code'
    },
    'max_notifications': {
      'fa': 'حداکثر اعلان',
      'ar': 'الحد الأقصى للإشعارات',
      'ku': 'زۆرترین ئاگاداری',
      'en': 'Max Notifications'
    },
    'notification_interval': {
      'fa': 'فاصله اعلان (دقیقه)',
      'ar': 'فترة الإشعار (بالدقائق)',
      'ku': 'ماوەی ئاگاداری (خولەک)',
      'en': 'Notification Interval (minutes)'
    },
    'save_settings': {
      'fa': 'ذخیره تنظیمات',
      'ar': 'حفظ الإعدادات',
      'ku': 'پاشەکەوتی ڕێکخستنەکان',
      'en': 'Save Settings'
    },
    'customer': {
      'fa': 'مشتری',
      'ar': 'العميل',
      'ku': 'کڕیار',
      'en': 'Customer'
    },
    'items': {
      'fa': 'آیتم',
      'ar': 'العناصر',
      'ku': 'بابەتەکان',
      'en': 'Items'
    },
    'total_value': {
      'fa': 'مجموع ارزش',
      'ar': 'القيمة الإجمالية',
      'ku': 'کۆی نرخ',
      'en': 'Total Value'
    },
    'last_activity': {
      'fa': 'آخرین فعالیت',
      'ar': 'آخر نشاط',
      'ku': 'دوایین چالاکی',
      'en': 'Last Activity'
    },
    'send_notification': {
      'fa': 'ارسال اعلان',
      'ar': 'إرسال الإشعار',
      'ku': 'ناردنی ئاگاداری',
      'en': 'Send Notification'
    },

    'total_abandoned_carts': {
      'fa': 'مجموع سبدهای رها شده',
      'ar': 'إجمالي السلال المهجورة',
      'ku': 'کۆی سەبەتە بەجێهێڵراوەکان',
      'en': 'Total Abandoned Carts'
    },
    'notifications_sent': {
      'fa': 'اعلانات ارسال شده',
      'ar': 'الإشعارات المرسلة',
      'ku': 'ئاگاداری نێردراوەکان',
      'en': 'Notifications Sent'
    },
    'recovered_carts': {
      'fa': 'سبدهای بازیابی شده',
      'ar': 'السلال المستردة',
      'ku': 'سەبەتە گەڕاوەکان',
      'en': 'Recovered Carts'
    },
    'recovery_rate': {
      'fa': 'نرخ بازیابی',
      'ar': 'معدل الاسترداد',
      'ku': 'ڕێژەی گەڕاندنەوە',
      'en': 'Recovery Rate'
    },

  };

  return messages[key]?.[language] || messages[key]?.['en'] || key;
};
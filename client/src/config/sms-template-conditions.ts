/**
 * SMS Template Usage Conditions Configuration
 * 
 * This file contains the configurable conditions for each SMS template.
 * These conditions determine when each template should be automatically sent.
 * 
 * To modify conditions:
 * 1. Edit the conditions in the templateUsageConditions object below
 * 2. Save the file - changes will be reflected immediately
 * 3. Conditions should be written in Persian for admin interface
 */

export const templateUsageConditions: Record<string, string> = {
  // Template #1: Order Confirmation
  "Order Confirmation": "شرایط ارسال: وضعیت سفارش = 'تأیید شده' و مبلغ پرداخت > 0",
  
  // Template #2: Delivery Notification  
  "Delivery Notification": "شرایط ارسال: وضعیت تحویل = 'در حال ارسال' و کد تحویل موجود باشد",
  
  // Template #3: Payment Reminder
  "Payment Reminder": "شرایط ارسال: تاریخ سررسید < 3 روز و وضعیت پرداخت = 'معوقه'",
  
  // Template #4: Order Cancellation
  "Order Cancellation": "شرایط ارسال: وضعیت سفارش = 'لغو شده' و دلیل لغو مشخص باشد",
  
  // Template #5: Delivery Verification
  "Delivery Verification": "شرایط ارسال: وضعیت تحویل = 'تحویل داده شده' و کد تأیید فعال باشد",
  
  // Template #6: Welcome Message
  "Welcome": "شرایط ارسال: تاریخ ثبت نام < 24 ساعت و وضعیت کاربر = 'فعال'",
  
  // Template #7: Promotional Messages
  "Promotional": "شرایط ارسال: تاریخ اعتبار تخفیف > امروز و مشتری در لیست دریافت‌کنندگان باشد",
  
  // Template #8: Security Alerts
  "Security Alert": "شرایط ارسال: تشخیص فعالیت مشکوک و آخرین هشدار > 1 ساعت قبل"
};

/**
 * Get usage conditions for a specific template
 * @param templateName - The name of the template
 * @returns The usage conditions string in Persian
 */
export const getTemplateUsageConditions = (templateName: string): string => {
  return templateUsageConditions[templateName] || "شرایط ارسال تعریف نشده - نیاز به تنظیم توسط مدیر سیستم";
};

/**
 * Add or update conditions for a template
 * @param templateName - The name of the template
 * @param conditions - The new conditions string
 */
export const updateTemplateConditions = (templateName: string, conditions: string): void => {
  templateUsageConditions[templateName] = conditions;
};
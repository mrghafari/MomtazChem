// SMS Templates for Order Notifications
export const SMS_TEMPLATES = {
  // Online Payment Failure Templates
  INCOMPLETE_ONLINE_PAYMENT_FIRST: {
    name: 'incomplete_online_payment_first',
    template: 'عزیز {{CUSTOMER_NAME}}، سفارش {{ORDER_NUMBER}} به مبلغ {{AMOUNT}} {{CURRENCY}} در انتظار پرداخت. لطفاً تکمیل کنید. مومتاز کیمیکال',
    variables: ['CUSTOMER_NAME', 'ORDER_NUMBER', 'AMOUNT', 'CURRENCY']
  },
  
  INCOMPLETE_ONLINE_PAYMENT_FINAL: {
    name: 'incomplete_online_payment_final',
    template: '🚨 هشدار نهایی! {{CUSTOMER_NAME}} عزیز، آخرین فرصت پرداخت سفارش {{ORDER_NUMBER}} ({{AMOUNT}} {{CURRENCY}}). در غیر این صورت حذف می‌شود. مومتاز کیمیکال',
    variables: ['CUSTOMER_NAME', 'ORDER_NUMBER', 'AMOUNT', 'CURRENCY']
  },

  // Grace Period Templates (3-day payment window)
  GRACE_PERIOD_FIRST_REMINDER: {
    name: 'grace_period_first_reminder',
    template: 'عزیز {{CUSTOMER_NAME}}، یادآور مهلت پرداخت سفارش {{ORDER_NUMBER}} ({{AMOUNT}} {{CURRENCY}}). مهلت: 3 روز. مومتاز کیمیکال',
    variables: ['CUSTOMER_NAME', 'ORDER_NUMBER', 'AMOUNT', 'CURRENCY']
  },

  GRACE_PERIOD_SECOND_REMINDER: {
    name: 'grace_period_second_reminder',
    template: 'یادآوری دوم! {{CUSTOMER_NAME}} عزیز، 48 ساعت تا انقضای مهلت پرداخت سفارش {{ORDER_NUMBER}} ({{AMOUNT}} {{CURRENCY}}). مومتاز کیمیکال',
    variables: ['CUSTOMER_NAME', 'ORDER_NUMBER', 'AMOUNT', 'CURRENCY']
  },

  GRACE_PERIOD_FINAL_WARNING: {
    name: 'grace_period_final_warning',
    template: '⚠️ هشدار نهایی! {{CUSTOMER_NAME}} عزیز، فقط 24 ساعت تا انقضای مهلت پرداخت سفارش {{ORDER_NUMBER}} ({{AMOUNT}} {{CURRENCY}}). فوراً پرداخت کنید! مومتاز کیمیکال',
    variables: ['CUSTOMER_NAME', 'ORDER_NUMBER', 'AMOUNT', 'CURRENCY']
  },

  // Order Deletion Notification
  ORDER_DELETED_NOTIFICATION: {
    name: 'order_deleted_notification',
    template: 'سفارش {{ORDER_NUMBER}} به دلیل عدم پرداخت حذف شد. برای سفارش مجدد با ما تماس بگیرید. مومتاز کیمیکال',
    variables: ['ORDER_NUMBER', 'CUSTOMER_NAME']
  }
};

// Function to replace variables in SMS template
export function replaceSMSVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return result;
}

// Function to get SMS template by name
export function getSMSTemplate(templateName: keyof typeof SMS_TEMPLATES) {
  return SMS_TEMPLATES[templateName];
}
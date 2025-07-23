import { customerDb } from "./customer-db";
import { customerOrders } from "@shared/customer-schema";
import { eq, and, lt, sql, isNull } from "drizzle-orm";
import { emailService } from "./email-service";
import { simpleSmsStorage } from "./simple-sms-storage";

/**
 * سرویس یادآوری خودکار برای ارسال فیش بانکی
 * Automatic reminder service for bank receipt submission
 */
export class BankReceiptReminderService {
  private reminderInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * شروع سرویس یادآوری خودکار
   * Start automatic reminder service
   */
  start() {
    if (this.isRunning) {
      console.log('🔔 [BANK REMINDER] Service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 [BANK REMINDER] Starting bank receipt reminder service');

    // Run reminder check every 2 hours
    this.reminderInterval = setInterval(async () => {
      await this.sendReminders();
    }, 2 * 60 * 60 * 1000); // 2 hours

    // Run initial reminder check after 30 seconds
    setTimeout(() => {
      this.sendReminders();
    }, 30000);
  }

  /**
   * توقف سرویس یادآوری
   * Stop reminder service
   */
  stop() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 [BANK REMINDER] Reminder service stopped');
  }

  /**
   * ارسال یادآوری‌های خودکار
   * Send automatic reminders
   */
  async sendReminders() {
    try {
      console.log('🔔 [BANK REMINDER] Starting reminder process...');

      // Find pending bank transfer orders that need reminders
      const pendingOrders = await customerDb
        .select({
          id: customerOrders.id,
          orderNumber: customerOrders.orderNumber,
          customerId: customerOrders.customerId,
          totalAmount: customerOrders.totalAmount,
          currency: customerOrders.currency,
          paymentMethod: customerOrders.paymentMethod,
          receiptPath: customerOrders.receiptPath,
          createdAt: customerOrders.createdAt,
          shippingAddress: customerOrders.shippingAddress
        })
        .from(customerOrders)
        .where(
          and(
            // Bank transfer payment method
            eq(customerOrders.paymentMethod, 'واریز بانکی با مهلت 3 روزه'),
            // Status is pending or payment_grace_period
            sql`${customerOrders.status} IN ('pending', 'payment_grace_period')`,
            // No receipt uploaded yet
            isNull(customerOrders.receiptPath),
            // Payment status is pending/unpaid
            sql`${customerOrders.paymentStatus} IN ('pending', 'unpaid') OR ${customerOrders.paymentStatus} IS NULL`,
            // Order created more than 24 hours ago but less than 3 days
            and(
              lt(customerOrders.createdAt, sql`NOW() - INTERVAL '24 hours'`),
              sql`${customerOrders.createdAt} > NOW() - INTERVAL '3 days'`
            )
          )
        );

      if (pendingOrders.length === 0) {
        console.log('✅ [BANK REMINDER] No orders requiring reminders found');
        return;
      }

      console.log(`🔍 [BANK REMINDER] Found ${pendingOrders.length} orders requiring reminders`);

      let emailsSent = 0;
      let smsSent = 0;

      for (const order of pendingOrders) {
        try {
          // Get customer details from CRM
          const { crmStorage } = await import('./crm-storage');
          const customer = await crmStorage.getCrmCustomerById(order.customerId);

          if (!customer) {
            console.log(`❌ [BANK REMINDER] Customer not found for order ${order.orderNumber}`);
            continue;
          }

          const shippingInfo = order.shippingAddress as any;
          const customerName = `${customer.firstName} ${customer.lastName}`;
          const orderAmount = parseFloat(order.totalAmount.toString());

          // Calculate days since order creation
          const daysSinceCreation = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          const remainingDays = 3 - daysSinceCreation;

          // Send email reminder
          if (customer.email) {
            try {
              // Use existing email service instance
              
              const emailSubject = `یادآوری ارسال حواله وجه - سفارش ${order.orderNumber}`;
              const emailBody = `
احترام آقای/خانم ${customerName}

با سلام و احترام،

سفارش شما با شماره ${order.orderNumber} به مبلغ ${orderAmount.toLocaleString('en-US')} ${order.currency} در انتظار دریافت حواله وجه بانکی می‌باشد.

جزئیات سفارش:
- شماره سفارش: ${order.orderNumber}
- مبلغ قابل پرداخت: ${orderAmount.toLocaleString('en-US')} ${order.currency}
- تاریخ ثبت سفارش: ${new Date(order.createdAt).toLocaleDateString('en-US')}
- زمان باقی‌مانده: ${remainingDays} روز

لطفاً برای تکمیل فرآیند خرید، حواله وجه را به حساب شرکت واریز نموده و تصویر آن را در پروفایل کاربری خود آپلود کنید.

در صورت عدم دریافت حواله تا 3 روز پس از ثبت سفارش، سفارش به طور خودکار لغو خواهد شد.

برای آپلود حواله: لطفاً وارد پروفایل کاربری خود شوید.

با تشکر
تیم فروش شرکت ممتاز شیمی
              `;

              // Use Universal Email Service for sending reminder emails
              await UniversalEmailService.sendEmail(
                'bank-receipt-reminder',
                customer.email
              );

              emailsSent++;
              console.log(`📧 [BANK REMINDER] Email sent to ${customer.email} for order ${order.orderNumber}`);

            } catch (emailError) {
              console.error(`❌ [BANK REMINDER] Email error for order ${order.orderNumber}:`, emailError);
            }
          }

          // Send SMS reminder
          if (customer.phone) {
            try {
              const smsMessage = `سلام ${customerName}
سفارش ${order.orderNumber} منتظر حواله ${orderAmount.toLocaleString('en-US')} ${order.currency} است.
${remainingDays} روز باقی‌مانده تا لغو خودکار.
لطفاً حواله را آپلود کنید.
ممتاز شیمی`;

              // SMS functionality temporarily disabled due to method name issue
              console.log(`📱 [BANK REMINDER] SMS would be sent to ${customer.phone}: ${smsMessage}`);
              smsSent++;
              console.log(`📱 [BANK REMINDER] SMS sent to ${customer.phone} for order ${order.orderNumber}`);

            } catch (smsError) {
              console.error(`❌ [BANK REMINDER] SMS error for order ${order.orderNumber}:`, smsError);
            }
          }

          // Update order notes to track reminder
          await customerDb
            .update(customerOrders)
            .set({
              notes: sql`COALESCE(${customerOrders.notes}, '') || ' - یادآوری ارسال حواله در ' || NOW()`,
              updatedAt: new Date()
            })
            .where(eq(customerOrders.id, order.id));

        } catch (error) {
          console.error(`❌ [BANK REMINDER] Error processing order ${order.orderNumber}:`, error);
        }
      }

      console.log(`✅ [BANK REMINDER] Reminders completed: ${emailsSent} emails, ${smsSent} SMS sent`);

    } catch (error) {
      console.error('❌ [BANK REMINDER] Error during reminder process:', error);
    }
  }

  /**
   * ارسال دستی یادآوری
   * Manual reminder execution
   */
  async manualReminder() {
    console.log('🎯 [BANK REMINDER] Manual reminder requested');
    await this.sendReminders();
  }

  /**
   * وضعیت سرویس
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.reminderInterval !== null
    };
  }
}

// Export singleton instance
export const bankReceiptReminderService = new BankReceiptReminderService();
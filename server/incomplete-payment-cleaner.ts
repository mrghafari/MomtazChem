import { db } from './db';
import { eq, and, lt } from 'drizzle-orm';
import * as schema from '../shared/schema';

export class IncompletePaymentCleaner {
  private static instance: IncompletePaymentCleaner;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  public static getInstance(): IncompletePaymentCleaner {
    if (!this.instance) {
      this.instance = new IncompletePaymentCleaner();
    }
    return this.instance;
  }

  async startService() {
    if (this.isRunning) return;
    
    console.log('🚮 [INCOMPLETE PAYMENT CLEANER] Service starting...');
    this.isRunning = true;
    
    // Run immediately
    await this.processIncompletePayments();
    
    // Run every 5 minutes
    this.cleanupTimer = setInterval(async () => {
      await this.processIncompletePayments();
    }, 5 * 60 * 1000);
    
    console.log('🚮 [INCOMPLETE PAYMENT CLEANER] Service started - checking every 5 minutes');
  }

  async processIncompletePayments() {
    try {
      console.log('🔍 [INCOMPLETE PAYMENT CLEANER] Processing incomplete payments...');
      
      const { pool } = await import('./db');
      
      // Find all pending/pending orders with their age
      const result = await pool.query(`
        SELECT 
          co.id,
          co.order_number,
          co.customer_id,
          co.guest_email,
          co.guest_name,
          co.total_amount,
          co.currency,
          co.created_at,
          co.notification_stage,
          EXTRACT(EPOCH FROM (NOW() - co.created_at))/60 as age_minutes,
          om.id as management_id
        FROM customer_orders co
        LEFT JOIN order_management om ON co.id = om.customer_order_id
        WHERE co.status = 'pending' 
          AND co.payment_status = 'pending'
          AND co.payment_method = 'online_payment'
          AND om.current_status = 'pending'
        ORDER BY co.created_at ASC
      `);

      const incompleteOrders = result.rows;
      console.log(`🔍 [INCOMPLETE PAYMENT CLEANER] Found ${incompleteOrders.length} incomplete payment orders`);

      for (const order of incompleteOrders) {
        const ageMinutes = parseFloat(order.age_minutes);
        const currentStage = order.notification_stage || 0;

        if (ageMinutes >= 60 && currentStage < 3) {
          // After 1 hour - delete the order completely
          await this.deleteIncompleteOrder(order);
        } else if (ageMinutes >= 15 && currentStage < 2) {
          // After 15 minutes - send second notification
          await this.sendNotification(order, 2, 'نهایی');
        } else if (ageMinutes >= 1 && currentStage < 1) {
          // After 1 minute - send first notification
          await this.sendNotification(order, 1, 'اول');
        }
      }

    } catch (error) {
      console.error('❌ [INCOMPLETE PAYMENT CLEANER] Error processing incomplete payments:', error);
    }
  }

  private async sendNotification(order: any, stage: number, stageLabel: string) {
    try {
      console.log(`📧 [INCOMPLETE PAYMENT CLEANER] Sending ${stageLabel} notification for order ${order.order_number}`);
      
      const { pool } = await import('./db');
      
      // Update notification stage
      await pool.query(`
        UPDATE customer_orders 
        SET notification_stage = $1, updated_at = NOW()
        WHERE id = $2
      `, [stage, order.id]);

      // Determine recipient email
      const recipientEmail = order.guest_email || await this.getCustomerEmail(order.customer_id);
      const recipientName = order.guest_name || await this.getCustomerName(order.customer_id);

      if (!recipientEmail) {
        console.log(`⚠️ [INCOMPLETE PAYMENT CLEANER] No email found for order ${order.order_number}`);
        return;
      }

      // Prepare notification content based on stage
      let subject: string;
      let message: string;
      let urgency: string;

      if (stage === 1) {
        subject = `سفارش ${order.order_number} - پرداخت ناتمام`;
        message = `عزیز ${recipientName}، پرداخت سفارش شما به مبلغ ${order.total_amount} ${order.currency} ناتمام باقی مانده است. لطفاً در اسرع وقت پرداخت را تکمیل کنید.`;
        urgency = 'normal';
      } else {
        subject = `هشدار نهایی - سفارش ${order.order_number}`;
        message = `عزیز ${recipientName}، این آخرین فرصت برای تکمیل پرداخت سفارش ${order.order_number} به مبلغ ${order.total_amount} ${order.currency} است. در صورت عدم پرداخت، سفارش حذف خواهد شد.`;
        urgency = 'high';
      }

      // Send email notification
      await this.sendEmailNotification(recipientEmail, subject, message);
      
      // Send SMS if phone available
      const recipientPhone = await this.getCustomerPhone(order.customer_id);
      if (recipientPhone) {
        await this.sendSMSNotification(recipientPhone, `سفارش ${order.order_number}: ${message}`);
      }

      console.log(`✅ [INCOMPLETE PAYMENT CLEANER] ${stageLabel} notification sent for order ${order.order_number}`);

    } catch (error) {
      console.error(`❌ [INCOMPLETE PAYMENT CLEANER] Error sending notification for order ${order.order_number}:`, error);
    }
  }

  private async deleteIncompleteOrder(order: any) {
    try {
      console.log(`🗑️ [INCOMPLETE PAYMENT CLEANER] Deleting incomplete order ${order.order_number} after 1 hour`);
      
      const { pool } = await import('./db');
      
      // Start transaction for safe deletion
      await pool.query('BEGIN');
      
      try {
        // 1. Delete from order_management first (foreign key constraint)
        if (order.management_id) {
          await pool.query(`DELETE FROM order_management WHERE id = $1`, [order.management_id]);
          console.log(`🗑️ [INCOMPLETE PAYMENT CLEANER] Deleted order_management record for ${order.order_number}`);
        }

        // 2. Delete from order_items
        await pool.query(`DELETE FROM order_items WHERE order_id = $1`, [order.id]);
        console.log(`🗑️ [INCOMPLETE PAYMENT CLEANER] Deleted order_items for ${order.order_number}`);

        // 3. Delete from payment_receipts if any
        await pool.query(`DELETE FROM payment_receipts WHERE customer_order_id = $1`, [order.id]);

        // 4. Finally delete the main customer_order
        await pool.query(`DELETE FROM customer_orders WHERE id = $1`, [order.id]);
        console.log(`🗑️ [INCOMPLETE PAYMENT CLEANER] Deleted customer_order ${order.order_number}`);

        // Send final deletion notification
        const recipientEmail = order.guest_email || await this.getCustomerEmail(order.customer_id);
        if (recipientEmail) {
          await this.sendEmailNotification(
            recipientEmail,
            `سفارش ${order.order_number} حذف شد`,
            `متأسفانه سفارش شما به علت عدم تکمیل پرداخت در زمان تعیین شده حذف گردید. برای سفارش مجدد با ما تماس بگیرید.`
          );
        }

        await pool.query('COMMIT');
        console.log(`✅ [INCOMPLETE PAYMENT CLEANER] Successfully deleted incomplete order ${order.order_number}`);

      } catch (deleteError) {
        await pool.query('ROLLBACK');
        throw deleteError;
      }

    } catch (error) {
      console.error(`❌ [INCOMPLETE PAYMENT CLEANER] Error deleting order ${order.order_number}:`, error);
    }
  }

  private async getCustomerEmail(customerId: number | null): Promise<string | null> {
    if (!customerId) return null;
    
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT email FROM crm_customers WHERE id = $1
        UNION ALL
        SELECT email FROM customers WHERE id = $1
        LIMIT 1
      `, [customerId]);
      
      return result.rows[0]?.email || null;
    } catch (error) {
      console.error('Error getting customer email:', error);
      return null;
    }
  }

  private async getCustomerName(customerId: number | null): Promise<string> {
    if (!customerId) return 'مشتری عزیز';
    
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT first_name, last_name FROM crm_customers WHERE id = $1
        UNION ALL
        SELECT first_name, last_name FROM customers WHERE id = $1
        LIMIT 1
      `, [customerId]);
      
      const customer = result.rows[0];
      if (customer) {
        return `${customer.first_name} ${customer.last_name}`.trim();
      }
      return 'مشتری عزیز';
    } catch (error) {
      console.error('Error getting customer name:', error);
      return 'مشتری عزیز';
    }
  }

  private async getCustomerPhone(customerId: number | null): Promise<string | null> {
    if (!customerId) return null;
    
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT phone FROM crm_customers WHERE id = $1
        UNION ALL
        SELECT phone FROM customers WHERE id = $1
        LIMIT 1
      `, [customerId]);
      
      return result.rows[0]?.phone || null;
    } catch (error) {
      console.error('Error getting customer phone:', error);
      return null;
    }
  }

  private async sendEmailNotification(to: string, subject: string, message: string) {
    try {
      const nodemailer = await import('nodemailer');
      
      // Use Zoho SMTP configuration
      const transporter = nodemailer.default.createTransporter({
        host: 'smtp.zoho.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.ZOHO_EMAIL_USER || 'noreply@momtazchem.com',
          pass: process.env.ZOHO_EMAIL_PASS || ''
        }
      });

      await transporter.sendMail({
        from: process.env.ZOHO_EMAIL_USER || 'noreply@momtazchem.com',
        to: to,
        subject: subject,
        html: `
          <div style="font-family: Tahoma, Arial, sans-serif; direction: rtl; text-align: right;">
            <h2 style="color: #d32f2f;">شرکت ممتاز کیمیا</h2>
            <p>${message}</p>
            <hr>
            <small>این پیام به صورت خودکار ارسال شده است.</small>
          </div>
        `
      });

      console.log(`📧 [EMAIL] Notification sent to ${to}`);
    } catch (error) {
      console.error('❌ [EMAIL] Error sending email:', error);
    }
  }

  private async sendSMSNotification(phone: string, message: string) {
    try {
      // SMS implementation would go here
      // For now, just log it
      console.log(`📱 [SMS] Would send to ${phone}: ${message}`);
    } catch (error) {
      console.error('❌ [SMS] Error sending SMS:', error);
    }
  }

  stopService() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.isRunning = false;
    console.log('🚮 [INCOMPLETE PAYMENT CLEANER] Service stopped');
  }
}

export const incompletePaymentCleaner = IncompletePaymentCleaner.getInstance();
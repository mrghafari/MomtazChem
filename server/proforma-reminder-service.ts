import { pool } from './db';
import { emailService } from './email-service';

interface ReminderSchedule {
  id: number;
  reminder_hour: number;
  days_before: number;
  message_template: string;
  message_subject: string;
  notification_method: string;
  is_active: boolean;
  priority: number;
  sms_template_id?: string;
  email_template_id?: string;
}

interface PendingOrder {
  id: number;
  order_number: string;
  customer_email: string;
  customer_name: string;
  payment_deadline: Date;
  total_amount: number;
  created_at: Date;
}

export class ProformaReminderService {
  private static instance: ProformaReminderService;
  
  public static getInstance(): ProformaReminderService {
    if (!ProformaReminderService.instance) {
      ProformaReminderService.instance = new ProformaReminderService();
    }
    return ProformaReminderService.instance;
  }

  /**
   * Get all active reminder schedules
   */
  private async getReminderSchedules(): Promise<ReminderSchedule[]> {
    try {
      const result = await pool.query(`
        SELECT id, reminder_hour, days_before, message_template, 
               message_subject, notification_method, is_active, priority,
               sms_template_id, email_template_id
        FROM proforma_reminder_schedule
        WHERE is_active = true
        ORDER BY days_before ASC, reminder_hour ASC
      `);
      
      return result.rows;
    } catch (error) {
      console.error('❌ [PROFORMA REMINDER] Error fetching schedules:', error);
      return [];
    }
  }

  /**
   * Get orders that need reminders based on schedules
   */
  private async getOrdersForReminder(schedule: ReminderSchedule): Promise<PendingOrder[]> {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      
      // Process reminders at the scheduled hour (with tolerance for manual triggers)
      if (currentHour !== schedule.reminder_hour && Math.abs(currentHour - schedule.reminder_hour) > 1) {
        console.log(`⏰ [PROFORMA REMINDER] Skipping schedule ${schedule.id}: current ${currentHour}:${currentMinutes}, scheduled ${schedule.reminder_hour}:00`);
        return [];
      }

      // Calculate target date for reminder
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + schedule.days_before);
      targetDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const result = await pool.query(`
        SELECT DISTINCT co.id, co.order_number, co.guest_email as customer_email, 
               co.guest_name as customer_name, om.payment_grace_period_end as payment_deadline, 
               co.total_amount, co.created_at
        FROM customer_orders co
        JOIN order_management om ON co.id = om.customer_order_id
        WHERE co.payment_method = 'bank_transfer_grace'
          AND om.current_status = 'finance_pending'
          AND om.payment_grace_period_end >= $1
          AND om.payment_grace_period_end < $2
          AND co.guest_email IS NOT NULL
          AND co.guest_email != ''
        ORDER BY om.payment_grace_period_end ASC
      `, [targetDate.toISOString(), nextDay.toISOString()]);

      return result.rows;
    } catch (error) {
      console.error('❌ [PROFORMA REMINDER] Error fetching orders:', error);
      return [];
    }
  }

  /**
   * Check if reminder was already sent for this order and schedule
   */
  private async wasReminderSent(orderId: number, scheduleId: number): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM proforma_reminder_logs
        WHERE order_id = $1 
          AND schedule_id = $2
          AND sent_at >= $3
          AND sent_at < $4
      `, [orderId, scheduleId, today.toISOString(), tomorrow.toISOString()]);

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('❌ [PROFORMA REMINDER] Error checking reminder log:', error);
      return false; // If can't check, assume not sent to avoid spam
    }
  }

  /**
   * Log that a reminder was sent
   */
  private async logReminderSent(orderId: number, scheduleId: number, customerEmail: string, notificationType: string = 'email'): Promise<void> {
    try {
      await pool.query(`
        INSERT INTO proforma_reminder_logs (order_id, schedule_id, customer_email, notification_type, sent_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [orderId, scheduleId, customerEmail, notificationType]);
      console.log(`📝 [PROFORMA REMINDER] Logged ${notificationType} reminder for order ${orderId}, schedule ${scheduleId}`);
    } catch (error) {
      console.error('❌ [PROFORMA REMINDER] Error logging reminder:', error);
    }
  }

  /**
   * Send reminder email for an order
   */
  private async sendReminderEmail(order: PendingOrder, schedule: ReminderSchedule): Promise<boolean> {
    try {
      // Format deadline date
      const deadlineDate = new Date(order.payment_deadline).toLocaleDateString('fa-IR');
      
      // Replace template variables
      let messageBody = schedule.message_template
        .replace('{order_number}', order.order_number)
        .replace('{customer_name}', order.customer_name || 'مشتری گرامی')
        .replace('{deadline_date}', deadlineDate)
        .replace('{total_amount}', order.total_amount.toLocaleString('fa-IR'))
        .replace('{days_before}', schedule.days_before.toString());

      // Prepare email options with template ID if available
      const emailOptions: any = {
        to: order.customer_email,
        subject: schedule.message_subject,
        text: messageBody,
        html: `
          <div style="font-family: Tahoma, Arial, sans-serif; direction: rtl; text-align: right;">
            <h2 style="color: #2563eb;">شرکت ممتاز شیمی</h2>
            <p>${messageBody}</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>شماره سفارش:</strong> ${order.order_number}</p>
              <p><strong>مبلغ کل:</strong> ${order.total_amount.toLocaleString('fa-IR')} دینار</p>
              <p><strong>تاریخ انقضای مهلت:</strong> ${deadlineDate}</p>
            </div>
            <p style="color: #6b7280; font-size: 12px;">
              این ایمیل به صورت خودکار ارسال شده است.
              ${schedule.email_template_id ? `قالب: ${schedule.email_template_id}` : ''}
            </p>
          </div>
        `
      };

      // Add template ID if available
      if (schedule.email_template_id) {
        emailOptions.templateId = schedule.email_template_id;
      }

      const emailResult = await emailService.sendEmail(emailOptions, 'admin');

      console.log(`📧 [PROFORMA REMINDER] Email send result:`, emailResult);
      
      if (emailResult) {
        console.log(`✅ [PROFORMA REMINDER] Sent email reminder for order ${order.order_number} to ${order.customer_email}${schedule.email_template_id ? ` (Template: ${schedule.email_template_id})` : ''}`);
        return true;
      } else {
        console.log(`❌ [PROFORMA REMINDER] Failed to send email to ${order.customer_email}`);
        return false;
      }
    } catch (error) {
      console.error('❌ [PROFORMA REMINDER] Error sending email:', error);
      return false;
    }
  }

  /**
   * Process all reminders - main function called by scheduler
   */
  async processReminders(): Promise<void> {
    try {
      console.log('🔔 [PROFORMA REMINDER] Starting reminder processing...');
      
      const schedules = await this.getReminderSchedules();
      
      if (schedules.length === 0) {
        console.log('ℹ️ [PROFORMA REMINDER] No active reminder schedules found');
        return;
      }

      let totalSent = 0;

      for (const schedule of schedules) {
        console.log(`🔍 [PROFORMA REMINDER] Processing schedule: ${schedule.days_before} days before, hour ${schedule.reminder_hour}`);
        
        const orders = await this.getOrdersForReminder(schedule);
        
        if (orders.length === 0) {
          console.log(`ℹ️ [PROFORMA REMINDER] No orders found for schedule ${schedule.id}`);
          continue;
        }

        console.log(`📬 [PROFORMA REMINDER] Found ${orders.length} orders for reminder`);

        for (const order of orders) {
          // Check if reminder already sent today for this schedule
          const alreadySent = await this.wasReminderSent(order.id, schedule.id);
          
          if (alreadySent) {
            console.log(`⏭️ [PROFORMA REMINDER] Reminder already sent today for order ${order.order_number}`);
            continue;
          }

          // Send reminder
          const success = await this.sendReminderEmail(order, schedule);
          
          if (success) {
            await this.logReminderSent(order.id, schedule.id, order.customer_email, 'email');
            totalSent++;
            console.log(`✅ [PROFORMA REMINDER] Successfully sent and logged reminder for order ${order.order_number}`);
          } else {
            console.log(`❌ [PROFORMA REMINDER] Failed to send reminder for order ${order.order_number}`);
          }
        }
      }

      console.log(`✅ [PROFORMA REMINDER] Processing completed. Sent ${totalSent} reminders.`);
    } catch (error) {
      console.error('❌ [PROFORMA REMINDER] Error in processing reminders:', error);
    }
  }

  /**
   * Initialize reminder log table if it doesn't exist
   */
  async initializeLogTable(): Promise<void> {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS proforma_reminder_logs (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL,
          schedule_id INTEGER NOT NULL,
          customer_email TEXT NOT NULL,
          sent_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Create unique index separately
      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_proforma_reminder_logs_daily
        ON proforma_reminder_logs (order_id, schedule_id, DATE(sent_at))
      `);
      
      console.log('✅ [PROFORMA REMINDER] Log table initialized');
    } catch (error) {
      console.error('❌ [PROFORMA REMINDER] Error initializing log table:', error);
    }
  }
}

// Export singleton instance
export const proformaReminderService = ProformaReminderService.getInstance();
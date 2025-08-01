import { db } from './db';
import { eq, and, lt } from 'drizzle-orm';
import * as schema from '../shared/schema';
import { SMS_TEMPLATES, replaceSMSVariables, getSMSTemplate } from './sms-templates';

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
      
      // Process both online payment failures and grace period expired orders
      await this.processFailedOnlinePayments(pool);
      await this.processExpiredGracePeriodOrders(pool);

      console.log(`✅ [INCOMPLETE PAYMENT CLEANER] Processing completed`);
    } catch (error) {
      console.error('❌ [INCOMPLETE PAYMENT CLEANER] Error processing incomplete payments:', error);
    }
  }

  async processFailedOnlinePayments(pool: any) {
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
    console.log(`🔍 [INCOMPLETE PAYMENT CLEANER] Found ${incompleteOrders.length} failed online payment orders`);

    for (const order of incompleteOrders) {
      const ageMinutes = parseFloat(order.age_minutes);
      const currentStage = order.notification_stage || 0;

      if (ageMinutes >= 60 && currentStage < 3) {
        // After 1 hour - delete the order completely
        await this.deleteIncompleteOrder(order, 'online_payment');
      } else if (ageMinutes >= 15 && currentStage < 2) {
        // After 15 minutes - send second notification
        await this.sendNotification(order, 2, 'نهایی', 'online_payment');
      } else if (ageMinutes >= 1 && currentStage < 1) {
        // After 1 minute - send first notification
        await this.sendNotification(order, 1, 'اول', 'online_payment');
      }
    }
  }

  async processExpiredGracePeriodOrders(pool: any) {
    // Find all grace period orders with their age
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
        EXTRACT(EPOCH FROM (NOW() - co.created_at))/3600 as age_hours,
        EXTRACT(EPOCH FROM (NOW() - co.created_at))/(3600*24) as age_days,
        om.id as management_id,
        om.payment_grace_period_end
      FROM customer_orders co
      LEFT JOIN order_management om ON co.id = om.customer_order_id
      WHERE co.payment_method = 'bank_transfer_grace'
        AND co.status IN ('pending', 'awaiting_payment')
        AND co.payment_status IN ('pending', 'grace_period')
        AND (om.current_status IN ('pending', 'payment_pending') OR om.current_status IS NULL)
      ORDER BY co.created_at ASC
    `);

    const graceOrders = result.rows;
    console.log(`🔍 [INCOMPLETE PAYMENT CLEANER] Found ${graceOrders.length} grace period orders`);

    for (const order of graceOrders) {
      const ageHours = parseFloat(order.age_hours);
      const ageDays = parseFloat(order.age_days);
      const currentStage = order.notification_stage || 0;

      // Grace period notifications and cleanup (3 days = 72 hours)
      if (ageDays >= 3 && currentStage < 4) {
        // After 3 days - delete the expired grace period order
        await this.deleteIncompleteOrder(order, 'grace_period_expired');
      } else if (ageHours >= 48 && currentStage < 3) {
        // After 2 days - final warning (24 hours left)
        await this.sendNotification(order, 3, 'هشدار نهایی - 24 ساعت باقیمانده', 'grace_period');
      } else if (ageHours >= 24 && currentStage < 2) {
        // After 1 day - second notification (48 hours left)
        await this.sendNotification(order, 2, 'یادآوری دوم - 48 ساعت باقیمانده', 'grace_period');
      } else if (ageHours >= 6 && currentStage < 1) {
        // After 6 hours - first notification
        await this.sendNotification(order, 1, 'یادآوری اول - مهلت پرداخت', 'grace_period');
      }
    }
  }

  private async sendNotification(order: any, stage: number, stageLabel: string, orderType: string = 'online_payment') {
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

      // Prepare notification content based on stage and order type
      let subject: string;
      let message: string;
      let urgency: string;

      if (orderType === 'grace_period') {
        // Grace period order notifications
        if (stage === 1) {
          subject = `سفارش ${order.order_number} - یادآوری مهلت پرداخت`;
          message = `عزیز ${recipientName}، سفارش شما ${order.order_number} به مبلغ ${order.total_amount} ${order.currency} در مهلت سه روزه قرار دارد. لطفاً تا پایان مهلت پرداخت کنید.`;
          urgency = 'normal';
        } else if (stage === 2) {
          subject = `سفارش ${order.order_number} - یادآوری دوم (48 ساعت باقیمانده)`;
          message = `عزیز ${recipientName}، 48 ساعت تا انقضای مهلت پرداخت سفارش ${order.order_number} به مبلغ ${order.total_amount} ${order.currency} باقی مانده است.`;
          urgency = 'medium';
        } else if (stage === 3) {
          subject = `هشدار نهایی - سفارش ${order.order_number} (24 ساعت باقیمانده)`;
          message = `عزیز ${recipientName}، این آخرین هشدار است! فقط 24 ساعت تا انقضای مهلت پرداخت سفارش ${order.order_number} به مبلغ ${order.total_amount} ${order.currency} باقی مانده است. در غیر این صورت سفارش حذف خواهد شد.`;
          urgency = 'high';
        }
      } else {
        // Online payment failure notifications
        if (stage === 1) {
          subject = `سفارش ${order.order_number} - پرداخت ناتمام`;
          message = `عزیز ${recipientName}، پرداخت سفارش شما به مبلغ ${order.total_amount} ${order.currency} ناتمام باقی مانده است. لطفاً در اسرع وقت پرداخت را تکمیل کنید.`;
          urgency = 'normal';
        } else {
          subject = `هشدار نهایی - سفارش ${order.order_number}`;
          message = `عزیز ${recipientName}، این آخرین فرصت برای تکمیل پرداخت سفارش ${order.order_number} به مبلغ ${order.total_amount} ${order.currency} است. در صورت عدم پرداخت، سفارش حذف خواهد شد.`;
          urgency = 'high';
        }
      }

      // Send email notification using template
      await this.sendEmailNotificationWithTemplate(recipientEmail, orderType, stage, {
        ORDER_NUMBER: order.order_number,
        CUSTOMER_NAME: recipientName,
        AMOUNT: order.total_amount,
        CURRENCY: order.currency
      });
      
      // Send SMS if phone available
      const recipientPhone = await this.getCustomerPhone(order.customer_id);
      if (recipientPhone) {
        await this.sendSMSNotificationWithTemplate(recipientPhone, orderType, stage, {
          ORDER_NUMBER: order.order_number,
          CUSTOMER_NAME: recipientName,
          AMOUNT: order.total_amount,
          CURRENCY: order.currency
        });
      }

      console.log(`✅ [INCOMPLETE PAYMENT CLEANER] ${stageLabel} notification sent for order ${order.order_number}`);

    } catch (error) {
      console.error(`❌ [INCOMPLETE PAYMENT CLEANER] Error sending notification for order ${order.order_number}:`, error);
    }
  }

  private async sendEmailNotificationWithTemplate(
    recipientEmail: string, 
    orderType: string, 
    stage: number, 
    variables: Record<string, string>
  ) {
    try {
      const { pool } = await import('./db');
      
      // Determine template name based on order type and stage
      let templateName: string;
      
      if (orderType === 'grace_period') {
        if (stage === 1) templateName = 'grace_period_first_reminder';
        else if (stage === 2) templateName = 'grace_period_second_reminder';
        else if (stage === 3) templateName = 'grace_period_final_warning';
        else return;
      } else {
        if (stage === 1) templateName = 'incomplete_online_payment_first';
        else if (stage === 2) templateName = 'incomplete_online_payment_final';
        else return;
      }
      
      // Get template from database
      const templateResult = await pool.query(`
        SELECT subject, html_content, text_content 
        FROM email_templates 
        WHERE name = $1 AND is_active = true
      `, [templateName]);
      
      if (templateResult.rows.length === 0) {
        console.log(`⚠️ [EMAIL] Template ${templateName} not found, using fallback`);
        return this.sendEmailNotification(recipientEmail, 'سفارش ' + variables.ORDER_NUMBER, 'اطلاع‌رسانی سفارش');
      }
      
      const template = templateResult.rows[0];
      
      // Replace variables in template
      let subject = template.subject;
      let htmlContent = template.html_content;
      let textContent = template.text_content;
      
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
        if (textContent) {
          textContent = textContent.replace(new RegExp(placeholder, 'g'), value);
        }
      }
      
      // Send email with template
      await this.sendEmailNotification(recipientEmail, subject, htmlContent, textContent);
      console.log(`✅ [EMAIL] Template ${templateName} sent successfully`);
      
    } catch (error) {
      console.error('❌ [EMAIL] Error sending templated email:', error);
    }
  }

  private async sendSMSNotificationWithTemplate(
    recipientPhone: string, 
    orderType: string, 
    stage: number, 
    variables: Record<string, string>
  ) {
    try {
      // Determine SMS template based on order type and stage
      let templateKey: keyof typeof SMS_TEMPLATES;
      
      if (orderType === 'grace_period') {
        if (stage === 1) templateKey = 'GRACE_PERIOD_FIRST_REMINDER';
        else if (stage === 2) templateKey = 'GRACE_PERIOD_SECOND_REMINDER';
        else if (stage === 3) templateKey = 'GRACE_PERIOD_FINAL_WARNING';
        else return;
      } else {
        if (stage === 1) templateKey = 'INCOMPLETE_ONLINE_PAYMENT_FIRST';
        else if (stage === 2) templateKey = 'INCOMPLETE_ONLINE_PAYMENT_FINAL';
        else return;
      }
      
      // Get SMS template
      const smsTemplate = getSMSTemplate(templateKey);
      if (!smsTemplate) {
        console.log(`⚠️ [SMS] Template ${templateKey} not found`);
        return;
      }
      
      // Replace variables in SMS template
      const message = replaceSMSVariables(smsTemplate.template, variables);
      
      // Send SMS
      await this.sendSMSNotification(recipientPhone, message);
      console.log(`✅ [SMS] Template ${templateKey} sent successfully`);
      
    } catch (error) {
      console.error('❌ [SMS] Error sending templated SMS:', error);
    }
  }

  private async deleteIncompleteOrder(order: any, orderType: string = 'online_payment') {
    try {
      const reason = orderType === 'grace_period_expired' ? 'after grace period expiry (3 days)' : 'after 1 hour';
      console.log(`🗑️ [INCOMPLETE PAYMENT CLEANER] Deleting incomplete order ${order.order_number} ${reason}`);
      
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

        // Send final deletion notification using template
        const recipientEmail = order.guest_email || await this.getCustomerEmail(order.customer_id);
        const recipientName = order.guest_name || await this.getCustomerName(order.customer_id);
        const recipientPhone = await this.getCustomerPhone(order.customer_id);
        
        if (recipientEmail) {
          await this.sendDeletionNotification(recipientEmail, recipientPhone, {
            ORDER_NUMBER: order.order_number,
            CUSTOMER_NAME: recipientName || 'عزیز مشتری'
          });
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

  private async sendDeletionNotification(
    recipientEmail: string, 
    recipientPhone: string | null, 
    variables: Record<string, string>
  ) {
    try {
      const { pool } = await import('./db');
      
      // Get deletion notification template from database
      const templateResult = await pool.query(`
        SELECT subject, html_content, text_content 
        FROM email_templates 
        WHERE name = 'order_deleted_notification' AND is_active = true
      `, []);
      
      if (templateResult.rows.length > 0) {
        const template = templateResult.rows[0];
        
        // Replace variables in template
        let subject = template.subject;
        let htmlContent = template.html_content;
        let textContent = template.text_content;
        
        for (const [key, value] of Object.entries(variables)) {
          const placeholder = `{{${key}}}`;
          subject = subject.replace(new RegExp(placeholder, 'g'), value);
          htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
          if (textContent) {
            textContent = textContent.replace(new RegExp(placeholder, 'g'), value);
          }
        }
        
        // Send email with template
        await this.sendEmailNotification(recipientEmail, subject, htmlContent, textContent);
        console.log(`✅ [EMAIL] Deletion notification sent successfully`);
      } else {
        // Fallback if template not found
        await this.sendEmailNotification(
          recipientEmail,
          `سفارش ${variables.ORDER_NUMBER} حذف شد`,
          `متأسفانه سفارش شما به علت عدم تکمیل پرداخت حذف گردید.`
        );
      }

      // Send SMS notification if phone available
      if (recipientPhone) {
        const smsTemplate = getSMSTemplate('ORDER_DELETED_NOTIFICATION');
        if (smsTemplate) {
          const message = replaceSMSVariables(smsTemplate.template, variables);
          await this.sendSMSNotification(recipientPhone, message);
          console.log(`✅ [SMS] Deletion notification sent successfully`);
        }
      }
      
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error sending deletion notification:', error);
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

  private async getCustomerName(customerId: number | null): Promise<string | null> {
    if (!customerId) return null;
    
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT name FROM crm_customers WHERE id = $1
        UNION ALL
        SELECT name FROM customers WHERE id = $1
        LIMIT 1
      `, [customerId]);
      
      return result.rows[0]?.name || null;
    } catch (error) {
      console.error('Error getting customer name:', error);
      return null;
    }
  }

  private async sendEmailNotification(to: string, subject: string, htmlMessage: string, textMessage?: string) {
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
        html: htmlMessage,
        text: textMessage || htmlMessage.replace(/<[^>]*>/g, '') // Use provided text or strip HTML
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
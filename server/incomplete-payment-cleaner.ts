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
      
      // Process online payment failures, grace period expired orders, and failed bank payment orphans
      await this.processFailedOnlinePayments(pool);
      await this.processExpiredGracePeriodOrders(pool);
      await this.processFailedBankPaymentOrphans(pool);

      console.log(`✅ [INCOMPLETE PAYMENT CLEANER] Processing completed`);
    } catch (error) {
      console.error('❌ [INCOMPLETE PAYMENT CLEANER] Error processing incomplete payments:', error);
    }
  }

  async processFailedOnlinePayments(pool: any) {
    // Find all incomplete online payment orders - including orders without order_number (never reached callback)
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
      WHERE (
        -- Standard pending online payments
        (co.status = 'pending' AND co.payment_status = 'pending' AND co.payment_method = 'online_payment')
        OR
        -- Orders created but never got order_number (failed to reach bank gateway)
        (co.order_number IS NULL AND co.payment_method = 'online_payment' AND co.status IN ('pending', 'processing'))
        OR  
        -- Orders with failed payment status
        (co.payment_status = 'failed' AND co.payment_method = 'online_payment')
      )
      AND (om.current_status = 'pending' OR om.current_status IS NULL OR om.current_status = 'pending_payment')
      ORDER BY co.created_at ASC
    `);

    const incompleteOrders = result.rows;
    console.log(`🔍 [AGGRESSIVE CLEANUP] Found ${incompleteOrders.length} incomplete online payment orders (including orderless)`);

    for (const order of incompleteOrders) {
      const ageMinutes = parseFloat(order.age_minutes);
      const currentStage = order.notification_stage || 0;

      if (ageMinutes >= 10 && currentStage < 3) {
        // After 10 minutes - delete the order completely (reduced from 60 minutes)
        console.log(`🗑️ [AGGRESSIVE CLEANUP] Deleting failed online payment order ${order.id} after ${ageMinutes.toFixed(1)} minutes`);
        await this.deleteIncompleteOrder(order, 'online_payment');
      } else if (ageMinutes >= 5 && currentStage < 2) {
        // After 5 minutes - send second notification
        await this.sendNotification(order, 2, 'Final Warning', 'online_payment');
      } else if (ageMinutes >= 2 && currentStage < 1) {
        // After 2 minutes - send first notification
        await this.sendNotification(order, 1, 'First Warning', 'online_payment');
      }
    }
  }

  async processFailedBankPaymentOrphans(pool: any) {
    // Find all payment_failed orders without order numbers (failed bank payments)
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
        co.updated_at,
        co.notification_stage,
        EXTRACT(EPOCH FROM (NOW() - co.updated_at))/60 as age_minutes,
        om.id as management_id
      FROM customer_orders co
      LEFT JOIN order_management om ON co.id = om.customer_order_id
      WHERE co.status = 'payment_failed' 
        AND co.payment_status = 'failed'
        AND co.order_number IS NULL
      ORDER BY co.updated_at ASC
    `);

    const orphanOrders = result.rows;
    console.log(`🕐 [ORPHAN CLEANER] Found ${orphanOrders.length} failed bank payment orphan orders`);

    for (const order of orphanOrders) {
      const ageMinutes = parseFloat(order.age_minutes);
      const currentStage = order.notification_stage || 0;

      if (ageMinutes >= 15) {
        // After 15 minutes - delete the orphan order completely (reduced from 60 minutes)
        console.log(`🗑️ [AGGRESSIVE ORPHAN CLEANUP] Deleting orphan order ${order.id} after ${ageMinutes.toFixed(1)} minutes`);
        await this.deleteIncompleteOrder(order, 'failed_bank_payment_orphan');
      } else if (ageMinutes >= 10 && currentStage < 2) {
        // After 10 minutes - send reminder (5 minutes left)
        await this.sendNotification(order, 2, 'Final reminder - 5 minutes until deletion', 'failed_bank_payment');
      } else if (ageMinutes >= 5 && currentStage < 1) {
        // After 5 minutes - first notification
        await this.sendNotification(order, 1, 'Failed bank payment - order will be deleted soon', 'failed_bank_payment');
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
        await this.sendNotification(order, 3, 'Final warning - 24 hours remaining', 'grace_period');
      } else if (ageHours >= 24 && currentStage < 2) {
        // After 1 day - second notification (48 hours left)
        await this.sendNotification(order, 2, 'Second reminder - 48 hours remaining', 'grace_period');
      } else if (ageHours >= 6 && currentStage < 1) {
        // After 6 hours - first notification
        await this.sendNotification(order, 1, 'First reminder - payment deadline', 'grace_period');
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

      // Determine recipient email and check if customer is online
      const recipientEmail = order.guest_email || await this.getCustomerEmail(order.customer_id);
      const recipientName = order.guest_name || await this.getCustomerName(order.customer_id);
      const isCustomerOnline = await this.isCustomerOnline(order.customer_id);

      if (!recipientEmail) {
        console.log(`⚠️ [INCOMPLETE PAYMENT CLEANER] No email found for order ${order.order_number}`);
        return;
      }

      // Check if customer is online - if online, just announce, if offline, skip notifications and proceed to deletion
      if (isCustomerOnline) {
        console.log(`🌐 [ONLINE CUSTOMER] Customer ${order.customer_id} is online - announcing only`);
        console.log(`📢 [ONLINE ANNOUNCEMENT] ${stageLabel} - Order ${order.order_number} for ${recipientName} (${order.total_amount} ${order.currency})`);
        return;
      }

      console.log(`📡 [OFFLINE CUSTOMER] Customer ${order.customer_id} is offline - no notifications needed, will proceed to deletion per schedule`);
      
      // For offline customers, we don't send any notifications, just proceed to deletion schedule
      return;

    } catch (error) {
      console.error(`❌ [INCOMPLETE PAYMENT CLEANER] Error processing notification for order ${order.order_number}:`, error);
    }
  }

  private async deleteIncompleteOrder(order: any, orderType: string = 'online_payment') {
    try {
      const reason = orderType === 'grace_period_expired' ? 'after grace period expiry (3 days)' : 'after timeout';
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

        // Order deleted successfully - no notifications needed per user requirements
        console.log(`🗑️ [CLEANUP] Order ${order.order_number} deleted successfully without notifications`);

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

  private async isCustomerOnline(customerId: number | null): Promise<boolean> {
    if (!customerId) return false;
    
    try {
      const { pool } = await import('./db');
      
      // Check if customer has an active session in the last 5 minutes
      const result = await pool.query(`
        SELECT s.sess 
        FROM security_sessions s 
        WHERE s.sess::text LIKE '%"customerId":${customerId}%' 
          AND s.sess::text LIKE '%"isAuthenticated":true%'
          AND s.expire > NOW()
          AND s.expire > NOW() - INTERVAL '5 minutes'
        LIMIT 1
      `);
      
      const isOnline = result.rows.length > 0;
      console.log(`🔍 [ONLINE CHECK] Customer ${customerId} online status: ${isOnline}`);
      
      return isOnline;
    } catch (error) {
      console.error('Error checking customer online status:', error);
      return false; // Default to offline if error
    }
  }

  private async getCustomerName(customerId: number | null): Promise<string> {
    if (!customerId) return 'Dear Customer';
    
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
      return 'Dear Customer';
    } catch (error) {
      console.error('Error getting customer name:', error);
      return 'Dear Customer';
    }
  }

  async stopService() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.isRunning = false;
    console.log('🚮 [INCOMPLETE PAYMENT CLEANER] Service stopped');
  }
}

// Export singleton instance
export const incompletePaymentCleaner = IncompletePaymentCleaner.getInstance();
import { db } from "./db";
import { customerDb } from "./customer-db";
import { eq, and, sql, isNull, lt } from "drizzle-orm";
import { customerOrders } from "@shared/customer-schema";
import { orderManagement, orderStatusHistory } from "@shared/order-management-schema";

/**
 * مدیر جریان سفارشات - تضمین عدم گیر کردن سفارشات
 * Order Flow Manager - Ensures no orders get stuck
 */
export class OrderFlowManager {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * شروع سرویس مدیریت جریان سفارشات
   */
  start() {
    if (this.isRunning) {
      console.log('🔄 [ORDER FLOW] Service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 [ORDER FLOW] Starting automatic order flow management');

    // بررسی هر دقیقه برای پردازش فوری
    this.intervalId = setInterval(async () => {
      await this.processStuckOrders();
    }, 60 * 1000); // هر دقیقه

    // اجرای فوری
    setTimeout(() => {
      this.processStuckOrders();
    }, 3000);
  }

  /**
   * توقف سرویس
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 [ORDER FLOW] Service stopped');
  }

  /**
   * پردازش سفارشات گیر کرده - فقط شبکه امنیتی، بدون تداخل با ۸ روش اصلی
   * Safety net only - does not interfere with the 8 core ordering methods
   */
  async processStuckOrders() {
    try {
      console.log('🔍 [ORDER FLOW] Safety check for truly stuck orders only...');
      
      // فقط بررسی سفارشات که واقعاً گیر کرده‌اند (بیش از ۲۴ ساعت در وضعیت pending)
      // Only check orders that are truly stuck (more than 24 hours in pending status)
      await this.processStuckOrdersSafetyNet();
      
    } catch (error) {
      console.error('❌ [ORDER FLOW] Error in safety net check:', error);
    }
  }

  /**
   * شبکه امنیتی برای سفارشات گیر کرده - احترام به ۸ روش اصلی
   * Safety net for stuck orders - respecting the 8 core methods
   */
  async processStuckOrdersSafetyNet() {
    try {
      // فقط سفارشات که بیش از ۲۴ ساعت در pending هستند و هیچ فعالیتی نداشته‌اند
      const trulyStuckOrders = await db.execute(sql`
        SELECT 
          om.id as mgmt_id,
          co.id as order_id,
          co.order_number,
          co.payment_method,
          co.payment_status,
          om.current_status,
          co.created_at,
          om.updated_at
        FROM order_management om
        JOIN customer_orders co ON om.customer_order_id = co.id
        WHERE 
          om.current_status = 'pending'
          AND co.created_at < NOW() - INTERVAL '24 hours'
          AND om.updated_at < NOW() - INTERVAL '12 hours'
          AND (
            -- فقط سفارشات کیف پولی که 100% پرداخت شده‌اند
            (co.payment_method LIKE '%wallet%' AND co.payment_status = 'paid')
            OR
            -- فقط سفارشات درگاه بانکی که موفق بوده‌اند
            (co.payment_method LIKE '%bank_gateway%' AND co.payment_status = 'paid')
          )
      `);

      if (trulyStuckOrders.rows && trulyStuckOrders.rows.length > 0) {
        console.log(`⚠️ [SAFETY NET] Found ${trulyStuckOrders.rows.length} truly stuck orders (24+ hours old)`);
        
        for (const order of trulyStuckOrders.rows) {
          console.log(`🚨 [SAFETY NET] Processing stuck order: ${order.order_number} (${order.payment_method})`);
          
          // فقط انتقال به warehouse برای سفارشات پرداخت شده
          if (order.payment_status === 'paid') {
            await this.safelyMoveToWarehouse(order.mgmt_id, `شبکه امنیتی: انتقال سفارش گیر کرده بعد از 24 ساعت - ${order.payment_method}`);
          }
        }
      } else {
        console.log('✅ [SAFETY NET] No truly stuck orders found');
      }

    } catch (error) {
      console.error('❌ [SAFETY NET] Error in safety net processing:', error);
    }
  }

  /**
   * انتقال امن به انبار - فقط برای شبکه امنیتی
   */
  async safelyMoveToWarehouse(orderMgmtId: number, notes: string) {
    try {
      console.log(`🚨 [SAFETY NET] Moving stuck order ${orderMgmtId} to warehouse`);
      
      await db
        .update(orderManagement)
        .set({
          currentStatus: 'warehouse_pending',
          financialReviewerId: 0, // سیستم امنیتی
          financialReviewedAt: new Date(),
          financialNotes: notes,
          updatedAt: new Date()
        })
        .where(eq(orderManagement.id, orderMgmtId));

      // آپدیت customer_orders
      const mgmtRecord = await db
        .select({ customerOrderId: orderManagement.customerOrderId })
        .from(orderManagement)
        .where(eq(orderManagement.id, orderMgmtId))
        .limit(1);

      if (mgmtRecord[0]) {
        await customerDb
          .update(customerOrders)
          .set({
            status: 'warehouse_ready',
            paymentStatus: 'paid',
            updatedAt: new Date()
          })
          .where(eq(customerOrders.id, mgmtRecord[0].customerOrderId));
      }

      console.log(`✅ [SAFETY NET] Order ${orderMgmtId} safely moved to warehouse`);
    } catch (error) {
      console.error(`❌ [SAFETY NET] Error moving order ${orderMgmtId}:`, error);
    }
  }








  /**
   * گزارش وضعیت سرویس شبکه امنیتی
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.intervalId !== null,
      mode: 'safety_net_only' // فقط شبکه امنیتی، بدون تداخل با ۸ روش اصلی
    };
  }
}

// صادرات نمونه سرویس
export const orderFlowManager = new OrderFlowManager();
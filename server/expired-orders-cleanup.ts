import { customerDb } from "./customer-db";
import { customerOrders, orderItems } from "@shared/customer-schema";
import { eq, and, lt, sql } from "drizzle-orm";

/**
 * خدمت تمیزکاری خودکار سفارشات منقضی شده
 * Automatic cleanup service for expired orders
 */
export class ExpiredOrdersCleanup {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * شروع سرویس تمیزکاری خودکار
   * Start automatic cleanup service
   */
  start() {
    if (this.isRunning) {
      console.log('🔄 [EXPIRED CLEANUP] Service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 [EXPIRED CLEANUP] Starting expired orders cleanup service');

    // Run cleanup every 2 hours
    this.cleanupInterval = setInterval(async () => {
      await this.performCleanup();
    }, 2 * 60 * 60 * 1000); // 2 hours

    // Run initial cleanup
    setTimeout(() => {
      this.performCleanup();
    }, 30000); // After 30 seconds of startup
  }

  /**
   * توقف سرویس تمیزکاری
   * Stop cleanup service
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 [EXPIRED CLEANUP] Cleanup service stopped');
  }

  /**
   * اجرای تمیزکاری سفارشات منقضی شده
   * Perform cleanup of expired orders
   */
  async performCleanup() {
    try {
      console.log('🧹 [EXPIRED CLEANUP] Starting cleanup process...');

      // Find expired temporary orders (3-day grace period expired)
      const expiredOrders = await customerDb
        .select({
          id: customerOrders.id,
          orderNumber: customerOrders.orderNumber,
          customerId: customerOrders.customerId,
          status: customerOrders.status,
          paymentStatus: customerOrders.paymentStatus,
          paymentMethod: customerOrders.paymentMethod,
          createdAt: customerOrders.createdAt
        })
        .from(customerOrders)
        .where(
          and(
            // Temporary orders with 3-day grace period
            eq(customerOrders.paymentMethod, 'واریز بانکی با مهلت 3 روزه'),
            // Status is pending or payment_grace_period
            sql`${customerOrders.status} IN ('pending', 'payment_grace_period')`,
            // Grace period expired (3 days + 1 hour buffer)
            lt(customerOrders.createdAt, sql`NOW() - INTERVAL '73 hours'`)
          )
        );

      if (expiredOrders.length === 0) {
        console.log('✅ [EXPIRED CLEANUP] No expired orders found');
        return;
      }

      console.log(`🔍 [EXPIRED CLEANUP] Found ${expiredOrders.length} expired orders to clean up`);

      let cleanedCount = 0;
      let releasedProductsTotal = 0;

      for (const order of expiredOrders) {
        try {
          // Get order items to release reservations
          const items = await customerDb
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));

          // Release product reservations by adding quantities back to inventory
          if (items.length > 0) {
            const { db } = await import('./db');
            const { shopProducts } = await import('@shared/shop-schema');
            
            for (const item of items) {
              if (item.productId && item.quantity) {
                // Add quantity back to shop product inventory
                await db
                  .update(shopProducts)
                  .set({
                    stockQuantity: sql`stock_quantity + ${parseFloat(item.quantity)}`,
                    updatedAt: new Date()
                  })
                  .where(eq(shopProducts.id, item.productId));

                releasedProductsTotal++;
              }
            }
          }

          // Delete order items first (foreign key constraint)
          await customerDb
            .delete(orderItems)
            .where(eq(orderItems.orderId, order.id));

          // Mark order as deleted instead of hard deletion to preserve numbering
          await customerDb
            .update(customerOrders)
            .set({
              status: 'deleted',
              notes: sql`COALESCE(${customerOrders.notes}, '') || ' - سفارش منقضی شده حذف شد در ' || NOW()`,
              updatedAt: new Date()
            })
            .where(eq(customerOrders.id, order.id));

          cleanedCount++;
          console.log(`🗑️ [EXPIRED CLEANUP] Cleaned expired order: ${order.orderNumber} (Customer: ${order.customerId})`);

        } catch (error) {
          console.error(`❌ [EXPIRED CLEANUP] Error cleaning order ${order.orderNumber}:`, error);
        }
      }

      console.log(`✅ [EXPIRED CLEANUP] Cleanup completed: ${cleanedCount} orders cleaned, ${releasedProductsTotal} products released`);

    } catch (error) {
      console.error('❌ [EXPIRED CLEANUP] Error during cleanup process:', error);
    }
  }

  /**
   * اجرای دستی تمیزکاری
   * Manual cleanup execution
   */
  async manualCleanup() {
    console.log('🎯 [EXPIRED CLEANUP] Manual cleanup requested');
    await this.performCleanup();
  }

  /**
   * وضعیت سرویس
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.cleanupInterval !== null
    };
  }
}

// Export singleton instance
export const expiredOrdersCleanup = new ExpiredOrdersCleanup();
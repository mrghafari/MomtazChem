import { db } from "./db";
import { eq, lte, sql } from "drizzle-orm";
import { orderManagement } from "../shared/order-management-schema";
import { customerOrders } from "../shared/customer-schema";

// سرویس تایید خودکار 5 دقیقه‌ای
export class AutoApprovalService {
  private intervalId: NodeJS.Timeout | null = null;

  // شروع سرویس تایید خودکار
  start() {
    console.log("🤖 [AUTO APPROVAL] Service started - checking every minute");
    
    // بررسی هر دقیقه
    this.intervalId = setInterval(() => {
      this.processAutoApprovals();
    }, 60 * 1000); // 1 minute

    // اجرای فوری برای بررسی سفارشات موجود
    this.processAutoApprovals();
  }

  // توقف سرویس
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("🛑 [AUTO APPROVAL] Service stopped");
    }
  }

  // پردازش تایید خودکار سفارشات
  private async processAutoApprovals() {
    try {
      console.log("🔍 [AUTO APPROVAL] Checking for orders ready for auto-approval...");
      
      // یافتن سفارشات آماده برای تایید خودکار
      const ordersToApprove = await db
        .select({
          id: orderManagement.id,
          customerOrderId: orderManagement.customerOrderId,
          autoApprovalScheduledAt: orderManagement.autoApprovalScheduledAt,
          paymentMethod: orderManagement.paymentMethod,
          paymentSourceLabel: orderManagement.paymentSourceLabel
        })
        .from(orderManagement)
        .where(
          sql`
            current_status = 'financial_reviewing' 
            AND is_auto_approval_enabled = true 
            AND auto_approval_scheduled_at IS NOT NULL 
            AND auto_approval_scheduled_at <= NOW()
            AND auto_approval_executed_at IS NULL
          `
        );

      if (ordersToApprove.length === 0) {
        console.log("✅ [AUTO APPROVAL] No orders ready for auto-approval");
        return;
      }

      console.log(`🤖 [AUTO APPROVAL] Found ${ordersToApprove.length} orders ready for auto-approval`);

      // پردازش هر سفارش
      for (const order of ordersToApprove) {
        await this.approveOrder(order);
      }

    } catch (error) {
      console.error("❌ [AUTO APPROVAL] Error processing auto-approvals:", error);
    }
  }

  // تایید خودکار یک سفارش
  private async approveOrder(order: any) {
    try {
      console.log(`🤖 [AUTO APPROVAL] Processing order management ID: ${order.id}`);

      // بروزرسانی order_management
      await db
        .update(orderManagement)
        .set({
          currentStatus: 'warehouse_pending',
          financialReviewedAt: new Date(),
          financialNotes: `تایید خودکار سیستم - ${order.paymentSourceLabel}`,
          autoApprovalExecutedAt: new Date()
        })
        .where(eq(orderManagement.id, order.id));

      // همزمان‌سازی با customer_orders
      await db
        .update(customerOrders)
        .set({
          status: 'warehouse_ready',
          paymentStatus: 'paid',
          updatedAt: new Date()
        })
        .where(eq(customerOrders.id, order.customerOrderId));

      console.log(`✅ [AUTO APPROVAL] Order ${order.customerOrderId} automatically approved and moved to warehouse`);

    } catch (error) {
      console.error(`❌ [AUTO APPROVAL] Error approving order ${order.id}:`, error);
    }
  }
}

export const autoApprovalService = new AutoApprovalService();
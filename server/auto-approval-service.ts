import { db } from "./db";
import { eq, lte, sql, and } from "drizzle-orm";
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
      
      // IMPORTANT: تمام پردازش‌های خودکار غیرفعال شده
      console.log("🚫 [AUTO APPROVAL] ALL AUTO-PROCESSING DISABLED");
      console.log("💡 [AUTO APPROVAL] All orders require manual financial department approval");
      
      // await this.processWalletPaidOrders(); // DISABLED
      // await this.processBankTransferOrders(); // DISABLED
      
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

  // تایید خودکار یک سفارش - فقط کیف پول و نه انتقال به انبار
  private async approveOrder(order: any) {
    try {
      console.log(`🤖 [AUTO APPROVAL] Processing order management ID: ${order.id}`);

      // IMPORTANT: غیرفعال کردن تایید خودکار - همه سفارشات نیاز به تایید دستی دارند
      console.log(`🚫 [AUTO APPROVAL] DISABLED - Order ${order.id} requires manual financial approval`);
      console.log(`💡 [AUTO APPROVAL] All orders must be manually approved by financial department`);
      return; // غیرفعال کردن کامل تایید خودکار

    } catch (error) {
      console.error(`❌ [AUTO APPROVAL] Error approving order ${order.id}:`, error);
    }
  }

  // پردازش سفارشات wallet-paid - DISABLED
  private async processWalletPaidOrders() {
    try {
      console.log("💰 [WALLET AUTO] Checking wallet-paid orders...");
      
      // IMPORTANT: غیرفعال کردن انتقال خودکار کیف پول
      console.log("🚫 [WALLET AUTO] DISABLED - Wallet orders require manual financial approval");
      console.log("💡 [WALLET AUTO] All wallet payments must be manually approved by financial department");
      return; // غیرفعال کردن کامل انتقال خودکار کیف پول

    } catch (error) {
      console.error("❌ [WALLET AUTO] Error processing wallet-paid orders:", error);
    }
  }

  // انتقال سفارش wallet-paid به warehouse - DISABLED
  private async transferWalletOrderToWarehouse(order: any) {
    try {
      console.log(`🚫 [WAREHOUSE TRANSFER] DISABLED - Order ${order.orderNumber} requires manual approval`);
      console.log(`💡 [WAREHOUSE TRANSFER] Financial department must manually approve all orders`);
      return; // غیرفعال کردن کامل انتقال خودکار

    } catch (error) {
      console.error(`❌ [WAREHOUSE TRANSFER] Error transferring order ${order.orderNumber}:`, error);
    }
  }

  // پردازش سفارشات bank_transfer_grace - DISABLED
  private async processBankTransferOrders() {
    try {
      console.log("🏦 [BANK TRANSFER AUTO] Checking bank transfer orders...");

      // IMPORTANT: غیرفعال کردن تایید خودکار انتقال بانکی
      console.log("🚫 [BANK TRANSFER AUTO] DISABLED - Bank transfer orders require manual financial approval");
      console.log("💡 [BANK TRANSFER AUTO] All bank transfers must be manually approved by financial department");
      return; // غیرفعال کردن کامل تایید خودکار انتقال بانکی

    } catch (error) {
      console.error("❌ [BANK TRANSFER AUTO] Error processing bank transfer orders:", error);
    }
  }

  // تایید خودکار سفارش bank_transfer_grace
  private async approveBankTransferOrder(order: any) {
    try {
      // به‌روزرسانی وضعیت در customer_orders
      await db
        .update(customerOrders)
        .set({
          status: 'warehouse_ready',
          paymentStatus: 'paid',
          updatedAt: new Date()
        })
        .where(eq(customerOrders.id, order.id));

      // ایجاد یا به‌روزرسانی order_management record
      const existingManagement = await db
        .select()
        .from(orderManagement)
        .where(eq(orderManagement.customerOrderId, order.id))
        .limit(1);

      if (existingManagement.length === 0) {
        // ایجاد order_management record جدید
        await db.insert(orderManagement).values({
          customerOrderId: order.id,
          currentStatus: 'warehouse_pending',
          financialReviewerId: 0, // System auto-approval
          financialReviewedAt: new Date(),
          financialNotes: order.paymentMethod === 'bank_transfer_grace' 
            ? 'تایید خودکار حواله بانکی - مدارک بررسی و تایید شد'
            : 'تایید خودکار - مدارک پرداخت بررسی و تایید شد',
          totalAmount: order.totalAmount?.toString() || '0',
          currency: order.currency || 'IQD',
          orderNumber: order.orderNumber,
          customerFirstName: order.customerFirstName || '',
          customerLastName: order.customerLastName || '',
          customerEmail: order.customerEmail || '',
          customerPhone: order.customerPhone || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // به‌روزرسانی order_management موجود
        await db
          .update(orderManagement)
          .set({
            currentStatus: 'warehouse_pending',
            financialReviewerId: 0, // System auto-approval
            financialReviewedAt: new Date(),
            financialNotes: order.paymentMethod === 'bank_transfer_grace' 
              ? 'تایید خودکار حواله بانکی - مدارک بررسی و تایید شد'
              : 'تایید خودکار - مدارک پرداخت بررسی و تایید شد',
            updatedAt: new Date()
          })
          .where(eq(orderManagement.customerOrderId, order.id));
      }

      console.log(`✅ [BANK TRANSFER AUTO] Order ${order.orderNumber} automatically approved and moved to warehouse`);

    } catch (error) {
      console.error(`❌ [BANK TRANSFER AUTO] Error auto-approving order ${order.orderNumber}:`, error);
    }
  }
}

export const autoApprovalService = new AutoApprovalService();
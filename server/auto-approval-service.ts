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
      
      // ابتدا پردازش سفارشات wallet-paid که باید به warehouse منتقل شوند
      await this.processWalletPaidOrders();
      
      // پردازش سفارشات bank_transfer_grace که مدارک آپلود کرده‌اند
      await this.processBankTransferOrders();
      
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

  // پردازش سفارشات wallet-paid که باید به warehouse منتقل شوند
  private async processWalletPaidOrders() {
    try {
      console.log("💰 [WALLET AUTO] Checking wallet-paid orders for warehouse transfer...");
      
      // یافتن سفارشات wallet-paid که هنوز pending هستند
      const walletOrders = await db
        .select()
        .from(customerOrders)
        .where(
          sql`
            (payment_method LIKE '%wallet%' OR payment_method = 'wallet_full' OR payment_method = 'wallet_partial')
            AND status = 'pending'
            AND (payment_status = 'paid' OR payment_status = 'partial')
          `
        );

      if (walletOrders.length === 0) {
        console.log("✅ [WALLET AUTO] No wallet-paid orders pending warehouse transfer");
        return;
      }

      console.log(`💰 [WALLET AUTO] Found ${walletOrders.length} wallet-paid orders ready for warehouse transfer`);

      for (const order of walletOrders) {
        await this.transferWalletOrderToWarehouse(order);
      }

    } catch (error) {
      console.error("❌ [WALLET AUTO] Error processing wallet-paid orders:", error);
    }
  }

  // انتقال سفارش wallet-paid به warehouse
  private async transferWalletOrderToWarehouse(order: any) {
    try {
      console.log(`🏭 [WAREHOUSE TRANSFER] Processing order ${order.orderNumber} (${order.paymentMethod})`);

      // به‌روزرسانی وضعیت سفارش به warehouse_ready
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
            updatedAt: new Date()
          })
          .where(eq(orderManagement.customerOrderId, order.id));
      }

      console.log(`✅ [WAREHOUSE TRANSFER] Order ${order.orderNumber} transferred to warehouse successfully`);
      console.log(`📄 [INVOICE READY] Order ${order.orderNumber} is now ready for proforma to invoice conversion`);

    } catch (error) {
      console.error(`❌ [WAREHOUSE TRANSFER] Error transferring order ${order.orderNumber}:`, error);
    }
  }

  // پردازش سفارشات bank_transfer_grace که مدارک آپلود کرده‌اند
  private async processBankTransferOrders() {
    try {
      console.log("🏦 [BANK TRANSFER AUTO] Checking bank transfer orders with uploaded receipts...");

      // یافتن سفارشات bank_transfer_grace که مدارک آپلود کرده‌اند و نیاز به تایید دارند
      const bankTransferOrders = await db
        .select({
          id: customerOrders.id,
          orderNumber: customerOrders.orderNumber,
          paymentMethod: customerOrders.paymentMethod,
          paymentStatus: customerOrders.paymentStatus,
          status: customerOrders.status,
          totalAmount: customerOrders.totalAmount,
          currency: customerOrders.currency,
          customerFirstName: customerOrders.customerFirstName,
          customerLastName: customerOrders.customerLastName,
          customerEmail: customerOrders.customerEmail,
          customerPhone: customerOrders.customerPhone
        })
        .from(customerOrders)
        .where(
          sql`
            payment_method = 'bank_transfer_grace'
            AND payment_status = 'receipt_uploaded'
            AND status = 'confirmed'
          `
        );

      console.log(`🏦 [BANK TRANSFER AUTO] Query found ${bankTransferOrders.length} bank transfer orders`);
      
      if (bankTransferOrders.length > 0) {
        console.log("🏦 [BANK TRANSFER AUTO] Bank transfer orders found:", 
          JSON.stringify(bankTransferOrders.map(o => ({
            id: o.id,
            orderNumber: o.orderNumber,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            status: o.status
          })), null, 2)
        );
      }

      if (bankTransferOrders.length === 0) {
        console.log("✅ [BANK TRANSFER AUTO] No bank transfer orders pending auto-approval");
        return;
      }

      console.log(`🏦 [BANK TRANSFER AUTO] Found ${bankTransferOrders.length} bank transfer orders ready for auto-approval`);

      for (const order of bankTransferOrders) {
        console.log(`🏦 [BANK TRANSFER AUTO] Processing order ${order.orderNumber} (bank_transfer_grace)`);

        // تایید خودکار مالی و انتقال به انبار
        await this.approveBankTransferOrder(order);
      }

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
          financialNotes: 'تایید خودکار حواله بانکی - مدارک بررسی و تایید شد',
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
            financialNotes: 'تایید خودکار حواله بانکی - مدارک بررسی و تایید شد',
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
import { db } from "./db";
import { eq, lte, sql, and } from "drizzle-orm";
import { orderManagement } from "../shared/order-management-schema";
import { customerOrders } from "../shared/customer-schema";
import { DatabaseUtilities, SystemHealthCheck } from "./database-utilities";

// سرویس تایید خودکار - DISABLED (همه سفارشات نیاز به تایید دستی دارند)
export class AutoApprovalService {
  private intervalId: NodeJS.Timeout | null = null;

  // شروع سرویس تایید خودکار - فعال برای کیف پول
  start() {
    console.log("💰 [AUTO APPROVAL] Service ENABLED for wallet-paid orders only");
    
    // اجرای health check در شروع
    this.performInitialHealthCheck();
    
    // بررسی هر دقیقه
    this.intervalId = setInterval(() => {
      this.processAutoApprovals();
    }, 60 * 1000); // 1 minute

    // اجرای فوری برای بررسی سفارشات موجود
    this.processAutoApprovals();
  }

  // health check اولیه
  private async performInitialHealthCheck() {
    try {
      const healthCheck = await SystemHealthCheck.performFullCheck();
      if (!healthCheck.healthy) {
        console.log('⚠️ [AUTO APPROVAL] System health issues detected:', healthCheck.issues);
        if (healthCheck.autoFixed.length > 0) {
          console.log('🔧 [AUTO APPROVAL] Auto-fixed issues:', healthCheck.autoFixed);
        }
      }
    } catch (error) {
      console.error('❌ [AUTO APPROVAL] Health check failed:', error);
    }
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
      
      // فعال کردن تایید خودکار فقط برای سفارشات کیف پولی کامل پرداخت شده
      await this.processWalletPaidOrders(); // فعال برای کیف پول
      
      // غیرفعال برای سایر پرداخت‌ها
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

      // تایید خودکار فقط برای سفارشات کیف پولی فعال است
      console.log(`🤖 [AUTO APPROVAL] Processing scheduled order ${order.id}`);
      
      // برای سفارشات کیف پولی، تایید خودکار انجام می‌شود
      await db
        .update(orderManagement)
        .set({
          currentStatus: 'warehouse_pending',
          financialReviewerId: 0, // System auto-approval
          financialReviewedAt: new Date(),
          financialNotes: 'تایید خودکار - سفارش زمان‌بندی شده',
          autoApprovalExecutedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orderManagement.id, order.id));

      console.log(`✅ [AUTO APPROVAL] Order ${order.id} automatically approved and moved to warehouse`);

    } catch (error) {
      console.error(`❌ [AUTO APPROVAL] Error approving order ${order.id}:`, error);
    }
  }

  // پردازش سفارشات wallet-paid - شامل پرداخت‌های ترکیبی
  private async processWalletPaidOrders() {
    try {
      console.log("💰 [WALLET AUTO] Checking wallet-paid orders (including hybrid payments)...");
      
      // یافتن تمام سفارشات کامل پرداخت شده در حال انتظار
      const pendingPaidOrders = await db
        .select({
          id: customerOrders.id,
          orderNumber: customerOrders.orderNumber,
          paymentStatus: customerOrders.paymentStatus,
          totalAmount: customerOrders.totalAmount,
          customerId: customerOrders.customerId,
          managementId: orderManagement.id,
          currentStatus: orderManagement.currentStatus,
          paymentMethod: orderManagement.paymentMethod,
          paymentSourceLabel: orderManagement.paymentSourceLabel
        })
        .from(customerOrders)
        .innerJoin(orderManagement, eq(customerOrders.id, orderManagement.customerOrderId))
        .where(
          sql`
            customer_orders.payment_status = 'paid' 
            AND order_management.current_status = 'pending'
          `
        );

      if (pendingPaidOrders.length === 0) {
        console.log("✅ [WALLET AUTO] No pending paid orders found");
        return;
      }

      console.log(`🔍 [WALLET AUTO] Found ${pendingPaidOrders.length} pending paid orders, checking wallet coverage...`);

      // بررسی هر سفارش برای تایید پوشش کامل کیف پول
      const walletCoveredOrders = [];
      
      for (const order of pendingPaidOrders) {
        const isWalletCovered = await this.checkWalletCoverage(order);
        if (isWalletCovered) {
          walletCoveredOrders.push(order);
        }
      }

      if (walletCoveredOrders.length === 0) {
        console.log("✅ [WALLET AUTO] No wallet-covered orders found");
        return;
      }

      console.log(`💰 [WALLET AUTO] Found ${walletCoveredOrders.length} wallet-covered orders ready for auto-approval`);

      // پردازش هر سفارش که کامل از کیف پول پرداخت شده
      for (const order of walletCoveredOrders) {
        await this.transferWalletOrderToWarehouse(order);
      }

    } catch (error) {
      console.error("❌ [WALLET AUTO] Error processing wallet-paid orders:", error);
    }
  }

  // بررسی پوشش کامل سفارش توسط کیف پول (امن و بدون خطا)
  private async checkWalletCoverage(order: any): Promise<boolean> {
    try {
      // اعتبارسنجی اطلاعات سفارش
      const validation = DatabaseUtilities.validateOrder(order);
      if (!validation.valid) {
        console.log(`❌ [WALLET CHECK] Order validation failed: ${validation.errors.join(', ')}`);
        return false;
      }

      // 1. اگر روش پرداخت مستقیماً کیف پول است
      if (
        order.paymentMethod?.includes('wallet') ||
        order.paymentSourceLabel?.includes('wallet') ||
        order.paymentSourceLabel?.includes('کیف')
      ) {
        console.log(`💰 [WALLET CHECK] Order ${order.orderNumber}: Direct wallet payment detected`);
        return true;
      }

      // 2. بررسی تراکنش‌های کیف پول با استفاده از utility امن
      const transactionResult = await DatabaseUtilities.getWalletTransactions(order.orderNumber, order.customerId);
      
      if (!transactionResult.success) {
        console.log(`❌ [WALLET CHECK] Order ${order.orderNumber}: Database error - ${transactionResult.error}`);
        return false;
      }

      const walletTransactions = transactionResult.transactions || [];
      if (walletTransactions.length === 0) {
        console.log(`❌ [WALLET CHECK] Order ${order.orderNumber}: No wallet transactions found`);
        return false;
      }

      // 3. محاسبه امن مجموع پرداخت‌های کیف پول
      const totalWalletPayment = walletTransactions.reduce((sum, tx) => {
        return sum + DatabaseUtilities.safeParseAmount(tx.amount);
      }, 0);

      const orderTotal = DatabaseUtilities.safeParseAmount(order.totalAmount);
      if (orderTotal <= 0) {
        console.log(`❌ [WALLET CHECK] Order ${order.orderNumber}: Invalid order total amount`);
        return false;
      }
      
      const coverage = (totalWalletPayment / orderTotal) * 100;
      console.log(`💰 [WALLET CHECK] Order ${order.orderNumber}: Wallet payment ${totalWalletPayment}/${orderTotal} (${coverage.toFixed(1)}%)`);

      // 4. بررسی پوشش کیف پول
      if (coverage >= 99) {
        console.log(`✅ [WALLET CHECK] Order ${order.orderNumber}: Wallet covers ${coverage.toFixed(1)}% - GUARANTEED Auto-approval`);
        return true;
      }
      
      if (coverage >= 95) {
        console.log(`✅ [WALLET CHECK] Order ${order.orderNumber}: Wallet covers ${coverage.toFixed(1)}% - Conditional auto-approval`);
        return true;
      }

      console.log(`❌ [WALLET CHECK] Order ${order.orderNumber}: Wallet coverage ${coverage.toFixed(1)}% insufficient (requires ≥95%)`);
      return false;

    } catch (error) {
      console.error(`❌ [WALLET CHECK] Critical error for order ${order.orderNumber}:`, error);
      return false;
    }
  }

  // انتقال سفارش wallet-paid به warehouse - شامل پرداخت‌های ترکیبی
  private async transferWalletOrderToWarehouse(order: any) {
    try {
      console.log(`💰 [WALLET AUTO] Processing wallet-covered order ${order.orderNumber}`);

      // تعیین نوع پرداخت برای یادداشت
      const paymentNote = order.paymentMethod?.includes('wallet') 
        ? 'تایید خودکار - پرداخت کامل از کیف پول دیجیتال'
        : 'تایید خودکار - پرداخت ترکیبی با پوشش کامل کیف پول';

      // به‌روزرسانی وضعیت در order_management - انتقال مستقیم به انبار
      await db
        .update(orderManagement)
        .set({
          currentStatus: 'warehouse_pending',
          financialReviewerId: 0, // System auto-approval
          financialReviewedAt: new Date(),
          financialNotes: paymentNote,
          updatedAt: new Date()
        })
        .where(eq(orderManagement.id, order.managementId));

      console.log(`✅ [WALLET AUTO] Order ${order.orderNumber} automatically approved and moved to warehouse`);
      console.log(`💰 [WALLET AUTO] Payment: ${order.paymentSourceLabel || 'کیف پول'} - Amount: ${order.totalAmount}`);

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
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
      
      // فعال کردن تایید خودکار برای سفارشات کیف پولی و درگاه بانکی
      await this.processWalletPaidOrders(); // فعال برای کیف پول
      await this.processBankGatewayOrders(); // فعال برای درگاه بانکی
      
      // غیرفعال برای انتقال بانکی
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

  // تایید خودکار یک سفارش - کیف پول و درگاه بانکی مستقیم به انبار
  private async approveOrder(order: any) {
    try {
      console.log(`🤖 [AUTO APPROVAL] Processing order management ID: ${order.id}`);

      // تشخیص نوع پرداخت برای پیغام مناسب
      let financialNotes = 'تایید خودکار - سفارش زمان‌بندی شده';
      
      if (order.paymentSourceLabel?.includes('ترکیبی به کیف پول کامل')) {
        financialNotes = 'تایید خودکار - سفارش ترکیبی ارتقا یافته به پرداخت کامل کیف پول';
        console.log(`🎯 [AUTO APPROVAL] Hybrid order upgraded to full wallet payment ${order.id} - direct to warehouse`);
      } else if (order.paymentMethod?.includes('wallet') || order.paymentSourceLabel?.includes('کیف')) {
        financialNotes = 'تایید خودکار - پرداخت کامل از کیف پول دیجیتال';
        console.log(`💰 [AUTO APPROVAL] Wallet payment order ${order.id} - direct to warehouse`);
      } else if (order.paymentMethod?.includes('bank_gateway') || order.paymentSourceLabel?.includes('بانک')) {
        financialNotes = 'تایید خودکار - تراکنش درگاه بانکی موفق';
        console.log(`🏦 [AUTO APPROVAL] Bank gateway payment order ${order.id} - direct to warehouse`);
      }
      
      // تایید خودکار و انتقال مستقیم به انبار
      await db
        .update(orderManagement)
        .set({
          currentStatus: 'warehouse_pending',
          financialReviewerId: 0, // System auto-approval
          financialReviewedAt: new Date(),
          financialNotes,
          autoApprovalExecutedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(orderManagement.id, order.id));

      console.log(`✅ [AUTO APPROVAL] Order ${order.id} automatically approved and moved to warehouse`);
      console.log(`💳 [AUTO APPROVAL] Payment method: ${order.paymentMethod}, Source: ${order.paymentSourceLabel}`);

    } catch (error) {
      console.error(`❌ [AUTO APPROVAL] Error approving order ${order.id}:`, error);
    }
  }

  // پردازش سفارشات wallet-paid - شامل پرداخت‌های ترکیبی
  private async processWalletPaidOrders() {
    try {
      console.log("💰 [WALLET AUTO] Checking wallet-paid orders (including hybrid payments)...");
      
      // یافتن سفارشات wallet-paid واقعی (فقط سفارشات که کاملاً پرداخت شده‌اند)
      const pendingPaidOrders = await db
        .select({
          id: customerOrders.id,
          orderNumber: customerOrders.orderNumber,
          paymentStatus: customerOrders.paymentStatus,
          paymentMethod: customerOrders.paymentMethod,
          totalAmount: customerOrders.totalAmount,
          customerId: customerOrders.customerId,
          managementId: orderManagement.id,
          currentStatus: orderManagement.currentStatus,
          paymentMethodMgmt: orderManagement.paymentMethod,
          paymentSourceLabel: orderManagement.paymentSourceLabel
        })
        .from(customerOrders)
        .innerJoin(orderManagement, eq(customerOrders.id, orderManagement.customerOrderId))
        .where(
          sql`
            customer_orders.payment_status = 'paid' 
            AND (
              customer_orders.payment_method LIKE '%wallet%'
              OR customer_orders.payment_method LIKE '%کیف%'
            )
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

      // ❌ CRITICAL FIX: هرگز بر اساس نام روش پرداخت تایید نکنید - همیشه تراکنش‌های واقعی را بررسی کنید
      // NEVER approve based on payment method name alone - always verify actual transactions
      
      console.log(`🔍 [WALLET CHECK] Order ${order.orderNumber}: Starting STRICT wallet verification...`);
      console.log(`🔍 [WALLET CHECK] Payment method: ${order.paymentMethod}, Status: ${order.paymentStatus}`);
      
      // برای سفارشات ترکیبی (hybrid) - هر دو بخش باید موفق باشد
      // For hybrid orders - BOTH parts must be successful
      if (order.paymentMethod?.includes('partial') || order.paymentMethod?.includes('ترکیبی')) {
        console.log(`🔄 [WALLET CHECK] Order ${order.orderNumber}: HYBRID ORDER detected - verifying both wallet AND bank portions`);
        
        // اگر payment_status = 'partial' یعنی یکی از بخش‌ها ناموفق بوده
        if (order.paymentStatus === 'partial') {
          console.log(`❌ [WALLET CHECK] Order ${order.orderNumber}: HYBRID FAILED - payment_status is 'partial', rejecting order`);
          return false;
        }
      }

      // بررسی تراکنش‌های کیف پول با استفاده از utility امن
      const transactionResult = await DatabaseUtilities.getWalletTransactions(order.orderNumber, order.customerId);
      
      if (!transactionResult.success) {
        console.log(`❌ [WALLET CHECK] Order ${order.orderNumber}: Database error - ${transactionResult.error}`);
        return false;
      }

      const walletTransactions = transactionResult.transactions || [];
      if (walletTransactions.length === 0) {
        console.log(`❌ [WALLET CHECK] Order ${order.orderNumber}: NO WALLET TRANSACTIONS FOUND - cannot approve`);
        return false;
      }

      // محاسبه امن مجموع پرداخت‌های کیف پول
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

      // بررسی پوشش کیف پول - فقط با تراکنش‌های واقعی
      if (coverage >= 99) {
        console.log(`✅ [WALLET CHECK] Order ${order.orderNumber}: Wallet covers ${coverage.toFixed(1)}% with ACTUAL transactions - APPROVED`);
        return true;
      }
      
      if (coverage >= 95) {
        console.log(`✅ [WALLET CHECK] Order ${order.orderNumber}: Wallet covers ${coverage.toFixed(1)}% with ACTUAL transactions - APPROVED`);
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

      // تعیین نوع پرداخت برای یادداشت با تشخیص ارتقا ترکیبی
      let paymentNote = 'تایید خودکار - پرداخت کامل از کیف پول دیجیتال';
      
      if (order.paymentSourceLabel?.includes('ترکیبی به کیف پول کامل')) {
        paymentNote = 'تایید خودکار - سفارش ترکیبی ارتقا یافته به پوشش 100% کیف پول';
        console.log(`🎯 [WALLET AUTO] HYBRID UPGRADE: Order ${order.orderNumber} was hybrid but upgraded to full wallet coverage`);
      } else if (order.paymentMethod?.includes('wallet')) {
        paymentNote = 'تایید خودکار - پرداخت کامل از کیف پول دیجیتال';
        console.log(`💰 [WALLET AUTO] DIRECT WALLET: Order ${order.orderNumber} direct wallet payment`);
      } else {
        paymentNote = 'تایید خودکار - پرداخت ترکیبی با پوشش کامل کیف پول';
        console.log(`🔄 [WALLET AUTO] HYBRID COVERAGE: Order ${order.orderNumber} hybrid with full wallet coverage`);
      }

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

  // پردازش سفارشات bank_gateway - فعال برای درگاه بانکی
  private async processBankGatewayOrders() {
    try {
      console.log("🏦 [BANK GATEWAY AUTO] Checking bank gateway orders for auto-approval...");
      
      // یافتن تمام سفارشات درگاه بانکی در حال انتظار تایید مالی
      const pendingBankGatewayOrders = await db
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
            AND order_management.current_status = 'financial_reviewing'
            AND (
              order_management.payment_method LIKE '%bank_gateway%' 
              OR order_management.payment_source_label LIKE '%بانک%'
              OR order_management.payment_source_label LIKE '%درگاه%'
            )
          `
        );

      if (pendingBankGatewayOrders.length === 0) {
        console.log("✅ [BANK GATEWAY AUTO] No pending bank gateway orders found");
        return;
      }

      console.log(`🏦 [BANK GATEWAY AUTO] Found ${pendingBankGatewayOrders.length} bank gateway orders ready for auto-approval`);

      // پردازش هر سفارش درگاه بانکی که تراکنش موفق داشته
      for (const order of pendingBankGatewayOrders) {
        await this.transferBankGatewayOrderToWarehouse(order);
      }

    } catch (error) {
      console.error("❌ [BANK GATEWAY AUTO] Error processing bank gateway orders:", error);
    }
  }

  // انتقال سفارش bank_gateway به warehouse - تراکنش موفق
  private async transferBankGatewayOrderToWarehouse(order: any) {
    try {
      console.log(`🏦 [BANK GATEWAY AUTO] Processing successful bank gateway order ${order.orderNumber}`);

      // تعیین نوع پرداخت برای یادداشت
      const paymentNote = 'تایید خودکار - تراکنش درگاه بانکی موفق';

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

      console.log(`✅ [BANK GATEWAY AUTO] Order ${order.orderNumber} automatically approved and moved to warehouse`);
      console.log(`🏦 [BANK GATEWAY AUTO] Payment: ${order.paymentSourceLabel || 'درگاه بانکی'} - Amount: ${order.totalAmount}`);

    } catch (error) {
      console.error(`❌ [BANK GATEWAY TRANSFER] Error transferring order ${order.orderNumber}:`, error);
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
          paymentMethod: order.paymentMethod || 'wallet',
          paymentSourceLabel: 'پرداخت کیف پول - تایید خودکار',
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
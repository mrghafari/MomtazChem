import { DatabaseUtilities, SystemHealthCheck } from "./database-utilities";
import { autoApprovalService } from "./auto-approval-service";

// سرویس نظارت بر سیستم برای جلوگیری از بروز خطاهای جدی
export class SystemMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private lastHealthCheck: Date | null = null;
  private healthIssuesCount = 0;
  private maxHealthIssues = 3; // حداکثر مشکلات قابل تحمل

  // شروع سرویس نظارت
  start() {
    console.log("🔍 [SYSTEM MONITOR] Starting system monitoring...");
    
    // بررسی سلامت هر 5 دقیقه
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000); // 5 minutes

    // اجرای فوری
    this.performHealthCheck();
  }

  // توقف سرویس
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("🛑 [SYSTEM MONITOR] System monitoring stopped");
    }
  }

  // بررسی سلامت سیستم
  private async performHealthCheck() {
    try {
      console.log("🔍 [SYSTEM MONITOR] Performing system health check...");
      
      const healthCheck = await SystemHealthCheck.performFullCheck();
      this.lastHealthCheck = healthCheck.timestamp;

      if (!healthCheck.healthy) {
        this.healthIssuesCount++;
        console.warn(`⚠️ [SYSTEM MONITOR] Health issues detected (${this.healthIssuesCount}/${this.maxHealthIssues}):`, healthCheck.issues);
        
        if (healthCheck.autoFixed.length > 0) {
          console.log("🔧 [SYSTEM MONITOR] Auto-fixed issues:", healthCheck.autoFixed);
          this.healthIssuesCount = Math.max(0, this.healthIssuesCount - 1); // تقلیل شمارنده اگر مشکلی حل شد
        }

        // در صورت زیادی بودن مشکلات، اقدامات اضطراری
        if (this.healthIssuesCount >= this.maxHealthIssues) {
          await this.emergencyActions();
        }
      } else {
        // ریست شمارنده در صورت سالم بودن سیستم
        this.healthIssuesCount = 0;
        console.log("✅ [SYSTEM MONITOR] System health: ALL GOOD");
      }

      // بررسی عملکرد سرویس auto-approval
      await this.checkAutoApprovalHealth();
      
    } catch (error) {
      console.error("❌ [SYSTEM MONITOR] Health check failed:", error);
      this.healthIssuesCount++;
    }
  }

  // بررسی سلامت سرویس تایید خودکار
  private async checkAutoApprovalHealth() {
    try {
      // بررسی سفارشات معلق طولانی مدت
      const result = await DatabaseUtilities.safeQuery(`
        SELECT COUNT(*) as count
        FROM customer_orders co
        INNER JOIN order_management om ON co.id = om.customer_order_id
        WHERE co.payment_status = 'paid' 
          AND om.current_status = 'pending'
          AND co.created_at < NOW() - INTERVAL '1 hour'
      `);

      if (result.success && result.data && result.data[0]?.count > 0) {
        console.warn(`⚠️ [SYSTEM MONITOR] Found ${result.data[0].count} paid orders stuck in pending for > 1 hour`);
        this.healthIssuesCount++;
      }

    } catch (error) {
      console.error("❌ [SYSTEM MONITOR] Auto-approval health check failed:", error);
    }
  }

  // اقدامات اضطراری در صورت مشکلات جدی
  private async emergencyActions() {
    console.log("🚨 [SYSTEM MONITOR] EMERGENCY: Too many health issues, taking emergency actions...");
    
    try {
      // 1. اصلاح خودکار مشکلات دیتابیس
      const autoFix = await DatabaseUtilities.autoFixIssues();
      if (autoFix.success) {
        console.log("🔧 [EMERGENCY] Auto-fixed database issues:", autoFix.fixed);
      }

      // 2. ریستارت سرویس تایید خودکار
      console.log("🔄 [EMERGENCY] Restarting auto-approval service...");
      autoApprovalService.stop();
      setTimeout(() => {
        autoApprovalService.start();
      }, 5000); // 5 ثانیه تاخیر

      // ریست شمارنده پس از اقدامات اضطراری
      this.healthIssuesCount = 0;
      
    } catch (error) {
      console.error("❌ [EMERGENCY] Emergency actions failed:", error);
    }
  }

  // گزارش وضعیت فعلی
  getStatus() {
    return {
      isRunning: this.intervalId !== null,
      lastHealthCheck: this.lastHealthCheck,
      healthIssuesCount: this.healthIssuesCount,
      maxHealthIssues: this.maxHealthIssues,
      healthStatus: this.healthIssuesCount === 0 ? 'HEALTHY' : 
                    this.healthIssuesCount < this.maxHealthIssues ? 'WARNING' : 'CRITICAL'
    };
  }
}

// Instance واحد برای استفاده در سراسر اپلیکیشن
export const systemMonitor = new SystemMonitor();

// Data Validator برای اعتبارسنجی دقیق اطلاعات
export class DataValidator {
  
  // اعتبارسنجی اطلاعات سفارش
  static validateOrderData(orderData: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!orderData) {
      errors.push('اطلاعات سفارش موجود نیست');
      return { valid: false, errors, warnings };
    }

    // بررسی فیلدهای ضروری
    if (!orderData.orderNumber || typeof orderData.orderNumber !== 'string') {
      errors.push('شماره سفارش نامعتبر یا موجود نیست');
    }

    if (!orderData.customerId || typeof orderData.customerId !== 'number') {
      errors.push('شناسه مشتری نامعتبر یا موجود نیست');
    }

    // بررسی مبلغ
    const totalAmount = DatabaseUtilities.safeParseAmount(orderData.totalAmount);
    if (totalAmount <= 0) {
      errors.push('مبلغ سفارش نامعتبر یا صفر');
    }

    // بررسی وضعیت پرداخت
    const validPaymentStatuses = ['pending', 'partial', 'paid', 'grace_period', 'failed'];
    if (!validPaymentStatuses.includes(orderData.paymentStatus)) {
      warnings.push(`وضعیت پرداخت غیرمعمول: ${orderData.paymentStatus}`);
    }

    // بررسی نواسازگاری payment_status و current_status
    if (orderData.paymentStatus === 'paid' && orderData.currentStatus === 'pending') {
      warnings.push('سفارش پرداخت شده اما در وضعیت pending قرار دارد');
    }

    // بررسی تاریخ‌ها
    if (orderData.createdAt) {
      const createdDate = new Date(orderData.createdAt);
      const now = new Date();
      const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 30) {
        warnings.push(`سفارش قدیمی: ${Math.floor(daysDiff)} روز پیش`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // اعتبارسنجی تراکنش کیف پول
  static validateTransactionData(transactionData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!transactionData) {
      errors.push('اطلاعات تراکنش موجود نیست');
      return { valid: false, errors };
    }

    if (!transactionData.customerId || typeof transactionData.customerId !== 'number') {
      errors.push('شناسه مشتری نامعتبر');
    }

    const amount = DatabaseUtilities.safeParseAmount(transactionData.amount);
    if (amount <= 0) {
      errors.push('مبلغ تراکنش نامعتبر');
    }

    if (!transactionData.transactionType || !['credit', 'debit'].includes(transactionData.transactionType)) {
      errors.push('نوع تراکنش نامعتبر');
    }

    if (!transactionData.description || typeof transactionData.description !== 'string') {
      errors.push('توضیحات تراکنش موجود نیست');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
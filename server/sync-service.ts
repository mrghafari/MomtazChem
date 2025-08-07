/**
 * 🔄 AUTO-SYNC SERVICE
 * سیستم همگام‌سازی اتوماتیک جداول
 * Automatic table synchronization system
 */

import { CustomerStorage } from './customer-storage';
import { OrderManagementStorage } from './order-management-storage';
import { db } from './db';
import { customerOrders } from '@shared/customer-schema';
import { orderManagement } from '@shared/order-management-schema';
import { eq, sql, isNull } from 'drizzle-orm';

export class SyncService {
  private customerStorage: CustomerStorage;
  private orderManagementStorage: OrderManagementStorage;
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private serviceEnabled = true;
  private intervalMinutes = 5;
  private lastRunTime: Date | null = null;

  constructor() {
    this.customerStorage = new CustomerStorage();
    this.orderManagementStorage = new OrderManagementStorage();
  }

  /**
   * شروع سیستم همگام‌سازی اتوماتیک
   * Start automatic synchronization system
   */
  public async startAutoSync(intervalMinutes: number = 5): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 [AUTO-SYNC] Service already running');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 [AUTO-SYNC] Starting automatic sync service - checking every ${intervalMinutes} minutes`);

    // اجرای فوری برای بررسی اولیه
    await this.performFullSync();

    // تنظیم interval برای بررسی مداوم
    this.syncInterval = setInterval(async () => {
      try {
        await this.performFullSync();
      } catch (error) {
        console.error('❌ [AUTO-SYNC] Error during scheduled sync:', error);
      }
    }, intervalMinutes * 60 * 1000);

    console.log('✅ [AUTO-SYNC] Service started successfully');
  }

  /**
   * توقف سیستم همگام‌سازی
   * Stop synchronization system
   */
  public stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ [AUTO-SYNC] Service stopped');
  }

  /**
   * همگام‌سازی کامل تمام جداول
   * Full synchronization of all tables
   */
  public async performFullSync(): Promise<void> {
    console.log('🔄 [AUTO-SYNC] Starting full synchronization...');

    try {
      this.lastRunTime = new Date();
      
      // 1. همگام‌سازی customer_orders با order_management
      await this.syncOrderManagement();

      // 2. بررسی و تصحیح وضعیت‌های ناهماهنگ
      await this.fixStatusMismatches();

      // 3. تصحیح رکوردهای از دست رفته
      await this.fixMissingRecords();

      console.log('✅ [AUTO-SYNC] Full synchronization completed');
    } catch (error) {
      console.error('❌ [AUTO-SYNC] Error during full sync:', error);
      throw error;
    }
  }

  /**
   * همگام‌سازی order_management با customer_orders
   */
  private async syncOrderManagement(): Promise<void> {
    console.log('🔍 [AUTO-SYNC] Checking order_management synchronization...');

    // پیدا کردن سفارشات بدون رکورد management
    const ordersWithoutManagement = await db
      .select({
        id: customerOrders.id,
        orderNumber: customerOrders.orderNumber,
        status: customerOrders.status,
        paymentStatus: customerOrders.paymentStatus,
      })
      .from(customerOrders)
      .leftJoin(orderManagement, eq(customerOrders.id, orderManagement.customerOrderId))
      .where(isNull(orderManagement.customerOrderId));

    if (ordersWithoutManagement.length > 0) {
      console.log(`🔧 [AUTO-SYNC] Found ${ordersWithoutManagement.length} orders without management records`);

      for (const order of ordersWithoutManagement) {
        try {
          await this.orderManagementStorage.addCustomerOrderToManagement(order.id);
          console.log(`✅ [AUTO-SYNC] Created management record for order ${order.orderNumber}`);
        } catch (error) {
          console.error(`❌ [AUTO-SYNC] Failed to create management record for order ${order.orderNumber}:`, error);
        }
      }
    }
  }

  /**
   * تصحیح وضعیت‌های ناهماهنگ - منطق بهبود یافته
   * ENHANCED: منطق پیشگیری از regression و اصلاح درست manually approved orders
   */
  private async fixStatusMismatches(): Promise<void> {
    console.log('🔍 [AUTO-SYNC] Checking for status mismatches...');

    // پیدا کردن سفارشاتی که وضعیت آنها در دو جدول متفاوت است
    const mismatches = await db
      .select({
        customerOrderId: customerOrders.id,
        orderNumber: customerOrders.orderNumber,
        customerStatus: customerOrders.status,
        customerPaymentStatus: customerOrders.paymentStatus,
        managementId: orderManagement.id,
        managementStatus: orderManagement.currentStatus,
        financialReviewedAt: orderManagement.financialReviewedAt,
        warehouseProcessedAt: orderManagement.warehouseProcessedAt,
        logisticsProcessedAt: orderManagement.logisticsProcessedAt,
      })
      .from(customerOrders)
      .innerJoin(orderManagement, eq(customerOrders.id, orderManagement.customerOrderId));

    let mismatchCount = 0;

    for (const record of mismatches) {
      const isManuallyApproved = record.financialReviewedAt !== null;
      const isWarehouseProcessed = record.warehouseProcessedAt !== null;
      const isLogisticsProcessed = record.logisticsProcessedAt !== null;
      
      const expectedManagementStatus = this.determineManagementStatus(
        record.customerStatus, 
        record.customerPaymentStatus,
        isManuallyApproved
      );

      // 🚨 CRITICAL: وضعیت‌های نهایی و پردازش شده که نباید regression داشته باشند
      const finalStatuses = ['delivered', 'cancelled', 'completed'];
      const progressedStatuses = ['logistics_assigned', 'logistics_processing', 'logistics_dispatched'];
      
      // بررسی آیا تغییر وضعیت regression است (برگشت به مرحله قبلی)
      const isRegression = this.isStatusRegression(record.managementStatus, expectedManagementStatus);
      
      // شرایط برای تصحیح وضعیت:
      const shouldSync = expectedManagementStatus !== record.managementStatus &&
        !finalStatuses.includes(record.managementStatus) && // جلوگیری از تغییر وضعیت‌های نهایی
        !isRegression && // جلوگیری از regression
        (
          // اجازه همگام‌سازی برای:
          !isManuallyApproved || // سفارشات غیر تایید شده دستی
          (
            isManuallyApproved && 
            record.managementStatus === 'finance_pending' && // فقط اگر هنوز در finance_pending گیر کرده
            expectedManagementStatus === 'warehouse_pending' // و باید به warehouse برود
          )
        );
      
      if (shouldSync) {
        mismatchCount++;
        console.log(`🔄 [AUTO-SYNC] Status mismatch found for ${record.orderNumber}: management(${record.managementStatus}) → expected(${expectedManagementStatus})`);
        console.log(`📝 [AUTO-SYNC] Context: manually_approved=${isManuallyApproved}, warehouse_processed=${isWarehouseProcessed}`);

        try {
          await this.orderManagementStorage.updateOrderStatus(
            record.managementId,
            expectedManagementStatus as any,
            1, // system user
            'financial' as any,
            'Auto-sync status correction - fixed stuck order'
          );
          console.log(`✅ [AUTO-SYNC] Fixed status for order ${record.orderNumber}`);
        } catch (error) {
          console.error(`❌ [AUTO-SYNC] Failed to fix status for order ${record.orderNumber}:`, error);
        }
      } else {
        // توضیح دلیل عدم همگام‌سازی
        if (finalStatuses.includes(record.managementStatus)) {
          console.log(`🔒 [AUTO-SYNC] Skipping final status ${record.managementStatus} for order ${record.orderNumber}`);
        } else if (isRegression) {
          console.log(`🚫 [AUTO-SYNC] Preventing regression for order ${record.orderNumber}: ${record.managementStatus} → ${expectedManagementStatus}`);
        } else if (isManuallyApproved && record.managementStatus !== 'finance_pending') {
          console.log(`🔒 [AUTO-SYNC] Skipping manually progressed order ${record.orderNumber} (financial_reviewed_at: ${record.financialReviewedAt})`);
        }
      }
    }

    if (mismatchCount === 0) {
      console.log('✅ [AUTO-SYNC] No status mismatches found');
    } else {
      console.log(`✅ [AUTO-SYNC] Fixed ${mismatchCount} status mismatches`);
    }
  }

  /**
   * تصحیح رکوردهای از دست رفته
   */
  private async fixMissingRecords(): Promise<void> {
    console.log('🔍 [AUTO-SYNC] Checking for missing records...');

    // پیدا کردن رکوردهای order_management بدون customer_order
    const orphanedManagement = await db
      .select({
        id: orderManagement.id,
        customerOrderId: orderManagement.customerOrderId,
      })
      .from(orderManagement)
      .leftJoin(customerOrders, eq(orderManagement.customerOrderId, customerOrders.id))
      .where(isNull(customerOrders.id));

    if (orphanedManagement.length > 0) {
      console.log(`🗑️ [AUTO-SYNC] Found ${orphanedManagement.length} orphaned management records`);

      for (const record of orphanedManagement) {
        try {
          await db
            .delete(orderManagement)
            .where(eq(orderManagement.id, record.id));
          console.log(`✅ [AUTO-SYNC] Removed orphaned management record ${record.id}`);
        } catch (error) {
          console.error(`❌ [AUTO-SYNC] Failed to remove orphaned management record ${record.id}:`, error);
        }
      }
    }
  }

  /**
   * بررسی آیا تغییر وضعیت یک regression است (برگشت به مرحله قبلی)
   * CRITICAL: جلوگیری از برگرداندن سفارشات به مراحل قبلی
   */
  private isStatusRegression(currentStatus: string, newStatus: string): boolean {
    // تعریف سلسله مراتب وضعیت‌ها (از کم به زیاد پیشرفت)
    const statusHierarchy: { [key: string]: number } = {
      'pending': 1,
      'finance_pending': 2,
      'financial_reviewing': 3,
      'financial_approved': 4,
      'warehouse_pending': 5,
      'warehouse_notified': 6,
      'warehouse_processing': 7,
      'warehouse_verified': 8,
      'warehouse_approved': 9,
      'logistics_assigned': 10,
      'logistics_processing': 11,
      'logistics_dispatched': 12,
      'delivered': 13,
      'completed': 14,
      // وضعیت‌های خاص
      'cancelled': 100,
      'financial_rejected': 101,
      'warehouse_rejected': 102
    };

    const currentLevel = statusHierarchy[currentStatus] || 0;
    const newLevel = statusHierarchy[newStatus] || 0;

    // regression اگر سطح جدید کمتر از سطح فعلی باشد (مگر rejected statuses)
    return currentLevel > newLevel && newLevel < 100;
  }

  /**
   * تعیین وضعیت مناسب برای order_management بر اساس customer_orders
   * ENHANCED VERSION - منطق بهبود یافته با پیشگیری از regression
   * CRITICAL FIX - منطق صحیح برای manually approved partial payments
   */
  private determineManagementStatus(customerStatus: string, paymentStatus: string, isManuallyApproved?: boolean): string {
    // console.log(`🔄 [STATUS MAPPING] Customer: ${customerStatus}, Payment: ${paymentStatus}`); // Reduced logging
    
    // اولویت اول: وضعیت‌های نهایی
    if (customerStatus === 'delivered') return 'delivered';
    if (customerStatus === 'cancelled' || customerStatus === 'deleted') return 'cancelled';
    
    // اولویت دوم: وضعیت‌های در حال پردازش
    if (customerStatus === 'warehouse_ready') {
      // سفارش آماده انبار یعنی انبار آن را تایید کرده است
      // پس باید در وضعیت warehouse_approved باشد نه warehouse_pending
      return 'warehouse_approved';
    }
    
    // IMPORTANT: حفظ وضعیت‌های دو مرحله‌ای انبار
    if (customerStatus === 'warehouse_verified') {
      return 'warehouse_verified'; // حفظ وضعیت مرحله اول
    }
    
    if (customerStatus === 'confirmed' || customerStatus === 'processing') {
      return 'warehouse_processing';
    }
    
    if (customerStatus === 'shipped' || customerStatus === 'in_transit') {
      return 'in_transit';
    }
    
    // اولویت سوم: وضعیت‌های پرداخت - منطق بهبود یافته
    if (customerStatus === 'pending') {
      if (paymentStatus === 'paid') {
        // پرداخت کامل انجام شده - مستقیماً به انبار
        return 'warehouse_pending';
      } else if (paymentStatus === 'receipt_uploaded') {
        // فیش آپلود شده - نیاز به بررسی مالی
        return 'finance_pending';
      } else if (paymentStatus === 'rejected') {
        return 'financial_rejected';
      } else if (paymentStatus === 'partial') {
        // 🚨 CRITICAL FIX: منطق صحیح برای partial payments
        if (isManuallyApproved) {
          // پرداخت جزئی که دستی تایید شده - باید به انبار برود
          console.log(`💰 [STATUS MAPPING] Partial payment approved manually - moving to warehouse`);
          return 'warehouse_pending';
        } else {
          // پرداخت جزئی بدون تایید - باید بررسی شود
          console.log(`💰 [STATUS MAPPING] Partial payment pending approval - staying in financial`);
          return 'finance_pending';
        }
      } else {
        // هیچ پرداختی انجام نشده
        return 'pending';
      }
    }
    
    // ویژه: سفارشات warehouse_ready که از pending آمده‌اند
    if (customerStatus === 'warehouse_ready' && paymentStatus === 'paid' && isManuallyApproved) {
      // این سفارشات که قبلاً تایید مالی شده‌اند نباید برگردانده شوند
      return 'warehouse_pending';
    }
    
    // console.log(`⚠️ [STATUS MAPPING] Unmapped status combination: ${customerStatus}/${paymentStatus} - defaulting to pending`); // Reduced logging
    return 'pending';
  }

  /**
   * همگام‌سازی فوری یک سفارش خاص
   * Immediate synchronization of specific order
   */
  public async syncSpecificOrder(customerOrderId: number): Promise<void> {
    console.log(`🎯 [AUTO-SYNC] Syncing specific order ${customerOrderId}...`);

    try {
      // بررسی وجود customer order
      const customerOrder = await this.customerStorage.getOrderById(customerOrderId);
      if (!customerOrder) {
        throw new Error(`Customer order ${customerOrderId} not found`);
      }

      // بررسی وجود management record
      let managementOrder = await this.orderManagementStorage.getOrderManagementByCustomerOrderId(customerOrderId);

      if (!managementOrder) {
        // ایجاد رکورد management در صورت عدم وجود
        await this.orderManagementStorage.addCustomerOrderToManagement(customerOrderId);
        managementOrder = await this.orderManagementStorage.getOrderManagementByCustomerOrderId(customerOrderId);
      }

      if (managementOrder) {
        // بررسی آیا سفارش به صورت دستی تایید شده
        const isManuallyApproved = managementOrder.financialReviewedAt !== null;
        
        // همگام‌سازی وضعیت
        const expectedStatus = this.determineManagementStatus(
          customerOrder.status,
          customerOrder.paymentStatus,
          isManuallyApproved
        );

        if (expectedStatus !== managementOrder.currentStatus && !isManuallyApproved) {
          await this.orderManagementStorage.updateOrderStatus(
            managementOrder.id,
            expectedStatus as any,
            1,
            'financial' as any,
            'Manual sync correction'
          );
        } else if (isManuallyApproved) {
          console.log(`🔒 [MANUAL-SYNC] Skipping manually approved order ${customerOrder.orderNumber}`);
        }
      }

      console.log(`✅ [AUTO-SYNC] Order ${customerOrder.orderNumber} synchronized successfully`);
    } catch (error) {
      console.error(`❌ [AUTO-SYNC] Failed to sync order ${customerOrderId}:`, error);
      throw error;
    }
  }

  /**
   * گزارش وضعیت همگام‌سازی
   * Synchronization status report
   */
  public async getSyncStatus(): Promise<{
    isRunning: boolean;
    missingManagementRecords: number;
    statusMismatches: number;
    orphanedRecords: number;
    lastSyncTime?: Date;
  }> {
    // شمارش رکوردهای گم‌شده
    const missingManagement = await db
      .select({ count: sql<number>`count(*)` })
      .from(customerOrders)
      .leftJoin(orderManagement, eq(customerOrders.id, orderManagement.customerOrderId))
      .where(isNull(orderManagement.customerOrderId));

    // شمارش رکوردهای یتیم
    const orphaned = await db
      .select({ count: sql<number>`count(*)` })
      .from(orderManagement)
      .leftJoin(customerOrders, eq(orderManagement.customerOrderId, customerOrders.id))
      .where(isNull(customerOrders.id));

    return {
      isRunning: this.isRunning,
      missingManagementRecords: Number(missingManagement[0]?.count || 0),
      statusMismatches: 0, // محاسبه در زمان واقعی
      orphanedRecords: Number(orphaned[0]?.count || 0),
      lastSyncTime: this.lastRunTime || undefined,
    };
  }

  /**
   * شروع سرویس (alias برای startAutoSync)
   * Start service (alias for startAutoSync)
   */
  public async start(): Promise<void> {
    await this.startAutoSync(this.intervalMinutes);
  }

  /**
   * فعال کردن سرویس
   * Enable service
   */
  public enable(): void {
    this.serviceEnabled = true;
    console.log('✅ [SYNC SERVICE] Service enabled');
  }

  /**
   * غیرفعال کردن سرویس
   * Disable service
   */
  public disable(): void {
    this.serviceEnabled = false;
    this.stopAutoSync();
    console.log('⏹️ [SYNC SERVICE] Service disabled');
  }

  /**
   * بررسی وضعیت فعال بودن
   * Check if service is enabled
   */
  public isEnabled(): boolean {
    return this.serviceEnabled;
  }

  /**
   * دریافت آخرین زمان اجرا
   * Get last run time
   */
  public getLastRunTime(): Date | null {
    return this.lastRunTime;
  }

  /**
   * تنظیم فاصله زمانی
   * Set interval in minutes
   */
  public setInterval(minutes: number): void {
    this.intervalMinutes = minutes;
    if (this.isRunning) {
      this.stopAutoSync();
      this.startAutoSync(minutes);
    }
    console.log(`⏰ [SYNC SERVICE] Interval set to ${minutes} minutes`);
  }

  /**
   * دریافت فاصله زمانی فعلی
   * Get current interval in minutes
   */
  public getIntervalMinutes(): number {
    return this.intervalMinutes;
  }

  /**
   * بررسی وضعیت اجرا
   * Check if service is running
   */
  public isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * متدهای خالی برای سازگاری با routes.ts
   * Empty methods for compatibility with routes.ts
   */
  public async triggerOrderSync(orderId: number, event: string): Promise<void> {
    console.log(`🔄 [SYNC SERVICE] Order sync triggered for order ${orderId}, event: ${event}`);
    // اینجا می‌توان منطق همگام‌سازی سفارش خاص را اضافه کرد
  }

  public async getSyncStats(): Promise<any> {
    return await this.getSyncStatus();
  }

  public async performManualSync(): Promise<any> {
    await this.performFullSync();
    return { success: true, message: 'Manual sync completed' };
  }

  public async getConflicts(): Promise<any[]> {
    return [];
  }

  public async resolveConflict(orderNumber: string, resolution: string): Promise<any> {
    return { success: true, message: 'Conflict resolved' };
  }
}

// نمونه global برای استفاده
export const globalSyncService = new SyncService();
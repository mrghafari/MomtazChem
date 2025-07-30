// AUTOMATIC ORDER SYNCHRONIZATION SERVICE
// This service runs continuously to prevent and fix order status mismatches

import OrderStatusSyncMonitor from './order-sync-monitor';
import OrderSyncPrevention from './order-sync-prevention';

export class AutomaticSyncService {
  private static syncInterval: NodeJS.Timeout | null = null;
  private static isRunning = false;

  // Start automatic synchronization monitoring
  static startAutomaticSync(intervalMinutes: number = 30): void {
    if (this.isRunning) {
      console.log('🔄 [AUTO SYNC] سرویس همگام‌سازی خودکار در حال اجرا است');
      return;
    }

    console.log(`🚀 [AUTO SYNC] شروع سرویس همگام‌سازی خودکار - بازه: ${intervalMinutes} دقیقه`);
    
    this.isRunning = true;
    
    // Run immediately on start
    this.performSyncCheck();
    
    // Set up recurring sync checks
    this.syncInterval = setInterval(() => {
      this.performSyncCheck();
    }, intervalMinutes * 60 * 1000);
  }

  // Stop automatic synchronization
  static stopAutomaticSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ [AUTO SYNC] سرویس همگام‌سازی خودکار متوقف شد');
  }

  // Perform comprehensive sync check and correction
  private static async performSyncCheck(): Promise<void> {
    try {
      console.log('🔍 [AUTO SYNC] شروع بررسی همگام‌سازی خودکار...');
      
      // Step 1: Check for and fix mismatches
      const monitorResult = await OrderStatusSyncMonitor.autoFixStatusMismatches();
      
      // Step 2: Prevent sync drift
      const preventionResult = await OrderSyncPrevention.preventSyncDrift();
      
      const totalFixed = monitorResult.fixed + preventionResult.corrected;
      const totalIssues = monitorResult.issues.length + preventionResult.issues.length;
      
      if (totalFixed > 0) {
        console.log(`✅ [AUTO SYNC] تصحیح خودکار تکمیل شد: ${totalFixed}/${totalIssues} مشکل حل شد`);
      } else {
        console.log('✅ [AUTO SYNC] همه سفارش‌ها همگام‌سازی شده‌اند');
      }
      
    } catch (error) {
      console.error('❌ [AUTO SYNC] خطا در بررسی همگام‌سازی خودکار:', error);
    }
  }

  // Get sync service status
  static getStatus(): { isRunning: boolean; nextCheck?: Date } {
    return {
      isRunning: this.isRunning,
      nextCheck: this.syncInterval ? new Date(Date.now() + 30 * 60 * 1000) : undefined
    };
  }

  // Force immediate sync check
  static async forceSyncCheck(): Promise<{ fixed: number; total: number }> {
    console.log('🔄 [AUTO SYNC] اجرای فوری بررسی همگام‌سازی...');
    
    try {
      const monitorResult = await OrderStatusSyncMonitor.autoFixStatusMismatches();
      const preventionResult = await OrderSyncPrevention.preventSyncDrift();
      
      const totalFixed = monitorResult.fixed + preventionResult.corrected;
      const totalIssues = monitorResult.issues.length + preventionResult.issues.length;
      
      console.log(`✅ [AUTO SYNC] بررسی فوری تکمیل شد: ${totalFixed}/${totalIssues} مشکل حل شد`);
      
      return { fixed: totalFixed, total: totalIssues };
    } catch (error) {
      console.error('❌ [AUTO SYNC] خطا در بررسی فوری:', error);
      return { fixed: 0, total: 0 };
    }
  }
}

// Note: Auto-start will be handled by routes.ts to avoid startup issues
// AutomaticSyncService.startAutomaticSync(30);

export default AutomaticSyncService;
import { customerStorage } from './customer-storage';
import { walletStorage } from './wallet-storage';

class AutoRefundScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * شروع scheduler برای بررسی و refund خودکار تراکنش‌های ناموفق
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Auto-refund scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting auto-refund scheduler - checking every 15 minutes');

    // اجرای اولیه
    this.processFailedTransactions();

    // تنظیم interval برای اجرای هر 15 دقیقه
    this.intervalId = setInterval(() => {
      this.processFailedTransactions();
    }, 15 * 60 * 1000); // 15 minutes
  }

  /**
   * توقف scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Auto-refund scheduler stopped');
  }

  /**
   * پردازش و refund تراکنش‌های ناموفق
   */
  private async processFailedTransactions() {
    try {
      console.log('🔍 Auto-refund scheduler: Checking for failed transactions...');
      
      // Get all pending orders older than 10 minutes (failed transactions)
      const cutoffTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const failedOrders = await customerStorage.getFailedOrders(cutoffTime);
      
      // همچنین بررسی تراکنش‌های wallet بدون سفارش متناظر
      const orphanedTransactions = await customerStorage.getOrphanedWalletTransactions(cutoffTime);
      
      if (failedOrders.length === 0 && orphanedTransactions.length === 0) {
        console.log('✅ No failed transactions found');
        return;
      }

      console.log(`🚨 Found ${failedOrders.length} failed orders and ${orphanedTransactions.length} orphaned wallet transactions to process`);
      
      let refundedCount = 0;
      
      for (const order of failedOrders) {
        try {
          // Check if order used wallet_partial payment and has wallet amount
          if (order.paymentMethod === 'wallet_partial' && order.walletAmountUsed && parseFloat(order.walletAmountUsed) > 0) {
            console.log(`💰 Auto-refunding wallet amount for failed order: ${order.orderNumber}`);
            
            const refundResult = await walletStorage.refundWalletAmount(
              order.customerId,
              parseFloat(order.walletAmountUsed),
              `بازگشت خودکار وجه - تراکنش ناموفق ${order.orderNumber}`,
              order.orderNumber
            );
            
            if (refundResult.success) {
              // Update order status to cancelled
              await customerStorage.updateOrderPaymentStatus(order.id, 'cancelled');
              
              refundedCount++;
              console.log(`✅ Auto-refund successful: ${order.walletAmountUsed} IQD returned to customer ${order.customerId}`);
              
              // Log for audit trail
              console.log(`📝 AUDIT: Auto-refund processed - Order: ${order.orderNumber}, Customer: ${order.customerId}, Amount: ${order.walletAmountUsed} IQD`);
            } else {
              console.error(`❌ Auto-refund failed for order ${order.orderNumber}:`, refundResult.error);
            }
          } else if (order.paymentMethod === 'online_payment') {
            // For online payments, just mark as cancelled (no wallet refund needed)
            await customerStorage.updateOrderPaymentStatus(order.id, 'cancelled');
            console.log(`⚠️ Online payment order ${order.orderNumber} marked as cancelled (no wallet refund needed)`);
          }
        } catch (orderError) {
          console.error(`❌ Error processing failed order ${order.orderNumber}:`, orderError);
        }
      }
      
      // پردازش orphaned wallet transactions
      for (const transaction of orphanedTransactions) {
        try {
          console.log(`💰 Auto-refunding orphaned wallet transaction: ${transaction.orderNumber}`);
          
          const refundResult = await walletStorage.refundWalletAmount(
            transaction.customerId,
            parseFloat(transaction.amount),
            `بازگشت خودکار وجه - تراکنش یتیم ${transaction.orderNumber}`,
            transaction.orderNumber
          );
          
          if (refundResult.success) {
            refundedCount++;
            console.log(`✅ Orphaned transaction refund successful: ${transaction.amount} IQD returned to customer ${transaction.customerId}`);
            
            // Log for audit trail
            console.log(`📝 AUDIT: Orphaned transaction refunded - Order: ${transaction.orderNumber}, Customer: ${transaction.customerId}, Amount: ${transaction.amount} IQD`);
          } else {
            console.error(`❌ Orphaned transaction refund failed for ${transaction.orderNumber}:`, refundResult.error);
          }
        } catch (transactionError) {
          console.error(`❌ Error processing orphaned transaction ${transaction.orderNumber}:`, transactionError);
        }
      }
      
      console.log(`🏁 Auto-refund process completed: ${refundedCount} transactions refunded out of ${failedOrders.length} failed orders and ${orphanedTransactions.length} orphaned transactions`);
      
    } catch (error) {
      console.error('❌ Auto-refund scheduler error:', error);
    }
  }

  /**
   * وضعیت scheduler
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      startTime: this.intervalId ? new Date() : null
    };
  }
}

// Export singleton instance
export const autoRefundScheduler = new AutoRefundScheduler();
// =============================================================================
// AUTOMATIC INVOICE CONVERSION SERVICE
// =============================================================================
// This service automatically converts proforma invoices to invoices
// when orders are shipped or delivered from warehouse

import { db } from './db';
import { customerOrders } from '@shared/customer-schema';
import { eq, and, or } from 'drizzle-orm';
import ProformaInvoiceConverter from './proforma-invoice-converter';

export class AutoInvoiceConverter {
  /**
   * Auto-convert proforma to invoice when order status changes to shipped/delivered
   */
  static async handleOrderStatusChange(orderNumber: string, newStatus: string): Promise<boolean> {
    try {
      // Only convert when order is shipped or delivered
      if (!['shipped', 'delivered'].includes(newStatus)) {
        return false;
      }

      console.log(`🚀 [AUTO INVOICE] Order ${orderNumber} status changed to ${newStatus} - checking for conversion`);

      // Get order details
      const [order] = await db
        .select()
        .from(customerOrders)
        .where(eq(customerOrders.orderNumber, orderNumber));

      if (!order) {
        console.log(`❌ [AUTO INVOICE] Order not found: ${orderNumber}`);
        return false;
      }

      // Check if it's currently a proforma
      if (order.invoiceType !== 'proforma') {
        console.log(`ℹ️ [AUTO INVOICE] Order ${orderNumber} is already ${order.invoiceType} - no conversion needed`);
        return false;
      }

      // Convert proforma to invoice
      console.log(`🔄 [AUTO INVOICE] Converting order ${orderNumber} from proforma to invoice automatically`);
      
      const success = await ProformaInvoiceConverter.convertProformaToInvoice(orderNumber);
      
      if (success) {
        console.log(`✅ [AUTO INVOICE] Successfully auto-converted order ${orderNumber} to invoice`);
        return true;
      } else {
        console.log(`❌ [AUTO INVOICE] Failed to auto-convert order ${orderNumber}`);
        return false;
      }

    } catch (error) {
      console.error(`💥 [AUTO INVOICE] Error in auto-conversion for order ${orderNumber}:`, error);
      return false;
    }
  }

  /**
   * Batch convert all shipped/delivered orders that are still proforma
   */
  static async convertAllEligibleOrders(): Promise<number> {
    try {
      console.log(`🔍 [AUTO INVOICE] Checking for shipped/delivered proforma orders...`);

      // Get all shipped/delivered orders that are still proforma
      const eligibleOrders = await db
        .select()
        .from(customerOrders)
        .where(
          and(
            eq(customerOrders.invoiceType, 'proforma'),
            or(
              eq(customerOrders.status, 'shipped'),
              eq(customerOrders.status, 'delivered')
            )
          )
        );

      if (eligibleOrders.length === 0) {
        console.log(`✅ [AUTO INVOICE] No eligible proforma orders found for conversion`);
        return 0;
      }

      console.log(`📋 [AUTO INVOICE] Found ${eligibleOrders.length} eligible proforma orders for auto-conversion`);

      let convertedCount = 0;
      for (const order of eligibleOrders) {
        const success = await ProformaInvoiceConverter.convertProformaToInvoice(order.orderNumber);
        if (success) {
          convertedCount++;
          console.log(`✅ [AUTO INVOICE] Auto-converted ${order.orderNumber} (${convertedCount}/${eligibleOrders.length})`);
        }
      }

      console.log(`🎯 [AUTO INVOICE] Auto-conversion completed: ${convertedCount}/${eligibleOrders.length} orders converted`);
      return convertedCount;

    } catch (error) {
      console.error(`💥 [AUTO INVOICE] Error in batch auto-conversion:`, error);
      return 0;
    }
  }

  /**
   * Start periodic check for auto-conversion (every 10 minutes)
   */
  static startPeriodicCheck(): void {
    console.log(`🕐 [AUTO INVOICE] Starting periodic auto-conversion check (every 10 minutes)`);
    
    // Run immediately on startup
    this.convertAllEligibleOrders();
    
    // Then run every 10 minutes
    setInterval(async () => {
      try {
        await this.convertAllEligibleOrders();
      } catch (error) {
        console.error(`💥 [AUTO INVOICE] Error in periodic check:`, error);
      }
    }, 10 * 60 * 1000); // 10 minutes
  }
}

export default AutoInvoiceConverter;
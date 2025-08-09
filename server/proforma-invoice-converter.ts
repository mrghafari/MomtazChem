// =============================================================================
// PROFORMA TO INVOICE CONVERSION SERVICE
// =============================================================================
// This service automatically converts proforma invoices to official invoices
// when orders are shipped from warehouse (status: warehouse_shipped)

import { db } from './db';
import { customerOrders } from '@shared/customer-schema';
import { eq, and } from 'drizzle-orm';

export class ProformaInvoiceConverter {
  /**
   * Convert proforma invoice to official invoice when order is shipped
   */
  static async convertProformaToInvoice(orderNumber: string): Promise<boolean> {
    try {
      console.log(`🧾 [INVOICE CONVERTER] Converting proforma to invoice for order: ${orderNumber}`);

      // Get order details
      const [order] = await db
        .select()
        .from(customerOrders)
        .where(eq(customerOrders.orderNumber, orderNumber));

      if (!order) {
        console.log(`❌ [INVOICE CONVERTER] Order not found: ${orderNumber}`);
        return false;
      }

      // Check if already converted
      if (order.invoiceType === 'official_invoice') {
        console.log(`✅ [INVOICE CONVERTER] Order ${orderNumber} already converted to official invoice`);
        return true;
      }

      // Convert proforma to official invoice
      const [updatedOrder] = await db
        .update(customerOrders)
        .set({
          invoiceType: 'official_invoice',
          invoiceConvertedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(customerOrders.orderNumber, orderNumber))
        .returning();

      if (updatedOrder) {
        console.log(`✅ [INVOICE CONVERTER] Successfully converted order ${orderNumber} from proforma to official invoice`);
        console.log(`📅 [INVOICE CONVERTER] Conversion date: ${updatedOrder.invoiceConvertedAt}`);
        return true;
      }

      console.log(`❌ [INVOICE CONVERTER] Failed to convert order ${orderNumber}`);
      return false;

    } catch (error) {
      console.error(`💥 [INVOICE CONVERTER] Error converting order ${orderNumber}:`, error);
      return false;
    }
  }

  /**
   * Check and convert all shipped orders that are still proforma
   */
  static async convertAllShippedProformas(): Promise<number> {
    try {
      console.log(`🔍 [INVOICE CONVERTER] Checking for shipped proforma orders...`);

      // Get all shipped orders that are still proforma
      const shippedProformaOrders = await db
        .select()
        .from(customerOrders)
        .where(
          and(
            eq(customerOrders.invoiceType, 'proforma'),
            eq(customerOrders.status, 'shipped')
          )
        );

      if (shippedProformaOrders.length === 0) {
        console.log(`✅ [INVOICE CONVERTER] No shipped proforma orders found`);
        return 0;
      }

      console.log(`📋 [INVOICE CONVERTER] Found ${shippedProformaOrders.length} shipped proforma orders to convert`);

      let convertedCount = 0;
      for (const order of shippedProformaOrders) {
        const success = await this.convertProformaToInvoice(order.orderNumber);
        if (success) {
          convertedCount++;
        }
      }

      console.log(`✅ [INVOICE CONVERTER] Converted ${convertedCount}/${shippedProformaOrders.length} orders`);
      return convertedCount;

    } catch (error) {
      console.error(`💥 [INVOICE CONVERTER] Error in batch conversion:`, error);
      return 0;
    }
  }

  /**
   * Get invoice type status for an order
   */
  static async getInvoiceStatus(orderNumber: string): Promise<{
    invoiceType: string;
    convertedAt: Date | null;
    isConverted: boolean;
  } | null> {
    try {
      const [order] = await db
        .select({
          invoiceType: customerOrders.invoiceType,
          invoiceConvertedAt: customerOrders.invoiceConvertedAt
        })
        .from(customerOrders)
        .where(eq(customerOrders.orderNumber, orderNumber));

      if (!order) {
        return null;
      }

      return {
        invoiceType: order.invoiceType || 'proforma',
        convertedAt: order.invoiceConvertedAt,
        isConverted: order.invoiceType === 'official_invoice'
      };

    } catch (error) {
      console.error(`💥 [INVOICE CONVERTER] Error getting invoice status for ${orderNumber}:`, error);
      return null;
    }
  }
}

export default ProformaInvoiceConverter;
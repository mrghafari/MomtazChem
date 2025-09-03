import { 
  consolidatedOrderData,
  type ConsolidatedOrderData,
  type InsertConsolidatedOrderData
} from "@shared/order-management-schema";
import { customerOrders, orderItems } from "@shared/customer-schema";
import { crmCustomers } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export class OrderConsolidationService {
  
  /**
   * Consolidates complete order information after financial approval
   * This function collects all scattered order data into a single, comprehensive record
   */
  async consolidateOrderData(orderManagementId: number, customerOrderId: number): Promise<ConsolidatedOrderData | null> {
    console.log(`📋 [CONSOLIDATION] Starting consolidation for order management ID ${orderManagementId}, customer order ID ${customerOrderId}`);
    
    try {
      // Check if already consolidated
      const existing = await db
        .select()
        .from(consolidatedOrderData)
        .where(eq(consolidatedOrderData.orderManagementId, orderManagementId))
        .limit(1);

      if (existing.length > 0) {
        console.log(`✅ [CONSOLIDATION] Order already consolidated: ${existing[0].orderNumber}`);
        return existing[0];
      }

      // 1. Get customer order details
      const customerOrder = await db
        .select()
        .from(customerOrders)
        .where(eq(customerOrders.id, customerOrderId))
        .limit(1);

      if (!customerOrder.length) {
        console.error(`❌ [CONSOLIDATION] Customer order not found: ${customerOrderId}`);
        return null;
      }

      const order = customerOrder[0];

      // 2. Get customer information
      const customer = await db
        .select()
        .from(crmCustomers)
        .where(eq(crmCustomers.id, order.customerId))
        .limit(1);

      if (!customer.length) {
        console.error(`❌ [CONSOLIDATION] Customer not found: ${order.customerId}`);
        return null;
      }

      const customerInfo = customer[0];

      // 3. Get all order items with detailed information
      const items = await db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          productName: orderItems.productName,
          productSku: orderItems.productSku,
          quantity: orderItems.quantity,
          unit: orderItems.unit,
          unitPrice: orderItems.unitPrice,
          totalPrice: orderItems.totalPrice,
          specifications: orderItems.specifications,
          notes: orderItems.notes
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, customerOrderId))
        .orderBy(orderItems.id);

      console.log(`📦 [CONSOLIDATION] Found ${items.length} items for order ${order.orderNumber}`);

      // 4. Calculate totals
      const itemsTotal = items.reduce((sum, item) => 
        sum + parseFloat(item.totalPrice?.toString() || '0'), 0
      );

      console.log(`💰 [CONSOLIDATION] Items total calculated: ${itemsTotal} ${order.currency}`);

      // 5. Get order management details (from existing logic)
      const orderMgmt = await db.query.orderManagement.findFirst({
        where: (table, { eq }) => eq(table.id, orderManagementId)
      });

      if (!orderMgmt) {
        console.error(`❌ [CONSOLIDATION] Order management record not found: ${orderManagementId}`);
        return null;
      }

      // 6. Get payment receipt information
      const paymentReceiptUrl = orderMgmt.paymentReceiptUrl;
      let receiptFileName = null;
      let receiptMimeType = null;

      if (paymentReceiptUrl) {
        // Extract filename from URL or use default pattern
        const urlParts = paymentReceiptUrl.split('/');
        receiptFileName = urlParts[urlParts.length - 1] || `receipt-${order.orderNumber}.pdf`;
        receiptMimeType = receiptFileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
      }

      // 7. Create consolidated record
      const consolidatedData: InsertConsolidatedOrderData = {
        orderManagementId: orderManagementId,
        customerOrderId: customerOrderId,
        orderNumber: order.orderNumber,
        
        // Customer information
        customerId: customerInfo.id,
        customerFirstName: customerInfo.firstName || '',
        customerLastName: customerInfo.lastName || '',
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone || '',
        
        // Order totals and pricing
        totalAmount: order.totalAmount.toString(),
        itemsTotal: itemsTotal.toString(),
        shippingCost: order.shippingCost?.toString() || '0.00',
        taxAmount: order.vatAmount?.toString() || '0.00',
        discountAmount: '0.00',
        currency: order.currency,
        
        // Payment information
        paymentMethod: order.paymentMethod || 'unknown',
        paymentStatus: order.paymentStatus || 'confirmed',
        paymentSourceLabel: orderMgmt.paymentSourceLabel || null,
        walletAmountUsed: orderMgmt.walletAmountUsed?.toString() || '0.00',
        bankAmountPaid: orderMgmt.bankAmountPaid?.toString() || '0.00',
        paymentReceiptUrl: paymentReceiptUrl,
        paymentReceiptFileName: receiptFileName,
        paymentReceiptMimeType: receiptMimeType,
        
        // Address information
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        
        // Recipient and delivery information
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        recipientAddress: order.recipientAddress,
        deliveryMethod: order.deliveryMethod || 'courier',
        deliveryNotes: order.deliveryNotes,
        
        // GPS and location information
        gpsLatitude: order.gpsLatitude?.toString() || null,
        gpsLongitude: order.gpsLongitude?.toString() || null,
        locationAccuracy: order.locationAccuracy?.toString() || null,
        hasGpsLocation: !!(order.gpsLatitude && order.gpsLongitude),
        
        // Weight and logistics
        totalWeight: orderMgmt.totalWeight?.toString() || null,
        weightUnit: orderMgmt.weightUnit || 'kg',
        
        // Order items as JSON
        orderItems: items,
        
        // Current status and workflow
        currentStatus: orderMgmt.currentStatus,
        
        // Financial approval information
        financialReviewerId: orderMgmt.financialReviewerId,
        financialReviewedAt: orderMgmt.financialReviewedAt,
        financialNotes: orderMgmt.financialNotes,
        
        // Warehouse information
        warehouseAssigneeId: orderMgmt.warehouseAssigneeId,
        warehouseProcessedAt: orderMgmt.warehouseProcessedAt,
        warehouseNotes: orderMgmt.warehouseNotes,
        
        // Logistics information
        logisticsAssigneeId: orderMgmt.logisticsAssigneeId,
        logisticsProcessedAt: orderMgmt.logisticsProcessedAt,
        logisticsNotes: orderMgmt.logisticsNotes,
        trackingNumber: orderMgmt.trackingNumber,
        estimatedDeliveryDate: orderMgmt.estimatedDeliveryDate,
        actualDeliveryDate: orderMgmt.actualDeliveryDate,
        
        // Invoice information
        invoiceType: order.invoiceType || 'proforma',
        invoiceConvertedAt: order.invoiceConvertedAt,
      };

      // 8. Insert consolidated record
      const result = await db
        .insert(consolidatedOrderData)
        .values(consolidatedData)
        .returning();

      console.log(`✅ [CONSOLIDATION] Order successfully consolidated: ${order.orderNumber} (ID: ${result[0].id})`);
      
      return result[0];

    } catch (error) {
      console.error(`❌ [CONSOLIDATION] Failed to consolidate order ${orderManagementId}:`, error);
      throw error;
    }
  }

  /**
   * Updates consolidated order data when order status changes
   */
  async updateConsolidatedOrder(orderManagementId: number, updateData: Partial<InsertConsolidatedOrderData>): Promise<ConsolidatedOrderData | null> {
    console.log(`🔄 [CONSOLIDATION] Updating consolidated order for management ID ${orderManagementId}`);
    
    try {
      updateData.lastUpdatedAt = new Date();
      
      const result = await db
        .update(consolidatedOrderData)
        .set(updateData)
        .where(eq(consolidatedOrderData.orderManagementId, orderManagementId))
        .returning();

      if (result.length > 0) {
        console.log(`✅ [CONSOLIDATION] Consolidated order updated: ${result[0].orderNumber}`);
        return result[0];
      }

      console.log(`⚠️  [CONSOLIDATION] No consolidated order found to update for management ID ${orderManagementId}`);
      return null;
    } catch (error) {
      console.error(`❌ [CONSOLIDATION] Failed to update consolidated order ${orderManagementId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves complete consolidated order information
   */
  async getConsolidatedOrder(orderNumber: string): Promise<ConsolidatedOrderData | null> {
    try {
      const result = await db
        .select()
        .from(consolidatedOrderData)
        .where(eq(consolidatedOrderData.orderNumber, orderNumber))
        .limit(1);

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`❌ [CONSOLIDATION] Failed to retrieve consolidated order ${orderNumber}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves consolidated orders by status for departments
   */
  async getConsolidatedOrdersByStatus(status: string | string[]): Promise<ConsolidatedOrderData[]> {
    try {
      const statuses = Array.isArray(status) ? status : [status];
      
      const result = await db
        .select()
        .from(consolidatedOrderData)
        .where((table, { inArray }) => inArray(table.currentStatus, statuses))
        .orderBy(desc(consolidatedOrderData.consolidatedAt));

      console.log(`📋 [CONSOLIDATION] Retrieved ${result.length} consolidated orders with status: ${statuses.join(', ')}`);
      return result;
    } catch (error) {
      console.error(`❌ [CONSOLIDATION] Failed to retrieve consolidated orders by status:`, error);
      throw error;
    }
  }

  /**
   * Gets complete order details for any department (unified interface)
   */
  async getCompleteOrderDetails(orderNumber: string): Promise<ConsolidatedOrderData | null> {
    console.log(`🔍 [CONSOLIDATION] Fetching complete order details for ${orderNumber}`);
    
    const consolidatedOrder = await this.getConsolidatedOrder(orderNumber);
    
    if (consolidatedOrder) {
      console.log(`✅ [CONSOLIDATION] Complete order details retrieved from consolidated data: ${orderNumber}`);
      return consolidatedOrder;
    }

    console.log(`⚠️  [CONSOLIDATION] Order not yet consolidated: ${orderNumber}`);
    return null;
  }
}

// Export singleton instance
export const orderConsolidationService = new OrderConsolidationService();
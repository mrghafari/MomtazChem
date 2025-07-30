// ORDER STATUS SYNCHRONIZATION PREVENTION SYSTEM
// This module prevents status inconsistencies from occurring in the first place

import { db } from './db';
import { customerOrders } from '../shared/customer-schema';
import { orderManagement } from '../shared/order-management-schema';
import { eq } from 'drizzle-orm';

export class OrderSyncPrevention {
  
  // Intercept all customer_orders status changes and ensure management table sync
  static async syncStatusUpdate(
    orderNumber: string, 
    newCustomerStatus: string, 
    department: string = 'system'
  ): Promise<void> {
    try {
      console.log(`🔄 [SYNC PREVENTION] Updating order ${orderNumber} status to ${newCustomerStatus}`);
      
      // Get customer order ID
      const customerOrderResult = await db
        .select({ id: customerOrders.id })
        .from(customerOrders)
        .where(eq(customerOrders.orderNumber, orderNumber))
        .limit(1);

      if (!customerOrderResult.length) {
        console.error(`❌ [SYNC PREVENTION] Order ${orderNumber} not found`);
        return;
      }

      const customerOrderId = customerOrderResult[0].id;

      // Determine corresponding management status
      const managementStatus = this.mapCustomerToManagementStatus(newCustomerStatus);

      // Update both tables simultaneously to prevent sync issues
      await Promise.all([
        // Update customer order status
        db
          .update(customerOrders)
          .set({ 
            status: newCustomerStatus,
            updatedAt: new Date()
          })
          .where(eq(customerOrders.id, customerOrderId)),
        
        // Update management status if needed
        managementStatus && db
          .update(orderManagement)
          .set({ 
            currentStatus: managementStatus,
            updatedAt: new Date()
          })
          .where(eq(orderManagement.customerOrderId, customerOrderId))
      ]);

      console.log(`✅ [SYNC PREVENTION] Order ${orderNumber} synchronized: customer=${newCustomerStatus}, management=${managementStatus}`);
      
    } catch (error) {
      console.error(`❌ [SYNC PREVENTION] Failed to sync order ${orderNumber}:`, error);
      throw error;
    }
  }

  // Map customer status to corresponding management status
  private static mapCustomerToManagementStatus(customerStatus: string): string | null {
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'payment_uploaded': 'pending',
      'confirmed': 'warehouse_pending',
      'dispatched': 'logistics_dispatched',
      'delivered': 'delivered',
      'cancelled': 'financial_rejected'
    };

    return statusMap[customerStatus] || null;
  }

  // Create order with synchronized statuses from the start
  static async createOrderWithSync(orderData: any): Promise<number> {
    try {
      console.log(`🆕 [SYNC PREVENTION] Creating new order with synchronized statuses`);
      
      // Create customer order
      const customerOrderResult = await db
        .insert(customerOrders)
        .values({
          ...orderData,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning({ id: customerOrders.id });

      const customerOrderId = customerOrderResult[0].id;

      // Create corresponding management entry
      await db
        .insert(orderManagement)
        .values({
          customerOrderId,
          currentStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });

      console.log(`✅ [SYNC PREVENTION] Order created with ID ${customerOrderId} - both tables synchronized`);
      return customerOrderId;
      
    } catch (error) {
      console.error(`❌ [SYNC PREVENTION] Failed to create synchronized order:`, error);
      throw error;
    }
  }

  // Monitor for any sync drift and auto-correct
  static async preventSyncDrift(): Promise<{ corrected: number; issues: any[] }> {
    console.log('🔍 [SYNC PREVENTION] Monitoring for status drift...');
    
    try {
      // Find orders with potential drift
      const driftOrders = await db.execute(`
        SELECT 
            co.order_number,
            co.status as customer_status,
            om.current_status as management_status
        FROM customer_orders co
        LEFT JOIN order_management om ON co.id = om.customer_order_id
        WHERE (
            (co.status = 'confirmed' AND om.current_status NOT IN ('warehouse_pending', 'warehouse_processing', 'warehouse_approved')) OR
            (co.status = 'payment_uploaded' AND om.current_status NOT IN ('pending', 'financial_reviewing')) OR
            (co.status = 'dispatched' AND om.current_status != 'logistics_dispatched') OR
            (co.status = 'cancelled' AND om.current_status != 'financial_rejected')
        )
        LIMIT 10
      `);

      let correctedCount = 0;
      const issues = driftOrders.rows as any[];

      for (const issue of issues) {
        try {
          await this.syncStatusUpdate(issue.order_number, issue.customer_status, 'auto_correction');
          correctedCount++;
        } catch (error) {
          console.error(`❌ [SYNC PREVENTION] Failed to correct drift for ${issue.order_number}:`, error);
        }
      }

      console.log(`🎯 [SYNC PREVENTION] Drift monitoring completed: ${correctedCount}/${issues.length} corrections made`);
      return { corrected: correctedCount, issues };
      
    } catch (error) {
      console.error('❌ [SYNC PREVENTION] Drift monitoring failed:', error);
      return { corrected: 0, issues: [] };
    }
  }

  // Validate status transition is allowed and sync-safe
  static validateTransition(currentStatus: string, newStatus: string): boolean {
    const allowedTransitions: Record<string, string[]> = {
      'pending': ['payment_uploaded', 'cancelled'],
      'payment_uploaded': ['confirmed', 'cancelled', 'pending'],
      'confirmed': ['dispatched', 'cancelled'],
      'dispatched': ['delivered', 'cancelled'],
      'delivered': [], // Final state
      'cancelled': [] // Final state
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }
}

export default OrderSyncPrevention;
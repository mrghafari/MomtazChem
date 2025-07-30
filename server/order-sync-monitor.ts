// ORDER STATUS SYNCHRONIZATION MONITOR
// This module prevents future status inconsistencies between customer_orders and order_management

import { db } from './db';
import { customerOrders } from '../shared/customer-schema';
import { orderManagement } from '../shared/order-management-schema';
import { eq } from 'drizzle-orm';

export class OrderStatusSyncMonitor {
  
  // Check for status inconsistencies across all orders using CORRECT status mapping
  static async findStatusMismatches(): Promise<any[]> {
    const mismatches = await db.execute(`
      SELECT 
          co.order_number,
          co.status as customer_status,
          co.payment_status,
          om.current_status as management_status,
          'REAL_MISMATCH' as issue_type
      FROM customer_orders co
      LEFT JOIN order_management om ON co.id = om.customer_order_id
      WHERE NOT (
          -- These are CORRECT synchronizations (not mismatches)
          (co.status = 'confirmed' AND om.current_status IN ('warehouse_pending', 'warehouse_processing', 'warehouse_approved')) OR
          (co.status = 'dispatched' AND om.current_status = 'logistics_dispatched') OR
          (co.status = 'delivered' AND om.current_status = 'delivered') OR
          (co.status = 'cancelled' AND om.current_status = 'financial_rejected') OR
          (co.status = 'pending' AND om.current_status = 'pending') OR
          (co.status = 'payment_uploaded' AND om.current_status IN ('pending', 'financial_reviewing'))
      )
      AND co.created_at >= '2025-01-01'
      ORDER BY co.created_at DESC
    `);
    
    return mismatches.rows as any[];
  }

  // Automatically fix common status synchronization issues
  static async autoFixStatusMismatches(): Promise<{ fixed: number; issues: any[] }> {
    console.log('🔄 [SYNC] Starting automatic status synchronization...');
    
    const issues = await this.findStatusMismatches();
    let fixedCount = 0;

    for (const issue of issues) {
      try {
        const customerOrderId = await db
          .select({ id: customerOrders.id })
          .from(customerOrders)
          .where(eq(customerOrders.orderNumber, issue.order_number))
          .limit(1);

        if (customerOrderId.length === 0) continue;

        const orderId = customerOrderId[0].id;

        // Fix based on management status (management status is typically more accurate)
        if (issue.management_status === 'warehouse_pending' && issue.customer_status === 'pending') {
          await db
            .update(customerOrders)
            .set({ status: 'confirmed' })
            .where(eq(customerOrders.id, orderId));
          fixedCount++;
          console.log(`✅ [SYNC] Fixed ${issue.order_number}: pending → confirmed`);
        }
        
        else if (issue.management_status === 'pending' && issue.customer_status === 'confirmed') {
          await db
            .update(customerOrders)
            .set({ status: 'payment_uploaded' })
            .where(eq(customerOrders.id, orderId));
          fixedCount++;
          console.log(`✅ [SYNC] Fixed ${issue.order_number}: confirmed → payment_uploaded`);
        }
        
        else if (issue.management_status === 'logistics_dispatched' && issue.customer_status !== 'dispatched') {
          await db
            .update(customerOrders)
            .set({ status: 'dispatched' })
            .where(eq(customerOrders.id, orderId));
          fixedCount++;
          console.log(`✅ [SYNC] Fixed ${issue.order_number}: ${issue.customer_status} → dispatched`);
        }
        
        else if (issue.management_status === 'financial_rejected' && issue.customer_status !== 'cancelled') {
          await db
            .update(customerOrders)
            .set({ status: 'cancelled' })
            .where(eq(customerOrders.id, orderId));
          fixedCount++;
          console.log(`✅ [SYNC] Fixed ${issue.order_number}: ${issue.customer_status} → cancelled`);
        }

      } catch (error) {
        console.error(`❌ [SYNC] Error fixing ${issue.order_number}:`, error);
      }
    }

    console.log(`🎯 [SYNC] Auto-fix completed: ${fixedCount}/${issues.length} issues resolved`);
    return { fixed: fixedCount, issues };
  }

  // Monitor and log status changes to prevent future issues
  static async logStatusChange(orderNumber: string, oldStatus: string, newStatus: string, department: string): Promise<void> {
    console.log(`📝 [SYNC LOG] Order ${orderNumber}: ${oldStatus} → ${newStatus} (${department})`);
    
    // Store in a status_change_log table if needed for audit trail
    try {
      await db.execute(`
        INSERT INTO status_change_log (order_number, old_status, new_status, department, changed_at)
        VALUES ('${orderNumber}', '${oldStatus}', '${newStatus}', '${department}', NOW())
        ON CONFLICT DO NOTHING
      `);
    } catch (error) {
      // Table might not exist, ignore silently
    }
  }

  // Validate status transition is allowed
  static validateStatusTransition(currentStatus: string, newStatus: string): boolean {
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

// Export for use in route handlers
export default OrderStatusSyncMonitor;
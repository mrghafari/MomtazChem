// ORDER SYNCHRONIZATION PREVENTION SYSTEM
// This system prevents synchronization problems from occurring rather than fixing them after

import { db } from './db';
import { customerOrders } from '../shared/customer-schema';
import { orderManagement } from '../shared/order-management-schema';
import { eq } from 'drizzle-orm';

export class OrderSyncPrevention {
  
  // CORE PRINCIPLE: All status changes go through this function
  // This ensures BOTH tables are always updated together
  static async safeStatusUpdate(params: {
    orderNumber: string;
    customerStatus: string;
    managementStatus: string;
    department: 'financial' | 'warehouse' | 'logistics' | 'system';
    adminId?: number;
    notes?: string;
  }): Promise<{ success: boolean; message: string; details?: any }> {
    
    const { orderNumber, customerStatus, managementStatus, department, adminId, notes } = params;
    
    try {
      console.log(`🛡️ [SYNC PREVENTION] Safe update for ${orderNumber}: ${customerStatus}/${managementStatus} (${department})`);
      
      // Use database transaction to ensure atomicity
      const result = await db.transaction(async (tx) => {
        
        // 1. Get customer order ID
        const customerOrder = await tx
          .select({ 
            id: customerOrders.id,
            currentStatus: customerOrders.status 
          })
          .from(customerOrders)
          .where(eq(customerOrders.orderNumber, orderNumber))
          .limit(1);
        
        if (customerOrder.length === 0) {
          throw new Error(`سفارش ${orderNumber} یافت نشد`);
        }
        
        const orderId = customerOrder[0].id;
        const oldStatus = customerOrder[0].currentStatus;
        
        // 2. Update customer_orders table
        await tx
          .update(customerOrders)
          .set({
            status: customerStatus,
            updatedAt: new Date()
          })
          .where(eq(customerOrders.id, orderId));
        
        // 3. Prepare management table updates
        const managementUpdate: any = {
          currentStatus: managementStatus,
          updatedAt: new Date()
        };
        
        // Add department-specific data
        if (department === 'financial' && adminId) {
          managementUpdate.financialReviewerId = adminId;
          managementUpdate.financialReviewedAt = new Date();
          managementUpdate.financialNotes = notes || `تغییر وضعیت از ${oldStatus} به ${customerStatus}`;
        } else if (department === 'warehouse' && adminId) {
          managementUpdate.warehouseAssigneeId = adminId;
          managementUpdate.warehouseProcessedAt = new Date();
          managementUpdate.warehouseNotes = notes || `پردازش انبار: ${oldStatus} → ${customerStatus}`;
        } else if (department === 'logistics' && adminId) {
          managementUpdate.logisticsAssigneeId = adminId;
          managementUpdate.logisticsProcessedAt = new Date();
          managementUpdate.logisticsNotes = notes || `عملیات لجستیک: ${oldStatus} → ${customerStatus}`;
        }
        
        // 4. Update order_management table
        await tx
          .update(orderManagement)
          .set(managementUpdate)
          .where(eq(orderManagement.customerOrderId, orderId));
        
        return {
          orderId,
          oldStatus,
          newCustomerStatus: customerStatus,
          newManagementStatus: managementStatus
        };
      });
      
      console.log(`✅ [SYNC PREVENTION] ${orderNumber}: ${result.oldStatus} → ${customerStatus}/${managementStatus}`);
      
      return {
        success: true,
        message: `سفارش ${orderNumber} با موفقیت به‌روزرسانی شد`,
        details: result
      };
      
    } catch (error) {
      console.error(`❌ [SYNC PREVENTION] خطا در به‌روزرسانی ${orderNumber}:`, error);
      return {
        success: false,
        message: `خطا در به‌روزرسانی سفارش ${orderNumber}: ${error.message}`
      };
    }
  }
  
  // Helper functions for each department
  static async approveFinancialOrder(orderNumber: string, adminId: number, notes?: string) {
    return this.safeStatusUpdate({
      orderNumber,
      customerStatus: 'confirmed',
      managementStatus: 'warehouse_pending',
      department: 'financial',
      adminId,
      notes: notes || 'تایید شده - ارسال به انبار'
    });
  }
  
  static async rejectFinancialOrder(orderNumber: string, adminId: number, notes?: string) {
    return this.safeStatusUpdate({
      orderNumber,
      customerStatus: 'cancelled',
      managementStatus: 'financial_rejected',
      department: 'financial',
      adminId,
      notes: notes || 'رد شده توسط بخش مالی'
    });
  }
  
  static async processWarehouse(orderNumber: string, adminId: number, notes?: string) {
    return this.safeStatusUpdate({
      orderNumber,
      customerStatus: 'confirmed',
      managementStatus: 'warehouse_processing',
      department: 'warehouse',
      adminId,
      notes: notes || 'در حال پردازش در انبار'
    });
  }
  
  static async approveWarehouse(orderNumber: string, adminId: number, notes?: string) {
    return this.safeStatusUpdate({
      orderNumber,
      customerStatus: 'confirmed',
      managementStatus: 'warehouse_approved',
      department: 'warehouse',
      adminId,
      notes: notes || 'آماده ارسال - تحویل لجستیک'
    });
  }
  
  static async dispatchLogistics(orderNumber: string, adminId: number, notes?: string) {
    return this.safeStatusUpdate({
      orderNumber,
      customerStatus: 'dispatched',
      managementStatus: 'logistics_dispatched',
      department: 'logistics',
      adminId,
      notes: notes || 'ارسال شده'
    });
  }
  
  static async deliverOrder(orderNumber: string, adminId: number, notes?: string) {
    return this.safeStatusUpdate({
      orderNumber,
      customerStatus: 'delivered',
      managementStatus: 'delivered',
      department: 'logistics',
      adminId,
      notes: notes || 'تحویل داده شده'
    });
  }
  
  // Monitoring function to check if any drift has occurred
  static async monitorSyncHealth(): Promise<{ 
    healthy: boolean; 
    issues: any[]; 
    statistics: any 
  }> {
    
    const result = await db.execute(`
      SELECT 
          co.order_number,
          co.status as customer_status,
          om.current_status as management_status,
          co.created_at,
          CASE 
              WHEN (co.status = 'confirmed' AND om.current_status IN ('warehouse_pending', 'warehouse_processing', 'warehouse_approved')) THEN true
              WHEN (co.status = 'dispatched' AND om.current_status = 'logistics_dispatched') THEN true
              WHEN (co.status = 'delivered' AND om.current_status = 'delivered') THEN true
              WHEN (co.status = 'cancelled' AND om.current_status = 'financial_rejected') THEN true
              WHEN (co.status = 'pending' AND om.current_status = 'pending') THEN true
              WHEN (co.status = 'payment_uploaded' AND om.current_status IN ('pending', 'financial_reviewing', 'payment_grace_period')) THEN true
              ELSE false
          END as is_healthy
      FROM customer_orders co
      LEFT JOIN order_management om ON co.id = om.customer_order_id
      WHERE co.created_at >= '2025-01-01'
      ORDER BY co.created_at DESC
    `);
    
    const orders = result.rows as any[];
    const issues = orders.filter(o => !o.is_healthy);
    const totalOrders = orders.length;
    const healthyOrders = orders.filter(o => o.is_healthy).length;
    const healthPercentage = Math.round((healthyOrders / totalOrders) * 100 * 100) / 100;
    
    const statistics = {
      totalOrders,
      healthyOrders,
      issueCount: issues.length,
      healthPercentage
    };
    
    if (issues.length > 0) {
      console.log(`⚠️ [SYNC MONITOR] Found ${issues.length} synchronization issues:`);
      issues.forEach(issue => {
        console.log(`  - ${issue.order_number}: ${issue.customer_status} ≠ ${issue.management_status}`);
      });
    } else {
      console.log(`✅ [SYNC MONITOR] All ${totalOrders} orders are perfectly synchronized (${healthPercentage}%)`);
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      statistics
    };
  }
}

export default OrderSyncPrevention;
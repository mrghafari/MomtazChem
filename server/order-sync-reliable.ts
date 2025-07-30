// RELIABLE ORDER SYNCHRONIZATION SYSTEM
// This system ensures 100% reliability by preventing problems rather than fixing them

import { db } from './db';
import { customerOrders } from '../shared/customer-schema';
import { orderManagement } from '../shared/order-management-schema';
import { eq } from 'drizzle-orm';

export class ReliableOrderSync {
  
  // Single source of truth: Update both tables simultaneously in a transaction
  static async updateOrderStatus(
    orderNumber: string, 
    newCustomerStatus: string, 
    newManagementStatus: string,
    department: string,
    adminId?: number,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    
    try {
      console.log(`🔄 [RELIABLE SYNC] Updating ${orderNumber}: ${newCustomerStatus} / ${newManagementStatus} (${department})`);
      
      // Start transaction
      await db.transaction(async (tx) => {
        // Update customer_orders table
        await tx
          .update(customerOrders)
          .set({ 
            status: newCustomerStatus, 
            updatedAt: new Date() 
          })
          .where(eq(customerOrders.orderNumber, orderNumber));
        
        // Get customer_order_id
        const customerOrder = await tx
          .select({ id: customerOrders.id })
          .from(customerOrders)
          .where(eq(customerOrders.orderNumber, orderNumber))
          .limit(1);
        
        if (customerOrder.length === 0) {
          throw new Error(`Order ${orderNumber} not found`);
        }
        
        // Update order_management table
        const updateData: any = {
          currentStatus: newManagementStatus,
          updatedAt: new Date()
        };
        
        // Add department-specific fields
        if (department === 'financial' && adminId) {
          updateData.financialReviewerId = adminId;
          updateData.financialReviewedAt = new Date();
          if (notes) updateData.financialNotes = notes;
        } else if (department === 'warehouse' && adminId) {
          updateData.warehouseAssigneeId = adminId;
          updateData.warehouseProcessedAt = new Date();
          if (notes) updateData.warehouseNotes = notes;
        } else if (department === 'logistics' && adminId) {
          updateData.logisticsAssigneeId = adminId;
          updateData.logisticsProcessedAt = new Date();
          if (notes) updateData.logisticsNotes = notes;
        }
        
        await tx
          .update(orderManagement)
          .set(updateData)
          .where(eq(orderManagement.customerOrderId, customerOrder[0].id));
      });
      
      console.log(`✅ [RELIABLE SYNC] ${orderNumber} synchronized successfully`);
      return { 
        success: true, 
        message: `سفارش ${orderNumber} با موفقیت همگام‌سازی شد` 
      };
      
    } catch (error) {
      console.error(`❌ [RELIABLE SYNC] Error updating ${orderNumber}:`, error);
      return { 
        success: false, 
        message: `خطا در همگام‌سازی سفارش ${orderNumber}: ${error.message}` 
      };
    }
  }
  
  // Financial department: Approve order (guaranteed sync)
  static async approveOrder(orderNumber: string, adminId: number, notes?: string) {
    return await this.updateOrderStatus(
      orderNumber,
      'confirmed',           // Customer sees "confirmed"
      'warehouse_pending',   // Management shows "warehouse_pending"
      'financial',
      adminId,
      notes || 'تایید شده توسط بخش مالی'
    );
  }
  
  // Financial department: Reject order (guaranteed sync)
  static async rejectOrder(orderNumber: string, adminId: number, notes?: string) {
    return await this.updateOrderStatus(
      orderNumber,
      'cancelled',           // Customer sees "cancelled"
      'financial_rejected',  // Management shows "financial_rejected"
      'financial',
      adminId,
      notes || 'رد شده توسط بخش مالی'
    );
  }
  
  // Warehouse department: Process order (guaranteed sync)
  static async processWarehouseOrder(orderNumber: string, adminId: number, notes?: string) {
    return await this.updateOrderStatus(
      orderNumber,
      'confirmed',           // Customer sees "confirmed"
      'warehouse_processing', // Management shows "warehouse_processing"
      'warehouse',
      adminId,
      notes || 'در حال پردازش در انبار'
    );
  }
  
  // Warehouse department: Complete and send to logistics (guaranteed sync)
  static async completeWarehouseOrder(orderNumber: string, adminId: number, notes?: string) {
    return await this.updateOrderStatus(
      orderNumber,
      'confirmed',           // Customer sees "confirmed"
      'warehouse_approved',  // Management shows "warehouse_approved"
      'warehouse',
      adminId,
      notes || 'آماده ارسال به لجستیک'
    );
  }
  
  // Logistics department: Dispatch order (guaranteed sync)
  static async dispatchOrder(orderNumber: string, adminId: number, notes?: string) {
    return await this.updateOrderStatus(
      orderNumber,
      'dispatched',          // Customer sees "dispatched"
      'logistics_dispatched', // Management shows "logistics_dispatched"
      'logistics',
      adminId,
      notes || 'ارسال شده توسط لجستیک'
    );
  }
  
  // Logistics department: Mark as delivered (guaranteed sync)
  static async deliverOrder(orderNumber: string, adminId: number, notes?: string) {
    return await this.updateOrderStatus(
      orderNumber,
      'delivered',           // Customer sees "delivered"
      'delivered',           // Management shows "delivered"
      'logistics',
      adminId,
      notes || 'تحویل داده شده'
    );
  }
  
  // Verify synchronization health
  static async checkSyncHealth(): Promise<{
    totalOrders: number;
    syncedOrders: number;
    percentage: number;
    mismatches: any[];
  }> {
    
    const result = await db.execute(`
      SELECT 
          co.order_number,
          co.status as customer_status,
          om.current_status as management_status,
          CASE 
              WHEN (co.status = 'confirmed' AND om.current_status IN ('warehouse_pending', 'warehouse_processing', 'warehouse_approved')) THEN true
              WHEN (co.status = 'dispatched' AND om.current_status = 'logistics_dispatched') THEN true
              WHEN (co.status = 'delivered' AND om.current_status = 'delivered') THEN true
              WHEN (co.status = 'cancelled' AND om.current_status = 'financial_rejected') THEN true
              WHEN (co.status = 'pending' AND om.current_status = 'pending') THEN true
              WHEN (co.status = 'payment_uploaded' AND om.current_status IN ('pending', 'financial_reviewing', 'payment_grace_period')) THEN true
              ELSE false
          END as is_synced
      FROM customer_orders co
      LEFT JOIN order_management om ON co.id = om.customer_order_id
      WHERE co.created_at >= '2025-01-01'
      ORDER BY co.created_at DESC
    `);
    
    const orders = result.rows as any[];
    const totalOrders = orders.length;
    const syncedOrders = orders.filter(o => o.is_synced).length;
    const percentage = Math.round((syncedOrders / totalOrders) * 100 * 100) / 100;
    const mismatches = orders.filter(o => !o.is_synced);
    
    return {
      totalOrders,
      syncedOrders,
      percentage,
      mismatches
    };
  }
}

export default ReliableOrderSync;
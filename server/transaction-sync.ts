/**
 * 🔒 TRANSACTION-BASED SYNC
 * سیستم همگام‌سازی مبتنی بر ACID Transactions
 * هر تغییر در customer_orders فوراً با order_management همگام می‌شود
 */

import { db } from './db';
import { customerOrders } from '@shared/customer-schema';
import { orderManagement } from '@shared/order-management-schema';
import { eq, sql } from 'drizzle-orm';

export class TransactionSync {
  /**
   * بروزرسانی order با ACID transaction
   * تضمین 100% همگام‌سازی یا rollback کامل
   */
  static async updateOrderWithSync(
    customerOrderId: number,
    updates: {
      status?: string;
      paymentStatus?: string;
      [key: string]: any;
    }
  ): Promise<void> {
    console.log(`🔒 [TRANSACTION SYNC] Starting ACID transaction for order ${customerOrderId}`);
    
    // شروع transaction
    await db.transaction(async (tx) => {
      try {
        // 1. بروزرسانی customer_orders
        const [updatedOrder] = await tx
          .update(customerOrders)
          .set({
            ...updates,
            updatedAt: new Date()
          })
          .where(eq(customerOrders.id, customerOrderId))
          .returning();

        if (!updatedOrder) {
          throw new Error(`Order ${customerOrderId} not found`);
        }

        // 2. محاسبه وضعیت صحیح برای order_management
        const newManagementStatus = this.determineManagementStatus(
          updatedOrder.status,
          updatedOrder.paymentStatus
        );

        // 3. بروزرسانی order_management در همان transaction
        const updateResult = await tx
          .update(orderManagement)
          .set({
            currentStatus: newManagementStatus as any,
            updatedAt: new Date(),
            syncNotes: `Transaction sync at ${new Date().toISOString()}`
          })
          .where(eq(orderManagement.customerOrderId, customerOrderId))
          .returning();

        // 4. اگر order_management وجود نداشت، ایجاد کن
        if (updateResult.length === 0) {
          await tx.insert(orderManagement).values({
            customerOrderId: customerOrderId,
            currentStatus: newManagementStatus as any,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncNotes: `Auto-created via transaction sync at ${new Date().toISOString()}`
          });
          
          console.log(`✅ [TRANSACTION SYNC] Created missing management record for order ${customerOrderId}`);
        } else {
          console.log(`✅ [TRANSACTION SYNC] Updated management record for order ${customerOrderId}: ${newManagementStatus}`);
        }

        console.log(`✅ [TRANSACTION SYNC] ACID transaction completed successfully for order ${customerOrderId}`);
        
      } catch (error) {
        console.error(`❌ [TRANSACTION SYNC] Transaction failed for order ${customerOrderId}:`, error);
        // Transaction will automatically rollback
        throw error;
      }
    });
  }

  /**
   * ایجاد سفارش جدید با ACID transaction
   */
  static async createOrderWithSync(orderData: any): Promise<number> {
    console.log('🔒 [TRANSACTION SYNC] Creating new order with ACID transaction');
    
    let createdOrderId: number;

    await db.transaction(async (tx) => {
      try {
        // 1. ایجاد customer_order
        const [newOrder] = await tx
          .insert(customerOrders)
          .values(orderData)
          .returning();

        createdOrderId = newOrder.id;

        // 2. محاسبه وضعیت order_management
        const managementStatus = this.determineManagementStatus(
          newOrder.status,
          newOrder.paymentStatus
        );

        // 3. ایجاد order_management در همان transaction
        await tx.insert(orderManagement).values({
          customerOrderId: createdOrderId,
          currentStatus: managementStatus as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          syncNotes: `Auto-created via transaction sync at ${new Date().toISOString()}`
        });

        console.log(`✅ [TRANSACTION SYNC] New order created with ID ${createdOrderId} and management status ${managementStatus}`);
        
      } catch (error) {
        console.error('❌ [TRANSACTION SYNC] Failed to create order with sync:', error);
        throw error;
      }
    });

    return createdOrderId!;
  }

  /**
   * تعیین وضعیت order_management بر اساس customer_orders
   */
  private static determineManagementStatus(customerStatus: string, paymentStatus: string): string {
    // اولویت اول: وضعیت‌های نهایی
    if (customerStatus === 'delivered') return 'delivered';
    if (customerStatus === 'cancelled' || customerStatus === 'deleted') return 'cancelled';
    
    // اولویت دوم: وضعیت‌های در حال پردازش
    if (customerStatus === 'warehouse_ready') {
      return 'warehouse_pending';
    }
    
    if (customerStatus === 'confirmed' || customerStatus === 'processing') {
      return 'warehouse_processing';
    }
    
    if (customerStatus === 'shipped' || customerStatus === 'in_transit') {
      return 'in_transit';
    }
    
    // اولویت سوم: وضعیت‌های پرداخت
    if (customerStatus === 'pending') {
      if (paymentStatus === 'paid') {
        return 'warehouse_pending';
      } else if (paymentStatus === 'receipt_uploaded') {
        return 'pending';
      } else if (paymentStatus === 'rejected') {
        return 'financial_rejected';
      } else {
        return 'pending';
      }
    }
    
    return 'pending';
  }

  /**
   * بررسی تناقضات موجود و تصحیح آنها با transaction
   */
  static async fixAllInconsistencies(): Promise<{ fixed: number; errors: string[] }> {
    console.log('🔒 [TRANSACTION SYNC] Fixing all inconsistencies with ACID transactions...');
    
    let fixedCount = 0;
    const errors: string[] = [];

    try {
      // پیدا کردن تمام تناقضات
      const inconsistencies = await db.execute(sql`
        SELECT 
          co.id as customer_order_id,
          co.order_number,
          co.status as customer_status,
          co.payment_status,
          om.id as management_id,
          om.current_status as management_status
        FROM customer_orders co
        LEFT JOIN order_management om ON co.id = om.customer_order_id
        WHERE co.status != 'deleted'
      `);

      // تصحیح هر تناقض با transaction جداگانه
      for (const row of inconsistencies.rows) {
        try {
          const expectedStatus = this.determineManagementStatus(
            row.customer_status,
            row.payment_status
          );

          if (!row.management_id) {
            // ایجاد رکورد گم‌شده
            await db.transaction(async (tx) => {
              await tx.insert(orderManagement).values({
                customerOrderId: row.customer_order_id,
                currentStatus: expectedStatus as any,
                createdAt: new Date(),
                updatedAt: new Date(),
                syncNotes: `Fixed missing record at ${new Date().toISOString()}`
              });
            });
            
            console.log(`✅ [TRANSACTION SYNC] Created missing management record for ${row.order_number}`);
            fixedCount++;
            
          } else if (row.management_status !== expectedStatus) {
            // تصحیح وضعیت نادرست
            await db.transaction(async (tx) => {
              await tx
                .update(orderManagement)
                .set({
                  currentStatus: expectedStatus as any,
                  updatedAt: new Date(),
                  syncNotes: `Fixed inconsistency at ${new Date().toISOString()}`
                })
                .where(eq(orderManagement.id, row.management_id));
            });
            
            console.log(`✅ [TRANSACTION SYNC] Fixed status for ${row.order_number}: ${row.management_status} → ${expectedStatus}`);
            fixedCount++;
          }
          
        } catch (error) {
          const errorMsg = `Failed to fix ${row.order_number}: ${error.message}`;
          console.error(`❌ [TRANSACTION SYNC] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`✅ [TRANSACTION SYNC] Fixed ${fixedCount} inconsistencies`);
      return { fixed: fixedCount, errors };
      
    } catch (error) {
      console.error('❌ [TRANSACTION SYNC] Failed to fix inconsistencies:', error);
      return { fixed: fixedCount, errors: [error.message] };
    }
  }
}
import { db } from './db';
import { customerOrders, orderItems } from '@shared/customer-schema';
import { eq, and, gt, sql } from 'drizzle-orm';

/**
 * Data Integrity Tools for Order Management System
 * Helps identify and fix corrupted orders that have amounts but no items
 */

export interface CorruptedOrder {
  id: number;
  orderNumber: string;
  totalAmount: string;
  status: string;
  createdAt: Date;
  itemCount: number;
  currency: string;
  customerEmail?: string;
}

/**
 * Find orders that have total amounts but no order items
 */
export async function findCorruptedOrders(): Promise<CorruptedOrder[]> {
  const query = sql`
    SELECT 
      co.id,
      co.order_number,
      co.total_amount,
      co.status,
      co.created_at,
      co.currency,
      co.customer_email,
      COUNT(oi.id) as item_count
    FROM customer_orders co
    LEFT JOIN order_items oi ON co.id = oi.order_id
    WHERE co.total_amount > 0
      AND co.status NOT IN ('deleted', 'cancelled')
    GROUP BY co.id, co.order_number, co.total_amount, co.status, co.created_at, co.currency, co.customer_email
    HAVING COUNT(oi.id) = 0
    ORDER BY co.created_at DESC
  `;

  const results = await db.execute(query);
  
  return results.rows.map((row: any) => ({
    id: row.id,
    orderNumber: row.order_number,
    totalAmount: row.total_amount,
    status: row.status,
    createdAt: row.created_at,
    itemCount: row.item_count,
    currency: row.currency,
    customerEmail: row.customer_email
  }));
}

/**
 * Get detailed statistics about data integrity issues
 */
export async function getDataIntegrityStats() {
  const corruptedOrders = await findCorruptedOrders();
  
  const totalCorrupted = corruptedOrders.length;
  const totalCorruptedValue = corruptedOrders.reduce((sum, order) => 
    sum + parseFloat(order.totalAmount), 0
  );
  
  const corruptedByStatus = corruptedOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalCorrupted,
    totalCorruptedValue,
    corruptedByStatus,
    corruptedOrders: corruptedOrders.slice(0, 10) // Top 10 for display
  };
}

/**
 * Mark a corrupted order as deleted (soft delete)
 * This should only be used for orders that are genuinely corrupted
 */
export async function markCorruptedOrderAsDeleted(orderId: number, reason: string) {
  const now = new Date();
  const deleteNote = `حذف شده در ${now.toISOString()}: ${reason}`;
  
  await db
    .update(customerOrders)
    .set({
      status: 'deleted',
      notes: sql`COALESCE(notes, '') || ${deleteNote}`
    })
    .where(eq(customerOrders.id, orderId));
    
  return { success: true, message: 'Order marked as deleted' };
}

/**
 * Get order validation report
 */
export async function validateOrderIntegrity(orderId: number) {
  const orderQuery = await db
    .select()
    .from(customerOrders)
    .where(eq(customerOrders.id, orderId));
    
  if (orderQuery.length === 0) {
    return { valid: false, error: 'Order not found' };
  }
  
  const order = orderQuery[0];
  
  const itemsQuery = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
    
  const hasItems = itemsQuery.length > 0;
  const hasAmount = parseFloat(order.totalAmount || '0') > 0;
  
  const validation = {
    orderId,
    orderNumber: order.orderNumber,
    hasItems,
    itemCount: itemsQuery.length,
    hasAmount,
    totalAmount: order.totalAmount,
    status: order.status,
    valid: (hasItems && hasAmount) || (!hasItems && !hasAmount),
    issues: [] as string[]
  };
  
  if (hasAmount && !hasItems) {
    validation.issues.push('Order has amount but no items');
  }
  
  if (hasItems && !hasAmount) {
    validation.issues.push('Order has items but no amount');
  }
  
  return validation;
}
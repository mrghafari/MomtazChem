#!/usr/bin/env node

/**
 * Delete Legacy Orders Script
 * 
 * Removes all orders with ORD- format from both:
 * - customer_orders table
 * - order_management table (associated records)
 * 
 * This ensures complete unified numbering system with only MOM format orders.
 */

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function deleteLegacyOrders() {
  try {
    await client.connect();
    console.log('🔄 Connected to database');

    // Start transaction
    await client.query('BEGIN');
    console.log('🔄 Starting deletion transaction...');

    // Find legacy orders to delete
    const legacyOrdersQuery = `
      SELECT id, order_number, created_at 
      FROM customer_orders 
      WHERE order_number LIKE 'ORD-%'
      ORDER BY id ASC;
    `;
    
    const legacyOrders = await client.query(legacyOrdersQuery);
    console.log(`📊 Found ${legacyOrders.rows.length} legacy orders to delete`);

    if (legacyOrders.rows.length === 0) {
      console.log('✅ No legacy orders found. Database already clean.');
      await client.query('COMMIT');
      return;
    }

    // Delete from order_management first (foreign key constraint)
    let orderManagementDeleted = 0;
    for (const order of legacyOrders.rows) {
      const deleteOrderManagement = await client.query(
        'DELETE FROM order_management WHERE customer_order_id = $1',
        [order.id]
      );
      orderManagementDeleted += deleteOrderManagement.rowCount;
      console.log(`🗑️  Deleted order_management records for Order ${order.order_number} (ID: ${order.id})`);
    }

    // Delete from customer_orders
    const deleteCustomerOrders = await client.query(
      'DELETE FROM customer_orders WHERE order_number LIKE $1',
      ['ORD-%']
    );
    
    console.log(`🗑️  Deleted ${deleteCustomerOrders.rowCount} customer_orders with ORD format`);
    console.log(`🗑️  Deleted ${orderManagementDeleted} related order_management records`);

    // Commit transaction
    await client.query('COMMIT');
    console.log('✅ Deletion transaction completed successfully');

    // Verification
    const verificationQuery = await client.query(`
      SELECT 
        COUNT(*) as total_customer_orders,
        COUNT(CASE WHEN order_number LIKE 'MOM%' THEN 1 END) as mom_format_orders,
        COUNT(CASE WHEN order_number LIKE 'ORD-%' THEN 1 END) as legacy_orders_remaining
      FROM customer_orders;
    `);

    const orderMgmtQuery = await client.query('SELECT COUNT(*) as total_order_management FROM order_management;');

    const stats = verificationQuery.rows[0];
    const mgmtStats = orderMgmtQuery.rows[0];
    
    console.log('📊 Database Statistics After Deletion:');
    console.log(`  Customer Orders Total: ${stats.total_customer_orders}`);
    console.log(`  MOM Format Orders: ${stats.mom_format_orders}`);
    console.log(`  Legacy Orders Remaining: ${stats.legacy_orders_remaining}`);
    console.log(`  Order Management Records: ${mgmtStats.total_order_management}`);

    if (parseInt(stats.legacy_orders_remaining) === 0) {
      console.log('✅ SUCCESS: All legacy orders deleted');
      console.log('🎉 Database now contains only MOM format orders!');
    } else {
      console.log(`⚠️  Warning: ${stats.legacy_orders_remaining} legacy orders still remain`);
    }

  } catch (error) {
    // Rollback on error
    try {
      await client.query('ROLLBACK');
      console.log('🔄 Transaction rolled back due to error');
    } catch (rollbackError) {
      console.error('❌ Error during rollback:', rollbackError);
    }
    
    console.error('❌ Deletion failed:', error);
    throw error;
    
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Execute deletion
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting Legacy Order Deletion Script');
  console.log('🗑️  Removing all ORD-XXXXX format orders');
  console.log('=' .repeat(60));
  
  deleteLegacyOrders()
    .then(() => {
      console.log('=' .repeat(60));
      console.log('✅ Legacy order deletion completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.log('=' .repeat(60));
      console.error('❌ Deletion failed:', error);
      process.exit(1);
    });
}

export { deleteLegacyOrders };
#!/usr/bin/env node

/**
 * Migration Script: Convert Legacy ORD Format to MOM Format
 * 
 * This script updates all existing orders with ORD-XXXXX format to use
 * the new unified MOM format (MOM + year + sequential) across all tables.
 * 
 * Tables updated:
 * - customer_orders.order_number
 * - order_management.deliveryCode (when it matches old order number)
 * 
 * Maintains unified numbering system across all departments.
 */

import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function generateMOMOrderNumber() {
  const year = new Date().getFullYear();
  const shortYear = year.toString().slice(-2); // Get last 2 digits of year
  
  try {
    // Get or create counter for current year
    const counterQuery = `
      INSERT INTO order_number_counter (year, current_number)
      VALUES ($1, 11111)
      ON CONFLICT (year) DO UPDATE SET current_number = order_number_counter.current_number + 1
      RETURNING current_number;
    `;
    
    const result = await client.query(counterQuery, [year]);
    const sequentialNumber = result.rows[0].current_number;
    
    // Format: MOM + 2-digit year + 5-digit sequential
    const orderNumber = `MOM${shortYear}${sequentialNumber.toString().padStart(5, '0')}`;
    
    console.log(`Generated order number: ${orderNumber} for year ${year}`);
    return orderNumber;
  } catch (error) {
    console.error('Error generating MOM order number:', error);
    throw error;
  }
}

async function migrateLegacyOrders() {
  try {
    await client.connect();
    console.log('🔄 Connected to database');

    // First, check if order_number_counter table exists
    const counterTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_number_counter'
      );
    `);

    if (!counterTableCheck.rows[0].exists) {
      console.log('📋 Creating order_number_counter table...');
      await client.query(`
        CREATE TABLE order_number_counter (
          id SERIAL PRIMARY KEY,
          year INTEGER NOT NULL UNIQUE,
          current_number INTEGER NOT NULL DEFAULT 11111,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ order_number_counter table created');
    }

    // Find all legacy orders (ORD format)
    console.log('🔍 Finding legacy orders with ORD format...');
    const legacyOrdersQuery = `
      SELECT id, order_number, created_at 
      FROM customer_orders 
      WHERE order_number LIKE 'ORD-%'
      ORDER BY id ASC;
    `;
    
    const legacyOrders = await client.query(legacyOrdersQuery);
    console.log(`📊 Found ${legacyOrders.rows.length} legacy orders to migrate`);

    if (legacyOrders.rows.length === 0) {
      console.log('✅ No legacy orders found. Migration completed.');
      return;
    }

    // Start transaction for batch updates
    await client.query('BEGIN');
    console.log('🔄 Starting migration transaction...');

    let updatedCount = 0;
    
    for (const order of legacyOrders.rows) {
      try {
        // Generate new MOM format number
        const newOrderNumber = await generateMOMOrderNumber();
        const oldOrderNumber = order.order_number;
        
        console.log(`🔧 Migrating Order ID ${order.id}: ${oldOrderNumber} → ${newOrderNumber}`);
        
        // Update customer_orders table
        await client.query(
          'UPDATE customer_orders SET order_number = $1, updated_at = NOW() WHERE id = $2',
          [newOrderNumber, order.id]
        );
        
        // Update corresponding order_management deliveryCode if it matches old order number
        const updateDeliveryCode = await client.query(
          `UPDATE order_management 
           SET "deliveryCode" = $1, updated_at = NOW() 
           WHERE customer_order_id = $2 AND ("deliveryCode" = $3 OR "deliveryCode" IS NULL)`,
          [newOrderNumber, order.id, oldOrderNumber]
        );
        
        if (updateDeliveryCode.rowCount > 0) {
          console.log(`  📦 Updated delivery code in order_management for Order ID ${order.id}`);
        }
        
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating order ${order.id}:`, error);
        throw error;
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('✅ Migration transaction completed successfully');

    // Verification query
    console.log('🔍 Verifying migration results...');
    const verificationQuery = await client.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN order_number LIKE 'MOM%' THEN 1 END) as mom_format_orders,
        COUNT(CASE WHEN order_number LIKE 'ORD-%' THEN 1 END) as legacy_orders_remaining
      FROM customer_orders;
    `);

    const stats = verificationQuery.rows[0];
    console.log('📊 Migration Statistics:');
    console.log(`  Total Orders: ${stats.total_orders}`);
    console.log(`  MOM Format Orders: ${stats.mom_format_orders}`);
    console.log(`  Legacy Orders Remaining: ${stats.legacy_orders_remaining}`);

    if (parseInt(stats.legacy_orders_remaining) === 0) {
      console.log('✅ MIGRATION SUCCESSFUL: All orders now use MOM format');
      console.log('🎉 Unified numbering system is now fully implemented!');
    } else {
      console.log(`⚠️  Warning: ${stats.legacy_orders_remaining} legacy orders still remain`);
    }

    console.log(`🔢 Total orders migrated: ${updatedCount}`);

  } catch (error) {
    // Rollback on error
    try {
      await client.query('ROLLBACK');
      console.log('🔄 Transaction rolled back due to error');
    } catch (rollbackError) {
      console.error('❌ Error during rollback:', rollbackError);
    }
    
    console.error('❌ Migration failed:', error);
    throw error;
    
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Execute migration
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Starting Legacy Order Migration Script');
  console.log('📋 Converting ORD-XXXXX format to MOM format');
  console.log('=' .repeat(60));
  
  migrateLegacyOrders()
    .then(() => {
      console.log('=' .repeat(60));
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.log('=' .repeat(60));
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateLegacyOrders };
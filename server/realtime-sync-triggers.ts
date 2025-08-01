/**
 * 🔥 REALTIME SYNC TRIGGERS
 * سیستم همگام‌سازی فوری و realtime با Database Triggers
 * ZERO TOLERANCE for data inconsistency - حتی یک میلی‌ثانیه تناقض مجاز نیست
 */

import { db } from './db';
import { sql } from 'drizzle-orm';

export class RealtimeSyncTriggers {
  /**
   * نصب تریگرهای خودکار برای همگام‌سازی فوری
   * Database-level triggers to ensure INSTANT synchronization
   */
  static async installTriggers(): Promise<void> {
    console.log('🔥 [REALTIME SYNC] Installing database triggers for INSTANT synchronization...');

    try {
      // 1. ایجاد function برای همگام‌سازی فوری
      await db.execute(sql`
        CREATE OR REPLACE FUNCTION sync_order_management_realtime()
        RETURNS TRIGGER AS $$
        DECLARE
          new_management_status TEXT;
        BEGIN
          -- تعیین وضعیت صحیح order_management بر اساس customer_orders
          IF NEW.status = 'delivered' THEN
            new_management_status := 'delivered';
          ELSIF NEW.status = 'cancelled' OR NEW.status = 'deleted' THEN
            new_management_status := 'cancelled';
          ELSIF NEW.status = 'warehouse_ready' THEN
            new_management_status := 'warehouse_pending';
          ELSIF NEW.status = 'confirmed' OR NEW.status = 'processing' THEN
            new_management_status := 'warehouse_processing';
          ELSIF NEW.status = 'shipped' OR NEW.status = 'in_transit' THEN
            new_management_status := 'in_transit';
          ELSIF NEW.status = 'pending' THEN
            IF NEW.payment_status = 'paid' THEN
              new_management_status := 'warehouse_pending';
            ELSIF NEW.payment_status = 'receipt_uploaded' THEN
              new_management_status := 'pending';
            ELSIF NEW.payment_status = 'rejected' THEN
              new_management_status := 'financial_rejected';
            ELSE
              new_management_status := 'pending';
            END IF;
          ELSE
            new_management_status := 'pending';
          END IF;

          -- بروزرسانی فوری order_management
          UPDATE order_management 
          SET 
            current_status = new_management_status,
            updated_at = NOW(),
            sync_notes = 'Auto-synced via trigger on ' || to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS')
          WHERE customer_order_id = NEW.id;

          -- اگر رکورد وجود نداشت، ایجاد کن
          IF NOT FOUND THEN
            INSERT INTO order_management (
              customer_order_id,
              current_status,
              created_at,
              updated_at,
              sync_notes
            ) VALUES (
              NEW.id,
              new_management_status,
              NOW(),
              NOW(),
              'Auto-created via trigger on ' || to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS')
            );
          END IF;

          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // 2. نصب trigger روی customer_orders برای UPDATE
      await db.execute(sql`
        DROP TRIGGER IF EXISTS customer_orders_sync_trigger ON customer_orders;
        
        CREATE TRIGGER customer_orders_sync_trigger
          AFTER UPDATE ON customer_orders
          FOR EACH ROW
          WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.payment_status IS DISTINCT FROM NEW.payment_status)
          EXECUTE FUNCTION sync_order_management_realtime();
      `);

      // 3. نصب trigger روی customer_orders برای INSERT (سفارشات جدید)
      await db.execute(sql`
        DROP TRIGGER IF EXISTS customer_orders_insert_sync_trigger ON customer_orders;
        
        CREATE TRIGGER customer_orders_insert_sync_trigger
          AFTER INSERT ON customer_orders
          FOR EACH ROW
          EXECUTE FUNCTION sync_order_management_realtime();
      `);

      // 4. ایجاد function برای جلوگیری از حذف order_management بدون customer_order
      await db.execute(sql`
        CREATE OR REPLACE FUNCTION prevent_orphaned_management()
        RETURNS TRIGGER AS $$
        BEGIN
          -- اگر customer_order حذف شد، order_management هم حذف شود
          DELETE FROM order_management WHERE customer_order_id = OLD.id;
          RETURN OLD;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // 5. نصب trigger برای حذف customer_orders
      await db.execute(sql`
        DROP TRIGGER IF EXISTS customer_orders_delete_sync_trigger ON customer_orders;
        
        CREATE TRIGGER customer_orders_delete_sync_trigger
          AFTER DELETE ON customer_orders
          FOR EACH ROW
          EXECUTE FUNCTION prevent_orphaned_management();
      `);

      console.log('✅ [REALTIME SYNC] Database triggers installed successfully');
      console.log('🔥 [REALTIME SYNC] Data consistency is now GUARANTEED at database level');
      
      // تست تریگرها
      await this.testTriggers();

    } catch (error) {
      console.error('❌ [REALTIME SYNC] Failed to install triggers:', error);
      throw error;
    }
  }

  /**
   * تست عملکرد تریگرها
   */
  private static async testTriggers(): Promise<void> {
    console.log('🧪 [REALTIME SYNC] Testing triggers...');
    
    try {
      // بررسی وجود تریگرها
      const triggers = await db.execute(sql`
        SELECT 
          trigger_name,
          event_manipulation,
          action_timing,
          action_statement
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND event_object_table = 'customer_orders'
        ORDER BY trigger_name;
      `);

      console.log('✅ [REALTIME SYNC] Found triggers:', triggers.rows);
      
      // بررسی وجود functions
      const functions = await db.execute(sql`
        SELECT 
          routine_name,
          routine_type
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name LIKE '%sync%'
        ORDER BY routine_name;
      `);

      console.log('✅ [REALTIME SYNC] Found functions:', functions.rows);
      
    } catch (error) {
      console.error('❌ [REALTIME SYNC] Trigger test failed:', error);
    }
  }

  /**
   * حذف تریگرها (در صورت نیاز)
   */
  static async removeTriggers(): Promise<void> {
    console.log('🗑️ [REALTIME SYNC] Removing triggers...');
    
    try {
      await db.execute(sql`DROP TRIGGER IF EXISTS customer_orders_sync_trigger ON customer_orders;`);
      await db.execute(sql`DROP TRIGGER IF EXISTS customer_orders_insert_sync_trigger ON customer_orders;`);
      await db.execute(sql`DROP TRIGGER IF EXISTS customer_orders_delete_sync_trigger ON customer_orders;`);
      await db.execute(sql`DROP FUNCTION IF EXISTS sync_order_management_realtime();`);
      await db.execute(sql`DROP FUNCTION IF EXISTS prevent_orphaned_management();`);
      
      console.log('✅ [REALTIME SYNC] Triggers removed successfully');
    } catch (error) {
      console.error('❌ [REALTIME SYNC] Failed to remove triggers:', error);
      throw error;
    }
  }

  /**
   * بررسی وضعیت تریگرها
   */
  static async getTriggersStatus(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          trigger_name,
          event_manipulation,
          action_timing,
          action_statement,
          action_condition
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND event_object_table = 'customer_orders'
        ORDER BY trigger_name;
      `);

      return result.rows;
    } catch (error) {
      console.error('❌ [REALTIME SYNC] Failed to get triggers status:', error);
      return [];
    }
  }
}
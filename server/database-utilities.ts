import { db } from "./db";
import { sql } from "drizzle-orm";

// Utility برای عملیات امن پایگاه داده با مدیریت خطا
export class DatabaseUtilities {
  
  // اجرای کوئری امن با مدیریت خطا
  static async safeQuery(query: string, params: any[] = []): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // تبدیل کوئری به format مناسب Drizzle
      let formattedQuery = query;
      params.forEach((param, index) => {
        formattedQuery = formattedQuery.replace(`$${index + 1}`, `'${param}'`);
      });
      
      const result = await db.execute(sql.raw(formattedQuery));
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('🚫 [DATABASE ERROR]:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  // بررسی وجود سفارش
  static async orderExists(orderNumber: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT 1 FROM customer_orders WHERE order_number = ${orderNumber} LIMIT 1
      `);
      return result.rows && result.rows.length > 0;
    } catch (error) {
      console.error('🚫 [ORDER EXISTS ERROR]:', error);
      return false;
    }
  }

  // دریافت اطلاعات کامل سفارش
  static async getOrderDetails(orderNumber: string): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      const result = await db.execute(sql`
        SELECT 
          co.id,
          co.order_number,
          co.customer_id,
          co.payment_status,
          co.status,
          co.total_amount::text as total_amount,
          co.currency,
          co.created_at,
          om.current_status,
          om.payment_method,
          om.payment_source_label
        FROM customer_orders co
        LEFT JOIN order_management om ON co.id = om.customer_order_id
        WHERE co.order_number = ${orderNumber}
      `);

      if (!result.rows || result.rows.length === 0) {
        return { success: false, error: 'سفارش یافت نشد' };
      }

      return { success: true, order: result.rows[0] };
    } catch (error) {
      console.error('🚫 [ORDER DETAILS ERROR]:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // دریافت تراکنش‌های کیف پول برای سفارش
  static async getWalletTransactions(orderNumber: string, customerId: number): Promise<{ success: boolean; transactions?: any[]; error?: string }> {
    try {
      const result = await db.execute(sql`
        SELECT 
          id,
          ABS(amount::decimal) as amount,
          transaction_type,
          description,
          created_at
        FROM wallet_transactions 
        WHERE customer_id = ${customerId}
          AND transaction_type = 'debit'
          AND description LIKE ${`%${orderNumber}%`}
        ORDER BY created_at DESC
      `);

      return {
        success: true,
        transactions: result.rows,
        error: undefined
      };
    } catch (error) {
      console.error('🚫 [WALLET TRANSACTIONS ERROR]:', error);
      return {
        success: false,
        transactions: undefined,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // بررسی یکپارچگی دیتا
  static async checkDataIntegrity(): Promise<{ success: boolean; issues: string[] }> {
    const issues: string[] = [];

    // بررسی سفارشات بدون order_management
    const orphanOrders = await this.safeQuery(`
      SELECT COUNT(*) as count 
      FROM customer_orders co 
      WHERE NOT EXISTS (
        SELECT 1 FROM order_management om 
        WHERE om.customer_order_id = co.id
      )
    `);

    if (orphanOrders.success && orphanOrders.data[0]?.count > 0) {
      issues.push(`${orphanOrders.data[0].count} سفارش بدون رکورد مدیریتی`);
    }

    // بررسی سفارشات پرداخت شده معلق
    const pendingPaid = await this.safeQuery(`
      SELECT COUNT(*) as count 
      FROM customer_orders co
      INNER JOIN order_management om ON co.id = om.customer_order_id
      WHERE co.payment_status = 'paid' AND om.current_status = 'pending'
    `);

    if (pendingPaid.success && pendingPaid.data[0]?.count > 0) {
      issues.push(`${pendingPaid.data[0].count} سفارش پرداخت شده در وضعیت pending`);
    }

    // بررسی تراکنش‌های یتیم
    const orphanTransactions = await this.safeQuery(`
      SELECT COUNT(*) as count 
      FROM wallet_transactions wt
      WHERE wt.description LIKE '%M25113%'
        AND NOT EXISTS (
          SELECT 1 FROM customer_orders co 
          WHERE wt.description LIKE '%' || co.order_number || '%'
        )
    `);

    if (orphanTransactions.success && orphanTransactions.data[0]?.count > 0) {
      issues.push(`${orphanTransactions.data[0].count} تراکنش بدون سفارش متناظر`);
    }

    return {
      success: issues.length === 0,
      issues
    };
  }

  // اصلاح خودکار مشکلات
  static async autoFixIssues(): Promise<{ success: boolean; fixed: string[] }> {
    const fixed: string[] = [];

    try {
      // ایجاد رکوردهای order_management برای سفارشات یتیم
      const fixOrphans = await this.safeQuery(`
        INSERT INTO order_management (
          customer_order_id,
          current_status,
          created_at,
          updated_at
        )
        SELECT 
          co.id,
          CASE 
            WHEN co.status = 'completed' THEN 'delivered'
            WHEN co.payment_status = 'paid' THEN 'warehouse_pending'
            ELSE 'pending'
          END,
          co.created_at,
          NOW()
        FROM customer_orders co 
        WHERE NOT EXISTS (
          SELECT 1 FROM order_management om 
          WHERE om.customer_order_id = co.id
        )
      `);

      if (fixOrphans.success) {
        fixed.push('رکوردهای order_management ایجاد شد');
      }

      // اصلاح سفارشات پرداخت شده معلق
      const fixPending = await this.safeQuery(`
        UPDATE order_management 
        SET 
          current_status = 'warehouse_pending',
          financial_reviewed_at = NOW(),
          financial_reviewer_id = 0,
          financial_notes = 'اصلاح خودکار - سفارش پرداخت شده',
          updated_at = NOW()
        FROM customer_orders co
        WHERE order_management.customer_order_id = co.id
          AND co.payment_status = 'paid' 
          AND order_management.current_status = 'pending'
      `);

      if (fixPending.success) {
        fixed.push('سفارشات پرداخت شده معلق اصلاح شد');
      }

    } catch (error) {
      console.error('❌ [AUTO FIX ERROR]:', error);
    }

    return { success: fixed.length > 0, fixed };
  }

  // محاسبه امن مبلغ
  static safeParseAmount(amount: any): number {
    if (amount === null || amount === undefined) return 0;
    const parsed = parseFloat(amount.toString());
    return isNaN(parsed) ? 0 : parsed;
  }

  // validate order data
  static validateOrder(order: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!order) {
      errors.push('اطلاعات سفارش موجود نیست');
      return { valid: false, errors };
    }

    if (!order.orderNumber || typeof order.orderNumber !== 'string') {
      errors.push('شماره سفارش نامعتبر');
    }

    if (!order.customerId || typeof order.customerId !== 'number') {
      errors.push('شناسه مشتری نامعتبر');
    }

    const totalAmount = this.safeParseAmount(order.totalAmount);
    if (totalAmount <= 0) {
      errors.push('مبلغ سفارش نامعتبر');
    }

    return { valid: errors.length === 0, errors };
  }
}

// Health Check برای سیستم
export class SystemHealthCheck {
  
  static async performFullCheck(): Promise<{ 
    healthy: boolean; 
    issues: string[]; 
    timestamp: Date;
    autoFixed: string[];
  }> {
    console.log('🔍 [HEALTH CHECK] Starting system health check...');
    
    const issues: string[] = [];
    let autoFixed: string[] = [];

    // بررسی یکپارچگی دیتا
    const integrityCheck = await DatabaseUtilities.checkDataIntegrity();
    if (!integrityCheck.success) {
      issues.push(...integrityCheck.issues);
      
      // سعی در اصلاح خودکار
      const autoFix = await DatabaseUtilities.autoFixIssues();
      if (autoFix.success) {
        autoFixed = autoFix.fixed;
      }
    }

    // بررسی اتصال پایگاه داده
    const dbTest = await DatabaseUtilities.safeQuery('SELECT 1 as test');
    if (!dbTest.success) {
      issues.push('خطا در اتصال پایگاه داده');
    }

    const healthy = issues.length === 0;
    
    console.log(`${healthy ? '✅' : '❌'} [HEALTH CHECK] System health: ${healthy ? 'HEALTHY' : 'ISSUES FOUND'}`);
    if (autoFixed.length > 0) {
      console.log('🔧 [HEALTH CHECK] Auto-fixed:', autoFixed);
    }

    return {
      healthy,
      issues,
      timestamp: new Date(),
      autoFixed
    };
  }
}
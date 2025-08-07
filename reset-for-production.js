/**
 * اسکریپت پاک‌سازی کامل داده‌های تست برای انتقال به محیط تولید
 * Production Reset Script - Clean all test data safely
 * 
 * استفاده: node reset-for-production.js
 * Usage: node reset-for-production.js
 */

import { Pool } from '@neondatabase/serverless';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

console.log('🚀 شروع پاک‌سازی سیستم برای محیط تولید...');
console.log('🚀 Starting production reset...\n');

/**
 * پاک کردن تمام فایل‌های آپلود شده در حالت تست
 * Clear all test uploaded files
 */
async function clearUploadedFiles() {
  console.log('📁 پاک‌سازی فایل‌های آپلود شده...');
  
  const uploadDirs = ['uploads', 'test_files', 'backups'];
  
  for (const dir of uploadDirs) {
    const dirPath = path.join(__dirname, dir);
    
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        // حفظ فایل‌های .gitkeep و README
        if (file === '.gitkeep' || file.startsWith('README')) {
          continue;
        }
        
        const filePath = path.join(dirPath, file);
        await fs.unlink(filePath);
        console.log(`  ✅ حذف شد: ${file}`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.log(`  ⚠️ خطا در پاک‌سازی ${dir}:`, error.message);
      }
    }
  }
  
  console.log('✅ فایل‌های آپلود شده پاک شدند\n');
}

/**
 * پاک کردن داده‌های مشتریان و سفارشات
 * Clear customer and order data
 */
async function clearCustomerData() {
  console.log('👥 پاک‌سازی داده‌های مشتریان...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // پاک کردن داده‌ها به ترتیب وابستگی
    const tables = [
      'wallet_transactions',
      'wallet_recharge_requests', 
      'customer_wallets',
      'persistent_cart_items',
      'persistent_carts',
      'order_items',
      'order_management',
      'customer_orders',
      'customer_sessions',
      'customers'
    ];
    
    for (const table of tables) {
      const result = await client.query(`DELETE FROM ${table}`);
      console.log(`  ✅ جدول ${table}: ${result.rowCount} رکورد حذف شد`);
    }
    
    // ریست کردن sequence های ID
    const sequences = [
      'customers_id_seq',
      'customer_orders_id_seq', 
      'order_management_id_seq',
      'customer_wallets_id_seq',
      'wallet_transactions_id_seq'
    ];
    
    for (const seq of sequences) {
      try {
        await client.query(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
        console.log(`  🔄 Sequence ${seq} ریست شد`);
      } catch (error) {
        // اگر sequence وجود نداشت، نادیده بگیر
        console.log(`  ⚠️ Sequence ${seq} یافت نشد`);
      }
    }
    
    await client.query('COMMIT');
    console.log('✅ داده‌های مشتریان پاک شدند\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * پاک کردن لاگ‌ها و آمار
 * Clear logs and statistics
 */
async function clearLogsAndStats() {
  console.log('📊 پاک‌سازی لاگ‌ها و آمار...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const logTables = [
      'automated_emails',
      'sms_logs', 
      'api_logs',
      'system_logs',
      'admin_activity_logs'
    ];
    
    for (const table of logTables) {
      try {
        const result = await client.query(`DELETE FROM ${table}`);
        console.log(`  ✅ جدول ${table}: ${result.rowCount} رکورد حذف شد`);
      } catch (error) {
        if (error.code !== '42P01') { // جدول وجود ندارد
          console.log(`  ⚠️ خطا در پاک‌سازی ${table}:`, error.message);
        } else {
          console.log(`  ℹ️ جدول ${table} وجود ندارد`);
        }
      }
    }
    
    await client.query('COMMIT');
    console.log('✅ لاگ‌ها و آمار پاک شدند\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * حفظ داده‌های اساسی سیستم
 * Preserve essential system data
 */
async function preserveEssentialData() {
  console.log('🔐 حفظ داده‌های اساسی سیستم...');
  
  const client = await pool.connect();
  
  try {
    // بررسی وجود ادمین اصلی
    const adminCheck = await client.query(
      'SELECT COUNT(*) as count FROM admins WHERE username = $1', 
      ['admin']
    );
    
    if (parseInt(adminCheck.rows[0].count) === 0) {
      console.log('  ⚠️ ادمین اصلی یافت نشد، ایجاد ادمین جدید...');
      
      // ایجاد ادمین اصلی (پسورد باید تغییر کند)
      await client.query(`
        INSERT INTO admins (username, email, password_hash, role_id, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [
        'admin',
        'admin@momtazchem.com', 
        '$2a$10$defaultHashForProduction', // باید تغییر کند
        1
      ]);
      
      console.log('  ✅ ادمین اصلی ایجاد شد (لطفاً پسورد را تغییر دهید)');
    } else {
      console.log('  ✅ ادمین اصلی موجود است');
    }
    
    // بررسی تنظیمات اساسی
    const settings = [
      'footer_settings',
      'global_email_settings', 
      'frontend_controls',
      'company_banking_info'
    ];
    
    for (const table of settings) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ✅ ${table}: ${result.rows[0].count} رکورد حفظ شد`);
      } catch (error) {
        console.log(`  ℹ️ جدول ${table} یافت نشد`);
      }
    }
    
    console.log('✅ داده‌های اساسی حفظ شدند\n');
    
  } finally {
    client.release();
  }
}

/**
 * تأیید عملیات از کاربر
 * Confirm operation with user
 */
async function confirmOperation() {
  console.log('⚠️  هشدار مهم: این عملیات تمام داده‌های تست را حذف می‌کند!');
  console.log('⚠️  WARNING: This operation will delete ALL test data!');
  console.log('\nداده‌های حذف شده شامل:');
  console.log('- تمام مشتریان و حساب‌های کاربری');
  console.log('- تمام سفارشات و تراکنش‌ها');
  console.log('- تمام فایل‌های آپلود شده');
  console.log('- تمام لاگ‌ها و آمار');
  console.log('\nداده‌های حفظ شده:');
  console.log('- محصولات و کاتالوگ');
  console.log('- تنظیمات سیستم');
  console.log('- حساب‌های مدیریت');
  console.log('- اطلاعات بانکی شرکت\n');
  
  // در محیط تولید، اینجا منتظر تأیید کاربر می‌مانیم
  console.log('برای تأیید عملیات، متغیر محیطی CONFIRM_RESET=true را تنظیم کنید');
  
  if (process.env.CONFIRM_RESET !== 'true') {
    console.log('❌ عملیات لغو شد - تأیید دریافت نشد');
    process.exit(1);
  }
}

/**
 * اجرای کامل پاک‌سازی
 * Execute complete reset
 */
async function executeReset() {
  try {
    await confirmOperation();
    
    console.log('🚀 شروع عملیات پاک‌سازی...\n');
    
    await clearUploadedFiles();
    await clearCustomerData();  
    await clearLogsAndStats();
    await preserveEssentialData();
    
    console.log('🎉 عملیات پاک‌سازی با موفقیت کامل شد!');
    console.log('🎉 Production reset completed successfully!');
    console.log('\nمراحل بعدی:');
    console.log('1. پسورد ادمین را تغییر دهید');
    console.log('2. تنظیمات ایمیل و SMS را بررسی کنید'); 
    console.log('3. دامین و SSL را پیکربندی کنید');
    console.log('4. بک‌آپ اولیه از دیتابیس تهیه کنید\n');
    
  } catch (error) {
    console.error('❌ خطا در عملیات پاک‌سازی:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// اجرای اسکریپت
if (import.meta.url === `file://${process.argv[1]}`) {
  executeReset();
}
#!/bin/bash

# اسکریپت بک‌آپ گیری خودکار دیتابیس
# Database Backup Script

# تنظیمات
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="database_backup_$DATE.sql"
COMPRESSED_FILE="database_backup_$DATE.sql.gz"

# ایجاد پوشه بک‌آپ در صورت عدم وجود
mkdir -p $BACKUP_DIR

echo "🔄 شروع بک‌آپ گیری از دیتابیس..."
echo "📅 تاریخ: $(date)"

# بررسی اتصال دیتابیس
if ! psql $DATABASE_URL -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ خطا: عدم اتصال به دیتابیس"
    exit 1
fi

echo "✅ اتصال به دیتابیس برقرار است"

# گرفتن بک‌آپ کامل
echo "📦 در حال ایجاد بک‌آپ کامل..."
pg_dump $DATABASE_URL > $BACKUP_DIR/$BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ بک‌آپ کامل ایجاد شد: $BACKUP_FILE"
    
    # فشرده کردن بک‌آپ
    echo "🗜️ در حال فشرده سازی..."
    gzip $BACKUP_DIR/$BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        echo "✅ فایل فشرده شد: $COMPRESSED_FILE"
        
        # نمایش حجم فایل
        SIZE=$(ls -lh $BACKUP_DIR/$COMPRESSED_FILE | awk '{print $5}')
        echo "📊 حجم فایل فشرده: $SIZE"
    else
        echo "⚠️ خطا در فشرده سازی"
    fi
else
    echo "❌ خطا در ایجاد بک‌آپ"
    exit 1
fi

# بک‌آپ جداول مهم به صورت جداگانه
echo "📋 بک‌آپ جداول مهم..."

# بک‌آپ محصولات فروشگاه (با بارکد)
pg_dump $DATABASE_URL -t shop_products > $BACKUP_DIR/shop_products_$DATE.sql
echo "✅ shop_products: $(wc -l < $BACKUP_DIR/shop_products_$DATE.sql) خط"

# بک‌آپ مشتریان CRM
pg_dump $DATABASE_URL -t crm_customers > $BACKUP_DIR/crm_customers_$DATE.sql
echo "✅ crm_customers: $(wc -l < $BACKUP_DIR/crm_customers_$DATE.sql) خط"

# بک‌آپ سفارشات
pg_dump $DATABASE_URL -t orders > $BACKUP_DIR/orders_$DATE.sql
echo "✅ orders: $(wc -l < $BACKUP_DIR/orders_$DATE.sql) خط"

# آمار دیتابیس
echo ""
echo "📊 آمار فعلی دیتابیس:"
psql $DATABASE_URL -c "
SELECT 
  'محصولات کاتالوگ' as table_name, COUNT(*) as count FROM products
  UNION ALL
  SELECT 'محصولات فروشگاه', COUNT(*) FROM shop_products
  UNION ALL  
  SELECT 'مشتریان CRM', COUNT(*) FROM crm_customers
  UNION ALL
  SELECT 'مشتریان عادی', COUNT(*) FROM customers
  UNION ALL
  SELECT 'سفارشات', COUNT(*) FROM orders
  ORDER BY count DESC;
"

# پاک کردن فایل‌های قدیمی (بیش از 30 روز)
echo ""
echo "🧹 پاک کردن بک‌آپ‌های قدیمی..."
find $BACKUP_DIR -name "*.sql*" -mtime +30 -delete
echo "✅ فایل‌های قدیمی‌تر از 30 روز پاک شدند"

echo ""
echo "🎉 بک‌آپ گیری با موفقیت تکمیل شد!"
echo "📁 مسیر بک‌آپ‌ها: $BACKUP_DIR"
echo "🕐 زمان تکمیل: $(date)"
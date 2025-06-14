# راهنمای مدیریت دیتابیس و بک‌آپ گیری

## مشخصات دیتابیس فعلی

- **نوع**: PostgreSQL 16.9
- **سرویس**: Neon Database Cloud
- **محل**: us-east-2.aws.neon.tech
- **نام دیتابیس**: neondb
- **اتصال**: از طریق متغیر محیطی DATABASE_URL

## روش‌های بک‌آپ گیری

### 1. بک‌آپ کامل (Full Backup)
```bash
# بک‌آپ کامل با تاریخ و زمان
pg_dump $DATABASE_URL > database_backup_$(date +%Y%m%d_%H%M%S).sql

# بک‌آپ فشرده
pg_dump $DATABASE_URL | gzip > database_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 2. بک‌آپ جداول خاص
```bash
# بک‌آپ جدول محصولات
pg_dump $DATABASE_URL -t products > products_backup.sql

# بک‌آپ جدول فروشگاه
pg_dump $DATABASE_URL -t shop_products > shop_products_backup.sql

# بک‌آپ جداول CRM
pg_dump $DATABASE_URL -t crm_customers -t customer_activities > crm_backup.sql
```

### 3. بک‌آپ فقط داده‌ها (بدون ساختار)
```bash
pg_dump $DATABASE_URL --data-only > data_only_backup.sql
```

### 4. بک‌آپ فقط ساختار (بدون داده)
```bash
pg_dump $DATABASE_URL --schema-only > schema_only_backup.sql
```

## بازیابی از بک‌آپ

### بازیابی کامل
```bash
# پاک کردن دیتابیس موجود و بازیابی
psql $DATABASE_URL < database_backup_20250614_110839.sql
```

### بازیابی جدول خاص
```bash
# بازیابی فقط جدول محصولات
psql $DATABASE_URL < products_backup.sql
```

## جداول موجود در سیستم

1. **products** - محصولات اصلی کاتالوگ
2. **shop_products** - محصولات فروشگاه با قابلیت بارکد
3. **crm_customers** - مشتریان CRM
4. **customer_activities** - فعالیت‌های مشتریان
5. **customer_segments** - بخش‌بندی مشتریان
6. **customer_orders** - سفارشات مشتریان
7. **email_templates** - قالب‌های ایمیل
8. **email_categories** - دسته‌بندی ایمیل‌ها
9. **smtp_settings** - تنظیمات SMTP
10. **inventory_transactions** - تراکنش‌های انبار

## نکات امنیتی

- ✅ بک‌آپ‌ها حاوی اطلاعات حساس هستند
- ✅ فایل‌های بک‌آپ را در محل امن نگهداری کنید
- ✅ رمزهای عبور در بک‌آپ‌ها هش شده هستند
- ✅ برای تولید محتوای تست از API keys اصلی استفاده کنید

## برنامه بک‌آپ گیری توصیه شده

### روزانه
```bash
# اسکریپت بک‌آپ روزانه
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > daily_backup_$DATE.sql.gz
```

### هفتگی
```bash
# بک‌آپ هفتگی کامل
#!/bin/bash
WEEK=$(date +%Y_week_%U)
pg_dump $DATABASE_URL > weekly_backup_$WEEK.sql
```

## بررسی سلامت دیتابیس

```bash
# بررسی اتصال
psql $DATABASE_URL -c "SELECT version();"

# بررسی تعداد رکوردها
psql $DATABASE_URL -c "SELECT 
  'products' as table_name, COUNT(*) as count FROM products
  UNION ALL
  SELECT 'shop_products', COUNT(*) FROM shop_products
  UNION ALL  
  SELECT 'crm_customers', COUNT(*) FROM crm_customers;"
```

## آخرین بک‌آپ ایجاد شده

📁 **فایل**: `database_backup_20250614_110839.sql`
📊 **حجم**: 114,751 بایت
🕐 **تاریخ**: 14 ژوئن 2025 - 11:08 صبح
✅ **وضعیت**: موفق

این بک‌آپ شامل تمام جداول، داده‌ها، و ساختار دیتابیس است.
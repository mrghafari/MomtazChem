# راهنمای نصب و پیاده‌سازی دیتابیس در سیستم شخصی

## فایل‌های مورد نیاز
- `complete_database_export_20250614.sql` - فایل کامل دیتابیس
- `package.json` - وابستگی‌های پروژه
- `drizzle.config.ts` - تنظیمات ORM
- پوشه `migrations/` - فایل‌های مایگریشن

## پیش‌نیازها
```bash
# نصب PostgreSQL
sudo apt install postgresql postgresql-contrib  # Ubuntu/Debian
brew install postgresql                         # macOS

# نصب Node.js و npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## مراحل نصب

### 1. ایجاد دیتابیس محلی
```bash
# شروع سرویس PostgreSQL
sudo systemctl start postgresql

# ایجاد کاربر و دیتابیس
sudo -u postgres psql
CREATE USER myapp_user WITH PASSWORD 'secure_password';
CREATE DATABASE chemical_platform;
GRANT ALL PRIVILEGES ON DATABASE chemical_platform TO myapp_user;
\q
```

### 2. تنظیم متغیر محیطی
```bash
# اضافه کردن به ~/.bashrc یا ~/.profile
export DATABASE_URL="postgresql://myapp_user:secure_password@localhost:5432/chemical_platform"
```

### 3. بازیابی دیتابیس
```bash
# بازیابی کامل
psql $DATABASE_URL < complete_database_export_20250614.sql
```

### 4. نصب وابستگی‌ها
```bash
npm install
npm run db:push  # اعمال schema
```

## تست دیتابیس
```bash
# بررسی اتصال
psql $DATABASE_URL -c "SELECT COUNT(*) FROM products;"

# بررسی جداول
psql $DATABASE_URL -c "\dt"
```

## فایل تنظیمات محلی (.env.local)
```
DATABASE_URL=postgresql://myapp_user:secure_password@localhost:5432/chemical_platform
NODE_ENV=development
PORT=5000
```

## دستورات مفید

### بک‌آپ محلی
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### بازیابی انتخابی
```bash
# فقط جدول محصولات
pg_dump $DATABASE_URL -t shop_products > shop_products.sql
psql $DATABASE_URL < shop_products.sql
```

### بررسی سلامت
```bash
psql $DATABASE_URL -c "
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
ORDER BY n_tup_ins DESC;
"
```

## نکات امنیتی
- رمز عبور قوی انتخاب کنید
- دسترسی شبکه را محدود کنید
- بک‌آپ‌های منظم بگیرید
- فایل‌های .env را در .gitignore قرار دهید

## عیب‌یابی

### خطای اتصال
```bash
# بررسی وضعیت PostgreSQL
sudo systemctl status postgresql

# بررسی پورت
sudo netstat -tlnp | grep 5432
```

### خطای مجوز
```bash
# تنظیم مجوزها
sudo -u postgres psql
GRANT ALL ON SCHEMA public TO myapp_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO myapp_user;
```

## اطلاعات دیتابیس فعلی
- **تعداد جداول**: 27 جدول
- **تعداد محصولات**: 16 آیتم
- **تعداد مشتریان**: 7 مشتری
- **حجم کل**: ~115 کیلوبایت

این راهنما همه چیز لازم برای پیاده‌سازی کامل سیستم در محیط محلی شما را فراهم می‌کند.
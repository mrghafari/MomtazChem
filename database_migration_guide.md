# راهنمای انتقال دیتابیس PostgreSQL

## ۱. تهیه فایل Backup

فایل `database_backup.sql` حاوی کامل دیتابیس شما است شامل:
- ساختار تمام جداول
- تمام داده‌های موجود
- کلیدهای اصلی و خارجی
- ایندکس‌ها و محدودیت‌ها

## ۲. نصب دیتابیس در سرور جدید

### گام ۱: نصب PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### گام ۲: ایجاد دیتابیس جدید
```bash
sudo -u postgres createdb momtazchem_db
sudo -u postgres createuser momtazchem_user
sudo -u postgres psql -c "ALTER USER momtazchem_user WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE momtazchem_db TO momtazchem_user;"
```

## ۳. بازیابی دیتابیس

### گام ۱: انتقال فایل backup به سرور
```bash
scp database_backup.sql your_server:/tmp/
```

### گام ۲: بازیابی داده‌ها
```bash
sudo -u postgres psql momtazchem_db < /tmp/database_backup.sql
```

## ۴. تنظیم متغیرهای محیطی

در فایل `.env` پروژه خود:
```env
DATABASE_URL=postgresql://momtazchem_user:your_secure_password@localhost:5432/momtazchem_db
```

## ۵. تنظیمات امنیتی PostgreSQL

### گام ۱: تنظیم فایل pg_hba.conf
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

اضافه کردن خط:
```
local   momtazchem_db   momtazchem_user                     md5
host    momtazchem_db   momtazchem_user   127.0.0.1/32      md5
```

### گام ۲: راه‌اندازی مجدد PostgreSQL
```bash
sudo systemctl restart postgresql
```

## ۶. تست اتصال

```bash
psql -h localhost -U momtazchem_user -d momtazchem_db
```

## ۷. Backup خودکار (توصیه می‌شود)

ایجاد اسکریپت backup روزانه:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U momtazchem_user momtazchem_db > /backup/momtazchem_$DATE.sql
find /backup -name "momtazchem_*.sql" -mtime +7 -delete
```

## ۸. نکات مهم

- قبل از انتقال، حتماً از دیتابیس فعلی backup تهیه کنید
- رمز عبور قوی برای کاربر دیتابیس انتخاب کنید
- فایروال را برای محدود کردن دسترسی به پورت PostgreSQL تنظیم کنید
- SSL را برای اتصالات امن فعال کنید
- به طور منظم backup تهیه کنید

## ۹. بررسی انتقال موفق

پس از انتقال، این کوئری‌ها را اجرا کنید:
```sql
-- بررسی تعداد جداول
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- بررسی تعداد محصولات
SELECT COUNT(*) FROM products;

-- بررسی تعداد کاربران
SELECT COUNT(*) FROM users;

-- بررسی تعداد تماس‌ها
SELECT COUNT(*) FROM contacts;
```

## ۱۰. اتصال اپلیکیشن

پس از انتقال دیتابیس، متغیر DATABASE_URL را در محیط production به دیتابیس جدید تغییر دهید و اپلیکیشن را restart کنید.
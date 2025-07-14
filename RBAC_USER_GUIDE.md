# راهنمای سیستم کنترل دسترسی مبتنی بر نقش (RBAC)

## نحوه ورود کاربران با نقش‌های مختلف

### 1. مدیر مالی (Financial Manager)
**آدرس ورود:** `/admin/financial-login`
- **نام کاربری:** `financial_manager`
- **رمز عبور:** `Financial@123`

**دسترسی‌های مدیر مالی:**
- ✅ Wallet Management (مدیریت کیف پول)
- ✅ Order Management (مدیریت سفارشات)
- ✅ Payment Settings (تنظیمات پرداخت)  
- ✅ Geography Analytics (آنالیتیکس جغرافیایی)
- ✅ CRM (مشاهده مشتریان)
- ✅ Financial Orders (سفارشات مالی)

### 2. سرپرست انبار (Warehouse Manager)
**آدرس ورود:** `/admin/warehouse-login`
- **نام کاربری:** `warehouse_manager`
- **رمز عبور:** `Warehouse@123`

**دسترسی‌های سرپرست انبار:**
- ✅ Inventory Management (مدیریت موجودی)
- ✅ Order Management (مدیریت سفارشات)
- ✅ Products (مشاهده محصولات)
- ✅ Warehouse Orders (سفارشات انبار)

### 3. مدیر فروش (Sales Manager)
**آدرس ورود:** `/admin/sales-login`
- **نام کاربری:** `sales_manager`
- **رمز عبور:** `Sales@123`

**دسترسی‌های مدیر فروش:**
- ✅ Shop (مدیریت فروشگاه)
- ✅ CRM (مدیریت کامل مشتریان)
- ✅ Inquiries (پاسخ به استعلامات)
- ✅ Geography Analytics (آنالیتیکس جغرافیایی)

### 4. مدیر محتوا (Content Manager)
**آدرس ورود:** `/admin/content-login`
- **نام کاربری:** `content_manager`
- **رمز عبور:** `Content@123`

**دسترسی‌های مدیر محتوا:**
- ✅ Content Management (مدیریت محتوا)
- ✅ SEO (بهینه‌سازی موتورجستجو)
- ✅ Categories (مدیریت دسته‌بندی‌ها)

### 5. مدیر فنی (Technical Manager)
**آدرس ورود:** `/admin/technical-login`
- **نام کاربری:** `technical_manager`
- **رمز عبور:** `Technical@123`

**دسترسی‌های مدیر فنی:**
- ✅ Database Backup (پشتیبان‌گیری)
- ✅ SMTP Test (تست ایمیل)
- ✅ AI Settings (تنظیمات هوش مصنوعی)
- ✅ Barcode (مدیریت بارکد)

### 6. مدیر ارشد (Super Admin)
**آدرس ورود:** `/admin/login`
- **ایمیل:** `admin@momtazchem.com`
- **رمز عبور:** `Ghafari@110`

**دسترسی‌های مدیر ارشد:**
- ✅ همه ماژول‌ها (دسترسی کامل)

## نحوه کارکرد سیستم

### 1. احراز هویت
پس از ورود هر کاربر، سیستم:
- نقش کاربر را از پایگاه داده تشخیص می‌دهد
- دسترسی‌های مربوط به آن نقش را بارگذاری می‌کند
- فقط ماژول‌هایی که کاربر مجاز است نمایش می‌دهد

### 2. کنترل دسترسی
- **Site Management:** فقط ماژول‌های مجاز نمایش داده می‌شوند
- **User Management:** مدیریت نقش‌ها و دسترسی‌ها
- **Fine-grained Permissions:** کنترل دقیق (مشاهده/ایجاد/ویرایش/حذف/تأیید)

### 3. API Endpoints
- `GET /api/user/permissions` - دریافت دسترسی‌های کاربر
- `GET /api/modules/available` - لیست تمام ماژول‌های موجود
- Role-based filtering در تمام قسمت‌ها

## تست سیستم

```bash
# ورود مدیر مالی
curl -X POST "http://localhost:5000/api/financial/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"financial_manager","password":"Financial@123"}' \
  -c cookies.txt

# بررسی دسترسی‌ها
curl -X GET "http://localhost:5000/api/user/permissions" \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

## نقش‌های قابل تخصیص
- `financial_manager` - مدیر مالی
- `warehouse_manager` - سرپرست انبار  
- `sales_manager` - مدیر فروش
- `content_manager` - مدیر محتوا
- `technical_manager` - مدیر فنی
- `super_admin` - مدیر ارشد

## مزایای سیستم RBAC
1. **امنیت بالا:** هر کاربر فقط به ماژول‌های ضروری دسترسی دارد
2. **مدیریت آسان:** اضافه/حذف نقش‌ها از طریق User Management
3. **انعطاف‌پذیری:** تعریف دسترسی‌های دقیق برای هر ماژول
4. **شفافیت:** کاربران می‌دانند به چه ماژول‌هایی دسترسی دارند
5. **مقیاس‌پذیری:** اضافه کردن نقش‌ها و ماژول‌های جدید
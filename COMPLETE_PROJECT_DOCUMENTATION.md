# داکیومنت جامع پروژه پلتفرم ممتازکیم
## Chemical Solutions E-commerce & Management Platform

---

# فهرست مطالب

1. [معرفی کلی پروژه](#معرفی-کلی-پروژه)
2. [معماری سیستم](#معماری-سیستم)
3. [فناوری‌های استفاده شده](#فناوری‌های-استفاده-شده)
4. [ساختار پایگاه داده](#ساختار-پایگاه-داده)
5. [ماژول‌های اصلی](#ماژول‌های-اصلی)
6. [سیستم مدیریت](#سیستم-مدیریت)
7. [سیستم فروشگاهی](#سیستم-فروشگاهی)
8. [سیستم CRM](#سیستم-crm)
9. [سیستم ایمیل](#سیستم-ایمیل)
10. [سیستم بارکد](#سیستم-بارکد)
11. [تنظیمات پیشرفته](#تنظیمات-پیشرفته)
12. [آمار و گزارشات](#آمار-و-گزارشات)
13. [راهنمای استقرار](#راهنمای-استقرار)

---

## معرفی کلی پروژه

### هدف پروژه
پلتفرم جامع تجارت الکترونیک و مدیریت شرکت ممتازکیم، پیشرو در صنعت محصولات شیمیایی. این سیستم ترکیبی از وب‌سایت نمایشی، فروشگاه آنلاین، و ابزارهای مدیریتی قدرتمند شامل CRM، مدیریت موجودی، و اتوماسیون ایمیل است.

### ویژگی‌های کلیدی
- **وب‌سایت چندزبانه:** پشتیبانی از انگلیسی، عربی، و کردی
- **سیستم فروشگاهی:** خرید آنلاین با درگاه‌های پرداخت عراقی
- **CRM پیشرفته:** مدیریت مشتریان و فرآیند فروش
- **مدیریت موجودی:** ردیابی انبار و هشدار کمبود موجودی
- **اتوماسیون ایمیل:** سیستم ایمیل هوشمند با چندین SMTP
- **سیستم بارکد:** تولید و مدیریت بارکد EAN-13 استاندارد

---

## معماری سیستم

### Frontend Architecture
```
- Framework: React 18 با TypeScript
- UI Library: Shadcn/ui + Tailwind CSS
- State Management: TanStack Query + React Hooks
- Routing: Wouter
- Forms: React Hook Form + Zod
- Theme: Next Themes (Dark/Light Mode)
```

### Backend Architecture
```
- Runtime: Node.js 20 + Express.js
- Language: TypeScript با ESM modules
- Session: Express sessions + PostgreSQL store
- Authentication: Custom session-based auth
- File Upload: Multer
- Email: Nodemailer با چندین SMTP provider
```

### Database Architecture
```
- Primary DB: PostgreSQL 16 (Neon Cloud)
- ORM: Drizzle ORM
- Migrations: Drizzle Kit
- Connection: Serverless با connection pooling
```

---

## فناوری‌های استفاده شده

### Core Dependencies
```json
{
  "react": "18.x",
  "typescript": "5.x",
  "drizzle-orm": "^0.x",
  "@neondatabase/serverless": "^0.x",
  "express": "4.x",
  "tailwindcss": "3.x",
  "@tanstack/react-query": "5.x",
  "wouter": "3.x",
  "zod": "3.x"
}
```

### Development Tools
```json
{
  "vite": "5.x",
  "tsx": "4.x",
  "drizzle-kit": "^0.x",
  "@types/node": "20.x",
  "autoprefixer": "10.x"
}
```

### Third-Party Integrations
- **Payment:** Stripe + Iraqi Banking Systems
- **Email:** Zoho Mail SMTP (primary)
- **Chat:** Tawk.to Live Chat
- **PDF:** Puppeteer
- **Analytics:** Google Analytics Ready
- **AI:** OpenAI GPT-4o

---

## ساختار پایگاه داده

### Schema Files
```
shared/
├── schema.ts              # Core CRM, Admin, SEO
├── showcase-schema.ts     # Public products
├── shop-schema.ts         # E-commerce products
├── customer-schema.ts     # Customer portal
└── email-schema.ts        # Email automation
```

### Main Tables

#### CRM System
```sql
- crm_customers: مشتریان اصلی
- customer_activities: فعالیت‌های مشتری
- customer_segments: بخش‌بندی مشتریان
- customer_addresses: آدرس‌های مشتری
```

#### Product Management
```sql
- showcase_products: محصولات نمایشی (14 محصول)
- shop_products: محصولات فروشگاهی (35 محصول)
- categories: دسته‌بندی محصولات
- product_variants: انواع محصولات
```

#### Order Management
```sql
- orders: سفارشات
- order_items: آیتم‌های سفارش
- invoices: فاکتورها
- payment_gateways: درگاه‌های پرداخت
```

#### Email System
```sql
- email_settings: تنظیمات SMTP
- email_recipients: گیرندگان ایمیل
- email_templates: قالب‌های ایمیل
- email_logs: لاگ ارسال ایمیل
```

#### Inventory Management
```sql
- inventory_transactions: تراکنش‌های انبار
- low_stock_notifications: اعلان‌های کمبود موجودی
```

---

## ماژول‌های اصلی

### 1. Site Management (مدیریت سایت)
مرکز کنترل اصلی شامل 23 عملکرد:

```
1. تنظیمات پایه سایت
2. مدیریت استعلامات
3. مدیریت بارکد
4. تنظیمات ایمیل پیشرفته
5. پشتیبان‌گیری پایگاه داده
6. مدیریت CRM
7. تنظیمات SEO
8. مدیریت دسته‌بندی
9. مدیریت SMS
10. مدیریت کارخانه
11. تنظیمات سوپر ادمین
12. مدیریت کاربران
13. مدیریت فروشگاه
14. مدیریت روش‌ها و راهنما
15. تست SMTP
16. مدیریت سفارشات
17. مدیریت محصولات
18. مدیریت فاکتورها
19. گزارشات فروش
20. آنالیتیک‌ها
21. مدیریت ویریانت محصولات
22. مولد EAN-13
23. تنظیمات هوش مصنوعی
```

### 2. Customer Portal (پورتال مشتری)
```
- ثبت‌نام و ورود
- پروفایل مشتری
- سیستم کیف پول
- تاریخچه سفارشات
- ردیابی سفارش
- مدیریت آدرس
```

### 3. E-commerce System (سیستم فروشگاهی)
```
- کاتالوگ محصولات
- سبد خرید
- فرآیند پرداخت
- مدیریت تخفیف
- سیستم فاکتور
- درگاه‌های پرداخت عراقی
```

---

## سیستم مدیریت

### Admin Dashboard
```
- نمای کلی آمار
- دسترسی سریع به Site Management
- مدیریت محصولات
- گزارشات فروش
- آنالیتیک مشتریان
```

### User Management
```
- مدیریت ادمین‌ها
- سطوح دسترسی
- احراز هویت دومرحله‌ای
- بازیابی رمز عبور
```

### Security Features
```
- Session-based authentication
- Password hashing با bcrypt
- Rate limiting
- Input validation با Zod
- SQL injection protection
```

---

## سیستم فروشگاهی

### Product Management
```
- 35 محصول فعال
- دسته‌بندی هوشمند
- مدیریت موجودی
- تصاویر محصول
- مشخصات فنی
```

### Shopping Cart
```
- افزودن/حذف محصولات
- محاسبه تخفیف
- مالیات و هزینه ارسال
- ذخیره سبد برای کاربران
```

### Checkout Process
```
- انتخاب آدرس تحویل
- انتخاب روش پرداخت
- تأیید سفارش
- ارسال فاکتور
```

### Payment Gateways
```
- Stripe International
- Rasheed Bank (عراق)
- Al-Rafidain Bank (عراق)
- Trade Bank of Iraq
```

---

## سیستم CRM

### Customer Management
```
- پروفایل کامل مشتری
- تاریخچه خرید
- آنالیتیک رفتار مشتری
- بخش‌بندی مشتریان
```

### Sales Pipeline
```
- مدیریت lead ها
- فرآیند فروش
- پیگیری مشتریان
- گزارش‌گیری فروش
```

### Customer Analytics
```
- ارزش کل مشتری (CLV)
- آمار خرید
- رفتار کاربری
- پیش‌بینی فروش
```

### Activity Tracking
```
- ثبت تماس‌ها
- ایمیل‌های ارسالی
- تاریخچه سفارشات
- یادداشت‌های فروش
```

---

## سیستم ایمیل

### SMTP Configuration
```
- Primary: Zoho Mail
- Backup SMTP providers
- Load balancing
- Authentication testing
```

### Email Categories
```
- Sales Department
- Support Team  
- Administrative
- Marketing
- Custom departments
```

### Email Templates
```
- Welcome emails
- Order confirmations
- Password reset
- Low stock alerts
- Custom templates
```

### Email Automation
```
- Trigger-based sending
- Smart routing
- Duplicate prevention
- Delivery tracking
```

---

## سیستم بارکد

### EAN-13 Standard
```
Format: 864-96771-XXXX-C
- Country Code: 864 (Iraq)
- Company Code: 96771 (Momtazchem)
- Product Code: 4-digit unique
- Check Digit: Auto-calculated
```

### Visual Components
```
- VisualBarcode component
- Print-ready labels
- Download functionality
- Copy to clipboard
```

### Management Features
```
- Bulk generation
- CSV export for label printers
- Inventory integration
- Barcode validation
```

### Statistics
```
- Total Products: 49
- Showcase Products: 14
- Shop Products: 35
- Generated Barcodes: 49
```

---

## تنظیمات پیشرفته

### AI Settings
```
- OpenAI GPT-4o integration
- Smart SKU generation
- Product recommendations
- Performance monitoring
```

### SEO Management
```
- Multi-language SEO
- Meta tags optimization
- Structured data
- Sitemap generation
```

### Performance Monitoring
```
- Database queries optimization
- Response time tracking
- Error monitoring
- Usage analytics
```

### Backup & Recovery
```
- Automated daily backups
- Manual backup triggers
- Data export capabilities
- Recovery procedures
```

---

## آمار و گزارشات

### Sales Analytics
```
- Daily/Monthly/Yearly reports
- Product performance
- Geographic distribution
- Customer segmentation
```

### Inventory Reports
```
- Stock levels
- Low stock alerts
- Movement tracking
- Valuation reports
```

### Customer Analytics
```
- Acquisition metrics
- Retention rates
- Purchase patterns
- Lifetime value
```

### System Metrics
```
- User activity
- Performance stats
- Error rates
- API usage
```

---

## راهنمای استقرار

### Development Environment
```
Platform: Replit
Runtime: Node.js 20
Database: Neon PostgreSQL
Port: 5000 → 80
Build: Vite + esbuild
```

### Production Deployment
```
Build Command: npm run build
Start Command: npm run start
Environment Variables:
- DATABASE_URL
- SMTP credentials
- Session secrets
- API keys
```

### Environment Variables
```
- DATABASE_URL: Neon connection string
- OPENAI_API_KEY: AI functionality
- SMTP_* variables: Email configuration
- SESSION_SECRET: Session security
- VITE_*: Frontend environment vars
```

### Security Considerations
```
- HTTPS enforcement
- SQL injection prevention
- XSS protection
- Rate limiting
- Input validation
```

---

## File Structure

```
project/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
├── server/                # Backend Express app
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry
├── shared/                # Shared code
│   ├── schema.ts          # Database schemas
│   └── barcode-utils.ts   # Barcode utilities
├── migrations/            # Database migrations
└── uploads/              # File uploads
```

---

## API Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/check
POST /api/auth/register
```

### Products
```
GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
GET    /api/showcase-products
```

### Orders
```
GET  /api/orders
POST /api/orders
GET  /api/orders/:id
PUT  /api/orders/:id/status
```

### CRM
```
GET  /api/crm/customers
POST /api/crm/customers
GET  /api/crm/analytics
POST /api/crm/activities
```

### Barcode
```
POST /api/barcode/generate
GET  /api/barcode/download-all
POST /api/barcode/validate
GET  /api/barcode/search/:code
```

### Email
```
POST /api/email/send
GET  /api/email/settings
POST /api/email/test
GET  /api/email/logs
```

---

## تغییرات اخیر

### جولای 2025
- ✅ سیستم AI Settings کامل
- ✅ مولد EAN-13 حرفه‌ای
- ✅ تصحیح کد کشور عراق (864)
- ✅ سیستم بارکد VisualBarcode
- ✅ دانلود CSV برای لیبل پرینتر

### ژوئن 2025
- ✅ پشتیبانی زبان کردی
- ✅ سیستم پرداخت بانک‌های عراقی
- ✅ مدیریت فاکتورهای چندزبانه
- ✅ متمرکزسازی مدیریت در Site Management
- ✅ سیستم CRM یکپارچه

---

## خلاصه دستاوردها

این پروژه شامل:

### Backend Capabilities
- 🚀 **11,000+ خط کد TypeScript**
- 🔥 **60+ API endpoint**
- 💾 **8 schema پایگاه داده**
- 🔐 **احراز هویت امن**
- 📧 **سیستم ایمیل هوشمند**

### Frontend Features  
- ⚡ **React 18 + TypeScript**
- 🎨 **UI/UX حرفه‌ای با Tailwind**
- 🌐 **چندزبانه (En/Ar/Ku)**
- 📱 **طراحی واکنشگرا**
- 🛒 **فروشگاه کامل**

### Business Value
- 👥 **مدیریت CRM پیشرفته**
- 📊 **آنالیتیک‌ها و گزارشات**
- 🏪 **فروشگاه آنلاین کامل**
- 📦 **مدیریت موجودی هوشمند**
- 🏷️ **سیستم بارکد استاندارد**

---

**نسخه:** 2.0.0  
**آخرین بروزرسانی:** 4 جولای 2025  
**وضعیت:** Production Ready  
**توسعه‌دهنده:** تیم فنی ممتازکیم  
**پلتفرم:** Replit + Neon Database  

---

*این داکیومنت تمام جنبه‌های فنی و کسب‌وکاری پلتفرم ممتازکیم را پوشش می‌دهد و به عنوان مرجع کامل پروژه قابل استفاده است.*
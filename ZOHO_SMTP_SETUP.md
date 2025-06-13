# راهنمای تنظیم SMTP برای Zoho Mail

## تنظیمات مورد نیاز برای Zoho Mail

برای استفاده از Zoho Mail به عنوان سرویس SMTP، باید متغیرهای محیطی زیر را در سیستم خود تنظیم کنید:

### 1. تنظیمات SMTP Zoho Mail

```bash
# Host و Port
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587

# اطلاعات احراز هویت
SMTP_USER=info@momtazchem.com
SMTP_PASS=your_app_password_here
```

### 2. نحوه دریافت App Password از Zoho

1. وارد حساب Zoho خود شوید
2. به بخش **Account Settings** بروید
3. روی **Security** کلیک کنید
4. بخش **App Passwords** را پیدا کنید
5. **Generate New Password** کنید
6. نام مناسبی مثل "Momtazchem Website" انتخاب کنید
7. رمز عبور تولید شده را کپی کنید و در `SMTP_PASS` قرار دهید

### 3. تنظیم متغیرهای محیطی در Replit

1. در پنل Replit، روی **Secrets** کلیک کنید
2. متغیرهای زیر را اضافه کنید:
   - `SMTP_HOST`: smtp.zoho.com
   - `SMTP_PORT`: 587
   - `SMTP_USER`: info@momtazchem.com
   - `SMTP_PASS`: [App Password شما]

### 4. تنظیمات امنیتی اضافی

برای بهبود امنیت، می‌توانید این تنظیمات را نیز اعمال کنید:

- فعال‌سازی Two-Factor Authentication در Zoho
- محدود کردن دسترسی IP در تنظیمات Zoho
- استفاده از App Password به جای رمز اصلی حساب

### 5. تست اتصال

پس از تنظیم متغیرها، سیستم ایمیل به صورت خودکار از Zoho SMTP استفاده خواهد کرد. برای تست:

1. فرم تماس با ما را پر کنید
2. بررسی کنید که ایمیل به info@momtazchem.com رسیده است
3. لاگ‌های سرور را برای خطاهای احتمالی بررسی کنید

### 6. رفع مشکلات رایج

**خطای احراز هویت:**
- مطمئن شوید از App Password استفاده می‌کنید، نه رمز اصلی
- بررسی کنید که Two-Factor Authentication فعال باشد

**خطای اتصال:**
- Port 587 را بررسی کنید
- مطمئن شوید که smtp.zoho.com در دسترس است

**خطای ارسال:**
- بررسی کنید که ایمیل فرستنده معتبر باشد
- محدودیت‌های ارسال روزانه Zoho را بررسی کنید

## نکات مهم

- کد SMTP فعلی در `server/email.ts` برای Zoho Mail طراحی شده است
- تمام ایمیل‌های فرم تماس به info@momtazchem.com ارسال می‌شوند
- استعلامات محصولات نیز به صورت CC به این ایمیل ارسال می‌شوند
- سیستم از TLS/STARTTLS برای امنیت استفاده می‌کند
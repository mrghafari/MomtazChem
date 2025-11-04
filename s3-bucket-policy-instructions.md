# راهنمای تنظیم Amazon S3 Bucket Policy

## مشکل فعلی
فایل‌های شما در Amazon S3 با خطای 403 Forbidden قابل دسترسی نیستند زیرا bucket policy تنظیم نشده است.

## راه حل

برای دسترسی عمومی به فایل‌های S3، باید یکی از دو کار زیر را انجام دهید:

### گزینه 1: تنظیم Bucket Policy (توصیه می‌شود)

1. به AWS Console بروید
2. به S3 → Buckets → momtazchem بروید
3. به تب **Permissions** بروید
4. در بخش **Bucket Policy** روی **Edit** کلیک کنید
5. این policy را اضافه کنید:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::momtazchem/*"
    }
  ]
}
```

6. روی **Save changes** کلیک کنید

### گزینه 2: غیرفعال کردن Block Public Access (برای فایل‌های عمومی)

اگر می‌خواهید از ACL استفاده کنید:

1. به S3 → Buckets → momtazchem بروید
2. به تب **Permissions** بروید
3. در بخش **Block Public Access** روی **Edit** کلیک کنید
4. گزینه **Block all public access** را غیرفعال کنید
5. تایید کنید و تغییرات را ذخیره کنید

**توجه:** گزینه 1 (Bucket Policy) امن‌تر است چون کنترل بیشتری روی دسترسی‌ها دارید.

## تست کردن

بعد از تنظیم policy، این URL را در مرورگر تست کنید:
```
https://momtazchem.s3.eu-central-1.amazonaws.com/images/[FILENAME]
```

اگر فایل نمایش داده شد، تنظیمات درست است ✅

## نکات امنیتی

- فقط فایل‌های عمومی (تصاویر محصولات، کاتالوگ‌ها، MSDS) را با این policy در دسترس قرار دهید
- حواله‌های بانکی (receipts) نباید عمومی باشند - از presigned URLs استفاده کنید
- سرور شما به صورت خودکار فایل‌ها را proxy می‌کند پس نیازی به دسترسی مستقیم نیست

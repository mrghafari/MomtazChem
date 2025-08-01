# کنترل‌های امنیتی کیف پول - Wallet Security Controls

## اصول امنیتی

### 1. اصل شناسایی دقیق (Precise Identification)
- همیشه قبل از هر تراکنش، customer_id را دوبار بررسی کنید
- هرگز از wallet_id به تنهایی برای تراکنش استفاده نکنید
- همیشه customer_id و order_id را با هم تطبیق دهید

### 2. اصل تأیید چهارگانه (Quadruple Verification)
قبل از هر تراکنش کیف پول:
```sql
-- ✅ تأیید صحیح
SELECT 
    cw.id as wallet_id,
    cw.customer_id,
    co.customer_id as order_customer_id,
    co.order_number
FROM customer_wallets cw
JOIN customer_orders co ON cw.customer_id = co.customer_id
WHERE co.id = [ORDER_ID] AND cw.customer_id = [CUSTOMER_ID]
-- باید همه customer_id ها یکسان باشند
```

### 3. اصل تراکنش اتمی (Atomic Transactions)
```sql
BEGIN;
-- بررسی مالکیت
-- انجام تراکنش  
-- بروزرسانی موجودی
-- ثبت لاگ
COMMIT;
```

## الگوهای خطرناک که باید اجتناب شود

### ❌ خطرناک - استفاده از wallet_id بدون تأیید
```sql
UPDATE customer_wallets SET balance = balance + amount WHERE id = wallet_id;
```

### ❌ خطرناک - کپی مستقیم از یک حساب به حساب دیگر
```sql
INSERT INTO wallet_transactions (...) VALUES (other_customer_wallet_id, ...);
```

### ❌ خطرناک - استفاده از متغیرهای global
```sql
SET @customer_id = 123;
-- استفاده در جاهای مختلف بدون تأیید مجدد
```

## الگوهای امن

### ✅ امن - تراکنش با تأیید کامل
```sql
WITH verified_customer AS (
    SELECT cw.id as wallet_id, cw.customer_id, cw.balance
    FROM customer_wallets cw
    JOIN customer_orders co ON cw.customer_id = co.customer_id  
    WHERE co.id = [ORDER_ID] 
      AND cw.customer_id = [EXPECTED_CUSTOMER_ID]
)
INSERT INTO wallet_transactions (
    wallet_id, customer_id, transaction_type, amount,
    balance_before, balance_after, description, reference_id
)
SELECT 
    vc.wallet_id, vc.customer_id, 'credit', [AMOUNT],
    vc.balance, vc.balance + [AMOUNT],
    'توضیحات دقیق', [ORDER_ID]
FROM verified_customer vc;
```

## چک‌لیست امنیتی قبل از هر تراکنش

- [ ] customer_id سفارش با customer_id کیف پول تطبیق دارد؟
- [ ] order_id معتبر است و متعلق به همین مشتری است؟  
- [ ] مبلغ تراکنش منطقی و در محدوده مجاز است؟
- [ ] توضیحات تراکنش شامل شماره سفارش است؟
- [ ] موجودی کیف پول بعد از تراکنش منفی نمی‌شود؟
- [ ] reference_id به درستی تنظیم شده است؟

## قوانین سخت

1. **هرگز** بدون تأیید customer_id تراکنش انجام ندهید
2. **همیشه** از JOIN برای اطمینان از تطبیق customer_id استفاده کنید  
3. **هیچگاه** wallet_id را hard-code نکنید
4. **حتماً** موجودی را قبل و بعد از تراکنش ثبت کنید
5. **لازماً** هر تراکنش را با order_id مرتبط کنید

## تست‌های امنیتی

```sql
-- تست 1: تطبیق customer_id
SELECT COUNT(*) FROM (
    SELECT DISTINCT customer_id FROM wallet_transactions WHERE reference_id = [ORDER_ID]
    UNION
    SELECT customer_id FROM customer_orders WHERE id = [ORDER_ID]
) - باید 1 باشد

-- تست 2: تراز موجودی
SELECT 
    (SELECT balance FROM customer_wallets WHERE customer_id = [CUSTOMER_ID]) -
    (SELECT SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END) 
     FROM wallet_transactions WHERE customer_id = [CUSTOMER_ID])
-- باید 0 باشد (موجودی شروع)
```

## گزارش‌دهی مشکوک

هر تراکنش که این شرایط را داشته باشد مشکوک است:
- تراکنش بدون reference_id
- مبلغ غیرعادی (بیش از 10 میلیون دینار)
- customer_id متفاوت در همان reference_id
- تغییر موجودی بدون تراکنش متناظر
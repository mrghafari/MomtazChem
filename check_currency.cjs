// بررسی واحد پولی محصولات در فروشگاه
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/shop/products',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      const testProduct = products.find(p => p.name && p.name.includes('محصول تست همگام‌سازی خودکار'));
      
      if (testProduct) {
        console.log('✅ محصول تست یافت شد:');
        console.log('نام:', testProduct.name);
        console.log('قیمت:', testProduct.price);
        console.log('واحد پولی در فروشگاه:', testProduct.priceUnit);
        console.log('آیدی محصول:', testProduct.id);
        
        // بررسی وضعیت قبل و بعد از اصلاح
        if (testProduct.priceUnit === 'IQD') {
          console.log('✅ واحد پولی صحیح است: IQD');
        } else {
          console.log('❌ واحد پولی نادرست:', testProduct.priceUnit, '(باید IQD باشد)');
        }
      } else {
        console.log('❌ محصول تست یافت نشد');
        console.log('تعداد کل محصولات در فروشگاه:', products.length);
        
        // نمایش چند محصول نمونه برای بررسی
        products.slice(0, 2).forEach((p, i) => {
          console.log(`محصول ${i + 1}: نام=${p.name}, واحد پولی=${p.priceUnit}`);
        });
      }
    } catch (error) {
      console.error('خطا در پارس کردن JSON:', error);
    }
  });
});

req.on('error', (error) => {
  console.error('خطا در درخواست:', error);
});

req.end();
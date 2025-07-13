// بررسی کامل همگام‌سازی تمام فیلدها
const http = require('http');

// درخواست برای محصول از کاردکس
function getKardexProduct() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/products/24',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// درخواست برای محصول از فروشگاه
function getShopProduct() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/shop/products',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const products = JSON.parse(data);
          const testProduct = products.find(p => p.name && p.name.includes('محصول تست همگام‌سازی خودکار'));
          resolve(testProduct);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function compareProducts() {
  try {
    console.log('🔍 بررسی همگام‌سازی کامل...\n');
    
    const kardex = await getKardexProduct();
    const shop = await getShopProduct();
    
    if (!kardex || !shop) {
      console.log('❌ محصول یافت نشد');
      return;
    }
    
    console.log('📋 مقایسه فیلدها:');
    console.log('─'.repeat(50));
    
    // مقایسه فیلدهای اصلی
    const fields = [
      { name: 'نام محصول', kardex: kardex.name, shop: shop.name },
      { name: 'قیمت', kardex: kardex.unitPrice?.toString(), shop: shop.price },
      { name: 'واحد پولی', kardex: kardex.currency || 'IQD', shop: shop.priceUnit },
      { name: 'موجودی', kardex: kardex.stockQuantity, shop: shop.stockQuantity },
      { name: 'دسته‌بندی', kardex: kardex.category, shop: shop.category },
      { name: 'وضعیت فعال', kardex: kardex.isActive, shop: shop.isActive },
      { name: 'نمایش کاتالوگ', kardex: kardex.showCatalogToCustomers, shop: shop.showCatalogToCustomers },
      { name: 'نمایش MSDS', kardex: kardex.showMsdsToCustomers, shop: shop.showMsdsToCustomers },
      { name: 'URL کاتالوگ', kardex: kardex.pdfCatalogUrl, shop: shop.pdfCatalogUrl },
      { name: 'URL MSDS', kardex: kardex.msdsUrl, shop: shop.msdsUrl },
      { name: 'تصویر', kardex: kardex.imageUrl, shop: shop.thumbnailUrl }
    ];
    
    let syncIssues = 0;
    
    fields.forEach(field => {
      const isMatch = field.kardex === field.shop;
      const status = isMatch ? '✅' : '❌';
      
      if (!isMatch) syncIssues++;
      
      console.log(`${status} ${field.name}:`);
      console.log(`   کاردکس: ${field.kardex}`);
      console.log(`   فروشگاه: ${field.shop}`);
      console.log('');
    });
    
    console.log('─'.repeat(50));
    if (syncIssues === 0) {
      console.log('✅ همگام‌سازی کامل است!');
    } else {
      console.log(`❌ ${syncIssues} مشکل همگام‌سازی یافت شد`);
    }
    
  } catch (error) {
    console.error('خطا در بررسی:', error);
  }
}

compareProducts();
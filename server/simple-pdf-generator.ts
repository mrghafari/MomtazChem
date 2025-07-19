// PDF Generator with Arabic/Persian Support using Puppeteer
// Enhanced version for proper multilingual text rendering

import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

// Generate HTML content with Arabic/Persian font support for invoices
function generateHTMLContent(customerData: any, orderData: any, batchData: any[], title: string): string {
  const batchRows = batchData?.map(batch => `
    <tr>
      <td>${batch.batchNumber || 'نامشخص'}</td>
      <td>${batch.barcode || 'نامشخص'}</td>
      <td>${batch.quantitySold || 0}</td>
      <td>${batch.wasteAmount || 0} (${batch.quantitySold ? ((parseFloat(batch.wasteAmount || 0) / batch.quantitySold) * 100).toFixed(2) : 0}%)</td>
      <td>${batch.effectiveQuantity || 0}</td>
      <td>${batch.unitPrice || 0} دینار</td>
      <td>${batch.totalPrice || 0} دینار</td>
    </tr>
  `).join('') || '<tr><td colspan="7">اطلاعات بچی موجود نیست</td></tr>';

  return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاکتور - ${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Noto Sans Arabic', 'Tahoma', 'Arial Unicode MS', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      direction: rtl;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    
    .invoice-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .section {
      margin-bottom: 25px;
      padding: 15px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 8px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    
    .info-label {
      font-weight: bold;
      width: 120px;
      color: #374151;
    }
    
    .info-value {
      flex: 1;
      color: #1f2937;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 14px;
    }
    
    th, td {
      border: 1px solid #d1d5db;
      padding: 8px;
      text-align: center;
    }
    
    th {
      background-color: #f3f4f6;
      font-weight: bold;
      color: #1f2937;
    }
    
    .total-section {
      background-color: #f8fafc;
      border: 2px solid #2563eb;
    }
    
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #d1d5db;
      color: #6b7280;
      font-size: 12px;
    }
    
    @media print {
      body { padding: 10px; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">شرکت ممتاز برای مواد شیمیایی</div>
    <div class="invoice-title">فاکتور - ${title}</div>
    <div>تاریخ صدور: ${new Date().toLocaleDateString('fa-IR')}</div>
  </div>

  <div class="section">
    <div class="section-title">اطلاعات شرکت</div>
    <div class="info-row">
      <span class="info-label">نام شرکت:</span>
      <span class="info-value">شرکت ممتاز برای مواد شیمیایی</span>
    </div>
    <div class="info-row">
      <span class="info-label">موقعیت:</span>
      <span class="info-value">عراق - بغداد</span>
    </div>
    <div class="info-row">
      <span class="info-label">تلفن:</span>
      <span class="info-value">+964 770 999 6771</span>
    </div>
    <div class="info-row">
      <span class="info-label">ایمیل:</span>
      <span class="info-value">info@momtazchem.com</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">اطلاعات مشتری</div>
    <div class="info-row">
      <span class="info-label">نام:</span>
      <span class="info-value">${customerData.name || 'نامشخص'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">ایمیل:</span>
      <span class="info-value">${customerData.email || 'نامشخص'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">تلفن:</span>
      <span class="info-value">${customerData.phone || 'نامشخص'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">آدرس:</span>
      <span class="info-value">${customerData.address || 'نامشخص'}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">جزئیات فاکتور</div>
    <div class="info-row">
      <span class="info-label">شماره فاکتور:</span>
      <span class="info-value">${orderData.invoiceNumber || orderData.id}</span>
    </div>
    <div class="info-row">
      <span class="info-label">شماره سفارش:</span>
      <span class="info-value">${orderData.orderNumber || orderData.id}</span>
    </div>
    <div class="info-row">
      <span class="info-label">تاریخ سفارش:</span>
      <span class="info-value">${orderData.createdAt ? new Date(orderData.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">وضعیت:</span>
      <span class="info-value">${orderData.status || 'نامشخص'}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">اطلاعات بچ‌ها</div>
    <table>
      <thead>
        <tr>
          <th>شماره بچ</th>
          <th>بارکد</th>
          <th>مقدار فروخته شده</th>
          <th>ضایعات</th>
          <th>مقدار موثر</th>
          <th>قیمت واحد</th>
          <th>قیمت کل</th>
        </tr>
      </thead>
      <tbody>
        ${batchRows}
      </tbody>
    </table>
  </div>

  <div class="section total-section">
    <div class="section-title">اطلاعات پرداخت</div>
    <div class="info-row">
      <span class="info-label">روش پرداخت:</span>
      <span class="info-value">${orderData.paymentMethod || 'نامشخص'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">وضعیت پرداخت:</span>
      <span class="info-value">${orderData.paymentStatus || 'نامشخص'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">مبلغ کل:</span>
      <span class="info-value">${orderData.totalAmount || 'نامشخص'} دینار عراقی</span>
    </div>
  </div>

  <div class="footer">
    <p>این فاکتور به صورت الکترونیکی تولید شده است</p>
    <p>تاریخ تولید: ${new Date().toLocaleString('fa-IR')}</p>
  </div>
</body>
</html>`;
}

// Generate invoice PDF with batch information using Puppeteer
export async function generateInvoicePDFWithBatch(
  customerData: any,
  orderData: any,
  batchData: any[],
  title: string
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const htmlContent = generateHTMLContent(customerData, orderData, batchData, title);
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// Generate Customer PDF Report with Arabic/Persian support
export async function generateCustomerPDFHTML(customerData: any, orders: any[], activities: any[], title: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    const orderRows = orders?.map(order => `
      <tr>
        <td>${order.id || 'نامشخص'}</td>
        <td>${order.totalAmount || 0} دینار</td>
        <td>${order.status || 'نامشخص'}</td>
        <td>${order.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}</td>
      </tr>
    `).join('') || '<tr><td colspan="4">سفارشی ثبت نشده است</td></tr>';

    const activityRows = activities?.slice(0, 10).map(activity => `
      <tr>
        <td>${activity.activityType || 'نامشخص'}</td>
        <td>${activity.description || 'توضیحی ثبت نشده'}</td>
        <td>${activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}</td>
      </tr>
    `).join('') || '<tr><td colspan="3">فعالیتی ثبت نشده است</td></tr>';

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>گزارش مشتری - ${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Noto Sans Arabic', 'Tahoma', 'Arial Unicode MS', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      direction: rtl;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    
    .report-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .section {
      margin-bottom: 25px;
      padding: 15px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 8px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    
    .info-label {
      font-weight: bold;
      width: 120px;
      color: #374151;
    }
    
    .info-value {
      flex: 1;
      color: #1f2937;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 14px;
    }
    
    th, td {
      border: 1px solid #d1d5db;
      padding: 8px;
      text-align: center;
    }
    
    th {
      background-color: #f3f4f6;
      font-weight: bold;
      color: #1f2937;
    }
    
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #d1d5db;
      color: #6b7280;
      font-size: 12px;
    }
    
    @media print {
      body { padding: 10px; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">شرکت ممتاز برای مواد شیمیایی</div>
    <div class="report-title">گزارش مشتری - ${title}</div>
    <div>تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}</div>
  </div>

  <div class="section">
    <div class="section-title">اطلاعات مشتری</div>
    <div class="info-row">
      <span class="info-label">نام:</span>
      <span class="info-value">${customerData.name || 'نامشخص'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">ایمیل:</span>
      <span class="info-value">${customerData.email || 'نامشخص'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">تلفن:</span>
      <span class="info-value">${customerData.phone || 'نامشخص'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">آدرس:</span>
      <span class="info-value">${customerData.address || 'نامشخص'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">تاریخ عضویت:</span>
      <span class="info-value">${customerData.createdAt ? new Date(customerData.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">وضعیت:</span>
      <span class="info-value">${customerData.customerStatus || 'فعال'}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">سفارشات مشتری</div>
    <table>
      <thead>
        <tr>
          <th>شماره سفارش</th>
          <th>مبلغ کل</th>
          <th>وضعیت</th>
          <th>تاریخ</th>
        </tr>
      </thead>
      <tbody>
        ${orderRows}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">فعالیت‌های اخیر</div>
    <table>
      <thead>
        <tr>
          <th>نوع فعالیت</th>
          <th>توضیحات</th>
          <th>تاریخ</th>
        </tr>
      </thead>
      <tbody>
        ${activityRows}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>این گزارش به صورت الکترونیکی تولید شده است</p>
    <p>تاریخ تولید: ${new Date().toLocaleString('fa-IR')}</p>
  </div>
</body>
</html>`;
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// Generate Analytics PDF Report with Arabic/Persian support
export async function generateAnalyticsPDFHTML(analyticsData: any, title: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>گزارش آمارها - ${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Noto Sans Arabic', 'Tahoma', 'Arial Unicode MS', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      direction: rtl;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    
    .report-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .section {
      margin-bottom: 25px;
      padding: 15px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 8px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 15px 0;
    }
    
    .stat-card {
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
      text-align: center;
    }
    
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    
    .stat-label {
      font-size: 14px;
      color: #6b7280;
      margin-top: 5px;
    }
    
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #d1d5db;
      color: #6b7280;
      font-size: 12px;
    }
    
    @media print {
      body { padding: 10px; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">شرکت ممتاز برای مواد شیمیایی</div>
    <div class="report-title">گزارش آمارها - ${title}</div>
    <div>تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}</div>
  </div>

  <div class="section">
    <div class="section-title">آمار کلی سیستم</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${analyticsData.totalCustomers || 0}</div>
        <div class="stat-label">تعداد کل مشتریان</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${analyticsData.activeCustomers || 0}</div>
        <div class="stat-label">مشتریان فعال</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${analyticsData.newThisMonth || 0}</div>
        <div class="stat-label">مشتریان جدید این ماه</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${analyticsData.totalOrders || 0}</div>
        <div class="stat-label">تعداد کل سفارشات</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">عملکرد ماهانه</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${analyticsData.monthlyRevenue || 0}</div>
        <div class="stat-label">درآمد ماهانه (دینار)</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${analyticsData.monthlyOrders || 0}</div>
        <div class="stat-label">سفارشات ماهانه</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${analyticsData.averageOrderValue || 0}</div>
        <div class="stat-label">میانگین ارزش سفارش (دینار)</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${analyticsData.conversionRate || 0}%</div>
        <div class="stat-label">نرخ تبدیل</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">خلاصه تحلیل</div>
    <p>این گزارش شامل آمار جامع سیستم مدیریت مشتریان و فروش شرکت ممتاز برای مواد شیمیایی می‌باشد.</p>
    <p>داده‌های ارائه شده بر اساس آخرین اطلاعات موجود در سیستم محاسبه شده است.</p>
    <p>برای اطلاعات بیشتر با واحد فنی تماس بگیرید.</p>
  </div>

  <div class="footer">
    <p>این گزارش به صورت الکترونیکی تولید شده است</p>
    <p>تاریخ تولید: ${new Date().toLocaleString('fa-IR')}</p>
  </div>
</body>
</html>`;
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// Simple text cleaning function for legacy compatibility  
function cleanTextForPdf(text: string): string {
  return text
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters for basic PDF compatibility
    .substring(0, 80); // Limit line length
}
// Simple PDF Generator - HTML Response for Browser Print to PDF
// This approach generates HTML that browsers can print to PDF natively

// Generate customer report as printable HTML
export async function generateCustomerPDFHTML(
  customerData: any,
  orders: any[],
  activities: any[],
  title: string
): Promise<Buffer> {
  try {
    const orderRows = orders?.slice(0, 10).map((order, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${order.id || 'نامشخص'}</td>
        <td>${order.totalAmount || 0} دینار</td>
        <td>${order.status || 'نامشخص'}</td>
        <td>${order.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}</td>
      </tr>
    `).join('') || '<tr><td colspan="5">سفارشی ثبت نشده است</td></tr>';

    const activityRows = activities?.slice(0, 10).map((activity, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${activity.activityType || 'نامشخص'}</td>
        <td>${activity.description || 'توضیحی ثبت نشده'}</td>
        <td>${activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}</td>
      </tr>
    `).join('') || '<tr><td colspan="4">فعالیتی ثبت نشده است</td></tr>';

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
      font-size: 14px;
    }
    
    @media print {
      body {
        padding: 0;
        font-size: 12px;
      }
      .no-print {
        display: none;
      }
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
      margin-bottom: 5px;
    }
    
    .company-name-en {
      font-size: 18px;
      color: #666;
      direction: ltr;
      margin-bottom: 10px;
    }
    
    .report-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .report-date {
      font-size: 12px;
      color: #666;
    }
    
    .section {
      margin-bottom: 25px;
      padding: 15px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-weight: bold;
      color: #374151;
      margin-bottom: 5px;
    }
    
    .info-value {
      color: #6b7280;
      padding: 8px;
      background: #f9fafb;
      border-radius: 4px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      font-size: 12px;
    }
    
    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px;
      text-align: center;
    }
    
    th {
      background: #f3f4f6;
      font-weight: bold;
      color: #374151;
    }
    
    tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    
    .contact-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 15px;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      left: 20px;
      background: #2563eb;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      z-index: 1000;
    }
    
    .print-button:hover {
      background: #1d4ed8;
    }
  </style>
  <script>
    function printPage() {
      window.print();
    }
    
    window.onload = function() {
      // Auto-trigger print dialog for PDF generation
      setTimeout(function() {
        window.print();
      }, 1000);
    }
  </script>
</head>
<body>
  <button class="print-button no-print" onclick="printPage()">چاپ / Print to PDF</button>
  
  <div class="header">
    <div class="company-name">شرکت ممتاز برای مواد شیمیایی</div>
    <div class="company-name-en">Momtaz Chemical Solutions Company</div>
    <div class="report-title">گزارش مشتری - ${title}</div>
    <div class="report-date">تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')} | Generated: ${new Date().toLocaleDateString('en-US')}</div>
  </div>

  <div class="section">
    <div class="section-title">اطلاعات مشتری - Customer Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">نام / Name</div>
        <div class="info-value">${customerData.name || 'نامشخص / Unknown'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">ایمیل / Email</div>
        <div class="info-value">${customerData.email || 'نامشخص / Unknown'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">تلفن / Phone</div>
        <div class="info-value">${customerData.phone || 'نامشخص / Unknown'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">وضعیت / Status</div>
        <div class="info-value">${customerData.customerStatus || 'فعال / Active'}</div>
      </div>
    </div>
    <div class="info-item">
      <div class="info-label">آدرس / Address</div>
      <div class="info-value">${customerData.address || 'نامشخص / Unknown'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">سفارشات اخیر - Recent Orders</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>شماره سفارش / Order ID</th>
          <th>مبلغ / Amount (IQD)</th>
          <th>وضعیت / Status</th>
          <th>تاریخ / Date</th>
        </tr>
      </thead>
      <tbody>
        ${orderRows}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">فعالیت‌های اخیر - Recent Activities</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>نوع فعالیت / Activity Type</th>
          <th>توضیحات / Description</th>
          <th>تاریخ / Date</th>
        </tr>
      </thead>
      <tbody>
        ${activityRows}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div class="contact-info">
      <div>تلفن: +964 770 999 6771 | Phone: +964 770 999 6771</div>
      <div>ایمیل: info@momtazchem.com | Email: info@momtazchem.com</div>
      <div>وب‌سایت: www.momtazchem.com | Website: www.momtazchem.com</div>
      <div>آدرس: عراق - بغداد | Address: Iraq - Baghdad</div>
    </div>
    <div style="margin-top: 20px;">
      <div>این گزارش به صورت الکترونیکی تولید شده است</div>
      <div>This report was generated electronically</div>
      <div style="margin-top: 10px;">© ${new Date().getFullYear()} شرکت ممتاز برای مواد شیمیایی</div>
    </div>
  </div>
</body>
</html>
`;

    return Buffer.from(htmlContent, 'utf-8');
    
  } catch (error) {
    console.error('Error generating customer HTML:', error);
    throw new Error('Failed to generate customer report');
  }
}

// Generate analytics report as printable HTML
export async function generateAnalyticsPDFHTML(
  analyticsData: any,
  title: string
): Promise<Buffer> {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>گزارش آمارها - Analytics Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
    
    body {
      font-family: 'Noto Sans Arabic', 'Tahoma', 'Arial Unicode MS', sans-serif;
      direction: rtl;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
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
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    
    .stat-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
    }
    
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      left: 20px;
      background: #2563eb;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      z-index: 1000;
    }
  </style>
  <script>
    function printPage() {
      window.print();
    }
    
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 1000);
    }
  </script>
</head>
<body>
  <button class="print-button no-print" onclick="printPage()">چاپ / Print to PDF</button>
  
  <div class="header">
    <div class="company-name">گزارش آمارها - Analytics Report</div>
    <div style="font-size: 16px; color: #666; margin-top: 10px;">
      شرکت ممتاز برای مواد شیمیایی - Momtaz Chemical Solutions
    </div>
    <div style="font-size: 14px; color: #666; margin-top: 10px;">
      تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')} | Generated: ${new Date().toLocaleDateString('en-US')}
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${analyticsData.totalCustomers || 0}</div>
      <div class="stat-label">تعداد کل مشتریان<br>Total Customers</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${analyticsData.activeCustomers || 0}</div>
      <div class="stat-label">مشتریان فعال<br>Active Customers</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${analyticsData.totalOrders || 0}</div>
      <div class="stat-label">تعداد کل سفارشات<br>Total Orders</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${analyticsData.monthlyRevenue || 0}</div>
      <div class="stat-label">درآمد ماهانه (دینار)<br>Monthly Revenue (IQD)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${analyticsData.newThisMonth || 0}</div>
      <div class="stat-label">مشتریان جدید این ماه<br>New Customers This Month</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${analyticsData.averageOrderValue || 0}</div>
      <div class="stat-label">میانگین ارزش سفارش<br>Average Order Value (IQD)</div>
    </div>
  </div>

  <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
    <div>© ${new Date().getFullYear()} شرکت ممتاز برای مواد شیمیایی</div>
    <div>Momtaz Chemical Solutions Company</div>
    <div style="margin-top: 10px;">
      تلفن: +964 770 999 6771 | ایمیل: info@momtazchem.com | وب‌سایت: www.momtazchem.com
    </div>
  </div>
</body>
</html>
`;

    return Buffer.from(htmlContent, 'utf-8');
    
  } catch (error) {
    console.error('Error generating analytics HTML:', error);
    throw new Error('Failed to generate analytics report');
  }
}

// Generate invoice as printable HTML
export async function generateInvoicePDFWithBatch(
  customerData: any,
  orderData: any,
  batchData: any[],
  title: string
): Promise<Buffer> {
  try {
    const batchRows = batchData?.map((batch, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${batch.batchNumber || 'نامشخص'}</td>
        <td>${batch.barcode || 'نامشخص'}</td>
        <td>${batch.quantitySold || 0}</td>
        <td>${batch.wasteAmount || 0}</td>
        <td>${batch.effectiveQuantity || 0}</td>
        <td>${batch.unitPrice || 0}</td>
        <td>${batch.totalPrice || 0}</td>
      </tr>
    `).join('') || '<tr><td colspan="8">اطلاعات بچی موجود نیست</td></tr>';

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <title>فاکتور - ${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
    
    body {
      font-family: 'Noto Sans Arabic', 'Tahoma', 'Arial Unicode MS', sans-serif;
      direction: rtl;
      padding: 20px;
      line-height: 1.6;
    }
    
    @media print {
      .no-print { display: none; }
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 12px;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: center;
    }
    
    th {
      background: #f3f4f6;
      font-weight: bold;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      left: 20px;
      background: #2563eb;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      z-index: 1000;
    }
  </style>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 1000);
    }
  </script>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">چاپ / Print</button>
  
  <div class="header">
    <h1>فاکتور - Invoice</h1>
    <div>${title}</div>
    <div style="font-size: 14px; margin-top: 10px;">
      تاریخ صدور: ${new Date().toLocaleDateString('fa-IR')}
    </div>
  </div>

  <div style="margin: 20px 0;">
    <h3>اطلاعات مشتری - Customer Information</h3>
    <p><strong>نام:</strong> ${customerData.name || 'نامشخص'}</p>
    <p><strong>ایمیل:</strong> ${customerData.email || 'نامشخص'}</p>
    <p><strong>تلفن:</strong> ${customerData.phone || 'نامشخص'}</p>
  </div>

  <div style="margin: 20px 0;">
    <h3>اطلاعات بچ محصولات - Product Batch Information</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
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

  <div style="margin-top: 40px; text-align: center; font-size: 12px;">
    <div>© ${new Date().getFullYear()} شرکت ممتاز برای مواد شیمیایی</div>
  </div>
</body>
</html>
`;

    return Buffer.from(htmlContent, 'utf-8');
    
  } catch (error) {
    console.error('Error generating invoice HTML:', error);
    throw new Error('Failed to generate invoice report');
  }
}
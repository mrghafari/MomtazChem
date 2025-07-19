// Ultra-Simple PDF Generator - Clean HTML Response for Browser Print to PDF
// This approach generates simple, error-free HTML that browsers can reliably print to PDF

export async function generateCustomerPDFHTML(
  customerData: any,
  orders: any[],
  activities: any[],
  title: string
): Promise<Buffer> {
  try {
    // Safely process orders with null checks
    const safeOrders = Array.isArray(orders) ? orders.slice(0, 10) : [];
    const orderRows = safeOrders.length > 0 
      ? safeOrders.map((order, index) => {
          const orderId = order?.id || order?.customer_order_id || 'نامشخص';
          const amount = order?.totalAmount || order?.total_amount || 0;
          const status = order?.status || 'نامشخص';
          const date = order?.createdAt || order?.created_at || order?.orderDate;
          const formattedDate = date ? new Date(date).toLocaleDateString('fa-IR') : 'نامشخص';
          
          return `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${orderId}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${amount} دینار</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${status}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formattedDate}</td>
            </tr>
          `;
        }).join('')
      : '<tr><td colspan="5" style="border: 1px solid #ddd; padding: 8px; text-align: center;">سفارشی ثبت نشده است</td></tr>';

    // Safely process activities with null checks
    const safeActivities = Array.isArray(activities) ? activities.slice(0, 10) : [];
    const activityRows = safeActivities.length > 0
      ? safeActivities.map((activity, index) => {
          const type = activity?.activityType || activity?.activity_type || 'نامشخص';
          const desc = activity?.description || 'توضیحی ثبت نشده';
          const date = activity?.createdAt || activity?.created_at;
          const formattedDate = date ? new Date(date).toLocaleDateString('fa-IR') : 'نامشخص';
          
          return `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${type}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${desc}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formattedDate}</td>
            </tr>
          `;
        }).join('')
      : '<tr><td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: center;">فعالیتی ثبت نشده است</td></tr>';

    // Clean customer data with null checks
    const customerName = customerData?.name || customerData?.customer_name || 'نامشخص';
    const customerEmail = customerData?.email || 'نامشخص';
    const customerPhone = customerData?.phone || 'نامشخص';
    const customerStatus = customerData?.customerStatus || customerData?.customer_status || 'فعال';
    const customerAddress = customerData?.address || 'نامشخص';

    const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>گزارش مشتری - ${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
    
    body {
      font-family: 'Noto Sans Arabic', 'Tahoma', 'Arial Unicode MS', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      direction: rtl;
      padding: 20px;
      font-size: 14px;
      margin: 0;
    }
    
    @media print {
      body { padding: 10px; font-size: 12px; }
      .no-print { display: none; }
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
    
    th {
      border: 1px solid #e5e7eb;
      padding: 8px;
      text-align: center;
      background: #f3f4f6;
      font-weight: bold;
      color: #374151;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #666;
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
        <div class="info-value">${customerName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">ایمیل / Email</div>
        <div class="info-value">${customerEmail}</div>
      </div>
      <div class="info-item">
        <div class="info-label">تلفن / Phone</div>
        <div class="info-value">${customerPhone}</div>
      </div>
      <div class="info-item">
        <div class="info-label">وضعیت / Status</div>
        <div class="info-value">${customerStatus}</div>
      </div>
    </div>
    <div class="info-item">
      <div class="info-label">آدرس / Address</div>
      <div class="info-value">${customerAddress}</div>
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
    <div>تلفن: +964 770 999 6771 | Phone: +964 770 999 6771</div>
    <div>ایمیل: info@momtazchem.com | Email: info@momtazchem.com</div>
    <div>وب‌سایت: www.momtazchem.com | Website: www.momtazchem.com</div>
    <div>آدرس: عراق - بغداد | Address: Iraq - Baghdad</div>
    <div style="margin-top: 20px;">
      <div>این گزارش به صورت الکترونیکی تولید شده است</div>
      <div>This report was generated electronically</div>
      <div style="margin-top: 10px;">© ${new Date().getFullYear()} شرکت ممتاز برای مواد شیمیایی</div>
    </div>
  </div>
</body>
</html>`;

    return Buffer.from(htmlContent, 'utf-8');
    
  } catch (error) {
    console.error('Error generating customer HTML:', error);
    
    // Fallback simple HTML if main generation fails
    const fallbackHtml = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <title>گزارش مشتری</title>
  <style>
    body { font-family: Tahoma, Arial; direction: rtl; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid #ccc; }
  </style>
</head>
<body>
  <div class="header">
    <h1>شرکت ممتاز برای مواد شیمیایی</h1>
    <h2>گزارش مشتری - ${title}</h2>
    <p>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
  </div>
  <div class="section">
    <h3>اطلاعات مشتری</h3>
    <p>نام: ${customerData?.name || 'نامشخص'}</p>
    <p>ایمیل: ${customerData?.email || 'نامشخص'}</p>
    <p>تلفن: ${customerData?.phone || 'نامشخص'}</p>
  </div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 500); }
  </script>
</body>
</html>`;
    
    return Buffer.from(fallbackHtml, 'utf-8');
  }
}

export async function generateAnalyticsPDFHTML(
  analyticsData: any,
  title: string
): Promise<Buffer> {
  try {
    const htmlContent = `<!DOCTYPE html>
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
      margin: 0;
    }
    
    @media print {
      body { padding: 10px; }
      .no-print { display: none; }
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
    function printPage() { window.print(); }
    window.onload = function() { setTimeout(function() { window.print(); }, 1000); }
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
      <div class="stat-value">${analyticsData?.totalCustomers || 0}</div>
      <div class="stat-label">تعداد کل مشتریان<br>Total Customers</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${analyticsData?.activeCustomers || 0}</div>
      <div class="stat-label">مشتریان فعال<br>Active Customers</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${analyticsData?.totalOrders || 0}</div>
      <div class="stat-label">تعداد کل سفارشات<br>Total Orders</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${analyticsData?.monthlyRevenue || 0}</div>
      <div class="stat-label">درآمد ماهانه (دینار)<br>Monthly Revenue (IQD)</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${analyticsData?.newThisMonth || 0}</div>
      <div class="stat-label">مشتریان جدید این ماه<br>New Customers This Month</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${analyticsData?.averageOrderValue || 0}</div>
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
</html>`;

    return Buffer.from(htmlContent, 'utf-8');
    
  } catch (error) {
    console.error('Error generating analytics HTML:', error);
    
    // Fallback simple HTML
    const fallbackHtml = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <title>گزارش آمارها</title>
  <style>
    body { font-family: Tahoma, Arial; direction: rtl; padding: 20px; }
  </style>
</head>
<body>
  <h1>گزارش آمارها</h1>
  <p>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 500); }
  </script>
</body>
</html>`;
    
    return Buffer.from(fallbackHtml, 'utf-8');
  }
}

export async function generateInvoicePDFWithBatch(
  customerData: any,
  orderData: any,
  batchData: any[],
  title: string
): Promise<Buffer> {
  try {
    const safeBatchData = Array.isArray(batchData) ? batchData : [];
    const batchRows = safeBatchData.length > 0
      ? safeBatchData.map((batch, index) => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${batch?.batchNumber || 'نامشخص'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${batch?.barcode || 'نامشخص'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${batch?.quantitySold || 0}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${batch?.wasteAmount || 0}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${batch?.effectiveQuantity || 0}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${batch?.unitPrice || 0}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${batch?.totalPrice || 0}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="8" style="border: 1px solid #ddd; padding: 8px; text-align: center;">اطلاعات بچی موجود نیست</td></tr>';

    const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <title>فاکتور - ${title}</title>
  <style>
    body {
      font-family: 'Tahoma', 'Arial Unicode MS', sans-serif;
      direction: rtl;
      padding: 20px;
      line-height: 1.6;
      margin: 0;
    }
    
    @media print { .no-print { display: none; } }
    
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
    
    th {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: center;
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
    window.onload = function() { setTimeout(function() { window.print(); }, 1000); }
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
    <p><strong>نام:</strong> ${customerData?.name || 'نامشخص'}</p>
    <p><strong>ایمیل:</strong> ${customerData?.email || 'نامشخص'}</p>
    <p><strong>تلفن:</strong> ${customerData?.phone || 'نامشخص'}</p>
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
</html>`;

    return Buffer.from(htmlContent, 'utf-8');
    
  } catch (error) {
    console.error('Error generating invoice HTML:', error);
    
    // Fallback simple HTML
    const fallbackHtml = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head><meta charset="UTF-8"><title>فاکتور</title></head>
<body style="font-family: Tahoma; direction: rtl; padding: 20px;">
  <h1>فاکتور - Invoice</h1>
  <p>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>
</body>
</html>`;
    
    return Buffer.from(fallbackHtml, 'utf-8');
  }
}
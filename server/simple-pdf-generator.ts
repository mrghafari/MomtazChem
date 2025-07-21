// Simple PDF Generator - HTML Response for Browser Print to PDF
// This approach generates HTML that browsers can print to PDF natively

import PDFDocument from 'pdfkit';
import { vazirRegular, vazirBold } from './vazir-base64';

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

// Generate Invoice PDF using PDFKit
export async function generateInvoicePDFWithPDFKit(invoiceData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      console.log('📄 Generating invoice PDF with PDFKit...');
      
      // Create a PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice ${invoiceData.invoiceNumber}`,
          Author: 'Momtaz Chem',
          Subject: 'Invoice PDF'
        }
      });

      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        console.log('✅ Invoice PDF generated successfully, size:', result.length);
        resolve(result);
      });

      doc.on('error', (error: Error) => {
        console.error('❌ PDF generation error:', error);
        reject(error);
      });

      // Add content to PDF
      try {
        // Register custom fonts
        const vazirRegularBuffer = Buffer.from(vazirRegular, 'base64');
        const vazirBoldBuffer = Buffer.from(vazirBold, 'base64');
        
        doc.registerFont('VazirRegular', vazirRegularBuffer);
        doc.registerFont('VazirBold', vazirBoldBuffer);
        
        // Set font for RTL text
        doc.font('VazirRegular');
        
        // Header
        doc.fontSize(20)
           .font('VazirBold')
           .text('فاکتور فروش - Momtaz Chem', 50, 50, { align: 'center' });
        
        // Invoice details
        doc.fontSize(12)
           .font('VazirRegular')
           .text(`شماره فاکتور: ${invoiceData.invoiceNumber || 'INV-001'}`, 50, 100, { align: 'right' })
           .text(`تاریخ: ${new Date().toLocaleDateString('fa-IR')}`, 350, 100, { align: 'left' });
        
        // Customer info
        doc.fontSize(14)
           .font('VazirBold')
           .text('مشخصات مشتری:', 50, 150, { align: 'right' });
        
        doc.fontSize(11)
           .font('VazirRegular')
           .text(`نام: ${invoiceData.customerName || 'نامشخص'}`, 50, 180, { align: 'right' })
           .text(`تلفن: ${invoiceData.customerPhone || 'نامشخص'}`, 50, 200, { align: 'right' })
           .text(`ایمیل: ${invoiceData.customerEmail || 'نامشخص'}`, 50, 220, { align: 'right' });
        
        // Items table
        doc.fontSize(14)
           .font('VazirBold')
           .text('کالاها و خدمات:', 50, 260, { align: 'right' });
        
        // Table headers
        const startY = 290;
        doc.fontSize(10)
           .font('VazirBold')
           .text('شرح کالا', 50, startY, { align: 'right' })
           .text('تعداد', 200, startY, { align: 'center' })
           .text('قیمت واحد', 250, startY, { align: 'center' })
           .text('مبلغ کل', 350, startY, { align: 'center' });
        
        // Draw line under headers
        doc.moveTo(50, startY + 15)
           .lineTo(500, startY + 15)
           .stroke();
        
        // Items
        let currentY = startY + 25;
        const items = invoiceData.items || [];
        
        items.forEach((item: any, index: number) => {
          const itemY = currentY + (index * 20);
          
          doc.fontSize(9)
             .font('VazirRegular')
             .text(item.name || 'نامشخص', 50, itemY, { align: 'right' })
             .text((item.quantity || 1).toString(), 200, itemY, { align: 'center' })
             .text((item.unitPrice || 0).toLocaleString('fa-IR') + ' ریال', 250, itemY, { align: 'center' })
             .text(((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('fa-IR') + ' ریال', 350, itemY, { align: 'center' });
        });
        
        // Total
        const totalY = currentY + (items.length * 20) + 30;
        doc.fontSize(12)
           .font('VazirBold')
           .text(`مجموع کل: ${(invoiceData.totalAmount || 0).toLocaleString('fa-IR')} ریال`, 50, totalY, { align: 'right' });
        
        // Footer
        doc.fontSize(9)
           .font('VazirRegular')
           .text('شرکت مواد شیمیایی ممتاز - Momtaz Chemical Solutions', 50, 750, { align: 'center' })
           .text('www.momtazchem.com | info@momtazchem.com', 50, 765, { align: 'center' });
        
      } catch (fontError) {
        console.warn('Font registration failed, using default font:', fontError);
        
        // Fallback to default font
        doc.fontSize(20)
           .text('Invoice - Momtaz Chem', 50, 50, { align: 'center' });
        
        doc.fontSize(12)
           .text(`Invoice Number: ${invoiceData.invoiceNumber || 'INV-001'}`, 50, 100)
           .text(`Date: ${new Date().toLocaleDateString()}`, 350, 100);
        
        doc.fontSize(14)
           .text('Customer Details:', 50, 150);
        
        doc.fontSize(11)
           .text(`Name: ${invoiceData.customerName || 'Unknown'}`, 50, 180)
           .text(`Phone: ${invoiceData.customerPhone || 'Unknown'}`, 50, 200)
           .text(`Email: ${invoiceData.customerEmail || 'Unknown'}`, 50, 220);
        
        doc.fontSize(14)
           .text('Items:', 50, 260);
        
        const items = invoiceData.items || [];
        let currentY = 290;
        
        items.forEach((item: any, index: number) => {
          const itemY = currentY + (index * 20);
          doc.fontSize(10)
             .text(`${item.name || 'Unknown'} - Qty: ${item.quantity || 1} - Price: ${(item.unitPrice || 0).toLocaleString()} IQD`, 50, itemY);
        });
        
        const totalY = currentY + (items.length * 20) + 30;
        doc.fontSize(12)
           .text(`Total: ${(invoiceData.totalAmount || 0).toLocaleString()} IQD`, 50, totalY);
      }

      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      console.error('❌ Error in generateInvoicePDFWithPDFKit:', error);
      reject(error);
    }
  });
}

// Generate Customer Report PDF using PDFKit
export async function generateCustomerReportPDFWithPDFKit(customerData: any, orders: any[] = [], activities: any[] = []): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      console.log('📄 Generating customer report PDF with PDFKit...');
      
      // Create a PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Customer Report - ${customerData.customerName || 'Unknown'}`,
          Author: 'Momtaz Chem',
          Subject: 'Customer Report PDF'
        }
      });

      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        console.log('✅ Customer report PDF generated successfully, size:', result.length);
        resolve(result);
      });

      doc.on('error', (error: Error) => {
        console.error('❌ PDF generation error:', error);
        reject(error);
      });

      // Add content to PDF
      try {
        // Register custom fonts
        const vazirRegularBuffer = Buffer.from(vazirRegular, 'base64');
        const vazirBoldBuffer = Buffer.from(vazirBold, 'base64');
        
        doc.registerFont('VazirRegular', vazirRegularBuffer);
        doc.registerFont('VazirBold', vazirBoldBuffer);
        
        // Set font for RTL text
        doc.font('VazirRegular');
        
        // Header
        doc.fontSize(20)
           .font('VazirBold')
           .text('گزارش مشتری - Momtaz Chem', 50, 50, { align: 'center' });
        
        // Customer info
        doc.fontSize(14)
           .font('VazirBold')
           .text('اطلاعات مشتری:', 50, 100, { align: 'right' });
        
        doc.fontSize(11)
           .font('VazirRegular')
           .text(`نام: ${customerData.customerName || 'نامشخص'}`, 50, 130, { align: 'right' })
           .text(`ایمیل: ${customerData.email || 'نامشخص'}`, 50, 150, { align: 'right' })
           .text(`تلفن: ${customerData.phone || 'نامشخص'}`, 50, 170, { align: 'right' });
        
        // Orders section
        doc.fontSize(14)
           .font('VazirBold')
           .text('سوابق سفارشات:', 50, 210, { align: 'right' });
        
        doc.fontSize(11)
           .font('VazirRegular')
           .text(orders.length > 0 ? `تعداد سفارشات: ${orders.length}` : 'هیچ سفارشی یافت نشد.', 50, 240, { align: 'right' });
        
        // Footer
        doc.fontSize(9)
           .font('VazirRegular')
           .text('شرکت مواد شیمیایی ممتاز - Momtaz Chemical Solutions', 50, 750, { align: 'center' })
           .text('www.momtazchem.com | info@momtazchem.com', 50, 765, { align: 'center' });
        
      } catch (fontError) {
        console.warn('Font registration failed, using default font:', fontError);
        
        // Fallback to default font
        doc.fontSize(20)
           .text('Customer Report - Momtaz Chem', 50, 50, { align: 'center' });
        
        doc.fontSize(14)
           .text('Customer Information:', 50, 100);
        
        doc.fontSize(11)
           .text(`Name: ${customerData.customerName || 'Unknown'}`, 50, 130)
           .text(`Email: ${customerData.email || 'Unknown'}`, 50, 150)
           .text(`Phone: ${customerData.phone || 'Unknown'}`, 50, 170);
        
        doc.fontSize(14)
           .text('Order History:', 50, 210);
        
        doc.fontSize(11)
           .text(orders.length > 0 ? `Total Orders: ${orders.length}` : 'No orders found.', 50, 240);
      }

      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      console.error('❌ Error in generateCustomerReportPDFWithPDFKit:', error);
      reject(error);
    }
  });
}
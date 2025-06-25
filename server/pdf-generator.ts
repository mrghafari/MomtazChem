import puppeteer from 'puppeteer';
import { format } from 'date-fns';

interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  totalRevenue: number;
  averageOrderValue: number;
  topCustomers: Array<{
    id: number;
    name: string;
    email: string;
    totalSpent: number;
    totalOrders: number;
  }>;
  customersByType: Array<{
    type: string;
    count: number;
  }>;
  recentActivities: Array<{
    id: number;
    activityType: string;
    description: string;
    performedBy: string;
    createdAt: string;
  }>;
}

export async function generatePDF(htmlContent: string, filename: string): Promise<Buffer> {
  console.log('Starting PDF generation for:', filename);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-extensions',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport and user agent for consistent rendering
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Load content with proper waiting
    await page.setContent(htmlContent, { 
      waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
      timeout: 60000 
    });
    
    // Additional wait for content stabilization
    await page.waitForTimeout(2000);
    
    // Generate PDF with Adobe Acrobat compatible settings
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      scale: 1.0,
      tagged: false,
      outline: false,
      timeout: 30000
    });

    // Validate PDF
    if (!pdf || pdf.length === 0) {
      throw new Error('Generated PDF is empty');
    }
    
    // Verify PDF header for Adobe compatibility
    const pdfHeader = pdf.subarray(0, 8).toString();
    if (!pdfHeader.startsWith('%PDF-')) {
      throw new Error('Invalid PDF format - missing PDF header');
    }
    
    // Check for PDF trailer
    const pdfEnd = pdf.subarray(-10).toString();
    if (!pdfEnd.includes('%%EOF')) {
      throw new Error('Invalid PDF format - missing EOF marker');
    }
    
    console.log('PDF generated successfully:', filename, 'Size:', pdf.length, 'bytes');
    return pdf;
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

export function generateCustomerReportHTML(customer: any, analytics: any, activities: any[]): string {
  const currentDate = format(new Date(), 'MMMM dd, yyyy');
  const generatedTime = format(new Date(), 'HH:mm:ss');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Customer Report - ${customer.firstName} ${customer.lastName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.4;
      color: #333;
      background: white;
      font-size: 14px;
    }
    
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 25px;
      margin-bottom: 25px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 24px;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .header .subtitle {
      font-size: 16px;
      opacity: 0.9;
    }
    
    .customer-info {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 25px;
      border-left: 4px solid #3b82f6;
    }
    
    .section-title {
      font-size: 18px;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid #e2e8f0;
      font-weight: bold;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .info-label {
      font-weight: bold;
      color: #475569;
    }
    
    .info-value {
      color: #1e293b;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 25px;
    }
    
    .metric-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    
    .metric-value {
      font-size: 20px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 5px;
    }
    
    .metric-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: bold;
    }
    
    .activity-item {
      padding: 12px;
      background: #f8fafc;
      border-radius: 6px;
      margin-bottom: 10px;
      border-left: 3px solid #3b82f6;
    }
    
    .activity-type {
      font-weight: bold;
      color: #1e40af;
      text-transform: capitalize;
      font-size: 12px;
    }
    
    .activity-description {
      margin: 5px 0;
      color: #475569;
      font-size: 12px;
    }
    
    .activity-meta {
      font-size: 10px;
      color: #64748b;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 11px;
    }
    
    @media print {
      body { -webkit-print-color-adjust: exact; color-adjust: exact; }
      .header { break-inside: avoid; }
      .metric-card { break-inside: avoid; }
      .activity-item { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Customer Detail Report</h1>
    <div class="subtitle">Momtazchem CRM System</div>
    <div class="subtitle">${customer.firstName} ${customer.lastName}</div>
  </div>

  <div class="customer-info">
    <h2 class="section-title">Customer Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Full Name:</span>
        <span class="info-value">${customer.firstName} ${customer.lastName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Email:</span>
        <span class="info-value">${customer.email}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Phone:</span>
        <span class="info-value">${customer.phone || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Company:</span>
        <span class="info-value">${customer.company || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Country:</span>
        <span class="info-value">${customer.country || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">City:</span>
        <span class="info-value">${customer.city || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Customer Type:</span>
        <span class="info-value">${customer.customerType || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Status:</span>
        <span class="info-value">${customer.customerStatus || 'N/A'}</span>
      </div>
    </div>
  </div>

  <h2 class="section-title">Customer Analytics</h2>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-value">${analytics?.totalOrders || 0}</div>
      <div class="metric-label">Total Orders</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">$${(analytics?.totalSpent || 0).toLocaleString()}</div>
      <div class="metric-label">Total Spent</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">$${(analytics?.averageOrderValue || 0).toFixed(2)}</div>
      <div class="metric-label">Average Order</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${analytics?.daysSinceLastOrder || 'N/A'}</div>
      <div class="metric-label">Days Since Last Order</div>
    </div>
  </div>

  <h2 class="section-title">Recent Activities</h2>
  ${activities && activities.length > 0 ? activities.slice(0, 10).map(activity => `
    <div class="activity-item">
      <div class="activity-type">${activity.activityType?.replace(/_/g, ' ') || 'Activity'}</div>
      <div class="activity-description">${activity.description || 'No description available'}</div>
      <div class="activity-meta">
        ${activity.createdAt ? format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm') : 'Unknown date'}
      </div>
    </div>
  `).join('') : '<div class="activity-item">No recent activities found</div>'}

  <div class="footer">
    <p>This report was generated by Momtazchem CRM System</p>
    <p>Generated on ${currentDate} at ${generatedTime}</p>
    <p>&copy; ${new Date().getFullYear()} Momtazchem - Customer Detail Report</p>
  </div>
</body>
</html>`;
}

export function generateAnalyticsReportHTML(analytics: CustomerAnalytics): string {
  const currentDate = format(new Date(), 'MMMM dd, yyyy');
  const generatedTime = format(new Date(), 'HH:mm:ss');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Customer Analytics Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.4;
      color: #333;
      background: white;
      font-size: 14px;
    }
    
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 25px;
      margin-bottom: 25px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 24px;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .section-title {
      font-size: 18px;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid #e2e8f0;
      font-weight: bold;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 25px;
    }
    
    .metric-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 8px;
    }
    
    .metric-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: bold;
    }
    
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    
    .table th {
      background: #f1f5f9;
      color: #1e293b;
      padding: 12px;
      text-align: left;
      font-weight: bold;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 11px;
    }
    
    @media print {
      body { -webkit-print-color-adjust: exact; color-adjust: exact; }
      .header { break-inside: avoid; }
      .metric-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Customer Analytics Report</h1>
    <div>Momtazchem CRM System</div>
    <div>Generated: ${currentDate} ${generatedTime}</div>
  </div>

  <h2 class="section-title">Key Metrics Overview</h2>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-value">${analytics.totalCustomers}</div>
      <div class="metric-label">Total Customers</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${analytics.activeCustomers}</div>
      <div class="metric-label">Active Customers</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${analytics.newCustomersThisMonth}</div>
      <div class="metric-label">New This Month</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">$${analytics.totalRevenue.toLocaleString()}</div>
      <div class="metric-label">Total Revenue</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">$${analytics.averageOrderValue.toFixed(2)}</div>
      <div class="metric-label">Average Order Value</div>
    </div>
  </div>

  <h2 class="section-title">Top Customers by Revenue</h2>
  <table class="table">
    <thead>
      <tr>
        <th>Customer Name</th>
        <th>Email Address</th>
        <th>Total Spent</th>
        <th>Total Orders</th>
        <th>Average Order</th>
      </tr>
    </thead>
    <tbody>
      ${analytics.topCustomers.map(customer => `
        <tr>
          <td>${customer.name}</td>
          <td>${customer.email}</td>
          <td>$${customer.totalSpent.toLocaleString()}</td>
          <td>${customer.totalOrders}</td>
          <td>$${(customer.totalSpent / customer.totalOrders).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>This report was generated by Momtazchem CRM System</p>
    <p>&copy; ${new Date().getFullYear()} Momtazchem - Customer Analytics Report</p>
  </div>
</body>
</html>`;
}
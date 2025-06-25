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

export async function generateCustomerAnalyticsPDF(analytics: CustomerAnalytics): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions'
    ]
  });

  try {
    const page = await browser.newPage();
    
    const html = generateAnalyticsHTML(analytics);
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await page.waitForTimeout(1000);
    
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
      tagged: true,
      waitForFonts: true
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

function generateAnalyticsHTML(analytics: CustomerAnalytics): string {
  const currentDate = format(new Date(), 'MMMM dd, yyyy');
  const generatedTime = format(new Date(), 'HH:mm:ss');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Customer Analytics Report</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        .header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 30px;
          text-align: center;
          margin-bottom: 30px;
        }
        
        .header h1 {
          font-size: 28px;
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .header .subtitle {
          font-size: 16px;
          opacity: 0.9;
        }
        
        .report-info {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #3b82f6;
        }
        
        .report-info h2 {
          color: #1e40af;
          margin-bottom: 10px;
          font-size: 18px;
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
          font-weight: 600;
          color: #475569;
        }
        
        .info-value {
          color: #1e40af;
          font-weight: 500;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .metric-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .metric-value {
          font-size: 32px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 8px;
        }
        
        .metric-label {
          font-size: 14px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .section {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 22px;
          color: #1e40af;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .table th {
          background: #f1f5f9;
          color: #475569;
          font-weight: 600;
          padding: 15px 12px;
          text-align: left;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .table tr:hover {
          background: #f8fafc;
        }
        
        .currency {
          color: #059669;
          font-weight: 600;
        }
        
        .email {
          color: #7c3aed;
          font-size: 13px;
        }
        
        .customer-type {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        .type-business {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .type-individual {
          background: #ecfdf5;
          color: #059669;
        }
        
        .activity-item {
          padding: 15px;
          background: #f8fafc;
          border-radius: 6px;
          margin-bottom: 10px;
          border-left: 3px solid #3b82f6;
        }
        
        .activity-type {
          font-weight: 600;
          color: #1e40af;
          text-transform: capitalize;
        }
        
        .activity-description {
          margin: 5px 0;
          color: #475569;
        }
        
        .activity-meta {
          font-size: 12px;
          color: #64748b;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
        
        @media print {
          .section {
            page-break-inside: avoid;
          }
          
          .metric-card {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Customer Analytics Report</h1>
        <div class="subtitle">Momtazchem Customer Relationship Management</div>
      </div>

      <div class="report-info">
        <h2>Report Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Generated Date:</span>
            <span class="info-value">${currentDate}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Generated Time:</span>
            <span class="info-value">${generatedTime}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Report Type:</span>
            <span class="info-value">Customer Analytics Summary</span>
          </div>
          <div class="info-item">
            <span class="info-label">System:</span>
            <span class="info-value">Momtazchem CRM</span>
          </div>
        </div>
      </div>

      <div class="section">
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
      </div>

      <div class="section">
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
                <td><strong>${customer.name}</strong></td>
                <td class="email">${customer.email}</td>
                <td class="currency">$${customer.totalSpent.toLocaleString()}</td>
                <td>${customer.totalOrders}</td>
                <td class="currency">$${(customer.totalSpent / Math.max(customer.totalOrders, 1)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">Customer Segmentation</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Customer Type</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${analytics.customersByType.map(type => {
              const percentage = ((type.count / analytics.totalCustomers) * 100).toFixed(1);
              return `
                <tr>
                  <td>
                    <span class="customer-type type-${type.type}">
                      ${type.type}
                    </span>
                  </td>
                  <td>${type.count}</td>
                  <td>${percentage}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">Recent Customer Activities</h2>
        ${analytics.recentActivities.slice(0, 10).map(activity => `
          <div class="activity-item">
            <div class="activity-type">${activity.activityType.replace(/_/g, ' ')}</div>
            <div class="activity-description">${activity.description}</div>
            <div class="activity-meta">
              Performed by: ${activity.performedBy} | 
              ${format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="footer">
        <p>This report was automatically generated by Momtazchem CRM System</p>
        <p>Generated on ${currentDate} at ${generatedTime}</p>
        <p>© ${new Date().getFullYear()} Momtazchem - Customer Analytics Report</p>
      </div>
    </body>
    </html>
  `;
}

export async function generateCustomerDetailPDF(customer: any, analytics: any, activities: any[]): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions'
    ]
  });

  try {
    const page = await browser.newPage();
    
    const html = generateCustomerDetailHTML(customer, analytics, activities);
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    await page.waitForTimeout(1000);
    
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
      tagged: true,
      waitForFonts: true
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

function generateCustomerDetailHTML(customer: any, analytics: any, activities: any[]): string {
  const currentDate = format(new Date(), 'MMMM dd, yyyy');
  const generatedTime = format(new Date(), 'HH:mm:ss');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Customer Detail Report - ${customer.firstName} ${customer.lastName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        .header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 30px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          font-size: 28px;
          margin-bottom: 8px;
        }
        
        .customer-info {
          background: #f8fafc;
          padding: 25px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #3b82f6;
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
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .metric-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
        }
        
        .section-title {
          font-size: 20px;
          color: #1e40af;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .activity-item {
          padding: 12px;
          background: #f8fafc;
          border-radius: 6px;
          margin-bottom: 8px;
          border-left: 3px solid #3b82f6;
        }
        
        .activity-type {
          font-weight: 600;
          color: #1e40af;
          text-transform: capitalize;
        }
        
        .activity-description {
          margin: 5px 0;
          color: #475569;
          font-size: 14px;
        }
        
        .activity-meta {
          font-size: 11px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Customer Detail Report</h1>
        <div>Customer: ${customer.firstName} ${customer.lastName}</div>
        <div>Generated: ${currentDate}</div>
      </div>

      <div class="customer-info">
        <h2 style="color: #1e40af; margin-bottom: 15px;">Customer Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <span><strong>Name:</strong></span>
            <span>${customer.firstName} ${customer.lastName}</span>
          </div>
          <div class="info-item">
            <span><strong>Email:</strong></span>
            <span>${customer.email}</span>
          </div>
          <div class="info-item">
            <span><strong>Phone:</strong></span>
            <span>${customer.phone || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span><strong>Company:</strong></span>
            <span>${customer.company || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span><strong>Country:</strong></span>
            <span>${customer.country || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span><strong>City:</strong></span>
            <span>${customer.city || 'N/A'}</span>
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
      ${activities && activities.length > 0 ? activities.slice(0, 15).map(activity => `
        <div class="activity-item">
          <div class="activity-type">${activity.activityType?.replace(/_/g, ' ') || 'Activity'}</div>
          <div class="activity-description">${activity.description || 'No description available'}</div>
          <div class="activity-meta">
            ${activity.createdAt ? format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm') : 'Unknown date'}
          </div>
        </div>
      `).join('') : '<div class="activity-item">No recent activities found</div>'}
    </body>
    </html>
  `;
}
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

export async function generateSimplePDF(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

export function generateCustomerPDFHTML(customer: any, analytics: any, activities: any[]): string {
  const currentDate = format(new Date(), 'MMMM dd, yyyy');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Customer Report</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      color: #333; 
      line-height: 1.4; 
      margin: 0;
      padding: 20px;
    }
    .header { 
      background: #1e40af; 
      color: white; 
      padding: 20px; 
      text-align: center; 
      margin-bottom: 20px;
    }
    .section { 
      margin-bottom: 20px; 
    }
    .section h2 { 
      color: #1e40af; 
      border-bottom: 2px solid #e2e8f0; 
      padding-bottom: 5px;
    }
    .info-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 10px; 
    }
    .info-item { 
      padding: 8px 0; 
      border-bottom: 1px solid #e2e8f0; 
    }
    .label { 
      font-weight: bold; 
      display: inline-block; 
      width: 120px;
    }
    .metrics { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 15px; 
      margin: 20px 0;
    }
    .metric { 
      background: #f8fafc; 
      padding: 15px; 
      text-align: center; 
      border: 1px solid #e2e8f0;
    }
    .metric-value { 
      font-size: 20px; 
      font-weight: bold; 
      color: #1e40af; 
    }
    .metric-label { 
      font-size: 12px; 
      color: #64748b;
    }
    .activity { 
      background: #f8fafc; 
      padding: 10px; 
      margin-bottom: 10px; 
      border-left: 3px solid #3b82f6;
    }
    .footer { 
      margin-top: 30px; 
      text-align: center; 
      font-size: 12px; 
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Customer Detail Report</h1>
    <p>Momtazchem CRM System</p>
    <p>${customer.firstName} ${customer.lastName}</p>
  </div>

  <div class="section">
    <h2>Customer Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <span class="label">Name:</span> ${customer.firstName} ${customer.lastName}
      </div>
      <div class="info-item">
        <span class="label">Email:</span> ${customer.email}
      </div>
      <div class="info-item">
        <span class="label">Phone:</span> ${customer.phone || 'N/A'}
      </div>
      <div class="info-item">
        <span class="label">Company:</span> ${customer.company || 'N/A'}
      </div>
      <div class="info-item">
        <span class="label">Country:</span> ${customer.country || 'N/A'}
      </div>
      <div class="info-item">
        <span class="label">City:</span> ${customer.city || 'N/A'}
      </div>
      <div class="info-item">
        <span class="label">Type:</span> ${customer.customerType || 'N/A'}
      </div>
      <div class="info-item">
        <span class="label">Status:</span> ${customer.customerStatus || 'N/A'}
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Analytics</h2>
    <div class="metrics">
      <div class="metric">
        <div class="metric-value">${analytics?.totalOrders || 0}</div>
        <div class="metric-label">Total Orders</div>
      </div>
      <div class="metric">
        <div class="metric-value">$${(analytics?.totalSpent || 0).toLocaleString()}</div>
        <div class="metric-label">Total Spent</div>
      </div>
      <div class="metric">
        <div class="metric-value">$${(analytics?.averageOrderValue || 0).toFixed(2)}</div>
        <div class="metric-label">Average Order</div>
      </div>
      <div class="metric">
        <div class="metric-value">${analytics?.daysSinceLastOrder || 'N/A'}</div>
        <div class="metric-label">Days Since Last Order</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Recent Activities</h2>
    ${activities && activities.length > 0 ? activities.slice(0, 10).map(activity => `
      <div class="activity">
        <strong>${activity.activityType?.replace(/_/g, ' ') || 'Activity'}</strong><br>
        ${activity.description || 'No description available'}<br>
        <small>${activity.createdAt ? format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm') : 'Unknown date'}</small>
      </div>
    `).join('') : '<div class="activity">No recent activities found</div>'}
  </div>

  <div class="footer">
    <p>Generated by Momtazchem CRM System on ${currentDate}</p>
    <p>&copy; ${new Date().getFullYear()} Momtazchem</p>
  </div>
</body>
</html>`;
}

export function generateAnalyticsPDFHTML(analytics: CustomerAnalytics): string {
  const currentDate = format(new Date(), 'MMMM dd, yyyy');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Analytics Report</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      color: #333; 
      line-height: 1.4; 
      margin: 0;
      padding: 20px;
    }
    .header { 
      background: #1e40af; 
      color: white; 
      padding: 20px; 
      text-align: center; 
      margin-bottom: 20px;
    }
    .section { 
      margin-bottom: 20px; 
    }
    .section h2 { 
      color: #1e40af; 
      border-bottom: 2px solid #e2e8f0; 
      padding-bottom: 5px;
    }
    .metrics { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 20px; 
      margin: 20px 0;
    }
    .metric { 
      background: #f8fafc; 
      padding: 20px; 
      text-align: center; 
      border: 1px solid #e2e8f0;
    }
    .metric-value { 
      font-size: 24px; 
      font-weight: bold; 
      color: #1e40af; 
    }
    .metric-label { 
      font-size: 12px; 
      color: #64748b;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
    }
    th, td { 
      padding: 10px; 
      text-align: left; 
      border-bottom: 1px solid #e2e8f0;
    }
    th { 
      background: #f1f5f9; 
      font-weight: bold;
    }
    .footer { 
      margin-top: 30px; 
      text-align: center; 
      font-size: 12px; 
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Customer Analytics Report</h1>
    <p>Momtazchem CRM System</p>
    <p>Generated: ${currentDate}</p>
  </div>

  <div class="section">
    <h2>Key Metrics</h2>
    <div class="metrics">
      <div class="metric">
        <div class="metric-value">${analytics.totalCustomers}</div>
        <div class="metric-label">Total Customers</div>
      </div>
      <div class="metric">
        <div class="metric-value">${analytics.activeCustomers}</div>
        <div class="metric-label">Active Customers</div>
      </div>
      <div class="metric">
        <div class="metric-value">${analytics.newCustomersThisMonth}</div>
        <div class="metric-label">New This Month</div>
      </div>
      <div class="metric">
        <div class="metric-value">$${analytics.totalRevenue.toLocaleString()}</div>
        <div class="metric-label">Total Revenue</div>
      </div>
      <div class="metric">
        <div class="metric-value">$${analytics.averageOrderValue.toFixed(2)}</div>
        <div class="metric-label">Average Order Value</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Top Customers</h2>
    <table>
      <thead>
        <tr>
          <th>Customer Name</th>
          <th>Email</th>
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
  </div>

  <div class="footer">
    <p>Generated by Momtazchem CRM System</p>
    <p>&copy; ${new Date().getFullYear()} Momtazchem</p>
  </div>
</body>
</html>`;
}
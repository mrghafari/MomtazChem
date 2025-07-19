// Simple Text-based PDF Generator for Persian/Arabic content
// Using basic text formatting without external dependencies

import * as fs from 'fs';
import * as path from 'path';

// Generate simple text-based PDF content (plain text format)
export async function generateCustomerPDFHTML(
  customerData: any,
  orders: any[],
  activities: any[],
  title: string
): Promise<Buffer> {
  
  const content = `
شرکت ممتاز برای مواد شیمیایی
Momtaz Chemical Solutions Company
=========================================

گزارش مشتری - ${title}
Customer Report - ${title}

تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}
Generated: ${new Date().toISOString()}

=========================================
اطلاعات مشتری - Customer Information
=========================================

نام: ${customerData.name || 'نامشخص'}
Name: ${customerData.name || 'Unknown'}

ایمیل: ${customerData.email || 'نامشخص'}  
Email: ${customerData.email || 'Unknown'}

تلفن: ${customerData.phone || 'نامشخص'}
Phone: ${customerData.phone || 'Unknown'}

آدرس: ${customerData.address || 'نامشخص'}
Address: ${customerData.address || 'Unknown'}

تاریخ عضویت: ${customerData.createdAt ? new Date(customerData.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
Registration Date: ${customerData.createdAt ? new Date(customerData.createdAt).toLocaleDateString('en-US') : 'Unknown'}

وضعیت: ${customerData.customerStatus || 'فعال'}
Status: ${customerData.customerStatus || 'Active'}

=========================================
سفارشات اخیر - Recent Orders
=========================================

${orders?.slice(0, 10).map((order, index) => `
${index + 1}. شماره سفارش: ${order.id || 'نامشخص'}
   Order ID: ${order.id || 'Unknown'}
   
   مبلغ کل: ${order.totalAmount || 0} دینار عراقی
   Total Amount: ${order.totalAmount || 0} IQD
   
   وضعیت: ${order.status || 'نامشخص'}
   Status: ${order.status || 'Unknown'}
   
   تاریخ: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
   Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US') : 'Unknown'}
   
   -------------------
`).join('') || 'سفارشی ثبت نشده است\nNo orders found'}

=========================================
فعالیت‌های اخیر - Recent Activities  
=========================================

${activities?.slice(0, 10).map((activity, index) => `
${index + 1}. نوع فعالیت: ${activity.activityType || 'نامشخص'}
   Activity Type: ${activity.activityType || 'Unknown'}
   
   توضیحات: ${activity.description || 'توضیحی ثبت نشده'}
   Description: ${activity.description || 'No description'}
   
   تاریخ: ${activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
   Date: ${activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('en-US') : 'Unknown'}
   
   -------------------
`).join('') || 'فعالیتی ثبت نشده است\nNo activities found'}

=========================================
اطلاعات تماس - Contact Information
=========================================

تلفن: +964 770 999 6771
Phone: +964 770 999 6771

ایمیل: info@momtazchem.com
Email: info@momtazchem.com

وب‌سایت: www.momtazchem.com
Website: www.momtazchem.com

آدرس: عراق - بغداد
Address: Iraq - Baghdad

=========================================

این گزارش به صورت الکترونیکی تولید شده است
This report was generated electronically

تاریخ و زمان تولید: ${new Date().toLocaleString('fa-IR')}
Generated on: ${new Date().toLocaleString('en-US')}

© ${new Date().getFullYear()} شرکت ممتاز برای مواد شیمیایی
© ${new Date().getFullYear()} Momtaz Chemical Solutions Company
`;

  // Convert text content to Buffer (UTF-8 encoded)
  return Buffer.from(content, 'utf8');
}

// Generate Analytics PDF Report
export async function generateAnalyticsPDFHTML(
  analyticsData: any,
  title: string
): Promise<Buffer> {

  const content = `
شرکت ممتاز برای مواد شیمیایی
Momtaz Chemical Solutions Company
=========================================

گزارش آمارها - ${title}
Analytics Report - ${title}

تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}
Generated: ${new Date().toISOString()}

=========================================
آمار کلی سیستم - System Statistics
=========================================

تعداد کل مشتریان: ${analyticsData.totalCustomers || 0}
Total Customers: ${analyticsData.totalCustomers || 0}

مشتریان فعال: ${analyticsData.activeCustomers || 0}
Active Customers: ${analyticsData.activeCustomers || 0}

مشتریان جدید این ماه: ${analyticsData.newThisMonth || 0}
New Customers This Month: ${analyticsData.newThisMonth || 0}

تعداد کل سفارشات: ${analyticsData.totalOrders || 0}
Total Orders: ${analyticsData.totalOrders || 0}

=========================================
عملکرد ماهانه - Monthly Performance
=========================================

درآمد ماهانه: ${analyticsData.monthlyRevenue || 0} دینار عراقی
Monthly Revenue: ${analyticsData.monthlyRevenue || 0} IQD

سفارشات ماهانه: ${analyticsData.monthlyOrders || 0}
Monthly Orders: ${analyticsData.monthlyOrders || 0}

میانگین ارزش سفارش: ${analyticsData.averageOrderValue || 0} دینار عراقی
Average Order Value: ${analyticsData.averageOrderValue || 0} IQD

نرخ تبدیل: ${analyticsData.conversionRate || 0}%
Conversion Rate: ${analyticsData.conversionRate || 0}%

=========================================
خلاصه تحلیل - Analysis Summary
=========================================

این گزارش شامل آمار جامع سیستم مدیریت مشتریان و فروش 
شرکت ممتاز برای مواد شیمیایی می‌باشد.

This report contains comprehensive statistics of the customer 
management and sales system for Momtaz Chemical Solutions Company.

داده‌های ارائه شده بر اساس آخرین اطلاعات موجود در سیستم محاسبه شده است.
The presented data is calculated based on the latest information available in the system.

=========================================
اطلاعات تماس - Contact Information
=========================================

تلفن: +964 770 999 6771
Phone: +964 770 999 6771

ایمیل: info@momtazchem.com
Email: info@momtazchem.com

وب‌سایت: www.momtazchem.com
Website: www.momtazchem.com

آدرس: عراق - بغداد
Address: Iraq - Baghdad

=========================================

این گزارش به صورت الکترونیکی تولید شده است
This report was generated electronically

تاریخ و زمان تولید: ${new Date().toLocaleString('fa-IR')}
Generated on: ${new Date().toLocaleString('en-US')}

© ${new Date().getFullYear()} شرکت ممتاز برای مواد شیمیایی
© ${new Date().getFullYear()} Momtaz Chemical Solutions Company
`;

  // Convert text content to Buffer (UTF-8 encoded)
  return Buffer.from(content, 'utf8');
}

// Generate Invoice PDF with batch information
export async function generateInvoicePDFWithBatch(
  customerData: any,
  orderData: any,
  batchData: any[],
  title: string
): Promise<Buffer> {

  const batchInfo = batchData?.map((batch, index) => `
${index + 1}. شماره بچ: ${batch.batchNumber || 'نامشخص'}
   Batch Number: ${batch.batchNumber || 'Unknown'}
   
   بارکد: ${batch.barcode || 'نامشخص'}
   Barcode: ${batch.barcode || 'Unknown'}
   
   مقدار فروخته شده: ${batch.quantitySold || 0}
   Quantity Sold: ${batch.quantitySold || 0}
   
   ضایعات: ${batch.wasteAmount || 0} (${batch.quantitySold ? ((parseFloat(batch.wasteAmount || 0) / batch.quantitySold) * 100).toFixed(2) : 0}%)
   Waste: ${batch.wasteAmount || 0} (${batch.quantitySold ? ((parseFloat(batch.wasteAmount || 0) / batch.quantitySold) * 100).toFixed(2) : 0}%)
   
   مقدار موثر: ${batch.effectiveQuantity || 0}
   Effective Quantity: ${batch.effectiveQuantity || 0}
   
   قیمت واحد: ${batch.unitPrice || 0} دینار
   Unit Price: ${batch.unitPrice || 0} IQD
   
   قیمت کل: ${batch.totalPrice || 0} دینار
   Total Price: ${batch.totalPrice || 0} IQD
   
   -------------------
`).join('') || 'اطلاعات بچی موجود نیست\nNo batch information available';

  const content = `
شرکت ممتاز برای مواد شیمیایی
Momtaz Chemical Solutions Company
=========================================

فاکتور - ${title}
Invoice - ${title}

تاریخ صدور: ${new Date().toLocaleDateString('fa-IR')}
Issue Date: ${new Date().toISOString()}

=========================================
اطلاعات مشتری - Customer Information
=========================================

نام: ${customerData.name || 'نامشخص'}
Name: ${customerData.name || 'Unknown'}

ایمیل: ${customerData.email || 'نامشخص'}
Email: ${customerData.email || 'Unknown'}

تلفن: ${customerData.phone || 'نامشخص'}
Phone: ${customerData.phone || 'Unknown'}

آدرس: ${customerData.address || 'نامشخص'}
Address: ${customerData.address || 'Unknown'}

=========================================
جزئیات فاکتور - Invoice Details
=========================================

شماره فاکتور: ${orderData.invoiceNumber || orderData.id}
Invoice Number: ${orderData.invoiceNumber || orderData.id}

شماره سفارش: ${orderData.orderNumber || orderData.id}
Order Number: ${orderData.orderNumber || orderData.id}

تاریخ سفارش: ${orderData.createdAt ? new Date(orderData.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
Order Date: ${orderData.createdAt ? new Date(orderData.createdAt).toLocaleDateString('en-US') : 'Unknown'}

وضعیت: ${orderData.status || 'نامشخص'}
Status: ${orderData.status || 'Unknown'}

=========================================
اطلاعات بچ محصولات - Product Batch Information
=========================================

${batchInfo}

=========================================
اطلاعات پرداخت - Payment Information
=========================================

روش پرداخت: ${orderData.paymentMethod || 'نامشخص'}
Payment Method: ${orderData.paymentMethod || 'Unknown'}

وضعیت پرداخت: ${orderData.paymentStatus || 'نامشخص'}
Payment Status: ${orderData.paymentStatus || 'Unknown'}

مبلغ کل: ${orderData.totalAmount || 'نامشخص'} دینار عراقی
Total Amount: ${orderData.totalAmount || 'Unknown'} IQD

=========================================
اطلاعات شرکت - Company Information
=========================================

تلفن: +964 770 999 6771
Phone: +964 770 999 6771

ایمیل: info@momtazchem.com
Email: info@momtazchem.com

وب‌سایت: www.momtazchem.com
Website: www.momtazchem.com

آدرس: عراق - بغداد
Address: Iraq - Baghdad

=========================================

این فاکتور به صورت الکترونیکی تولید شده است
This invoice was generated electronically

تاریخ و زمان تولید: ${new Date().toLocaleString('fa-IR')}
Generated on: ${new Date().toLocaleString('en-US')}

© ${new Date().getFullYear()} شرکت ممتاز برای مواد شیمیایی
© ${new Date().getFullYear()} Momtaz Chemical Solutions Company
`;

  // Convert text content to Buffer (UTF-8 encoded)
  return Buffer.from(content, 'utf8');
}
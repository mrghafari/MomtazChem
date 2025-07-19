// PDF Generator using jsPDF with Persian/Arabic Support
import { jsPDF } from 'jspdf';

// Configure jsPDF for RTL text support
function createPDFWithRTLSupport(): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  return doc;
}

// Add Persian/Arabic text with proper positioning
function addPersianText(doc: jsPDF, text: string, x: number, y: number, options: any = {}) {
  const fontSize = options.fontSize || 12;
  const fontStyle = options.fontStyle || 'normal';
  
  doc.setFontSize(fontSize);
  
  // For Persian/Arabic text, we'll use simple text positioning
  // Note: jsPDF has limited RTL support, but this will work for basic needs
  doc.text(text, x, y, { 
    align: options.align || 'right',
    maxWidth: options.maxWidth || 150
  });
}

// Generate customer PDF report
export async function generateCustomerPDFHTML(
  customerData: any,
  orders: any[],
  activities: any[],
  title: string
): Promise<Buffer> {
  try {
    const doc = createPDFWithRTLSupport();
    
    // Page setup
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = margin;
    
    // Header - Company Name
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Momtaz Chemical Solutions Company', pageWidth - margin, currentY, { align: 'right' });
    currentY += 10;
    
    doc.setFontSize(16);
    doc.text('شرکت ممتاز برای مواد شیمیایی', pageWidth - margin, currentY, { align: 'right' });
    currentY += 15;
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Customer Report - ${title}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 10;
    doc.text('گزارش مشتری', pageWidth - margin, currentY, { align: 'right' });
    currentY += 15;
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('en-US');
    const persianDate = new Date().toLocaleDateString('fa-IR');
    doc.text(`Generated: ${currentDate} | تاریخ: ${persianDate}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 20;
    
    // Customer Information Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Information - اطلاعات مشتری', pageWidth - margin, currentY, { align: 'right' });
    currentY += 15;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Customer details
    const customerInfo = [
      `Name: ${customerData.name || 'Unknown'} | نام: ${customerData.name || 'نامشخص'}`,
      `Email: ${customerData.email || 'Unknown'} | ایمیل: ${customerData.email || 'نامشخص'}`,
      `Phone: ${customerData.phone || 'Unknown'} | تلفن: ${customerData.phone || 'نامشخص'}`,
      `Status: ${customerData.customerStatus || 'Active'} | وضعیت: ${customerData.customerStatus || 'فعال'}`,
      `Address: ${customerData.address || 'Unknown'} | آدرس: ${customerData.address || 'نامشخص'}`
    ];
    
    customerInfo.forEach(info => {
      doc.text(info, pageWidth - margin, currentY, { align: 'right', maxWidth: pageWidth - 2 * margin });
      currentY += 8;
    });
    
    currentY += 10;
    
    // Recent Orders Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Orders - سفارشات اخیر', pageWidth - margin, currentY, { align: 'right' });
    currentY += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (orders && orders.length > 0) {
      orders.slice(0, 5).forEach((order, index) => {
        const orderText = `${index + 1}. Order ID: ${order.id || 'Unknown'} | Amount: ${order.totalAmount || 0} IQD | Status: ${order.status || 'Unknown'}`;
        doc.text(orderText, pageWidth - margin, currentY, { align: 'right', maxWidth: pageWidth - 2 * margin });
        currentY += 6;
        
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = margin;
        }
      });
    } else {
      doc.text('No orders found - سفارشی ثبت نشده است', pageWidth - margin, currentY, { align: 'right' });
      currentY += 8;
    }
    
    currentY += 10;
    
    // Recent Activities Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Activities - فعالیت‌های اخیر', pageWidth - margin, currentY, { align: 'right' });
    currentY += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (activities && activities.length > 0) {
      activities.slice(0, 5).forEach((activity, index) => {
        const activityText = `${index + 1}. Type: ${activity.activityType || 'Unknown'} | Description: ${activity.description || 'No description'}`;
        doc.text(activityText, pageWidth - margin, currentY, { align: 'right', maxWidth: pageWidth - 2 * margin });
        currentY += 6;
        
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = margin;
        }
      });
    } else {
      doc.text('No activities found - فعالیتی ثبت نشده است', pageWidth - margin, currentY, { align: 'right' });
      currentY += 8;
    }
    
    // Footer
    currentY = pageHeight - 40;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const footerInfo = [
      'Contact Information - اطلاعات تماس',
      'Phone: +964 770 999 6771 | تلفن: +964 770 999 6771',
      'Email: info@momtazchem.com | ایمیل: info@momtazchem.com',
      'Website: www.momtazchem.com | وب‌سایت: www.momtazchem.com',
      'Address: Iraq - Baghdad | آدرس: عراق - بغداد',
      '',
      `© ${new Date().getFullYear()} Momtaz Chemical Solutions Company`,
      'This report was generated electronically - این گزارش به صورت الکترونیکی تولید شده است'
    ];
    
    footerInfo.forEach(info => {
      doc.text(info, pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;
    });
    
    // Convert to buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    return Buffer.from(pdfArrayBuffer);
    
  } catch (error) {
    console.error('Error generating customer PDF with jsPDF:', error);
    throw new Error('Failed to generate customer PDF report');
  }
}

// Generate analytics PDF report
export async function generateAnalyticsPDFHTML(
  analyticsData: any,
  title: string
): Promise<Buffer> {
  try {
    const doc = createPDFWithRTLSupport();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = margin;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Analytics Report - گزارش آمارها', pageWidth - margin, currentY, { align: 'right' });
    currentY += 15;
    
    doc.setFontSize(16);
    doc.text('Momtaz Chemical Solutions Company', pageWidth - margin, currentY, { align: 'right' });
    currentY += 10;
    doc.text('شرکت ممتاز برای مواد شیمیایی', pageWidth - margin, currentY, { align: 'right' });
    currentY += 20;
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('en-US');
    const persianDate = new Date().toLocaleDateString('fa-IR');
    doc.text(`Generated: ${currentDate} | تاریخ: ${persianDate}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 20;
    
    // Statistics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('System Statistics - آمار سیستم', pageWidth - margin, currentY, { align: 'right' });
    currentY += 15;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const stats = [
      `Total Customers: ${analyticsData.totalCustomers || 0} | تعداد کل مشتریان: ${analyticsData.totalCustomers || 0}`,
      `Active Customers: ${analyticsData.activeCustomers || 0} | مشتریان فعال: ${analyticsData.activeCustomers || 0}`,
      `Total Orders: ${analyticsData.totalOrders || 0} | تعداد کل سفارشات: ${analyticsData.totalOrders || 0}`,
      `Monthly Revenue: ${analyticsData.monthlyRevenue || 0} IQD | درآمد ماهانه: ${analyticsData.monthlyRevenue || 0} دینار`,
      `New Customers This Month: ${analyticsData.newThisMonth || 0} | مشتریان جدید این ماه: ${analyticsData.newThisMonth || 0}`,
      `Average Order Value: ${analyticsData.averageOrderValue || 0} IQD | میانگین ارزش سفارش: ${analyticsData.averageOrderValue || 0} دینار`
    ];
    
    stats.forEach(stat => {
      doc.text(stat, pageWidth - margin, currentY, { align: 'right', maxWidth: pageWidth - 2 * margin });
      currentY += 8;
    });
    
    // Footer
    currentY = pageHeight - 30;
    doc.setFontSize(10);
    doc.text(`© ${new Date().getFullYear()} Momtaz Chemical Solutions Company`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text('This report was generated electronically - این گزارش به صورت الکترونیکی تولید شده است', pageWidth / 2, currentY, { align: 'center' });
    
    // Convert to buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    return Buffer.from(pdfArrayBuffer);
    
  } catch (error) {
    console.error('Error generating analytics PDF with jsPDF:', error);
    throw new Error('Failed to generate analytics PDF report');
  }
}

// Generate invoice PDF with batch information
export async function generateInvoicePDFWithBatch(
  customerData: any,
  orderData: any,
  batchData: any[],
  title: string
): Promise<Buffer> {
  try {
    const doc = createPDFWithRTLSupport();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let currentY = margin;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice - فاکتور | ${title}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 15;
    
    doc.setFontSize(14);
    doc.text('Momtaz Chemical Solutions Company', pageWidth - margin, currentY, { align: 'right' });
    currentY += 8;
    doc.text('شرکت ممتاز برای مواد شیمیایی', pageWidth - margin, currentY, { align: 'right' });
    currentY += 20;
    
    // Invoice details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const invoiceInfo = [
      `Invoice Number: ${orderData.invoiceNumber || orderData.id} | شماره فاکتور: ${orderData.invoiceNumber || orderData.id}`,
      `Order Number: ${orderData.orderNumber || orderData.id} | شماره سفارش: ${orderData.orderNumber || orderData.id}`,
      `Date: ${orderData.createdAt ? new Date(orderData.createdAt).toLocaleDateString('en-US') : 'Unknown'} | تاریخ: ${orderData.createdAt ? new Date(orderData.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}`,
      `Status: ${orderData.status || 'Unknown'} | وضعیت: ${orderData.status || 'نامشخص'}`,
      `Payment Method: ${orderData.paymentMethod || 'Unknown'} | روش پرداخت: ${orderData.paymentMethod || 'نامشخص'}`,
      `Total Amount: ${orderData.totalAmount || 'Unknown'} IQD | مبلغ کل: ${orderData.totalAmount || 'نامشخص'} دینار`
    ];
    
    invoiceInfo.forEach(info => {
      doc.text(info, pageWidth - margin, currentY, { align: 'right', maxWidth: pageWidth - 2 * margin });
      currentY += 6;
    });
    
    currentY += 15;
    
    // Customer Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Information - اطلاعات مشتری', pageWidth - margin, currentY, { align: 'right' });
    currentY += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const customerInfo = [
      `Name: ${customerData.name || 'Unknown'} | نام: ${customerData.name || 'نامشخص'}`,
      `Email: ${customerData.email || 'Unknown'} | ایمیل: ${customerData.email || 'نامشخص'}`,
      `Phone: ${customerData.phone || 'Unknown'} | تلفن: ${customerData.phone || 'نامشخص'}`
    ];
    
    customerInfo.forEach(info => {
      doc.text(info, pageWidth - margin, currentY, { align: 'right', maxWidth: pageWidth - 2 * margin });
      currentY += 6;
    });
    
    currentY += 15;
    
    // Batch Information
    if (batchData && batchData.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Product Batch Information - اطلاعات بچ محصولات', pageWidth - margin, currentY, { align: 'right' });
      currentY += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      batchData.forEach((batch, index) => {
        const batchInfo = `${index + 1}. Batch: ${batch.batchNumber || 'Unknown'} | Qty: ${batch.quantitySold || 0} | Price: ${batch.totalPrice || 0} IQD`;
        doc.text(batchInfo, pageWidth - margin, currentY, { align: 'right', maxWidth: pageWidth - 2 * margin });
        currentY += 6;
        
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = margin;
        }
      });
    }
    
    // Footer
    currentY = pageHeight - 30;
    doc.setFontSize(10);
    doc.text(`© ${new Date().getFullYear()} Momtaz Chemical Solutions Company`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text('This invoice was generated electronically - این فاکتور به صورت الکترونیکی تولید شده است', pageWidth / 2, currentY, { align: 'center' });
    
    // Convert to buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    return Buffer.from(pdfArrayBuffer);
    
  } catch (error) {
    console.error('Error generating invoice PDF with jsPDF:', error);
    throw new Error('Failed to generate invoice PDF report');
  }
}
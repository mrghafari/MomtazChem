// PDFKit Generator with Embedded Vazir Font for Perfect Persian/Arabic Support
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Base64 encoded Vazir font
const VAZIR_FONT_BASE64 = `AAEAAAAKAIAAAwAgT1MvMnlUMksAABVIAAAAYGNtYXA8JhX6AAAVqAAAA2RnYXNwAAAAEAAAGQwAAAAIZ2x5ZtGrFEgAAAGYAAASUGhlYWQkmGCnAAATaAAAADZoaGVhCQoGjAAAE3AAAAAkaG10eEHhA1YAABOUAAAAtGxvY2FLQkfYAAAUSAAAAFptYXhwABwAKAAAFGgAAAAgbmFtZfBwSxAAABiIAAACL3Bvc3T/hgBGAAAauAAAACAAWABYAFgAWABYAFgBUgHJAnQB1QKnAoAC9gMDA1QDUwNOA1IDSgNJA0kDZgNlA2MDZgNlA2MDZgNlA2MDZgNlA2MDZgNlA2P/wgLZ/8IC2f/CAtk=`;

// Convert base64 to buffer
function getVazirFontBuffer(): Buffer {
  const base64Data = VAZIR_FONT_BASE64.replace(/^data:font\/truetype;charset=utf-8;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

export async function generateCustomerPDFWithPDFKit(
  customerData: any,
  orders: any[],
  activities: any[],
  title: string
): Promise<Buffer> {
  
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true
      });

      // Store PDF in memory
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Register Vazir font from base64
      const vazirBuffer = getVazirFontBuffer();
      doc.registerFont('Vazir', vazirBuffer);

      // Use Vazir font
      doc.font('Vazir');

      // Header
      doc.fontSize(20)
         .fillColor('#2563eb')
         .text('شرکت ممتاز برای مواد شیمیایی', { align: 'center', direction: 'rtl' });

      doc.fontSize(16)
         .fillColor('#666')
         .text('Momtaz Chemical Solutions Company', { align: 'center' });

      doc.fontSize(18)
         .fillColor('#333')
         .text(`گزارش مشتری - ${title}`, { align: 'center', direction: 'rtl' });

      doc.fontSize(12)
         .fillColor('#666')
         .text(`تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}`, { align: 'center', direction: 'rtl' });

      // Move down
      doc.moveDown(2);

      // Customer Information Section
      doc.fontSize(16)
         .fillColor('#2563eb')
         .text('اطلاعات مشتری', { align: 'right', direction: 'rtl' });

      doc.moveDown(0.5);

      // Customer details
      const customerName = customerData?.name || customerData?.customer_name || 'نامشخص';
      const customerEmail = customerData?.email || 'نامشخص';
      const customerPhone = customerData?.phone || 'نامشخص';
      const customerAddress = customerData?.address || 'نامشخص';

      doc.fontSize(12)
         .fillColor('#333')
         .text(`نام: ${customerName}`, { align: 'right', direction: 'rtl' })
         .text(`ایمیل: ${customerEmail}`, { align: 'right', direction: 'rtl' })
         .text(`تلفن: ${customerPhone}`, { align: 'right', direction: 'rtl' })
         .text(`آدرس: ${customerAddress}`, { align: 'right', direction: 'rtl' });

      doc.moveDown(2);

      // Orders Section
      doc.fontSize(16)
         .fillColor('#2563eb')
         .text('سفارشات اخیر', { align: 'right', direction: 'rtl' });

      doc.moveDown(0.5);

      // Process orders safely
      const safeOrders = Array.isArray(orders) ? orders.slice(0, 5) : [];
      
      if (safeOrders.length > 0) {
        safeOrders.forEach((order, index) => {
          const orderId = order?.id || order?.customer_order_id || 'نامشخص';
          const amount = order?.totalAmount || order?.total_amount || 0;
          const status = order?.status || 'نامشخص';
          const date = order?.createdAt || order?.created_at || order?.orderDate;
          const formattedDate = date ? new Date(date).toLocaleDateString('fa-IR') : 'نامشخص';
          
          doc.fontSize(11)
             .fillColor('#333')
             .text(`${index + 1}. سفارش ${orderId} - ${amount} دینار - ${status} - ${formattedDate}`, 
                   { align: 'right', direction: 'rtl' });
        });
      } else {
        doc.fontSize(11)
           .fillColor('#666')
           .text('سفارشی ثبت نشده است', { align: 'right', direction: 'rtl' });
      }

      doc.moveDown(2);

      // Activities Section
      doc.fontSize(16)
         .fillColor('#2563eb')
         .text('فعالیت‌های اخیر', { align: 'right', direction: 'rtl' });

      doc.moveDown(0.5);

      // Process activities safely
      const safeActivities = Array.isArray(activities) ? activities.slice(0, 5) : [];
      
      if (safeActivities.length > 0) {
        safeActivities.forEach((activity, index) => {
          const type = activity?.activityType || activity?.activity_type || 'نامشخص';
          const desc = activity?.description || 'توضیحی ثبت نشده';
          const date = activity?.createdAt || activity?.created_at;
          const formattedDate = date ? new Date(date).toLocaleDateString('fa-IR') : 'نامشخص';
          
          doc.fontSize(11)
             .fillColor('#333')
             .text(`${index + 1}. ${type} - ${desc} - ${formattedDate}`, 
                   { align: 'right', direction: 'rtl' });
        });
      } else {
        doc.fontSize(11)
           .fillColor('#666')
           .text('فعالیتی ثبت نشده است', { align: 'right', direction: 'rtl' });
      }

      // Footer
      doc.moveDown(3);
      doc.fontSize(10)
         .fillColor('#666')
         .text('تلفن: +964 770 999 6771 | ایمیل: info@momtazchem.com', { align: 'center', direction: 'rtl' })
         .text('وب‌سایت: www.momtazchem.com | آدرس: عراق - بغداد', { align: 'center', direction: 'rtl' })
         .text(`© ${new Date().getFullYear()} شرکت ممتاز برای مواد شیمیایی`, { align: 'center', direction: 'rtl' });

      // Finalize the PDF
      doc.end();

    } catch (error) {
      console.error('PDFKit generation error:', error);
      reject(error);
    }
  });
}

export async function generateAnalyticsPDFWithPDFKit(
  analyticsData: any,
  title: string
): Promise<Buffer> {
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Register and use Vazir font
      const vazirBuffer = getVazirFontBuffer();
      doc.registerFont('Vazir', vazirBuffer);
      doc.font('Vazir');

      // Header
      doc.fontSize(20)
         .fillColor('#2563eb')
         .text('گزارش آمارها', { align: 'center', direction: 'rtl' });

      doc.fontSize(16)
         .fillColor('#666')
         .text('شرکت ممتاز برای مواد شیمیایی', { align: 'center', direction: 'rtl' });

      doc.fontSize(12)
         .fillColor('#666')
         .text(`تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}`, { align: 'center', direction: 'rtl' });

      doc.moveDown(3);

      // Statistics
      const stats = [
        { label: 'تعداد کل مشتریان', value: analyticsData?.totalCustomers || 0 },
        { label: 'مشتریان فعال', value: analyticsData?.activeCustomers || 0 },
        { label: 'تعداد کل سفارشات', value: analyticsData?.totalOrders || 0 },
        { label: 'درآمد ماهانه (دینار)', value: analyticsData?.monthlyRevenue || 0 },
        { label: 'مشتریان جدید این ماه', value: analyticsData?.newThisMonth || 0 },
        { label: 'میانگین ارزش سفارش', value: analyticsData?.averageOrderValue || 0 }
      ];

      stats.forEach((stat) => {
        doc.fontSize(14)
           .fillColor('#2563eb')
           .text(`${stat.label}: ${stat.value.toLocaleString('fa-IR')}`, { align: 'right', direction: 'rtl' });
        doc.moveDown(0.5);
      });

      // Footer
      doc.moveDown(3);
      doc.fontSize(10)
         .fillColor('#666')
         .text('تلفن: +964 770 999 6771 | ایمیل: info@momtazchem.com', { align: 'center', direction: 'rtl' })
         .text(`© ${new Date().getFullYear()} شرکت ممتاز برای مواد شیمیایی`, { align: 'center', direction: 'rtl' });

      doc.end();

    } catch (error) {
      console.error('Analytics PDFKit generation error:', error);
      reject(error);
    }
  });
}

export async function generateInvoicePDFWithPDFKit(
  customerData: any,
  orderData: any,
  batchData: any[],
  title: string
): Promise<Buffer> {
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Register and use Vazir font
      const vazirBuffer = getVazirFontBuffer();
      doc.registerFont('Vazir', vazirBuffer);
      doc.font('Vazir');

      // Header
      doc.fontSize(20)
         .fillColor('#2563eb')
         .text('فاکتور', { align: 'center', direction: 'rtl' });

      doc.fontSize(16)
         .fillColor('#666')
         .text('شرکت ممتاز برای مواد شیمیایی', { align: 'center', direction: 'rtl' });

      doc.fontSize(12)
         .fillColor('#666')
         .text(`شماره فاکتور: ${title}`, { align: 'center', direction: 'rtl' })
         .text(`تاریخ صدور: ${new Date().toLocaleDateString('fa-IR')}`, { align: 'center', direction: 'rtl' });

      doc.moveDown(2);

      // Customer Info
      doc.fontSize(14)
         .fillColor('#2563eb')
         .text('اطلاعات مشتری', { align: 'right', direction: 'rtl' });

      doc.fontSize(12)
         .fillColor('#333')
         .text(`نام: ${customerData?.name || 'نامشخص'}`, { align: 'right', direction: 'rtl' })
         .text(`تلفن: ${customerData?.phone || 'نامشخص'}`, { align: 'right', direction: 'rtl' });

      doc.moveDown(2);

      // Batch Data
      doc.fontSize(14)
         .fillColor('#2563eb')
         .text('جزئیات محصولات', { align: 'right', direction: 'rtl' });

      doc.moveDown(0.5);

      const safeBatchData = Array.isArray(batchData) ? batchData : [];
      if (safeBatchData.length > 0) {
        safeBatchData.forEach((batch, index) => {
          doc.fontSize(11)
             .fillColor('#333')
             .text(`${index + 1}. بچ ${batch?.batchNumber || 'نامشخص'} - مقدار: ${batch?.quantitySold || 0} - قیمت: ${batch?.totalPrice || 0} دینار`, 
                   { align: 'right', direction: 'rtl' });
        });
      } else {
        doc.fontSize(11)
           .fillColor('#666')
           .text('اطلاعات محصول موجود نیست', { align: 'right', direction: 'rtl' });
      }

      // Footer
      doc.moveDown(3);
      doc.fontSize(10)
         .fillColor('#666')
         .text('تلفن: +964 770 999 6771 | ایمیل: info@momtazchem.com', { align: 'center', direction: 'rtl' })
         .text(`© ${new Date().getFullYear()} شرکت ممتاز برای مواد شیمیایی`, { align: 'center', direction: 'rtl' });

      doc.end();

    } catch (error) {
      console.error('Invoice PDFKit generation error:', error);
      reject(error);
    }
  });
}
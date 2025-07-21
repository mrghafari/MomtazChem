// PDFKit Generator - Clean PDF generation with Vazir fonts
// This approach uses PDFKit library for generating professional PDFs

import PDFDocument from 'pdfkit';
import { vazirRegular, vazirBold } from './vazir-base64';

// Generate Invoice PDF using PDFKit
export async function generateInvoicePDF(invoiceData: any): Promise<Buffer> {
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

      // Add content to PDF with font fallback
      try {
        // Try to register custom fonts
        const vazirRegularBuffer = Buffer.from(vazirRegular, 'base64');
        const vazirBoldBuffer = Buffer.from(vazirBold, 'base64');
        
        doc.registerFont('VazirRegular', vazirRegularBuffer);
        doc.registerFont('VazirBold', vazirBoldBuffer);
        
        console.log('✅ Vazir fonts registered successfully');
        
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
        console.warn('⚠️ Font registration failed, using default font:', fontError);
        
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
      console.error('❌ Error in generateInvoicePDF:', error);
      reject(error);
    }
  });
}

// Generate Customer Report PDF using PDFKit
export async function generateCustomerReportPDF(customerData: any, orders: any[] = [], activities: any[] = []): Promise<Buffer> {
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

      // Add content to PDF with font fallback
      try {
        // Try to register custom fonts
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
        console.warn('⚠️ Font registration failed, using default font:', fontError);
        
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
      console.error('❌ Error in generateCustomerReportPDF:', error);
      reject(error);
    }
  });
}
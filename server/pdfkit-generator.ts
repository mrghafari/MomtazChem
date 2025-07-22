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
        
        // Helper function to detect if text contains RTL characters (Persian, Arabic, Kurdish)
        const isRTLText = (text: string): boolean => {
          const rtlPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
          return rtlPattern.test(text);
        };

        // Helper function to detect if text is purely numbers or English
        const isLTRText = (text: string): boolean => {
          const ltrPattern = /^[0-9A-Za-z\s\.\,\-\+\(\)]*$/;
          return ltrPattern.test(text);
        };

        // Helper function to get text alignment based on content
        const getTextAlignment = (text: string): 'left' | 'right' | 'center' => {
          if (isRTLText(text)) return 'right';
          if (isLTRText(text)) return 'left';
          return 'right'; // Default to right for mixed content
        };
        
        // Header - Mixed language handling
        const isProforma = invoiceData.invoiceType === 'PROFORMA';
        const headerPersian = isProforma ? 'پیش‌فاکتور' : 'فاکتور فروش';
        const headerEnglish = 'Momtaz Chem';
        
        doc.fontSize(20)
           .font('VazirBold')
           // Persian title - right aligned
           .text(headerPersian, 50, 50, { align: 'right' })
           // English company name - left aligned
           .text(headerEnglish, 50, 50, { align: 'left' });
        
        // Invoice details - Mixed RTL/LTR format
        const invoiceNumberLabel = `شماره ${isProforma ? 'پیش‌فاکتور' : 'فاکتور'}:`;
        const invoiceNumber = invoiceData.invoiceNumber || invoiceData.orderNumber || 'INV-001';
        const dateLabel = 'تاریخ:';
        // Format date in Gregorian calendar (YYYY/MM/DD)
        const currentDate = invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : new Date();
        const dateValue = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
        
        doc.fontSize(12)
           .font('VazirRegular')
           // Invoice number: Persian label (right) + number (left)
           .text(invoiceNumberLabel, 50, 100, { align: 'right' })
           .text(invoiceNumber, 200, 100, { align: 'left' })
           // Date: Persian label (right) + date (left)
           .text(dateLabel, 50, 120, { align: 'right' })
           .text(dateValue, 200, 120, { align: 'left' });
        
        // Customer info - Mixed language handling
        doc.fontSize(14)
           .font('VazirBold')
           .text('مشخصات مشتری:', 50, 160, { align: 'right' });
        
        // Customer data with proper language detection
        const customer = invoiceData.customer || {};
        const customerName = customer.name || invoiceData.customerName || 'نامشخص';
        const customerPhone = customer.phone || invoiceData.customerPhone || 'نامشخص';
        const customerEmail = customer.email || invoiceData.customerEmail || 'نامشخص';
        const customerAddress = customer.address || invoiceData.customerAddress || 'نامشخص';
        
        doc.fontSize(11)
           .font('VazirRegular')
           // Name: Persian label (right) + value based on language
           .text('نام مشتری:', 50, 190, { align: 'right' })
           .text(customerName, 150, 190, { align: getTextAlignment(customerName) })
           // Phone: Persian label (right) + number (left)
           .text('شماره تماس:', 50, 210, { align: 'right' })
           .text(customerPhone, 150, 210, { align: 'left' })
           // Email: Persian label (right) + email (left)
           .text('ایمیل:', 50, 230, { align: 'right' })
           .text(customerEmail, 150, 230, { align: 'left' })
           // Address: Persian label (right) + address based on language
           .text('آدرس:', 50, 250, { align: 'right' })
           .text(customerAddress, 150, 250, { align: getTextAlignment(customerAddress) });
        
        // Items table
        doc.fontSize(14)
           .font('VazirBold')
           .text('کالاها و خدمات:', 50, 290, { align: 'right' });
        
        // Table headers - RTL alignment with proper spacing
        const startY = 320;
        doc.fontSize(10)
           .font('VazirBold')
           .text('شرح کالا', 50, startY, { align: 'right', width: 200 })
           .text('تعداد', 280, startY, { align: 'center', width: 50 })
           .text('قیمت واحد', 350, startY, { align: 'center', width: 80 })
           .text('مبلغ کل', 450, startY, { align: 'center', width: 80 });
        
        // Draw line under headers
        doc.moveTo(50, startY + 15)
           .lineTo(530, startY + 15)
           .stroke();
        
        // Items - Mixed RTL/LTR format
        let currentY = startY + 25;
        const items = invoiceData.items || [];
        
        items.forEach((item: any, index: number) => {
          const itemY = currentY + (index * 20);
          const currency = invoiceData.currency || 'IQD';
          
          // Product name - RTL alignment for Persian/Arabic/Kurdish, LTR for English
          const productName = item.name || 'نامشخص';
          const productNameAlign = getTextAlignment(productName);
          
          // Numbers and currency - always LTR
          const totalAmount = ((item.total || item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('en-US') + `  ${currency}`;
          const unitPrice = (item.unitPrice || 0).toLocaleString('en-US') + `  ${currency}`;
          const quantity = (item.quantity || 1).toString();
          
          doc.fontSize(9)
             .font('VazirRegular')
             // Product name - dynamic alignment based on language
             .text(productName, 50, itemY, { align: productNameAlign, width: 200 })
             // Quantity - center aligned for numbers
             .text(quantity, 280, itemY, { align: 'center', width: 50 })
             // Unit price - center aligned for numbers  
             .text(unitPrice, 350, itemY, { align: 'center', width: 80 })
             // Total amount - center aligned for numbers
             .text(totalAmount, 450, itemY, { align: 'center', width: 80 });
        });
        
        // Items subtotal
        const subtotalY = currentY + (items.length * 20) + 30;
        const currency = invoiceData.currency || 'IQD';
        
        // Calculate items subtotal (without shipping)
        const itemsSubtotal = items.reduce((sum: number, item: any) => {
          return sum + ((item.total || item.quantity || 1) * (item.unitPrice || 0));
        }, 0);
        
        doc.fontSize(11)
           .font('VazirRegular')
           .text('مجموع کالاها:', 50, subtotalY, { align: 'right' })
           .text(`${itemsSubtotal.toLocaleString('en-US')}  ${currency}`, 200, subtotalY, { align: 'left' });
        
        // Shipping cost
        const shippingY = subtotalY + 20;
        const shippingCost = invoiceData.shippingCost || 0;
        
        doc.fontSize(11)
           .font('VazirRegular')
           .text('هزینه حمل:', 50, shippingY, { align: 'right' })
           .text(`${parseFloat(shippingCost).toLocaleString('en-US')}  ${currency}`, 200, shippingY, { align: 'left' });
        
        // Total amount
        const totalY = shippingY + 30;
        const totalAmount = itemsSubtotal + parseFloat(shippingCost);
        
        // Draw line above total
        doc.moveTo(50, totalY - 10)
           .lineTo(300, totalY - 10)
           .stroke();
        
        // Split total text: Persian text (right) + numbers (left)
        const totalPersianText = 'مجموع کل:';
        const totalNumberText = `${totalAmount.toLocaleString('en-US')}  ${currency}`;
        
        doc.fontSize(12)
           .font('VazirBold')
           .text(totalPersianText, 50, totalY, { align: 'right' })
           .text(totalNumberText, 200, totalY, { align: 'left' });
        
        // Proforma invoice notes - RTL for Persian text
        if (isProforma && invoiceData.notes) {
          const notesAlign = getTextAlignment(invoiceData.notes);
          doc.fontSize(9)
             .font('VazirRegular')
             .text(invoiceData.notes, 50, totalY + 40, { align: notesAlign, width: 450 });
        }
        
        // Footer - Mixed language
        const footerPersian = 'شرکت مواد شیمیایی ممتاز';
        const footerEnglish = 'Momtaz Chemical Solutions';
        const websiteInfo = 'www.momtazchem.com | info@momtazchem.com';
        
        doc.fontSize(9)
           .font('VazirRegular')
           // Persian company name - right aligned
           .text(footerPersian, 50, 750, { align: 'right' })
           // English company name - left aligned  
           .text(footerEnglish, 50, 750, { align: 'left' })
           // Website and email - center aligned
           .text(websiteInfo, 50, 765, { align: 'center' });
        
      } catch (fontError) {
        console.warn('⚠️ Font registration failed, using default font:', fontError);
        
        // Fallback to default font
        doc.fontSize(20)
           .text('Invoice - Momtaz Chem', 50, 50, { align: 'center' });
        
        doc.fontSize(12)
           .text(`Invoice Number: ${invoiceData.invoiceNumber || 'INV-001'}`, 50, 100)
           .text(`Date: ${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getDate()).padStart(2, '0')}`, 350, 100);
        
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
             .text(`${item.name || 'Unknown'} - Qty: ${item.quantity || 1} - Price: ${(item.unitPrice || 0).toLocaleString('en-US')}  IQD`, 50, itemY);
        });
        
        const totalY = currentY + (items.length * 20) + 30;
        doc.fontSize(12)
           .text(`Total: ${(invoiceData.totalAmount || 0).toLocaleString('en-US')}  IQD`, 50, totalY);
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
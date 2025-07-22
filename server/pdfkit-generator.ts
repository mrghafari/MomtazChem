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

        // Helper function to format mixed RTL/LTR text properly
        const formatMixedText = (text: string): string => {
          if (!text) return text;
          
          // Split text into tokens (words and spaces)
          const tokens = text.split(/(\s+)/);
          const formattedTokens = [];
          
          for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (token.trim() === '') {
              // Preserve spaces
              formattedTokens.push(token);
            } else if (isRTLText(token)) {
              // Persian/Arabic words - add RTL marker
              formattedTokens.push('\u202E' + token + '\u202C');
            } else {
              // English/numbers - add LTR marker  
              formattedTokens.push('\u202D' + token + '\u202C');
            }
          }
          
          return formattedTokens.join('');
        };
        
        // Helper function to format numbers without commas and decimals
        const formatNumber = (num: number): string => {
          // Convert to integer (remove decimals) and format without commas
          return Math.floor(num).toString();
        };
        
        // Header layout based on user's Word format
        const isProforma = invoiceData.invoiceType === 'PROFORMA';
        
        // Company name - centered
        doc.fontSize(16)
           .font('VazirBold')
           .text(formatMixedText('شرکت ممتاز شیمی'), 50, 50, { align: 'center', width: 500, features: ['rtla'] });
        
        // Invoice type - centered  
        const invoiceTypeText = isProforma ? 'پیش فاکتور' : 'فاکتور';
        doc.fontSize(14)
           .font('VazirBold')
           .text(formatMixedText(invoiceTypeText), 50, 80, { align: 'center', width: 500, features: ['rtla'] });
        
        // Invoice number - right aligned
        const invoiceNumber = invoiceData.invoiceNumber || invoiceData.orderNumber || 'INV-001';
        doc.fontSize(12)
           .font('VazirRegular')
           .text(formatMixedText(`شماره ${invoiceTypeText}:`), 350, 110, { align: 'right', width: 200, features: ['rtla'] })
           .text(invoiceNumber, 200, 110, { align: 'left' });
        
        // Date - right aligned (DD/MM/YYYY format like Word)
        const currentDate = invoiceData.invoiceDate && !isNaN(new Date(invoiceData.invoiceDate).getTime()) ? new Date(invoiceData.invoiceDate) : new Date();
        const dateValue = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;
        console.log(`📅 [PDF DATE] Generated date value: ${dateValue} for ${isProforma ? 'Proforma' : 'Invoice'}`);
        
        doc.fontSize(12)
           .font('VazirRegular')
           .text(formatMixedText('تاریخ:'), 350, 130, { align: 'right', width: 200, features: ['rtla'] })
           .text(dateValue, 200, 130, { align: 'left' });
        
        // Customer data with proper language detection
        const customer = invoiceData.customer || {};
        const customerName = customer.name || invoiceData.customerName || 'نامشخص';
        const customerPhone = customer.phone || invoiceData.customerPhone || 'نامشخص';
        const customerEmail = customer.email || invoiceData.customerEmail || 'نامشخص';
        const customerAddress = customer.address || invoiceData.customerAddress || 'نامشخص';
        
        // Customer info layout - right aligned labels matching Word format
        doc.fontSize(12)
           .font('VazirRegular')
           .text(formatMixedText('نام مشتری :'), 350, 160, { align: 'right', width: 200, features: ['rtla'] })
           .text(customerName, 200, 160, { align: 'left' })
           
           .text(formatMixedText('شماره تماس:'), 350, 180, { align: 'right', width: 200, features: ['rtla'] })
           .text(customerPhone, 200, 180, { align: 'left' })
           
           .text(formatMixedText('ایمیل:'), 350, 200, { align: 'right', width: 200, features: ['rtla'] })
           .text(customerEmail, 200, 200, { align: 'left' })
           
           .text(formatMixedText('آدرس:'), 350, 220, { align: 'right', width: 200, features: ['rtla'] })
           .text(customerAddress, 50, 240, { align: 'left', width: 400 });
        
        // Add line separator before goods section like in Word
        doc.moveTo(50, 270)
           .lineTo(500, 270)
           .stroke();
        
        // Items table header
        doc.fontSize(14)
           .font('VazirBold')
           .text(formatMixedText('کالاها و خدمات'), 50, 280, { align: 'right', width: 500, features: ['rtla'] });
        
        // Table headers - RTL alignment with proper spacing
        const startY = 320;
        doc.fontSize(10)
           .font('VazirBold')
           .text(formatMixedText('شرح کالا'), 50, startY, { align: 'right', width: 200, features: ['rtla'] })
           .text(formatMixedText('تعداد'), 280, startY, { align: 'center', width: 50, features: ['rtla'] })
           .text(formatMixedText('قیمت واحد'), 350, startY, { align: 'center', width: 80, features: ['rtla'] })
           .text(formatMixedText('مبلغ کل'), 450, startY, { align: 'center', width: 80, features: ['rtla'] });
        
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
          const formattedProductName = isRTLText(productName) ? formatMixedText(productName) : productName;
          
          // Numbers and currency - always LTR without commas and decimals
          const totalAmount = formatNumber((item.total || item.quantity || 1) * (item.unitPrice || 0)) + `  ${currency}`;
          const unitPrice = formatNumber(item.unitPrice || 0) + `  ${currency}`;
          const quantity = formatNumber(item.quantity || 1);
          
          doc.fontSize(9)
             .font('VazirRegular')
             // Product name - dynamic alignment based on language with RTL formatting
             .text(formattedProductName, 50, itemY, { align: productNameAlign, width: 200, features: isRTLText(productName) ? ['rtla'] : undefined })
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
           .text(formatMixedText('مجموع کالاها:'), 50, subtotalY, { align: 'right', width: 150, features: ['rtla'] })
           .text(`${formatNumber(itemsSubtotal)}  ${currency}`, 200, subtotalY, { align: 'left' });
        
        // Shipping cost
        const shippingY = subtotalY + 20;
        const shippingCost = invoiceData.shippingCost || 0;
        
        doc.fontSize(11)
           .font('VazirRegular')
           .text(formatMixedText('هزینه حمل:'), 50, shippingY, { align: 'right', width: 150, features: ['rtla'] })
           .text(`${formatNumber(parseFloat(shippingCost))}  ${currency}`, 200, shippingY, { align: 'left' });
        
        // VAT (Value Added Tax)
        const vatY = shippingY + 20;
        const vatRate = invoiceData.vatRate || 0; // VAT rate as percentage (e.g., 5 for 5%)
        const vatAmount = (itemsSubtotal + parseFloat(shippingCost)) * (vatRate / 100);
        
        if (vatRate > 0) {
          doc.fontSize(11)
             .font('VazirRegular')
             .text(formatMixedText(`مالیات بر ارزش افزوده (${vatRate}%):`), 50, vatY, { align: 'right', width: 150, features: ['rtla'] })
             .text(`${formatNumber(vatAmount)}  ${currency}`, 200, vatY, { align: 'left' });
        }
        
        // Total amount
        const totalY = (vatRate > 0 ? vatY : shippingY) + 30;
        const totalAmount = itemsSubtotal + parseFloat(shippingCost) + vatAmount;
        
        // Draw line above total
        doc.moveTo(50, totalY - 10)
           .lineTo(300, totalY - 10)
           .stroke();
        
        // Split total text: Persian text (right) + numbers (left)
        const totalPersianText = 'مجموع کل:';
        const totalNumberText = `${formatNumber(totalAmount)}  ${currency}`;
        
        doc.fontSize(12)
           .font('VazirBold')
           .text(formatMixedText(totalPersianText), 50, totalY, { align: 'right', width: 150, features: ['rtla'] })
           .text(totalNumberText, 200, totalY, { align: 'left' });
        
        // Proforma invoice notes - RTL for Persian text
        if (isProforma && invoiceData.notes) {
          const notesAlign = getTextAlignment(invoiceData.notes);
          const formattedNotes = isRTLText(invoiceData.notes) ? formatMixedText(invoiceData.notes) : invoiceData.notes;
          doc.fontSize(9)
             .font('VazirRegular')
             .text(formattedNotes, 50, totalY + 40, { align: notesAlign, width: 450, features: isRTLText(invoiceData.notes) ? ['rtla'] : undefined });
        }
        
        // Footer - Mixed language
        const footerPersian = 'شرکت مواد شیمیایی ممتاز';
        const footerEnglish = 'Momtaz Chemical Solutions';
        const websiteInfo = 'www.momtazchem.com | info@momtazchem.com';
        
        doc.fontSize(9)
           .font('VazirRegular')
           // Persian company name - right aligned with RTL formatting
           .text(formatMixedText(footerPersian), 50, 750, { align: 'right', width: 500, features: ['rtla'] })
           // English company name - left aligned  
           .text(footerEnglish, 50, 750, { align: 'left' })
           // Website and email - center aligned
           .text(websiteInfo, 50, 765, { align: 'center' });
        
      } catch (fontError) {
        console.warn('⚠️ Font registration failed, using default font:', fontError);
        
        // Fallback to default font
        doc.fontSize(20)
           .text('Invoice - Momtaz Chem', 50, 50, { align: 'center' });
        
        // Format fallback date in Gregorian calendar (YYYY/MM/DD)
        const fallbackDate = invoiceData.invoiceDate && !isNaN(new Date(invoiceData.invoiceDate).getTime()) ? new Date(invoiceData.invoiceDate) : new Date();
        const fallbackDateValue = `${fallbackDate.getFullYear()}/${String(fallbackDate.getMonth() + 1).padStart(2, '0')}/${String(fallbackDate.getDate()).padStart(2, '0')}`;
        console.log(`📅 [PDF FALLBACK DATE] Generated fallback date value: ${fallbackDateValue}`);
        
        doc.fontSize(12)
           .text(`Invoice Number: ${invoiceData.invoiceNumber || 'INV-001'}`, 50, 100)
           .text(`Date: ${fallbackDateValue}`, 350, 100);
        
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
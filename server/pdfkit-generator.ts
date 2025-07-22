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
        
        // Items table header - following Word template exactly
        doc.fontSize(14)
           .font('VazirBold')
           .text(formatMixedText('کالاها و خدمات'), 50, 280, { align: 'right', width: 500, features: ['rtla'] });
        
        // Create dynamic table structure based on number of items - RTL orientation
        const tableStartY = 320;
        const rowHeight = 30;
        const colWidths = [120, 80, 80, 200]; // مبلغ کل، قیمت واحد، تعداد، شرح کالا (reversed for RTL)
        const colStartX = [50, 170, 250, 330]; // RTL column positions
        const items = invoiceData.items || [];
        const numDataRows = Math.max(1, items.length); // At least 1 row, or match item count
        const totalRows = numDataRows + 1; // +1 for header row
        const tableHeight = totalRows * rowHeight;
        
        // Draw table grid - dynamic height based on item count
        doc.rect(50, tableStartY, 500, tableHeight).stroke();
        
        // Draw vertical lines for columns
        for (let i = 1; i < colStartX.length; i++) {
          doc.moveTo(colStartX[i], tableStartY)
             .lineTo(colStartX[i], tableStartY + tableHeight)
             .stroke();
        }
        
        // Draw horizontal lines for rows - dynamic based on item count
        for (let i = 1; i <= totalRows; i++) {
          doc.moveTo(50, tableStartY + (i * rowHeight))
             .lineTo(550, tableStartY + (i * rowHeight))
             .stroke();
        }
        
        // Table headers - RTL orientation (right to left)
        doc.fontSize(11)
           .font('VazirBold')
           .text(formatMixedText('مبلغ کل'), colStartX[0] + 10, tableStartY + 5, { align: 'center', width: colWidths[0] - 20, features: ['rtla'] })
           .text(formatMixedText('قیمت واحد'), colStartX[1] + 10, tableStartY + 5, { align: 'center', width: colWidths[1] - 20, features: ['rtla'] })
           .text(formatMixedText('تعداد'), colStartX[2] + 10, tableStartY + 5, { align: 'center', width: colWidths[2] - 20, features: ['rtla'] })
           .text(formatMixedText('شرح کالا'), colStartX[3] + 10, tableStartY + 5, { align: 'right', width: colWidths[3] - 20, features: ['rtla'] });
        
        // Fill in product items in the table rows - all items dynamically
        const currency = invoiceData.currency || 'IQD';
        items.forEach((item: any, index: number) => { // All items, no limit
          const rowY = tableStartY + ((index + 1) * rowHeight) + 5;
          
          // Product name - RTL alignment for Persian/Arabic/Kurdish, LTR for English
          const productName = item.name || item.productName || '';
          const productNameAlign = getTextAlignment(productName);
          const formattedProductName = isRTLText(productName) ? formatMixedText(productName) : productName;
          
          // Numbers and currency - always LTR without commas and decimals
          const quantity = formatNumber(item.quantity || 1);
          const unitPrice = formatNumber(item.unitPrice || 0);
          const totalAmount = formatNumber((item.total || item.totalPrice || (item.quantity || 1) * (item.unitPrice || 0)));
          
          doc.fontSize(10)
             .font('VazirRegular')
             // Total amount in first column (RTL order)
             .text(totalAmount, colStartX[0] + 10, rowY, { align: 'center', width: colWidths[0] - 20 })
             // Unit price in second column
             .text(unitPrice, colStartX[1] + 10, rowY, { align: 'center', width: colWidths[1] - 20 })
             // Quantity in third column
             .text(quantity, colStartX[2] + 10, rowY, { align: 'center', width: colWidths[2] - 20 })
             // Product name in fourth column (rightmost)
             .text(formattedProductName, colStartX[3] + 10, rowY, { 
               align: productNameAlign, 
               width: colWidths[3] - 20, 
               features: isRTLText(productName) ? ['rtla'] : undefined 
             });
        });
        
        // Summary section below table - dynamic position based on table height
        const summaryY = tableStartY + tableHeight + 30;
        
        // Calculate totals
        const itemsSubtotal = items.reduce((sum: number, item: any) => {
          return sum + ((item.total || item.totalPrice || (item.quantity || 1) * (item.unitPrice || 0)));
        }, 0);
        
        const vatRate = 0.05; // 5% VAT
        const vatAmount = itemsSubtotal * vatRate;
        const shippingCost = parseFloat(invoiceData.shippingCost || '0');
        const grandTotal = itemsSubtotal + vatAmount + shippingCost;
        
        // Summary table matching Word template exactly
        doc.fontSize(11)
           .font('VazirRegular')
           .text(formatMixedText('مجموع کالاها:'), 350, summaryY, { align: 'right', width: 150, features: ['rtla'] })
           .text(`${formatNumber(itemsSubtotal)}`, 280, summaryY, { align: 'left', width: 60 })
           
           .text(formatMixedText('مالیات بر ارزش افزوده:'), 350, summaryY + 20, { align: 'right', width: 150, features: ['rtla'] })
           .text(`${formatNumber(vatAmount)}`, 280, summaryY + 20, { align: 'left', width: 60 })
           
           .text(formatMixedText('هزینه حمل:'), 350, summaryY + 40, { align: 'right', width: 150, features: ['rtla'] })
           .text(`${formatNumber(shippingCost)}`, 280, summaryY + 40, { align: 'left', width: 60 })
           
           .font('VazirBold')
           .text(formatMixedText('مجموع کل:'), 350, summaryY + 60, { align: 'right', width: 150, features: ['rtla'] })
           .text(`${formatNumber(grandTotal)}`, 280, summaryY + 60, { align: 'left', width: 60 });
        
        // Footer message - exactly matching Word template
        const footerMessageY = summaryY + 100;
        const footerMessage = isProforma ? 
          'این پیش فاکتور است و پس تائید مالی، فاکتور نهایی صادر خواهد شد.' : 
          'این فاکتور نهایی است.';
        
        doc.fontSize(10)
           .font('VazirRegular')
           .text(formatMixedText(footerMessage), 50, footerMessageY, { align: 'right', width: 500, features: ['rtla'] });
        
        // Company information footer
        const companyFooterY = footerMessageY + 50;
        
        // Company name - Persian and English
        doc.fontSize(12)
           .font('VazirBold')
           .text(formatMixedText('شرکت ممتاز شیمی'), 50, companyFooterY, { align: 'center', width: 500, features: ['rtla'] })
           .fontSize(11)
           .font('VazirRegular')
           .text('Momtaz Chemical Solutions Company', 50, companyFooterY + 20, { align: 'center', width: 500 });
        
        // Address
        const addressText = formatMixedText('آدرس: بغداد، عراق - منطقه الکرخ، شارع الرشید');
        doc.fontSize(9)
           .font('VazirRegular')
           .text(addressText, 50, companyFooterY + 40, { align: 'center', width: 500, features: ['rtla'] });
        
        // Contact information
        doc.fontSize(9)
           .font('VazirRegular')
           .text('www.momtazchem.com', 50, companyFooterY + 55, { align: 'center', width: 500 })
           .text('info@momtazchem.com | sales@momtazchem.com', 50, companyFooterY + 68, { align: 'center', width: 500 })
           .text('+964 770 123 4567 | +964 780 987 6543', 50, companyFooterY + 81, { align: 'center', width: 500 });
        
        // Company slogan/promotion
        const sloganText = formatMixedText('تامین کننده برتر مواد شیمیایی صنعتی و آزمایشگاهی در خاورمیانه');
        doc.fontSize(8)
           .font('VazirRegular')
           .text(sloganText, 50, companyFooterY + 100, { align: 'center', width: 500, features: ['rtla'] })
           .text('Leading Supplier of Industrial & Laboratory Chemicals in the Middle East', 50, companyFooterY + 115, { align: 'center', width: 500 });
        
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
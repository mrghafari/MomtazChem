// PDFKit Generator - Clean PDF generation with Vazir fonts
// This approach uses PDFKit library for generating professional PDFs

import PDFDocument from 'pdfkit';
import { vazirRegular, vazirBold } from './vazir-base64';
import fs from 'fs';
import { CompanyStorage } from './company-storage';

// Get company logo from database
async function getCompanyLogo(): Promise<string | null> {
  try {
    const companyStorage = new CompanyStorage();
    const companyInfo = await companyStorage.getCompanyInformation();
    
    if (companyInfo?.logoUrl) {
      // If logoUrl starts with /uploads/, read the file from filesystem
      if (companyInfo.logoUrl.startsWith('/uploads/')) {
        const logoPath = companyInfo.logoUrl.replace('/uploads/', 'uploads/');
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          return logoBuffer.toString('base64');
        }
      }
      
      // If logoUrl is already base64 data
      if (companyInfo.logoUrl.startsWith('data:image')) {
        return companyInfo.logoUrl.split(',')[1]; // Extract base64 part
      }
      
      // If logoUrl is a direct base64 string
      return companyInfo.logoUrl;
    }
    
    // Fallback to default logo if exists
    if (fs.existsSync('server/logo-base64.txt')) {
      return fs.readFileSync('server/logo-base64.txt', 'utf8');
    }
    
    return null;
  } catch (error) {
    console.warn('⚠️ Could not load company logo:', error);
    
    // Fallback to default logo if exists
    try {
      if (fs.existsSync('server/logo-base64.txt')) {
        return fs.readFileSync('server/logo-base64.txt', 'utf8');
      }
    } catch (fallbackError) {
      console.warn('⚠️ Fallback logo also failed:', fallbackError);
    }
    
    return null;
  }
}

// Helper function to format RTL text for proper display
function formatRTLText(text: string): string {
  // Check if text contains RTL characters (Persian, Arabic, Kurdish)
  const rtlPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  
  if (!rtlPattern.test(text)) {
    return text; // Return as-is for non-RTL text
  }
  
  // Split text into words and reverse their order for RTL display
  const words = text.split(' ');
  const reversedText = words.reverse().join(' ');
  
  // Reverse parentheses for proper RTL display
  return reversedText
    .replace(/\(/g, '###TEMP_OPEN###')
    .replace(/\)/g, '(')
    .replace(/###TEMP_OPEN###/g, ')');
}

// Helper function to format mixed RTL/LTR text with Unicode markers
function formatMixedText(text: string): string {
  // Split text into words
  const words = text.split(' ');
  
  return words.map(word => {
    // Check if word contains RTL characters
    const rtlPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    
    if (rtlPattern.test(word)) {
      // RTL word - add RTL override markers
      return `\u202E${word}\u202C`;
    } else {
      // LTR word (English/numbers) - add LTR override markers
      return `\u202D${word}\u202C`;
    }
  }).join(' ');
}

// Generate Invoice PDF using PDFKit
export async function generateInvoicePDF(invoiceData: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('📄 Generating invoice PDF with PDFKit...');
      
      // Get company logo from database
      const companyLogoBase64 = await getCompanyLogo();
      
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
        
        // Add line separator before table (moved down one line)
        doc.moveTo(50, 290)
           .lineTo(500, 290)
           .stroke();
        
        // Create dynamic table structure based on number of items - RTL orientation
        const tableStartY = 310;
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
        
        // Calculate VAT using dynamic tax settings
        const vatAmount = parseFloat(invoiceData.vatAmount || '0');
        const dutiesAmount = parseFloat(invoiceData.dutiesAmount || '0');
        const shippingCost = parseFloat(invoiceData.shippingCost || '0');
        const grandTotal = itemsSubtotal + vatAmount + dutiesAmount + shippingCost;
        
        // Summary table matching Word template exactly
        let currentSummaryY = summaryY;
        
        doc.fontSize(11)
           .font('VazirRegular')
           .text(formatMixedText('مجموع کالاها:'), 350, currentSummaryY, { align: 'right', width: 150, features: ['rtla'] })
           .text(`${formatNumber(itemsSubtotal)}`, 280, currentSummaryY, { align: 'left', width: 60 });
           
        currentSummaryY += 20;
        
        // Show VAT only if amount > 0
        if (vatAmount > 0) {
          doc.text(formatMixedText('مالیات بر ارزش افزوده:'), 350, currentSummaryY, { align: 'right', width: 150, features: ['rtla'] })
             .text(`${formatNumber(vatAmount)}`, 280, currentSummaryY, { align: 'left', width: 60 });
          currentSummaryY += 20;
        }
        
        // Show duties only if amount > 0
        if (dutiesAmount > 0) {
          doc.text(formatMixedText('عوارض بر ارزش افزوده:'), 350, currentSummaryY, { align: 'right', width: 150, features: ['rtla'] })
             .text(`${formatNumber(dutiesAmount)}`, 280, currentSummaryY, { align: 'left', width: 60 });
          currentSummaryY += 20;
        }
        
        // Show shipping cost if > 0
        if (shippingCost > 0) {
          doc.text(formatMixedText('هزینه حمل:'), 350, currentSummaryY, { align: 'right', width: 150, features: ['rtla'] })
             .text(`${formatNumber(shippingCost)}`, 280, currentSummaryY, { align: 'left', width: 60 });
          currentSummaryY += 20;
        }
        
        // Grand total
        doc.font('VazirBold')
           .text(formatMixedText('مجموع کل:'), 350, currentSummaryY, { align: 'right', width: 150, features: ['rtla'] })
           .text(`${formatNumber(grandTotal)}`, 280, currentSummaryY, { align: 'left', width: 60 });
        
        // Footer message - exactly matching Word template  
        const footerMessageY = currentSummaryY + 30;
        const footerMessage = isProforma ? 
          'این پیش فاکتور است و پس تائید مالی، فاکتور نهایی صادر خواهد شد.' : 
          'این فاکتور نهایی است.';
        
        doc.fontSize(10)
           .font('VazirRegular')
           .text(formatMixedText(footerMessage), 50, footerMessageY, { align: 'right', width: 500, features: ['rtla'] });
        
        // Two-column footer layout
        const companyFooterY = footerMessageY + 30;
        const leftColumnX = 50;
        const rightColumnX = 300;
        const columnWidth = 240;
        
        // Left Column - Persian information
        doc.fontSize(11)
           .font('VazirBold')
           .text(formatMixedText('شرکت ممتاز شیمی'), leftColumnX, companyFooterY, { align: 'right', width: columnWidth, features: ['rtla'] });
        
        const addressText = formatMixedText('آدرس: NAGwer Road, Qaryataq Village, Erbil, Iraq');
        doc.fontSize(8)
           .font('VazirRegular')
           .text(addressText, leftColumnX, companyFooterY + 18, { align: 'right', width: columnWidth, features: ['rtla'] });
        
        const sloganText = formatMixedText('تامین کننده برتر مواد شیمیایی صنعتی و آزمایشگاهی در خاورمیانه');
        doc.fontSize(7)
           .font('VazirRegular')
           .text(sloganText, leftColumnX, companyFooterY + 35, { align: 'right', width: columnWidth, features: ['rtla'] });
        
        // Right Column - English information
        doc.fontSize(11)
           .font('VazirBold')
           .text('Momtaz Chemical Solutions Company', rightColumnX, companyFooterY, { align: 'left', width: columnWidth });
        
        doc.fontSize(8)
           .font('VazirRegular')
           .text('www.momtazchem.com', rightColumnX, companyFooterY + 18, { align: 'left', width: columnWidth })
           .text('info@momtazchem.com', rightColumnX, companyFooterY + 30, { align: 'left', width: columnWidth })
           .text('sales@momtazchem.com', rightColumnX, companyFooterY + 42, { align: 'left', width: columnWidth })
           .text('+964 770 123 4567', rightColumnX, companyFooterY + 54, { align: 'left', width: columnWidth })
           .text('+964 780 987 6543', rightColumnX, companyFooterY + 66, { align: 'left', width: columnWidth });
        
        doc.fontSize(7)
           .font('VazirRegular')
           .text('Leading Supplier of Industrial & Laboratory', rightColumnX, companyFooterY + 80, { align: 'left', width: columnWidth })
           .text('Chemicals in the Middle East', rightColumnX, companyFooterY + 92, { align: 'left', width: columnWidth });
        
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

// Generate Customer Profile PDF using PDFKit
export async function generateCustomerProfilePDF(customerData: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('👤 Generating customer profile PDF with PDFKit...');
      
      // Get company logo from database
      const companyLogoBase64 = await getCompanyLogo();
      
      // Create a PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Customer Profile - ${customerData.firstName || ''} ${customerData.lastName || ''}`,
          Author: 'Momtaz Chem',
          Subject: 'Customer Profile Report'
        }
      });

      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        console.log('✅ Customer profile PDF generated successfully, size:', result.length);
        resolve(result);
      });

      doc.on('error', (error: Error) => {
        console.error('❌ PDF generation error:', error);
        reject(error);
      });

      // Add content to PDF
      try {
        // Try to register custom fonts
        const vazirRegularBuffer = Buffer.from(vazirRegular, 'base64');
        const vazirBoldBuffer = Buffer.from(vazirBold, 'base64');
        
        doc.registerFont('VazirRegular', vazirRegularBuffer);
        doc.registerFont('VazirBold', vazirBoldBuffer);
        
        doc.font('VazirBold');
        
        // Add company logo if available
        if (companyLogoBase64) {
          try {
            const logoBuffer = Buffer.from(companyLogoBase64, 'base64');
            doc.image(logoBuffer, 450, 30, { width: 80, height: 60 });
            console.log('✅ Company logo added to customer profile PDF');
          } catch (logoError) {
            console.warn('⚠️ Logo embedding failed:', logoError);
          }
        } else {
          console.log('ℹ️ No company logo available for customer profile PDF');
        }
        
        // Title
        doc.fontSize(20)
           .text(formatRTLText('پروفایل مشتری'), 50, 50, { align: 'center' });
        
        doc.font('VazirRegular');
        
        // Date - Gregorian format
        const currentDate = new Date();
        const gregorianDate = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
        doc.fontSize(12)
           .text(formatRTLText(`تاریخ گزارش: ${gregorianDate}`), 50, 90, { align: 'right' });
        
        let yPosition = 130;
        
        // Personal Information Section
        doc.fontSize(16).font('VazirBold').text(formatRTLText('اطلاعات شخصی'), 50, yPosition, { align: 'right' });
        yPosition += 30;
        doc.fontSize(12).font('VazirRegular');
        
        doc.text(formatRTLText(`نام: ${customerData.firstName || ''} ${customerData.lastName || ''}`), 50, yPosition, { align: 'right' });
        yPosition += 20;
        doc.text(formatRTLText(`ایمیل: ${customerData.email || 'نامشخص'}`), 50, yPosition, { align: 'right' });
        yPosition += 20;
        doc.text(formatRTLText(`شماره تماس: ${customerData.phone || 'نامشخص'}`), 50, yPosition, { align: 'right' });
        yPosition += 20;
        doc.text(formatRTLText(`شرکت: ${customerData.company || 'نامشخص'}`), 50, yPosition, { align: 'right' });
        yPosition += 30;
        
        // Contact Information Section
        doc.fontSize(16).font('VazirBold').text(formatRTLText('اطلاعات تماس'), 50, yPosition, { align: 'right' });
        yPosition += 30;
        doc.fontSize(12).font('VazirRegular');
        
        doc.text(formatRTLText(`کشور: ${customerData.country || 'نامشخص'}`), 50, yPosition, { align: 'right' });
        yPosition += 20;
        doc.text(formatRTLText(`استان: ${customerData.province || 'نامشخص'}`), 50, yPosition, { align: 'right' });
        yPosition += 20;
        doc.text(formatRTLText(`شهر: ${customerData.city || 'نامشخص'}`), 50, yPosition, { align: 'right' });
        yPosition += 20;
        doc.text(formatRTLText(`آدرس: ${customerData.address || 'نامشخص'}`), 50, yPosition, { align: 'right' });
        yPosition += 40; // اضافه کردن فاصله بیشتر بین آدرس و کد پستی
        doc.text(formatRTLText(`کد پستی: ${customerData.postalCode || 'نامشخص'}`), 50, yPosition, { align: 'right' });
        yPosition += 30;
        
        // Business Information Section  
        doc.fontSize(16).font('VazirBold').text(formatRTLText('اطلاعات تجاری'), 50, yPosition, { align: 'right' });
        yPosition += 30;
        doc.fontSize(12).font('VazirRegular');
        
        const customerType = customerData.customerType === 'business' ? 'شرکتی' : 'شخصی';
        doc.text(formatRTLText(`نوع مشتری: ${customerType}`), 50, yPosition, { align: 'right' });
        yPosition += 20;
        doc.text(formatRTLText(`صنعت: ${customerData.industry || 'نامشخص'}`), 50, yPosition, { align: 'right' });
        yPosition += 20;
        doc.text(formatRTLText(`اندازه شرکت: ${customerData.companySize || 'نامشخص'}`), 50, yPosition, { align: 'right' });
        yPosition += 20;
        doc.text(formatRTLText(`منبع ارجاع: ${customerData.leadSource || 'نامشخص'}`), 50, yPosition, { align: 'right' });
        yPosition += 30;
        
        // Communication Preferences Section
        doc.fontSize(16).font('VazirBold').text(formatRTLText('تنظیمات ارتباط'), 50, yPosition, { align: 'right' });
        yPosition += 30;
        doc.fontSize(12).font('VazirRegular');
        
        doc.text(formatRTLText(`زبان ترجیحی: ${customerData.preferredLanguage || 'نامشخص'}`), 50, yPosition, { align: 'right' });
        yPosition += 20;
        doc.text(formatRTLText(`روش ارتباط: ${customerData.communicationPreference || 'نامشخص'}`), 50, yPosition, { align: 'right' });
        yPosition += 20;
        
        const smsStatus = customerData.smsEnabled ? 'فعال' : 'غیرفعال';
        const emailStatus = customerData.emailEnabled ? 'فعال' : 'غیرفعال';
        doc.text(formatRTLText(`پیامک: ${smsStatus}`), 50, yPosition, { align: 'right' });
        yPosition += 20;
        doc.text(formatRTLText(`ایمیل: ${emailStatus}`), 50, yPosition, { align: 'right' });
        yPosition += 30;
        
        // Registration Information
        if (customerData.createdAt) {
          const regDate = new Date(customerData.createdAt);
          const regDateFormatted = `${regDate.getFullYear()}/${String(regDate.getMonth() + 1).padStart(2, '0')}/${String(regDate.getDate()).padStart(2, '0')}`;
          doc.fontSize(16).font('VazirBold').text(formatRTLText('اطلاعات ثبت‌نام'), 50, yPosition, { align: 'right' });
          yPosition += 30;
          doc.fontSize(12).font('VazirRegular');
          doc.text(formatRTLText(`تاریخ ثبت‌نام: ${regDateFormatted}`), 50, yPosition, { align: 'right' });
          yPosition += 20;
        }

      } catch (fontError) {
        console.warn('⚠️ Font loading failed, using fallback approach:', fontError);
        
        // Fallback to default font
        doc.fontSize(20)
           .text('Customer Profile - Momtaz Chem', 50, 50, { align: 'center' });
        
        doc.fontSize(14)
           .text('Personal Information:', 50, 100);
        
        doc.fontSize(12)
           .text(`Name: ${customerData.firstName || ''} ${customerData.lastName || ''}`, 50, 130)
           .text(`Email: ${customerData.email || 'Unknown'}`, 50, 150)
           .text(`Phone: ${customerData.phone || 'Unknown'}`, 50, 170)
           .text(`Company: ${customerData.company || 'Unknown'}`, 50, 190);
           
        doc.fontSize(14)
           .text('Contact Information:', 50, 230);
        
        doc.fontSize(12)
           .text(`Country: ${customerData.country || 'Unknown'}`, 50, 260)
           .text(`Province: ${customerData.province || 'Unknown'}`, 50, 280)
           .text(`City: ${customerData.city || 'Unknown'}`, 50, 300)
           .text(`Address: ${customerData.address || 'Unknown'}`, 50, 320);
      }
      
      // Footer
      doc.fontSize(10)
         .text(formatRTLText('شرکت الانتاج الممتاز / Al-Entaj Al-Momtaz Company'), 50, 750, { align: 'center' })
         .text('www.momtazchem.com | info@momtazchem.com', 50, 765, { align: 'center' });

      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      console.error('❌ Error in generateCustomerProfilePDF:', error);
      reject(error);
    }
  });
}

// Generate Customer Report PDF using PDFKit
export async function generateCustomerReportPDF(customerData: any, orders: any[] = [], activities: any[] = []): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('📄 Generating customer report PDF with PDFKit...');
      
      // Get company logo from database
      const companyLogoBase64 = await getCompanyLogo();
      
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

// Generate Analytics PDF using PDFKit
export async function generateAnalyticsPDF(analyticsData: any, title: string = 'گزارش آمارها'): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('📊 Generating analytics PDF with PDFKit...');
      
      // Get company logo from database
      const companyLogoBase64 = await getCompanyLogo();
      
      // Create a PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: title,
          Author: 'Momtaz Chem',
          Subject: 'Analytics Report'
        }
      });

      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        console.log('✅ Analytics PDF generated successfully, size:', result.length);
        resolve(result);
      });

      doc.on('error', (error: Error) => {
        console.error('❌ PDF generation error:', error);
        reject(error);
      });

      // Add content to PDF with fallback approach
      try {
        // Try to register custom fonts
        const vazirRegularBuffer = Buffer.from(vazirRegular, 'base64');
        const vazirBoldBuffer = Buffer.from(vazirBold, 'base64');
        
        doc.registerFont('VazirRegular', vazirRegularBuffer);
        doc.registerFont('VazirBold', vazirBoldBuffer);
        
        doc.font('VazirBold');
        
        // Add company logo if available
        if (companyLogoBase64) {
          try {
            const logoBuffer = Buffer.from(companyLogoBase64, 'base64');
            doc.image(logoBuffer, 450, 30, { width: 80, height: 60 });
            console.log('✅ Company logo added to analytics PDF');
          } catch (logoError) {
            console.warn('⚠️ Logo embedding failed:', logoError);
          }
        } else {
          console.log('ℹ️ No company logo available for analytics PDF');
        }
        
        // Title
        doc.fontSize(20)
           .text(formatRTLText(title), 50, 50, { align: 'center' });
        
        doc.font('VazirRegular');
        
        // Date - Gregorian format
        const currentDate = new Date();
        const gregorianDate = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
        doc.fontSize(12)
           .text(formatRTLText(`تاریخ گزارش: ${gregorianDate}`), 50, 90, { align: 'right' });
        
        let yPosition = 130;
        
        // Dashboard Statistics
        doc.fontSize(16)
           .font('VazirBold')
           .text(formatRTLText('آمار داشبورد'), 50, yPosition, { align: 'right' });
        
        yPosition += 30;
        doc.font('VazirRegular').fontSize(11);
        
        // Stats
        if (analyticsData) {
          doc.text(formatRTLText(`کل مشتریان: ${analyticsData.totalCustomers || 0}`), 50, yPosition, { align: 'right' });
          yPosition += 20;
          doc.text(formatRTLText(`مشتریان فعال: ${analyticsData.activeCustomers || 0}`), 50, yPosition, { align: 'right' });
          yPosition += 20;
          doc.text(formatRTLText(`مشتریان جدید این ماه: ${analyticsData.newCustomersThisMonth || 0}`), 50, yPosition, { align: 'right' });
          yPosition += 20;
          doc.text(formatRTLText(`کل درآمد: ${Math.round(analyticsData.totalRevenue || 0)} دینار`), 50, yPosition, { align: 'right' });
          yPosition += 20;
          doc.text(formatRTLText(`متوسط مبلغ سفارش: ${Math.round(analyticsData.averageOrderValue || 0)} دینار`), 50, yPosition, { align: 'right' });
          yPosition += 30;
          
          // Top Customers section
          if (analyticsData.topCustomers && analyticsData.topCustomers.length > 0) {
            doc.fontSize(16).font('VazirBold').text(formatRTLText('برترین مشتریان'), 50, yPosition, { align: 'right' });
            yPosition += 30;
            doc.fontSize(11).font('VazirRegular');
            
            analyticsData.topCustomers.slice(0, 5).forEach((customer: any, index: number) => {
              const customerText = `${index + 1}. ${customer.name} - ${Math.round(customer.totalSpent)} دینار (${customer.totalOrders} سفارش)`;
              doc.text(formatRTLText(customerText), 50, yPosition, { align: 'right' });
              yPosition += 18;
            });
            yPosition += 20;
          }
          
          // Customer Types section
          if (analyticsData.customersByType && analyticsData.customersByType.length > 0) {
            doc.fontSize(16).font('VazirBold').text(formatRTLText('انواع مشتریان'), 50, yPosition, { align: 'right' });
            yPosition += 30;
            doc.fontSize(11).font('VazirRegular');
            
            analyticsData.customersByType.forEach((type: any) => {
              const typeName = type.type === 'business' ? 'شرکتی' : 'شخصی';
              const typeText = `${typeName}: ${type.count} مشتری`;
              doc.text(formatRTLText(typeText), 50, yPosition, { align: 'right' });
              yPosition += 18;
            });
            yPosition += 20;
          }
          
          // Recent Activities section
          if (analyticsData.recentActivities && analyticsData.recentActivities.length > 0) {
            doc.fontSize(16).font('VazirBold').text(formatRTLText('فعالیت‌های اخیر'), 50, yPosition, { align: 'right' });
            yPosition += 30;
            doc.fontSize(11).font('VazirRegular');
            
            analyticsData.recentActivities.slice(0, 3).forEach((activity: any) => {
              const activityText = activity.activityType === 'login' ? 'ورود به سیستم' : 'خروج از سیستم';
              const activityLine = `${activity.customerName}: ${activityText}`;
              doc.text(formatRTLText(activityLine), 50, yPosition, { align: 'right' });
              yPosition += 18;
            });
          }
        }
        
        // Footer
        doc.fontSize(10)
           .text(formatRTLText('شرکت الانتاج الممتاز / Al-Entaj Al-Momtaz Company'), 50, 750, { align: 'center' })
           .text('www.momtazchem.com | info@momtazchem.com', 50, 765, { align: 'center' });
        
      } catch (fontError) {
        console.warn('⚠️ Font registration failed, using default font:', fontError);
        
        // Fallback to default font
        // Add company logo if available
        if (companyLogoBase64) {
          try {
            const logoBuffer = Buffer.from(companyLogoBase64, 'base64');
            doc.image(logoBuffer, 450, 30, { width: 80, height: 60 });
            console.log('✅ Company logo added to analytics PDF (fallback)');
          } catch (logoError) {
            console.warn('⚠️ Logo embedding failed in fallback:', logoError);
          }
        } else {
          console.log('ℹ️ No company logo available for analytics PDF (fallback)');
        }
        
        doc.fontSize(20)
           .text('Analytics Report - Al-Entaj Al-Momtaz', 50, 50, { align: 'center' });
        
        doc.fontSize(14)
           .text('Dashboard Statistics:', 50, 100);
        
        let yPos = 130;
        if (analyticsData) {
          doc.fontSize(11)
             .text(`Total Customers: ${analyticsData.totalCustomers || 0}`, 50, yPos);
          yPos += 20;
          doc.text(`Active Orders: ${analyticsData.activeOrders || 0}`, 50, yPos);
          yPos += 20;
          doc.text(`Monthly Sales: ${analyticsData.monthlySales || 0} IQD`, 50, yPos);
          yPos += 20;
          doc.text(`Online Customers: ${analyticsData.onlineCustomers || 0}`, 50, yPos);
        }
      }

      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      console.error('❌ Error in generateAnalyticsPDF:', error);
      reject(error);
    }
  });
}
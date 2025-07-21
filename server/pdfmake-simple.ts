// Simple PDFMake Generator with minimal dependencies
const PdfMake = require('pdfmake');
import { vazirRegular, vazirBold } from './vazir-base64';

// Create printer instance
const printer = new PdfMake({
  Roboto: {
    normal: Buffer.from('', 'base64'), // We won't use this
    bold: Buffer.from('', 'base64'),
    italics: Buffer.from('', 'base64'),
    bolditalics: Buffer.from('', 'base64')
  },
  Vazir: {
    normal: Buffer.from(vazirRegular, 'base64'),
    bold: Buffer.from(vazirBold, 'base64'), 
    italics: Buffer.from(vazirRegular, 'base64'),
    bolditalics: Buffer.from(vazirBold, 'base64')
  }
});

export async function generateSimpleInvoicePDF(invoiceData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      console.log('📄 Generating invoice PDF with simple method...');
      
      // Create document definition
      const docDefinition = {
        content: [
          {
            text: 'فاکتور فروش - Momtaz Chem',
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          {
            columns: [
              {
                text: [
                  { text: 'شماره فاکتور: ', bold: true },
                  invoiceData.invoiceNumber || 'INV-001'
                ],
                alignment: 'right'
              },
              {
                text: [
                  { text: 'تاریخ: ', bold: true },
                  new Date().toLocaleDateString('fa-IR')
                ],
                alignment: 'left'
              }
            ],
            margin: [0, 0, 0, 20]
          },
          {
            text: 'مشخصات مشتری',
            style: 'subheader',
            margin: [0, 0, 0, 10]
          },
          {
            text: [
              { text: 'نام: ', bold: true },
              invoiceData.customerName || 'نامشخص'
            ],
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: 'تلفن: ', bold: true },
              invoiceData.customerPhone || 'نامشخص'
            ],
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: 'ایمیل: ', bold: true },
              invoiceData.customerEmail || 'نامشخص'
            ],
            margin: [0, 0, 0, 20]
          },
          {
            text: 'کالاها و خدمات',
            style: 'subheader',
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto', 'auto'],
              body: [
                [
                  { text: 'شرح کالا', style: 'tableHeader' },
                  { text: 'تعداد', style: 'tableHeader' },
                  { text: 'قیمت واحد', style: 'tableHeader' },
                  { text: 'مبلغ کل', style: 'tableHeader' }
                ],
                ...((invoiceData.items || []).map((item: any) => [
                  item.name || 'نامشخص',
                  item.quantity || '1',
                  (item.unitPrice || 0).toLocaleString('fa-IR') + ' ریال',
                  ((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('fa-IR') + ' ریال'
                ]))
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          },
          {
            columns: [
              { text: '', width: '*' },
              {
                table: {
                  body: [
                    [
                      { text: 'مجموع کل:', bold: true, alignment: 'right' },
                      { text: (invoiceData.totalAmount || 0).toLocaleString('fa-IR') + ' ریال', bold: true, alignment: 'left' }
                    ]
                  ]
                },
                layout: 'noBorders',
                width: 'auto'
              }
            ]
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            font: 'Vazir'
          },
          subheader: {
            fontSize: 14,
            bold: true,
            font: 'Vazir',
            color: '#333'
          },
          tableHeader: {
            bold: true,
            fontSize: 11,
            color: 'white',
            fillColor: '#2563eb',
            alignment: 'center',
            font: 'Vazir'
          }
        },
        defaultStyle: {
          font: 'Vazir',
          fontSize: 10,
          direction: 'rtl'
        },
        pageMargins: [40, 60, 40, 60]
      };

      // Generate PDF
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      pdfDoc.on('end', () => {
        const result = Buffer.concat(chunks);
        console.log('✅ PDF generated successfully, size:', result.length);
        resolve(result);
      });

      pdfDoc.on('error', (error: Error) => {
        console.error('❌ PDF generation error:', error);
        reject(error);
      });

      pdfDoc.end();
    } catch (error) {
      console.error('❌ Error in generateSimpleInvoicePDF:', error);
      reject(error);
    }
  });
}

export async function generateSimpleCustomerReportPDF(customerData: any, orders: any[] = []): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      console.log('📄 Generating customer report PDF...');
      
      const docDefinition = {
        content: [
          {
            text: 'گزارش مشتری - Momtaz Chem',
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          {
            text: 'اطلاعات مشتری',
            style: 'subheader',
            margin: [0, 0, 0, 10]
          },
          {
            text: [
              { text: 'نام: ', bold: true },
              customerData.customerName || 'نامشخص'
            ],
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: 'ایمیل: ', bold: true },
              customerData.email || 'نامشخص'
            ],
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: 'تلفن: ', bold: true },
              customerData.phone || 'نامشخص'
            ],
            margin: [0, 0, 0, 20]
          },
          {
            text: 'سوابق سفارشات',
            style: 'subheader',
            margin: [0, 0, 0, 10]
          },
          {
            text: orders.length > 0 ? `تعداد سفارشات: ${orders.length}` : 'هیچ سفارشی یافت نشد.',
            margin: [0, 0, 0, 10]
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            font: 'Vazir'
          },
          subheader: {
            fontSize: 14,
            bold: true,
            font: 'Vazir',
            color: '#333'
          }
        },
        defaultStyle: {
          font: 'Vazir',
          fontSize: 10,
          direction: 'rtl'
        },
        pageMargins: [40, 60, 40, 60]
      };

      // Generate PDF
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      pdfDoc.on('end', () => {
        const result = Buffer.concat(chunks);
        console.log('✅ Customer report PDF generated successfully, size:', result.length);
        resolve(result);
      });

      pdfDoc.on('error', (error: Error) => {
        console.error('❌ PDF generation error:', error);
        reject(error);
      });

      pdfDoc.end();
    } catch (error) {
      console.error('❌ Error in generateSimpleCustomerReportPDF:', error);
      reject(error);
    }
  });
}
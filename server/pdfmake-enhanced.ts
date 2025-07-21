// Enhanced PDFMake Generator با فونت‌های Vazir برای Persian/Arabic support
import pdfMake from "pdfmake/build/pdfmake.js";
import pdfFonts from "pdfmake/build/vfs_fonts.js";
import { vazirRegular, vazirBold } from "./vazir-base64";

// Setup fonts for pdfMake with Vazir support for Persian/Arabic text
function setupVazirFont() {
  try {
    console.log('Setting up fonts for pdfMake...');
    
    // Initialize VFS with default fonts
    if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
      pdfMake.vfs = { ...pdfFonts.pdfMake.vfs };
    } else {
      pdfMake.vfs = {};
    }
    
    // Add our custom fonts with proper base64 data
    pdfMake.vfs["Vazir-Regular.ttf"] = vazirRegular;
    pdfMake.vfs["Vazir-Bold.ttf"] = vazirBold;
    
    console.log('Regular font data length:', vazirRegular.length);
    console.log('Bold font data length:', vazirBold.length);

    console.log('VFS keys:', Object.keys(pdfMake.vfs));

    // Setup font families
    pdfMake.fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      },
      Vazir: {
        normal: "Vazir-Regular.ttf",
        bold: "Vazir-Bold.ttf", 
        italics: "Vazir-Regular.ttf",
        bolditalics: "Vazir-Bold.ttf",
      },
    };
    
    console.log('✅ Font setup completed successfully');
    console.log('Available fonts:', Object.keys(pdfMake.fonts));
    return true;
  } catch (error) {
    console.error('❌ Error setting up fonts:', error);
    // Ultimate fallback - use only default fonts
    pdfMake.vfs = pdfFonts?.pdfMake?.vfs || {};
    pdfMake.fonts = {
      Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf'
      }
    };
    console.log('Using fallback font setup');
    return false;
  }
}

// Generate Invoice PDF
async function generateInvoicePDFWithPDFMake(invoiceData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Setup fonts
      setupVazirFont();

      // Create document definition
      const docDefinition = {
        content: [
          // Header
          {
            text: 'فاکتور فروش',
            font: 'Vazir',
            fontSize: 18,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          {
            text: 'شرکت ممتاز برای مواد شیمیایی',
            font: 'Vazir',
            fontSize: 14,
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          {
            text: 'Momtaz Chemical Solutions Company',
            font: 'Roboto',
            fontSize: 12,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          
          // Invoice Details
          {
            columns: [
              {
                width: '50%',
                text: [
                  { text: 'شماره فاکتور: ', font: 'Vazir', bold: true },
                  { text: invoiceData?.invoiceNumber || 'INV-001', font: 'Vazir' }
                ]
              },
              {
                width: '50%',
                text: [
                  { text: 'تاریخ: ', font: 'Vazir', bold: true },
                  { text: new Date().toLocaleDateString('fa-IR'), font: 'Vazir' }
                ],
                alignment: 'right'
              }
            ],
            margin: [0, 0, 0, 20]
          },

          // Customer Information
          {
            text: 'اطلاعات مشتری',
            font: 'Vazir',
            fontSize: 14,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              widths: ['25%', '75%'],
              body: [
                [
                  { text: 'نام مشتری:', font: 'Vazir', bold: true },
                  { text: invoiceData?.customerName || 'نامشخص', font: 'Vazir' }
                ],
                [
                  { text: 'ایمیل:', font: 'Vazir', bold: true },
                  { text: invoiceData?.customerEmail || 'نامشخص', font: 'Vazir' }
                ],
                [
                  { text: 'شماره تماس:', font: 'Vazir', bold: true },
                  { text: invoiceData?.customerPhone || 'نامشخص', font: 'Vazir' }
                ]
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          },

          // Items Table
          {
            text: 'اقلام سفارش',
            font: 'Vazir',
            fontSize: 14,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['10%', '40%', '15%', '15%', '20%'],
              body: [
                [
                  { text: 'ردیف', font: 'Vazir', bold: true, alignment: 'center' },
                  { text: 'نام محصول', font: 'Vazir', bold: true, alignment: 'center' },
                  { text: 'تعداد', font: 'Vazir', bold: true, alignment: 'center' },
                  { text: 'قیمت واحد', font: 'Vazir', bold: true, alignment: 'center' },
                  { text: 'مجموع', font: 'Vazir', bold: true, alignment: 'center' }
                ],
                ...generateItemRows(invoiceData?.items || [])
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          },

          // Total
          {
            columns: [
              { width: '70%', text: '' },
              {
                width: '30%',
                table: {
                  widths: ['50%', '50%'],
                  body: [
                    [
                      { text: 'مجموع کل:', font: 'Vazir', bold: true },
                      { text: `${invoiceData?.totalAmount || 0} دینار`, font: 'Vazir', bold: true }
                    ]
                  ]
                },
                layout: 'noBorders'
              }
            ]
          }
        ],
        defaultStyle: {
          font: 'Vazir',
          fontSize: 10
        },
        styles: {
          tableHeader: {
            bold: true,
            fontSize: 11,
            color: 'black'
          }
        },
        pageOrientation: 'portrait',
        pageSize: 'A4'
      };

      // Generate PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      pdfDoc.getBuffer((buffer: Buffer) => {
        console.log('✅ Invoice PDF generated successfully');
        resolve(buffer);
      });

    } catch (error) {
      console.error('❌ Error generating invoice PDF:', error);
      reject(error);
    }
  });
}

// Generate Customer Report PDF
async function generateCustomerReportPDFWithPDFMake(customerData: any, orders: any[] = [], activities: any[] = []): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Setup fonts
      setupVazirFont();

      const docDefinition = {
        content: [
          {
            text: 'گزارش مشتری',
            font: 'Vazir',
            fontSize: 18,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          {
            text: 'شرکت ممتاز برای مواد شیمیایی',
            font: 'Vazir',
            fontSize: 14,
            alignment: 'center',
            margin: [0, 0, 0, 30]
          },

          // Customer Info
          {
            text: 'اطلاعات مشتری',
            font: 'Vazir',
            fontSize: 14,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              widths: ['25%', '75%'],
              body: [
                [
                  { text: 'نام:', font: 'Vazir', bold: true },
                  { text: customerData?.name || customerData?.customer_name || 'نامشخص', font: 'Vazir' }
                ],
                [
                  { text: 'ایمیل:', font: 'Vazir', bold: true },
                  { text: customerData?.email || 'نامشخص', font: 'Vazir' }
                ],
                [
                  { text: 'تلفن:', font: 'Vazir', bold: true },
                  { text: customerData?.phone || 'نامشخص', font: 'Vazir' }
                ],
                [
                  { text: 'آدرس:', font: 'Vazir', bold: true },
                  { text: customerData?.address || 'نامشخص', font: 'Vazir' }
                ]
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          },

          // Orders Summary
          {
            text: `تاریخچه سفارشات (${orders.length} سفارش)`,
            font: 'Vazir',
            fontSize: 14,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          generateOrdersTable(orders.slice(0, 10)),

          // Activities
          {
            text: `فعالیت‌ها (${activities.length} فعالیت)`,
            font: 'Vazir',
            fontSize: 14,
            bold: true,
            margin: [0, 20, 0, 10]
          },
          generateActivitiesTable(activities.slice(0, 10))
        ],
        defaultStyle: {
          font: 'Vazir',
          fontSize: 10
        },
        pageOrientation: 'portrait',
        pageSize: 'A4'
      };

      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      pdfDoc.getBuffer((buffer: Buffer) => {
        console.log('✅ Customer report PDF generated successfully');
        resolve(buffer);
      });

    } catch (error) {
      console.error('❌ Error generating customer report PDF:', error);
      reject(error);
    }
  });
}

// Helper function to generate item rows for invoice
function generateItemRows(items: any[]) {
  if (!items || items.length === 0) {
    return [
      [
        { text: '-', alignment: 'center' },
        { text: 'هیچ آیتمی یافت نشد', font: 'Vazir', alignment: 'center', colSpan: 4 },
        {}, {}, {}
      ]
    ];
  }

  return items.map((item: any, index: number) => [
    { text: (index + 1).toString(), font: 'Vazir', alignment: 'center' },
    { text: item?.name || 'نامشخص', font: 'Vazir' },
    { text: item?.quantity?.toString() || '0', font: 'Vazir', alignment: 'center' },
    { text: `${item?.unitPrice || 0} دینار`, font: 'Vazir', alignment: 'center' },
    { text: `${(item?.quantity || 0) * (item?.unitPrice || 0)} دینار`, font: 'Vazir', alignment: 'center' }
  ]);
}

// Helper function to generate orders table
function generateOrdersTable(orders: any[]) {
  if (!orders || orders.length === 0) {
    return {
      text: 'هیچ سفارشی ثبت نشده است',
      font: 'Vazir',
      alignment: 'center',
      margin: [0, 0, 0, 20]
    };
  }

  return {
    table: {
      headerRows: 1,
      widths: ['10%', '20%', '20%', '25%', '25%'],
      body: [
        [
          { text: 'ردیف', font: 'Vazir', bold: true, alignment: 'center' },
          { text: 'شماره سفارش', font: 'Vazir', bold: true, alignment: 'center' },
          { text: 'مبلغ', font: 'Vazir', bold: true, alignment: 'center' },
          { text: 'وضعیت', font: 'Vazir', bold: true, alignment: 'center' },
          { text: 'تاریخ', font: 'Vazir', bold: true, alignment: 'center' }
        ],
        ...orders.map((order: any, index: number) => [
          { text: (index + 1).toString(), font: 'Vazir', alignment: 'center' },
          { text: order?.id?.toString() || 'نامشخص', font: 'Vazir', alignment: 'center' },
          { text: `${order?.totalAmount || 0} دینار`, font: 'Vazir', alignment: 'center' },
          { text: order?.status || 'نامشخص', font: 'Vazir', alignment: 'center' },
          { text: order?.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : 'نامشخص', font: 'Vazir', alignment: 'center' }
        ])
      ]
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 20]
  };
}

// Helper function to generate activities table
function generateActivitiesTable(activities: any[]) {
  if (!activities || activities.length === 0) {
    return {
      text: 'هیچ فعالیتی ثبت نشده است',
      font: 'Vazir',
      alignment: 'center'
    };
  }

  return {
    table: {
      headerRows: 1,
      widths: ['10%', '30%', '40%', '20%'],
      body: [
        [
          { text: 'ردیف', font: 'Vazir', bold: true, alignment: 'center' },
          { text: 'نوع فعالیت', font: 'Vazir', bold: true, alignment: 'center' },
          { text: 'توضیحات', font: 'Vazir', bold: true, alignment: 'center' },
          { text: 'تاریخ', font: 'Vazir', bold: true, alignment: 'center' }
        ],
        ...activities.map((activity: any, index: number) => [
          { text: (index + 1).toString(), font: 'Vazir', alignment: 'center' },
          { text: activity?.activityType || 'نامشخص', font: 'Vazir' },
          { text: activity?.description || 'توضیحی ثبت نشده', font: 'Vazir' },
          { text: activity?.createdAt ? new Date(activity.createdAt).toLocaleDateString('fa-IR') : 'نامشخص', font: 'Vazir', alignment: 'center' }
        ])
      ]
    },
    layout: 'lightHorizontalLines'
  };
}

// Export the functions
export { generateInvoicePDFWithPDFMake as generateInvoicePDF };
export { generateCustomerReportPDFWithPDFMake as generateCustomerReportPDF };
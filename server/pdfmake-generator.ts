// PDF Generator using pdfMake with Persian/Arabic Support
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');

// Initialize pdfMake with built-in fonts
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Configure fonts for Persian/Arabic support - using any type to avoid TypeScript issues
(pdfMake as any).fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  },
  // Using built-in fonts that support Unicode better
  Persian: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

// Generate Invoice PDF with batch information
export async function generateInvoicePDFWithBatch(
  customerData: any,
  orderData: any,
  batchData: any[],
  title: string
): Promise<Buffer> {
  
  const batchRows = batchData?.map(batch => [
    { text: batch.batchNumber || 'نامشخص', alignment: 'center', font: 'Persian' },
    { text: batch.barcode || 'نامشخص', alignment: 'center', font: 'Persian' },
    { text: `${batch.quantitySold || 0}`, alignment: 'center', font: 'Persian' },
    { text: `${batch.wasteAmount || 0} (${batch.quantitySold ? ((parseFloat(batch.wasteAmount || 0) / batch.quantitySold) * 100).toFixed(2) : 0}%)`, alignment: 'center', font: 'Persian' },
    { text: `${batch.effectiveQuantity || 0}`, alignment: 'center', font: 'Persian' },
    { text: `${batch.unitPrice || 0} دینار`, alignment: 'center', font: 'Persian' },
    { text: `${batch.totalPrice || 0} دینار`, alignment: 'center', font: 'Persian' }
  ]) || [
    [
      { text: 'اطلاعات بچی موجود نیست', colSpan: 7, alignment: 'center', font: 'Persian' },
      {}, {}, {}, {}, {}, {}
    ]
  ];

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 20],
    defaultStyle: {
      font: 'Persian',
      fontSize: 11,
      lineHeight: 1.3
    },
    content: [
      // Header
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'شرکت ممتاز برای مواد شیمیایی', style: 'companyName', alignment: 'center' },
              { text: `فاکتور - ${title}`, style: 'invoiceTitle', alignment: 'center' },
              { text: `تاریخ صدور: ${new Date().toLocaleDateString('fa-IR')}`, alignment: 'center', margin: [0, 5, 0, 0] }
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },

      // Company Information
      {
        style: 'section',
        table: {
          widths: ['25%', '*'],
          body: [
            [
              { text: 'اطلاعات شرکت', style: 'sectionTitle', colSpan: 2, alignment: 'center' },
              {}
            ],
            [
              { text: 'نام شرکت:', style: 'label' },
              { text: 'شرکت ممتاز برای مواد شیمیایی', style: 'value' }
            ],
            [
              { text: 'موقعیت:', style: 'label' },
              { text: 'عراق - بغداد', style: 'value' }
            ],
            [
              { text: 'تلفن:', style: 'label' },
              { text: '+964 770 999 6771', style: 'value' }
            ],
            [
              { text: 'ایمیل:', style: 'label' },
              { text: 'info@momtazchem.com', style: 'value' }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // Customer Information  
      {
        style: 'section',
        table: {
          widths: ['25%', '*'],
          body: [
            [
              { text: 'اطلاعات مشتری', style: 'sectionTitle', colSpan: 2, alignment: 'center' },
              {}
            ],
            [
              { text: 'نام:', style: 'label' },
              { text: customerData.name || 'نامشخص', style: 'value' }
            ],
            [
              { text: 'ایمیل:', style: 'label' },
              { text: customerData.email || 'نامشخص', style: 'value' }
            ],
            [
              { text: 'تلفن:', style: 'label' },
              { text: customerData.phone || 'نامشخص', style: 'value' }
            ],
            [
              { text: 'آدرس:', style: 'label' },
              { text: customerData.address || 'نامشخص', style: 'value' }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // Invoice Details
      {
        style: 'section',
        table: {
          widths: ['25%', '*'],
          body: [
            [
              { text: 'جزئیات فاکتور', style: 'sectionTitle', colSpan: 2, alignment: 'center' },
              {}
            ],
            [
              { text: 'شماره فاکتور:', style: 'label' },
              { text: orderData.invoiceNumber || orderData.id, style: 'value' }
            ],
            [
              { text: 'شماره سفارش:', style: 'label' },
              { text: orderData.orderNumber || orderData.id, style: 'value' }
            ],
            [
              { text: 'تاریخ سفارش:', style: 'label' },
              { text: orderData.createdAt ? new Date(orderData.createdAt).toLocaleDateString('fa-IR') : 'نامشخص', style: 'value' }
            ],
            [
              { text: 'وضعیت:', style: 'label' },
              { text: orderData.status || 'نامشخص', style: 'value' }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // Batch Information Table
      {
        style: 'section',
        table: {
          headerRows: 1,
          widths: ['12%', '15%', '12%', '15%', '12%', '14%', '14%'],
          body: [
            [
              { text: 'شماره بچ', style: 'tableHeader', alignment: 'center' },
              { text: 'بارکد', style: 'tableHeader', alignment: 'center' },
              { text: 'مقدار فروخته شده', style: 'tableHeader', alignment: 'center' },
              { text: 'ضایعات', style: 'tableHeader', alignment: 'center' },
              { text: 'مقدار موثر', style: 'tableHeader', alignment: 'center' },
              { text: 'قیمت واحد', style: 'tableHeader', alignment: 'center' },
              { text: 'قیمت کل', style: 'tableHeader', alignment: 'center' }
            ],
            ...batchRows
          ]
        },
        layout: {
          fillColor: function (rowIndex: number) {
            return rowIndex === 0 ? '#f3f4f6' : null;
          }
        }
      },

      // Payment Information
      {
        style: 'section',
        table: {
          widths: ['25%', '*'],
          body: [
            [
              { text: 'اطلاعات پرداخت', style: 'sectionTitle', colSpan: 2, alignment: 'center' },
              {}
            ],
            [
              { text: 'روش پرداخت:', style: 'label' },
              { text: orderData.paymentMethod || 'نامشخص', style: 'value' }
            ],
            [
              { text: 'وضعیت پرداخت:', style: 'label' },
              { text: orderData.paymentStatus || 'نامشخص', style: 'value' }
            ],
            [
              { text: 'مبلغ کل:', style: 'label' },
              { text: `${orderData.totalAmount || 'نامشخص'} دینار عراقی`, style: 'value', bold: true }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // Footer
      {
        text: [
          { text: 'این فاکتور به صورت الکترونیکی تولید شده است\n', alignment: 'center', fontSize: 9 },
          { text: `تاریخ تولید: ${new Date().toLocaleString('fa-IR')}`, alignment: 'center', fontSize: 9 }
        ],
        margin: [0, 30, 0, 0]
      }
    ],

    styles: {
      companyName: {
        fontSize: 18,
        bold: true,
        color: '#2563eb',
        font: 'Persian'
      },
      invoiceTitle: {
        fontSize: 14,
        bold: true,
        margin: [0, 5, 0, 0],
        font: 'Persian'
      },
      section: {
        margin: [0, 10, 0, 10]
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        fillColor: '#e5e7eb',
        margin: [5, 5, 5, 5],
        font: 'Persian'
      },
      label: {
        bold: true,
        margin: [5, 3, 5, 3],
        font: 'Persian'
      },
      value: {
        margin: [5, 3, 5, 3],
        font: 'Persian'
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        margin: [2, 5, 2, 5],
        font: 'Persian'
      }
    }
  };

  return new Promise((resolve, reject) => {
    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
    pdfDocGenerator.getBuffer((buffer: Buffer) => {
      if (buffer) {
        resolve(buffer);
      } else {
        reject(new Error('Failed to generate PDF buffer'));
      }
    });
  });
}

// Generate Customer PDF Report
export async function generateCustomerPDFHTML(
  customerData: any,
  orders: any[],
  activities: any[],
  title: string
): Promise<Buffer> {

  const orderRows = orders?.slice(0, 10).map(order => [
    { text: order.id || 'نامشخص', alignment: 'center', font: 'Persian' },
    { text: `${order.totalAmount || 0} دینار`, alignment: 'center', font: 'Persian' },
    { text: order.status || 'نامشخص', alignment: 'center', font: 'Persian' },
    { text: order.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : 'نامشخص', alignment: 'center', font: 'Persian' }
  ]) || [
    [
      { text: 'سفارشی ثبت نشده است', colSpan: 4, alignment: 'center', font: 'Persian' },
      {}, {}, {}
    ]
  ];

  const activityRows = activities?.slice(0, 10).map(activity => [
    { text: activity.activityType || 'نامشخص', alignment: 'center', font: 'Persian' },
    { text: activity.description || 'توضیحی ثبت نشده', alignment: 'center', font: 'Persian' },
    { text: activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('fa-IR') : 'نامشخص', alignment: 'center', font: 'Persian' }
  ]) || [
    [
      { text: 'فعالیتی ثبت نشده است', colSpan: 3, alignment: 'center', font: 'Persian' },
      {}, {}
    ]
  ];

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 20],
    defaultStyle: {
      font: 'Persian',
      fontSize: 11,
      lineHeight: 1.3
    },
    content: [
      // Header
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'شرکت ممتاز برای مواد شیمیایی', style: 'companyName', alignment: 'center' },
              { text: `گزارش مشتری - ${title}`, style: 'reportTitle', alignment: 'center' },
              { text: `تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}`, alignment: 'center', margin: [0, 5, 0, 0] }
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },

      // Customer Information
      {
        style: 'section',
        table: {
          widths: ['25%', '*'],
          body: [
            [
              { text: 'اطلاعات مشتری', style: 'sectionTitle', colSpan: 2, alignment: 'center' },
              {}
            ],
            [
              { text: 'نام:', style: 'label' },
              { text: customerData.name || 'نامشخص', style: 'value' }
            ],
            [
              { text: 'ایمیل:', style: 'label' },
              { text: customerData.email || 'نامشخص', style: 'value' }
            ],
            [
              { text: 'تلفن:', style: 'label' },
              { text: customerData.phone || 'نامشخص', style: 'value' }
            ],
            [
              { text: 'آدرس:', style: 'label' },
              { text: customerData.address || 'نامشخص', style: 'value' }
            ],
            [
              { text: 'تاریخ عضویت:', style: 'label' },
              { text: customerData.createdAt ? new Date(customerData.createdAt).toLocaleDateString('fa-IR') : 'نامشخص', style: 'value' }
            ],
            [
              { text: 'وضعیت:', style: 'label' },
              { text: customerData.customerStatus || 'فعال', style: 'value' }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // Orders Table
      {
        style: 'section',
        table: {
          headerRows: 1,
          widths: ['20%', '25%', '25%', '30%'],
          body: [
            [
              { text: 'شماره سفارش', style: 'tableHeader', alignment: 'center' },
              { text: 'مبلغ کل', style: 'tableHeader', alignment: 'center' },
              { text: 'وضعیت', style: 'tableHeader', alignment: 'center' },
              { text: 'تاریخ', style: 'tableHeader', alignment: 'center' }
            ],
            ...orderRows
          ]
        },
        layout: {
          fillColor: function (rowIndex: number) {
            return rowIndex === 0 ? '#f3f4f6' : null;
          }
        }
      },

      // Activities Table
      {
        style: 'section',
        table: {
          headerRows: 1,
          widths: ['25%', '45%', '30%'],
          body: [
            [
              { text: 'نوع فعالیت', style: 'tableHeader', alignment: 'center' },
              { text: 'توضیحات', style: 'tableHeader', alignment: 'center' },
              { text: 'تاریخ', style: 'tableHeader', alignment: 'center' }
            ],
            ...activityRows
          ]
        },
        layout: {
          fillColor: function (rowIndex: number) {
            return rowIndex === 0 ? '#f3f4f6' : null;
          }
        }
      },

      // Footer
      {
        text: [
          { text: 'این گزارش به صورت الکترونیکی تولید شده است\n', alignment: 'center', fontSize: 9 },
          { text: `تاریخ تولید: ${new Date().toLocaleString('fa-IR')}`, alignment: 'center', fontSize: 9 }
        ],
        margin: [0, 30, 0, 0]
      }
    ],

    styles: {
      companyName: {
        fontSize: 18,
        bold: true,
        color: '#2563eb',
        font: 'Persian'
      },
      reportTitle: {
        fontSize: 14,
        bold: true,
        margin: [0, 5, 0, 0],
        font: 'Persian'
      },
      section: {
        margin: [0, 10, 0, 10]
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        fillColor: '#e5e7eb',
        margin: [5, 5, 5, 5],
        font: 'Persian'
      },
      label: {
        bold: true,
        margin: [5, 3, 5, 3],
        font: 'Persian'
      },
      value: {
        margin: [5, 3, 5, 3],
        font: 'Persian'
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        margin: [2, 5, 2, 5],
        font: 'Persian'
      }
    }
  };

  return new Promise((resolve, reject) => {
    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
    pdfDocGenerator.getBuffer((buffer: Buffer) => {
      if (buffer) {
        resolve(buffer);
      } else {
        reject(new Error('Failed to generate PDF buffer'));
      }
    });
  });
}

// Generate Analytics PDF Report
export async function generateAnalyticsPDFHTML(
  analyticsData: any,
  title: string
): Promise<Buffer> {

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 20],
    defaultStyle: {
      font: 'Persian',
      fontSize: 11,
      lineHeight: 1.3
    },
    content: [
      // Header
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'شرکت ممتاز برای مواد شیمیایی', style: 'companyName', alignment: 'center' },
              { text: `گزارش آمارها - ${title}`, style: 'reportTitle', alignment: 'center' },
              { text: `تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}`, alignment: 'center', margin: [0, 5, 0, 0] }
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },

      // System Statistics
      {
        style: 'section',
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: 'آمار کلی سیستم', style: 'sectionTitle', colSpan: 2, alignment: 'center' },
              {}
            ],
            [
              {
                stack: [
                  { text: `${analyticsData.totalCustomers || 0}`, style: 'statNumber', alignment: 'center' },
                  { text: 'تعداد کل مشتریان', style: 'statLabel', alignment: 'center' }
                ]
              },
              {
                stack: [
                  { text: `${analyticsData.activeCustomers || 0}`, style: 'statNumber', alignment: 'center' },
                  { text: 'مشتریان فعال', style: 'statLabel', alignment: 'center' }
                ]
              }
            ],
            [
              {
                stack: [
                  { text: `${analyticsData.newThisMonth || 0}`, style: 'statNumber', alignment: 'center' },
                  { text: 'مشتریان جدید این ماه', style: 'statLabel', alignment: 'center' }
                ]
              },
              {
                stack: [
                  { text: `${analyticsData.totalOrders || 0}`, style: 'statNumber', alignment: 'center' },
                  { text: 'تعداد کل سفارشات', style: 'statLabel', alignment: 'center' }
                ]
              }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // Monthly Performance
      {
        style: 'section',
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: 'عملکرد ماهانه', style: 'sectionTitle', colSpan: 2, alignment: 'center' },
              {}
            ],
            [
              {
                stack: [
                  { text: `${analyticsData.monthlyRevenue || 0}`, style: 'statNumber', alignment: 'center' },
                  { text: 'درآمد ماهانه (دینار)', style: 'statLabel', alignment: 'center' }
                ]
              },
              {
                stack: [
                  { text: `${analyticsData.monthlyOrders || 0}`, style: 'statNumber', alignment: 'center' },
                  { text: 'سفارشات ماهانه', style: 'statLabel', alignment: 'center' }
                ]
              }
            ],
            [
              {
                stack: [
                  { text: `${analyticsData.averageOrderValue || 0}`, style: 'statNumber', alignment: 'center' },
                  { text: 'میانگین ارزش سفارش (دینار)', style: 'statLabel', alignment: 'center' }
                ]
              },
              {
                stack: [
                  { text: `${analyticsData.conversionRate || 0}%`, style: 'statNumber', alignment: 'center' },
                  { text: 'نرخ تبدیل', style: 'statLabel', alignment: 'center' }
                ]
              }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      },

      // Summary
      {
        style: 'section',
        stack: [
          { text: 'خلاصه تحلیل', style: 'sectionTitle', alignment: 'center', margin: [0, 0, 0, 10] },
          { text: 'این گزارش شامل آمار جامع سیستم مدیریت مشتریان و فروش شرکت ممتاز برای مواد شیمیایی می‌باشد.', margin: [0, 5, 0, 5] },
          { text: 'داده‌های ارائه شده بر اساس آخرین اطلاعات موجود در سیستم محاسبه شده است.', margin: [0, 5, 0, 5] },
          { text: 'برای اطلاعات بیشتر با واحد فنی تماس بگیرید.', margin: [0, 5, 0, 5] }
        ]
      },

      // Footer
      {
        text: [
          { text: 'این گزارش به صورت الکترونیکی تولید شده است\n', alignment: 'center', fontSize: 9 },
          { text: `تاریخ تولید: ${new Date().toLocaleString('fa-IR')}`, alignment: 'center', fontSize: 9 }
        ],
        margin: [0, 30, 0, 0]
      }
    ],

    styles: {
      companyName: {
        fontSize: 18,
        bold: true,
        color: '#2563eb',
        font: 'Persian'
      },
      reportTitle: {
        fontSize: 14,
        bold: true,
        margin: [0, 5, 0, 0],
        font: 'Persian'
      },
      section: {
        margin: [0, 10, 0, 10]
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        fillColor: '#e5e7eb',
        margin: [5, 5, 5, 5],
        font: 'Persian'
      },
      statNumber: {
        fontSize: 18,
        bold: true,
        color: '#2563eb',
        margin: [0, 10, 0, 5],
        font: 'Persian'
      },
      statLabel: {
        fontSize: 10,
        color: '#6b7280',
        margin: [0, 0, 0, 10],
        font: 'Persian'
      }
    }
  };

  return new Promise((resolve, reject) => {
    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
    pdfDocGenerator.getBuffer((buffer: Buffer) => {
      if (buffer) {
        resolve(buffer);
      } else {
        reject(new Error('Failed to generate PDF buffer'));
      }
    });
  });
}
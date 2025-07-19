// PDF Generator using pdfMake with Persian/Arabic Support
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Initialize pdfMake with built-in fonts
(pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;

// Configure fonts for Persian/Arabic support
(pdfMake as any).fonts = {
  Roboto: {
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
    { text: batch.batchNumber || 'نامشخص', alignment: 'center' },
    { text: batch.barcode || 'نامشخص', alignment: 'center' },
    { text: `${batch.quantitySold || 0}`, alignment: 'center' },
    { text: `${batch.wasteAmount || 0} (${batch.quantitySold ? ((parseFloat(batch.wasteAmount || 0) / batch.quantitySold) * 100).toFixed(2) : 0}%)`, alignment: 'center' },
    { text: `${batch.effectiveQuantity || 0}`, alignment: 'center' },
    { text: `${batch.unitPrice || 0} دینار`, alignment: 'center' },
    { text: `${batch.totalPrice || 0} دینار`, alignment: 'center' }
  ]) || [
    [
      { text: 'اطلاعات بچی موجود نیست', colSpan: 7, alignment: 'center' },
      {}, {}, {}, {}, {}, {}
    ]
  ];

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 20],
    content: [
      // Header
      {
        text: 'شرکت ممتاز برای مواد شیمیایی',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      {
        text: `فاکتور - ${title}`,
        style: 'subheader',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },

      // Customer Information
      {
        text: 'اطلاعات مشتری',
        style: 'sectionHeader'
      },
      {
        table: {
          widths: ['25%', '*'],
          body: [
            ['نام:', customerData.name || 'نامشخص'],
            ['ایمیل:', customerData.email || 'نامشخص'],
            ['تلفن:', customerData.phone || 'نامشخص'],
            ['آدرس:', customerData.address || 'نامشخص']
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 5, 0, 15]
      },

      // Order Information
      {
        text: 'اطلاعات سفارش',
        style: 'sectionHeader'
      },
      {
        table: {
          widths: ['25%', '*'],
          body: [
            ['شماره سفارش:', orderData.orderNumber || orderData.id],
            ['تاریخ سفارش:', orderData.createdAt ? new Date(orderData.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'],
            ['وضعیت:', orderData.status || 'نامشخص'],
            ['مبلغ کل:', `${orderData.totalAmount || 'نامشخص'} دینار عراقی`]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 5, 0, 15]
      },

      // Batch Information
      {
        text: 'اطلاعات بچ محصولات',
        style: 'sectionHeader'
      },
      {
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
        },
        margin: [0, 5, 0, 15]
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
      header: {
        fontSize: 18,
        bold: true,
        color: '#2563eb'
      },
      subheader: {
        fontSize: 14,
        bold: true
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        fillColor: '#f3f4f6'
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
    order.id || 'نامشخص',
    `${order.totalAmount || 0} دینار`,
    order.status || 'نامشخص',
    order.createdAt ? new Date(order.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'
  ]) || [
    [
      { text: 'سفارشی ثبت نشده است', colSpan: 4, alignment: 'center' },
      {}, {}, {}
    ]
  ];

  const activityRows = activities?.slice(0, 10).map(activity => [
    activity.activityType || 'نامشخص',
    activity.description || 'توضیحی ثبت نشده',
    activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'
  ]) || [
    [
      { text: 'فعالیتی ثبت نشده است', colSpan: 3, alignment: 'center' },
      {}, {}
    ]
  ];

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 20],
    content: [
      // Header
      {
        text: 'شرکت ممتاز برای مواد شیمیایی',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      {
        text: `گزارش مشتری - ${title}`,
        style: 'subheader',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },

      // Customer Information
      {
        text: 'اطلاعات مشتری',
        style: 'sectionHeader'
      },
      {
        table: {
          widths: ['25%', '*'],
          body: [
            ['نام:', customerData.name || 'نامشخص'],
            ['ایمیل:', customerData.email || 'نامشخص'],
            ['تلفن:', customerData.phone || 'نامشخص'],
            ['آدرس:', customerData.address || 'نامشخص'],
            ['تاریخ عضویت:', customerData.createdAt ? new Date(customerData.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'],
            ['وضعیت:', customerData.customerStatus || 'فعال']
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 5, 0, 15]
      },

      // Orders Table
      {
        text: 'سفارشات اخیر',
        style: 'sectionHeader'
      },
      {
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
        },
        margin: [0, 5, 0, 15]
      },

      // Activities Table
      {
        text: 'فعالیت‌های اخیر',
        style: 'sectionHeader'
      },
      {
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
        },
        margin: [0, 5, 0, 15]
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
      header: {
        fontSize: 18,
        bold: true,
        color: '#2563eb'
      },
      subheader: {
        fontSize: 14,
        bold: true
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        fillColor: '#f3f4f6'
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

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 20],
    content: [
      // Header
      {
        text: 'شرکت ممتاز برای مواد شیمیایی',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      {
        text: `گزارش آمارها - ${title}`,
        style: 'subheader',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },

      // Statistics
      {
        text: 'آمار کلی سیستم',
        style: 'sectionHeader'
      },
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              {
                text: [
                  { text: `${analyticsData.totalCustomers || 0}\n`, fontSize: 18, bold: true, color: '#2563eb' },
                  { text: 'تعداد کل مشتریان', fontSize: 10 }
                ],
                alignment: 'center'
              },
              {
                text: [
                  { text: `${analyticsData.activeCustomers || 0}\n`, fontSize: 18, bold: true, color: '#2563eb' },
                  { text: 'مشتریان فعال', fontSize: 10 }
                ],
                alignment: 'center'
              }
            ],
            [
              {
                text: [
                  { text: `${analyticsData.newThisMonth || 0}\n`, fontSize: 18, bold: true, color: '#2563eb' },
                  { text: 'مشتریان جدید این ماه', fontSize: 10 }
                ],
                alignment: 'center'
              },
              {
                text: [
                  { text: `${analyticsData.totalOrders || 0}\n`, fontSize: 18, bold: true, color: '#2563eb' },
                  { text: 'تعداد کل سفارشات', fontSize: 10 }
                ],
                alignment: 'center'
              }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 5, 0, 15]
      },

      // Monthly Performance
      {
        text: 'عملکرد ماهانه',
        style: 'sectionHeader'
      },
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              {
                text: [
                  { text: `${analyticsData.monthlyRevenue || 0}\n`, fontSize: 18, bold: true, color: '#2563eb' },
                  { text: 'درآمد ماهانه (دینار)', fontSize: 10 }
                ],
                alignment: 'center'
              },
              {
                text: [
                  { text: `${analyticsData.monthlyOrders || 0}\n`, fontSize: 18, bold: true, color: '#2563eb' },
                  { text: 'سفارشات ماهانه', fontSize: 10 }
                ],
                alignment: 'center'
              }
            ],
            [
              {
                text: [
                  { text: `${analyticsData.averageOrderValue || 0}\n`, fontSize: 18, bold: true, color: '#2563eb' },
                  { text: 'میانگین ارزش سفارش (دینار)', fontSize: 10 }
                ],
                alignment: 'center'
              },
              {
                text: [
                  { text: `${analyticsData.conversionRate || 0}%\n`, fontSize: 18, bold: true, color: '#2563eb' },
                  { text: 'نرخ تبدیل', fontSize: 10 }
                ],
                alignment: 'center'
              }
            ]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 5, 0, 15]
      },

      // Summary
      {
        text: 'خلاصه تحلیل',
        style: 'sectionHeader'
      },
      {
        text: 'این گزارش شامل آمار جامع سیستم مدیریت مشتریان و فروش شرکت ممتاز برای مواد شیمیایی می‌باشد.',
        margin: [0, 5, 0, 5]
      },
      {
        text: 'داده‌های ارائه شده بر اساس آخرین اطلاعات موجود در سیستم محاسبه شده است.',
        margin: [0, 5, 0, 5]
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
      header: {
        fontSize: 18,
        bold: true,
        color: '#2563eb'
      },
      subheader: {
        fontSize: 14,
        bold: true
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        margin: [0, 10, 0, 5]
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
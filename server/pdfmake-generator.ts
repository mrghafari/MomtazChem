// PDFMake Generator با فونت فارسی Vazir برای Persian/Arabic support
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import vazirBase64 from "./vazir-base64";

// Setup fonts for pdfMake with default Roboto fonts
function setupVazirFont() {
  try {
    console.log('Setting up fonts for pdfMake...');
    
    // Use the default pdfMake VFS and fonts
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
    pdfMake.fonts = pdfFonts.pdfMake.fonts;
    
    console.log('✅ Font setup completed successfully with default Roboto');
  } catch (error) {
    console.error('❌ Error setting up fonts:', error);
    // Ultimate fallback - let pdfMake use its defaults
  }
}

async function generateCustomerPDFWithPDFMake(
  customerData: any,
  orders: any[],
  activities: any[],
  title: string
): Promise<Buffer> {
  
  return new Promise((resolve, reject) => {
    try {
      // Setup fonts
      setupVazirFont();

      // Safe data processing
      const customerName = customerData?.name || customerData?.customer_name || 'نامشخص';
      const customerEmail = customerData?.email || 'نامشخص';
      const customerPhone = customerData?.phone || 'نامشخص';
      const customerAddress = customerData?.address || 'نامشخص';
      const customerStatus = customerData?.customerStatus || customerData?.customer_status || 'فعال';

      // Process orders safely
      const safeOrders = Array.isArray(orders) ? orders.slice(0, 10) : [];
      const orderTableData = [
        [
          { text: 'ردیف', style: 'tableHeader', alignment: 'center' },
          { text: 'شماره سفارش', style: 'tableHeader', alignment: 'center' },
          { text: 'مبلغ (دینار)', style: 'tableHeader', alignment: 'center' },
          { text: 'وضعیت', style: 'tableHeader', alignment: 'center' },
          { text: 'تاریخ', style: 'tableHeader', alignment: 'center' }
        ]
      ];

      if (safeOrders.length > 0) {
        safeOrders.forEach((order, index) => {
          const orderId = order?.id || order?.customer_order_id || 'نامشخص';
          const amount = order?.totalAmount || order?.total_amount || 0;
          const status = order?.status || 'نامشخص';
          const date = order?.createdAt || order?.created_at || order?.orderDate;
          const formattedDate = date ? new Date(date).toLocaleDateString('fa-IR') : 'نامشخص';
          
          orderTableData.push([
            { text: (index + 1).toString(), alignment: 'center' },
            { text: orderId.toString(), alignment: 'center' },
            { text: amount.toLocaleString('fa-IR'), alignment: 'center' },
            { text: status, alignment: 'center' },
            { text: formattedDate, alignment: 'center' }
          ]);
        });
      } else {
        orderTableData.push([
          { text: 'سفارشی ثبت نشده است', colSpan: 5, alignment: 'center', style: 'noData' }
        ]);
      }

      // Process activities safely
      const safeActivities = Array.isArray(activities) ? activities.slice(0, 10) : [];
      const activityTableData = [
        [
          { text: 'ردیف', style: 'tableHeader', alignment: 'center' },
          { text: 'نوع فعالیت', style: 'tableHeader', alignment: 'center' },
          { text: 'توضیحات', style: 'tableHeader', alignment: 'center' },
          { text: 'تاریخ', style: 'tableHeader', alignment: 'center' }
        ]
      ];

      if (safeActivities.length > 0) {
        safeActivities.forEach((activity, index) => {
          const type = activity?.activityType || activity?.activity_type || 'نامشخص';
          const desc = activity?.description || 'توضیحی ثبت نشده';
          const date = activity?.createdAt || activity?.created_at;
          const formattedDate = date ? new Date(date).toLocaleDateString('fa-IR') : 'نامشخص';
          
          activityTableData.push([
            { text: (index + 1).toString(), alignment: 'center' },
            { text: type, alignment: 'center' },
            { text: desc, alignment: 'center' },
            { text: formattedDate, alignment: 'center' }
          ]);
        });
      } else {
        activityTableData.push([
          { text: 'فعالیتی ثبت نشده است', colSpan: 4, alignment: 'center', style: 'noData' }
        ]);
      }

      // Document definition
      const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [40, 60, 40, 60],
        
        content: [
          // Header
          {
            text: 'شرکت ممتاز برای مواد شیمیایی',
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          {
            text: 'Momtaz Chemical Solutions Company',
            style: 'subheader',
            alignment: 'center',
            font: 'Roboto',
            margin: [0, 0, 0, 5]
          },
          {
            text: `گزارش مشتری - ${title}`,
            style: 'title',
            alignment: 'center',
            margin: [0, 0, 0, 5]
          },
          {
            text: `تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')} | Generated: ${new Date().toLocaleDateString('en-US')}`,
            style: 'dateInfo',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          
          // Customer Information Section
          {
            text: 'اطلاعات مشتری - Customer Information',
            style: 'sectionHeader',
            margin: [0, 20, 0, 10]
          },
          {
            columns: [
              {
                width: '50%',
                stack: [
                  { text: `نام: ${customerName}`, style: 'customerInfo' },
                  { text: `ایمیل: ${customerEmail}`, style: 'customerInfo' },
                ]
              },
              {
                width: '50%',
                stack: [
                  { text: `تلفن: ${customerPhone}`, style: 'customerInfo' },
                  { text: `وضعیت: ${customerStatus}`, style: 'customerInfo' },
                ]
              }
            ],
            margin: [0, 0, 0, 10]
          },
          {
            text: `آدرس: ${customerAddress}`,
            style: 'customerInfo',
            margin: [0, 0, 0, 20]
          },

          // Orders Section
          {
            text: 'سفارشات اخیر - Recent Orders',
            style: 'sectionHeader',
            margin: [0, 20, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', '*', '*', '*'],
              body: orderTableData
            },
            layout: {
              fillColor: function(rowIndex: number) {
                return (rowIndex === 0) ? '#f3f4f6' : null;
              }
            },
            margin: [0, 0, 0, 20]
          },

          // Activities Section
          {
            text: 'فعالیت‌های اخیر - Recent Activities',
            style: 'sectionHeader',
            margin: [0, 20, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', '*', '*'],
              body: activityTableData
            },
            layout: {
              fillColor: function(rowIndex: number) {
                return (rowIndex === 0) ? '#f3f4f6' : null;
              }
            },
            margin: [0, 0, 0, 30]
          },

          // Footer
          {
            text: 'تلفن: +964 770 999 6771 | ایمیل: info@momtazchem.com | وب‌سایت: www.momtazchem.com',
            style: 'footer',
            alignment: 'center',
            margin: [0, 30, 0, 10]
          },
          {
            text: 'آدرس: عراق - بغداد | Address: Iraq - Baghdad',
            style: 'footer',
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          {
            text: `© ${new Date().getFullYear()} شرکت ممتاز برای مواد شیمیایی`,
            style: 'footer',
            alignment: 'center'
          }
        ],

        styles: {
          header: {
            fontSize: 20,
            bold: true,
            color: '#2563eb',
            font: 'Roboto'
          },
          subheader: {
            fontSize: 14,
            color: '#666666',
            font: 'Roboto'
          },
          title: {
            fontSize: 16,
            bold: true,
            color: '#333333',
            font: 'Roboto'
          },
          dateInfo: {
            fontSize: 10,
            color: '#666666',
            font: 'Roboto'
          },
          sectionHeader: {
            fontSize: 14,
            bold: true,
            color: '#2563eb',
            font: 'Roboto'
          },
          customerInfo: {
            fontSize: 11,
            color: '#333333',
            font: 'Roboto',
            margin: [0, 2, 0, 2]
          },
          tableHeader: {
            fontSize: 10,
            bold: true,
            color: '#374151',
            font: 'Roboto'
          },
          noData: {
            fontSize: 10,
            color: '#666666',
            font: 'Roboto',
            italics: true
          },
          footer: {
            fontSize: 9,
            color: '#666666',
            font: 'Roboto'
          }
        },

        defaultStyle: {
          font: 'Roboto',
          fontSize: 10,
          alignment: 'right'
        }
      };

      // Generate PDF
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });

    } catch (error) {
      console.error('PDFMake customer generation error:', error);
      reject(error);
    }
  });
}

async function generateAnalyticsPDFWithPDFMake(
  analyticsData: any,
  title: string
): Promise<Buffer> {
  
  return new Promise((resolve, reject) => {
    try {
      setupVazirFont();

      // Stats data preparation
      const stats = [
        { label: 'تعداد کل مشتریان', labelEn: 'Total Customers', value: analyticsData?.totalCustomers || 0 },
        { label: 'مشتریان فعال', labelEn: 'Active Customers', value: analyticsData?.activeCustomers || 0 },
        { label: 'تعداد کل سفارشات', labelEn: 'Total Orders', value: analyticsData?.totalOrders || 0 },
        { label: 'درآمد ماهانه (دینار)', labelEn: 'Monthly Revenue (IQD)', value: analyticsData?.monthlyRevenue || 0 },
        { label: 'مشتریان جدید این ماه', labelEn: 'New Customers This Month', value: analyticsData?.newThisMonth || 0 },
        { label: 'میانگین ارزش سفارش', labelEn: 'Average Order Value', value: analyticsData?.averageOrderValue || 0 }
      ];

      const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [40, 60, 40, 60],
        
        content: [
          // Header
          {
            text: 'گزارش آمارها',
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          {
            text: 'Analytics Report',
            style: 'subheader',
            alignment: 'center',
            font: 'Roboto',
            margin: [0, 0, 0, 5]
          },
          {
            text: 'شرکت ممتاز برای مواد شیمیایی',
            style: 'companyName',
            alignment: 'center',
            margin: [0, 0, 0, 5]
          },
          {
            text: 'Momtaz Chemical Solutions Company',
            style: 'companyNameEn',
            alignment: 'center',
            font: 'Roboto',
            margin: [0, 0, 0, 20]
          },
          {
            text: `تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')} | Generated: ${new Date().toLocaleDateString('en-US')}`,
            style: 'dateInfo',
            alignment: 'center',
            margin: [0, 0, 0, 30]
          },

          // Statistics Grid
          ...stats.map((stat, index) => ({
            columns: [
              {
                width: '50%',
                stack: [
                  {
                    text: stat.label,
                    style: 'statLabel',
                    alignment: 'right'
                  },
                  {
                    text: stat.labelEn,
                    style: 'statLabelEn',
                    alignment: 'right',
                    font: 'Roboto'
                  }
                ]
              },
              {
                width: '50%',
                text: stat.value.toLocaleString('fa-IR'),
                style: 'statValue',
                alignment: 'center'
              }
            ],
            margin: [0, 5, 0, 15]
          })),

          // Footer
          {
            text: 'تلفن: +964 770 999 6771 | ایمیل: info@momtazchem.com',
            style: 'footer',
            alignment: 'center',
            margin: [0, 40, 0, 10]
          },
          {
            text: `© ${new Date().getFullYear()} شرکت ممتاز برای مواد شیمیایی`,
            style: 'footer',
            alignment: 'center'
          }
        ],

        styles: {
          header: {
            fontSize: 22,
            bold: true,
            color: '#2563eb',
            font: 'Roboto'
          },
          subheader: {
            fontSize: 16,
            color: '#666666',
            font: 'Roboto'
          },
          companyName: {
            fontSize: 14,
            color: '#2563eb',
            font: 'Roboto'
          },
          companyNameEn: {
            fontSize: 12,
            color: '#666666',
            font: 'Roboto'
          },
          dateInfo: {
            fontSize: 10,
            color: '#666666',
            font: 'Roboto'
          },
          statLabel: {
            fontSize: 14,
            color: '#374151',
            font: 'Roboto'
          },
          statLabelEn: {
            fontSize: 11,
            color: '#6b7280',
            font: 'Roboto'
          },
          statValue: {
            fontSize: 18,
            bold: true,
            color: '#2563eb',
            font: 'Roboto'
          },
          footer: {
            fontSize: 9,
            color: '#666666',
            font: 'Roboto'
          }
        },

        defaultStyle: {
          font: 'Roboto',
          fontSize: 12,
          alignment: 'right'
        }
      };

      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });

    } catch (error) {
      console.error('PDFMake analytics generation error:', error);
      reject(error);
    }
  });
}

async function generateInvoicePDFWithPDFMake(
  customerData: any,
  orderData: any,
  batchData: any[],
  title: string
): Promise<Buffer> {
  
  return new Promise((resolve, reject) => {
    try {
      setupVazirFont();

      // Safe batch data processing
      const safeBatchData = Array.isArray(batchData) ? batchData : [];
      const batchTableData = [
        [
          { text: 'ردیف', style: 'tableHeader', alignment: 'center' },
          { text: 'شماره بچ', style: 'tableHeader', alignment: 'center' },
          { text: 'بارکد', style: 'tableHeader', alignment: 'center' },
          { text: 'مقدار فروخته شده', style: 'tableHeader', alignment: 'center' },
          { text: 'قیمت واحد', style: 'tableHeader', alignment: 'center' },
          { text: 'قیمت کل', style: 'tableHeader', alignment: 'center' }
        ]
      ];

      let totalAmount = 0;
      if (safeBatchData.length > 0) {
        safeBatchData.forEach((batch, index) => {
          const batchNumber = batch?.batchNumber || 'نامشخص';
          const barcode = batch?.barcode || 'نامشخص';
          const quantitySold = batch?.quantitySold || 0;
          const unitPrice = batch?.unitPrice || 0;
          const totalPrice = batch?.totalPrice || (quantitySold * unitPrice);
          totalAmount += totalPrice;
          
          batchTableData.push([
            { text: (index + 1).toString(), alignment: 'center' },
            { text: batchNumber.toString(), alignment: 'center' },
            { text: barcode.toString(), alignment: 'center' },
            { text: quantitySold.toString(), alignment: 'center' },
            { text: unitPrice.toLocaleString('fa-IR'), alignment: 'center' },
            { text: totalPrice.toLocaleString('fa-IR'), alignment: 'center' }
          ]);
        });
      } else {
        batchTableData.push([
          { text: 'اطلاعات محصول موجود نیست', colSpan: 6, alignment: 'center', style: 'noData' }
        ]);
      }

      const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [40, 60, 40, 60],
        
        content: [
          // Header
          {
            text: 'فاکتور',
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          {
            text: 'Invoice',
            style: 'subheader',
            alignment: 'center',
            font: 'Roboto',
            margin: [0, 0, 0, 5]
          },
          {
            text: 'شرکت ممتاز برای مواد شیمیایی',
            style: 'companyName',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          
          // Invoice Info
          {
            columns: [
              {
                width: '50%',
                text: `شماره فاکتور: ${title}`,
                style: 'invoiceInfo'
              },
              {
                width: '50%',
                text: `تاریخ صدور: ${new Date().toLocaleDateString('fa-IR')}`,
                style: 'invoiceInfo',
                alignment: 'left'
              }
            ],
            margin: [0, 0, 0, 20]
          },

          // Customer Info
          {
            text: 'اطلاعات مشتری - Customer Information',
            style: 'sectionHeader',
            margin: [0, 0, 0, 10]
          },
          {
            columns: [
              {
                width: '50%',
                stack: [
                  { text: `نام: ${customerData?.name || 'نامشخص'}`, style: 'customerInfo' },
                  { text: `ایمیل: ${customerData?.email || 'نامشخص'}`, style: 'customerInfo' }
                ]
              },
              {
                width: '50%',
                text: `تلفن: ${customerData?.phone || 'نامشخص'}`,
                style: 'customerInfo'
              }
            ],
            margin: [0, 0, 0, 20]
          },

          // Product Details
          {
            text: 'جزئیات محصولات - Product Details',
            style: 'sectionHeader',
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', '*', '*', '*', '*'],
              body: batchTableData
            },
            layout: {
              fillColor: function(rowIndex: number) {
                return (rowIndex === 0) ? '#f3f4f6' : null;
              }
            },
            margin: [0, 0, 0, 20]
          },

          // Total
          {
            text: `مجموع کل: ${totalAmount.toLocaleString('fa-IR')} دینار`,
            style: 'totalAmount',
            alignment: 'right',
            margin: [0, 10, 0, 30]
          },

          // Footer
          {
            text: 'تلفن: +964 770 999 6771 | ایمیل: info@momtazchem.com',
            style: 'footer',
            alignment: 'center',
            margin: [0, 20, 0, 10]
          },
          {
            text: `© ${new Date().getFullYear()} شرکت ممتاز برای مواد شیمیایی`,
            style: 'footer',
            alignment: 'center'
          }
        ],

        styles: {
          header: {
            fontSize: 22,
            bold: true,
            color: '#2563eb',
            font: 'Roboto'
          },
          subheader: {
            fontSize: 16,
            color: '#666666',
            font: 'Roboto'
          },
          companyName: {
            fontSize: 14,
            color: '#2563eb',
            font: 'Roboto'
          },
          invoiceInfo: {
            fontSize: 12,
            color: '#333333',
            font: 'Roboto'
          },
          sectionHeader: {
            fontSize: 14,
            bold: true,
            color: '#2563eb',
            font: 'Roboto'
          },
          customerInfo: {
            fontSize: 11,
            color: '#333333',
            font: 'Roboto',
            margin: [0, 2, 0, 2]
          },
          tableHeader: {
            fontSize: 10,
            bold: true,
            color: '#374151',
            font: 'Roboto'
          },
          noData: {
            fontSize: 10,
            color: '#666666',
            font: 'Roboto',
            italics: true
          },
          totalAmount: {
            fontSize: 16,
            bold: true,
            color: '#2563eb',
            font: 'Roboto'
          },
          footer: {
            fontSize: 9,
            color: '#666666',
            font: 'Roboto'
          }
        },

        defaultStyle: {
          font: 'Roboto',
          fontSize: 10,
          alignment: 'right'
        }
      };

      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });

    } catch (error) {
      console.error('PDFMake invoice generation error:', error);
      reject(error);
    }
  });
}

// Documentation PDF Generation
async function generateDocumentationPDFWithPDFMake(
  docType: string,
  language: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      setupVazirFont();

      const title = language === 'fa' ? 
        `راهنمای ${docType === 'User Guide' ? 'کاربری' : docType === 'Admin Guide' ? 'مدیریت' : 'فنی'} ممتاز شیمی` :
        `Momtazchem ${docType}`;
        
      const content = language === 'fa' ? [
        { text: 'مقدمه', style: 'sectionHeader' },
        { text: 'این راهنما جهت استفاده بهتر از سیستم طراحی شده است.', style: 'paragraph' },
        { text: 'ویژگی‌های اصلی', style: 'sectionHeader' },
        { text: '• مدیریت محصولات شیمیایی\n• سیستم سفارش‌گیری\n• پیگیری موجودی\n• گزارش‌گیری جامع', style: 'listItem' },
        { text: 'راهنمای استفاده', style: 'sectionHeader' },
        { text: 'برای شروع کار با سیستم، ابتدا وارد حساب کاربری خود شوید.', style: 'paragraph' }
      ] : [
        { text: 'Introduction', style: 'sectionHeader' },
        { text: 'This guide helps you use the system more effectively.', style: 'paragraph' },
        { text: 'Main Features', style: 'sectionHeader' },
        { text: '• Chemical product management\n• Order processing system\n• Inventory tracking\n• Comprehensive reporting', style: 'listItem' },
        { text: 'Usage Guide', style: 'sectionHeader' },
        { text: 'To start using the system, first log into your account.', style: 'paragraph' }
      ];

      const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [40, 60, 40, 60],
        
        content: [
          {
            text: title,
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 30]
          },
          ...content,
          {
            text: language === 'fa' ? 
              `تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}` :
              `Generated: ${new Date().toLocaleDateString('en-US')}`,
            style: 'footer',
            alignment: 'center',
            margin: [0, 30, 0, 0]
          }
        ],
        
        styles: {
          header: {
            fontSize: 20,
            bold: true,
            font: language === 'fa' ? 'Vazir' : 'Helvetica'
          },
          sectionHeader: {
            fontSize: 14,
            bold: true,
            margin: [0, 15, 0, 5],
            font: language === 'fa' ? 'Vazir' : 'Helvetica'
          },
          paragraph: {
            fontSize: 11,
            margin: [0, 0, 0, 10],
            font: language === 'fa' ? 'Vazir' : 'Helvetica'
          },
          listItem: {
            fontSize: 11,
            margin: [20, 0, 0, 10],
            font: language === 'fa' ? 'Vazir' : 'Helvetica'
          },
          footer: {
            fontSize: 10,
            italics: true,
            font: language === 'fa' ? 'Vazir' : 'Helvetica'
          }
        },
        
        defaultStyle: {
          font: language === 'fa' ? 'Vazir' : 'Helvetica',
          fontSize: 10
        }
      };

      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });

    } catch (error) {
      console.error('PDFMake documentation generation error:', error);
      reject(error);
    }
  });
}

// Export all functions
export {
  generateCustomerPDFWithPDFMake,
  generateAnalyticsPDFWithPDFMake,
  generateInvoicePDFWithPDFMake,  
  generateDocumentationPDFWithPDFMake
};

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download } from 'lucide-react';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
// Import Vazir fonts from client lib
import { vazirRegular, vazirBold } from '@/lib/vazir-fonts';

// Initialize pdfMake with Vazir fonts
pdfMake.vfs = pdfFonts.pdfMake?.vfs || {};

// Add Vazir fonts to VFS
pdfMake.vfs['Vazir-Regular.ttf'] = vazirRegular;
pdfMake.vfs['Vazir-Bold.ttf'] = vazirBold;

// Configure fonts
pdfMake.fonts = {
  Vazir: {
    normal: 'Vazir-Regular.ttf',
    bold: 'Vazir-Bold.ttf',
    italics: 'Vazir-Regular.ttf',
    bolditalics: 'Vazir-Bold.ttf'
  }
};

interface PDFGeneratorProps {
  title?: string;
  showInvoiceGenerator?: boolean;
  showCustomerReport?: boolean;
}

export default function PDFGenerator({ 
  title = "PDF Generator", 
  showInvoiceGenerator = true,
  showCustomerReport = false 
}: PDFGeneratorProps) {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: 'INV-001',
    customerName: 'نام مشتری',
    customerEmail: 'customer@example.com',
    customerPhone: '0912xxxxxxx',
    items: [
      { name: 'محصول نمونه', quantity: 1, unitPrice: 100000 }
    ],
    totalAmount: 100000
  });

  const [isGenerating, setIsGenerating] = useState(false);

  function handleDownloadPDF() {
    setIsGenerating(true);
    
    try {
      const docDefinition: any = {
        defaultStyle: {
          fontSize: 10
        },
        content: [
          // Header
          {
            text: 'فاکتور فروش - Momtaz Chem',
            fontSize: 20,
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          {
            text: 'شرکت مواد شیمیایی ممتاز',
            fontSize: 14,
            font: 'Vazir',
            alignment: 'center',
            margin: [0, 0, 0, 30]
          },
          
          // Invoice Details
          {
            columns: [
              {
                width: '50%',
                text: `شماره فاکتور: ${invoiceData.invoiceNumber}`,
                font: 'Vazir',
                fontSize: 12,
                alignment: 'right'
              },
              {
                width: '50%',
                text: `تاریخ: ${new Date().toLocaleDateString('fa-IR')}`,
                font: 'Vazir',
                fontSize: 12,
                alignment: 'left'
              }
            ],
            margin: [0, 0, 0, 20]
          },

          // Customer Information
          {
            text: 'اطلاعات مشتری',
            fontSize: 14,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              widths: ['25%', '75%'],
              body: [
                ['نام مشتری:', invoiceData.customerName],
                ['ایمیل:', invoiceData.customerEmail],
                ['شماره تماس:', invoiceData.customerPhone]
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          },

          // Items Table
          {
            text: 'اقلام سفارش',
            fontSize: 14,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['10%', '40%', '15%', '15%', '20%'],
              body: [
                ['ردیف', 'نام محصول', 'تعداد', 'قیمت واحد', 'مجموع'],
                ...invoiceData.items.map((item, index) => [
                  (index + 1).toString(),
                  item.name,
                  item.quantity.toString(),
                  `${item.unitPrice.toLocaleString()} دینار`,
                  `${(item.quantity * item.unitPrice).toLocaleString()} دینار`
                ])
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
                    ['مجموع کل:', `${invoiceData.totalAmount.toLocaleString()} دینار`]
                  ]
                },
                layout: 'noBorders'
              }
            ]
          }
        ],
        pageOrientation: 'portrait',
        pageSize: 'A4'
      };

      // Use pdfMake with createPdf().download() pattern
      console.log('📄 Generating client-side PDF with pdfMake...');
      pdfMake.createPdf(docDefinition).download(`invoice-${invoiceData.invoiceNumber}.pdf`);
      console.log('✅ PDF download initiated successfully');
      
    } catch (error) {
      console.error('خطا در تولید PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  }

  // Server-side PDF generation
  async function handleServerPDFGeneration() {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/pdf/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `invoice-${invoiceData.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        console.error('خطا در تولید PDF از سرور');
      }
    } catch (error) {
      console.error('خطا در ارتباط با سرور:', error);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {showInvoiceGenerator && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNumber">شماره فاکتور</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    invoiceNumber: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="customerName">نام مشتری</Label>
                <Input
                  id="customerName"
                  value={invoiceData.customerName}
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    customerName: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">ایمیل مشتری</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={invoiceData.customerEmail}
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    customerEmail: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">شماره تماس</Label>
                <Input
                  id="customerPhone"
                  value={invoiceData.customerPhone}
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    customerPhone: e.target.value
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="totalAmount">مجموع کل (دینار)</Label>
              <Input
                id="totalAmount"
                type="number"
                value={invoiceData.totalAmount}
                onChange={(e) => setInvoiceData(prev => ({
                  ...prev,
                  totalAmount: parseInt(e.target.value) || 0
                }))}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleDownloadPDF}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                دانلود PDF (Frontend)
              </Button>
              
              <Button 
                onClick={handleServerPDFGeneration}
                disabled={isGenerating}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                دانلود PDF (Server)
              </Button>
            </div>

            {isGenerating && (
              <p className="text-sm text-muted-foreground">
                در حال تولید PDF...
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
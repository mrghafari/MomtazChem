import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, User, Receipt } from 'lucide-react';
import PDFGenerator from '@/components/pdf-generator';

export default function PDFTest() {
  const { user } = useAuth();
  const [testInvoiceData, setTestInvoiceData] = useState({
    invoiceNumber: 'INV-2025-001',
    customerName: 'شرکت آزمایشی ممتاز',
    customerEmail: 'test@momtazchem.com',
    customerPhone: '0912-345-6789',
    items: [
      { name: 'مواد شیمیایی اول', quantity: 2, unitPrice: 150000 },
      { name: 'محلول دوم', quantity: 1, unitPrice: 200000 }
    ],
    totalAmount: 500000
  });

  const [customerReportData, setCustomerReportData] = useState({
    customerData: {
      name: 'علی احمدی',
      email: 'ali.ahmadi@test.com',
      phone: '0912-123-4567',
      address: 'تهران، خیابان آزادی'
    },
    orders: [
      { id: 1001, totalAmount: 250000, status: 'تحویل شده', createdAt: new Date() },
      { id: 1002, totalAmount: 180000, status: 'در حال پردازش', createdAt: new Date() }
    ],
    activities: [
      { activityType: 'ثبت سفارش', description: 'سفارش جدید ثبت شد', createdAt: new Date() },
      { activityType: 'پرداخت', description: 'پرداخت انجام شد', createdAt: new Date() }
    ]
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Test server PDF generation
  async function testServerPDFGeneration(type: 'invoice' | 'customer-report') {
    setIsGenerating(true);
    
    try {
      const endpoint = type === 'invoice' ? '/api/pdf/invoice' : '/api/pdf/customer-report';
      const data = type === 'invoice' ? testInvoiceData : customerReportData;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = type === 'invoice' 
          ? `invoice-${testInvoiceData.invoiceNumber}.pdf`
          : `customer-report-${customerReportData.customerData.name}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        console.log(`✅ ${type} PDF generated successfully`);
      } else {
        const errorData = await response.json();
        console.error(`❌ Error generating ${type} PDF:`, errorData);
      }
    } catch (error) {
      console.error(`❌ Error in ${type} PDF generation:`, error);
    } finally {
      setIsGenerating(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6">
            <p className="text-center">لطفاً ابتدا وارد شوید</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">آزمایش سیستم PDF</h1>
      </div>

      {/* Client-side PDF Generator */}
      <PDFGenerator 
        title="تولید PDF در سمت کلاینت"
        showInvoiceGenerator={true}
      />

      {/* Server-side PDF Testing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              آزمایش فاکتور (سرور)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label>شماره فاکتور</Label>
                <Input
                  value={testInvoiceData.invoiceNumber}
                  onChange={(e) => setTestInvoiceData(prev => ({
                    ...prev,
                    invoiceNumber: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label>نام مشتری</Label>
                <Input
                  value={testInvoiceData.customerName}
                  onChange={(e) => setTestInvoiceData(prev => ({
                    ...prev,
                    customerName: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label>مبلغ کل</Label>
                <Input
                  type="number"
                  value={testInvoiceData.totalAmount}
                  onChange={(e) => setTestInvoiceData(prev => ({
                    ...prev,
                    totalAmount: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
            </div>
            
            <Button 
              onClick={() => testServerPDFGeneration('invoice')}
              disabled={isGenerating}
              className="w-full flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              دانلود فاکتور PDF
            </Button>
          </CardContent>
        </Card>

        {/* Customer Report Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              آزمایش گزارش مشتری (سرور)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label>نام مشتری</Label>
                <Input
                  value={customerReportData.customerData.name}
                  onChange={(e) => setCustomerReportData(prev => ({
                    ...prev,
                    customerData: { ...prev.customerData, name: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label>ایمیل</Label>
                <Input
                  value={customerReportData.customerData.email}
                  onChange={(e) => setCustomerReportData(prev => ({
                    ...prev,
                    customerData: { ...prev.customerData, email: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label>آدرس</Label>
                <Textarea
                  value={customerReportData.customerData.address}
                  onChange={(e) => setCustomerReportData(prev => ({
                    ...prev,
                    customerData: { ...prev.customerData, address: e.target.value }
                  }))}
                />
              </div>
            </div>
            
            <Button 
              onClick={() => testServerPDFGeneration('customer-report')}
              disabled={isGenerating}
              className="w-full flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              دانلود گزارش مشتری PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p>در حال تولید PDF...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Font Information */}
      <Card>
        <CardHeader>
          <CardTitle>اطلاعات فونت‌های PDF</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>فونت فارسی:</strong> Vazirmatn (Regular & Bold)</p>
            <p><strong>فونت انگلیسی:</strong> Roboto (Regular, Bold, Italic)</p>
            <p><strong>پشتیبانی:</strong> متن فارسی، عربی، و RTL</p>
            <p><strong>حداکثر حجم PDF:</strong> بهینه شده برای دانلود سریع</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
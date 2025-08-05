import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  FileText, 
  Download, 
  AlertCircle, 
  Building,
  Receipt,
  Clock,
  CheckCheck
} from 'lucide-react';

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  totalAmount: string;
  status: string;
  type: string;
  isOfficial: boolean;
  officialRequestedAt?: string;
  createdAt: string;
}

export default function CheckoutSuccess() {
  const [, params] = useRoute('/checkout/success/:orderId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showOfficialPrompt, setShowOfficialPrompt] = useState(true);
  const [showLanguagePrompt, setShowLanguagePrompt] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<'ar' | 'en' | null>(null);

  const orderId = params?.orderId || null;

  // Fetch order details
  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: [`/api/customers/orders/${orderId}/payment`],
    enabled: !!orderId,
  });

  // Fetch invoice for this order
  const { data: invoiceData, isLoading: invoiceLoading, refetch: refetchInvoice } = useQuery({
    queryKey: ['/api/invoices/order', orderId],
    queryFn: async () => {
      const response = await apiRequest(`/api/invoices/customer/0`); // This will be updated with proper customer ID
      const invoices = response.data?.filter((inv: Invoice) => inv.id === orderId) || [];
      return invoices[0] || null;
    },
    enabled: !!orderId,
  });

  // Generate invoice mutation
  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/invoices/generate/${orderId}`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      toast({
        title: "فاکتور صادر شد",
        description: "فاکتور شما با موفقیت تولید شد",
      });
      refetchInvoice();
    },
    onError: () => {
      toast({
        title: "خطا در صدور فاکتور",
        description: "در صدور فاکتور مشکلی پیش آمد",
        variant: "destructive",
      });
    },
  });

  // Request official invoice mutation
  const requestOfficialMutation = useMutation({
    mutationFn: async ({ invoiceId, language }: { invoiceId: number; language: 'ar' | 'en' }) => {
      return apiRequest(`/api/invoices/${invoiceId}/request-official`, {
        method: 'POST',
        body: JSON.stringify({ language }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "درخواست فاکتور رسمی ثبت شد",
        description: "درخواست شما برای فاکتور رسمی در سیستم ثبت شد و به زودی پردازش می‌شود",
      });
      setShowOfficialPrompt(false);
      refetchInvoice();
    },
    onError: () => {
      toast({
        title: "خطا در درخواست فاکتور رسمی",
        description: "در ثبت درخواست فاکتور رسمی مشکلی پیش آمد",
        variant: "destructive",
      });
    },
  });

  // Auto-generate invoice when component loads
  useEffect(() => {
    if (orderId && orderData?.paymentStatus === 'paid' && !invoiceData && !generateInvoiceMutation.isPending) {
      generateInvoiceMutation.mutate();
    }
  }, [orderId, orderData, invoiceData]);

  // Invalidate product cache when order is complete to show updated inventory
  useEffect(() => {
    if (orderId && orderData) {
      // Clear product cache to show updated inventory quantities
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/unified/products"] });
    }
  }, [orderId, orderData, queryClient]);

  const handleRequestOfficial = () => {
    if (!selectedLanguage) {
      setShowLanguagePrompt(true);
      return;
    }
    if (invoiceData?.id) {
      requestOfficialMutation.mutate({ invoiceId: invoiceData.id, language: selectedLanguage });
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceData?.id) {
      toast({
        title: "خطا",
        description: "اطلاعات فاکتور یافت نشد",
        variant: "destructive"
      });
      return;
    }

    try {
      // Show loading toast
      toast({
        title: "درحال تولید فاکتور",
        description: "لطفاً صبر کنید...",
      });

      const response = await fetch(`/api/invoices/${invoiceData.id}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceData.invoiceNumber || invoiceData.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "دانلود موفق",
        description: "فاکتور با موفقیت دانلود شد",
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "خطا در دانلود",
        description: "امکان دانلود فاکتور وجود ندارد",
        variant: "destructive"
      });
    }
  };

  // Download invoice with batch information
  const handleDownloadInvoiceWithBatch = async () => {
    if (!orderId) return;

    try {
      // Show loading toast
      toast({
        title: "درحال تولید فاکتور با اطلاعات بچ",
        description: "لطفاً صبر کنید...",
      });

      const response = await fetch(`/api/orders/${orderId}/invoice-with-batch`);
      
      if (!response.ok) {
        throw new Error('Failed to download invoice with batch info');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderId}-with-batch.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "دانلود موفق",
        description: "فاکتور با اطلاعات بچ با موفقیت دانلود شد",
      });
    } catch (error) {
      console.error('Error downloading invoice with batch:', error);
      toast({
        title: "خطا در دانلود",
        description: "امکان دانلود فاکتور با اطلاعات بچ وجود ندارد",
        variant: "destructive"
      });
    }
  };

  if (!orderId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center p-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">خطا در صفحه</h2>
            <p className="text-gray-600 mb-4">شناسه سفارش یافت نشد</p>
            <Button onClick={() => setLocation('/shop')}>
              بازگشت به فروشگاه
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orderLoading || invoiceLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p>در حال بارگذاری...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderData || !orderData.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center p-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">خطا در بارگذاری سفارش</h2>
            <p className="text-gray-600 mb-4">امکان بارگذاری اطلاعات سفارش وجود ندارد</p>
            <Button onClick={() => setLocation('/shop')}>
              بازگشت به فروشگاه
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const order: Order = orderData.order;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl" dir="rtl">
      {/* Success Header */}
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardContent className="text-center p-8">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-800 mb-2">
            پرداخت با موفقیت انجام شد!
          </h1>
          <p className="text-green-700">
            سفارش شما ثبت شد و در حال پردازش است
          </p>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            جزئیات سفارش
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">شماره سفارش:</span>
              <span className="font-semibold">{order?.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">مبلغ کل:</span>
              <span className="font-semibold text-green-600">
                {new Intl.NumberFormat('fa-IR').format(parseFloat(order?.totalAmount || '0'))} دینار
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">وضعیت پرداخت:</span>
              <Badge variant={order?.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                {order?.paymentStatus === 'paid' ? 'پرداخت شده' : 'در انتظار پرداخت'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">وضعیت سفارش:</span>
              <Badge variant="outline">
                {order?.status === 'pending' ? 'در انتظار تایید' : 
                 order?.status === 'confirmed' ? 'تایید شده' : 
                 order?.status === 'processing' ? 'در حال پردازش' : 'نامشخص'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            فاکتور
          </CardTitle>
        </CardHeader>
        <CardContent>
          {generateInvoiceMutation.isPending ? (
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">در حال تولید فاکتور...</p>
            </div>
          ) : invoiceData ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">شماره فاکتور: {invoiceData.invoiceNumber}</p>
                  <p className="text-sm text-gray-600">
                    تاریخ صدور: {new Date(invoiceData.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <Badge variant={invoiceData.status === 'paid' ? 'default' : 'secondary'}>
                  {invoiceData.status === 'paid' ? 'پرداخت شده' : 'صادر شده'}
                </Badge>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button 
                  onClick={handleDownloadInvoice}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  دانلود فاکتور
                </Button>
                <Button 
                  onClick={handleDownloadInvoiceWithBatch}
                  variant="secondary"
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  دانلود فاکتور + بچ
                </Button>
              </div>

              {/* Official Invoice Section */}
              {!invoiceData.isOfficial && (
                <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-yellow-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-800 mb-2">
                        فاکتور رسمی
                      </h4>
                      {invoiceData.officialRequestedAt ? (
                        <div className="flex items-center gap-2 text-yellow-700">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            درخواست فاکتور رسمی ثبت شده - در حال پردازش
                          </span>
                        </div>
                      ) : showOfficialPrompt ? (
                        <>
                          <p className="text-sm text-yellow-700 mb-3">
                            آیا نیاز به فاکتور رسمی دارید؟ فاکتور رسمی شامل اطلاعات مالیاتی و مهر شرکت می‌باشد.
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={handleRequestOfficial}
                              disabled={requestOfficialMutation.isPending}
                            >
                              {requestOfficialMutation.isPending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <CheckCheck className="w-4 h-4 mr-2" />
                              )}
                              بله، فاکتور رسمی می‌خواهم
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => setShowOfficialPrompt(false)}
                            >
                              خیر، همین فاکتور کافی است
                            </Button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {invoiceData.isOfficial && (
                <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">فاکتور رسمی صادر شده</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    این فاکتور شامل تمامی اطلاعات مالیاتی و رسمی می‌باشد
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-4">
              <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-gray-600 mb-3">فاکتور هنوز تولید نشده</p>
              <Button 
                onClick={() => generateInvoiceMutation.mutate()}
                disabled={generateInvoiceMutation.isPending}
              >
                تولید فاکتور
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={() => setLocation('/shop')}
          variant="outline"
          className="flex-1"
        >
          ادامه خرید
        </Button>
        <Button 
          onClick={() => setLocation('/customer/profile')}
          className="flex-1"
        >
          مشاهده سفارشات
        </Button>
      </div>

      {/* Language Selection Modal */}
      {showLanguagePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-center">Select Invoice Language</CardTitle>
              <p className="text-sm text-gray-600 text-center">
                اختر لغة الفاتورة / Choose the invoice language
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    setSelectedLanguage('ar');
                    setShowLanguagePrompt(false);
                    if (invoiceData?.id) {
                      requestOfficialMutation.mutate({ invoiceId: invoiceData.id, language: 'ar' });
                    }
                  }}
                  variant={selectedLanguage === 'ar' ? 'default' : 'outline'}
                  className="h-16 flex flex-col items-center justify-center"
                >
                  <span className="text-lg">العربية</span>
                  <span className="text-sm text-gray-600">Arabic</span>
                </Button>
                <Button
                  onClick={() => {
                    setSelectedLanguage('en');
                    setShowLanguagePrompt(false);
                    if (invoiceData?.id) {
                      requestOfficialMutation.mutate({ invoiceId: invoiceData.id, language: 'en' });
                    }
                  }}
                  variant={selectedLanguage === 'en' ? 'default' : 'outline'}
                  className="h-16 flex flex-col items-center justify-center"
                >
                  <span className="text-lg">English</span>
                  <span className="text-sm text-gray-600">الإنجليزية</span>
                </Button>
              </div>
              <div className="text-center">
                <Button 
                  variant="ghost"
                  onClick={() => setShowLanguagePrompt(false)}
                  className="text-sm"
                >
                  إلغاء / Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
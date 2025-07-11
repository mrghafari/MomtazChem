import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle, CreditCard, Wallet, Receipt, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PaymentSuccessData {
  orderId: string;
  paymentMethod: string;
  totalAmount: number;
  walletAmountUsed?: number;
  remainingAmount?: number;
  transactionId?: string;
  creditApplicationId?: string;
}

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get payment data from URL parameters or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const status = urlParams.get('status');
    const transactionId = urlParams.get('transactionId');
    const creditApplicationId = urlParams.get('creditApplicationId');

    if (orderId && status === 'success') {
      // Check payment status from server
      fetch(`/api/payment/status/${orderId}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setPaymentData({
              orderId: data.orderId,
              paymentMethod: data.paymentMethod || 'online_payment',
              totalAmount: parseFloat(data.totalAmount || '0'),
              transactionId,
              creditApplicationId
            });
          } else {
            toast({
              title: "خطا در دریافت اطلاعات پرداخت",
              description: "لطفاً با پشتیبانی تماس بگیرید",
              variant: "destructive"
            });
          }
        })
        .catch(error => {
          console.error('Error fetching payment status:', error);
          toast({
            title: "خطا در ارتباط با سرور",
            description: "لطفاً دوباره تلاش کنید",
            variant: "destructive"
          });
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (status === 'failed' || status === 'cancelled') {
      setLoading(false);
      toast({
        title: "پرداخت ناموفق",
        description: "پرداخت شما لغو یا ناموفق بود. لطفاً دوباره تلاش کنید.",
        variant: "destructive"
      });
    } else {
      setLoading(false);
    }
  }, [toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' دینار عراقی';
  };

  const getPaymentMethodIcon = () => {
    if (!paymentData) return <CreditCard className="w-8 h-8" />;
    
    switch (paymentData.paymentMethod) {
      case 'wallet_full':
      case 'wallet_partial':
        return <Wallet className="w-8 h-8" />;
      case 'bank_receipt':
        return <Receipt className="w-8 h-8" />;
      default:
        return <CreditCard className="w-8 h-8" />;
    }
  };

  const getPaymentMethodText = () => {
    if (!paymentData) return 'پرداخت آنلاین';
    
    switch (paymentData.paymentMethod) {
      case 'wallet_full':
        return 'پرداخت کامل از کیف پول';
      case 'wallet_partial':
        return 'پرداخت ترکیبی (کیف پول + آنلاین)';
      case 'bank_receipt':
        return 'فیش واریزی بانکی';
      case 'online_payment':
        return 'پرداخت آنلاین';
      default:
        return 'پرداخت آنلاین';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-700 mb-2">
              پرداخت موفق!
            </CardTitle>
            <p className="text-gray-600">
              سفارش شما با موفقیت ثبت و پردازش شد
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {paymentData && (
              <>
                {/* Order Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">جزئیات سفارش</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">شماره سفارش:</span>
                      <span className="font-medium">{paymentData.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">مبلغ کل:</span>
                      <span className="font-medium">{formatCurrency(paymentData.totalAmount)}</span>
                    </div>
                    {paymentData.walletAmountUsed && paymentData.walletAmountUsed > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">از کیف پول:</span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(paymentData.walletAmountUsed)}
                        </span>
                      </div>
                    )}
                    {paymentData.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">شماره تراکنش:</span>
                        <span className="font-mono text-xs">{paymentData.transactionId}</span>
                      </div>
                    )}
                    {paymentData.creditApplicationId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">شناسه TBI Bank:</span>
                        <span className="font-mono text-xs">{paymentData.creditApplicationId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="flex items-center justify-center space-x-3 space-x-reverse">
                  <div className="text-green-600">
                    {getPaymentMethodIcon()}
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">روش پرداخت</p>
                    <p className="font-medium">{getPaymentMethodText()}</p>
                  </div>
                </div>
              </>
            )}

            {/* Success Message */}
            <div className="text-center space-y-3">
              <p className="text-gray-700">
                سفارش شما به بخش مالی ارسال شده و پس از بررسی، آماده‌سازی و ارسال خواهد شد.
              </p>
              <p className="text-sm text-gray-500">
                ایمیل تایید و اطلاعات پیگیری برای شما ارسال خواهد شد.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => setLocation('/shop')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                ادامه خرید
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setLocation('/customer/orders')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                مشاهده سفارشات
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
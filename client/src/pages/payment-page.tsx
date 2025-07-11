import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CreditCard, AlertCircle, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

interface PaymentPageData {
  orderId: string;
  amount: number;
  orderNumber?: string;
  paymentMethod?: string;
  walletAmountUsed?: number;
}

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState<PaymentPageData | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment cancellation mutation
  const cancelPaymentMutation = useMutation({
    mutationFn: async (orderNumber: string) => {
      return await apiRequest('POST', '/api/payment/cancel', { orderNumber });
    },
    onSuccess: (data) => {
      toast({
        title: "پرداخت لغو شد",
        description: data.refundAmount > 0 
          ? `مبلغ ${data.refundAmount.toLocaleString()} دینار به کیف پول شما برگردانده شد`
          : "پرداخت با موفقیت لغو شد",
        variant: "default"
      });
      setLocation('/shop');
    },
    onError: (error: any) => {
      toast({
        title: "خطا در لغو پرداخت",
        description: error.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    // Get payment data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const amount = urlParams.get('amount');

    if (orderId && amount) {
      // Fetch order details
      fetch(`/api/payment/status/${orderId}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setPaymentData({
              orderId: data.orderId,
              amount: parseFloat(amount),
              orderNumber: data.orderId,
              paymentMethod: data.paymentMethod,
              walletAmountUsed: data.walletAmountUsed ? parseFloat(data.walletAmountUsed) : 0
            });
          } else {
            toast({
              title: "خطا در دریافت اطلاعات سفارش",
              description: "لطفاً با پشتیبانی تماس بگیرید",
              variant: "destructive"
            });
          }
        })
        .catch(error => {
          console.error('Error fetching order details:', error);
          toast({
            title: "خطا در ارتباط با سرور",
            description: "لطفاً دوباره تلاش کنید",
            variant: "destructive"
          });
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
      setLocation('/shop');
    }
  }, [toast, setLocation]);

  const handleCancelPayment = () => {
    if (paymentData?.orderNumber) {
      cancelPaymentMutation.mutate(paymentData.orderNumber);
    }
  };

  const handleProceedToBank = () => {
    // Redirect to actual bank payment gateway
    // For now, simulate bank payment process
    toast({
      title: "هدایت به درگاه بانک",
      description: "در حال هدایت به درگاه پرداخت بانک...",
      variant: "default"
    });
    
    // Simulate payment completion for testing
    setTimeout(() => {
      setLocation(`/payment-success?orderId=${paymentData?.orderNumber}&status=success`);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">اطلاعات پرداخت یافت نشد</h2>
            <p className="text-gray-600 mb-4">لطفاً دوباره از فرآیند خرید شروع کنید</p>
            <Button onClick={() => setLocation('/shop')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              بازگشت به فروشگاه
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-center text-2xl">
              <CreditCard className="w-8 h-8 mx-auto mb-2" />
              تکمیل پرداخت
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-lg mb-3">خلاصه سفارش</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>شماره سفارش:</span>
                  <span className="font-mono">{paymentData.orderNumber}</span>
                </div>
                {paymentData.walletAmountUsed && paymentData.walletAmountUsed > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>مبلغ کسر شده از کیف پول:</span>
                      <span className="text-green-600 font-semibold">
                        {paymentData.walletAmountUsed.toLocaleString()} دینار
                      </span>
                    </div>
                    <hr className="my-2" />
                  </>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="text-blue-600">
                    {paymentData.amount.toLocaleString()} دینار
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Info */}
            {paymentData.paymentMethod === 'wallet_partial' && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  این یک پرداخت ترکیبی است. بخشی از مبلغ ({paymentData.walletAmountUsed?.toLocaleString()} دینار) 
                  از کیف پول شما کسر شده و باقی مبلغ ({paymentData.amount.toLocaleString()} دینار) 
                  باید از طریق درگاه بانک پرداخت شود.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button 
                onClick={handleProceedToBank}
                className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
                size="lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                ادامه پرداخت از طریق بانک
              </Button>

              <Button 
                onClick={handleCancelPayment}
                variant="outline"
                className="w-full border-red-500 text-red-600 hover:bg-red-50 text-lg py-3"
                size="lg"
                disabled={cancelPaymentMutation.isPending}
              >
                <X className="w-5 h-5 mr-2" />
                {cancelPaymentMutation.isPending ? 'در حال لغو...' : 'انصراف از پرداخت'}
              </Button>
            </div>

            {/* Wallet Refund Notice */}
            {paymentData.paymentMethod === 'wallet_partial' && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">توجه:</p>
                    <p>
                      در صورت انصراف از پرداخت، مبلغ کسر شده از کیف پول 
                      ({paymentData.walletAmountUsed?.toLocaleString()} دینار) 
                      به طور خودکار به حساب شما برگردانده خواهد شد.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
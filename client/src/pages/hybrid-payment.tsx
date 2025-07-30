import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, CreditCard, Wallet, ArrowRight, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentInfo {
  orderNumber: string;
  totalAmount: number;
  walletAmountUsed: number;
  remainingAmount: number;
  customerName?: string;
  customerEmail?: string;
}

export default function HybridPayment() {
  const [match, params] = useRoute("/payment/:orderNumber");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes in seconds
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Extract parameters from URL
  useEffect(() => {
    if (match && params?.orderNumber) {
      const urlParams = new URLSearchParams(window.location.search);
      const amount = parseFloat(urlParams.get('amount') || '0');
      const wallet = parseFloat(urlParams.get('wallet') || '0');
      
      setPaymentInfo({
        orderNumber: params.orderNumber,
        totalAmount: amount + wallet,
        walletAmountUsed: wallet,
        remainingAmount: amount,
      });
    }
  }, [match, params]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: "زمان پرداخت تمام شد",
            description: "لطفاً سفارش جدید ثبت کنید",
            variant: "destructive",
          });
          setLocation('/shop');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toast, setLocation]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Track abandonment when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (paymentInfo && !isProcessing) {
        // Track hybrid payment abandonment
        fetch('/api/abandoned-orders/hybrid-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: paymentInfo.orderNumber,
            walletAmount: paymentInfo.walletAmountUsed,
            bankAmount: paymentInfo.remainingAmount,
            customerInfo: {
              id: 8, // This should come from actual customer session
              email: paymentInfo.customerEmail || 'customer@example.com',
              firstName: paymentInfo.customerName?.split(' ')[0] || '',
              lastName: paymentInfo.customerName?.split(' ').slice(1).join(' ') || '',
              phone: '09xxxxxxxx' // This should come from customer session
            },
            cartData: {} // This should come from the actual cart
          }),
          keepalive: true
        }).catch(err => console.error('Failed to track abandonment:', err));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [paymentInfo, isProcessing]);

  const handleBankPayment = async () => {
    if (!paymentInfo) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate bank gateway redirect
      toast({
        title: "هدایت به درگاه بانکی",
        description: "در حال اتصال به درگاه پرداخت...",
      });
      
      // Here you would integrate with actual bank gateway
      // For now, we'll simulate the process
      setTimeout(() => {
        toast({
          title: "پرداخت موفق",
          description: "پرداخت شما با موفقیت انجام شد",
        });
        setLocation(`/order-success/${paymentInfo.orderNumber}`);
      }, 2000);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "خطا در پرداخت",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPayment = () => {
    toast({
      title: "پرداخت لغو شد",
      description: "سفارش شما در انتظار پرداخت باقی ماند",
    });
    setLocation('/profile');
  };

  if (!paymentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">تکمیل پرداخت سفارش</h1>
          <p className="text-gray-600">سفارش #{paymentInfo.orderNumber}</p>
        </div>

        {/* Timer */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 text-orange-700">
              <Clock className="w-5 h-5" />
              <span className="font-medium">زمان باقی‌مانده برای پرداخت: {formatTime(timeRemaining)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              خلاصه پرداخت
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Wallet Payment */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">پرداخت از کیف پول</p>
                  <p className="text-sm text-green-600">انجام شده</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {paymentInfo.walletAmountUsed.toLocaleString()} IQD
              </Badge>
            </div>

            {/* Remaining Payment */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-800">پرداخت از درگاه بانکی</p>
                  <p className="text-sm text-blue-600">در انتظار پرداخت</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {paymentInfo.remainingAmount.toLocaleString()} IQD
              </Badge>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex items-center justify-between text-lg font-bold">
              <span>مجموع سفارش:</span>
              <span>{paymentInfo.totalAmount.toLocaleString()} IQD</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Action */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              تکمیل پرداخت
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                مبلغ {paymentInfo.walletAmountUsed.toLocaleString()} IQD از کیف پول شما کسر شده است.
              </p>
              <p className="text-sm text-gray-600">
                برای تکمیل سفارش، مبلغ {paymentInfo.remainingAmount.toLocaleString()} IQD باقی‌مانده را از طریق درگاه بانکی پرداخت کنید.
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleBankPayment}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                پرداخت {paymentInfo.remainingAmount.toLocaleString()} IQD
              </Button>
              
              <Button 
                onClick={handleCancelPayment}
                variant="outline"
                disabled={isProcessing}
              >
                انصراف
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              با کلیک بر روی "پرداخت" به درگاه بانکی امن هدایت خواهید شد
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
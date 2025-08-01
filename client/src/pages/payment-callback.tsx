import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PaymentCallback = () => {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'success' | 'failed' | 'pending' | 'processing'>('processing');
  const [orderNumber, setOrderNumber] = useState<string>('');

  useEffect(() => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const orderRef = urlParams.get('order') || urlParams.get('orderNumber');
    
    if (orderRef) {
      setOrderNumber(orderRef);
    }

    // Determine status from URL or parameters
    if (paymentStatus === 'success') {
      setStatus('success');
      // Auto-redirect to order success page after 3 seconds
      setTimeout(() => {
        setLocation(`/order-success/${orderRef}`);
      }, 3000);
    } else if (paymentStatus === 'failed' || paymentStatus === 'error') {
      setStatus('failed');
    } else if (paymentStatus === 'pending') {
      setStatus('pending');
    } else {
      setStatus('processing');
    }
  }, [setLocation]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      default:
        return <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return {
          title: 'پرداخت موفق!',
          description: 'پرداخت شما با موفقیت انجام شد. در حال انتقال به صفحه سفارش...',
          action: 'مشاهده سفارش'
        };
      case 'failed':
        return {
          title: 'پرداخت ناموفق',
          description: 'متأسفانه پرداخت شما انجام نشد. لطفاً دوباره تلاش کنید.',
          action: 'تلاش مجدد'
        };
      case 'pending':
        return {
          title: 'پرداخت در انتظار تأیید',
          description: 'پرداخت شما در حال بررسی است. نتیجه به زودی اعلام خواهد شد.',
          action: 'مشاهده وضعیت سفارش'
        };
      default:
        return {
          title: 'در حال پردازش...',
          description: 'لطفاً منتظر بمانید، در حال بررسی نتیجه پرداخت...',
          action: 'منتظر بمانید'
        };
    }
  };

  const handleAction = () => {
    switch (status) {
      case 'success':
        setLocation(`/order-success/${orderNumber}`);
        break;
      case 'failed':
        setLocation('/profile');
        break;
      case 'pending':
        setLocation('/profile');
        break;
      default:
        // Do nothing for processing
        break;
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            نتیجه پرداخت
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">
              {statusInfo.title}
            </h2>
            <p className="text-gray-600">
              {statusInfo.description}
            </p>
            {orderNumber && (
              <p className="text-sm text-gray-500">
                شماره سفارش: {orderNumber}
              </p>
            )}
          </div>

          {status !== 'processing' && (
            <Button 
              onClick={handleAction}
              className="w-full"
            >
              {statusInfo.action}
            </Button>
          )}

          {status === 'processing' && (
            <p className="text-sm text-gray-500">
              این صفحه خودکار به‌روزرسانی می‌شود...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;
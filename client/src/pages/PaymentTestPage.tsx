import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PaymentRequest {
  id: string;
  amount: number;
  currency: string;
  gateway: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  paymentUrl?: string;
  transactionId?: string;
}

export default function PaymentTestPage() {
  const [testAmount, setTestAmount] = useState('25.50');
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Load existing payment requests on component mount
  useEffect(() => {
    const saved = localStorage.getItem('paymentTestRequests');
    if (saved) {
      setPaymentRequests(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage whenever requests change
  useEffect(() => {
    localStorage.setItem('paymentTestRequests', JSON.stringify(paymentRequests));
  }, [paymentRequests]);

  const createTestPayment = async () => {
    setLoading(true);
    
    const newRequest: PaymentRequest = {
      id: `TEST_${Date.now()}`,
      amount: parseFloat(testAmount),
      currency: 'IQD',
      gateway: 'Shaparak',
      status: 'pending',
      timestamp: new Date().toLocaleString('fa-IR'),
      transactionId: `SEP_${Date.now()}_TEST`
    };

    try {
      // Simulate bank gateway request
      const response = await fetch('/api/test-payment-gateway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(testAmount),
          currency: 'IQD',
          orderId: 'TEST_ORDER',
          customerInfo: {
            name: 'تست پرداخت',
            phone: '+964750000000'
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        newRequest.status = 'success';
        newRequest.paymentUrl = result.paymentUrl;
        
        // Open payment URL in new tab for testing
        if (result.paymentUrl) {
          window.open(result.paymentUrl, '_blank');
        }
      } else {
        newRequest.status = 'failed';
      }
    } catch (error) {
      console.error('Payment test error:', error);
      newRequest.status = 'failed';
    }

    setPaymentRequests(prev => [newRequest, ...prev]);
    setLoading(false);
  };

  const clearHistory = () => {
    setPaymentRequests([]);
  };

  const getStatusIcon = (status: PaymentRequest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: PaymentRequest['status']) => {
    const variants = {
      success: 'default',
      failed: 'destructive',
      pending: 'secondary'
    } as const;

    const labels = {
      success: 'موفق',
      failed: 'ناموفق',
      pending: 'در انتظار'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir="rtl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            صفحه تست درخواست پرداخت
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            این صفحه برای بررسی مقادیر ارسالی به درگاه بانکی ساخته شده است
          </p>
        </div>

        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              تست درخواست پرداخت جدید
            </CardTitle>
            <CardDescription>
              مبلغ مورد نظر را وارد کرده و درخواست پرداخت را آزمایش کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="testAmount">مبلغ (دینار عراقی)</Label>
                <Input
                  id="testAmount"
                  type="number"
                  step="0.01"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  placeholder="25.50"
                />
              </div>
              <Button 
                onClick={createTestPayment}
                disabled={loading || !testAmount}
                className="min-w-[120px]"
              >
                {loading ? 'در حال ارسال...' : 'تست پرداخت'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                تاریخچه درخواست‌های پرداخت
              </CardTitle>
              <CardDescription>
                جزئیات مقادیر ارسال شده به درگاه بانکی
              </CardDescription>
            </div>
            {paymentRequests.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearHistory}>
                پاک کردن تاریخچه
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {paymentRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                هنوز هیچ درخواست پرداختی ثبت نشده است
              </div>
            ) : (
              <div className="space-y-4">
                {paymentRequests.map((request, index) => (
                  <div key={request.id}>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {request.amount} {request.currency}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {request.timestamp} - {request.gateway}
                          </div>
                        </div>
                      </div>
                      <div className="text-left space-y-2">
                        {getStatusBadge(request.status)}
                        {request.transactionId && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            کد: {request.transactionId}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {request.paymentUrl && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                        <strong className="text-blue-700 dark:text-blue-300">
                          URL ارسال شده به بانک:
                        </strong>
                        <div className="mt-1 font-mono text-xs break-all text-blue-600 dark:text-blue-400">
                          {request.paymentUrl}
                        </div>
                      </div>
                    )}
                    
                    {index < paymentRequests.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Gateway Status */}
        <Card>
          <CardHeader>
            <CardTitle>وضعیت فعلی درگاه پرداخت</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="font-medium text-green-700 dark:text-green-300">
                  درگاه شاپرک
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  حالت تست فعال
                </div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <DollarSign className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="font-medium text-blue-700 dark:text-blue-300">
                  ارز پایه
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  دینار عراقی (IQD)
                </div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="font-medium text-yellow-700 dark:text-yellow-300">
                  محیط
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  Sandbox (آزمایشی)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
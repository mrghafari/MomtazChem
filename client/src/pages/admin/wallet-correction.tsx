import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Minus, Wallet, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

interface OrderInfo {
  order_id: number;
  customer_id: number;
  customer_name: string;
  order_total: number;
  wallet_balance: number;
  order_status: string;
}

interface CorrectionResult {
  success: boolean;
  transaction_id?: number;
  order_number?: string;
  customer_id?: number;
  customer_name?: string;
  correction_type?: string;
  amount?: number;
  old_balance?: number;
  new_balance?: number;
  description?: string;
  error?: string;
  error_code?: string;
}

export default function WalletCorrection() {
  const [orderNumber, setOrderNumber] = useState('');
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [correctionAmount, setCorrectionAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const { toast } = useToast();

  const searchOrder = async () => {
    if (!orderNumber.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً شماره سفارش را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    // بررسی الگوی شماره سفارش
    if (!/^M25\d{5}$/.test(orderNumber.trim())) {
      toast({
        title: "خطا",
        description: "شماره سفارش باید الگوی M2511111 را رعایت کند",
        variant: "destructive"
      });
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch('/api/admin/wallet/find-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: orderNumber.trim() })
      });

      const data = await response.json();
      if (data.success && data.order) {
        setOrderInfo(data.order);
        setResult(null);
      } else {
        toast({
          title: "سفارش یافت نشد",
          description: `سفارش با شماره ${orderNumber} یافت نشد`,
          variant: "destructive"
        });
        setOrderInfo(null);
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در جستجوی سفارش",
        variant: "destructive"
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const applyCorrection = async () => {
    if (!orderInfo || !correctionAmount.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدها را پر کنید",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(correctionAmount);
    if (isNaN(amount) || amount === 0) {
      toast({
        title: "خطا",
        description: "مبلغ تصحیح معتبر نیست",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/wallet/correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber.trim(),
          correction_amount: amount,
          description: description.trim() || null
        })
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: "موفق",
          description: `تصحیح کیف پول با موفقیت انجام شد - تراکنش #${data.transaction_id}`,
          variant: "default"
        });
        
        // به‌روزرسانی موجودی
        setOrderInfo(prev => prev ? {
          ...prev,
          wallet_balance: data.new_balance
        } : null);
        
        // پاک کردن فرم
        setCorrectionAmount('');
        setDescription('');
      } else {
        toast({
          title: "خطا",
          description: data.error || "خطا در انجام تصحیح",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ارتباط با سرور",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' دینار';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'warehouse_ready': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'در انتظار';
      case 'warehouse_ready': return 'آماده انبار';
      case 'completed': return 'تکمیل شده';
      case 'cancelled': return 'لغو شده';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Wallet className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">تصحیح کیف پول</h1>
      </div>

      {/* جستجوی سفارش */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            جستجوی سفارش
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="شماره سفارش (مثال: M2511191)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
            />
            <Button 
              onClick={searchOrder} 
              disabled={searchLoading}
              className="px-6"
            >
              {searchLoading ? 'جستجو...' : 'جستجو'}
            </Button>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              شماره سفارش باید الگوی M2511111 را رعایت کند (M25 + 5 رقم)
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* اطلاعات سفارش */}
      {orderInfo && (
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات سفارش {orderNumber}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">نام مشتری:</span>
                  <span>{orderInfo.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">شناسه مشتری:</span>
                  <span>#{orderInfo.customer_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">وضعیت سفارش:</span>
                  <Badge className={`${getStatusColor(orderInfo.order_status)} text-white`}>
                    {getStatusLabel(orderInfo.order_status)}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">مبلغ سفارش:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(orderInfo.order_total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">موجودی کیف پول:</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(orderInfo.wallet_balance)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* فرم تصحیح */}
      {orderInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              تصحیح مبلغ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  مبلغ تصحیح (دینار)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="مثال: 100 (مثبت برای اضافه، منفی برای کسر)"
                  value={correctionAmount}
                  onChange={(e) => setCorrectionAmount(e.target.value)}
                />
                <div className="text-xs text-gray-500 mt-1">
                  • مبلغ مثبت: اضافه واریزی (اضافه کردن به کیف پول)
                  <br />
                  • مبلغ منفی: کسری واریزی (کسر کردن از کیف پول)
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  توضیحات (اختیاری)
                </label>
                <Textarea
                  placeholder="توضیحات دلیل تصحیح..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={applyCorrection}
                disabled={loading || !correctionAmount.trim()}
                className="flex items-center gap-2"
              >
                {loading ? 'در حال پردازش...' : (
                  <>
                    {parseFloat(correctionAmount || '0') > 0 ? (
                      <Plus className="h-4 w-4" />
                    ) : (
                      <Minus className="h-4 w-4" />
                    )}
                    اعمال تصحیح
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* نتیجه تصحیح */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              نتیجه تصحیح
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-3 text-green-700">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <strong>تراکنش #:</strong> {result.transaction_id}
                  </div>
                  <div>
                    <strong>نوع تصحیح:</strong> {
                      result.correction_type === 'overpayment_credit' ? 'اضافه واریزی' : 'کسری واریزی'
                    }
                  </div>
                  <div>
                    <strong>مبلغ:</strong> {formatCurrency(result.amount!)}
                  </div>
                  <div>
                    <strong>موجودی جدید:</strong> {formatCurrency(result.new_balance!)}
                  </div>
                </div>
                <div>
                  <strong>توضیحات:</strong> {result.description}
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>خطا:</strong> {result.error}
                  {result.error_code && (
                    <span className="block text-xs mt-1">
                      کد خطا: {result.error_code}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
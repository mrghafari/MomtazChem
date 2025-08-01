import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Wallet, 
  Clock, 
  CheckCircle, 
  Info,
  ArrowRight,
  DollarSign 
} from "lucide-react";

interface PaymentOption {
  method: string;
  label: string;
  description: string;
  amount: number;
  walletAmount?: number;
  bankAmount?: number;
  sourceLabel: string;
  autoApproval: boolean;
  approvalMinutes?: number;
  graceDays?: number;
  smsReminders: boolean;
  emailReminders: boolean;
}

interface PaymentData {
  orderTotal: number;
  shippingCost: number;
  totalAmount: number;
  walletBalance: number;
  options: Record<string, PaymentOption>;
}

const PaymentOptionsPage = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [cartItems] = useState({"470": 1}); // نمونه محصول
  const [customerId] = useState(8); // نمونه مشتری

  // دریافت گزینه‌های پرداخت
  const { data: paymentData, isLoading, error } = useQuery<PaymentData>({
    queryKey: ['/api/payment/preview'],
    queryFn: async () => {
      const response = await fetch('/api/payment/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems,
          shippingCost: 5000,
          customerId
        })
      });
      
      if (!response.ok) {
        throw new Error('خطا در دریافت گزینه‌های پرداخت');
      }
      
      const result = await response.json();
      return result;
    }
  });

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'bank_gateway':
        return <CreditCard className="h-6 w-6 text-blue-600" />;
      case 'wallet':
        return <Wallet className="h-6 w-6 text-green-600" />;
      case 'wallet_partial':
        return <DollarSign className="h-6 w-6 text-purple-600" />;
      case 'grace_period':
        return <Clock className="h-6 w-6 text-orange-600" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  const getMethodBadge = (option: PaymentOption) => {
    // همه روش‌های پرداخت نیاز به تایید دستی مالی دارند
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
        <Clock className="h-3 w-3 mr-1" />
        نیاز به تایید دستی مالی
      </Badge>
    );
  };

  const handlePaymentSelection = async (method: string) => {
    setSelectedMethod(method);
    console.log(`🏦 [PAYMENT SELECTED] Method: ${method}`);
    
    // اینجا منطق پردازش پرداخت اضافه می‌شود
    // await processPayment(method, paymentData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری گزینه‌های پرداخت...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">❌</div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">خطا در بارگذاری</h3>
            <p className="text-gray-600">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            گزینه‌های پرداخت
          </h1>
          <p className="text-gray-600">
            روش پرداخت مورد نظر خود را انتخاب کنید
          </p>
        </div>

        {/* Order Summary */}
        {paymentData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                خلاصه سفارش
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">مجموع محصولات:</span>
                  <span className="font-medium">{paymentData.orderTotal.toLocaleString()} دینار</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">هزینه حمل و نقل:</span>
                  <span className="font-medium">{paymentData.shippingCost.toLocaleString()} دینار</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>مجموع کل:</span>
                  <span className="text-blue-600">{paymentData.totalAmount.toLocaleString()} دینار</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">موجودی کیف پول:</span>
                  <span className="font-medium text-green-600">
                    {paymentData.walletBalance.toLocaleString()} دینار
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Options */}
        {paymentData && (
          <div className="grid gap-6">
            {Object.entries(paymentData.options).map(([key, option]) => (
              <Card 
                key={key}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedMethod === option.method 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handlePaymentSelection(option.method)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getPaymentIcon(option.method)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {option.label}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    {getMethodBadge(option)}
                  </div>

                  {/* Payment Breakdown */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">مبلغ کل:</span>
                        <span className="font-medium">{option.amount.toLocaleString()} دینار</span>
                      </div>
                      
                      {option.walletAmount !== undefined && option.walletAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>از کیف پول:</span>
                          <span className="font-medium">{option.walletAmount.toLocaleString()} دینار</span>
                        </div>
                      )}
                      
                      {option.bankAmount !== undefined && option.bankAmount > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>از درگاه بانکی:</span>
                          <span className="font-medium">{option.bankAmount.toLocaleString()} دینار</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Source Label */}
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-xs">
                      {option.sourceLabel}
                    </Badge>
                    
                    {selectedMethod === option.method && (
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePaymentSelection(option.method);
                        }}
                      >
                        ادامه پرداخت
                        <ArrowRight className="h-4 w-4 mr-2" />
                      </Button>
                    )}
                  </div>

                  {/* Reminders Info */}
                  {(option.smsReminders || option.emailReminders) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Info className="h-4 w-4" />
                        <span>
                          یادآوری‌ها: 
                          {option.smsReminders && " پیامک"}
                          {option.smsReminders && option.emailReminders && " و"}
                          {option.emailReminders && " ایمیل"}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">اطلاعات مهم</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• پرداخت‌های درگاه بانکی و کیف پول پس از 5 دقیقه تایید می‌شوند</li>
                  <li>• سفارشات مهلت‌دار 3 روز برای آپلود فیش واریزی فرصت دارند</li>
                  <li>• یادآوری‌های خودکار برای سفارشات مهلت‌دار ارسال می‌شود</li>
                  <li>• اضافه پرداخت به کیف پول مشتری برگشت داده می‌شود</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentOptionsPage;
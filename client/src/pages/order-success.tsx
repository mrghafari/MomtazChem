import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Truck, MapPin, Clock, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderDetails {
  orderNumber: string;
  totalAmount: number;
  walletAmountUsed: number;
  bankAmountPaid: number;
  status: string;
  paymentStatus: string;
  estimatedDelivery: string;
  trackingNumber?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  shippingAddress: {
    address: string;
    city: string;
    country: string;
  };
}

export default function OrderSuccess() {
  const [match, params] = useRoute("/order-success/:orderNumber");
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (match && params?.orderNumber) {
      // Simulate fetching order details
      setTimeout(() => {
        setOrderDetails({
          orderNumber: params.orderNumber,
          totalAmount: 150000,
          walletAmountUsed: 50000,
          bankAmountPaid: 100000,
          status: 'confirmed',
          paymentStatus: 'paid',
          estimatedDelivery: '3-5 روز کاری',
          trackingNumber: 'MTZ' + params.orderNumber,
          items: [
            {
              productName: 'محصول شیمیایی A',
              quantity: 2,
              unitPrice: 45000
            },
            {
              productName: 'محصول شیمیایی B',
              quantity: 1,
              unitPrice: 60000
            }
          ],
          shippingAddress: {
            address: 'آدرس تحویل سفارش',
            city: 'اربیل',
            country: 'عراق'
          }
        });
        setIsLoading(false);
      }, 1000);
    }
  }, [match, params]);

  const handleDownloadInvoice = () => {
    toast({
      title: "دانلود فاکتور",
      description: "فاکتور سفارش در حال آماده‌سازی است...",
    });
  };

  const handleViewOrderDetails = () => {
    toast({
      title: "جزئیات سفارش",
      description: "هدایت به صفحه جزئیات سفارش...",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">سفارش یافت نشد</h2>
          <p className="text-gray-600">لطفاً شماره سفارش را بررسی کنید</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">سفارش با موفقیت ثبت شد!</h1>
          <p className="text-gray-600">شماره سفارش: #{orderDetails.orderNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  خلاصه پرداخت
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Wallet Payment */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium text-green-800">پرداخت از کیف پول</p>
                    <p className="text-sm text-green-600">تکمیل شده</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {orderDetails.walletAmountUsed.toLocaleString()} IQD
                  </Badge>
                </div>

                {/* Bank Payment */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-blue-800">پرداخت از درگاه بانکی</p>
                    <p className="text-sm text-blue-600">تکمیل شده</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {orderDetails.bankAmountPaid.toLocaleString()} IQD
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-lg font-bold">
                  <span>مجموع پرداخت:</span>
                  <span className="text-green-600">{orderDetails.totalAmount.toLocaleString()} IQD</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  اقلام سفارش
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderDetails.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">تعداد: {item.quantity}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{(item.quantity * item.unitPrice).toLocaleString()} IQD</p>
                        <p className="text-sm text-gray-600">{item.unitPrice.toLocaleString()} IQD × {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Status & Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  وضعیت سفارش
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-sm px-3 py-1">
                    تأیید شده
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>زمان تحویل: {orderDetails.estimatedDelivery}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.country}</span>
                  </div>
                  {orderDetails.trackingNumber && (
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span>کد پیگیری: {orderDetails.trackingNumber}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>اقدامات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleDownloadInvoice}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  دانلود فاکتور
                </Button>
                
                <Button 
                  onClick={handleViewOrderDetails}
                  className="w-full"
                  variant="outline"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  مشاهده جزئیات کامل
                </Button>

                <Button 
                  onClick={() => window.location.href = '/shop'}
                  className="w-full"
                >
                  ادامه خرید
                </Button>
              </CardContent>
            </Card>

            {/* Thank You Message */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-gray-900 mb-2">با تشکر از انتخاب شما!</h3>
                <p className="text-sm text-gray-600">
                  سفارش شما در اسرع وقت آماده‌سازی و ارسال خواهد شد. 
                  برای پیگیری سفارش می‌توانید به پروفایل کاربری خود مراجعه کنید.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { User, Package, Calendar, DollarSign, ShoppingBag, LogOut, MapPin, Building, Phone, Mail, Edit, FileText, Download, Clock, AlertTriangle, PlayCircle, Search, History } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getPersonalizedWelcome, getDashboardMotivation } from "@/utils/greetings";
import { useLanguage } from "@/contexts/LanguageContext";

const CustomerProfile = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language, direction } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Get payment methods for bank account information
  const { data: paymentMethods } = useQuery<any>({
    queryKey: ["/api/payment/methods"],
    retry: 1,
  });

  // Get customer information
  const { data: customerData, isLoading: customerLoading, error: customerError } = useQuery<any>({
    queryKey: ["/api/customers/me"],
    retry: 1,
  });

  // Get customer order history
  const { data: orderData, isLoading: ordersLoading } = useQuery<any>({
    queryKey: ["/api/customers/orders"],
    retry: 1,
    enabled: !!customerData?.success, // Only fetch orders if customer data is available
  });

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/customers/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: t.logoutSuccessful,
          description: t.logoutSuccessfulDesc,
        });
        setLocation("/shop");
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "خطا در خروج",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    }
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری اطلاعات...</p>
        </div>
      </div>
    );
  }

  if (customerError || !customerData?.success) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t.error}</h2>
            <p className="text-gray-600 mb-4">{t.loginToAccessWallet}</p>
            <Button onClick={() => setLocation("/customer/auth")}>
              {t.goToLogin}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customer = customerData?.customer || null;
  const orders = orderData?.success ? orderData.data : [];
  
  // Safety check for customer data
  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t.unauthorized}</h2>
            <p className="text-gray-600 mb-4">{t.unauthorizedDesc}</p>
            <Button onClick={() => setLocation("/customer/auth")}>
              {t.login}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Enhanced order categorization logic
  const categorizeOrders = (orders: any[] = []) => {
    const regularOrders = (orders || []).filter((order: any) => {
      // Cash on delivery or completed orders
      return order.payment_method === 'cash_on_delivery' || 
             order.current_status === 'completed' ||
             (order.payment_status === 'paid' && order.current_status !== 'payment_grace_period');
    });

    const temporaryOrders = (orders || []).filter((order: any) => {
      // Orders in grace period for payment (temporary orders)
      return order.current_status === 'payment_grace_period' ||
             (order.payment_status === 'pending' && order.created_at && 
              new Date().getTime() - new Date(order.created_at).getTime() < 3 * 24 * 60 * 60 * 1000);
    });

    const otherOrders = (orders || []).filter((order: any) => {
      // Orders that don't fit in regular or temporary categories
      return !regularOrders.includes(order) && !temporaryOrders.includes(order);
    });

    return { regularOrders, temporaryOrders, otherOrders };
  };

  const { regularOrders, temporaryOrders, otherOrders } = categorizeOrders(orders);
  
  // Orders that need payment (unpaid orders notification)
  const unpaidOrders = (orders || []).filter((order: any) => 
    ['pending', 'payment_grace_period', 'unpaid', 'pending'].includes(order.payment_status) ||
    ['payment_grace_period'].includes(order.current_status)
  );

  // Get history orders for the sheet
  const historyOrders = (orders || []).filter((order: any) => 
    ['completed', 'delivered', 'logistics_delivered'].includes(order.current_status)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {t.welcomeCustomer}, {customer?.firstName || ''} {customer?.lastName || ''}!
              </h1>
              <p className="text-lg text-blue-600 mt-1">
                {getPersonalizedWelcome(customer?.firstName || 'کاربر', 'customer', 'fa')}
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-700">پروفایل مشتری</h2>
              <p className="text-gray-600">مدیریت حساب و مشاهده تاریخچه سفارشات</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/customer/profile/edit")}
            >
              <Edit className="w-4 h-4 mr-2" />
              ویرایش پروفایل
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/shop")}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              فروشگاه
            </Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              خروج
            </Button>
          </div>
        </div>

        {/* Unpaid Orders Notification */}
        {unpaidOrders.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg" dir="rtl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800">
                  {customer?.firstName || ''} {customer?.lastName || ''} - توجه: سفارشات پرداخت نشده
                </h3>
                <p className="text-yellow-700 mt-1">
                  شما {unpaidOrders.length} سفارش پرداخت نشده دارید. لطفاً پرداخت کنید یا سفارش را لغو کنید تا موجودی آزاد شود.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Regular Orders */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t.regularOrders}</CardTitle>
                <Badge variant="secondary">{regularOrders.length}</Badge>
              </div>
              <p className="text-sm text-gray-600">{t.regularOrdersDesc}</p>
            </CardHeader>
            <CardContent>
              {regularOrders.length > 0 ? (
                <div className="space-y-3">
                  {(regularOrders || []).slice(0, 2).map((order: any) => (
                    <div key={order.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-green-800">
                            {order.simple_order_number || `#${order.id}`}
                          </p>
                          <p className="text-sm text-green-600">
                            {new Date(order.created_at).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-700">
                          {order.current_status === 'completed' ? 'تکمیل شده' : 'عادی'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {regularOrders.length > 2 && (
                    <p className="text-sm text-gray-500 text-center">
                      و {regularOrders.length - 2} سفارش دیگر...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  {t.noRegularOrders}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Temporary Orders */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t.temporaryOrders}</CardTitle>
                <Badge variant="secondary" className="bg-orange-100 text-orange-600">
                  {temporaryOrders.length}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{t.temporaryOrdersDesc}</p>
            </CardHeader>
            <CardContent>
              {temporaryOrders.length > 0 ? (
                <div className="space-y-3">
                  {(temporaryOrders || []).slice(0, 2).map((order: any) => (
                    <div key={order.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-orange-800">
                            {order.simple_order_number || `#${order.id}`}
                          </p>
                          <p className="text-sm text-orange-600">
                            {new Date(order.created_at).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-700">
                          {t.temporary}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {temporaryOrders.length > 2 && (
                    <p className="text-sm text-gray-500 text-center">
                      و {temporaryOrders.length - 2} سفارش دیگر...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  {t.noTemporaryOrders}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Other Orders */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t.otherOrders}</CardTitle>
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  {otherOrders.length}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{t.otherOrdersDesc}</p>
            </CardHeader>
            <CardContent>
              {otherOrders.length > 0 ? (
                <div className="space-y-3">
                  {(otherOrders || []).slice(0, 2).map((order: any) => (
                    <div key={order.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">
                            {order.simple_order_number || `#${order.id}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                        <Badge className="bg-gray-100 text-gray-700">
                          {t.other}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {otherOrders.length > 2 && (
                    <p className="text-sm text-gray-500 text-center">
                      و {otherOrders.length - 2} سفارش دیگر...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  {t.noOtherOrders}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer Information Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t.accountInformation}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">نام و نام خانوادگی</p>
                    <p className="font-medium">{customer?.firstName || ''} {customer?.lastName || ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">ایمیل</p>
                    <p className="font-medium">{customer?.email || 'ثبت نشده'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">شماره تلفن</p>
                    <p className="font-medium">{customer?.phone || 'ثبت نشده'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">شرکت</p>
                    <p className="font-medium">{customer?.company || 'ثبت نشده'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                تاریخچه سفارشات
              </CardTitle>
              <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Search className="w-4 h-4 mr-2" />
                    جستجوی پیشرفته
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>جستجو در تاریخچه سفارشات</SheetTitle>
                    <SheetDescription>
                      جستجو و فیلتر در همه سفارشات شما
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="mt-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="جستجو در سابقه سفارشات..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-6">
                    {historyOrders.filter((order: any) => 
                      order.simple_order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      order.id?.toString().includes(searchQuery)
                    ).length === 0 ? (
                      <div className="text-center py-8">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">هیچ سفارشی با این جستجو یافت نشد</p>
                      </div>
                    ) : (
                      historyOrders.filter((order: any) => 
                        order.simple_order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        order.id?.toString().includes(searchQuery)
                      ).map((order: any) => (
                        <div key={order.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">
                                {order.simple_order_number || `#${order.id}`}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.created_at).toLocaleDateString('fa-IR')}
                              </p>
                            </div>
                            <Badge>
                              {order.current_status === 'completed' ? 'تکمیل شده' : 'تحویل شده'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            مبلغ: {order.total_amount?.toLocaleString('fa-IR')} تومان
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(orders || []).slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Package className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {order.simple_order_number || `سفارش #${order.id}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge className={
                      order.current_status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.current_status === 'payment_grace_period' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {order.current_status === 'completed' ? 'تکمیل شده' :
                       order.current_status === 'payment_grace_period' ? 'در دوره مهلت' : 
                       'در حال پردازش'}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.total_amount?.toLocaleString('fa-IR')} تومان
                    </p>
                  </div>
                </div>
              ))}
              
              {(orders || []).length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">هنوز هیچ سفارشی ثبت نکرده‌اید</p>
                  <Button className="mt-3" onClick={() => setLocation("/shop")}>
                    شروع خرید
                  </Button>
                </div>
              )}
              
              {(orders || []).length > 5 && (
                <div className="text-center">
                  <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
                    مشاهده همه سفارشات ({(orders || []).length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CustomerProfile
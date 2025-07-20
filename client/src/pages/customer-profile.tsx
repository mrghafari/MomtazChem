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
        variant: "destructive",
        title: t.error,
        description: t.logoutError,
      });
    }
  };

  const handleGenerateOfficialInvoice = async (orderId: number) => {
    try {
      // First, generate invoice from order
      const generateResponse = await fetch(`/api/invoices/generate/${orderId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate invoice');
      }

      const generateResult = await generateResponse.json();
      const invoiceId = generateResult.data.id;

      // Then, request official invoice
      const officialResponse = await fetch(`/api/invoices/${invoiceId}/request-official`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: language })
      });

      if (!officialResponse.ok) {
        throw new Error('Failed to request official invoice');
      }

      toast({
        title: "درخواست فاکتور رسمی",
        description: "درخواست فاکتور رسمی با موفقیت ثبت شد. فاکتور پس از تایید برای شما ارسال خواهد شد.",
      });

    } catch (error) {
      console.error('Error generating official invoice:', error);
      toast({
        variant: "destructive",
        title: "خطا در صدور فاکتور",
        description: "امکان صدور فاکتور رسمی وجود ندارد. لطفاً دوباره تلاش کنید.",
      });
    }
  };

  const handleActivateGracePeriodOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/customers/orders/${orderId}/activate-grace-period`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to activate order');
      }

      toast({
        title: "فعال‌سازی سفارش",
        description: result.message,
      });

      // Refresh orders to show updated status
      window.location.reload();

    } catch (error) {
      console.error('Error activating grace period order:', error);
      toast({
        variant: "destructive",
        title: "خطا در فعال‌سازی",
        description: error.message || "امکان فعال‌سازی سفارش وجود ندارد. لطفاً دوباره تلاش کنید.",
      });
    }
  };

  const handleCancelOrder = async (orderId: number, orderNumber: string) => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید سفارش ${orderNumber} را لغو کنید؟ موجودی رزرو شده به فروشگاه بازگردانده خواهد شد.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/orders/${orderId}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'لغو توسط مشتری - آزادسازی موجودی'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در لغو سفارش');
      }

      toast({
        title: "سفارش لغو شد",
        description: "سفارش با موفقیت لغو شد و موجودی به فروشگاه بازگردانده شد",
      });

      // Refresh order data
      window.location.reload();

    } catch (error) {
      console.error('Error canceling order:', error);
      toast({
        variant: "destructive",
        title: "خطا در لغو سفارش",
        description: error.message || "امکان لغو سفارش وجود ندارد",
      });
    }
  };

  const handleDownloadInvoice = async (orderId: number) => {
    try {
      // First, generate invoice from order if doesn't exist
      const generateResponse = await fetch(`/api/invoices/generate/${orderId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate invoice');
      }

      const generateResult = await generateResponse.json();
      const invoiceId = generateResult.data.id;

      // Download the invoice PDF
      const downloadResponse = await fetch(`/api/invoices/${invoiceId}/download`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!downloadResponse.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderId}.pdf`;
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
        variant: "destructive",
        title: "خطا در دانلود",
        description: "امکان دانلود فاکتور وجود ندارد",
      });
    }
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check for authentication errors or missing data
  if (customerError || (!customerLoading && (!customerData || !customerData.success))) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${direction === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{t.error}</h2>
            <p className="text-gray-500 mb-6">{t.loginToAccessWallet}</p>
            <div className="space-y-3">
              <Button onClick={() => setLocation("/customer/login")} className="w-full">
                {t.login}
              </Button>
              <Button onClick={() => setLocation("/shop")} variant="outline" className="w-full">
                {t.continueShopping}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customer = customerData.customer;
  const orders = orderData?.success ? orderData.orders : [];

  // Check for unpaid orders
  const unpaidOrders = orders.filter(order => 
    order.current_status === 'pending' || 
    order.current_status === 'payment_grace_period' ||
    order.payment_status === 'unpaid' ||
    order.payment_status === 'pending'
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-orange-100 text-orange-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'payment_grace_period': return 'bg-amber-100 text-amber-800';
      case 'financial_pending': return 'bg-blue-100 text-blue-800';
      case 'financial_approved': return 'bg-blue-100 text-blue-800';
      case 'warehouse_pending': return 'bg-orange-100 text-orange-800';
      case 'warehouse_processing': return 'bg-orange-100 text-orange-800';
      case 'warehouse_approved': return 'bg-green-100 text-green-800';
      case 'logistics_pending': return 'bg-purple-100 text-purple-800';
      case 'logistics_processing': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return t.pending;
      case 'confirmed': return t.confirmed;
      case 'processing': return t.processing;
      case 'shipped': return t.shipped;
      case 'delivered': return t.delivered;
      case 'cancelled': return t.cancelled;
      case 'payment_grace_period': return 'مهلت پرداخت';
      case 'financial_pending': return 'در حال پردازش مالی';
      case 'financial_approved': return 'تایید شده توسط واحد مالی';
      case 'warehouse_pending': return 'در حال بسته‌بندی';
      case 'warehouse_processing': return 'در حال بسته‌بندی';
      case 'warehouse_approved': return 'بسته‌بندی شده';
      case 'logistics_pending': return 'آماده ارسال';
      case 'logistics_processing': return 'در حال ارسال';
      case 'completed': return 'تکمیل شده';
      default: return status;
    }
  };

  const formatTimeRemaining = (hours: number) => {
    if (hours <= 0) return 'منقضی شده';
    if (hours < 1) return 'کمتر از ۱ ساعت';
    if (hours < 24) return `${Math.floor(hours)} ساعت`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    return `${days} روز و ${remainingHours} ساعت`;
  };

  const totalSpent = orders.reduce((sum: number, order: any) => 
    sum + parseFloat(order.totalAmount || 0), 0
  );

  // Filter orders based on search query
  const filteredOrders = orders.filter((order: any) => 
    order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.totalAmount?.toString().includes(searchQuery) ||
    getStatusLabel(order.status).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate orders into active (including temporary) and history
  const activeOrders = orders.filter((order: any) => {
    // Keep temporary orders in active list while they are active
    if (order.orderType === 'temporary' || order.orderCategory === 'temporary') {
      return order.gracePeriodStatus === 'active' || order.current_status === 'payment_grace_period';
    }
    // For regular orders, only show the most recent one
    return orders.indexOf(order) === 0;
  });

  const historyOrders = orders.filter((order: any) => {
    // Expired temporary orders go to history
    if (order.orderType === 'temporary' || order.orderCategory === 'temporary') {
      return order.gracePeriodStatus !== 'active' && order.current_status !== 'payment_grace_period';
    }
    // All other orders except the most recent one go to history
    return orders.indexOf(order) !== 0;
  });

  // Function to render a single order
  const renderOrder = (order: any) => (
    <div key={order.id} className={`border rounded-lg p-4 ${(order.orderType === 'temporary' || order.orderCategory === 'temporary') ? 'border-amber-200 bg-amber-50' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">
              Order #{order.orderNumber || order.id}
            </h4>
            {(order.orderType === 'temporary' || order.orderCategory === 'temporary') && (
              <Badge className="bg-orange-100 text-orange-800">
                <Clock className="w-3 h-3 mr-1" />
                سفارش موقت
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(order.createdAt)}
          </p>
          {(order.orderType === 'temporary' || order.orderCategory === 'temporary') && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {order.customerName}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {order.customerPhone}
                </span>
              </div>
              {order.gracePeriodStatus === 'active' ? (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  مهلت باقی‌مانده: {formatTimeRemaining(order.hoursRemaining)}
                </p>
              ) : (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  مهلت پرداخت منقضی شده
                </p>
              )}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="font-semibold text-lg">{parseFloat(order.totalAmount).toFixed(2)} {order.currency || 'IQD'}</p>
          <Badge className={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
          {/* Show tracking code for completed orders */}
          {(order.status === 'completed' || order.currentStatus === 'completed') && order.deliveryCode && (
            <div className="mt-2 text-sm">
              <div className="bg-green-50 border border-green-200 rounded px-2 py-1">
                <span className="text-green-700 font-medium">کد رهگیری: </span>
                <span className="text-green-900 font-mono">{order.deliveryCode}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {order.items && order.items.length > 0 && (
        <div>
          <Separator className="mb-3" />
          <div className="space-y-2">
            <h5 className="font-medium text-gray-700">Order Items:</h5>
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.product_name} × {parseFloat(item.quantity)}</span>
                <span>{parseFloat(item.total_price).toFixed(2)} IQD</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {order.notes && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm text-gray-600">
            <strong>Notes:</strong> {order.notes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t flex gap-2 flex-wrap">
        {(order.orderType === 'temporary' || order.orderCategory === 'temporary') && order.gracePeriodStatus === 'active' ? (
          <>
            <Button
              size="sm"
              onClick={() => handleActivateGracePeriodOrder(order.orderNumber)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <PlayCircle className="w-4 h-4" />
              فعال‌سازی سفارش
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation(`/customer/bank-receipt-upload?orderId=${order.orderNumber}`)}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              آپلود رسید بانکی
            </Button>
          </>
        ) : (order.orderType === 'temporary' || order.orderCategory === 'temporary') && order.gracePeriodStatus === 'expired' ? (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
            این سفارش منقضی شده است و قابل فعال‌سازی نیست
          </div>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadInvoice(order.id)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              دانلود فاکتور
            </Button>
            <Button
              size="sm"
              onClick={() => handleGenerateOfficialInvoice(order.id)}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              درخواست فاکتور رسمی
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        {/* Unpaid Orders Notification */}
        {unpaidOrders.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg" dir="rtl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800">
                  {customer.firstName} {customer.lastName} - توجه: سفارشات پرداخت نشده
                </h3>
                <p className="text-yellow-700 mt-1">
                  شما {unpaidOrders.length} سفارش پرداخت نشده دارید. لطفاً پرداخت کنید یا سفارش را لغو کنید تا موجودی آزاد شود.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {unpaidOrders.map(order => (
                    <div key={order.id} className="flex items-center gap-2 bg-yellow-100 px-3 py-1 rounded-md">
                      <span className="text-sm font-medium text-yellow-800">
                        {order.simple_order_number || `ORD-${order.id}`}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelOrder(order.id, order.simple_order_number || `ORD-${order.id}`)}
                        className="text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      >
                        لغو سفارش
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bank Account Information for Temporary Payment Orders */}
        {unpaidOrders.some(order => order.current_status === 'payment_grace_period') && paymentMethods?.success && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg" dir="rtl">
            <div className="flex items-center gap-3 mb-3">
              <Building className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">
                اطلاعات حساب بانکی شرکت برای واریز
              </h3>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              {paymentMethods.data
                .filter((method: any) => method.type === 'iraqi_bank' || method.type === 'bank_transfer')
                .map((bankMethod: any, index: number) => (
                <div key={bankMethod.id} className={`${index > 0 ? 'mt-4 pt-4 border-t' : ''}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">نام بانک:</p>
                      <p className="font-semibold text-gray-900">
                        {bankMethod.config?.bankName || bankMethod.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">شماره حساب:</p>
                      <p className="font-mono text-lg font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded">
                        {bankMethod.config?.accountNumber || 'شماره حساب موجود نیست'}
                      </p>
                    </div>
                    {bankMethod.config?.swiftCode && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">کد SWIFT:</p>
                        <p className="font-mono text-sm font-medium text-gray-700">
                          {bankMethod.config.swiftCode}
                        </p>
                      </div>
                    )}
                    {bankMethod.config?.instructions && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600 mb-1">دستورالعمل پرداخت:</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {bankMethod.config.instructions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>نکته مهم:</strong> پس از واریز وجه، حتماً رسید بانکی را از طریق دکمه "آپلود رسید بانکی" ارسال کنید.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {customer.firstName} {customer.lastName}!
              </h1>
              <p className="text-lg text-blue-600 mt-1">
                {getPersonalizedWelcome(customer.firstName, 'customer', 'en')}
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-700">Customer Profile</h2>
              <p className="text-gray-600">Manage your account and view order history</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/customer/profile/edit")}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/shop")}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  <p className="text-gray-900 font-semibold">{customer.firstName} {customer.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="text-gray-900">{customer.email}</p>
                </div>
                {customer.company && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Company
                    </label>
                    <p className="text-gray-900">{customer.company}</p>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </label>
                    <p className="text-gray-900">{customer.phone}</p>
                  </div>
                )}
                {customer.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </label>
                    <p className="text-gray-900">{customer.address}</p>
                  </div>
                )}
                {customer.city && customer.country && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900">{customer.city}, {customer.country}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Statistics */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Order Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Orders:</span>
                  <span className="font-semibold">{orders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Spent:</span>
                  <span className="font-semibold">${totalSpent.toFixed(2)}</span>
                </div>
                {orders.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Order:</span>
                    <span className="font-semibold">${(totalSpent / orders.length).toFixed(2)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orders Yet</h3>
                    <p className="text-gray-500 mb-6">Start shopping to see your order history here.</p>
                    <Button onClick={() => setLocation("/shop")}>
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Show all active orders (recent order + active temporary orders) */}
                    {activeOrders.map((order: any) => renderOrder(order))}
                    
                    {/* Purchase History Button */}
                    {historyOrders.length > 0 && (
                      <div className="text-center pt-4 border-t">
                        <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                          <SheetTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                              <History className="w-4 h-4" />
                              سابقه خرید ({historyOrders.length} سفارش)
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                            <SheetHeader>
                              <SheetTitle className="flex items-center gap-2">
                                <History className="w-5 h-5" />
                                سابقه کامل خرید
                              </SheetTitle>
                              <SheetDescription>
                                سفارشات تکمیل شده و منقضی ({historyOrders.length} سفارش)
                              </SheetDescription>
                            </SheetHeader>
                            
                            {/* Search Box */}
                            <div className="my-4">
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
                            
                            {/* History Orders List */}
                            <div className="space-y-4 mt-6">
                              {historyOrders.filter((order: any) => 
                                order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                order.totalAmount?.toString().includes(searchQuery) ||
                                getStatusLabel(order.status).toLowerCase().includes(searchQuery.toLowerCase())
                              ).length === 0 ? (
                                <div className="text-center py-8">
                                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                  <p className="text-gray-500">هیچ سفارشی با این جستجو یافت نشد</p>
                                </div>
                              ) : (
                                historyOrders.filter((order: any) => 
                                  order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  order.totalAmount?.toString().includes(searchQuery) ||
                                  getStatusLabel(order.status).toLowerCase().includes(searchQuery.toLowerCase())
                                ).map((order: any) => renderOrder(order))
                              )}
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
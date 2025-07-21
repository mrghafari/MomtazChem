import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { User, Package, Calendar, DollarSign, ShoppingBag, LogOut, MapPin, Building, Phone, Mail, Edit, FileText, Download, Clock, AlertTriangle, PlayCircle, Trash2, History, Search, X } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { getPersonalizedWelcome, getDashboardMotivation } from "@/utils/greetings";
import { useLanguage } from "@/contexts/LanguageContext";

const CustomerProfile = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language, direction } = useLanguage();
  const queryClient = useQueryClient();
  
  // Purchase history state
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [purchaseHistoryOrders, setPurchaseHistoryOrders] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const handleDeleteTemporaryOrder = async (orderId: number, orderNumber: string) => {
    if (!confirm(`آیا از حذف سفارش موقت ${orderNumber} اطمینان دارید؟\nشماره سفارش حذف شده به عنوان "حذف شده" باقی می‌ماند و محصولات رزرو شده آزاد خواهند شد.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/orders/${orderId}/delete-temporary`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "سفارش حذف شد",
          description: `${result.message} - ${result.data?.releasedProducts?.length || 0} محصول آزاد شد`,
        });

        // Refresh orders list without page reload
        queryClient.invalidateQueries({ queryKey: ['/api/customers/orders'] });
        
        console.log(`✅ Temporary order ${orderNumber} deleted with preserved numbering`, result.data);
      } else {
        toast({
          variant: "destructive",
          title: "خطا در حذف سفارش",
          description: result.message,
        });
      }

    } catch (error) {
      console.error('Error deleting temporary order:', error);
      toast({
        variant: "destructive",
        title: "خطا در حذف",
        description: "امکان حذف سفارش موقت وجود ندارد",
      });
    }
  };

  // Load complete purchase history
  const loadPurchaseHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/customers/orders/complete-history', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPurchaseHistoryOrders(result.orders || []);
        }
      }
    } catch (error) {
      console.error('Error loading purchase history:', error);
      toast({
        variant: "destructive",
        title: "خطا در بارگذاری",
        description: "امکان بارگذاری سابقه خرید وجود ندارد"
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filter orders based on search term
  const filteredHistoryOrders = purchaseHistoryOrders.filter(order =>
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items?.some((item: any) => 
      item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
  const totalOrders = orderData?.totalOrders || 0;
  const hiddenOrders = orderData?.hiddenOrders || 0;
  const abandonedOrders = orderData?.abandonedOrders || [];
  const hasAbandonedOrders = orderData?.hasAbandonedOrders || false;
  const abandonedCount = orderData?.abandonedCount || 0;
  const displayInfo = orderData?.displayInfo;

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
      case 'financial_pending': return 'در انتظار بررسی مالی';
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
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
                  <span className="font-semibold">{totalOrders}</span>
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
                  {totalOrders > orders.length && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {orders.length} از {totalOrders}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  {hiddenOrders > 0 && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{hiddenOrders} سفارش دیگر</span> در سوابق خرید مخفی است
                    </p>
                  )}
                  {hasAbandonedOrders && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-md hover:bg-amber-100 transition-colors">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {abandonedCount} سفارش رها شده موجود است
                          </span>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            سفارشات رها شده ({abandonedCount} سفارش)
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-amber-800 text-sm">
                              <strong>توضیح:</strong> این سفارشات دارای مهلت پرداخت ۳ روزه بوده‌اند که مهلت آن‌ها منقضی شده است. برای تکمیل خرید می‌توانید سفارش جدید ثبت کنید.
                            </p>
                          </div>
                          
                          {abandonedOrders.map((order: any) => (
                            <Card key={order.id} className="border-amber-200">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h3 className="font-semibold text-gray-900">
                                      سفارش {order.orderNumber}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      {formatDate(order.createdAt)}
                                    </p>
                                  </div>
                                  <div className="text-left">
                                    <p className="text-lg font-bold text-amber-600">
                                      ${parseFloat(order.totalAmount).toFixed(2)}
                                    </p>
                                    <Badge className="bg-red-100 text-red-800">
                                      منقضی شده
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="text-sm text-gray-600">
                                  <p><strong>روش پرداخت:</strong> واریز بانکی با مهلت ۳ روزه</p>
                                  <p><strong>وضعیت:</strong> مهلت پرداخت منقضی شده</p>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-amber-200">
                                  <Button 
                                    size="sm" 
                                    onClick={() => setLocation("/shop")}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    ثبت سفارش جدید
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
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
                    {orders.map((order: any) => (
                      <div key={order.id} className={`border rounded-lg p-4 ${(order.status === 'pending' || order.status === 'payment_grace_period') ? 'border-amber-200 bg-amber-50' : ''}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">
                                {order.orderNumber}
                              </h4>
                              {(order.status === 'pending' || order.status === 'payment_grace_period') && (
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
                            {(order.status === 'pending' || order.status === 'payment_grace_period') && (
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
                          {/* For temporary orders: show delete button */}
                          {(order.orderType === 'temporary' || order.orderCategory === 'temporary') ? (
                            <>
                              {/* Grace period specific buttons */}
                              {(order.status === 'pending' || order.status === 'payment_grace_period') && order.gracePeriodStatus === 'active' && (
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
                              )}

                              {/* Delete button for all temporary orders */}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteTemporaryOrder(order.id, order.orderNumber)}
                                className="flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                حذف سفارش موقت
                              </Button>

                              {/* Grace period expired message */}
                              {(order.status === 'pending' || order.status === 'payment_grace_period') && order.gracePeriodStatus === 'expired' && (
                                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                                  این سفارش منقضی شده است و قابل فعال‌سازی نیست
                                </div>
                              )}
                            </>
                          ) : (
                            /* For regular orders: show standard buttons */
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Purchase History Button */}
            <div className="mt-4">
              <Dialog open={showPurchaseHistory} onOpenChange={setShowPurchaseHistory}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={loadPurchaseHistory}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <History className="w-5 h-5" />
                    مشاهده سابقه خرید کامل
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-right">
                      <History className="w-5 h-5" />
                      سابقه خرید کامل
                    </DialogTitle>
                  </DialogHeader>

                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="جستجو بر اساس شماره سفارش، وضعیت یا نام محصول..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10 text-right"
                    />
                    {searchTerm && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
                        onClick={() => setSearchTerm("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Orders List with Slider */}
                  <div className="overflow-y-auto max-h-[60vh] space-y-4">
                    {historyLoading ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <p className="mt-2 text-gray-600">در حال بارگذاری سابقه خرید...</p>
                      </div>
                    ) : filteredHistoryOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-600">
                          {searchTerm ? "سفارشی با این مشخصات یافت نشد" : "سابقه خریدی موجود نیست"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredHistoryOrders.map((order: any) => (
                          <Card key={order.id} className="border-l-4 border-l-purple-500">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Package className="w-4 h-4 text-purple-600" />
                                    <span className="font-semibold text-purple-800">
                                      {order.orderNumber || `سفارش #${order.id}`}
                                    </span>
                                    <Badge className={getStatusColor(order.status)}>
                                      {getStatusLabel(order.status)}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      {new Date(order.orderDate).toLocaleDateString('fa-IR')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="w-4 h-4" />
                                      {parseFloat(order.totalAmount).toFixed(2)} {order.currency || 'IQD'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Order Items */}
                              {order.items && order.items.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                  <p className="text-sm font-medium text-gray-700 mb-2">محصولات:</p>
                                  <div className="space-y-1">
                                    {order.items.slice(0, 3).map((item: any) => (
                                      <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-gray-600">
                                          {item.product_name || item.productName} × {parseFloat(item.quantity)}
                                        </span>
                                        <span className="font-medium">
                                          {parseFloat(item.total_price || item.totalPrice).toFixed(2)} IQD
                                        </span>
                                      </div>
                                    ))}
                                    {order.items.length > 3 && (
                                      <p className="text-sm text-gray-500">
                                        و {order.items.length - 3} محصول دیگر...
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="mt-3 pt-3 border-t flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadInvoice(order.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  فاکتور
                                </Button>
                                {order.status === 'confirmed' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleGenerateOfficialInvoice(order.id)}
                                    className="flex items-center gap-1"
                                  >
                                    <FileText className="w-3 h-3" />
                                    فاکتور رسمی
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Results Counter */}
                  {!historyLoading && filteredHistoryOrders.length > 0 && (
                    <div className="mt-4 pt-3 border-t text-center text-sm text-gray-600">
                      {searchTerm ? (
                        <span>{filteredHistoryOrders.length} سفارش از {purchaseHistoryOrders.length} سفارش یافت شد</span>
                      ) : (
                        <span>مجموعاً {purchaseHistoryOrders.length} سفارش در سابقه خرید</span>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
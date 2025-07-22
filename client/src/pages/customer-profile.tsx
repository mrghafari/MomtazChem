import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { User, Package, Calendar, DollarSign, ShoppingBag, LogOut, MapPin, Building, Phone, Mail, Edit, FileText, Download, Clock, AlertTriangle, PlayCircle, Trash2, History, Search, X, ShoppingCart, Plus, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const CustomerProfile = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get customer information
  const { data: customerData, isLoading: customerLoading, error: customerError } = useQuery<any>({
    queryKey: ["/api/customers/me"],
    retry: 1,
  });

  // Get customer order history
  const { data: orderData, isLoading: ordersLoading } = useQuery<any>({
    queryKey: ["/api/customers/orders"],
    retry: 1,
    enabled: !!customerData?.success,
  });

  // Get abandoned carts
  const { data: abandonedCartsData, isLoading: abandonedCartsLoading } = useQuery<any>({
    queryKey: ["/api/customers/abandoned-carts"],
    retry: 1,
    enabled: !!customerData?.success,
  });

  const orders = orderData?.orders || [];
  const totalOrders = orderData?.totalOrders || 0;
  const hiddenOrders = orderData?.hiddenOrders || 0;
  const abandonedCarts = abandonedCartsData?.carts || [];
  const abandonedCartsCount = abandonedCarts.length;

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/customers/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "خروج موفق",
          description: "شما با موفقیت از سیستم خارج شدید",
        });
        setLocation("/shop");
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در خروج از سیستم",
      });
    }
  };

  const handleDeleteTemporaryOrder = async (orderId: number, orderNumber: string) => {
    if (!confirm(`آیا از حذف سفارش موقت ${orderNumber} اطمینان دارید؟\nشماره سفارش حذف شده به عنوان "حذف شده" باقی می‌ماند و محصولات رزرو شده آزاد خواهند شد.`)) {
      return;
    }

    try {
      const response = await apiRequest(`/api/customers/orders/${orderId}/delete-temporary`, {
        method: 'DELETE'
      });

      if (response.success) {
        toast({
          title: "سفارش حذف شد",
          description: `سفارش ${orderNumber} با موفقیت حذف شد و محصولات آزاد شدند`,
        });
        
        // Refresh orders
        queryClient.invalidateQueries({ queryKey: ["/api/customers/orders"] });
      }
    } catch (error) {
      console.error('Delete order error:', error);
      toast({
        variant: "destructive",
        title: "خطا در حذف سفارش",
        description: "نتوانستیم سفارش را حذف کنیم. لطفاً دوباره تلاش کنید.",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeRemaining = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      return `${minutes} دقیقه`;
    } else if (hours < 24) {
      return `${Math.floor(hours)} ساعت`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} روز`;
    }
  };

  const getStatusColor = (status: string, paymentStatus?: string) => {
    // اگر رسید آپلود شده باشد، رنگ آبی برای "منتظر تأیید مالی"
    if (paymentStatus === 'receipt_uploaded') {
      return 'bg-blue-100 text-blue-800';
    }
    
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'payment_grace_period':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string, paymentStatus?: string) => {
    // اگر رسید آپلود شده باشد، نمایش "منتظر تأیید مالی"
    if (paymentStatus === 'receipt_uploaded') {
      return 'منتظر تأیید مالی';
    }
    
    switch (status) {
      case 'confirmed':
        return 'تایید شده';
      case 'pending':
        return 'در انتظار';
      case 'payment_grace_period':
        return 'مهلت پرداخت';
      case 'cancelled':
        return 'لغو شده';
      default:
        return status;
    }
  };

  // Loading state
  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (customerError || !customerData?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">خطا در دسترسی</h2>
            <p className="text-gray-600 mb-4">لطفاً وارد حساب کاربری خود شوید</p>
            <Button onClick={() => setLocation("/shop")} className="w-full">
              بازگشت به فروشگاه
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            سلام {customerData?.customer?.firstName || 'کاربر'} عزیز!
          </h1>
          <p className="text-gray-600">
            به پنل کاربری خود خوش آمدید
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  اطلاعات حساب کاربری
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      {customerData.customer.firstName} {customerData.customer.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{customerData.customer.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{customerData.customer.phone}</span>
                  </div>
                  {customerData.customer.company && (
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{customerData.customer.company}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  خروج از حساب
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Orders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  سفارشات شما
                  {orders.length > 0 && (
                    <Badge variant="secondary">
                      {orders.length} سفارش
                    </Badge>
                  )}
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  {abandonedCartsCount > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="flex items-center gap-3 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 px-4 py-2 rounded-lg hover:from-rose-200 hover:to-pink-200 transition-all duration-200 border-2 border-rose-300 shadow-md hover:shadow-lg transform hover:scale-105">
                          <ShoppingCart className="w-5 h-5 text-rose-600" />
                          <span className="text-sm font-bold">
                            {abandonedCartsCount} سبد خرید رها شده
                          </span>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-orange-600" />
                            سبدهای خرید رها شده ({abandonedCartsCount} سبد)
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <p className="text-orange-800 text-sm">
                              <strong>توضیح:</strong> این کالاها در سبد خرید شما قرار دارند ولی خرید تکمیل نشده است.
                            </p>
                          </div>
                          
                          {abandonedCarts.map((cart: any) => (
                            <Card key={cart.id} className="border-orange-200">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h3 className="font-semibold text-gray-900">
                                      سبد خرید #{cart.id}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      آخرین فعالیت: {formatDate(cart.lastActivity)}
                                    </p>
                                  </div>
                                  <div className="text-left">
                                    <p className="text-lg font-bold text-orange-600">
                                      ${parseFloat(cart.totalValue || 0).toFixed(2)}
                                    </p>
                                    <Badge className="bg-orange-100 text-orange-800">
                                      {cart.itemCount} کالا
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-orange-200 flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => setLocation("/shop")}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    تکمیل خرید
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
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">هنوز سفارشی ندارید</h3>
                    <p className="text-gray-500 mb-6">برای مشاهده تاریخچه سفارشات، خرید خود را شروع کنید.</p>
                    <Button onClick={() => setLocation("/shop")}>
                      شروع خرید
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
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">{parseFloat(order.totalAmount).toFixed(2)} {order.currency || 'IQD'}</p>
                            <Badge className={getStatusColor(order.status, order.paymentStatus)}>
                              {getStatusLabel(order.status, order.paymentStatus)}
                            </Badge>
                          </div>
                        </div>
                        
                        {order.items && order.items.length > 0 && (
                          <div>
                            <Separator className="mb-3" />
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-700">اقلام سفارش:</h5>
                              {order.items.map((item: any) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>{item.product_name} × {parseFloat(item.quantity)}</span>
                                  <span>{parseFloat(item.total_price).toFixed(2)} IQD</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-gray-200 flex gap-2 flex-wrap">
                          {(order.status === 'pending' || order.status === 'payment_grace_period') && order.paymentMethod === 'واریز بانکی با مهلت 3 روزه' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => window.open(`/customer/bank-receipt-upload?orderId=${order.id}`, '_blank')}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                آپلود رسید بانکی
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteTemporaryOrder(order.id, order.orderNumber)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                حذف سفارش موقت
                              </Button>
                            </>
                          )}
                          {/* دکمه دانلود فاکتور/پیش فاکتور */}
                          {order.status === 'confirmed' ? (
                            <Button
                              size="sm"
                              onClick={() => window.open(`/download-invoice/${order.id}`, '_blank')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              دانلود فاکتور
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => window.open(`/download-proforma-invoice/${order.id}`, '_blank')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              دانلود پیش فاکتور
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
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
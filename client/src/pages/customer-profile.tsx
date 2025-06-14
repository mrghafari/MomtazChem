import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Package, Calendar, DollarSign, ShoppingBag, LogOut, MapPin, Building, Phone, Mail } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const CustomerProfile = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get customer information
  const { data: customerData, isLoading: customerLoading } = useQuery<any>({
    queryKey: ["/api/customers/me"],
    retry: false,
  });

  // Get customer order history
  const { data: orderData, isLoading: ordersLoading } = useQuery<any>({
    queryKey: ["/api/customers/orders"],
    retry: false,
  });

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/customers/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "خروج موفق",
          description: "از حساب کاربری خود خارج شدید",
        });
        setLocation("/shop");
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "مشکلی در خروج رخ داده است",
      });
    }
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری پروفایل...</p>
        </div>
      </div>
    );
  }

  if (!customerData || !customerData.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">دسترسی محدود</h2>
            <p className="text-gray-500 mb-6">برای مشاهده پروفایل باید وارد حساب کاربری شوید.</p>
            <Button onClick={() => setLocation("/shop")} className="w-full">
              رفتن به فروشگاه
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customer = customerData.customer;
  const orders = orderData?.success ? orderData.orders : [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'در انتظار';
      case 'confirmed': return 'تایید شده';
      case 'processing': return 'در حال پردازش';
      case 'shipped': return 'ارسال شده';
      case 'delivered': return 'تحویل داده شده';
      case 'cancelled': return 'لغو شده';
      default: return status;
    }
  };

  const totalSpent = orders.reduce((sum: number, order: any) => 
    sum + parseFloat(order.totalAmount || 0), 0
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8" dir="rtl">
          <div>
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                خوش آمدید، {customer.firstName} {customer.lastName}!
              </h1>
              <p className="text-lg text-blue-600 mt-1">
                داشبورد شخصی شما آماده است
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-700">پروفایل مشتری</h2>
              <p className="text-gray-600">مدیریت حساب کاربری و مشاهده تاریخچه سفارشات</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setLocation("/shop")}
            >
              <ShoppingBag className="w-4 h-4 ml-2" />
              ادامه خرید
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Information */}
          <div className="lg:col-span-1">
            <Card dir="rtl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  اطلاعات حساب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    نام کامل
                  </label>
                  <p className="text-gray-900 font-semibold">{customer.firstName} {customer.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    ایمیل
                  </label>
                  <p className="text-gray-900">{customer.email}</p>
                </div>
                {customer.company && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      شرکت
                    </label>
                    <p className="text-gray-900">{customer.company}</p>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      تلفن
                    </label>
                    <p className="text-gray-900">{customer.phone}</p>
                  </div>
                )}
                {customer.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      آدرس
                    </label>
                    <p className="text-gray-900">{customer.address}</p>
                  </div>
                )}
                {customer.city && customer.country && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">موقعیت</label>
                    <p className="text-gray-900">{customer.city}, {customer.country}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Statistics */}
            <Card className="mt-6" dir="rtl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  آمار سفارشات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">تعداد سفارشات:</span>
                  <span className="font-semibold">{orders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">مجموع خرید:</span>
                  <span className="font-semibold">${totalSpent.toFixed(2)}</span>
                </div>
                {orders.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">میانگین هر سفارش:</span>
                    <span className="font-semibold">${(totalSpent / orders.length).toFixed(2)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2">
            <Card dir="rtl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  تاریخچه سفارشات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">در حال بارگذاری سفارشات...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">هنوز سفارشی ثبت نشده</h3>
                    <p className="text-gray-500 mb-6">شروع به خرید کنید تا تاریخچه سفارشات شما اینجا نمایش داده شود.</p>
                    <Button onClick={() => setLocation("/shop")}>
                      شروع خرید
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              سفارش #{order.orderNumber || order.id}
                            </h4>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-lg">${parseFloat(order.totalAmount).toFixed(2)}</p>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
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
                                  <span>{item.productName} × {parseFloat(item.quantity)} {item.unit}</span>
                                  <span>${parseFloat(item.totalPrice).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {order.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-gray-600">
                              <strong>یادداشت:</strong> {order.notes}
                            </p>
                          </div>
                        )}
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
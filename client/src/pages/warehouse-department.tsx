import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader, 
  RefreshCw, 
  Search,
  FileText,
  Truck,
  User,
  Calendar,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import AudioNotification from "@/components/AudioNotification";

export default function WarehouseDepartment() {
  const [searchTerm, setSearchTerm] = useState("");
  const [processingOrder, setProcessingOrder] = useState<number | null>(null);
  const [processingNotes, setProcessingNotes] = useState("");
  const { toast } = useToast();

  // Get refresh interval from global settings
  const getRefreshInterval = () => {
    const globalSettings = localStorage.getItem('global-refresh-settings');
    if (globalSettings) {
      const settings = JSON.parse(globalSettings);
      const warehouseSettings = settings.departments.warehouse;
      
      if (warehouseSettings?.autoRefresh) {
        const refreshInterval = settings.syncEnabled 
          ? settings.globalInterval 
          : warehouseSettings.interval;
        return refreshInterval * 1000; // Convert seconds to milliseconds
      }
    }
    return 600000; // Default 10 minutes if no settings found
  };

  // Fetch orders approved by financial department
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/order-management/warehouse'],
    refetchInterval: getRefreshInterval(),
    retry: false
  });

  // Extract orders from response
  const orders = (response as any)?.orders || (response as any) || [];
  
  // Add some debug logging to check the data structure
  console.log('Warehouse response:', response);
  console.log('Warehouse orders:', orders);
  console.log('Warehouse error:', error);
  console.log('Warehouse isLoading:', isLoading);

  // Filter orders based on search
  const filteredOrders = Array.isArray(orders) ? orders.filter((order: any) =>
    order.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerOrderId?.toString().includes(searchTerm) ||
    order.id?.toString().includes(searchTerm)
  ) : [];

  // Process order mutation
  const processOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await fetch(`/api/order-management/warehouse/${orderId}/process`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "warehouse_approved",
          notes: processingNotes
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ سفارش پردازش شد",
        description: "سفارش با موفقیت پردازش و برای واحد لجستیک آماده شد",
        duration: 3000
      });
      setProcessingOrder(null);
      setProcessingNotes("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/order-management/logistics'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطا در پردازش",
        description: error.message || "خطا در پردازش سفارش",
        variant: "destructive",
        duration: 3000
      });
    }
  });

  const handleProcessOrder = (orderId: number) => {
    processOrderMutation.mutate(orderId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount);
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">واحد انبار</h1>
          <p className="text-gray-600 mt-1">
            مدیریت سفارشات تایید شده توسط واحد مالی
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => {
              console.log('Refresh button clicked');
              refetch();
              queryClient.invalidateQueries({ queryKey: ['/api/order-management/warehouse'] });
            }}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
          <Button 
            onClick={() => window.location.href = '/admin/login'}
            variant="outline"
            className="flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            ورود مجدد
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">سفارشات در انتظار</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredOrders.length}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">پردازش شده امروز</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter((order: any) => 
                    order.status === 'warehouse_approved' && 
                    new Date(order.updatedAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ارزش کل</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    filteredOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)
                  )} دینار
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">میانگین زمان پردازش</p>
                <p className="text-2xl font-bold text-orange-600">2.5 ساعت</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Label htmlFor="search">جستجوی سفارشات</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="جستجو بر اساس شماره سفارش، نام مشتری یا محصول..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {filteredOrders.length} سفارش
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            سفارشات تایید شده مالی
          </CardTitle>
          <CardDescription>
            سفارشاتی که توسط واحد مالی تایید شده و در انتظار پردازش انبار هستند
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error || response === null ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">نیاز به احراز هویت</h3>
              <p className="text-gray-600 text-center max-w-md">
                برای دسترسی به واحد انبار، لطفاً وارد حساب ادمین شوید. 
                کاربر: admin@momtazchem.com
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => window.location.href = '/admin/login'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  ورود به حساب ادمین
                </Button>
                <Button 
                  onClick={() => {
                    console.log('Manual refetch from auth error section');
                    queryClient.invalidateQueries({ queryKey: ['/api/order-management/warehouse'] });
                    refetch();
                  }}
                  variant="outline"
                  className="border-gray-300"
                >
                  تلاش مجدد
                </Button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">در حال بارگیری سفارشات...</span>
            </div>
          ) : filteredOrders.length === 0 && Array.isArray(orders) && orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Package className="w-12 h-12 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">هیچ سفارشی برای پردازش وجود ندارد</h3>
              <p className="text-gray-600 text-center max-w-md">
                همه سفارشات پردازش شده‌اند یا در مراحل دیگر قرار دارند
              </p>
              <Button 
                onClick={() => {
                  console.log('Empty state refresh clicked');
                  queryClient.invalidateQueries({ queryKey: ['/api/order-management/warehouse'] });
                  refetch();
                }}
                variant="outline"
                className="mt-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                بررسی سفارشات جدید
              </Button>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order: any) => (
                <div key={order.id} className="border rounded-lg p-6 space-y-4">
                  {/* Order Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">سفارش #{order.customerOrderId}</h3>
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          در انتظار پردازش
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {order.customer?.firstName} {order.customer?.lastName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {formatCurrency(order.totalAmount)} {order.currency}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-600">
                            وزن محموله: {order.totalWeight ? `${order.totalWeight} کیلوگرم` : 'محاسبه نشده'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">محصولات سفارش:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span>جزئیات سفارش #{order.customerOrderId}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-600">مجموع: {formatCurrency(order.totalAmount)} {order.currency}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p><span className="font-medium">تلفن:</span> {order.phone}</p>
                      <p><span className="font-medium">شهر:</span> {order.city}</p>
                    </div>
                    <div className="space-y-1">
                      <p><span className="font-medium">آدرس:</span> {order.address}</p>
                      <p><span className="font-medium">روش پرداخت:</span> {order.paymentMethod}</p>
                    </div>
                  </div>

                  {/* Processing Section */}
                  {processingOrder === order.id ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <h4 className="font-medium text-blue-900">پردازش سفارش</h4>
                      <div className="space-y-2">
                        <Label htmlFor="notes">یادداشت پردازش (اختیاری)</Label>
                        <Textarea
                          id="notes"
                          placeholder="یادداشت درباره پردازش، بسته‌بندی یا نکات ویژه..."
                          value={processingNotes}
                          onChange={(e) => setProcessingNotes(e.target.value)}
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleProcessOrder(order.id)}
                          disabled={processOrderMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processOrderMutation.isPending ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin ml-2" />
                              در حال پردازش...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 ml-2" />
                              تایید و ارسال به لجستیک
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setProcessingOrder(null);
                            setProcessingNotes("");
                          }}
                        >
                          لغو
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setProcessingOrder(order.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Package className="w-4 h-4 ml-2" />
                        شروع پردازش
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 ml-2" />
                        جزئیات
                      </Button>
                    </div>
                  )}

                  {/* Financial Notes */}
                  {order.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm">
                        <span className="font-medium">یادداشت واحد مالی:</span> {order.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Package className="w-12 h-12 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">سفارش‌هایی یافت نشد</h3>
              <p className="text-gray-600 text-center max-w-md">
                ممکن است سفارش در مراحل دیگر باشد یا فیلتر جستجو اعمال شده باشد
              </p>
              <div className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg max-w-md">
                💡 نکته: سفارش 232 باید در انبار باشد - در صورت مشاهده نشدن، دکمه بروزرسانی را فشار دهید
              </div>
              <Button 
                onClick={() => {
                  console.log('Search state refresh clicked');
                  queryClient.invalidateQueries({ queryKey: ['/api/order-management/warehouse'] });
                  refetch();
                }}
                variant="outline"
                className="mt-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                بررسی مجدد سفارشات
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Notification for New Orders */}
      <AudioNotification 
        department="warehouse" 
        enabled={true}
      />
    </div>
  );
}
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Truck, 
  CheckCircle, 
  MapPin,
  Phone,
  RefreshCw,
  FileText,
  Clock,
  Send,
  Package,
  User
} from "lucide-react";
import GlobalRefreshControl from "@/components/GlobalRefreshControl";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface Order {
  id: number;
  customerOrderId: number;
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  orderTotal: number;
  currentStatus: string;
  logisticsNotes?: string;
  warehouseNotes?: string;
  deliveryCode?: string;
  logisticsProcessedAt?: string;
  warehouseProcessedAt: string;
  trackingNumber?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  estimatedDeliveryDate?: string;
  orderDate: string;
  orderItems: Array<{
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export default function LogisticsOrders() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [logisticsNotes, setLogisticsNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [deliveryPersonName, setDeliveryPersonName] = useState("");
  const [deliveryPersonPhone, setDeliveryPersonPhone] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get warehouse-approved orders for logistics processing
  const { data: response = { orders: [] }, isLoading, refetch } = useQuery({
    queryKey: ['/api/order-management/logistics'],
    queryFn: () => fetch('/api/order-management/logistics', { 
      credentials: 'include',
      cache: 'no-cache'
    }).then(res => res.json())
  });
  
  const orders = response.orders || [];
  
  // Debug: Log the first order to check orderNumber field
  if (orders.length > 0) {
    console.log('🔍 [LOGISTICS] First order:', {
      id: orders[0].id,
      customerOrderId: orders[0].customerOrderId,
      orderNumber: orders[0].orderNumber,
      fullOrder: orders[0]
    });
  }

  // Auto-refresh controlled by global settings
  useEffect(() => {
    if (orders && orders.length >= 0) { // Start auto-refresh after successful data load
      const checkRefreshSettings = () => {
        const globalSettings = localStorage.getItem('global-refresh-settings');
        if (globalSettings) {
          const settings = JSON.parse(globalSettings);
          const logisticsSettings = settings.departments.logistics;
          
          if (logisticsSettings.autoRefresh) {
            const refreshInterval = settings.syncEnabled 
              ? settings.globalInterval 
              : logisticsSettings.interval;
            
            return refreshInterval * 1000; // Convert seconds to milliseconds
          }
        }
        return 600000; // Default 10 minutes if no settings found
      };

      const intervalMs = checkRefreshSettings();
      const interval = setInterval(() => {
        // Check if refresh is still enabled before executing
        const currentSettings = localStorage.getItem('global-refresh-settings');
        if (currentSettings) {
          const settings = JSON.parse(currentSettings);
          if (settings.departments.logistics.autoRefresh) {
            refetch();
          }
        }
      }, intervalMs);

      return () => clearInterval(interval);
    }
  }, [orders, refetch]);

  const dispatchMutation = useMutation({
    mutationFn: async (data: {
      orderId: number;
      notes: string;
      trackingNumber: string;
      deliveryPersonName: string;
      deliveryPersonPhone: string;
      estimatedDeliveryDate: string;
    }) => {
      return apiRequest(`/api/logistics/orders/${data.orderId}/dispatch`, {
        method: 'POST',
        body: data
      });
    },
    onSuccess: (response) => {
      toast({
        title: "سفارش ارسال شد",
        description: `کد تحویل ${response.deliveryCode} برای مشتری ارسال شد`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/orders'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ارسال",
        description: error.message || "امکان ارسال سفارش وجود ندارد",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'warehouse_approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700">آماده ارسال</Badge>;
      case 'logistics_processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">در حال پردازش</Badge>;
      case 'logistics_dispatched':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">ارسال شده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const resetForm = () => {
    setSelectedOrder(null);
    setLogisticsNotes("");
    setTrackingNumber("");
    setDeliveryPersonName("");
    setDeliveryPersonPhone("");
    setEstimatedDeliveryDate("");
  };

  const handleOrderDispatch = (order: Order) => {
    setSelectedOrder(order);
    setLogisticsNotes(order.logisticsNotes || "");
    setTrackingNumber(order.trackingNumber || "");
    setDeliveryPersonName(order.deliveryPersonName || "");
    setDeliveryPersonPhone(order.deliveryPersonPhone || "");
    
    // Set estimated delivery date to tomorrow if not set
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setEstimatedDeliveryDate(order.estimatedDeliveryDate || tomorrow.toISOString().split('T')[0]);
    
    setIsDialogOpen(true);
  };

  const handleDispatch = () => {
    if (!selectedOrder) return;
    
    if (!trackingNumber || !deliveryPersonName || !deliveryPersonPhone) {
      toast({
        title: "اطلاعات ناقص",
        description: "لطفاً تمام فیلدهای ضروری را پر کنید",
        variant: "destructive"
      });
      return;
    }

    dispatchMutation.mutate({
      orderId: selectedOrder.customerOrderId,
      notes: logisticsNotes,
      trackingNumber,
      deliveryPersonName,
      deliveryPersonPhone,
      estimatedDeliveryDate
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">در حال بارگذاری...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">واحد لجستیک - ارسال سفارشات</h1>
          <p className="text-gray-600 mt-2">مدیریت ارسال و تحویل سفارشات به مشتریان</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {orders.length} سفارش در انتظار
        </Badge>
      </div>

      {/* Refresh Control */}
      <div className="mb-6">
        <GlobalRefreshControl 
          pageName="logistics"
          onRefresh={() => refetch()}
          isLoading={isLoading}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">آماده ارسال</p>
                <p className="text-2xl font-bold text-blue-600">{orders.filter((o: any) => o.currentStatus === 'warehouse_approved').length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">در حال ارسال</p>
                <p className="text-2xl font-bold text-purple-600">{orders.filter((o: any) => o.currentStatus === 'logistics_dispatched').length}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ارزش کل</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(orders.reduce((sum: number, order: any) => sum + order.orderTotal, 0), 'IQD')}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">فوری</p>
                <p className="text-2xl font-bold text-red-600">
                  {orders.filter((order: any) => 
                    new Date(order.warehouseProcessedAt) < new Date(Date.now() - 12 * 60 * 60 * 1000)
                  ).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            سفارشات آماده ارسال
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">همه سفارشات ارسال شده</h3>
              <p className="text-gray-500">در حال حاضر سفارش جدیدی برای ارسال وجود ندارد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: Order) => (
                <div key={order.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium text-lg">{order.orderNumber ? `سفارش ${order.orderNumber}` : `سفارش #${order.customerOrderId}`}</h3>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                        {order.deliveryCode && (
                          <p className="text-sm text-purple-600 font-medium">کد تحویل: {order.deliveryCode}</p>
                        )}
                      </div>
                      {getStatusBadge(order.currentStatus)}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg text-green-600">
                        {formatCurrency(order.orderTotal, 'IQD')}
                      </p>
                      <p className="text-sm text-gray-500">
                        آماده: {new Date(order.warehouseProcessedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        آدرس تحویل
                      </p>
                      <p className="font-medium">{order.customerAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        تلفن مشتری
                      </p>
                      <p className="font-medium">{order.customerPhone}</p>
                    </div>
                  </div>

                  {/* Warehouse Notes */}
                  {order.warehouseNotes && (
                    <div className="bg-green-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-green-800">
                        <strong>یادداشت انبار:</strong> {order.warehouseNotes}
                      </p>
                    </div>
                  )}

                  {/* Tracking Info */}
                  {order.trackingNumber && (
                    <div className="bg-purple-50 rounded-lg p-3 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>کد رهگیری:</strong> {order.trackingNumber}
                        </div>
                        <div>
                          <strong>تحویل‌دهنده:</strong> {order.deliveryPersonName}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Items Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2">آیتم‌های ارسالی:</h4>
                    <div className="space-y-1">
                      {order.orderItems.slice(0, 2).map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.productName} × {item.quantity}</span>
                          <span>{formatCurrency(item.totalPrice, 'IQD')}</span>
                        </div>
                      ))}
                      {order.orderItems.length > 2 && (
                        <p className="text-sm text-gray-500">
                          و {order.orderItems.length - 2} آیتم دیگر...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      <Clock className="h-4 w-4 inline mr-1" />
                      از آماده‌سازی: {Math.floor((new Date().getTime() - new Date(order.warehouseProcessedAt).getTime()) / (1000 * 60 * 60))} ساعت گذشته
                    </div>
                    <Button onClick={() => handleOrderDispatch(order)}>
                      {order.currentStatus === 'logistics_dispatched' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          ارسال شده
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          ارسال سفارش
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispatch Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>ارسال سفارش #{selectedOrder?.customerOrderId}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-3">اطلاعات ارسال</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">مشتری:</span>
                    <span className="font-medium mr-2">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">تلفن:</span>
                    <span className="font-medium mr-2">{selectedOrder.customerPhone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">آدرس:</span>
                    <span className="font-medium mr-2">{selectedOrder.customerAddress}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">کد رهگیری *</label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="TR123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">تاریخ تحویل تخمینی</label>
                  <Input
                    type="date"
                    value={estimatedDeliveryDate}
                    onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">نام تحویل‌دهنده *</label>
                  <Input
                    value={deliveryPersonName}
                    onChange={(e) => setDeliveryPersonName(e.target.value)}
                    placeholder="احمد محمدی"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">تلفن تحویل‌دهنده *</label>
                  <Input
                    value={deliveryPersonPhone}
                    onChange={(e) => setDeliveryPersonPhone(e.target.value)}
                    placeholder="07901234567"
                  />
                </div>
              </div>

              {/* Logistics Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">یادداشت لجستیک</label>
                <Textarea
                  value={logisticsNotes}
                  onChange={(e) => setLogisticsNotes(e.target.value)}
                  placeholder="توضیحات مربوط به ارسال، زمان‌بندی یا نکات ویژه..."
                  rows={3}
                />
              </div>

              {/* Action Button */}
              <Button 
                onClick={handleDispatch}
                disabled={dispatchMutation.isPending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                ارسال سفارش و تولید کد تحویل
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
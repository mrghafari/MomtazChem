import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Truck,
  RefreshCw,
  FileText,
  Clock,
  AlertCircle
} from "lucide-react";
import GlobalRefreshControl from "@/components/GlobalRefreshControl";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface Order {
  id: number;
  customerOrderId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  orderTotal: number;
  currentStatus: string;
  warehouseNotes?: string;
  warehouseProcessedAt?: string;
  financialReviewedAt: string;
  financialNotes?: string;
  orderDate: string;
  orderItems: Array<{
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specifications?: any;
  }>;
}

export default function WarehouseOrders() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [warehouseNotes, setWarehouseNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get approved orders for warehouse processing
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/warehouse/orders'],
    queryFn: () => fetch('/api/warehouse/orders', { credentials: 'include' }).then(res => res.json())
  });

  // Auto-refresh controlled by global settings
  useEffect(() => {
    if (orders && orders.length >= 0) { // Start auto-refresh after successful data load
      const checkRefreshSettings = () => {
        const globalSettings = localStorage.getItem('global-refresh-settings');
        if (globalSettings) {
          const settings = JSON.parse(globalSettings);
          const warehouseSettings = settings.departments.warehouse;
          
          if (warehouseSettings.autoRefresh) {
            const refreshInterval = settings.syncEnabled 
              ? settings.globalInterval 
              : warehouseSettings.interval;
            
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
          if (settings.departments.warehouse.autoRefresh) {
            refetch();
          }
        }
      }, intervalMs);

      return () => clearInterval(interval);
    }
  }, [orders, refetch]);

  const approveMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: number; notes: string }) => {
      return apiRequest(`/api/warehouse/orders/${orderId}/approve`, {
        method: 'POST',
        body: { notes }
      });
    },
    onSuccess: () => {
      toast({
        title: "سفارش آماده شد",
        description: "سفارش به واحد لجستیک ارسال شد"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/orders'] });
      setIsDialogOpen(false);
      setSelectedOrder(null);
      setWarehouseNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "خطا در تایید",
        description: error.message || "امکان تایید سفارش وجود ندارد",
        variant: "destructive"
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: number; notes: string }) => {
      return apiRequest(`/api/warehouse/orders/${orderId}/reject`, {
        method: 'POST',
        body: { notes }
      });
    },
    onSuccess: () => {
      toast({
        title: "سفارش رد شد",
        description: "سفارش به دلیل عدم موجودی رد شده"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/orders'] });
      setIsDialogOpen(false);
      setSelectedOrder(null);
      setWarehouseNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "خطا در رد سفارش",
        description: error.message || "امکان رد سفارش وجود ندارد",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'financial_approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700">تایید مالی شده</Badge>;
      case 'warehouse_processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">در حال آماده‌سازی</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleOrderProcess = (order: Order) => {
    setSelectedOrder(order);
    setWarehouseNotes(order.warehouseNotes || "");
    setIsDialogOpen(true);
  };

  const handleApprove = () => {
    if (!selectedOrder) return;
    approveMutation.mutate({ 
      orderId: selectedOrder.customerOrderId, 
      notes: warehouseNotes 
    });
  };

  const handleReject = () => {
    if (!selectedOrder) return;
    rejectMutation.mutate({ 
      orderId: selectedOrder.customerOrderId, 
      notes: warehouseNotes 
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
          <h1 className="text-3xl font-bold text-gray-900">واحد انبار - آماده‌سازی سفارشات</h1>
          <p className="text-gray-600 mt-2">تهیه و آماده‌سازی کالاهای سفارش داده شده</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {orders.length} سفارش در انتظار
        </Badge>
      </div>

      {/* Refresh Control */}
      <div className="mb-6">
        <GlobalRefreshControl 
          pageName="warehouse"
          onRefresh={() => refetch()}
          isLoading={isLoading}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">سفارشات در انتظار</p>
                <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ارزش کل سفارشات</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(orders.reduce((sum, order) => sum + order.orderTotal, 0), 'IQD')}
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
                  {orders.filter(order => 
                    new Date(order.financialReviewedAt) < new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            سفارشات تایید شده مالی - در انتظار آماده‌سازی
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">همه سفارشات آماده شده</h3>
              <p className="text-gray-500">در حال حاضر سفارش جدیدی برای آماده‌سازی وجود ندارد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: Order) => (
                <div key={order.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium text-lg">سفارش #{order.customerOrderId}</h3>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                      </div>
                      {getStatusBadge(order.currentStatus)}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg text-green-600">
                        {formatCurrency(order.orderTotal, 'IQD')}
                      </p>
                      <p className="text-sm text-gray-500">
                        تایید: {new Date(order.financialReviewedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">آدرس تحویل</p>
                      <p className="font-medium">{order.customerAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">تلفن مشتری</p>
                      <p className="font-medium">{order.customerPhone}</p>
                    </div>
                  </div>

                  {/* Financial Notes */}
                  {order.financialNotes && (
                    <div className="bg-green-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-green-800">
                        <strong>یادداشت واحد مالی:</strong> {order.financialNotes}
                      </p>
                    </div>
                  )}

                  {/* Order Items Detail */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-3">آیتم‌های سفارش برای آماده‌سازی:</h4>
                    <div className="space-y-2">
                      {order.orderItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center border-b border-gray-200 pb-2">
                          <div className="flex-1">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                            {item.specifications && (
                              <p className="text-sm text-gray-500">
                                مشخصات: {JSON.stringify(item.specifications)}
                              </p>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-medium">تعداد: {item.quantity}</p>
                            <p className="text-sm text-gray-600">{formatCurrency(item.totalPrice, 'IQD')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      <Clock className="h-4 w-4 inline mr-1" />
                      از تایید مالی: {Math.floor((new Date().getTime() - new Date(order.financialReviewedAt).getTime()) / (1000 * 60 * 60))} ساعت گذشته
                    </div>
                    <Button onClick={() => handleOrderProcess(order)}>
                      <Package className="h-4 w-4 mr-2" />
                      آماده‌سازی کالا
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>آماده‌سازی سفارش #{selectedOrder?.customerOrderId}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-3">اطلاعات سفارش</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">مشتری:</span>
                    <span className="font-medium mr-2">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">مبلغ کل:</span>
                    <span className="font-medium mr-2">{formatCurrency(selectedOrder.orderTotal, 'IQD')}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">آدرس تحویل:</span>
                    <span className="font-medium mr-2">{selectedOrder.customerAddress}</span>
                  </div>
                </div>
              </div>

              {/* Items Checklist */}
              <div>
                <h4 className="font-medium mb-3">لیست کالاهای مورد نیاز:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedOrder.orderItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">SKU: {item.productSku} | تعداد: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warehouse Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">یادداشت انبار</label>
                <Textarea
                  value={warehouseNotes}
                  onChange={(e) => setWarehouseNotes(e.target.value)}
                  placeholder="وضعیت موجودی، مشکلات احتمالی، یا توضیحات اضافی..."
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  کالا آماده است
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  عدم موجودی
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
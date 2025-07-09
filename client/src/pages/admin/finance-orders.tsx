import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  RefreshCw,
  FileText,
  CreditCard,
  Barcode,
  Plus
} from "lucide-react";
import InternalBarcodeCard from "@/components/InternalBarcodeCard";
import GlobalRefreshControl from "@/components/GlobalRefreshControl";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface Order {
  id: number;
  customerOrderId: number;
  currentStatus: string;
  paymentReceiptUrl?: string;
  financialNotes?: string;
  financialReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  deliveryCode?: string;
  financialReviewerId?: number;
  warehouseAssigneeId?: number;
  warehouseProcessedAt?: string;
  warehouseNotes?: string;
  logisticsAssigneeId?: number;
  logisticsProcessedAt?: string;
  logisticsNotes?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
}

export default function FinanceOrders() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [trackingCodes, setTrackingCodes] = useState<any[]>([]);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get pending orders for financial review
  const { data: ordersResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/order-management/financial'],
    queryFn: () => fetch('/api/order-management/financial', { credentials: 'include' }).then(res => res.json())
  });

  const orders = ordersResponse?.orders || [];

  // Auto-refresh controlled by global settings
  useEffect(() => {
    if (orders && orders.length >= 0) { // Start auto-refresh after successful data load
      const checkRefreshSettings = () => {
        const globalSettings = localStorage.getItem('global-refresh-settings');
        if (globalSettings) {
          const settings = JSON.parse(globalSettings);
          const financeSettings = settings.departments.finance;
          
          if (financeSettings.autoRefresh) {
            const refreshInterval = settings.syncEnabled 
              ? settings.globalInterval 
              : financeSettings.interval;
            
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
          if (settings.departments.finance.autoRefresh) {
            refetch();
          }
        }
      }, intervalMs);

      return () => clearInterval(interval);
    }
  }, [orders, refetch]);

  const approveMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: number; notes: string }) => {
      return apiRequest(`/api/finance/orders/${orderId}/approve`, {
        method: 'POST',
        body: { notes }
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ فیش بانکی تایید شد",
        description: "پرداخت تایید شد، ایمیل و SMS به مشتری ارسال شد و سفارش به واحد انبار منتقل شد"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/orders'] });
      setIsDialogOpen(false);
      setSelectedOrder(null);
      setReviewNotes("");
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
      return apiRequest(`/api/finance/orders/${orderId}/reject`, {
        method: 'POST',
        body: { notes }
      });
    },
    onSuccess: () => {
      toast({
        title: "❌ فیش بانکی رد شد",
        description: "پرداخت رد شد، ایمیل و SMS اطلاع‌رسانی به مشتری ارسال شد",
        variant: "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/orders'] });
      setIsDialogOpen(false);
      setSelectedOrder(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "خطا در رد سفارش",
        description: error.message || "امکان رد سفارش وجود ندارد",
        variant: "destructive"
      });
    }
  });

  // Generate tracking codes for order
  const generateTrackingCodes = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest(`/api/tracking/generate/${orderId}`, {
        method: 'POST'
      });
    },
    onSuccess: (response) => {
      toast({
        title: "کدهای ردیابی ایجاد شدند",
        description: `${response.trackingCodes?.length || 0} کد ردیابی برای کالاها ایجاد شد`
      });
      loadTrackingCodes(selectedOrderForTracking?.customerOrderId);
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ایجاد کدهای ردیابی",
        description: error.message || "امکان ایجاد کدهای ردیابی وجود ندارد",
        variant: "destructive"
      });
    }
  });

  // Load tracking codes for order
  const loadTrackingCodes = async (orderId?: number) => {
    if (!orderId) return;
    
    try {
      const response = await apiRequest(`/api/tracking/order/${orderId}`);
      setTrackingCodes(response.trackingCodes || []);
    } catch (error) {
      console.error("Error loading tracking codes:", error);
    }
  };

  // Handle tracking modal open
  const handleTrackingModal = (order: Order) => {
    setSelectedOrderForTracking(order);
    setShowTrackingModal(true);
    loadTrackingCodes(order.customerOrderId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'payment_uploaded':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">در انتظار بررسی مالی</Badge>;
      case 'financial_reviewing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">در حال بررسی</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleOrderReview = (order: Order) => {
    setSelectedOrder(order);
    setReviewNotes(order.financialNotes || "");
    setIsDialogOpen(true);
  };

  const handleApprove = () => {
    if (!selectedOrder) return;
    approveMutation.mutate({ 
      orderId: selectedOrder.customerOrderId, 
      notes: reviewNotes 
    });
  };

  const handleReject = () => {
    if (!selectedOrder) return;
    rejectMutation.mutate({ 
      orderId: selectedOrder.customerOrderId, 
      notes: reviewNotes 
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
          <h1 className="text-3xl font-bold text-gray-900">واحد مالی - بررسی پرداخت‌ها</h1>
          <p className="text-gray-600 mt-2">بررسی و تایید پرداخت‌های دریافت شده</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {orders.length} سفارش در انتظار
        </Badge>
      </div>

      {/* Refresh Control */}
      <div className="mb-6">
        <GlobalRefreshControl 
          pageName="financial"
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
                <p className="text-2xl font-bold text-yellow-600">{orders.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">سفارشات تکمیل شده</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(order => order.currentStatus === 'financial_approved').length}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">اولویت بالا</p>
                <p className="text-2xl font-bold text-red-600">
                  {orders.filter(order => 
                    new Date(order.createdAt) < new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            سفارشات در انتظار بررسی مالی
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">همه سفارشات بررسی شده</h3>
              <p className="text-gray-500">در حال حاضر سفارش جدیدی برای بررسی وجود ندارد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: Order) => (
                <div key={order.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium text-lg">سفارش #{order.customerOrderId}</h3>
                        <p className="text-sm text-gray-600">مشتری #{order.customerOrderId}</p>
                      </div>
                      {getStatusBadge(order.currentStatus)}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg text-green-600">
                        {/* Order total will be loaded from customer orders */}
                        سفارش #{order.customerOrderId}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">وضعیت سفارش</p>
                      <p className="font-medium">{order.currentStatus}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">تاریخ ایجاد</p>
                      <p className="font-medium">{new Date(order.createdAt).toLocaleDateString('fa-IR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">آخرین بروزرسانی</p>
                      <p className="font-medium">{new Date(order.updatedAt).toLocaleDateString('fa-IR')}</p>
                    </div>
                  </div>

                  {/* Order Details Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2">جزئیات سفارش:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">شماره سفارش:</span>
                        <span className="font-medium ml-2">#{order.customerOrderId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">تاریخ ایجاد:</span>
                        <span className="font-medium ml-2">{new Date(order.createdAt).toLocaleDateString('fa-IR')}</span>
                      </div>
                      {order.financialNotes && (
                        <div className="col-span-2">
                          <span className="text-gray-600">یادداشت مالی:</span>
                          <span className="font-medium ml-2">{order.financialNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bank Receipt Display Section */}
                  {order.paymentReceiptUrl && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h5 className="font-medium text-blue-900">فیش بانکی ارسال شده</h5>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          نیاز به تایید
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-blue-700 mb-1">فیش واریزی توسط مشتری ارسال شده است</p>
                          <p className="text-xs text-blue-600">
                            بررسی فیش بانکی و تایید یا رد پرداخت ضروری است
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild className="border-blue-300 hover:bg-blue-50">
                            <a href={order.paymentReceiptUrl} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4 mr-1" />
                              مشاهده فیش
                            </a>
                          </Button>
                          
                          {order.paymentReceiptUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                            <div className="relative group">
                              <img 
                                src={order.paymentReceiptUrl} 
                                alt="Bank Receipt Preview"
                                className="w-16 h-16 object-cover rounded border border-blue-200 cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open(order.paymentReceiptUrl, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded transition-colors"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleTrackingModal(order)}
                      >
                        <Barcode className="h-4 w-4 mr-1" />
                        ردیابی کالا
                      </Button>
                    </div>
                    <Button 
                      onClick={() => handleOrderReview(order)}
                      className={order.paymentReceiptUrl ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {order.paymentReceiptUrl ? "بررسی فیش بانکی" : "بررسی پرداخت"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>بررسی پرداخت سفارش #{selectedOrder?.customerOrderId}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-3">خلاصه سفارش</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">مشتری:</span>
                    <span className="font-medium mr-2">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">مبلغ کل:</span>
                    <span className="font-medium mr-2">{formatCurrency(selectedOrder.orderTotal, 'IQD')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">روش پرداخت:</span>
                    <span className="font-medium mr-2">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">تاریخ سفارش:</span>
                    <span className="font-medium mr-2">{new Date(selectedOrder.orderDate).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>
              </div>

              {/* Payment Receipt */}
              {selectedOrder.paymentReceiptUrl && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">فیش بانکی ارسال شده</h4>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      نیاز به تایید
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {selectedOrder.paymentReceiptUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                      <div className="flex-shrink-0">
                        <img 
                          src={selectedOrder.paymentReceiptUrl} 
                          alt="Bank Receipt"
                          className="w-24 h-24 object-cover rounded border border-blue-200 cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(selectedOrder.paymentReceiptUrl, '_blank')}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <p className="text-sm text-blue-700 mb-2">
                        فیش واریزی توسط مشتری ارسال شده است. لطفاً مطابقت مبلغ و صحت اطلاعات را بررسی کنید.
                      </p>
                      <Button variant="outline" asChild className="border-blue-300 hover:bg-blue-50">
                        <a href={selectedOrder.paymentReceiptUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-2" />
                          مشاهده فیش در تب جدید
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">یادداشت بررسی</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="یادداشت خود را در مورد بررسی پرداخت وارد کنید..."
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={handleApprove}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {approveMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  ✅ تایید فیش بانکی
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleReject}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {rejectMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  ❌ رد فیش بانکی
                </Button>
              </div>
              
              {selectedOrder.paymentReceiptUrl && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    💡 پس از تایید یا رد، ایمیل و SMS اطلاع‌رسانی به مشتری ارسال خواهد شد
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
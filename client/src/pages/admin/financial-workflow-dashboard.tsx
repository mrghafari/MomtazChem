import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  CreditCard, 
  Wallet, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  DollarSign,
  FileText,
  Timer,
  Building2,
  MapPin,
  Phone,
  Mail,
  Package,
  Weight,
  Truck,
  User,
  Settings,
  Wrench
} from "lucide-react";

interface FinancialOrder {
  id: number;
  customerOrderId: number;
  orderNumber: string;
  currentStatus: string;
  paymentMethod: string;
  paymentSourceLabel: string;
  walletAmountUsed?: string;
  bankAmountPaid?: string;
  excessAmountCredited?: string;
  autoApprovalScheduledAt?: string;
  isAutoApprovalEnabled: boolean;
  financialNotes?: string;
  financialReviewedAt?: string;
  invoiceType?: string;
  invoiceConvertedAt?: string;
  totalAmount: string;
  customerName: string;
  createdAt: string;
  totalWeight?: string;
  weightUnit?: string;
  deliveryMethod?: string;
  shippingAddress?: {
    name: string;
    phone: string;
    address: string;
    city: string;
    postalCode?: string;
  };
  customerEmail?: string;
  customerPhone?: string;
}

export default function FinancialWorkflowDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<FinancialOrder | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [excessAmount, setExcessAmount] = useState("");

  // لیست سفارشات در انتظار بررسی مالی
  const { data: orders, isLoading } = useQuery<FinancialOrder[]>({
    queryKey: ['/api/financial/pending-orders'],
    refetchInterval: 30000 // تازه‌سازی هر 30 ثانیه
  });

  // لیست سفارشات تایید شده مالی
  const { data: approvedOrders, isLoading: isLoadingApproved } = useQuery<FinancialOrder[]>({
    queryKey: ['/api/financial/approved-orders'],
    refetchInterval: 30000 // تازه‌سازی هر 30 ثانیه
  });

  // لیست سفارشات موقت (سفارشات آزمایشی و در حال تست)
  const { data: temporaryResponse, isLoading: temporaryLoading } = useQuery<{orders: FinancialOrder[]}>({
    queryKey: ['/api/financial/temporary-orders'],
    refetchInterval: 30000 // تازه‌سازی هر 30 ثانیه
  });

  // لیست سفارشات یتیم (orders in customer_orders but missing from order_management)
  const { data: orphanedResponse, isLoading: orphanedLoading } = useQuery<{orders: FinancialOrder[], totalOrphaned: number}>({
    queryKey: ['/api/financial/orphaned-orders'],
    refetchInterval: 30000 // تازه‌سازی هر 30 ثانیه
  });

  // Extract arrays from API responses
  const temporaryOrders = temporaryResponse?.orders || [];
  const orphanedOrders = orphanedResponse?.orders || [];
  const totalOrphaned = orphanedResponse?.totalOrphaned || 0;

  // تایید دستی سفارش
  const approveOrderMutation = useMutation({
    mutationFn: (data: { orderMgmtId: number; reviewerId: number; notes?: string; excessAmount?: number }) =>
      apiRequest(`/api/finance/approve/${data.orderMgmtId}`, { method: 'POST', body: data }),
    onSuccess: () => {
      toast({
        title: "✅ سفارش تایید شد",
        description: "سفارش با موفقیت تایید و به انبار منتقل شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/financial/pending-orders'] });
      setSelectedOrder(null);
      setApprovalNotes("");
      setExcessAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطا در تایید سفارش",
        description: error.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    }
  });

  // تعمیر سفارش یتیم
  const repairOrphanedOrderMutation = useMutation({
    mutationFn: (customerOrderId: number) =>
      apiRequest(`/api/financial/orphaned-orders/${customerOrderId}/repair`, { method: 'POST', body: {} }),
    onSuccess: () => {
      toast({
        title: "🔧 سفارش یتیم تعمیر شد",
        description: "سفارش با موفقیت به سیستم مدیریت اضافه شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/financial/orphaned-orders'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطا در تعمیر سفارش",
        description: error.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    }
  });

  const handleRepairOrphanedOrder = (customerOrderId: number) => {
    repairOrphanedOrderMutation.mutate(customerOrderId);
  };

  // Helper function to get status label in Persian
  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'pending': 'در انتظار',
      'confirmed': 'تایید شده',
      'pending_payment': 'در انتظار پرداخت',
      'payment_uploaded': 'فیش آپلود شده',
      'financial_reviewing': 'در حال بررسی مالی',
      'financial_rejected': 'رد شده توسط مالی',
      'warehouse_pending': 'در انتظار انبار',
      'warehouse_ready': 'آماده انبار',
      'logistics_pending': 'در انتظار لجستیک',
      'out_for_delivery': 'در حال تحویل',
      'delivered': 'تحویل داده شده',
      'cancelled': 'لغو شده',
      'rejected': 'رد شده'
    };
    return statusLabels[status] || status;
  };

  // Helper function to get status badge component
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'pending': { label: 'در انتظار', className: 'bg-yellow-100 text-yellow-800' },
      'confirmed': { label: 'تایید شده', className: 'bg-blue-100 text-blue-800' },
      'pending_payment': { label: 'در انتظار پرداخت', className: 'bg-orange-100 text-orange-800' },
      'payment_uploaded': { label: 'فیش آپلود شده', className: 'bg-purple-100 text-purple-800' },
      'financial_reviewing': { label: 'در حال بررسی مالی', className: 'bg-indigo-100 text-indigo-800' },
      'financial_rejected': { label: 'رد شده توسط مالی', className: 'bg-red-100 text-red-800' },
      'warehouse_pending': { label: 'در انتظار انبار', className: 'bg-teal-100 text-teal-800' },
      'warehouse_ready': { label: 'آماده انبار', className: 'bg-green-100 text-green-800' },
      'logistics_pending': { label: 'در انتظار لجستیک', className: 'bg-cyan-100 text-cyan-800' },
      'out_for_delivery': { label: 'در حال تحویل', className: 'bg-blue-100 text-blue-800' },
      'delivered': { label: 'تحویل داده شده', className: 'bg-green-100 text-green-800' },
      'cancelled': { label: 'لغو شده', className: 'bg-gray-100 text-gray-800' },
      'rejected': { label: 'رد شده', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Helper function to get payment method icon
  const getPaymentMethodIcon = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'wallet_full':
      case 'wallet_partial':
        return <Wallet className="h-4 w-4 text-green-600" />;
      case 'online_payment':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'bank_transfer_grace':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleManualApproval = () => {
    if (!selectedOrder) return;

    approveOrderMutation.mutate({
      orderMgmtId: selectedOrder.id,
      reviewerId: 1, // TODO: Get from authenticated user
      notes: approvalNotes || undefined,
      excessAmount: excessAmount ? parseFloat(excessAmount) : undefined
    });
  };



  const getRemainingTime = (scheduledAt: string) => {
    if (!scheduledAt) return null;
    
    const scheduled = new Date(scheduledAt);
    const now = new Date();
    const remaining = scheduled.getTime() - now.getTime();
    
    if (remaining <= 0) return "زمان تمام شده";
    
    const minutes = Math.floor(remaining / (1000 * 60));
    return `${minutes} دقیقه باقی‌مانده`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          داشبورد مالی - مدیریت جریان پرداخت
        </h1>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          {orders?.length || 0} سفارش در انتظار
        </Badge>
      </div>

      {/* نوع تسویه حساب/پرداخت Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <DollarSign className="h-6 w-6" />
            انواع تسویه حساب و پرداخت
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 bg-blue-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">درگاه بانکی</div>
                <div className="text-xs text-blue-700">تایید خودکار 5 دقیقه</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg">
              <Wallet className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">کیف پول</div>
                <div className="text-xs text-green-700">برداشت خودکار</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium text-purple-900">ترکیبی</div>
                <div className="text-xs text-purple-700">کیف پول + بانک</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-900">مهلت‌دار</div>
                <div className="text-xs text-orange-700">3 روز واریز بانکی</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="pending" className="text-xs md:text-sm">
            سفارشات در انتظار ({orders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="temporary" className="text-xs md:text-sm">
            سفارشات موقت ({temporaryOrders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="orphaned" className="text-xs md:text-sm">
            یتیم و ناتمام ({totalOrphaned})
          </TabsTrigger>
          <TabsTrigger value="auto-approval" className="text-xs md:text-sm">
            تایید خودکار
          </TabsTrigger>
          <TabsTrigger value="grace-period" className="text-xs md:text-sm">
            مهلت‌دار
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-xs md:text-sm">
            تایید شده ({approvedOrders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="orphaned" className="text-xs md:text-sm">
            سفارشات یتیم ({totalOrphaned || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {orders?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  همه سفارشات پردازش شده‌اند
                </h3>
                <p className="text-gray-600">
                  در حال حاضر سفارشی در انتظار بررسی مالی نیست
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {orders?.map((order) => (
                <Card 
                  key={order.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedOrder?.id === order.id ? 'ring-2 ring-blue-500 border-blue-300' : ''
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        سفارش {order.orderNumber}
                      </CardTitle>
                      {getStatusBadge(order.currentStatus)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* اطلاعات مشتری */}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 font-medium">{order.customerName}</span>
                    </div>

                    {/* تاریخ سفارش */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('fa-IR')} - {new Date(order.createdAt).toLocaleTimeString('fa-IR')}
                      </span>
                    </div>

                    {/* آدرس تحویل */}
                    {order.shippingAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div className="text-sm text-gray-600">
                          <div>{order.shippingAddress.city} - {order.shippingAddress.address}</div>
                          {order.shippingAddress.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Phone className="h-3 w-3" />
                              {order.shippingAddress.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* اطلاعات تماس مشتری */}
                    {(order.customerEmail || order.customerPhone) && (
                      <div className="bg-gray-50 p-2 rounded-lg space-y-1">
                        {order.customerEmail && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600">{order.customerEmail}</span>
                          </div>
                        )}
                        {order.customerPhone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600">{order.customerPhone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* روش پرداخت */}
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(order.paymentMethod)}
                      <span className="text-sm font-medium text-gray-700">
                        {order.paymentSourceLabel}
                      </span>
                    </div>

                    {/* مبلغ کل */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">مبلغ کل:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {parseFloat(order.totalAmount).toLocaleString()} دینار
                      </span>
                    </div>

                    {/* وزن کل */}
                    {order.totalWeight && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Weight className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">وزن کل:</span>
                        </div>
                        <span className="font-medium text-green-600">
                          {order.totalWeight} {order.weightUnit || 'kg'}
                        </span>
                      </div>
                    )}

                    {/* روش تحویل */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">روش تحویل:</span>
                      </div>
                      <span className="text-sm text-gray-700">
                        {order.deliveryMethod === 'courier' ? 'پیک' : 
                         order.deliveryMethod === 'pickup' ? 'تحویل حضوری' : 
                         order.deliveryMethod === 'mail' ? 'پست' : order.deliveryMethod}
                      </span>
                    </div>

                    {/* جزئیات پرداخت */}
                    {(parseFloat(order.walletAmountUsed || '0') > 0 || parseFloat(order.bankAmountPaid || '0') > 0) && (
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                        {parseFloat(order.walletAmountUsed || '0') > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600">کیف پول:</span>
                            <span className="font-medium">
                              {parseFloat(order.walletAmountUsed || '0').toLocaleString()} دینار
                            </span>
                          </div>
                        )}
                        {parseFloat(order.bankAmountPaid || '0') > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-600">درگاه بانکی:</span>
                            <span className="font-medium">
                              {parseFloat(order.bankAmountPaid || '0').toLocaleString()} دینار
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* یادداشت‌های مالی */}
                    {order.financialNotes && (
                      <div className="bg-blue-50 p-2 rounded text-sm">
                        <span className="font-medium text-blue-800">یادداشت: </span>
                        <span className="text-blue-700">{order.financialNotes}</span>
                      </div>
                    )}

                    {/* مبلغ اضافی واریزی */}
                    {parseFloat(order.excessAmountCredited || '0') > 0 && (
                      <div className="bg-green-50 p-2 rounded text-sm">
                        <span className="font-medium text-green-800">واریز اضافی: </span>
                        <span className="text-green-700">
                          {parseFloat(order.excessAmountCredited).toLocaleString()} دینار به کیف پول
                        </span>
                      </div>
                    )}

                    {/* تایید خودکار */}
                    {order.isAutoApprovalEnabled && order.autoApprovalScheduledAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Timer className="h-4 w-4 text-orange-500" />
                        <span className="text-orange-600">
                          {getRemainingTime(order.autoApprovalScheduledAt)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="temporary" className="space-y-4">
          {temporaryLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : temporaryOrders?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  هیچ سفارش موقتی یافت نشد
                </h3>
                <p className="text-gray-600">
                  سفارشات آزمایشی و موقت در اینجا نمایش داده می‌شوند
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {temporaryOrders?.map((order) => (
                <Card key={order.id} className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                            سفارش موقت
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            سفارش آزمایشی / موقت
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-lg">
                          سفارش {order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* اطلاعات مشتری */}
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">مشتری:</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{order.customerName}</div>
                        {order.customerPhone && (
                          <div className="text-sm text-gray-600">{order.customerPhone}</div>
                        )}
                      </div>
                    </div>

                    {/* مبلغ کل */}
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                      <span className="text-gray-600">مبلغ کل:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {parseFloat(order.totalAmount).toLocaleString()} دینار
                      </span>
                    </div>

                    {/* وزن کل */}
                    {order.totalWeight && (
                      <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Weight className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">وزن کل:</span>
                        </div>
                        <span className="font-medium text-green-600">
                          {order.totalWeight} {order.weightUnit || 'kg'}
                        </span>
                      </div>
                    )}

                    <div className="bg-blue-100 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">وضعیت: سفارش موقت/آزمایشی</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        این سفارش جهت تست و بررسی ایجاد شده است
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orphaned" className="space-y-4">
          {orphanedLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : orphanedOrders?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  هیچ سفارش یتیمی یافت نشد
                </h3>
                <p className="text-gray-600">
                  تمام سفارشات درگاه بانکی با موفقیت کامل شده‌اند
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orphanedOrders?.map((order) => (
                <Card key={order.id} className="border-amber-200 bg-amber-50/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <div>
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                            سفارش ناتمام
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            پرداخت درگاه بانکی ناکامل
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-lg">
                          سفارش {order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* اطلاعات مشتری */}
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">مشتری:</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{order.customerName}</div>
                        {order.customerPhone && (
                          <div className="text-sm text-gray-600">{order.customerPhone}</div>
                        )}
                      </div>
                    </div>

                    {/* مبلغ کل */}
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                      <span className="text-gray-600">مبلغ کل:</span>
                      <span className="font-bold text-lg text-amber-600">
                        {parseFloat(order.totalAmount).toLocaleString()} دینار
                      </span>
                    </div>

                    {/* آدرس تحویل */}
                    {order.shippingAddress && (
                      <div className="bg-white p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">آدرس تحویل:</span>
                        </div>
                        <div className="text-sm text-gray-700">
                          <div>{order.shippingAddress.address}</div>
                          <div>{order.shippingAddress.city}</div>
                          <div className="text-gray-600">{order.shippingAddress.phone}</div>
                        </div>
                      </div>
                    )}

                    <div className="bg-amber-100 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">وضعیت: سفارش ناتمام</span>
                      </div>
                      <p className="text-sm text-amber-700 mt-1">
                        این سفارش در لیست اصلی نمایش داده نمی‌شود تا زمان تکمیل پرداخت
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orphaned" className="space-y-4">
          {orphanedLoading ? (
            <Card>
              <CardContent className="text-center py-12">
                <Timer className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  در حال بارگیری سفارشات یتیم...
                </h3>
              </CardContent>
            </Card>
          ) : orphanedOrders?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  سفارش یتیمی وجود ندارد
                </h3>
                <p className="text-gray-600">
                  همه سفارشات دارای رکورد مدیریت مناسب هستند
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <div>
                      <h3 className="font-semibold text-red-800">
                        سفارشات یتیم - نیاز به تعمیر ({totalOrphaned} سفارش)
                      </h3>
                      <p className="text-sm text-red-600">
                        این سفارشات در جدول customer_orders موجود هستند ولی رکورد مدیریت ندارند
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {orphanedOrders?.map((order) => (
                  <Card key={order.id} className="border-red-200 bg-red-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-red-800">
                          سفارش {order.orderNumber}
                        </CardTitle>
                        <Badge variant="destructive" className="bg-red-600 text-white">
                          یتیم
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {/* اطلاعات مشتری */}
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700 font-medium">{order.customerName}</span>
                      </div>

                      {/* تاریخ سفارش */}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('fa-IR')} - {new Date(order.createdAt).toLocaleTimeString('fa-IR')}
                        </span>
                      </div>

                      {/* اطلاعات تماس مشتری */}
                      {(order.customerEmail || order.customerPhone) && (
                        <div className="bg-white p-2 rounded-lg space-y-1 border border-red-100">
                          {order.customerEmail && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-gray-500" />
                              <span className="text-gray-600">{order.customerEmail}</span>
                            </div>
                          )}
                          {order.customerPhone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-500" />
                              <span className="text-gray-600">{order.customerPhone}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* روش پرداخت */}
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(order.paymentMethod)}
                        <span className="text-sm font-medium text-gray-700">
                          {order.paymentMethod || 'نامشخص'}
                        </span>
                      </div>

                      {/* مبلغ کل */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">مبلغ کل:</span>
                        <span className="font-bold text-lg text-red-600">
                          {parseFloat(order.totalAmount || '0').toLocaleString()} دینار
                        </span>
                      </div>

                      {/* وضعیت */}
                      <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <Settings className="h-4 w-4" />
                          <span className="font-medium">وضعیت: {order.status || 'نامشخص'}</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          این سفارش فاقد رکورد مدیریت است و نیاز به تعمیر دارد
                        </p>
                      </div>

                      {/* دکمه تعمیر */}
                      <Button
                        onClick={() => handleRepairOrphanedOrder(order.id)}
                        disabled={repairOrphanedOrderMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {repairOrphanedOrderMutation.isPending ? (
                          <>
                            <Timer className="h-4 w-4 mr-2 animate-spin" />
                            در حال تعمیر...
                          </>
                        ) : (
                          <>
                            <Wrench className="h-4 w-4 mr-2" />
                            تعمیر سفارش یتیم
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="auto-approval">
          <Card>
            <CardHeader>
              <CardTitle>سفارشات در حال تایید خودکار</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders?.filter(order => order.isAutoApprovalEnabled).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <span className="font-medium">سفارش {order.orderNumber}</span>
                      <p className="text-sm text-gray-600">{order.paymentSourceLabel}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {parseFloat(order.totalAmount).toLocaleString()} دینار
                      </div>
                      {order.autoApprovalScheduledAt && (
                        <div className="text-sm text-orange-600">
                          {getRemainingTime(order.autoApprovalScheduledAt)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grace-period">
          <Card>
            <CardHeader>
              <CardTitle>سفارشات مهلت‌دار 3 روزه</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders?.filter(order => order.currentStatus === 'payment_grace_period').map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div>
                      <span className="font-medium">سفارش {order.orderNumber}</span>
                      <p className="text-sm text-gray-600">در انتظار آپلود فیش واریزی</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">
                        {parseFloat(order.totalAmount).toLocaleString()} دینار
                      </div>
                      <div className="text-sm text-gray-600">
                        مهلت: 3 روز
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {isLoadingApproved ? (
            <Card>
              <CardContent className="text-center py-12">
                <Timer className="h-16 w-16 text-green-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  در حال بارگیری سفارشات تایید شده...
                </h3>
              </CardContent>
            </Card>
          ) : approvedOrders?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  سفارش تایید شده‌ای یافت نشد
                </h3>
                <p className="text-gray-600">
                  در حال حاضر سفارشی تایید مالی نشده است
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {approvedOrders?.map((order) => (
                <Card key={order.id} className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            تایید شده
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {order.paymentSourceLabel}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-lg">
                          سفارش {order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* اطلاعات مشتری */}
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">مشتری:</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{order.customerName}</div>
                        {order.customerPhone && (
                          <div className="text-sm text-gray-600">{order.customerPhone}</div>
                        )}
                      </div>
                    </div>

                    {/* مبلغ کل */}
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                      <span className="text-gray-600">مبلغ کل:</span>
                      <span className="font-bold text-lg text-green-600">
                        {parseFloat(order.totalAmount).toLocaleString()} دینار
                      </span>
                    </div>

                    {/* وضعیت فعلی */}
                    <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                      <span className="text-gray-600">وضعیت فعلی:</span>
                      <span className="font-medium text-blue-600">
                        {getStatusBadge(order.currentStatus)}
                      </span>
                    </div>

                    {/* اطلاعات تایید مالی */}
                    {order.financialReviewedAt && (
                      <div className="bg-green-100 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800">تایید مالی:</span>
                        </div>
                        <div className="text-sm text-green-700">
                          <div>تاریخ تایید: {new Date(order.financialReviewedAt).toLocaleDateString('fa-IR')}</div>
                          <div>زمان تایید: {new Date(order.financialReviewedAt).toLocaleTimeString('fa-IR')}</div>
                          {order.financialNotes && (
                            <div className="mt-1">یادداشت: {order.financialNotes}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* اطلاعات فاکتور */}
                    {order.invoiceType && (
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">وضعیت فاکتور:</span>
                        </div>
                        <div className="text-sm text-blue-700">
                          <div>نوع فاکتور: {order.invoiceType === 'official_invoice' ? 'فاکتور رسمی' : 'فاکتور موقت'}</div>
                          {order.invoiceConvertedAt && (
                            <div>تاریخ تبدیل: {new Date(order.invoiceConvertedAt).toLocaleDateString('fa-IR')}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* آدرس تحویل */}
                    {order.shippingAddress && (
                      <div className="bg-white p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">آدرس تحویل:</span>
                        </div>
                        <div className="text-sm text-gray-700">
                          <div>{order.shippingAddress.address}</div>
                          <div>{order.shippingAddress.city}</div>
                          <div className="text-gray-600">{order.shippingAddress.phone}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orphaned" className="space-y-4">
          {orphanedLoading ? (
            <Card>
              <CardContent className="text-center py-12">
                <Timer className="h-16 w-16 text-orange-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  در حال بارگیری سفارشات یتیم...
                </h3>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* آمار وضعیت‌های سفارشات یتیم */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {orphanedOrders?.filter(order => 
                        order.currentStatus === 'pending' || 
                        order.currentStatus === 'confirmed' ||
                        order.currentStatus === 'pending_payment'
                      ).length || 0}
                    </div>
                    <div className="text-sm text-yellow-700 mt-1">در انتظار بررسی</div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {orphanedOrders?.filter(order => 
                        order.currentStatus === 'warehouse_ready' || 
                        order.currentStatus === 'warehouse_pending' ||
                        order.currentStatus === 'logistics_pending' ||
                        order.currentStatus === 'out_for_delivery'
                      ).length || 0}
                    </div>
                    <div className="text-sm text-green-700 mt-1">ارجاع شده به انبار</div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {orphanedOrders?.filter(order => 
                        order.currentStatus === 'cancelled' || 
                        order.currentStatus === 'rejected' ||
                        order.currentStatus === 'financial_rejected'
                      ).length || 0}
                    </div>
                    <div className="text-sm text-red-700 mt-1">رد شده</div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {temporaryOrders?.length || 0}
                    </div>
                    <div className="text-sm text-blue-700 mt-1">سفارشات موقت</div>
                  </CardContent>
                </Card>
              </div>

              {/* لیست سفارشات یتیم */}
              {totalOrphaned === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      سفارش یتیمی یافت نشد
                    </h3>
                    <p className="text-gray-600">
                      تمام سفارشات دارای رکورد مدیریت مناسب هستند
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    سفارشات یتیم نیازمند تعمیر ({totalOrphaned} سفارش)
                  </h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {orphanedOrders?.map((order) => (
                      <Card key={order.id} className="border-orange-200 bg-orange-50/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="h-5 w-5 text-orange-600" />
                              <div>
                                <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                                  سفارش یتیم
                                </Badge>
                                <p className="text-sm text-gray-600 mt-1">
                                  {order.paymentSourceLabel}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <h3 className="font-bold text-lg">
                                سفارش {order.orderNumber}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          {/* اطلاعات مشتری */}
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700 font-medium">{order.customerName}</span>
                          </div>

                          {/* تاریخ سفارش */}
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString('fa-IR')} - {new Date(order.createdAt).toLocaleTimeString('fa-IR')}
                            </span>
                          </div>

                          {/* اطلاعات تماس مشتری */}
                          {(order.customerEmail || order.customerPhone) && (
                            <div className="bg-white p-2 rounded-lg space-y-1 border border-orange-100">
                              {order.customerEmail && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3 text-gray-500" />
                                  <span className="text-gray-600">{order.customerEmail}</span>
                                </div>
                              )}
                              {order.customerPhone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-gray-500" />
                                  <span className="text-gray-600">{order.customerPhone}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* روش پرداخت */}
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(order.paymentMethod)}
                            <span className="text-sm font-medium text-gray-700">
                              {order.paymentMethod || 'نامشخص'}
                            </span>
                          </div>

                          {/* مبلغ کل */}
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">مبلغ کل:</span>
                            <span className="font-bold text-lg text-orange-600">
                              {parseFloat(order.totalAmount || '0').toLocaleString()} دینار
                            </span>
                          </div>

                          {/* وضعیت */}
                          <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-200">
                            <div className="flex items-center gap-2 text-yellow-800">
                              <Settings className="h-4 w-4" />
                              <span className="font-medium">وضعیت: {getStatusLabel(order.currentStatus)}</span>
                            </div>
                            <p className="text-sm text-yellow-700 mt-1">
                              این سفارش فاقد رکورد مدیریت است و نیاز به تعمیر دارد
                            </p>
                          </div>

                          {/* دکمه تعمیر */}
                          <Button
                            onClick={() => handleRepairOrphanedOrder(order.id)}
                            disabled={repairOrphanedOrderMutation.isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {repairOrphanedOrderMutation.isPending ? (
                              <>
                                <Timer className="h-4 w-4 mr-2 animate-spin" />
                                در حال تعمیر...
                              </>
                            ) : (
                              <>
                                <Wrench className="h-4 w-4 mr-2" />
                                تعمیر سفارش یتیم
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* پنل تایید دستی */}
      {selectedOrder && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              تایید دستی سفارش {selectedOrder.orderNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  یادداشت بررسی:
                </label>
                <Textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="یادداشت‌های مربوط به بررسی مالی..."
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  مبلغ اضافی (اختیاری):
                </label>
                <Input
                  type="number"
                  value={excessAmount}
                  onChange={(e) => setExcessAmount(e.target.value)}
                  placeholder="مبلغ اضافی که به کیف پول اضافه می‌شود"
                />
                <p className="text-xs text-gray-500 mt-1">
                  در صورت وجود مبلغ اضافی، به کیف پول مشتری اضافه خواهد شد
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleManualApproval}
                disabled={approveOrderMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveOrderMutation.isPending ? (
                  <>
                    <Timer className="h-4 w-4 mr-2 animate-spin" />
                    در حال پردازش...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    تایید و انتقال به انبار
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedOrder(null);
                  setApprovalNotes("");
                  setExcessAmount("");
                }}
              >
                انصراف
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
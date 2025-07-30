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
  User
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

  const handleManualApproval = () => {
    if (!selectedOrder) return;

    approveOrderMutation.mutate({
      orderMgmtId: selectedOrder.id,
      reviewerId: 1, // TODO: Get from authenticated user
      notes: approvalNotes || undefined,
      excessAmount: excessAmount ? parseFloat(excessAmount) : undefined
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      'financial_reviewing': { label: 'در حال بررسی', color: 'bg-yellow-100 text-yellow-700' },
      'payment_grace_period': { label: 'مهلت پرداخت', color: 'bg-orange-100 text-orange-700' },
      'payment_uploaded': { label: 'فیش آپلود شده', color: 'bg-blue-100 text-blue-700' }
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_gateway':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'wallet':
      case 'wallet_partial':
        return <Wallet className="h-4 w-4 text-green-600" />;
      case 'grace_period':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">سفارشات در انتظار</TabsTrigger>
          <TabsTrigger value="auto-approval">تایید خودکار</TabsTrigger>
          <TabsTrigger value="grace-period">مهلت‌دار</TabsTrigger>
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
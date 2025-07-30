import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Mail, MessageSquare, Clock, ShoppingCart, DollarSign, User, Phone, Calendar, Eye, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AbandonedOrder {
  id: number;
  customerId: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  cartData: any;
  totalAmount: string;
  currency: string;
  checkoutStep: string;
  walletAmountUsed?: string;
  bankAmountPending?: string;
  hybridOrderNumber?: string;
  remindersSent: number;
  lastReminderAt?: string;
  createdAt: string;
  isRecovered: boolean;
  isHybridPayment: boolean;
  totalValue: number;
  walletUsed: number;
  bankPending: number;
}

export default function AdminAbandonedOrders() {
  const [selectedOrder, setSelectedOrder] = useState<AbandonedOrder | null>(null);
  const [filterStep, setFilterStep] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch abandoned orders
  const { data: abandonedOrders = [], isLoading } = useQuery({
    queryKey: ['/api/abandoned-orders'],
    queryFn: async () => {
      const res = await apiRequest({ method: 'GET' }, '/api/abandoned-orders');
      return res.data;
    },
  });

  // Send manual reminder
  const sendReminderMutation = useMutation({
    mutationFn: async () => {
      return apiRequest({ method: 'POST' }, '/api/abandoned-orders/send-reminders');
    },
    onSuccess: () => {
      toast({
        title: "یادآوری‌ها ارسال شد",
        description: "یادآوری‌های سفارشات رها شده با موفقیت ارسال شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/abandoned-orders'] });
    },
    onError: () => {
      toast({
        title: "خطا در ارسال یادآوری‌ها",
        description: "مشکلی در ارسال یادآوری‌ها رخ داد",
        variant: "destructive",
      });
    },
  });

  // Mark as recovered
  const recoverMutation = useMutation({
    mutationFn: async ({ abandonedId, orderId }: { abandonedId: number; orderId: string }) => {
      return apiRequest({ method: 'POST', body: { orderId } }, `/api/abandoned-orders/${abandonedId}/recover`);
    },
    onSuccess: () => {
      toast({
        title: "سفارش بازیافت شد",
        description: "سفارش به عنوان بازیافت شده علامت‌گذاری شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/abandoned-orders'] });
      setSelectedOrder(null);
    },
  });

  const filteredOrders = abandonedOrders.filter((order: AbandonedOrder) => {
    if (filterStep === 'all') return true;
    if (filterStep === 'hybrid') return order.isHybridPayment;
    if (filterStep === 'recovered') return order.isRecovered;
    return order.checkoutStep === filterStep;
  });

  const getStepBadge = (step: string, isHybrid: boolean) => {
    if (isHybrid) {
      return <Badge variant="destructive" className="text-xs">پرداخت ترکیبی ناتمام</Badge>;
    }
    
    switch (step) {
      case 'shipping': return <Badge variant="secondary">محاسبه حمل و نقل</Badge>;
      case 'payment': return <Badge variant="outline">انتخاب پرداخت</Badge>;
      case 'review': return <Badge variant="default">بازبینی نهایی</Badge>;
      default: return <Badge variant="secondary">{step}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysAgo = (dateString: string) => {
    const days = Math.ceil((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">سفارشات رها شده</h1>
            <p className="text-gray-600">مدیریت و پیگیری سفارشات ناتمام مشتریان</p>
          </div>
          <Button 
            onClick={() => sendReminderMutation.mutate()}
            disabled={sendReminderMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 ml-2" />
            ارسال یادآوری‌ها
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <ShoppingCart className="w-8 h-8 text-blue-600 ml-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">کل سفارشات رها شده</p>
                  <p className="text-2xl font-bold">{abandonedOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-red-600 ml-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">پرداخت‌های ترکیبی ناتمام</p>
                  <p className="text-2xl font-bold">{abandonedOrders.filter((o: AbandonedOrder) => o.isHybridPayment).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-yellow-600 ml-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">ارزش کل از دست رفته</p>
                  <p className="text-2xl font-bold">
                    {abandonedOrders.reduce((sum: number, order: AbandonedOrder) => sum + order.totalValue, 0).toLocaleString()} دینار
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-purple-600 ml-4" />
                <div>
                  <p className="text-sm font-medium text-gray-600">بازیافت شده</p>
                  <p className="text-2xl font-bold">{abandonedOrders.filter((o: AbandonedOrder) => o.isRecovered).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={filterStep === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStep('all')}
              >
                همه ({abandonedOrders.length})
              </Button>
              <Button 
                variant={filterStep === 'hybrid' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStep('hybrid')}
              >
                پرداخت ترکیبی ({abandonedOrders.filter((o: AbandonedOrder) => o.isHybridPayment).length})
              </Button>
              <Button 
                variant={filterStep === 'shipping' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStep('shipping')}
              >
                حمل و نقل ({abandonedOrders.filter((o: AbandonedOrder) => o.checkoutStep === 'shipping').length})
              </Button>
              <Button 
                variant={filterStep === 'payment' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStep('payment')}
              >
                پرداخت ({abandonedOrders.filter((o: AbandonedOrder) => o.checkoutStep === 'payment').length})
              </Button>
              <Button 
                variant={filterStep === 'recovered' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilterStep('recovered')}
              >
                بازیافت شده ({abandonedOrders.filter((o: AbandonedOrder) => o.isRecovered).length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Abandoned Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="w-5 h-5 ml-2" />
              لیست سفارشات رها شده ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">در حال بارگیری...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">مشتری</TableHead>
                    <TableHead className="text-right">شماره سفارش</TableHead>
                    <TableHead className="text-right">مرحله</TableHead>
                    <TableHead className="text-right">مبلغ کل</TableHead>
                    <TableHead className="text-right">کیف پول</TableHead>
                    <TableHead className="text-right">بانک</TableHead>
                    <TableHead className="text-right">یادآوری‌ها</TableHead>
                    <TableHead className="text-right">تاریخ</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order: AbandonedOrder) => (
                    <TableRow key={order.id} className={order.isRecovered ? 'opacity-60' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.hybridOrderNumber || `AO-${order.id}`}
                      </TableCell>
                      <TableCell>
                        {getStepBadge(order.checkoutStep, order.isHybridPayment)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.totalValue.toLocaleString()} دینار
                      </TableCell>
                      <TableCell>
                        {order.walletUsed > 0 ? (
                          <Badge variant="secondary" className="text-green-700 bg-green-100">
                            {order.walletUsed.toLocaleString()} دینار
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {order.bankPending > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {order.bankPending.toLocaleString()} دینار
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.remindersSent} ارسال شده
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{formatDate(order.createdAt)}</div>
                        <div className="text-gray-500">{getDaysAgo(order.createdAt)} روز پیش</div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl" dir="rtl">
                            <DialogHeader>
                              <DialogTitle>جزئیات سفارش رها شده</DialogTitle>
                            </DialogHeader>
                            {selectedOrder && (
                              <AbandonedOrderDetails 
                                order={selectedOrder} 
                                onRecover={(orderId) => recoverMutation.mutate({ 
                                  abandonedId: selectedOrder.id, 
                                  orderId 
                                })}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AbandonedOrderDetails({ order, onRecover }: { order: AbandonedOrder; onRecover: (orderId: string) => void }) {
  const [recoveryOrderId, setRecoveryOrderId] = useState('');

  const cartItems = Array.isArray(order.cartData) ? order.cartData : Object.entries(order.cartData || {});

  return (
    <div className="space-y-6">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <User className="w-5 h-5 ml-2" />
            اطلاعات مشتری
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">نام مشتری</Label>
              <p className="font-medium">{order.customerName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">ایمیل</Label>
              <p>{order.customerEmail}</p>
            </div>
            {order.customerPhone && (
              <div>
                <Label className="text-sm font-medium text-gray-600">تلفن</Label>
                <p>{order.customerPhone}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-gray-600">تاریخ رها کردن</Label>
              <p>{new Date(order.createdAt).toLocaleDateString('fa-IR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      {order.isHybridPayment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <DollarSign className="w-5 h-5 ml-2" />
              جزئیات پرداخت ترکیبی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">مبلغ کل</p>
                <p className="text-xl font-bold">{order.totalValue.toLocaleString()} دینار</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">پرداخت شده (کیف پول)</p>
                <p className="text-xl font-bold text-green-700">{order.walletUsed.toLocaleString()} دینار</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">باقیمانده (بانک)</p>
                <p className="text-xl font-bold text-red-700">{order.bankPending.toLocaleString()} دینار</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cart Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <ShoppingCart className="w-5 h-5 ml-2" />
            محتویات سبد خرید ({cartItems.length} قلم)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cartItems.map(([productId, quantity]) => (
              <div key={productId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>محصول #{productId}</span>
                <Badge variant="outline">{quantity} عدد</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reminder History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Mail className="w-5 h-5 ml-2" />
            تاریخچه یادآوری‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span>تعداد یادآوری‌های ارسال شده:</span>
            <Badge variant="secondary">{order.remindersSent} یادآوری</Badge>
          </div>
          {order.lastReminderAt && (
            <div className="flex items-center justify-between mt-2">
              <span>آخرین یادآوری:</span>
              <span className="text-sm text-gray-600">
                {new Date(order.lastReminderAt).toLocaleDateString('fa-IR')}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recovery Actions */}
      {!order.isRecovered && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">علامت‌گذاری به عنوان بازیافت شده</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="orderId">شماره سفارش تکمیل شده</Label>
              <Input
                id="orderId"
                value={recoveryOrderId}
                onChange={(e) => setRecoveryOrderId(e.target.value)}
                placeholder="شماره سفارش نهایی را وارد کنید"
              />
            </div>
            <Button 
              onClick={() => onRecover(recoveryOrderId)}
              disabled={!recoveryOrderId.trim()}
              className="w-full"
            >
              علامت‌گذاری به عنوان بازیافت شده
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
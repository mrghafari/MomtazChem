import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package, 
  Truck, 
  CreditCard, 
  FileText,
  Eye,
  Calendar,
  MapPin,
  Phone,
  User,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';


interface OrderManagement {
  id: number;
  customerOrderId: number;
  currentStatus: string;
  deliveryCode: string | null;
  
  // Financial
  financialReviewerId: number | null;
  financialReviewedAt: string | null;
  financialNotes: string | null;
  paymentReceiptUrl: string | null;
  
  // Warehouse
  warehouseAssigneeId: number | null;
  warehouseProcessedAt: string | null;
  warehouseNotes: string | null;
  
  // Logistics
  logisticsAssigneeId: number | null;
  logisticsProcessedAt: string | null;
  logisticsNotes: string | null;
  trackingNumber: string | null;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  deliveryPersonName: string | null;
  deliveryPersonPhone: string | null;
  
  createdAt: string;
  updatedAt: string;
}

interface StatusHistoryItem {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  changedBy: number | null;
  changedByDepartment: string | null;
  notes: string | null;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  'pending_payment': 'در انتظار پرداخت',
  'payment_uploaded': 'رسید پرداخت آپلود شده',
  'financial_reviewing': 'بررسی مالی',
  'financial_approved': 'تایید مالی',
  'financial_rejected': 'رد مالی',
  'warehouse_notified': 'اطلاع‌رسانی انبار',
  'warehouse_processing': 'پردازش انبار',
  'warehouse_approved': 'تایید انبار',
  'warehouse_rejected': 'رد انبار',
  'logistics_assigned': 'تخصیص لجستیک',
  'logistics_processing': 'پردازش لجستیک',
  'logistics_dispatched': 'ارسال شده',
  'logistics_delivered': 'تحویل داده شده',
  'completed': 'تکمیل شده',
  'cancelled': 'لغو شده'
};

const statusColors: Record<string, string> = {
  'pending_payment': 'bg-gray-100 text-gray-800',
  'payment_uploaded': 'bg-blue-100 text-blue-800',
  'financial_reviewing': 'bg-yellow-100 text-yellow-800',
  'financial_approved': 'bg-green-100 text-green-800',
  'financial_rejected': 'bg-red-100 text-red-800',
  'warehouse_notified': 'bg-blue-100 text-blue-800',
  'warehouse_processing': 'bg-yellow-100 text-yellow-800',
  'warehouse_approved': 'bg-green-100 text-green-800',
  'warehouse_rejected': 'bg-red-100 text-red-800',
  'logistics_assigned': 'bg-blue-100 text-blue-800',
  'logistics_processing': 'bg-yellow-100 text-yellow-800',
  'logistics_dispatched': 'bg-purple-100 text-purple-800',
  'logistics_delivered': 'bg-green-100 text-green-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800'
};

export default function AdminOrderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDepartment, setSelectedDepartment] = useState<'financial' | 'warehouse' | 'logistics' | 'delivered' | 'finance-review'>('financial');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderManagement | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);



  // Fetch orders for selected department
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', selectedDepartment],
    queryFn: async () => {
      let apiUrl: string;
      
      if (selectedDepartment === 'delivered') {
        apiUrl = '/api/delivered/orders';
      } else if (selectedDepartment === 'finance-review') {
        apiUrl = '/api/order-management/financial';
      } else {
        apiUrl = `/api/order-management/${selectedDepartment}`;
      }
      
      const response = await fetch(apiUrl, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      return data.orders as OrderManagement[];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: true
  });

  // Fetch order history
  const { data: orderHistory } = useQuery({
    queryKey: ['order-history', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const response = await fetch(`/api/order-management/${selectedOrder.id}/history`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch order history');
      }
      const data = await response.json();
      return data.history as StatusHistoryItem[];
    },
    enabled: !!selectedOrder
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus, notes }: { orderId: number; newStatus: string; notes: string }) => {
      const response = await fetch(`/api/order-management/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          newStatus,
          department: selectedDepartment === 'finance-review' ? 'financial' : selectedDepartment,
          notes
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در بروزرسانی وضعیت سفارش');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'موفق',
        description: 'وضعیت سفارش با موفقیت بروزرسانی شد'
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setStatusDialogOpen(false);
      setNotes('');
      setNewStatus('');
    },
    onError: (error: any) => {
      toast({
        title: 'خطا',
        description: error.message || 'خطا در بروزرسانی وضعیت سفارش',
        variant: 'destructive'
      });
    }
  });

  // Financial review mutation (for approve/reject actions)
  const financialReviewMutation = useMutation({
    mutationFn: async ({ orderId, action, notes }: { orderId: number; action: 'approve' | 'reject'; notes: string }) => {
      const response = await fetch(`/api/finance/orders/${orderId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `خطا در ${action === 'approve' ? 'تایید' : 'رد'} واریزی`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', selectedDepartment] });
      setReviewDialogOpen(false);
      setReviewNotes('');
      setSelectedOrder(null);
      toast({
        title: "موفق",
        description: variables.action === 'approve' ? "واریزی تایید شد و به انبار اعلام شد" : "واریزی رد شد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در پردازش درخواست",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = () => {
    if (!selectedOrder || !newStatus) return;
    
    updateStatusMutation.mutate({
      orderId: selectedOrder.id,
      newStatus,
      notes
    });
  };

  const getValidStatuses = (currentStatus: string) => {
    switch (selectedDepartment) {
      case 'financial':
        if (currentStatus === 'payment_uploaded') {
          return ['financial_reviewing', 'financial_rejected'];
        }
        if (currentStatus === 'financial_reviewing') {
          return ['financial_approved', 'financial_rejected'];
        }
        break;
      case 'finance-review':
        if (currentStatus === 'payment_uploaded') {
          return ['financial_reviewing', 'financial_rejected'];
        }
        if (currentStatus === 'financial_reviewing') {
          return ['financial_approved', 'financial_rejected'];
        }
        break;
      case 'warehouse':
        if (currentStatus === 'financial_approved') {
          return ['warehouse_notified', 'warehouse_processing'];
        }
        if (currentStatus === 'warehouse_processing') {
          return ['warehouse_approved', 'warehouse_rejected'];
        }
        break;
      case 'logistics':
        if (currentStatus === 'warehouse_approved') {
          return ['logistics_assigned'];
        }
        if (currentStatus === 'logistics_assigned') {
          return ['logistics_processing'];
        }
        if (currentStatus === 'logistics_processing') {
          return ['logistics_dispatched'];
        }
        if (currentStatus === 'logistics_dispatched') {
          return ['logistics_delivered'];
        }
        if (currentStatus === 'logistics_delivered') {
          return ['completed'];
        }
        break;
    }
    return [];
  };

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case 'financial': return <CreditCard className="h-4 w-4" />;
      case 'finance-review': return <DollarSign className="h-4 w-4" />;
      case 'warehouse': return <Package className="h-4 w-4" />;
      case 'logistics': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">مدیریت سفارشات سه‌بخشی</h1>
          <p className="text-muted-foreground">
            مدیریت فرآیند سفارشات از طریق بخش‌های مالی، انبار و لجستیک
          </p>
        </div>
      </div>

      <Tabs value={selectedDepartment} onValueChange={(value) => setSelectedDepartment(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            بخش مالی
          </TabsTrigger>
          <TabsTrigger value="finance-review" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            بررسی واریزی‌ها
          </TabsTrigger>
          <TabsTrigger value="warehouse" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            انبار
          </TabsTrigger>
          <TabsTrigger value="logistics" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            لجستیک
          </TabsTrigger>
          <TabsTrigger value="delivered" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            سفارشات تحویل شده
          </TabsTrigger>
        </TabsList>

        {['financial', 'finance-review', 'warehouse', 'logistics', 'delivered'].map((dept) => (
          <TabsContent key={dept} value={dept} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getDepartmentIcon(dept)}
                  سفارشات بخش {dept === 'financial' ? 'مالی' : dept === 'finance-review' ? 'بررسی واریزی‌ها' : dept === 'warehouse' ? 'انبار' : dept === 'logistics' ? 'لجستیک' : 'تحویل شده'}
                </CardTitle>
                <CardDescription>
                  {dept === 'financial' && 'بررسی و تایید واریزی‌های مشتریان'}
                  {dept === 'finance-review' && 'بررسی و تایید واریزی‌های بانکی مشتریان'}
                  {dept === 'warehouse' && 'آماده‌سازی و تایید کالاهای سفارش'}
                  {dept === 'logistics' && 'ارسال و تحویل سفارشات به مشتریان'}
                  {dept === 'delivered' && 'سفارشات تحویل شده و تکمیل شده'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">در حال بارگذاری...</div>
                ) : !orders || orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    هیچ سفارشی برای این بخش یافت نشد
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">
                                سفارش #{order.customerOrderId}
                              </span>
                              <Badge className={statusColors[order.currentStatus] || 'bg-gray-100 text-gray-800'}>
                                {statusLabels[order.currentStatus] || order.currentStatus}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setHistoryDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                تاریخچه
                              </Button>
                              
                              {dept === 'finance-review' ? (
                                // دکمه‌های تایید/رد واریزی برای بخش بررسی واریزی‌ها
                                order.currentStatus === 'payment_uploaded' || order.currentStatus === 'financial_reviewing' ? (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => {
                                        setSelectedOrder(order);
                                        setReviewDialogOpen(true);
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      بررسی واریزی
                                    </Button>
                                  </>
                                ) : (
                                  <Badge variant="outline">پردازش شده</Badge>
                                )
                              ) : (
                                // دکمه بروزرسانی وضعیت برای سایر بخش‌ها
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setStatusDialogOpen(true);
                                  }}
                                  disabled={getValidStatuses(order.currentStatus).length === 0}
                                >
                                  بروزرسانی وضعیت
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">تاریخ ایجاد:</span>
                              <div>{formatDate(order.createdAt)}</div>
                            </div>
                            
                            {(dept === 'financial' || dept === 'finance-review') && order.paymentReceiptUrl && (
                              <div>
                                <span className="text-muted-foreground">رسید پرداخت:</span>
                                <div>
                                  <a 
                                    href={order.paymentReceiptUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    مشاهده رسید
                                  </a>
                                </div>
                              </div>
                            )}
                            
                            {dept === 'logistics' && order.trackingNumber && (
                              <div>
                                <span className="text-muted-foreground">کد رهگیری:</span>
                                <div className="font-mono">{order.trackingNumber}</div>
                              </div>
                            )}
                            
                            {dept === 'logistics' && order.deliveryCode && (
                              <div>
                                <span className="text-muted-foreground">کد تحویل:</span>
                                <div className="font-mono font-bold text-green-600">
                                  {order.deliveryCode}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Department-specific notes */}
                          {dept === 'financial' && order.financialNotes && (
                            <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                              <strong>یادداشت مالی:</strong> {order.financialNotes}
                            </div>
                          )}
                          {dept === 'warehouse' && order.warehouseNotes && (
                            <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                              <strong>یادداشت انبار:</strong> {order.warehouseNotes}
                            </div>
                          )}
                          {dept === 'logistics' && order.logisticsNotes && (
                            <div className="mt-3 p-2 bg-purple-50 rounded text-sm">
                              <strong>یادداشت لجستیک:</strong> {order.logisticsNotes}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>بروزرسانی وضعیت سفارش</DialogTitle>
            <DialogDescription>
              سفارش #{selectedOrder?.customerOrderId} - بخش {selectedDepartment === 'financial' ? 'مالی' : selectedDepartment === 'warehouse' ? 'انبار' : 'لجستیک'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">وضعیت جدید</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب وضعیت جدید" />
                </SelectTrigger>
                <SelectContent>
                  {selectedOrder && getValidStatuses(selectedOrder.currentStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status] || status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">یادداشت (اختیاری)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="توضیحات اضافی در مورد تغییر وضعیت..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                لغو
              </Button>
              <Button 
                onClick={handleStatusUpdate}
                disabled={!newStatus || updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? 'در حال بروزرسانی...' : 'تایید'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تاریخچه سفارش #{selectedOrder?.customerOrderId}</DialogTitle>
            <DialogDescription>
              تمام تغییرات وضعیت و فعالیت‌های مربوط به این سفارش
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            {orderHistory && orderHistory.length > 0 ? (
              <div className="space-y-3">
                {orderHistory.map((item, index) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      {index < orderHistory.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <Badge className={statusColors[item.toStatus] || 'bg-gray-100 text-gray-800'}>
                          {statusLabels[item.toStatus] || item.toStatus}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      {item.fromStatus && (
                        <div className="text-sm text-muted-foreground mt-1">
                          از: {statusLabels[item.fromStatus] || item.fromStatus}
                        </div>
                      )}
                      {item.changedByDepartment && (
                        <div className="text-sm text-muted-foreground">
                          بخش: {item.changedByDepartment === 'financial' ? 'مالی' : item.changedByDepartment === 'warehouse' ? 'انبار' : 'لجستیک'}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-sm mt-2 p-2 bg-gray-50 rounded">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                هیچ تاریخچه‌ای یافت نشد
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Financial Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>بررسی واریزی سفارش #{selectedOrder?.customerOrderId}</DialogTitle>
            <DialogDescription>
              بررسی و تایید/رد واریزی بانکی مشتری
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">جزئیات سفارش:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">شماره سفارش:</span>
                  <span className="font-medium ml-2">#{selectedOrder?.customerOrderId}</span>
                </div>
                <div>
                  <span className="text-gray-600">تاریخ ایجاد:</span>
                  <span className="font-medium ml-2">{selectedOrder && formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-600">وضعیت فعلی:</span>
                  <Badge className={selectedOrder ? statusColors[selectedOrder.currentStatus] || 'bg-gray-100 text-gray-800' : ''}>
                    {selectedOrder ? statusLabels[selectedOrder.currentStatus] || selectedOrder.currentStatus : ''}
                  </Badge>
                </div>
                {selectedOrder?.paymentReceiptUrl && (
                  <div>
                    <span className="text-gray-600">رسید پرداخت:</span>
                    <div>
                      <a 
                        href={selectedOrder.paymentReceiptUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        مشاهده رسید
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Review Notes */}
            <div>
              <Label htmlFor="reviewNotes">یادداشت بررسی (اختیاری)</Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="توضیحات در مورد تایید یا رد واریزی..."
                rows={3}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setReviewDialogOpen(false);
                  setReviewNotes('');
                  setSelectedOrder(null);
                }}
              >
                لغو
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedOrder) {
                    financialReviewMutation.mutate({
                      orderId: selectedOrder.id,
                      action: 'reject',
                      notes: reviewNotes
                    });
                  }
                }}
                disabled={financialReviewMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                رد واریزی
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  if (selectedOrder) {
                    financialReviewMutation.mutate({
                      orderId: selectedOrder.id,
                      action: 'approve',
                      notes: reviewNotes
                    });
                  }
                }}
                disabled={financialReviewMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {financialReviewMutation.isPending ? 'در حال پردازش...' : 'تایید واریزی'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
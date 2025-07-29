import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, Search, Eye, Filter, Calendar, Package, User, 
  DollarSign, MapPin, Phone, Mail, Truck, Clock, CheckCircle,
  AlertCircle, XCircle, RefreshCw, BarChart3, TrendingUp
} from 'lucide-react';
import { useLocation } from 'wouter';

interface Order {
  id: number;
  customerOrderId: number;
  orderNumber: string;
  currentStatus: string;
  totalAmount: string;
  currency: string;
  deliveryMethod: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  deliveryCode?: string;
  trackingNumber?: string;
  financialNotes?: string;
  warehouseNotes?: string;
  logisticsNotes?: string;
}

interface OrderStatistics {
  totalOrders: number;
  pendingPayment: number;
  financialReview: number;
  warehouseProcessing: number;
  logisticsProcessing: number;
  delivered: number;
  cancelled: number;
  rejected: number;
}

const statusLabels: { [key: string]: string } = {
  'pending_payment': 'در انتظار پرداخت',
  'payment_uploaded': 'فیش پرداختی آپلود شده',
  'financial_reviewing': 'در حال بررسی مالی',
  'financial_approved': 'تایید مالی',
  'financial_rejected': 'رد مالی',
  'warehouse_notified': 'اطلاع‌رسانی انبار',
  'warehouse_processing': 'در حال پردازش انبار',
  'warehouse_approved': 'تایید انبار',
  'warehouse_rejected': 'رد انبار',
  'logistics_assigned': 'تخصیص لجستیک',
  'logistics_processing': 'در حال پردازش لجستیک',
  'logistics_dispatched': 'ارسال شده',
  'logistics_delivered': 'تحویل داده شده',
  'completed': 'تکمیل شده',
  'cancelled': 'لغو شده'
};

const statusColors: { [key: string]: string } = {
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

const statusIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  'pending_payment': Clock,
  'payment_uploaded': CheckCircle,
  'financial_reviewing': AlertCircle,
  'financial_approved': CheckCircle,
  'financial_rejected': XCircle,
  'warehouse_notified': Package,
  'warehouse_processing': RefreshCw,
  'warehouse_approved': CheckCircle,
  'warehouse_rejected': XCircle,
  'logistics_assigned': Truck,
  'logistics_processing': RefreshCw,
  'logistics_dispatched': Truck,
  'logistics_delivered': CheckCircle,
  'completed': CheckCircle,
  'cancelled': XCircle
};

export default function OrderTrackingView() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch all orders with real-time data
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['/api/orders/tracking/all'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000
  });

  // Fetch order statistics
  const { data: statisticsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/order-management/statistics'],
    refetchInterval: 30000,
    staleTime: 10000
  });

  const orders = ordersData?.orders || [];
  const statistics = statisticsData || {} as OrderStatistics;

  // Filter orders based on search and status
  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = !searchTerm || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.phone.includes(searchTerm);

    const matchesStatus = selectedStatus === 'all' || order.currentStatus === selectedStatus;
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pending' && ['pending_payment', 'payment_uploaded', 'financial_reviewing'].includes(order.currentStatus)) ||
      (activeTab === 'processing' && ['warehouse_processing', 'logistics_processing'].includes(order.currentStatus)) ||
      (activeTab === 'completed' && ['logistics_delivered', 'completed'].includes(order.currentStatus)) ||
      (activeTab === 'rejected' && ['financial_rejected', 'warehouse_rejected', 'cancelled'].includes(order.currentStatus));

    return matchesSearch && matchesStatus && matchesTab;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    return `${numAmount.toLocaleString('fa-IR')} ${currency || 'IQD'}`;
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleRefresh = () => {
    refetchOrders();
    refetchStats();
  };

  if (ordersLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">در حال بارگذاری اطلاعات سفارشات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button
              variant="ghost"
              onClick={() => setLocation("/site-management")}
              className="flex items-center space-x-2 space-x-reverse"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>بازگشت به مدیریت سایت</span>
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">مدیریت و پیگیری تمامی سفارشات</h1>
              <p className="text-sm text-gray-600">نمایش فقط خواندنی - آخرین بروزرسانی: {new Date().toLocaleString('fa-IR')}</p>
            </div>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="flex items-center space-x-2 space-x-reverse">
            <RefreshCw className="w-4 h-4" />
            <span>بروزرسانی</span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{statistics.totalOrders || 0}</div>
                <div className="text-xs text-gray-600">کل سفارشات</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Clock className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{statistics.pendingPayment || 0}</div>
                <div className="text-xs text-gray-600">در انتظار پرداخت</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <AlertCircle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{statistics.financialReview || 0}</div>
                <div className="text-xs text-gray-600">بررسی مالی</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Package className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{statistics.warehouseProcessing || 0}</div>
                <div className="text-xs text-gray-600">پردازش انبار</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Truck className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{statistics.logisticsProcessing || 0}</div>
                <div className="text-xs text-gray-600">پردازش لجستیک</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{statistics.delivered || 0}</div>
                <div className="text-xs text-gray-600">تحویل شده</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{statistics.rejected || 0}</div>
                <div className="text-xs text-gray-600">رد شده</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{statistics.cancelled || 0}</div>
                <div className="text-xs text-gray-600">لغو شده</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="جستجو بر اساس شماره سفارش، نام مشتری، ایمیل یا تلفن..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="وضعیت سفارش" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">همه ({orders.length})</TabsTrigger>
            <TabsTrigger value="pending">در انتظار ({orders.filter((o: Order) => ['pending_payment', 'payment_uploaded', 'financial_reviewing'].includes(o.currentStatus)).length})</TabsTrigger>
            <TabsTrigger value="processing">در حال پردازش ({orders.filter((o: Order) => ['warehouse_processing', 'logistics_processing'].includes(o.currentStatus)).length})</TabsTrigger>
            <TabsTrigger value="completed">تکمیل شده ({orders.filter((o: Order) => ['logistics_delivered', 'completed'].includes(o.currentStatus)).length})</TabsTrigger>
            <TabsTrigger value="rejected">رد/لغو شده ({orders.filter((o: Order) => ['financial_rejected', 'warehouse_rejected', 'cancelled'].includes(o.currentStatus)).length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">هیچ سفارشی با این فیلترها یافت نشد</p>
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order: Order) => {
                  const StatusIcon = statusIcons[order.currentStatus] || Clock;
                  
                  return (
                    <Card key={order.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <StatusIcon className="w-5 h-5" />
                              <div>
                                <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                                <p className="text-sm text-gray-600">{order.customer.firstName} {order.customer.lastName}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <Badge className={statusColors[order.currentStatus]}>
                              {statusLabels[order.currentStatus]}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOrderClick(order)}
                              className="flex items-center space-x-2 space-x-reverse"
                            >
                              <Eye className="w-4 h-4" />
                              <span>جزئیات</span>
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span>{formatCurrency(order.totalAmount, order.currency)}</span>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Phone className="w-4 h-4 text-gray-600" />
                            <span>{order.customer.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <MapPin className="w-4 h-4 text-purple-600" />
                            <span>{order.shippingAddress.city}</span>
                          </div>
                        </div>

                        {(order.deliveryCode || order.trackingNumber) && (
                          <div className="mt-3 flex gap-4">
                            {order.deliveryCode && (
                              <Badge variant="outline" className="text-sm">
                                کد تحویل: {order.deliveryCode}
                              </Badge>
                            )}
                            {order.trackingNumber && (
                              <Badge variant="outline" className="text-sm">
                                کد رهگیری: {order.trackingNumber}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Order Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 space-x-reverse">
                <Package className="w-5 h-5" />
                <span>جزئیات سفارش {selectedOrder?.orderNumber}</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">وضعیت سفارش</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      {React.createElement(statusIcons[selectedOrder.currentStatus] || Clock, { className: "w-6 h-6" })}
                      <Badge className={`${statusColors[selectedOrder.currentStatus]} text-lg px-4 py-2`}>
                        {statusLabels[selectedOrder.currentStatus]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2 space-x-reverse">
                      <User className="w-5 h-5" />
                      <span>اطلاعات مشتری</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">نام کامل</label>
                        <p className="text-lg">{selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">شماره تلفن</label>
                        <p className="text-lg">{selectedOrder.customer.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">ایمیل</label>
                        <p className="text-lg">{selectedOrder.customer.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2 space-x-reverse">
                      <Package className="w-5 h-5" />
                      <span>اطلاعات سفارش</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">شماره سفارش</label>
                        <p className="text-lg font-mono">{selectedOrder.orderNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">مبلغ کل</label>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(selectedOrder.totalAmount, selectedOrder.currency)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">تاریخ ایجاد</label>
                        <p className="text-lg">{formatDate(selectedOrder.createdAt)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">آخرین بروزرسانی</label>
                        <p className="text-lg">{formatDate(selectedOrder.updatedAt)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">روش تحویل</label>
                        <p className="text-lg">{selectedOrder.deliveryMethod}</p>
                      </div>
                    </div>

                    {(selectedOrder.deliveryCode || selectedOrder.trackingNumber) && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedOrder.deliveryCode && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">کد تحویل</label>
                              <p className="text-lg font-mono bg-gray-100 px-3 py-2 rounded">
                                {selectedOrder.deliveryCode}
                              </p>
                            </div>
                          )}
                          {selectedOrder.trackingNumber && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">کد رهگیری</label>
                              <p className="text-lg font-mono bg-gray-100 px-3 py-2 rounded">
                                {selectedOrder.trackingNumber}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2 space-x-reverse">
                      <MapPin className="w-5 h-5" />
                      <span>آدرس تحویل</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>گیرنده:</strong> {selectedOrder.shippingAddress.name}</p>
                      <p><strong>تلفن:</strong> {selectedOrder.shippingAddress.phone}</p>
                      <p><strong>آدرس:</strong> {selectedOrder.shippingAddress.address}</p>
                      <p><strong>شهر:</strong> {selectedOrder.shippingAddress.city}</p>
                      {selectedOrder.shippingAddress.postalCode && (
                        <p><strong>کد پستی:</strong> {selectedOrder.shippingAddress.postalCode}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {(selectedOrder.financialNotes || selectedOrder.warehouseNotes || selectedOrder.logisticsNotes) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">یادداشت‌ها</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedOrder.financialNotes && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <strong className="text-yellow-800">یادداشت مالی:</strong>
                            <p className="text-yellow-700 mt-1">{selectedOrder.financialNotes}</p>
                          </div>
                        )}
                        {selectedOrder.warehouseNotes && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <strong className="text-blue-800">یادداشت انبار:</strong>
                            <p className="text-blue-700 mt-1">{selectedOrder.warehouseNotes}</p>
                          </div>
                        )}
                        {selectedOrder.logisticsNotes && (
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                            <strong className="text-purple-800">یادداشت لجستیک:</strong>
                            <p className="text-purple-700 mt-1">{selectedOrder.logisticsNotes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
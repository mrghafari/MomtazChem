import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Eye,
  Search,
  Clock,
  Package,
  Truck,
  CheckCircle,
  Calendar,
  MapPin,
  Phone,
  User,
  TrendingUp,
  AlertCircle,
  FileText,
  CreditCard,
  Activity,
  Timer,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

// Order interface
interface Order {
  id: number;
  customerOrderId: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  totalAmount: number | string;
  currency: string;
  status: string;
  paymentMethod?: string;
  paymentReceiptUrl?: string;
  trackingNumber?: string;
  deliveryCode?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  financialNotes?: string;
  warehouseNotes?: string;
  logisticsNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Status history interface
interface StatusHistoryItem {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  changedBy: number | null;
  changedByDepartment: string | null;
  notes: string | null;
  createdAt: string;
}

// Order statistics interface
interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  todaysOrders: number;
}

// Status labels in Persian
const statusLabels: { [key: string]: string } = {
  'pending': 'در انتظار',
  'pending_payment': 'در انتظار پرداخت',
  'payment_uploaded': 'رسید آپلود شده',
  'financial_review': 'بررسی مالی',
  'financial_approved': 'تأیید مالی',
  'financial_rejected': 'رد مالی',
  'warehouse_processing': 'در حال پردازش انبار',
  'warehouse_approved': 'تأیید انبار',
  'warehouse_rejected': 'رد انبار',
  'logistics_confirmed': 'تأیید لجستیک',
  'logistics_dispatched': 'ارسال شده',
  'delivered': 'تحویل داده شده',
  'completed': 'تکمیل شده',
  'cancelled': 'لغو شده'
};

// Department labels
const departmentLabels: { [key: string]: string } = {
  'financial': 'مالی',
  'warehouse': 'انبار',
  'logistics': 'لجستیک'
};

export default function OrderTrackingManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all'); // all, financial, orphaned

  // Fetch all orders for tracking
  const { data: orders, isLoading } = useQuery({
    queryKey: ['tracking-orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders/tracking/all', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tracking orders');
      }
      const data = await response.json();
      return data.orders as Order[];
    },
    refetchInterval: 30000
  });

  // Fetch financial orders
  const { data: financialOrders, isLoading: isLoadingFinancial } = useQuery({
    queryKey: ['financial-orders'],
    queryFn: async () => {
      const response = await fetch('/api/order-management/financial', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch financial orders');
      }
      const data = await response.json();
      return data.orders as Order[];
    },
    refetchInterval: 30000
  });

  // Fetch order statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['order-stats'],
    queryFn: async () => {
      const response = await fetch('/api/order-management/statistics', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch order statistics');
      }
      const data = await response.json();
      return data as OrderStats;
    },
    refetchInterval: 60000
  });

  // Fetch status history for selected order
  const { data: statusHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['order-status-history', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const response = await fetch(`/api/orders/${selectedOrder.id}/status-history`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch status history');
      }
      const data = await response.json();
      return data.history as StatusHistoryItem[];
    },
    enabled: !!selectedOrder
  });

  // Get current orders based on selected tab
  const getCurrentOrders = () => {
    if (selectedTab === 'financial') {
      return financialOrders || [];
    }
    if (selectedTab === 'orphaned') {
      return orders?.filter(order => order.status === 'pending_payment') || [];
    }
    return orders || [];
  };

  // Filter orders
  const filteredOrders = getCurrentOrders().filter(order => {
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.trackingNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">پیگیری سفارشات</h1>
          <p className="text-gray-600 mt-2">
            مدیریت و پیگیری تمامی سفارشات - فقط قابل مشاهده
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && !isLoadingStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">کل سفارشات</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm text-gray-600">در انتظار</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">تکمیل شده</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">درآمد کل</p>
                  <p className="text-lg font-bold text-purple-600">
                    {stats.totalRevenue.toLocaleString('fa-IR')} IQD
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">متوسط سفارش</p>
                  <p className="text-lg font-bold text-indigo-600">
                    {Math.round(stats.averageOrderValue).toLocaleString('fa-IR')} IQD
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-600" />
                <div>
                  <p className="text-sm text-gray-600">امروز</p>
                  <p className="text-2xl font-bold text-cyan-600">{stats.todaysOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            همه سفارشات
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            سفارشات مالی
          </TabsTrigger>
          <TabsTrigger value="orphaned" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            سفارشات یتیم
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-6 mt-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="جستجو بر اساس شماره سفارش، نام مشتری، ایمیل یا کد رهگیری..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <option key={status} value={status}>{label}</option>
                  ))}
                </select>
              </div>
              
              {/* Tab-specific info */}
              {selectedTab === 'financial' && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                    <p className="text-amber-800 font-medium">سفارشات نیازمند بررسی مالی</p>
                  </div>
                  <p className="text-sm text-amber-600 mt-1">
                    شامل سفارشات در انتظار پرداخت، رسیدهای آپلود شده، و سفارشات در حال بررسی مالی
                  </p>
                </div>
              )}
              
              {selectedTab === 'orphaned' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800 font-medium">سفارشات یتیم رها شده</p>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    سفارشاتی که در مرحله "در انتظار پرداخت" متوقف شده‌اند و نیاز به پیگیری دارند
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                لیست سفارشات ({filteredOrders.length})
              </CardTitle>
              <CardDescription>
                {selectedTab === 'all' && 'نمایش کامل تمامی سفارشات با قابلیت جستجو و فیلتر - فقط قابل مشاهده'}
                {selectedTab === 'financial' && 'سفارشات نیازمند بررسی مالی و پردازش پرداخت'}
                {selectedTab === 'orphaned' && 'سفارشات رها شده که در مرحله انتظار پرداخت متوقف شده‌اند'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || isLoadingFinancial ? (
                <div className="flex justify-center items-center py-8">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>در حال بارگذاری سفارشات...</span>
                  </div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>هیچ سفارشی یافت نشد</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-right p-3 font-medium">شماره سفارش</th>
                        <th className="text-right p-3 font-medium">مشتری</th>
                        <th className="text-right p-3 font-medium">تاریخ</th>
                        <th className="text-right p-3 font-medium">مبلغ</th>
                        <th className="text-right p-3 font-medium">وضعیت</th>
                        <th className="text-right p-3 font-medium">کد رهگیری</th>
                        <th className="text-right p-3 font-medium">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium text-blue-600">#{order.id}</td>
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{order.customerName || 'نامشخص'}</div>
                              <div className="text-sm text-gray-500">{order.customerEmail}</div>
                              {order.customerPhone && (
                                <div className="text-sm text-gray-500">{order.customerPhone}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-sm">
                            {new Date(order.createdAt).toLocaleDateString('en-US')}
                          </td>
                          <td className="p-3">
                            <div className="font-medium">
                              {typeof order.totalAmount === 'string' 
                                ? parseFloat(order.totalAmount).toLocaleString('fa-IR')
                                : order.totalAmount.toLocaleString('fa-IR')
                              } {order.currency}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge 
                              variant={
                                order.status === 'completed' ? 'default' :
                                order.status === 'delivered' ? 'default' :
                                order.status === 'pending_payment' ? 'destructive' :
                                'secondary'
                              }
                              className={
                                order.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                                order.status === 'delivered' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                order.status === 'pending_payment' ? 'bg-red-100 text-red-800 border-red-200' :
                                order.status === 'financial_approved' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                order.status === 'warehouse_processing' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                order.status === 'logistics_confirmed' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                'bg-gray-100 text-gray-800 border-gray-200'
                              }
                            >
                              {statusLabels[order.status] || order.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {order.trackingNumber ? (
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {order.trackingNumber}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">ندارد</span>
                            )}
                          </td>
                          <td className="p-3">
                            <Dialog open={dialogOpen && selectedOrder?.id === order.id} onOpenChange={(open) => {
                              setDialogOpen(open);
                              if (!open) setSelectedOrder(null);
                            }}>
                              <DialogTrigger asChild>
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  جزئیات
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    جزئیات سفارش #{order.id}
                                  </DialogTitle>
                                </DialogHeader>
                                
                                {selectedOrder && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {/* Customer Information */}
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="flex items-center gap-2 text-lg">
                                            <User className="w-5 h-5" />
                                            اطلاعات مشتری
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                          <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium">نام:</span>
                                            <span>{selectedOrder.customerName || 'نامشخص'}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 text-gray-500">@</span>
                                            <span className="font-medium">ایمیل:</span>
                                            <span>{selectedOrder.customerEmail || 'ندارد'}</span>
                                          </div>
                                          {selectedOrder.customerPhone && (
                                            <div className="flex items-center gap-2">
                                              <Phone className="w-4 h-4 text-gray-500" />
                                              <span className="font-medium">تلفن:</span>
                                              <span>{selectedOrder.customerPhone}</span>
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>

                                      {/* Order Information */}
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="flex items-center gap-2 text-lg">
                                            <Package className="w-5 h-5" />
                                            اطلاعات سفارش
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium">تاریخ ثبت:</span>
                                            <span>{new Date(selectedOrder.createdAt).toLocaleDateString('en-US')}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium">مبلغ کل:</span>
                                            <span className="font-bold text-green-600">
                                              {typeof selectedOrder.totalAmount === 'string' 
                                                ? parseFloat(selectedOrder.totalAmount).toLocaleString('fa-IR')
                                                : selectedOrder.totalAmount.toLocaleString('fa-IR')
                                              } {selectedOrder.currency}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Activity className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium">وضعیت:</span>
                                            <Badge className={
                                              selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                                              selectedOrder.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                                              selectedOrder.status === 'pending_payment' ? 'bg-red-100 text-red-800' :
                                              'bg-gray-100 text-gray-800'
                                            }>
                                              {statusLabels[selectedOrder.status] || selectedOrder.status}
                                            </Badge>
                                          </div>
                                          {selectedOrder.paymentMethod && (
                                            <div className="flex items-center gap-2">
                                              <CreditCard className="w-4 h-4 text-gray-500" />
                                              <span className="font-medium">روش پرداخت:</span>
                                              <span>{selectedOrder.paymentMethod}</span>
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </div>

                                    {/* Notes */}
                                    {(selectedOrder.financialNotes || selectedOrder.warehouseNotes || selectedOrder.logisticsNotes) && (
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="flex items-center gap-2 text-lg">
                                            <FileText className="w-5 h-5" />
                                            یادداشت‌های بخش‌ها
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                          {selectedOrder.financialNotes && (
                                            <div>
                                              <span className="font-medium text-amber-700">مالی:</span>
                                              <p className="text-sm mt-1 p-2 bg-amber-50 rounded">{selectedOrder.financialNotes}</p>
                                            </div>
                                          )}
                                          {selectedOrder.warehouseNotes && (
                                            <div>
                                              <span className="font-medium text-purple-700">انبار:</span>
                                              <p className="text-sm mt-1 p-2 bg-purple-50 rounded">{selectedOrder.warehouseNotes}</p>
                                            </div>
                                          )}
                                          {selectedOrder.logisticsNotes && (
                                            <div>
                                              <span className="font-medium text-blue-700">لجستیک:</span>
                                              <p className="text-sm mt-1 p-2 bg-blue-50 rounded">{selectedOrder.logisticsNotes}</p>
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>
                                    )}

                                    {/* Status History */}
                                    {statusHistory && statusHistory.length > 0 && (
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="flex items-center gap-2 text-lg">
                                            <Clock className="w-5 h-5" />
                                            تاریخچه تغییرات وضعیت
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="space-y-3">
                                            {statusHistory.map((item) => (
                                              <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium">
                                                      {item.fromStatus ? `${statusLabels[item.fromStatus] || item.fromStatus} ← ` : ''}
                                                      {statusLabels[item.toStatus] || item.toStatus}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                      {new Date(item.createdAt).toLocaleDateString('en-US')}
                                                    </span>
                                                  </div>
                                                  {item.changedByDepartment && (
                                                    <p className="text-sm text-gray-600">
                                                      توسط: {departmentLabels[item.changedByDepartment] || item.changedByDepartment}
                                                    </p>
                                                  )}
                                                  {item.notes && (
                                                    <p className="text-sm text-gray-700 mt-1">{item.notes}</p>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
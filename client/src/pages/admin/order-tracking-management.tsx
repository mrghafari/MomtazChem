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

// Order interface - Rebuilt to match actual backend database structure
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

// Status labels in Persian - Updated to match actual database statuses
const statusLabels: { [key: string]: string } = {
  'pending': 'در انتظار',
  'confirmed': 'تأیید شده', 
  'payment_uploaded': 'فیش بانکی آپلود شده',
  'financial_reviewing': 'در حال بررسی مالی',
  'financial_approved': 'تأیید مالی',
  'financial_rejected': 'رد مالی', 
  'warehouse_processing': 'در حال آماده‌سازی انبار',
  'warehouse_ready': 'آماده انبار',
  'logistics_assigned': 'تحویل لجستیک',
  'in_transit': 'در راه',
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

  // Get refresh interval from global settings
  const getOrderTrackingRefreshInterval = () => {
    const globalSettings = localStorage.getItem('global-refresh-settings');
    if (globalSettings) {
      const settings = JSON.parse(globalSettings);
      const crmSettings = settings.departments.crm;
      
      if (crmSettings?.autoRefresh) {
        const refreshInterval = settings.syncEnabled 
          ? settings.globalInterval 
          : crmSettings.interval;
        return refreshInterval * 1000; // Convert seconds to milliseconds
      }
    }
    return 600000; // Default 10 minutes if no settings found
  };

  // Fetch all orders for tracking - REBUILT to match actual database
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
    refetchInterval: getOrderTrackingRefreshInterval()
  });

  // Fetch order statistics - REBUILT to match actual API
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
    refetchInterval: getOrderTrackingRefreshInterval()
  });

  // Filter orders based on search and status
  const filteredOrders = orders?.filter(order => {
    const matchesSearch = !searchTerm || 
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerOrderId?.toString().includes(searchTerm) ||
      order.deliveryCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
      order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'confirmed':
        return 'secondary';
      case 'financial_approved':
        return 'default';
      case 'financial_rejected':
        return 'destructive';
      case 'delivered':
        return 'default';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format amount with currency
  const formatAmount = (amount: number | string | null | undefined, currency: string) => {
    if (amount === null || amount === undefined) return `0 ${currency}`;
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return `0 ${currency}`;
    return `${numericAmount.toLocaleString()} ${currency}`;
  };

  if (isLoading || isLoadingStats) {
    return (
      <div className="space-y-6 p-6" dir="rtl">
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
            <span className="sr-only">در حال بارگیری...</span>
          </div>
          <p className="mt-4 text-gray-600">در حال بارگیری اطلاعات سفارشات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-500 text-white rounded-full">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              مدیریت و پیگیری تمامی سفارشات
            </h1>
            <p className="text-orange-700 dark:text-orange-300 mt-1">
              پیگیری کامل ۴۶ سفارش موجود در سیستم - دسترسی فقط قابل مشاهده
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">کل سفارشات</p>
                <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">در انتظار</p>
                <p className="text-2xl font-bold">{stats?.pendingOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">تکمیل شده</p>
                <p className="text-2xl font-bold">{stats?.completedOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">درآمد کل</p>
                <p className="text-lg font-bold">{stats?.totalRevenue?.toLocaleString() || 0} IQD</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">میانگین سفارش</p>
                <p className="text-lg font-bold">{stats?.averageOrderValue?.toLocaleString() || 0} IQD</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">امروز</p>
                <p className="text-2xl font-bold">{stats?.todaysOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="جستجو در سفارشات (نام مشتری، ایمیل، شماره سفارش، کد تحویل)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <select 
          value={selectedStatus} 
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="pending">در انتظار</option>
          <option value="confirmed">تأیید شده</option>
          <option value="financial_approved">تأیید مالی</option>
          <option value="delivered">تحویل شده</option>
          <option value="completed">تکمیل شده</option>
          <option value="cancelled">لغو شده</option>
        </select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            لیست سفارشات ({filteredOrders.length})
          </CardTitle>
          <CardDescription>
            مشاهده و پیگیری تمامی سفارشات موجود در سیستم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="text-right p-3 font-semibold">شماره سفارش</th>
                  <th className="text-right p-3 font-semibold">مشتری</th>
                  <th className="text-right p-3 font-semibold">مبلغ</th>
                  <th className="text-right p-3 font-semibold">وضعیت</th>
                  <th className="text-right p-3 font-semibold">کد تحویل</th>
                  <th className="text-right p-3 font-semibold">تاریخ ایجاد</th>
                  <th className="text-right p-3 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3">
                      <div className="font-medium">#{order.customerOrderId}</div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{order.customerName || 'نامشخص'}</div>
                        <div className="text-sm text-gray-600">{order.customerEmail}</div>
                        <div className="text-sm text-gray-600">{order.customerPhone}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">
                        {formatAmount(order.totalAmount, order.currency)}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {order.deliveryCode ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {order.deliveryCode}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="p-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4" />
                            مشاهده
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Package className="w-5 h-5" />
                              جزئیات سفارش #{selectedOrder?.customerOrderId}
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedOrder && (
                            <div className="space-y-6">
                              {/* Customer Information */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <User className="w-5 h-5" />
                                      اطلاعات مشتری
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    <div><strong>نام:</strong> {selectedOrder.customerName || 'نامشخص'}</div>
                                    <div><strong>ایمیل:</strong> {selectedOrder.customerEmail || 'نامشخص'}</div>
                                    <div><strong>تلفن:</strong> {selectedOrder.customerPhone || 'نامشخص'}</div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <CreditCard className="w-5 h-5" />
                                      اطلاعات مالی
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    <div><strong>مبلغ کل:</strong> {formatAmount(selectedOrder.totalAmount, selectedOrder.currency)}</div>
                                    <div><strong>روش پرداخت:</strong> {selectedOrder.paymentMethod || 'نامشخص'}</div>
                                    <div><strong>وضعیت:</strong> 
                                      <Badge variant={getStatusBadgeVariant(selectedOrder.status)} className="mr-2">
                                        {statusLabels[selectedOrder.status] || selectedOrder.status}
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Delivery Information */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <Truck className="w-5 h-5" />
                                    اطلاعات تحویل
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div><strong>کد تحویل:</strong> {selectedOrder.deliveryCode || 'تخصیص نشده'}</div>
                                  <div><strong>شماره رهگیری:</strong> {selectedOrder.trackingNumber || 'تخصیص نشده'}</div>
                                  <div><strong>تاریخ تحویل تخمینی:</strong> {selectedOrder.estimatedDeliveryDate ? formatDate(selectedOrder.estimatedDeliveryDate) : 'تعیین نشده'}</div>
                                  <div><strong>تاریخ تحویل واقعی:</strong> {selectedOrder.actualDeliveryDate ? formatDate(selectedOrder.actualDeliveryDate) : 'تحویل نشده'}</div>
                                  <div><strong>نام تحویل‌دهنده:</strong> {selectedOrder.deliveryPersonName || 'تخصیص نشده'}</div>
                                  <div><strong>تلفن تحویل‌دهنده:</strong> {selectedOrder.deliveryPersonPhone || 'تخصیص نشده'}</div>
                                </CardContent>
                              </Card>

                              {/* Department Notes */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                      <FileText className="w-4 h-4" />
                                      یادداشت‌های مالی
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-gray-600">
                                      {selectedOrder.financialNotes || 'یادداشتی وجود ندارد'}
                                    </p>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                      <Package className="w-4 h-4" />
                                      یادداشت‌های انبار
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-gray-600">
                                      {selectedOrder.warehouseNotes || 'یادداشتی وجود ندارد'}
                                    </p>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                      <Truck className="w-4 h-4" />
                                      یادداشت‌های لجستیک
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-gray-600">
                                      {selectedOrder.logisticsNotes || 'یادداشتی وجود ندارد'}
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Timestamps */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    تاریخ‌ها
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div><strong>تاریخ ایجاد:</strong> {formatDate(selectedOrder.createdAt)}</div>
                                  <div><strong>آخرین بروزرسانی:</strong> {formatDate(selectedOrder.updatedAt)}</div>
                                </CardContent>
                              </Card>
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

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">سفارشی یافت نشد</h3>
              <p className="text-gray-600">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'هیچ سفارشی با فیلترهای انتخابی یافت نشد'
                  : 'هنوز سفارشی در سیستم ثبت نشده است'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
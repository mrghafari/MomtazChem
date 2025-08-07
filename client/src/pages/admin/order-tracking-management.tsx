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
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import PaymentMethodBadge from '@/components/PaymentMethodBadge';

// Order interface - Rebuilt to match actual backend database structure
interface Order {
  id: number;
  customerOrderId: number;
  orderNumber?: string;
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

// Enhanced status display with detailed explanations for failed/deleted orders
const getStatusDisplay = (order: Order) => {
  const status = order.status;
  const paymentReceiptUrl = order.paymentReceiptUrl;
  
  switch (status) {
    case 'pending':
      // Check if payment receipt is uploaded to determine which department
      if (!paymentReceiptUrl) {
        return {
          label: 'در انتظار پرداخت',
          department: 'مشتری',
          color: 'bg-red-100 text-red-800 border-red-200',
          explanation: 'مشتری هنوز فیش پرداخت را آپلود نکرده است'
        };
      } else {
        return {
          label: 'در انتظار بررسی مالی',
          department: 'مالی',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          explanation: 'فیش پرداخت آپلود شده و در انتظار تایید بخش مالی'
        };
      }
    case 'confirmed':
      return {
        label: 'در انتظار آماده‌سازی',
        department: 'انبار', 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        explanation: 'پرداخت تایید شده و در انتظار آماده‌سازی توسط انبار'
      };
    case 'warehouse_ready':
      return {
        label: 'در انتظار تحویل',
        department: 'لجستیک',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        explanation: 'سفارش آماده شده و در انتظار ارسال توسط لجستیک'
      };
    case 'delivered':
      return {
        label: 'تحویل شده',
        department: 'تکمیل',
        color: 'bg-green-100 text-green-800 border-green-200',
        explanation: 'سفارش با موفقیت به مشتری تحویل داده شده'
      };
    
    // FAILED & DELETED ORDERS WITH DETAILED EXPLANATIONS
    case 'deleted':
      return {
        label: '❌ حذف شده',
        department: 'مدیریت',
        color: 'bg-red-200 text-red-900 border-red-300',
        explanation: 'سفارش توسط مدیریت حذف شده است (ممکن است به دلیل مشکل در پردازش، درخواست مشتری یا مشکل فنی)',
        isProblematic: true
      };
    case 'cancelled':
      return {
        label: '🚫 لغو شده',
        department: 'لغو',
        color: 'bg-orange-200 text-orange-900 border-orange-300',
        explanation: 'سفارش لغو شده است (ممکن است توسط مشتری، مدیریت یا به دلیل عدم پرداخت)',
        isProblematic: true
      };
    case 'financial_rejected':
      return {
        label: '💳 رد مالی',
        department: 'مالی',
        color: 'bg-red-200 text-red-900 border-red-300',
        explanation: 'فیش پرداخت توسط بخش مالی رد شده است (ممکن است نامعتبر، ناکافی یا قابل تشخیص نباشد)',
        isProblematic: true
      };
    case 'payment_failed':
      return {
        label: '❌ پرداخت ناموفق',
        department: 'پرداخت',
        color: 'bg-red-200 text-red-900 border-red-300',
        explanation: 'پرداخت آنلاین با شکست مواجه شده است (ممکن است به دلیل مشکل بانکی، عدم موجودی یا خطای فنی)',
        isProblematic: true
      };
    case 'expired':
      return {
        label: '⏰ منقضی شده',
        department: 'سیستم',
        color: 'bg-gray-200 text-gray-900 border-gray-300',
        explanation: 'سفارش به دلیل عدم پرداخت در زمان مقرر منقضی شده است',
        isProblematic: true
      };
    case 'warehouse_rejected':
      return {
        label: '📦 رد انبار',
        department: 'انبار',
        color: 'bg-red-200 text-red-900 border-red-300',
        explanation: 'سفارش توسط انبار رد شده است (ممکن است به دلیل عدم موجودی، مشکل در محصول یا خرابی)',
        isProblematic: true
      };
    case 'logistics_failed':
      return {
        label: '🚛 شکست ارسال',
        department: 'لجستیک',
        color: 'bg-red-200 text-red-900 border-red-300',
        explanation: 'ارسال سفارش با مشکل مواجه شده است (ممکن است به دلیل آدرس نامعتبر، عدم دسترسی یا مشکل حمل‌ونقل)',
        isProblematic: true
      };
    
    default:
      return {
        label: status || 'نامشخص',
        department: 'نامعتبر',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        explanation: `وضعیت نامشخص یا جدید: ${status}. نیاز به بررسی توسط مدیریت فنی`,
        isProblematic: true
      };
  }
};

// Comprehensive status labels including failed/problematic orders
const statusLabels: { [key: string]: string } = {
  'pending': 'در انتظار',
  'confirmed': 'تأیید شده', 
  'payment_uploaded': 'فیش بانکی آپلود شده',
  'financial_reviewing': 'در حال بررسی مالی',
  'financial_approved': 'تأیید مالی',
  'financial_rejected': '💳 رد مالی', 
  'warehouse_processing': 'در حال آماده‌سازی انبار',
  'warehouse_ready': 'آماده انبار',
  'warehouse_rejected': '📦 رد انبار',
  'logistics_assigned': 'تحویل لجستیک',
  'logistics_failed': '🚛 شکست ارسال',
  'in_transit': 'در راه',
  'delivered': 'تحویل داده شده',
  'completed': 'تکمیل شده',
  'cancelled': '🚫 لغو شده',
  'deleted': '❌ حذف شده',
  'payment_failed': '❌ پرداخت ناموفق',
  'expired': '⏰ منقضی شده'
};

// Department labels
const departmentLabels: { [key: string]: string } = {
  'financial': 'مالی',
  'warehouse': 'انبار',
  'logistics': 'لجستیک'
};

// Format date function - Exactly same as financial department
const formatDate = (dateString: string) => {
  if (!dateString) return 'نامشخص';  
  try {
    return new Date(dateString).toLocaleDateString('en-US');
  } catch {
    return 'تاریخ نامعتبر';
  }
};

export default function OrderTrackingManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all'); // all, financial, orphaned
  const [sortField, setSortField] = useState<keyof Order | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Manual refresh only - no automatic refresh intervals

  // Fetch all orders for tracking - OPTIMIZED FOR PERFORMANCE
  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['tracking-orders-optimized'],
    queryFn: async () => {
      const response = await fetch('/api/orders/tracking/all', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        // If authentication fails, redirect to login
        if (response.status === 401) {
          window.location.href = '/admin/login';
          return [];
        }
        throw new Error('Failed to fetch tracking orders');
      }
      
      const data = await response.json();
      return data.orders as Order[];
    },
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep cache for 5 minutes
    retry: (failureCount, error) => {
      // Don't retry auth failures
      if (error.message.includes('401')) return false;
      return failureCount < 2;
    }
  });

  // Fetch order statistics - Manual refresh only
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['order-management-statistics-updated'],
    queryFn: async () => {
      const response = await fetch('/api/order-management/statistics', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/admin/login';
          return {};
        }
        throw new Error('Failed to fetch order statistics');
      }
      const data = await response.json();
      console.log('📊 [STATS] Statistics loaded:', data);
      return data as OrderStats;
    },
    staleTime: 10000, // Consider data stale after 10 seconds
    gcTime: 60000, // Keep cache for 1 minute
    retry: 2
  });

  // Handle sorting
  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort orders
  const filteredOrders = orders?.filter(order => {
    const matchesSearch = !searchTerm || 
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerOrderId?.toString().includes(searchTerm) ||
      order.deliveryCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Enhanced status filtering including problematic orders
    let matchesStatus = true;
    if (selectedStatus === 'problematic') {
      // Filter for problematic/failed orders only
      const statusInfo = getStatusDisplay(order);
      matchesStatus = statusInfo.isProblematic === true;
    } else if (selectedStatus !== 'all') {
      matchesStatus = order.status === selectedStatus;
    }
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle undefined values
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;
    
    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
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

  // Format date for display - Show exact checkout submission time in Gregorian
  const formatDateDetailed = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Format amount with currency
  const formatAmount = (amount: number | string | null | undefined, currency: string) => {
    if (amount === null || amount === undefined) return `0 ${currency}`;
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return `0 ${currency}`;
    return `${numericAmount.toLocaleString()} ${currency}`;
  };

  // Debug information display
  console.log('🔍 [RENDER DEBUG] Component state:', {
    isLoading,
    isLoadingStats,
    ordersData: orders,
    ordersCount: orders?.length || 0,
    hasOrders: !!orders,
  });

  // Show login prompt if authentication error
  if (error && error.message.includes('401')) {
    return (
      <div className="space-y-6 p-6" dir="rtl">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-gray-800">جلسه منقضی شده</h2>
          <p className="mt-2 text-gray-600">برای مشاهده سفارشات، لطفاً دوباره وارد شوید</p>
          <button 
            onClick={() => window.location.href = '/admin/login'}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ورود مجدد
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || isLoadingStats) {
    return (
      <div className="space-y-6 p-6" dir="rtl">
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
            <span className="sr-only">در حال بارگیری...</span>
          </div>
          <p className="mt-4 text-gray-700 font-medium">بارگیری سفارشات...</p>
          <p className="mt-2 text-sm text-gray-500">در حال دریافت آخرین وضعیت سفارشات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">

      {/* UPDATED Statistics Cards with Real-time Data */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="relative">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">کل سفارشات</p>
                <p className="text-2xl font-bold text-blue-700">
                  {isLoadingStats ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats?.totalOrders || 0
                  )}
                </p>
              </div>
            </div>
            {!isLoadingStats && (
              <div className="absolute top-2 left-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">در انتظار</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {isLoadingStats ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats?.pendingOrders || 0
                  )}
                </p>
              </div>
            </div>
            {!isLoadingStats && (
              <div className="absolute top-2 left-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">تکمیل شده</p>
                <p className="text-2xl font-bold text-green-700">
                  {isLoadingStats ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats?.completedOrders || 0
                  )}
                </p>
              </div>
            </div>
            {!isLoadingStats && (
              <div className="absolute top-2 left-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">درآمد کل (30 روز)</p>
                <p className="text-lg font-bold text-green-700">
                  {isLoadingStats ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    `${(stats?.totalRevenue || 0).toLocaleString()} IQD`
                  )}
                </p>
              </div>
            </div>
            {!isLoadingStats && (
              <div className="absolute top-2 left-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">میانگین سفارش</p>
                <p className="text-lg font-bold text-purple-700">
                  {isLoadingStats ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    `${(stats?.averageOrderValue || 0).toLocaleString()} IQD`
                  )}
                </p>
              </div>
            </div>
            {!isLoadingStats && (
              <div className="absolute top-2 left-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">سفارشات امروز</p>
                <p className="text-2xl font-bold text-orange-700">
                  {isLoadingStats ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    stats?.todaysOrders || 0
                  )}
                </p>
              </div>
            </div>
            {!isLoadingStats && (
              <div className="absolute top-2 left-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Real-time Update Indicator */}
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-800 font-medium">
            آمارها - بروزرسانی دستی
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => refetchStats()}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            به‌روزرسانی فوری
          </button>
          {isLoadingStats && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          )}
        </div>
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
          <option value="problematic" className="text-red-600 font-medium">🚨 فقط مشکل‌دار و شکست خورده</option>
          <option value="pending">در انتظار</option>
          <option value="confirmed">تأیید شده</option>
          <option value="financial_approved">تأیید مالی</option>
          <option value="delivered">تحویل شده</option>
          <option value="completed">تکمیل شده</option>
          <option value="cancelled">لغو شده</option>
          <option value="deleted">حذف شده</option>
          <option value="financial_rejected">رد مالی</option>
          <option value="payment_failed">پرداخت ناموفق</option>
          <option value="warehouse_rejected">رد انبار</option>
          <option value="expired">منقضی شده</option>
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
                <tr className="border-b-2 bg-gray-50 dark:bg-gray-800">
                  <th className="text-right p-4 font-semibold" style={{ width: '140px' }}>
                    <button 
                      onClick={() => handleSort('orderNumber')}
                      className="flex items-center justify-end w-full hover:text-blue-600 transition-colors"
                    >
                      شماره سفارش
                      {sortField === 'orderNumber' && (
                        <span className="mr-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="text-right p-4 font-semibold" style={{ width: '200px' }}>
                    <button 
                      onClick={() => handleSort('customerName')}
                      className="flex items-center justify-end w-full hover:text-blue-600 transition-colors"
                    >
                      مشتری
                      {sortField === 'customerName' && (
                        <span className="mr-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="text-right p-4 font-semibold" style={{ width: '120px' }}>
                    <button 
                      onClick={() => handleSort('totalAmount')}
                      className="flex items-center justify-end w-full hover:text-blue-600 transition-colors"
                    >
                      مبلغ
                      {sortField === 'totalAmount' && (
                        <span className="mr-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="text-right p-4 font-semibold" style={{ width: '200px' }}>
                    <button 
                      onClick={() => handleSort('status')}
                      className="flex items-center justify-end w-full hover:text-blue-600 transition-colors"
                    >
                      وضعیت / توضیحات مشکلات
                      {sortField === 'status' && (
                        <span className="mr-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="text-right p-4 font-semibold" style={{ width: '140px' }}>
                    <button 
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center justify-end w-full hover:text-blue-600 transition-colors"
                    >
                      زمان ثبت سفارش
                      {sortField === 'createdAt' && (
                        <span className="mr-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="text-center p-4 font-semibold" style={{ width: '100px' }}>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    order.status === 'deleted' ? 'bg-orange-50/50 hover:bg-orange-100/50' : ''
                  }`}>
                    <td className="p-4 text-right" style={{ width: '140px' }}>
                      <div className="font-medium text-blue-600">#{order.orderNumber || order.customerOrderId}</div>
                    </td>
                    <td className="p-4 text-right" style={{ width: '200px' }}>
                      <div className="space-y-1">
                        <div className="font-medium">{order.customerName || 'نامشخص'}</div>
                        <div className="text-xs text-gray-600">{order.customerEmail}</div>
                        <div className="text-xs text-gray-600">{order.customerPhone}</div>
                      </div>
                    </td>
                    <td className="p-4 text-right" style={{ width: '120px' }}>
                      <div className="font-medium text-sm">
                        {formatAmount(order.totalAmount, order.currency || 'IQD')}
                      </div>
                    </td>
                    <td className="p-4 text-right" style={{ width: '200px' }}>
                      {(() => {
                        const statusInfo = getStatusDisplay(order);
                        return (
                          <div className="space-y-1">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </div>
                            <div className="text-xs text-gray-600 text-center">
                              {statusInfo.department}
                            </div>
                            {/* Show detailed explanation for failed/problematic orders */}
                            {statusInfo.isProblematic && statusInfo.explanation && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                                <div className="flex items-start gap-1">
                                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                  <span className="leading-tight">{statusInfo.explanation}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-right" style={{ width: '140px' }}>
                      <div className="text-sm">
                        {order.createdAt ? formatDate(order.createdAt) : 'در حال بارگیری...'}
                      </div>
                    </td>
                    <td className="p-4 text-center" style={{ width: '100px' }}>
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
                                    <div className="flex items-center gap-2">
                                      <strong>روش پرداخت:</strong>
                                      {selectedOrder.paymentMethod ? (
                                        <PaymentMethodBadge 
                                          paymentMethod={selectedOrder.paymentMethod}
                                          showIcon={true}
                                          className="text-xs"
                                        />
                                      ) : (
                                        <span>نامشخص</span>
                                      )}
                                    </div>
                                    <div><strong>وضعیت فعلی:</strong> 
                                      {(() => {
                                        const statusInfo = getStatusDisplay(selectedOrder);
                                        return (
                                          <div className="space-y-2 mt-2">
                                            <div className="inline-flex items-center gap-2">
                                              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}>
                                                {statusInfo.label}
                                              </div>
                                              <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                                                {statusInfo.department}
                                              </div>
                                            </div>
                                            {/* Show detailed explanation for failed/problematic orders in dialog */}
                                            {statusInfo.isProblematic && statusInfo.explanation && (
                                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
                                                  <div>
                                                    <div className="text-sm font-medium text-red-800 mb-1">توضیحات مشکل:</div>
                                                    <div className="text-sm text-red-700">{statusInfo.explanation}</div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
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
                                    زمان‌های ثبت و بروزرسانی
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="p-3 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      <strong className="text-green-800">زمان ثبت سفارش توسط مشتری:</strong>
                                    </div>
                                    <div className="text-green-700 text-sm">
                                      {formatDate(selectedOrder.createdAt)}
                                    </div>
                                    <div className="text-xs text-green-600 mt-1">
                                      (زمان دقیق submit کردن سفارش در صفحه checkout)
                                    </div>
                                  </div>
                                  <div className="p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Activity className="w-4 h-4 text-blue-600" />
                                      <strong className="text-blue-800">آخرین بروزرسانی وضعیت:</strong>
                                    </div>
                                    <div className="text-blue-700 text-sm">
                                      {formatDate(selectedOrder.updatedAt)}
                                    </div>
                                  </div>
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
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Search, Filter, ArrowLeft, FileText, Clock, CheckCircle, XCircle, Plus, Edit3, Trash2, Download, Upload, RefreshCw, AlertTriangle, Calendar, Users, TrendingUp, TrendingDown, Eye, BarChart3, Package2, Truck, Weight, Calculator, FileSpreadsheet, ChevronRight, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Order {
  id: number;
  customerOrderId: number;
  orderNumber?: string;
  currentStatus: string;
  status: string;
  deliveryCode: string | null;
  totalAmount: string;
  currency: string;
  totalWeight: string | null;
  weightUnit: string;
  deliveryMethod: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerName?: string;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  receipt?: {
    url: string;
    fileName: string;
    mimeType: string;
  };
  receiptUrl?: string;
  receiptFileName?: string;
  receiptMimeType?: string;
  createdAt: string;
  updatedAt: string;
  warehouseProcessedAt?: string;
  warehouseNotes?: string;
  financialReviewedAt?: string;
  financialNotes?: string;
  quantity: number;
  paymentDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  trackingNumber?: string;
  notes?: string;
}

const WarehouseManagementFixed: React.FC = () => {
  // All state declarations at the top
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [warehouseNotes, setWarehouseNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  
  // Header filter states
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState('');
  
  // Loading state for individual orders
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);
  
  // All hooks called consistently
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Queries
  const { data: ordersResponse, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['/api/order-management/warehouse'],
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const orders = ordersResponse?.orders || [];

  // Mutations
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: number; status: string; notes?: string }) => {
      setLoadingOrderId(orderId); // Set loading state for specific order
      return await apiRequest(`/api/order-management/warehouse/${orderId}/process`, {
        method: 'PATCH',
        body: { status, notes }
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/order-management/warehouse'] });
      refetchOrders();
      toast({
        title: "وضعیت سفارش به‌روزرسانی شد",
        description: `سفارش با موفقیت ${data.data?.status === 'warehouse_processing' ? 'در حال پردازش' : data.data?.status === 'warehouse_approved' ? 'تایید شده - ارسال به لجستیک' : 'به‌روزرسانی شده'} تنظیم شد.`,
      });
      setShowOrderDetails(false);
      setLoadingOrderId(null); // Clear loading state
    },
    onError: (error: any) => {
      toast({
        title: "خطا در به‌روزرسانی",
        description: error.message || "خطایی در به‌روزرسانی وضعیت سفارش رخ داد.",
        variant: "destructive",
      });
      setLoadingOrderId(null); // Clear loading state on error
    },
  });

  // Filter orders based on search and status
  const filteredOrders = orders?.filter((order: Order) => {
    // Build customer name from API response structure
    const customerName = order.customer?.firstName && order.customer?.lastName 
      ? `${order.customer.firstName} ${order.customer.lastName}` 
      : order.customerFirstName && order.customerLastName 
        ? `${order.customerFirstName} ${order.customerLastName}`
        : order.customerName || '';
    
    const customerEmail = order.customer?.email || order.customerEmail || '';
    const customerPhone = order.customer?.phone || order.customerPhone || '';
    
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toString().includes(searchTerm) ||
                         order.customerOrderId?.toString().includes(searchTerm);
    
    // Use currentStatus from API instead of status
    const orderStatus = order.currentStatus || order.status || '';
    const matchesStatus = selectedStatus === 'all' || orderStatus === selectedStatus;
    
    // Header filters
    const matchesOrderId = orderIdFilter === '' || order.id.toString().includes(orderIdFilter);
    const matchesCustomerName = customerNameFilter === '' || customerName.toLowerCase().includes(customerNameFilter.toLowerCase());
    const matchesPhone = phoneFilter === '' || customerPhone.includes(phoneFilter);
    const matchesEmail = emailFilter === '' || customerEmail.toLowerCase().includes(emailFilter.toLowerCase());
    const matchesStatusFilter = statusFilter === '' || orderStatus.includes(statusFilter);
    const matchesAmount = amountFilter === '' || parseFloat(order.totalAmount || '0').toString().includes(amountFilter);
    
    return matchesSearch && matchesStatus && matchesOrderId && matchesCustomerName && matchesPhone && matchesEmail && matchesStatusFilter && matchesAmount;
  }) || [];

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'warehouse_pending': 'bg-yellow-100 text-yellow-800',
      'financial_approved': 'bg-green-100 text-green-800',
      'warehouse_notified': 'bg-blue-100 text-blue-800',
      'warehouse_processing': 'bg-orange-100 text-orange-800',
      'warehouse_approved': 'bg-green-100 text-green-800',
      'warehouse_rejected': 'bg-red-100 text-red-800'
    };
    
    const statusLabels = {
      'warehouse_pending': 'در انتظار انبار',
      'financial_approved': 'تایید مالی',
      'warehouse_notified': 'اطلاع رسانی انبار',
      'warehouse_processing': 'در حال پردازش',
      'warehouse_approved': 'تایید شده',
      'warehouse_rejected': 'رد شده'
    };
    
    return (
      <Badge className={`${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const handleOrderAction = (orderId: number, status: string) => {
    updateOrderMutation.mutate({
      orderId,
      status,
      notes: warehouseNotes
    });
    setWarehouseNotes('');
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder || !warehouseNotes.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً یادداشت را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setSavingNotes(true);
    try {
      await updateOrderMutation.mutateAsync({
        orderId: selectedOrder.id,
        status: selectedOrder.currentStatus, // Keep current status
        notes: warehouseNotes
      });
      
      toast({
        title: "یادداشت ذخیره شد",
        description: "یادداشت انبار با موفقیت ذخیره شد",
      });
    } catch (error) {
      toast({
        title: "خطا در ذخیره",
        description: "خطایی در ذخیره یادداشت رخ داد",
        variant: "destructive",
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const clearAllFilters = () => {
    setOrderIdFilter('');
    setCustomerNameFilter('');
    setPhoneFilter('');
    setEmailFilter('');
    setAmountFilter('');
    setStatusFilter('');
  };

  // Fetch complete order details with items
  const fetchOrderDetails = async (customerOrderId: number) => {
    setLoadingOrderDetails(true);
    try {
      const response = await apiRequest(`/api/order-management/warehouse/${customerOrderId}/details`, {
        method: 'GET'
      });
      setOrderDetails(response.order);
      console.log('Order details fetched:', response.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "خطا در بارگیری جزئیات سفارش",
        description: "خطایی در بارگیری جزئیات سفارش رخ داد.",
        variant: "destructive",
      });
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              مدیریت انبار
            </h1>
          </div>
          <p className="text-gray-600">
            مدیریت سفارشات، موجودی، و عملیات انبار
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-6">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              سفارشات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="جستجوی سفارش، مشتری، یا ایمیل..."
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
                <option value="warehouse_pending">در انتظار انبار</option>
                <option value="financial_approved">تایید مالی</option>
                <option value="warehouse_notified">اطلاع رسانی انبار</option>
                <option value="warehouse_processing">در حال پردازش</option>
                <option value="warehouse_approved">تایید شده</option>
                <option value="warehouse_rejected">رد شده</option>
              </select>
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                پاک کردن همه فیلترها
              </Button>
            </div>

            {/* Orders Table */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      سفارشات تایید شده توسط واحد مالی
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2 mr-11">
                      سفارشات آماده برای پردازش انبار و ارسال به بخش لجستیک
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {filteredOrders.length} سفارش
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetchOrders()}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      به‌روزرسانی
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">در حال بارگیری سفارشات...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Package className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ سفارشی یافت نشد</h3>
                    <p>در حال حاضر هیچ سفارش تایید شده‌ای در انتظار پردازش انبار نیست</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-right p-4 font-semibold text-gray-700" style={{ width: '120px' }}>شماره سفارش</th>
                          <th className="text-right p-4 font-semibold text-gray-700" style={{ width: '250px' }}>اطلاعات مشتری</th>
                          <th className="text-right p-4 font-semibold text-gray-700" style={{ width: '140px' }}>وزن محموله</th>
                          <th className="text-right p-4 font-semibold text-gray-700" style={{ width: '120px' }}>مبلغ کل</th>
                          <th className="text-right p-4 font-semibold text-gray-700" style={{ width: '120px' }}>وضعیت</th>
                          <th className="text-right p-4 font-semibold text-gray-700" style={{ width: '140px' }}>تاریخ پردازش</th>
                          <th className="text-center p-4 font-semibold text-gray-700" style={{ width: '200px' }}>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order: Order) => (
                          <tr key={order.id} className="border-b hover:bg-blue-50 transition-colors">
                            <td className="p-4" style={{ width: '120px' }}>
                              <div className="font-bold text-blue-600 truncate">{order.orderNumber || `#${order.id}`}</div>
                            </td>
                            <td className="p-4" style={{ width: '250px' }}>
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900 truncate">{
                                  order.customer?.firstName && order.customer?.lastName 
                                    ? `${order.customer.firstName} ${order.customer.lastName}` 
                                    : order.customerFirstName && order.customerLastName 
                                      ? `${order.customerFirstName} ${order.customerLastName}`
                                      : order.customerName || 'نامشخص'
                                }</div>
                                <div className="text-sm text-gray-600 truncate">
                                  📱 {order.customer?.phone || order.customerPhone || 'شماره نامشخص'}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  📧 {order.customer?.email || order.customerEmail || 'ایمیل نامشخص'}
                                </div>
                              </div>
                            </td>
                            <td className="p-4" style={{ width: '140px' }}>
                              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1">
                                <Weight className="w-3 h-3" />
                                {order.totalWeight ? `${parseFloat(order.totalWeight).toFixed(1)} kg` : 'محاسبه...'}
                              </div>
                            </td>
                            <td className="p-4" style={{ width: '120px' }}>
                              <div className="font-semibold text-green-600 text-sm truncate">
                                {formatCurrency(parseFloat(order.totalAmount) || 0)}
                              </div>
                            </td>
                            <td className="p-4" style={{ width: '120px' }}>{getStatusBadge(order.currentStatus || order.status)}</td>
                            <td className="p-4" style={{ width: '140px' }}>
                              <div className="text-sm text-gray-600 truncate">
                                {order.warehouseProcessedAt ? new Date(order.warehouseProcessedAt).toLocaleDateString('fa-IR') : 'پردازش نشده'}
                              </div>
                            </td>
                            <td className="p-4 text-center" style={{ width: '200px' }}>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setWarehouseNotes(order.warehouseNotes || ''); // Load existing notes
                                    setShowOrderDetails(true);
                                    // Fetch complete order details
                                    fetchOrderDetails(order.customerOrderId);
                                  }}
                                  className="text-xs"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  جزئیات
                                </Button>
                                {(order.currentStatus === 'financial_approved' || order.currentStatus === 'warehouse_pending') && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleOrderAction(order.id, 'warehouse_processing')}
                                    disabled={loadingOrderId === order.id}
                                    className="bg-orange-500 hover:bg-orange-600 text-xs"
                                  >
                                    <Package className="w-4 h-4 mr-1" />
                                    {loadingOrderId === order.id ? 'در حال پردازش...' : 'شروع پردازش'}
                                  </Button>
                                )}
                                {order.currentStatus === 'warehouse_processing' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleOrderAction(order.id, 'warehouse_approved')}
                                    disabled={loadingOrderId === order.id}
                                    className="bg-green-500 hover:bg-green-600 text-xs"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {loadingOrderId === order.id ? 'در حال تایید...' : 'تایید نهایی'}
                                  </Button>
                                )}
                                {order.currentStatus === 'warehouse_approved' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleOrderAction(order.id, 'logistics_dispatched')}
                                    disabled={loadingOrderId === order.id}
                                    className="bg-blue-500 hover:bg-blue-600 text-xs"
                                  >
                                    <Truck className="w-4 h-4 mr-1" />
                                    {loadingOrderId === order.id ? 'در حال ارسال...' : 'ارسال به لجستیک'}
                                  </Button>
                                )}
                              </div>
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

        {/* Order Details Dialog */}
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>جزئیات سفارش {selectedOrder?.orderNumber || `#${selectedOrder?.customerOrderId}`}</DialogTitle>
            </DialogHeader>
            {loadingOrderDetails ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">در حال بارگیری جزئیات سفارش...</p>
              </div>
            ) : orderDetails ? (
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">اطلاعات مشتری</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">نام مشتری</Label>
                      <p className="text-sm mt-1 font-medium">{
                        orderDetails.customer?.firstName && orderDetails.customer?.lastName 
                          ? `${orderDetails.customer.firstName} ${orderDetails.customer.lastName}` 
                          : 'نامشخص'
                      }</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">شماره موبایل</Label>
                      <p className="text-sm mt-1 font-medium">{orderDetails.customer?.phone || 'شماره نامشخص'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">ایمیل</Label>
                      <p className="text-sm mt-1 font-medium">{orderDetails.customer?.email || 'ایمیل نامشخص'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">مبلغ کل</Label>
                      <p className="text-sm mt-1 font-medium text-green-600">{formatCurrency(parseFloat(orderDetails.totalAmount) || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">خلاصه سفارش</h3>
                  <div className="grid grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
                    <div className="text-center">
                      <Label className="text-sm font-medium text-gray-700">تعداد آیتم‌ها</Label>
                      <p className="text-2xl font-bold text-blue-600">{orderDetails.totalItems}</p>
                    </div>
                    <div className="text-center">
                      <Label className="text-sm font-medium text-gray-700">مجموع وزن ناخالص</Label>
                      <p className="text-2xl font-bold text-blue-600">{orderDetails.totalWeight ? `${parseFloat(orderDetails.totalWeight).toFixed(1)} kg` : 'محاسبه نشده'}</p>
                    </div>
                    <div className="text-center">
                      <Label className="text-sm font-medium text-gray-700">تاریخ سفارش</Label>
                      <p className="text-sm font-medium text-gray-900">{new Date(orderDetails.orderDate).toLocaleDateString('fa-IR')}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">آیتم‌های سفارش</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-right p-3 text-sm font-medium text-gray-700" style={{ width: '35%' }}>نام محصول</th>
                          <th className="text-right p-3 text-sm font-medium text-gray-700" style={{ width: '20%' }}>کد محصول</th>
                          <th className="text-center p-3 text-sm font-medium text-gray-700" style={{ width: '15%' }}>تعداد</th>
                          <th className="text-right p-3 text-sm font-medium text-gray-700" style={{ width: '15%' }}>قیمت واحد</th>
                          <th className="text-right p-3 text-sm font-medium text-gray-700" style={{ width: '15%' }}>قیمت کل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderDetails.items?.map((item: any, index: number) => (
                          <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="p-3 text-sm truncate" style={{ width: '35%' }} title={item.productName}>{item.productName}</td>
                            <td className="p-3 text-sm font-mono text-gray-600 truncate" style={{ width: '20%' }} title={item.productSku}>{item.productSku}</td>
                            <td className="p-3 text-sm text-center font-medium" style={{ width: '15%' }}>{item.quantity}</td>
                            <td className="p-3 text-sm truncate" style={{ width: '15%' }}>{formatCurrency(parseFloat(item.unitPrice) || 0)}</td>
                            <td className="p-3 text-sm font-medium truncate" style={{ width: '15%' }}>{formatCurrency(parseFloat(item.totalPrice) || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Status */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">وضعیت سفارش</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`p-3 rounded-lg border ${orderDetails.financialApproved ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        {orderDetails.financialApproved ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${orderDetails.financialApproved ? 'text-green-800' : 'text-gray-600'}`}>
                          تایید مالی
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${orderDetails.warehouseProcessed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        {orderDetails.warehouseProcessed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${orderDetails.warehouseProcessed ? 'text-green-800' : 'text-gray-600'}`}>
                          پردازش انبار
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${orderDetails.logisticsProcessed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        {orderDetails.logisticsProcessed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${orderDetails.logisticsProcessed ? 'text-green-800' : 'text-gray-600'}`}>
                          پردازش لجستیک
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Notes */}
                <div>
                  <Label htmlFor="warehouseNotes">یادداشت انبار</Label>
                  <Textarea
                    id="warehouseNotes"
                    value={warehouseNotes}
                    onChange={(e) => setWarehouseNotes(e.target.value)}
                    placeholder="یادداشت برای این سفارش..."
                    className="mt-2"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {savingNotes ? 'در حال ذخیره...' : 'ثبت یادداشت'}
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowOrderDetails(false)}
                  >
                    انصراف
                  </Button>
                  {selectedOrder?.currentStatus === 'warehouse_approved' && (
                    <Button
                      onClick={() => handleOrderAction(selectedOrder.id, 'logistics_dispatched')}
                      disabled={loadingOrderId === selectedOrder.id}
                    >
                      <Truck className="w-4 h-4 mr-1" />
                      {loadingOrderId === selectedOrder.id ? 'در حال ارسال...' : 'ارسال به لجستیک'}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">خطا در بارگیری جزئیات سفارش</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WarehouseManagementFixed;
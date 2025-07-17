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
  const [activeTab, setActiveTab] = useState("orders");
  
  // Header filter states
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState('');
  
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
    },
    onError: (error: any) => {
      toast({
        title: "خطا در به‌روزرسانی",
        description: error.message || "خطایی در به‌روزرسانی وضعیت سفارش رخ داد.",
        variant: "destructive",
      });
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

  const clearAllFilters = () => {
    setOrderIdFilter('');
    setCustomerNameFilter('');
    setPhoneFilter('');
    setEmailFilter('');
    setAmountFilter('');
    setStatusFilter('');
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  سفارشات تایید شده توسط واحد مالی
                </CardTitle>
                <p className="text-sm text-gray-600">
                  سفارشات آماده برای پردازش انبار و ارسال به بخش لجستیک
                </p>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">در حال بارگیری...</div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>هیچ سفارش تایید شده‌ای در انتظار پردازش انبار نیست</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-4">شماره سفارش</th>
                          <th className="text-right p-4">نام مشتری</th>
                          <th className="text-right p-4">شماره موبایل</th>
                          <th className="text-right p-4">ایمیل</th>
                          <th className="text-right p-4">وزن محموله</th>
                          <th className="text-right p-4">مبلغ</th>
                          <th className="text-right p-4">وضعیت</th>
                          <th className="text-right p-4">تاریخ پردازش در انبار</th>
                          <th className="text-right p-4">تاریخ ایجاد</th>
                          <th className="text-center p-4">عملیات</th>
                        </tr>
                        <tr className="border-b bg-gray-50">
                          <th className="text-right p-2">
                            <Input
                              placeholder="شماره"
                              value={orderIdFilter}
                              onChange={(e) => setOrderIdFilter(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </th>
                          <th className="text-right p-2">
                            <Input
                              placeholder="نام مشتری"
                              value={customerNameFilter}
                              onChange={(e) => setCustomerNameFilter(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </th>
                          <th className="text-right p-2">
                            <Input
                              placeholder="شماره موبایل"
                              value={phoneFilter}
                              onChange={(e) => setPhoneFilter(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </th>
                          <th className="text-right p-2">
                            <Input
                              placeholder="ایمیل"
                              value={emailFilter}
                              onChange={(e) => setEmailFilter(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </th>
                          <th className="text-right p-2">
                            <div className="h-8 flex items-center text-gray-400 text-xs">
                              محاسبه شده
                            </div>
                          </th>
                          <th className="text-right p-2">
                            <Input
                              placeholder="مبلغ"
                              value={amountFilter}
                              onChange={(e) => setAmountFilter(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </th>
                          <th className="text-right p-2">
                            <Input
                              placeholder="وضعیت"
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </th>
                          <th className="text-right p-2">
                            <div className="h-8 flex items-center text-gray-400 text-xs">
                              تاریخ
                            </div>
                          </th>
                          <th className="text-right p-2">
                            <div className="h-8 flex items-center text-gray-400 text-xs">
                              تاریخ
                            </div>
                          </th>
                          <th className="text-center p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearAllFilters}
                              className="h-8 text-xs"
                            >
                              پاک کردن
                            </Button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order: Order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-medium">#{order.id}</td>
                            <td className="p-4">
                              <div className="font-medium">{
                                order.customer?.firstName && order.customer?.lastName 
                                  ? `${order.customer.firstName} ${order.customer.lastName}` 
                                  : order.customerFirstName && order.customerLastName 
                                    ? `${order.customerFirstName} ${order.customerLastName}`
                                    : order.customerName || 'نامشخص'
                              }</div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm">{
                                order.customer?.phone || order.customerPhone || 'شماره نامشخص'
                              }</div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm text-gray-600">{
                                order.customer?.email || order.customerEmail || 'ایمیل نامشخص'
                              }</div>
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-blue-600">
                                {order.totalWeight ? `${parseFloat(order.totalWeight).toFixed(1)} ${order.weightUnit || 'kg'}` : 'در حال محاسبه...'}
                              </div>
                            </td>
                            <td className="p-4">{formatCurrency(parseFloat(order.totalAmount) || 0)}</td>
                            <td className="p-4">{getStatusBadge(order.currentStatus || order.status)}</td>
                            <td className="p-4">
                              <div className="text-sm text-gray-600">
                                {order.warehouseProcessedAt ? new Date(order.warehouseProcessedAt).toLocaleDateString('fa-IR') : 'پردازش نشده'}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowOrderDetails(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  جزئیات
                                </Button>
                                {order.currentStatus === 'warehouse_approved' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleOrderAction(order.id, 'logistics_dispatched')}
                                    disabled={updateOrderMutation.isPending}
                                  >
                                    <Truck className="w-4 h-4 mr-1" />
                                    ارسال به لجستیک
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>جزئیات سفارش #{selectedOrder?.id}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="font-semibold mb-3">اطلاعات مشتری</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>نام مشتری</Label>
                      <p className="text-sm mt-1">{
                        selectedOrder.customer?.firstName && selectedOrder.customer?.lastName 
                          ? `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}` 
                          : selectedOrder.customerFirstName && selectedOrder.customerLastName 
                            ? `${selectedOrder.customerFirstName} ${selectedOrder.customerLastName}`
                            : selectedOrder.customerName || 'نامشخص'
                      }</p>
                    </div>
                    <div>
                      <Label>شماره موبایل</Label>
                      <p className="text-sm mt-1">{selectedOrder.customer?.phone || selectedOrder.customerPhone || 'شماره نامشخص'}</p>
                    </div>
                    <div>
                      <Label>ایمیل</Label>
                      <p className="text-sm mt-1">{selectedOrder.customer?.email || selectedOrder.customerEmail || 'ایمیل نامشخص'}</p>
                    </div>
                    <div>
                      <Label>مبلغ کل</Label>
                      <p className="text-sm mt-1">{formatCurrency(parseFloat(selectedOrder.totalAmount) || 0)}</p>
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
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowOrderDetails(false)}
                  >
                    انصراف
                  </Button>
                  {selectedOrder.currentStatus === 'warehouse_approved' && (
                    <Button
                      onClick={() => handleOrderAction(selectedOrder.id, 'logistics_dispatched')}
                      disabled={updateOrderMutation.isPending}
                    >
                      <Truck className="w-4 h-4 mr-1" />
                      ارسال به لجستیک
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WarehouseManagementFixed;
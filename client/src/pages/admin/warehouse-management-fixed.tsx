import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Truck, 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  ArrowRight,
  Box,
  Warehouse,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  RefreshCw,
  XCircle,
  Mail,
  Bell,
  Activity,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Save,
  Printer,
  ArrowDownUp
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { apiRequest } from '@/lib/queryClient';

interface WarehouseBatch {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  batchNumber: string;
  batchType: string;
  quantity: number;
  unitPrice?: number;
  totalValue?: number;
  location?: string;
  expiryDate?: string;
  receivedDate: string;
  qualityStatus: string;
  isNonChemical?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface WarehouseOrder {
  id: number;
  customerOrderId: number;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  currentStatus: string;
  createdAt: string;
  financialReviewedAt?: string;
  financialNotes?: string;
  warehouseNotes?: string;
  items?: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface WarehouseStats {
  pendingOrders: number;
  processingOrders: number;
  fulfilledOrders: number;
  totalRevenue: number;
  averageProcessingTime: number;
  lowStockItems: number;
}

export default function WarehouseManagementFixed() {
  // All hooks at the top level
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State hooks
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState<WarehouseOrder | null>(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [warehouseNotes, setWarehouseNotes] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<WarehouseBatch | null>(null);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [newBatch, setNewBatch] = useState({
    productId: 0,
    batchNumber: '',
    batchType: 'production',
    quantity: 0,
    unitPrice: 0,
    location: '',
    expiryDate: '',
    qualityStatus: 'pending',
    isNonChemical: false,
    notes: ''
  });

  // Queries
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['/api/order-management/warehouse'],
    staleTime: 30000
  });

  const orders = Array.isArray(ordersData?.orders) ? ordersData.orders : 
                Array.isArray(ordersData) ? ordersData : [];

  const { data: warehouseInventoryData, isLoading: inventoryLoading, refetch: refetchInventory } = useQuery({
    queryKey: ['/api/warehouse/inventory'],
    staleTime: 30000
  });

  const warehouseInventory = Array.isArray(warehouseInventoryData?.data) ? warehouseInventoryData.data : 
                            Array.isArray(warehouseInventoryData) ? warehouseInventoryData : [];

  const { data: statsData } = useQuery({
    queryKey: ['/api/warehouse/stats'],
    staleTime: 60000
  });

  const stats = statsData?.data || {
    pendingOrders: 0,
    processingOrders: 0,
    fulfilledOrders: 0,
    totalRevenue: 0,
    averageProcessingTime: 0,
    lowStockItems: 0
  };

  // Mutations
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: number; status: string; notes?: string }) => {
      return apiRequest(`/api/order-management/warehouse/${orderId}/status`, {
        method: 'PATCH',
        body: { status, warehouseNotes: notes }
      });
    },
    onSuccess: () => {
      toast({ title: "موفقیت", description: "وضعیت سفارش بروزرسانی شد" });
      refetchOrders();
      setShowOrderDialog(false);
    },
    onError: () => {
      toast({ title: "خطا", description: "بروزرسانی وضعیت ناموفق بود", variant: "destructive" });
    }
  });

  const syncQuantitiesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/warehouse/sync-quantities', {
        method: 'POST',
        body: {}
      });
    },
    onSuccess: (data) => {
      toast({ 
        title: "همگام‌سازی موفق", 
        description: data.message || "موجودی با موفقیت همگام‌سازی شد" 
      });
      refetchInventory();
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop-products'] });
    },
    onError: () => {
      toast({ 
        title: "خطا در همگام‌سازی", 
        description: "همگام‌سازی موجودی ناموفق بود", 
        variant: "destructive" 
      });
    }
  });

  // Notification hook
  useOrderNotifications('warehouse');

  // Filter orders based on status and search
  const filteredOrders = (orders || []).filter((order: WarehouseOrder) => {
    const matchesFilter = orderFilter === 'all' || order.currentStatus === orderFilter;
    const matchesSearch = !searchTerm || 
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerOrderId?.toString().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'warehouse_pending':
      case 'financial_approved':
        return 'default';
      case 'warehouse_processing':
        return 'secondary';
      case 'warehouse_approved':
        return 'default';
      case 'warehouse_rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Handle order approval
  const handleApproveOrder = () => {
    if (selectedOrder) {
      updateOrderStatusMutation.mutate({
        orderId: selectedOrder.id,
        status: 'warehouse_approved',
        notes: warehouseNotes
      });
    }
  };

  // Handle order rejection
  const handleRejectOrder = () => {
    if (selectedOrder) {
      updateOrderStatusMutation.mutate({
        orderId: selectedOrder.id,
        status: 'warehouse_rejected',
        notes: warehouseNotes
      });
    }
  };

  // Handle sync quantities
  const handleSyncQuantities = () => {
    syncQuantitiesMutation.mutate();
  };

  // Group inventory by product
  const groupedInventory = React.useMemo(() => {
    if (!Array.isArray(warehouseInventory)) {
      return {};
    }
    
    return warehouseInventory.reduce((acc: any, batch: WarehouseBatch) => {
      const key = batch.productId;
      if (!acc[key]) {
        acc[key] = {
          productId: batch.productId,
          productName: batch.productName,
          productSku: batch.productSku,
          batches: [],
          totalQuantity: 0
        };
      }
      acc[key].batches.push(batch);
      acc[key].totalQuantity += batch.quantity;
      return acc;
    }, {});
  }, [warehouseInventory]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">مدیریت انبار</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            مدیریت سفارشات، موجودی و گزارشات انبار
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSyncQuantities}
            disabled={syncQuantitiesMutation.isPending}
            variant="outline"
            size="sm"
          >
            {syncQuantitiesMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowDownUp className="h-4 w-4 mr-2" />
            )}
            همگام‌سازی موجودی
          </Button>
          <Button onClick={() => refetchOrders()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card key="pending-orders">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">در انتظار</p>
                <p className="text-2xl font-bold">{stats?.pendingOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card key="processing-orders">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Package className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">در حال پردازش</p>
                <p className="text-2xl font-bold">{stats?.processingOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card key="fulfilled-orders">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">تکمیل شده</p>
                <p className="text-2xl font-bold">{stats?.fulfilledOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card key="total-revenue">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">کل فروش</p>
                <p className="text-2xl font-bold">{stats?.totalRevenue?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card key="low-stock">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">موجودی کم</p>
                <p className="text-2xl font-bold">{stats?.lowStockItems || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card key="total-products">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Warehouse className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">محصولات</p>
                <p className="text-2xl font-bold">{Object.keys(groupedInventory).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="orders">سفارشات</TabsTrigger>
          <TabsTrigger value="inventory">موجودی</TabsTrigger>
          <TabsTrigger value="transit">کالای در حال حمل</TabsTrigger>
          <TabsTrigger value="reports">گزارشات</TabsTrigger>
          <TabsTrigger value="statistics">آمار</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card key="orders-tab">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>سفارشات انبار</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="جستجو..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="warehouse_pending">در انتظار انبار</option>
                    <option value="financial_approved">تایید مالی</option>
                    <option value="warehouse_processing">در حال پردازش</option>
                    <option value="warehouse_approved">تایید شده</option>
                    <option value="warehouse_rejected">رد شده</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8">در حال بارگیری...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">سفارشی یافت نشد</div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order: WarehouseOrder) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">سفارش #{order.customerOrderId}</span>
                            <Badge variant={getStatusBadgeVariant(order.currentStatus)}>
                              {order.currentStatus === 'warehouse_pending' && 'در انتظار انبار'}
                              {order.currentStatus === 'financial_approved' && 'تایید مالی'}
                              {order.currentStatus === 'warehouse_processing' && 'در حال پردازش'}
                              {order.currentStatus === 'warehouse_approved' && 'تایید شده'}
                              {order.currentStatus === 'warehouse_rejected' && 'رد شده'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            مشتری: {order.customerName || order.customerEmail}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            مبلغ: {parseFloat(order.totalAmount).toLocaleString()} دینار
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            تاریخ: {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedOrder(order);
                            setWarehouseNotes(order.warehouseNotes || '');
                            setShowOrderDialog(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          بررسی
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card key="inventory-tab">
            <CardHeader>
              <CardTitle>موجودی انبار (فرمت Excel مطابق درخواست)</CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="text-center py-8">در حال بارگیری...</div>
              ) : Object.keys(groupedInventory).length === 0 ? (
                <div className="text-center py-8 text-gray-500">موجودی یافت نشد</div>
              ) : (
                <div className="space-y-6">
                  {Object.values(groupedInventory).map((group: any, index: number) => (
                    <Card key={group.productId} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">{group.productName}</h3>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                شماره ردیف: {index + 1}
                              </Badge>
                              <span className="text-sm text-gray-600 dark:text-gray-400">SKU: {group.productSku}</span>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                              {group.totalQuantity}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">کل موجودی</div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        {/* Excel Format Summary */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-600">
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-blue-600 dark:text-blue-400">شماره ردیف</div>
                              <div className="text-lg font-bold">{index + 1}</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-green-600 dark:text-green-400">کالای درباره موجودی</div>
                              <div className="text-lg font-bold">{group.totalQuantity}</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-orange-600 dark:text-orange-400">کالای درباره ضایعات</div>
                              <div className="text-lg font-bold">0</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-red-600 dark:text-red-400">موجودی کل ضایعات</div>
                              <div className="text-lg font-bold">0</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-purple-600 dark:text-purple-400">آستانه کم</div>
                              <div className="text-lg font-bold">{group.totalQuantity + 2}</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-emerald-600 dark:text-emerald-400">وضعیت</div>
                              <div className="text-sm font-medium">در انبار</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-indigo-600 dark:text-indigo-400">شماره دسته</div>
                              <div className="text-lg font-bold">{group.batches.length}</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-red-600 dark:text-red-400">آستانه بحرانی</div>
                              <div className="text-lg font-bold">5</div>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Batch Information */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200 border-b pb-2">
                            جزئیات دسته‌ها ({group.batches.length} دسته)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.batches.map((batch: WarehouseBatch, batchIndex: number) => (
                              <div key={batch.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border-l-4 border-blue-400">
                                <div className="flex justify-between items-start mb-2">
                                  <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {batch.batchNumber}
                                  </Badge>
                                  <div className="text-right">
                                    <div className="font-bold text-lg text-green-600 dark:text-green-400">
                                      {batch.quantity}
                                    </div>
                                    <div className="text-xs text-gray-500">واحد</div>
                                  </div>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">نوع:</span>
                                    <span className="font-medium">{batch.batchType}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">وضعیت:</span>
                                    <Badge variant="outline" className="text-xs">
                                      {batch.qualityStatus}
                                    </Badge>
                                  </div>
                                  {batch.location && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">مکان:</span>
                                      <span className="font-medium">{batch.location}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">تاریخ:</span>
                                    <span className="font-medium">
                                      {new Date(batch.receivedDate).toLocaleDateString('fa-IR')}
                                    </span>
                                  </div>
                                  {batch.unitPrice && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">قیمت واحد:</span>
                                      <span className="font-medium text-green-600">
                                        {batch.unitPrice.toLocaleString()} دینار
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Total Summary Row (Excel Style) */}
                        <div className="mt-4 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                          <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg p-3">
                            <div className="grid grid-cols-8 gap-4 text-sm font-bold text-center">
                              <div>Total</div>
                              <div className="text-green-600">{group.totalQuantity}</div>
                              <div>0</div>
                              <div>0</div>
                              <div className="text-purple-600">{group.totalQuantity + 2}</div>
                              <div className="text-emerald-600">در انبار</div>
                              <div className="text-indigo-600">{group.batches.length}</div>
                              <div className="text-red-600">5</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs with placeholder content */}
        <TabsContent value="transit">
          <Card key="transit-tab">
            <CardHeader>
              <CardTitle>کالای در حال حمل</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">در دست توسعه...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card key="reports-tab">
            <CardHeader>
              <CardTitle>گزارشات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">در دست توسعه...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <Card key="statistics-tab">
            <CardHeader>
              <CardTitle>آمار</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">در دست توسعه...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Detail Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>جزئیات سفارش #{selectedOrder?.customerOrderId}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>مشتری</Label>
                  <p>{selectedOrder.customerName || selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <Label>مبلغ کل</Label>
                  <p>{parseFloat(selectedOrder.totalAmount).toLocaleString()} دینار</p>
                </div>
                <div>
                  <Label>وضعیت فعلی</Label>
                  <Badge variant={getStatusBadgeVariant(selectedOrder.currentStatus)}>
                    {selectedOrder.currentStatus}
                  </Badge>
                </div>
                <div>
                  <Label>تاریخ ایجاد</Label>
                  <p>{new Date(selectedOrder.createdAt).toLocaleDateString('fa-IR')}</p>
                </div>
              </div>

              {selectedOrder.financialNotes && (
                <div>
                  <Label>یادداشت بخش مالی</Label>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {selectedOrder.financialNotes}
                  </p>
                </div>
              )}

              <div>
                <Label>یادداشت انبار</Label>
                <Textarea
                  value={warehouseNotes}
                  onChange={(e) => setWarehouseNotes(e.target.value)}
                  placeholder="یادداشت خود را وارد کنید..."
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleApproveOrder}
                  disabled={updateOrderStatusMutation.isPending}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  تایید سفارش
                </Button>
                <Button
                  onClick={handleRejectOrder}
                  disabled={updateOrderStatusMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  رد سفارش
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
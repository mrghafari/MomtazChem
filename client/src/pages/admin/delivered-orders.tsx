import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Truck, Package, Search, Calendar, User, Phone, MapPin, Banknote, FileText, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Order {
  id: number;
  customerOrderId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  orderTotal: number;
  currentStatus: string;
  deliveryCode?: string;
  trackingNumber?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  logisticsProcessedAt?: string;
  orderDate: string;
  orderItems: Array<{
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export default function DeliveredOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/delivered/orders'],
    queryFn: () => fetch('/api/delivered/orders', { credentials: 'include' }).then(res => res.json())
  });

  // Auto-refresh controlled by global settings
  useEffect(() => {
    if (orders && orders.length >= 0) {
      const checkRefreshSettings = () => {
        const globalSettings = localStorage.getItem('global-refresh-settings');
        if (globalSettings) {
          const settings = JSON.parse(globalSettings);
          const logisticsSettings = settings.departments.logistics;
          
          if (logisticsSettings.autoRefresh) {
            const refreshInterval = settings.syncEnabled 
              ? settings.globalInterval 
              : logisticsSettings.interval;
            
            return refreshInterval * 1000;
          }
        }
        return 600000; // Default 10 minutes
      };

      const intervalMs = checkRefreshSettings();
      const interval = setInterval(() => {
        const currentSettings = localStorage.getItem('global-refresh-settings');
        if (currentSettings) {
          const settings = JSON.parse(currentSettings);
          if (settings.departments.logistics.autoRefresh) {
            refetch();
          }
        }
      }, intervalMs);

      return () => clearInterval(interval);
    }
  }, [orders, refetch]);

  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerOrderId.toString().includes(searchTerm) ||
      order.customerPhone.includes(searchTerm) ||
      (order.deliveryCode && order.deliveryCode.includes(searchTerm)) ||
      (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || order.currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOrderDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">تحویل داده شده</Badge>;
      case 'logistics_dispatched':
        return <Badge className="bg-purple-100 text-purple-800">ارسال شده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalDelivered = filteredOrders.filter((order: Order) => order.currentStatus === 'delivered').length;
  const totalDispatched = filteredOrders.filter((order: Order) => order.currentStatus === 'logistics_dispatched').length;
  const totalRevenue = filteredOrders.reduce((sum: number, order: Order) => sum + order.orderTotal, 0);
  const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری سفارشات ارسال شده...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 min-h-screen" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Truck className="h-8 w-8 text-purple-600" />
          سفارشات ارسال شده
        </h1>
        <p className="text-gray-600">مدیریت سفارشات ارسال شده و تحویل داده شده</p>
      </div>

      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">کل سفارشات</p>
                <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ارسال شده</p>
                <p className="text-2xl font-bold text-purple-600">{totalDispatched}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">تحویل شده</p>
                <p className="text-2xl font-bold text-green-600">{totalDelivered}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">درآمد کل</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <Banknote className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فیلترها */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">جستجو و فیلتر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="جستجو بر اساس نام، شماره سفارش، تلفن، کد تحویل یا کد پیگیری..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="فیلتر بر اساس وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="logistics_dispatched">ارسال شده</SelectItem>
                <SelectItem value="delivered">تحویل داده شده</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* لیست سفارشات */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">سفارشات ارسال شده ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">هیچ سفارش ارسال شده‌ای یافت نشد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order: Order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">#{order.customerOrderId}</span>
                      {getStatusBadge(order.currentStatus)}
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOrderDetails(order)}
                          >
                            <FileText className="h-4 w-4 ml-1" />
                            جزئیات
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
                          <DialogHeader>
                            <DialogTitle className="text-xl">
                              جزئیات سفارش #{selectedOrder?.customerOrderId}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-6">
                              {/* اطلاعات مشتری */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">نام مشتری:</span>
                                    <span>{selectedOrder.customerName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">تلفن:</span>
                                    <span>{selectedOrder.customerPhone}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">آدرس:</span>
                                    <span className="text-sm">{selectedOrder.customerAddress}</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {selectedOrder.deliveryCode && (
                                    <div className="flex items-center gap-2">
                                      <Package className="h-4 w-4 text-gray-500" />
                                      <span className="font-medium">کد تحویل:</span>
                                      <Badge variant="outline">{selectedOrder.deliveryCode}</Badge>
                                    </div>
                                  )}
                                  {selectedOrder.trackingNumber && (
                                    <div className="flex items-center gap-2">
                                      <Truck className="h-4 w-4 text-gray-500" />
                                      <span className="font-medium">کد پیگیری:</span>
                                      <Badge variant="outline">{selectedOrder.trackingNumber}</Badge>
                                    </div>
                                  )}
                                  {selectedOrder.deliveryPersonName && (
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-gray-500" />
                                      <span className="font-medium">پیک:</span>
                                      <span>{selectedOrder.deliveryPersonName}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* اقلام سفارش */}
                              <div>
                                <h4 className="font-medium mb-3">اقلام سفارش:</h4>
                                <div className="border rounded-lg overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-2 text-right">محصول</th>
                                        <th className="px-4 py-2 text-right">SKU</th>
                                        <th className="px-4 py-2 text-right">تعداد</th>
                                        <th className="px-4 py-2 text-right">قیمت واحد</th>
                                        <th className="px-4 py-2 text-right">قیمت کل</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedOrder.orderItems.map((item, index) => (
                                        <tr key={index} className="border-t">
                                          <td className="px-4 py-2">{item.productName}</td>
                                          <td className="px-4 py-2">{item.productSku}</td>
                                          <td className="px-4 py-2">{item.quantity}</td>
                                          <td className="px-4 py-2">{formatCurrency(item.unitPrice)}</td>
                                          <td className="px-4 py-2 font-medium">{formatCurrency(item.totalPrice)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                      <tr>
                                        <td colSpan={4} className="px-4 py-2 text-right font-medium">مجموع کل:</td>
                                        <td className="px-4 py-2 font-bold text-lg">{formatCurrency(selectedOrder.orderTotal)}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">مشتری:</span>
                      <p className="font-medium">{order.customerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">مبلغ:</span>
                      <p className="font-medium text-green-600">{formatCurrency(order.orderTotal)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">تاریخ سفارش:</span>
                      <p className="font-medium">{new Date(order.orderDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">تاریخ ارسال:</span>
                      <p className="font-medium">
                        {order.logisticsProcessedAt 
                          ? new Date(order.logisticsProcessedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'نامشخص'
                        }
                      </p>
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
                          کد پیگیری: {order.trackingNumber}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
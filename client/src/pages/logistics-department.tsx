import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import DeliveryDetailsForm from "@/components/DeliveryDetailsForm";
import { 
  Truck, 
  Package, 
  User, 
  LogOut, 
  Eye, 
  Calendar,
  Phone,
  RefreshCw
} from "lucide-react";

interface LogisticsUser {
  id: number;
  username: string;
  email: string;
  department: string;
}

interface OrderManagement {
  id: number;
  customerOrderId: number;
  currentStatus: string;
  deliveryCode: string | null;
  totalAmount: string;
  currency: string;
  financialReviewerId: number | null;
  financialReviewedAt: string | null;
  financialNotes: string | null;
  warehouseAssigneeId: number | null;
  warehouseProcessedAt: string | null;
  warehouseNotes: string | null;
  logisticsAssigneeId: number | null;
  logisticsProcessedAt: string | null;
  logisticsNotes: string | null;
  trackingNumber: string | null;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  deliveryPersonName: string | null;
  deliveryPersonPhone: string | null;
  
  // Delivery method and transportation details
  deliveryMethod: string | null;
  transportationType: string | null;
  
  // Postal service details
  postalServiceName: string | null;
  postalTrackingCode: string | null;
  postalWeight: string | null;
  postalPrice: string | null;
  postalInsurance: boolean | null;
  
  // Vehicle details
  vehicleType: string | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  driverName: string | null;
  driverPhone: string | null;
  driverLicense: string | null;
  
  // Delivery company details
  deliveryCompanyName: string | null;
  deliveryCompanyPhone: string | null;
  deliveryCompanyAddress: string | null;
  
  createdAt: string;
  updatedAt: string;
  customer: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    deliveryMethod: string | null;
    deliveryNotes: string | null;
  } | null;
}

export default function LogisticsDepartment() {
  const [selectedOrder, setSelectedOrder] = useState<OrderManagement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [user, setUser] = useState<LogisticsUser | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();



  // Check authentication and user department
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/logistics/auth/me');
        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.user.department === 'logistics') {
            setUser(userData.user);
          } else {
            setLocation('/logistics/login');
          }
        } else {
          setLocation('/logistics/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setLocation('/logistics/login');
      }
    };

    checkAuth();
  }, [setLocation]);

  // Fetch logistics pending orders - only orders approved by warehouse
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ["/api/logistics/orders"],
    enabled: !!user,
    refetchInterval: 300000, // Auto-refresh every 5 minutes
  });

  const orders = ordersData?.orders || [];

  // Process order mutation
  const processOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/logistics/orders/${selectedOrder?.id}/process`, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          reviewerId: user?.id
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/orders"] });
      setDialogOpen(false);
      setSelectedOrder(null);
      toast({
        title: "موفق",
        description: "سفارش با موفقیت پردازش شد",
      });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در پردازش سفارش",
        variant: "destructive",
      });
    }
  });

  const handleProcessOrder = (data: any) => {
    if (!selectedOrder) return;
    
    processOrderMutation.mutate(data);
  };

  const logout = async () => {
    try {
      await fetch('/api/logistics/logout', { method: 'POST' });
      setLocation('/logistics/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'warehouse_approved':
        return <Badge className="bg-blue-100 text-blue-800">آماده ارسال</Badge>;
      case 'logistics_approved':
        return <Badge className="bg-green-100 text-green-800">تایید ارسال</Badge>;
      case 'logistics_rejected':
        return <Badge className="bg-red-100 text-red-800">رد ارسال</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">در حال بارگذاری...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Truck className="w-8 h-8 text-blue-600" />
              بخش لجستیک
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              مدیریت ارسال و تحویل سفارشات
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              بروزرسانی
            </Button>
            
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className="text-sm">{user.username}</span>
            </div>
            <Button 
              variant="outline" 
              onClick={logout}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              خروج
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">سفارشات آماده ارسال</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {orders.filter(o => o.currentStatus === 'warehouse_approved').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ارسال‌های تایید شده</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {orders.filter(o => o.currentStatus === 'logistics_approved').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل سفارشات</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {orders.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              سفارشات آماده ارسال
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">در حال بارگذاری...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                هیچ سفارشی برای پردازش وجود ندارد
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-semibold text-lg">
                            سفارش #{order.customerOrderId}
                          </h3>
                          {getStatusBadge(order.currentStatus)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">مشتری:</span>
                            <span className="font-medium">
                              {order.customer?.firstName && order.customer?.lastName 
                                ? `${order.customer.firstName} ${order.customer.lastName}`
                                : 'نام مشتری ناشناس'
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">تلفن:</span>
                            <span className="font-medium">
                              {order.customer?.phone || 'شماره تلفن ثبت نشده'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">تاریخ:</span>
                            <span className="font-medium">
                              {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">مبلغ:</span>
                            <span className="font-bold text-blue-600">
                              {typeof order.totalAmount === 'number' 
                                ? order.totalAmount.toLocaleString('fa-IR')
                                : order.totalAmount
                              } {order.currency || 'IQD'}
                            </span>
                          </div>
                        </div>
                        
                        {order.warehouseNotes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>یادداشت انبار:</strong> {order.warehouseNotes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => {
                          setSelectedOrder(order);
                          setDialogOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        پردازش ارسال
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Process Order Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>پردازش ارسال سفارش #{selectedOrder?.customerOrderId}</DialogTitle>
            </DialogHeader>
            
            {/* Order Summary */}
            {selectedOrder && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">مشتری:</span>
                    <span className="font-medium ml-2">
                      {selectedOrder.customer?.firstName && selectedOrder.customer?.lastName 
                        ? `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}`
                        : 'نام مشتری ناشناس'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">تلفن:</span>
                    <span className="font-medium ml-2">
                      {selectedOrder.customer?.phone || 'شماره تلفن ثبت نشده'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">تاریخ ثبت:</span>
                    <span className="font-medium ml-2">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  {selectedOrder.totalAmount && (
                    <div>
                      <span className="text-gray-600">مبلغ سفارش:</span>
                      <span className="font-bold text-blue-600 ml-2">
                        {typeof selectedOrder.totalAmount === 'number' 
                          ? selectedOrder.totalAmount.toLocaleString('fa-IR')
                          : selectedOrder.totalAmount
                        } {selectedOrder.currency || 'IQD'}
                      </span>
                    </div>
                  )}
                  
                  {/* Customer Selected Delivery Method */}
                  <div className="col-span-2 mt-4">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">روش ارسال انتخابی مشتری:</span>
                      <Badge variant="outline" className="mr-2">
                        {selectedOrder.customer?.deliveryMethod === 'post' && 'ارسال پستی'}
                        {selectedOrder.customer?.deliveryMethod === 'courier' && 'پیک موتوری'}
                        {selectedOrder.customer?.deliveryMethod === 'truck' && 'حمل با کامیون'}
                        {selectedOrder.customer?.deliveryMethod === 'personal_pickup' && 'تحویل حضوری'}
                        {!selectedOrder.customer?.deliveryMethod && 'تعریف نشده'}
                      </Badge>
                    </div>
                    {selectedOrder.customer?.deliveryNotes && (
                      <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>توضیحات ارسال مشتری:</strong> {selectedOrder.customer.deliveryNotes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {selectedOrder.warehouseNotes && (
                    <div className="col-span-2">
                      <span className="text-gray-600">یادداشت انبار:</span>
                      <p className="font-medium ml-2 text-blue-700">
                        {selectedOrder.warehouseNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <DeliveryDetailsForm
              customerDeliveryMethod={selectedOrder.customer?.deliveryMethod || 'courier'}
              onSubmit={handleProcessOrder}
              isLoading={processOrderMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
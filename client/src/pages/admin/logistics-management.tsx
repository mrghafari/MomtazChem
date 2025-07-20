import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Users, 
  Truck, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  Plus, 
  Edit, 
  Eye, 
  Phone,
  User,
  Shield,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

interface TransportationCompany {
  id: number;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  website?: string;
  isActive: boolean;
  rating?: number;
  totalDeliveries: number;
}

interface LogisticsOrder {
  id: number;
  customerOrderId: number;
  currentStatus: string;
  calculatedWeight?: number;
  weightUnit?: string;
  totalWeight?: string;
  totalAmount: string;
  currency: string;
  deliveryMethod?: string;
  transportationType?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  warehouseProcessedAt?: string;
  createdAt: string;
  updatedAt: string;
  deliveryCode?: string;
  isVerified?: boolean;
  customerAddress?: string;
  
  // Customer information
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

const LogisticsManagement = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [ordersSubTab, setOrdersSubTab] = useState('active'); // 'active' or 'delivered'
  const [orderButtonStates, setOrderButtonStates] = useState<{[orderId: number]: { 
    isCodeSent: boolean; 
    existingCode: string | null; 
    isGenerating: boolean;
  }}>({});
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<any>(null);
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
  const [resendingCodes, setResendingCodes] = useState<{[key: number]: boolean}>({});
  const [resentCodes, setResentCodes] = useState<{[key: number]: boolean}>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check admin authentication
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await fetch('/api/admin/me');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user?.roleId === 1) {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAdminAuth();
  }, []);

  // Enable audio notifications for logistics orders
  const { orderCount } = useOrderNotifications({
    department: 'logistics',
    enabled: true
  });

  // Get orders that have reached logistics stage (warehouse approved)
  const { data: logisticsOrdersResponse, isLoading: loadingLogisticsOrders } = useQuery({
    queryKey: ['/api/order-management/logistics'],
    enabled: activeTab === 'orders'
  });
  
  const allLogisticsOrders = logisticsOrdersResponse?.orders || [];
  
  // Separate active and delivered orders
  const activeOrders = allLogisticsOrders.filter((order: any) => 
    order.currentStatus !== 'logistics_delivered' && order.currentStatus !== 'completed'
  );
  
  const deliveredOrders = allLogisticsOrders.filter((order: any) => 
    order.currentStatus === 'logistics_delivered' || order.currentStatus === 'completed'
  );
  
  // Map data to add customer object structure for compatibility
  const mapOrderData = (orders: any[]) => orders.map((order: any) => ({
    ...order,
    // Use existing customer object if available, otherwise create from individual fields
    customer: order.customer || {
      firstName: order.customerFirstName,
      lastName: order.customerLastName,
      email: order.customerEmail,
      phone: order.customerPhone
    },
    // Ensure customerAddress is available for display
    customerAddress: order.customerAddress || 'آدرس ثبت نشده'
  }));
  
  const mappedActiveOrders = mapOrderData(activeOrders);
  const mappedDeliveredOrders = mapOrderData(deliveredOrders);

  const { data: companiesResponse, isLoading: loadingCompanies } = useQuery({
    queryKey: ['/api/logistics/companies'],
    enabled: activeTab === 'companies'
  });

  const companies = companiesResponse?.data || [];

  // Complete delivery mutation (admin only)
  const completeDeliveryMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await fetch(`/api/order-management/logistics/${orderId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete delivery');
      }
      return response.json();
    },
    onSuccess: (data, orderId) => {
      // Refresh orders list
      queryClient.invalidateQueries({ queryKey: ['/api/order-management/logistics'] });
      toast({
        title: "تکمیل تحویل",
        description: "سفارش به بایگانی لجستیک منتقل شد",
        className: "rtl"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطا",
        description: error.message,
        variant: "destructive",
        className: "rtl"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'warehouse_approved': { color: 'bg-blue-500', text: 'تایید انبار' },
      'logistics_assigned': { color: 'bg-yellow-500', text: 'اختصاص لجستیک' },
      'logistics_processing': { color: 'bg-orange-500', text: 'در حال پردازش' },
      'logistics_dispatched': { color: 'bg-purple-500', text: 'ارسال شده' },
      'logistics_delivered': { color: 'bg-green-500', text: 'تحویل داده شده' },
      'available': { color: 'bg-green-500', text: 'آزاد' },
      'assigned': { color: 'bg-yellow-500', text: 'اختصاص یافته' },
      'in_transit': { color: 'bg-blue-500', text: 'در حال حمل' },
      'maintenance': { color: 'bg-red-500', text: 'تعمیر' },
      'offline': { color: 'bg-gray-500', text: 'آفلاین' },
    };
    const config = statusMap[status] || { color: 'bg-gray-500', text: status };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  // Function to send or resend delivery code
  const handleSendDeliveryCode = async (orderManagementId: number, hasExistingCode: boolean) => {
    try {
      setResendingCodes(prev => ({ ...prev, [orderManagementId]: true }));
      
      // Use appropriate endpoint based on whether code exists
      const endpoint = hasExistingCode 
        ? `/api/order-management/${orderManagementId}/resend-delivery-code`
        : `/api/order-management/${orderManagementId}/generate-delivery-code`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResentCodes(prev => ({ ...prev, [orderManagementId]: true }));
        
        // Refresh the orders to show the new delivery code
        queryClient.invalidateQueries({ queryKey: ['/api/order-management/logistics'] });
        
        toast({
          title: "✅ موفقیت",
          description: hasExistingCode 
            ? `کد تحویل ${result.deliveryCode} مجدداً ارسال شد`
            : `کد تحویل ${result.deliveryCode} تولید و ارسال شد`,
          variant: "default",
        });
      } else {
        toast({
          title: "❌ خطا",
          description: result.message || "خطا در ارسال کد",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending delivery code:', error);
      toast({
        title: "❌ خطا",
        description: "خطا در ارسال کد تحویل",
        variant: "destructive",
      });
    } finally {
      setResendingCodes(prev => ({ ...prev, [orderManagementId]: false }));
    }
  };

  const OrdersTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">مدیریت سفارشات لجستیک</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {mappedActiveOrders.length} سفارش فعال
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {mappedDeliveredOrders.length} تحویل شده
            </Badge>
          </div>
        </div>

        {/* Sub-tabs for Active and Delivered Orders */}
        <Tabs value={ordersSubTab} onValueChange={setOrdersSubTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">سفارشات فعال ({mappedActiveOrders.length})</TabsTrigger>
            <TabsTrigger value="delivered">تحویل داده شده ({mappedDeliveredOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <ActiveOrdersList />
          </TabsContent>

          <TabsContent value="delivered">
            <DeliveredOrdersList />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const ActiveOrdersList = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h4 className="text-md font-semibold text-green-800">سفارشات تایید شده انبار (در لجستیک)</h4>
        </div>
        
        {loadingLogisticsOrders ? (
          <div className="text-center py-8">در حال بارگذاری سفارشات لجستیک...</div>
        ) : mappedActiveOrders.length === 0 ? (
          <Card className="border-green-200">
            <CardContent className="text-center py-8">
              <Package className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <p className="text-green-600">هیچ سفارش فعال در لجستیک موجود نیست</p>
            </CardContent>
          </Card>
        ) : (
          mappedActiveOrders.map((order: LogisticsOrder) => (
            <OrderCard key={order.id} order={order} showDeliveryButton={true} />
          ))
        )}
      </div>
    );
  };

  const DeliveredOrdersList = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h4 className="text-md font-semibold text-green-800">بایگانی سفارشات تحویل شده</h4>
        </div>
        
        {loadingLogisticsOrders ? (
          <div className="text-center py-8">در حال بارگذاری بایگانی...</div>
        ) : mappedDeliveredOrders.length === 0 ? (
          <Card className="border-green-200">
            <CardContent className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <p className="text-green-600">هیچ سفارش تحویل شده‌ای موجود نیست</p>
            </CardContent>
          </Card>
        ) : (
          mappedDeliveredOrders.map((order: LogisticsOrder) => (
            <OrderCard key={order.id} order={order} showDeliveryButton={false} />
          ))
        )}
      </div>
    );
  };

  const OrderCard = ({ order, showDeliveryButton }: { order: LogisticsOrder; showDeliveryButton: boolean }) => {
    return (
      <Card className={`border-r-4 ${showDeliveryButton ? 'border-r-green-500 bg-green-50' : 'border-r-gray-400 bg-gray-50'}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className={`font-semibold text-lg ${showDeliveryButton ? 'text-green-800' : 'text-gray-700'}`}>
              سفارش #{order.customerOrderId}
            </h4>
            <Badge variant="default" className={showDeliveryButton ? "bg-green-600 text-white" : "bg-gray-600 text-white"}>
              {showDeliveryButton ? 'در حال پردازش' : 'تحویل شده'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
            {/* Customer Info Block */}
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <h5 className="font-medium text-green-800 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                اطلاعات گیرنده
              </h5>
              <div className="space-y-2">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500 mb-1">نام مشتری</p>
                  <p className="text-sm font-medium text-gray-800">
                    {order.customer?.firstName || order.customerFirstName} {order.customer?.lastName || order.customerLastName}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-2 flex items-center">
                  <Phone className="w-3 h-3 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-700">{order.customer?.phone || order.customerPhone}</span>
                </div>
              </div>
            </div>

            {/* Total Weight Block */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                <Package className="w-4 h-4 mr-2" />
                وزن کل محموله
              </h5>
              <p className="text-lg font-bold text-blue-700">
                {order.calculatedWeight || order.totalWeight || '0'} {order.weightUnit || 'kg'}
              </p>
              <p className="text-xs text-blue-600 mt-1">وزن محاسبه شده</p>
            </div>

            {/* Delivery Address Block */}
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <h5 className="font-medium text-orange-800 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                آدرس تحویل
              </h5>
              <p className="text-sm text-orange-700">
                {order.customerAddress || 'آدرس ثبت نشده'}
              </p>
              <p className="text-xs text-orange-600 mt-1">آدرس دریافت کالا</p>
            </div>

            {/* Order Date Block */}
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <h5 className="font-medium text-green-800 mb-2 flex items-center">
                <Package className="w-4 h-4 mr-2" />
                تاریخ سفارش
              </h5>
              <p className="text-sm font-medium text-green-700">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US') : 'نامشخص'}
              </p>
              <p className="text-xs text-green-600 mt-1">تاریخ ثبت سفارش</p>
            </div>

            {/* Delivery Date Block */}
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <h5 className="font-medium text-yellow-800 mb-2 flex items-center">
                <Truck className="w-4 h-4 mr-2" />
                تاریخ تحویل
              </h5>
              <p className="text-sm font-medium text-yellow-700">
                {order.actualDeliveryDate ? new Date(order.actualDeliveryDate).toLocaleDateString('en-US') : 'در انتظار تحویل'}
              </p>
              <p className="text-xs text-yellow-600 mt-1">تاریخ تحویل سفارش</p>
            </div>

            {/* Tracking Code Block (for delivered orders) */}
            {!showDeliveryButton && order.deliveryCode && (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <h5 className="font-medium text-purple-800 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  کد تحویل
                </h5>
                <p className="text-sm font-medium text-purple-700">
                  {order.deliveryCode}
                </p>
                <p className="text-xs text-purple-600 mt-1">کد رهگیری تحویل</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {showDeliveryButton && (
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                onClick={() => handleSendDeliveryCode(order.id, !!order.deliveryCode)}
                disabled={resendingCodes[order.id]}
                className={`${
                  resentCodes[order.id] 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {resendingCodes[order.id] ? (
                  <>
                    <Send className="w-4 h-4 mr-2 animate-spin" />
                    در حال ارسال...
                  </>
                ) : resentCodes[order.id] ? (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    کد ارسال شد ✓
                  </>
                ) : order.deliveryCode ? (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    ارسال مجدد کد
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    ارسال کد به مشتری
                  </>
                )}
              </Button>
              <Button size="sm" variant="outline" className="border-green-500 text-green-700 hover:bg-green-100">
                <Users className="w-4 h-4 mr-2" />
                اختصاص راننده
              </Button>
              <Button size="sm" variant="outline" className="border-green-500 text-green-700 hover:bg-green-100">
                <MapPin className="w-4 h-4 mr-2" />
                پیگیری مسیر
              </Button>
              
              {/* Admin-only delivery completion */}
              {isAdmin ? (
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => completeDeliveryMutation.mutate(order.id)}
                  disabled={completeDeliveryMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {completeDeliveryMutation.isPending ? 'در حال پردازش...' : 'تحویل شد'}
                </Button>
              ) : (
                <div className="flex items-center px-3 py-1 bg-amber-100 border border-amber-300 rounded text-amber-700 text-sm">
                  <Shield className="w-4 h-4 mr-2" />
                  فقط ادمین می‌تواند تحویل را تکمیل کند
                </div>
              )}
            </div>
          )}

          {/* Delivered order info */}
          {!showDeliveryButton && (
            <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">این سفارش با موفقیت تحویل داده شده است</span>
              </div>
              {order.deliveryCode && (
                <p className="text-sm text-green-700 mt-1">
                  کد تحویل: <span className="font-medium">{order.deliveryCode}</span>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const CompaniesTab = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [companyFormData, setCompanyFormData] = useState({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      website: '',
      contractEndDate: '',
      maxWeight: '',
      baseRate: '',
      ratePerKm: ''
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">مدیریت شرکت‌های حمل</h3>
          <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            افزودن شرکت جدید
          </Button>
        </div>

        <Card>
          <CardContent className="text-center py-8">
            <Truck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">مدیریت شرکت‌های حمل در دست توسعه است</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const VehiclesTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">مدیریت وسایل نقلیه</h3>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            افزودن وسیله نقلیه
          </Button>
        </div>

        <Card>
          <CardContent className="text-center py-8">
            <Truck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">مدیریت وسایل نقلیه در دست توسعه است</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مدیریت لجستیک</h1>
          <p className="text-muted-foreground mt-1">
            سیستم مدیریت کامل لجستیک و حمل‌ونقل
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">سفارشات</TabsTrigger>
          <TabsTrigger value="companies">شرکت‌های حمل</TabsTrigger>
          <TabsTrigger value="vehicles">وسایل نقلیه</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>

        <TabsContent value="companies">
          <CompaniesTab />
        </TabsContent>

        <TabsContent value="vehicles">
          <VehiclesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LogisticsManagement;
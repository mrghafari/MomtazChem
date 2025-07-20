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
  FileText,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ToggleLeft
} from 'lucide-react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

// Sortable Header Component
const SortableHeader = ({ 
  children, 
  field, 
  sortField, 
  sortDirection, 
  onSort 
}: { 
  children: React.ReactNode; 
  field: string; 
  sortField: string; 
  sortDirection: 'asc' | 'desc'; 
  onSort: (field: string) => void; 
}) => {
  const isActive = sortField === field;
  
  return (
    <div 
      className="flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors"
      onClick={() => onSort(field)}
    >
      <span className="font-medium">{children}</span>
      <div className="ml-1 flex flex-col">
        {isActive ? (
          sortDirection === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-blue-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-blue-600" />
          )
        ) : (
          <ChevronsUpDown className="h-4 w-4 text-gray-400" />
        )}
      </div>
    </div>
  );
};

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
  recipientName?: string;
  recipientPhone?: string;
  shippingAddress?: string | object;
  orderNumber?: string;
  
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
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [completingDeliveries, setCompletingDeliveries] = useState<{[key: number]: boolean}>({});
  
  // Sorting state - default sort by creation date for active orders
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
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

  // Function to fetch and show order details using admin endpoint
  const handleShowOrderDetails = async (orderId: number) => {
    setLoadingOrderDetails(true);
    try {
      console.log('Fetching order details for orderId:', orderId);
      
      // Use special logistics endpoint that doesn't require authentication
      const response = await fetch(`/api/logistics/orders/${orderId}/details`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log('Order details response:', result);
      
      if (result.success) {
        setSelectedOrderDetails(result.data);
        setIsOrderDetailsOpen(true);
      } else {
        toast({
          title: "خطا",
          description: result.message || "جزئیات سفارش یافت نشد",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "خطا",
        description: "خطا در دریافت جزئیات سفارش",
        variant: "destructive",
      });
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  // Handle complete delivery
  const handleCompleteDelivery = async (orderId: number) => {
    setCompletingDeliveries(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const response = await fetch(`/api/order-management/logistics/${orderId}/complete`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'logistics_delivered',
          actualDeliveryDate: new Date().toISOString()
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "موفقیت",
          description: "سفارش به بایگانی لجستیک منتقل شد",
        });
        
        // Invalidate both active and delivered orders queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/order-management/logistics'] });
        queryClient.invalidateQueries({ queryKey: ['/api/order-management/logistics', { statuses: 'logistics_delivered,completed' }] });
      } else {
        toast({
          title: "خطا",
          description: result.message || "خطا در تکمیل تحویل",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast({
        title: "خطا",
        description: "خطا در اتصال به سرور",
        variant: "destructive",
      });
    } finally {
      setCompletingDeliveries(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Enable audio notifications for logistics orders
  const { orderCount } = useOrderNotifications({
    department: 'logistics',
    enabled: true
  });

  // Get current user info for admin checks
  const { data: currentUser } = useQuery({
    queryKey: ['/api/admin/me'],
    queryFn: () => fetch('/api/admin/me').then(res => res.json()).then(data => data.user),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get active logistics orders (not delivered)
  const { data: activeOrdersResponse, isLoading: loadingActiveOrders } = useQuery({
    queryKey: ['/api/order-management/logistics', { active: true }],
    queryFn: () => fetch('/api/order-management/logistics').then(res => res.json()),
    enabled: activeTab === 'orders'
  });
  
  // Get delivered orders with specific statuses to trigger correct sorting
  const { data: deliveredOrdersResponse, isLoading: loadingDeliveredOrders } = useQuery({
    queryKey: ['/api/order-management/logistics', { delivered: true }],
    queryFn: () => fetch('/api/order-management/logistics?statuses=logistics_delivered,completed').then(res => res.json()),
    enabled: activeTab === 'orders'
  });
  
  const allActiveOrders = activeOrdersResponse?.orders || [];
  const allDeliveredOrders = deliveredOrdersResponse?.orders || [];
  
  // Filter active orders (exclude delivered ones just in case)
  const activeOrders = allActiveOrders.filter((order: any) => 
    order.currentStatus !== 'logistics_delivered' && order.currentStatus !== 'completed'
  );
  
  // Use delivered orders from dedicated query and apply client-side sorting
  const deliveredOrders = allDeliveredOrders;
  
  // Function to handle column sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Function to sort delivered orders
  const sortDeliveredOrders = (orders: any[]) => {
    if (!sortField) return orders;
    
    return [...orders].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle different data types
      if (sortField === 'actualDeliveryDate' || sortField === 'createdAt') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (sortField === 'totalAmount') {
        aValue = parseFloat(aValue || '0');
        bValue = parseFloat(bValue || '0');
      } else if (sortField === 'customerOrderId' || sortField === 'id') {
        aValue = parseInt(aValue || '0');
        bValue = parseInt(bValue || '0');
      } else if (sortField === 'customerName') {
        aValue = `${a.customerFirstName || ''} ${a.customerLastName || ''}`.trim().toLowerCase();
        bValue = `${b.customerFirstName || ''} ${b.customerLastName || ''}`.trim().toLowerCase();
      } else if (sortField === 'deliveryCode') {
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
      } else if (sortField === 'calculatedWeight' || sortField === 'totalWeight') {
        aValue = parseFloat((a.calculatedWeight || a.totalWeight || '0').toString());
        bValue = parseFloat((b.calculatedWeight || b.totalWeight || '0').toString());
      } else {
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  // Function to sort active orders
  const sortActiveOrders = (orders: any[]) => {
    if (!sortField) return orders;
    
    return [...orders].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle different data types
      if (sortField === 'createdAt' || sortField === 'warehouseProcessedAt') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (sortField === 'totalAmount') {
        aValue = parseFloat(aValue || '0');
        bValue = parseFloat(bValue || '0');
      } else if (sortField === 'customerOrderId' || sortField === 'id') {
        aValue = parseInt(aValue || '0');
        bValue = parseInt(bValue || '0');
      } else if (sortField === 'customerName') {
        aValue = `${a.customerFirstName || ''} ${a.customerLastName || ''}`.trim().toLowerCase();
        bValue = `${b.customerFirstName || ''} ${b.customerLastName || ''}`.trim().toLowerCase();
      } else if (sortField === 'calculatedWeight' || sortField === 'totalWeight') {
        aValue = parseFloat((a.calculatedWeight || a.totalWeight || '0').toString());
        bValue = parseFloat((b.calculatedWeight || b.totalWeight || '0').toString());
      } else {
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };
  
  // Map data to add customer object structure for compatibility
  const mapOrderData = (orders: any[]) => orders.map((order: any) => {
    // Extract address from shippingAddress JSON if available
    let customerAddress = 'آدرس ثبت نشده';
    if (order.customerAddress) {
      customerAddress = order.customerAddress;
    } else if (order.recipientAddress) {
      customerAddress = order.recipientAddress;
    } else if (order.shippingAddress) {
      try {
        const shippingAddr = typeof order.shippingAddress === 'string' 
          ? JSON.parse(order.shippingAddress) 
          : order.shippingAddress;
        if (shippingAddr && shippingAddr.address) {
          customerAddress = `${shippingAddr.address}${shippingAddr.city ? ', ' + shippingAddr.city : ''}`;
        }
      } catch (e) {
        console.log('Error parsing shipping address:', e);
      }
    }
    
    return {
      ...order,
      // Use existing customer object if available, otherwise create from individual fields
      customer: order.customer || {
        firstName: order.customerFirstName,
        lastName: order.customerLastName,
        email: order.customerEmail,
        phone: order.customerPhone
      },
      customerAddress,
      // Extract recipient info from shippingAddress if not available directly
      recipientName: order.recipientName || (order.shippingAddress ? 
        (() => {
          try {
            const addr = typeof order.shippingAddress === 'string' 
              ? JSON.parse(order.shippingAddress) 
              : order.shippingAddress;
            return addr?.name || `${order.customerFirstName || ''} ${order.customerLastName || ''}`.trim();
          } catch (e) {
            return `${order.customerFirstName || ''} ${order.customerLastName || ''}`.trim();
          }
        })() : `${order.customerFirstName || ''} ${order.customerLastName || ''}`.trim()),
      recipientPhone: order.recipientPhone || (order.shippingAddress ? 
        (() => {
          try {
            const addr = typeof order.shippingAddress === 'string' 
              ? JSON.parse(order.shippingAddress) 
              : order.shippingAddress;
            return addr?.phone || order.customerPhone;
          } catch (e) {
            return order.customerPhone;
          }
        })() : order.customerPhone)
    };
  });
  
  const sortedActiveOrders = sortActiveOrders(activeOrders);
  const mappedActiveOrders = mapOrderData(sortedActiveOrders);
  const sortedDeliveredOrders = sortDeliveredOrders(deliveredOrders);
  const mappedDeliveredOrders = mapOrderData(sortedDeliveredOrders);
  
  const loadingLogisticsOrders = loadingActiveOrders || loadingDeliveredOrders;

  const { data: companiesResponse, isLoading: loadingCompanies } = useQuery({
    queryKey: ['/api/logistics/companies'],
    enabled: activeTab === 'companies'
  });

  const companies = companiesResponse?.data || [];

  // Complete delivery mutation (admin only)
  const completeDeliveryMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await fetch(`/api/order-management/logistics/${orderId}/complete`, {
        method: 'PATCH',
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
      // Invalidate both active and delivered order queries
      queryClient.invalidateQueries({ queryKey: ['/api/order-management/logistics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/order-management/logistics', { active: true }] });
      queryClient.invalidateQueries({ queryKey: ['/api/order-management/logistics', { delivered: true }] });
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
        
        // NO refresh when sending manually - as requested by user
        // queryClient.invalidateQueries({ queryKey: ['/api/order-management/logistics'] });
        
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                سفارشات فعال لجستیک ({mappedActiveOrders.length} سفارش)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] border-collapse" dir="rtl">
                  <thead>
                    <tr className="bg-green-50 border-b">
                      <th className="text-right p-2 border-r">
                        <SortableHeader 
                          field="customerOrderId" 
                          sortField={sortField} 
                          sortDirection={sortDirection} 
                          onSort={handleSort}
                        >
                          شماره سفارش
                        </SortableHeader>
                      </th>
                      <th className="text-right p-2 border-r">
                        <SortableHeader 
                          field="customerName" 
                          sortField={sortField} 
                          sortDirection={sortDirection} 
                          onSort={handleSort}
                        >
                          نام مشتری
                        </SortableHeader>
                      </th>
                      <th className="text-right p-2 border-r">
                        <SortableHeader 
                          field="createdAt" 
                          sortField={sortField} 
                          sortDirection={sortDirection} 
                          onSort={handleSort}
                        >
                          تاریخ ثبت
                        </SortableHeader>
                      </th>
                      <th className="text-right p-2 border-r">
                        <SortableHeader 
                          field="warehouseProcessedAt" 
                          sortField={sortField} 
                          sortDirection={sortDirection} 
                          onSort={handleSort}
                        >
                          تاریخ تایید انبار
                        </SortableHeader>
                      </th>
                      <th className="text-right p-2 border-r">
                        <SortableHeader 
                          field="totalAmount" 
                          sortField={sortField} 
                          sortDirection={sortDirection} 
                          onSort={handleSort}
                        >
                          مبلغ کل
                        </SortableHeader>
                      </th>
                      <th className="text-right p-2 border-r">
                        <SortableHeader 
                          field="calculatedWeight" 
                          sortField={sortField} 
                          sortDirection={sortDirection} 
                          onSort={handleSort}
                        >
                          وزن کل
                        </SortableHeader>
                      </th>
                      <th className="text-right p-2 border-r">
                        <SortableHeader 
                          field="deliveryCode" 
                          sortField={sortField} 
                          sortDirection={sortDirection} 
                          onSort={handleSort}
                        >
                          کد تحویل
                        </SortableHeader>
                      </th>
                      <th className="text-center p-2">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedActiveOrders.map((order: LogisticsOrder) => (
                      <tr key={order.id} className="border-b hover:bg-green-50">
                        <td className="p-3 border-r">
                          <div className="font-medium text-green-700">#{order.customerOrderId}</div>
                        </td>
                        <td className="p-3 border-r">
                          <div className="font-medium">
                            {order.recipientName || `${order.customer?.firstName || order.customerFirstName} ${order.customer?.lastName || order.customerLastName}`}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {order.recipientPhone || order.customer?.phone || order.customerPhone}
                          </div>
                        </td>
                        <td className="p-3 border-r">
                          <div className="text-sm">
                            {order.createdAt ? 
                              new Date(order.createdAt).toLocaleDateString('fa-IR') : 
                              'تاریخ نامشخص'
                            }
                          </div>
                        </td>
                        <td className="p-3 border-r">
                          <div className="text-sm font-medium text-blue-600">
                            {order.warehouseProcessedAt ? 
                              new Date(order.warehouseProcessedAt).toLocaleDateString('fa-IR') : 
                              'در انتظار'
                            }
                          </div>
                        </td>
                        <td className="p-3 border-r">
                          <div className="font-medium text-blue-600">
                            {parseFloat(order.totalAmount).toLocaleString('fa-IR')} {order.currency}
                          </div>
                        </td>
                        <td className="p-3 border-r">
                          <div className="font-medium">
                            {order.calculatedWeight || order.totalWeight || '0'} {order.weightUnit || 'kg'}
                          </div>
                        </td>
                        <td className="p-3 border-r">
                          <div className="text-sm">
                            {order.deliveryCode ? (
                              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                {order.deliveryCode}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">کد تحویل تولید نشده</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleShowOrderDetails(order.customerOrderId)}
                              className="text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              جزئیات
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleSendDeliveryCode(order.id, !!order.deliveryCode)}
                              disabled={resendingCodes[order.id]}
                              className={`${
                                resentCodes[order.id] 
                                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              } text-xs`}
                            >
                              {resendingCodes[order.id] ? (
                                <>
                                  <Send className="w-3 h-3 mr-1 animate-spin" />
                                  در حال ارسال...
                                </>
                              ) : order.deliveryCode ? (
                                <>
                                  <Send className="w-3 h-3 mr-1" />
                                  ارسال مجدد
                                </>
                              ) : (
                                <>
                                  <Send className="w-3 h-3 mr-1" />
                                  ارسال کد
                                </>
                              )}
                            </Button>
                            {/* Complete Delivery Button */}
                            <Button
                              size="sm"
                              onClick={() => handleCompleteDelivery(order.id)}
                              disabled={completingDeliveries[order.id]}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs"
                            >
                              {completingDeliveries[order.id] ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1 animate-spin" />
                                  در حال تکمیل...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  تحویل شد
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card View for Active Orders */}
        {mappedActiveOrders.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <ToggleLeft className="w-5 h-5 text-green-600" />
              <h4 className="text-md font-semibold text-green-800">نمایش کارتی سفارشات فعال</h4>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {mappedActiveOrders.slice(0, 6).map((order: LogisticsOrder) => (
                <OrderCard key={order.id} order={order} showDeliveryButton={true} />
              ))}
            </div>
            
            {mappedActiveOrders.length > 6 && (
              <div className="text-center mt-4">
                <Badge variant="outline" className="text-sm">
                  و {mappedActiveOrders.length - 6} سفارش دیگر در جدول بالا
                </Badge>
              </div>
            )}
          </div>
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
          <Card className="border-green-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-green-50 border-b">
                    <tr>
                      <th className="text-right p-2 border-r">
                        <SortableHeader 
                          field="customerOrderId" 
                          sortField={sortField} 
                          sortDirection={sortDirection} 
                          onSort={handleSort}
                        >
                          شماره سفارش
                        </SortableHeader>
                      </th>
                      <th className="text-right p-2 border-r">
                        <SortableHeader 
                          field="customerName" 
                          sortField={sortField} 
                          sortDirection={sortDirection} 
                          onSort={handleSort}
                        >
                          نام مشتری
                        </SortableHeader>
                      </th>
                      <th className="text-right p-2 border-r">
                        <SortableHeader 
                          field="actualDeliveryDate" 
                          sortField={sortField} 
                          sortDirection={sortDirection} 
                          onSort={handleSort}
                        >
                          تاریخ تحویل
                        </SortableHeader>
                      </th>
                      <th className="text-right p-2 border-r">
                        <SortableHeader 
                          field="deliveryCode" 
                          sortField={sortField} 
                          sortDirection={sortDirection} 
                          onSort={handleSort}
                        >
                          کد تحویل
                        </SortableHeader>
                      </th>
                      <th className="text-right p-2 border-r">
                        <SortableHeader 
                          field="totalAmount" 
                          sortField={sortField} 
                          sortDirection={sortDirection} 
                          onSort={handleSort}
                        >
                          مبلغ کل
                        </SortableHeader>
                      </th>
                      <th className="text-right p-2 border-r">
                        <SortableHeader 
                          field="calculatedWeight" 
                          sortField={sortField} 
                          sortDirection={sortDirection} 
                          onSort={handleSort}
                        >
                          وزن کل
                        </SortableHeader>
                      </th>
                      <th className="text-center p-2">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedDeliveredOrders.map((order: LogisticsOrder) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 border-r">
                          <div className="font-medium text-green-700">#{order.customerOrderId}</div>
                        </td>
                        <td className="p-3 border-r">
                          <div className="font-medium">
                            {order.recipientName || `${order.customer?.firstName || order.customerFirstName} ${order.customer?.lastName || order.customerLastName}`}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {order.recipientPhone || order.customer?.phone || order.customerPhone}
                          </div>
                        </td>
                        <td className="p-3 border-r">
                          <div className="font-medium text-green-600">
                            {order.actualDeliveryDate ? 
                              new Date(order.actualDeliveryDate).toLocaleDateString('fa-IR') : 
                              'تاریخ ثبت نشده'
                            }
                          </div>
                          {order.deliveryCode && (
                            <div className="text-xs mt-1">
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                کد: {order.deliveryCode}
                              </Badge>
                            </div>
                          )}
                        </td>
                        <td className="p-3 border-r text-center">
                          {order.deliveryCode ? (
                            <Badge className="bg-green-100 text-green-800">
                              {order.deliveryCode}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">ندارد</span>
                          )}
                        </td>
                        <td className="p-3 border-r">
                          <div className="font-medium text-blue-600">
                            {parseFloat(order.totalAmount).toLocaleString('fa-IR')} {order.currency}
                          </div>
                        </td>
                        <td className="p-3 border-r">
                          <div className="font-medium">
                            {order.calculatedWeight || order.totalWeight || '0'} {order.weightUnit || 'kg'}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleShowOrderDetails(order.customerOrderId)}
                            className="text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            جزئیات
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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
            {/* Customer Info Block - Clickable */}
            <div 
              className="bg-white rounded-lg p-3 border border-green-200 cursor-pointer hover:bg-green-50 hover:border-green-300 transition-colors"
              onClick={() => handleShowOrderDetails(order.customerOrderId)}
            >
              <h5 className="font-medium text-green-800 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                اطلاعات گیرنده
                <Eye className="w-4 h-4 mr-1 text-green-600" />
              </h5>
              <div className="space-y-2">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500 mb-1">نام گیرنده</p>
                  <p className="text-sm font-medium text-gray-800">
                    {order.recipientName || `${order.customer?.firstName || order.customerFirstName} ${order.customer?.lastName || order.customerLastName}`}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-2 flex items-center">
                  <Phone className="w-3 h-3 mr-2 text-gray-500" />
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-700">{order.recipientPhone || order.customer?.phone || order.customerPhone}</span>
                    <span className="text-xs text-gray-500">شماره موبایل گیرنده</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2 text-center">کلیک کنید برای مشاهده جزئیات خرید</p>
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
                آدرس تحویل کالا
              </h5>
              <p className="text-sm text-orange-700">
                {(() => {
                  // Try to parse shipping address if it's a JSON string
                  if (order.shippingAddress && typeof order.shippingAddress === 'string') {
                    try {
                      const addr = JSON.parse(order.shippingAddress);
                      return addr.address || addr.recipientAddress || order.shippingAddress;
                    } catch {
                      return order.shippingAddress;
                    }
                  }
                  // If it's already an object
                  if (order.shippingAddress && typeof order.shippingAddress === 'object') {
                    return order.shippingAddress.address || order.shippingAddress.recipientAddress;
                  }
                  // Fallback to customer address
                  return order.customerAddress || 'آدرس ثبت نشده';
                })()}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                آدرس انتخابی مشتری در فرآیند خرید (آدرس اول یا دوم)
              </p>
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
                {order.deliveryCode && (
                  <span className="mr-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md font-bold">
                    کد: {order.deliveryCode}
                  </span>
                )}
              </h5>
              <p className="text-sm font-medium text-yellow-700">
                {order.actualDeliveryDate ? new Date(order.actualDeliveryDate).toLocaleDateString('en-US') : 'در انتظار تحویل'}
              </p>
              <p className="text-xs text-yellow-600 mt-1">تاریخ تحویل سفارش</p>
            </div>
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
                    ارسال مجدد
                  </>
                ) : order.deliveryCode ? (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    ارسال مجدد
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
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => completeDeliveryMutation.mutate(order.id)}
                    disabled={completeDeliveryMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {completeDeliveryMutation.isPending ? 'در حال پردازش...' : 'تحویل شد'}
                  </Button>
                </div>
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
      website: ''
    });

    const addCompanyMutation = useMutation({
      mutationFn: async (data: any) => {
        const response = await fetch('/api/logistics/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include'
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create company');
        }
        return response.json();
      },
      onSuccess: () => {
        setShowAddForm(false);
        setCompanyFormData({
          name: '',
          contactPerson: '',
          phone: '',
          email: '',
          address: '',
          website: ''
        });
        queryClient.invalidateQueries({ queryKey: ['/api/logistics/companies'] });
        toast({ title: "موفق", description: "شرکت حمل و نقل جدید ثبت شد" });
      },
      onError: (error: Error) => {
        toast({ 
          title: "خطا", 
          description: error.message || "خطا در ثبت شرکت",
          variant: "destructive" 
        });
      }
    });

    const handleSubmitCompany = (e: React.FormEvent) => {
      e.preventDefault();
      if (!companyFormData.name || !companyFormData.phone) {
        toast({ 
          title: "خطا", 
          description: "لطفاً نام شرکت و شماره تماس را وارد کنید",
          variant: "destructive"
        });
        return;
      }
      addCompanyMutation.mutate(companyFormData);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">شرکت‌های حمل و نقل</h3>
          <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            شرکت جدید
          </Button>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>ثبت شرکت حمل و نقل جدید</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitCompany} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">نام شرکت *</Label>
                    <Input
                      id="name"
                      value={companyFormData.name}
                      onChange={(e) => setCompanyFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="نام شرکت حمل و نقل"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">نام مسئول</Label>
                    <Input
                      id="contactPerson"
                      value={companyFormData.contactPerson}
                      onChange={(e) => setCompanyFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="نام شخص رابط"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">شماره تماس *</Label>
                    <Input
                      id="phone"
                      value={companyFormData.phone}
                      onChange={(e) => setCompanyFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="شماره تماس شرکت"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">ایمیل</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyFormData.email}
                      onChange={(e) => setCompanyFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="آدرس ایمیل"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">آدرس</Label>
                  <Input
                    id="address"
                    value={companyFormData.address}
                    onChange={(e) => setCompanyFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="آدرس کامل شرکت"
                  />
                </div>

                <div>
                  <Label htmlFor="website">وب‌سایت</Label>
                  <Input
                    id="website"
                    type="url"
                    value={companyFormData.website}
                    onChange={(e) => setCompanyFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://www.example.com"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={addCompanyMutation.isPending}>
                    {addCompanyMutation.isPending ? 'در حال ثبت...' : 'ثبت شرکت'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    لغو
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {loadingCompanies ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>در حال بارگذاری شرکت‌های حمل و نقل...</p>
            </div>
          ) : companies.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Truck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 mb-4">هیچ شرکت حمل و نقل ثبت نشده است</p>
                <Button onClick={() => setShowAddForm(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  ثبت اولین شرکت
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                📊 تعداد کل شرکت‌ها: {companies.length} شرکت
              </div>
              {companies.map((company: TransportationCompany) => (
                <Card key={company.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{company.name}</h4>
                        {company.contactPerson && (
                          <p className="text-sm text-gray-600 mt-1">مسئول: {company.contactPerson}</p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          <span className="text-sm flex items-center gap-1">
                            📞 {company.phone}
                          </span>
                          {company.email && (
                            <span className="text-sm flex items-center gap-1">
                              ✉️ {company.email}
                            </span>
                          )}
                          {company.website && (
                            <a 
                              href={company.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              🌐 وب‌سایت
                            </a>
                          )}
                        </div>
                        
                        {company.address && (
                          <p className="text-sm text-gray-600 mt-2">
                            📍 {company.address}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-sm text-gray-600">
                            ⭐ امتیاز: {company.rating || 0}/5
                          </span>
                          <span className="text-sm text-gray-600">
                            📦 تحویل‌ها: {company.totalDeliveries || 0}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {company.isActive ? (
                          <Badge className="bg-green-500 hover:bg-green-600">فعال</Badge>
                        ) : (
                          <Badge className="bg-red-500 hover:bg-red-600">غیرفعال</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button size="sm" variant="outline" className="hover:bg-blue-50">
                        <Edit className="w-4 h-4 mr-2" />
                        ویرایش
                      </Button>
                      <Button size="sm" variant="outline" className="hover:bg-green-50">
                        <Eye className="w-4 h-4 mr-2" />
                        جزئیات
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
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
      {/* Order Details Dialog */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              جزئیات کامل خرید
            </DialogTitle>
            <DialogDescription className="text-center">
              {selectedOrderDetails && `سفارش #${selectedOrderDetails.order_number}`}
            </DialogDescription>
          </DialogHeader>
          
          {loadingOrderDetails ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>در حال بارگذاری جزئیات سفارش...</p>
              </div>
            </div>
          ) : selectedOrderDetails ? (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      اطلاعات سفارش
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">شماره سفارش:</span>
                      <span className="font-medium">{selectedOrderDetails.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">مبلغ کل:</span>
                      <span className="font-medium">{selectedOrderDetails.total_amount} {selectedOrderDetails.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">وضعیت پرداخت:</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        پرداخت شده
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">روش پرداخت:</span>
                      <span className="font-medium">{selectedOrderDetails.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">تاریخ ثبت:</span>
                      <span className="font-medium">{new Date(selectedOrderDetails.created_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      اطلاعات مشتری
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">نام مشتری:</span>
                      <span className="font-medium">
                        {selectedOrderDetails.first_name} {selectedOrderDetails.last_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ایمیل:</span>
                      <span className="font-medium">{selectedOrderDetails.customer_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">تلفن:</span>
                      <span className="font-medium">{selectedOrderDetails.customer_phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">نام گیرنده:</span>
                      <span className="font-medium">{selectedOrderDetails.recipient_name || selectedOrderDetails.guest_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">تلفن گیرنده:</span>
                      <span className="font-medium">{selectedOrderDetails.recipient_phone}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Address Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    آدرس تحویل مشتری
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <p className="text-sm font-medium text-orange-800">
                      {selectedOrderDetails.shipping_address || selectedOrderDetails.recipient_address || 'آدرس ثبت نشده'}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      آدرس انتخابی مشتری برای تحویل کالا
                    </p>
                  </div>
                </CardContent>
              </Card>


              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    محصولات سفارش ({selectedOrderDetails.items?.length || 0} قلم)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrderDetails.items?.map((item: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">نام محصول</p>
                            <p className="font-medium">{item.product_name}</p>
                            {item.sku && (
                              <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">تعداد</p>
                            <p className="font-medium">{item.quantity}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">قیمت واحد</p>
                            <p className="font-medium">{item.unit_price} {selectedOrderDetails.currency}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">قیمت کل</p>
                            <p className="font-medium text-green-600">{item.total_price} {selectedOrderDetails.currency}</p>
                          </div>
                        </div>
                        {(item.weight || item.gross_weight) && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-sm text-gray-600">
                              وزن: {(item.gross_weight || item.weight) * item.quantity} {item.weight_unit || 'kg'}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Total Weight */}
                  {selectedOrderDetails.totalWeight > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">وزن کل محموله:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {selectedOrderDetails.totalWeight} {selectedOrderDetails.weightUnit}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedOrderDetails.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">یادداشت‌ها</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedOrderDetails.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p>جزئیات سفارش یافت نشد</p>
            </div>
          )}
          
          {/* Print Button */}
          {selectedOrderDetails && (
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <FileText className="w-4 h-4 mr-2" />
                چاپ جزئیات سفارش
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
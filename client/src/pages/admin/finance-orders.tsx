import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DollarSign, 
  CheckCircle, 
  CheckCircle2,
  XCircle, 
  Eye, 
  Clock,
  RefreshCw,
  FileText,
  CreditCard,
  Barcode,
  Plus,
  Search,
  Filter,
  Download,
  TrendingUp,
  Users,
  ShoppingCart,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Receipt,
  ChevronRight,
  ExternalLink,
  Wallet,
  Building,
  Timer,
  Bell,
  Settings,
  MessageSquare,
  Save,
  Edit,
  Trash2,
  AlertCircle
} from "lucide-react";
import InternalBarcodeCard from "@/components/InternalBarcodeCard";
import GlobalRefreshControl from "@/components/GlobalRefreshControl";

import { useToast } from "@/hooks/use-toast";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { formatCurrency } from "@/lib/utils";

interface OrderManagement {
  id: number;
  customerOrderId: number;
  orderNumber?: string; // شماره سفارش M[YY][NNNNN]
  currentStatus: string;
  totalAmount: string;
  currency: string;
  paymentReceiptUrl?: string;
  financialNotes?: string;
  financialReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string;
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
  financialReviewerId?: number;
  deliveryCode?: string;
}

// Helper function to get customer info with fallback
const getCustomerInfo = (order: OrderManagement) => {
  if (order.customer) {
    return {
      firstName: order.customer.firstName,
      lastName: order.customer.lastName,
      email: order.customer.email,
      phone: order.customer.phone
    };
  }
  return {
    firstName: order.customerFirstName || '',
    lastName: order.customerLastName || '',
    email: order.customerEmail || '',
    phone: order.customerPhone || ''
  };
};

function FinanceOrders() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<OrderManagement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("pending");
  const [orderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [orderDocuments, setOrderDocuments] = useState<any[]>([]);

  // Enable audio notifications for new orders
  const { orderCount } = useOrderNotifications({
    department: 'financial',
    enabled: true
  });

  // Get orders for financial review
  const { data: ordersResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/order-management/financial'],
    queryFn: () => fetch('/api/order-management/financial', { credentials: 'include' }).then(res => res.json())
  });

  // Fetch approved orders that have been transferred to warehouse
  const { data: approvedOrdersResponse, isLoading: isLoadingApproved, refetch: refetchApproved } = useQuery({
    queryKey: ['/api/financial/approved-orders'],
    queryFn: () => fetch('/api/financial/approved-orders', { credentials: 'include' }).then(res => res.json())
  });

  // Orphan orders queries
  const { data: orphanStats } = useQuery({
    queryKey: ['/api/orphan-orders/stats'],
    enabled: activeTab === 'orphan'
  });

  const { data: activeOrders } = useQuery({
    queryKey: ['/api/orphan-orders/active'],
    enabled: activeTab === 'orphan'
  });

  const { data: notificationSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['/api/orphan-orders/notification-settings'],
    enabled: activeTab === 'orphan'
  });

  const { data: templatesData, refetch: refetchTemplates } = useQuery({
    queryKey: ['/api/orphan-orders/templates'],
    enabled: activeTab === 'orphan'
  });

  const { data: schedulesData, refetch: refetchSchedules } = useQuery({
    queryKey: ['/api/orphan-orders/schedules'],
    enabled: activeTab === 'orphan'
  });



  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async ({ orderId, type }: { orderId: number; type: string }) => {
      return apiRequest(`/api/orphan-orders/${orderId}/send-reminder`, {
        method: 'POST',
        body: { type }
      });
    },
    onSuccess: () => {
      toast({
        title: "موفق",
        description: "یادآور با موفقیت ارسال شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orphan-orders/active'] });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ارسال یادآور",
        variant: "destructive",
      });
    }
  });

  const allOrders: OrderManagement[] = ordersResponse?.orders || [];
  const transferredOrders: OrderManagement[] = approvedOrdersResponse?.orders || [];
  
  // Debug: Log order counts for troubleshooting
  console.log('🔍 [STATS DEBUG] allOrders count:', allOrders.length);
  console.log('🔍 [STATS DEBUG] transferredOrders count:', transferredOrders.length);
  console.log('🔍 [STATS DEBUG] ordersResponse:', ordersResponse);
  
  // Filter and search functionality
  const filteredOrders = allOrders.filter(order => {
    const searchMatch = !searchTerm || 
      order.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerOrderId?.toString().includes(searchTerm);
    
    const statusMatch = statusFilter === "all" || order.currentStatus === statusFilter;
    
    return searchMatch && statusMatch;
  });

  // Filter transferred orders
  const filteredTransferredOrders = transferredOrders.filter(order => {
    const searchMatch = !searchTerm || 
      order.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerOrderId?.toString().includes(searchTerm);
    
    return searchMatch;
  });

  // Separate orders by status for tabs
  const pendingOrders = filteredOrders.filter(order => 
    ['pending', 'pending_payment', 'payment_uploaded', 'financial_reviewing'].includes(order.currentStatus)
  );
  
  const rejectedOrders = filteredOrders.filter(order => 
    order.currentStatus === 'financial_rejected'
  );

  // Statistics
  const totalAmount = allOrders.reduce((sum, order) => 
    sum + parseFloat(order.totalAmount || '0'), 0
  );
  
  const totalTransferred = filteredTransferredOrders.reduce((sum, order) => 
    sum + parseFloat(order.totalAmount || '0'), 0
  );

  // Fetch order details function for admin users
  const fetchOrderDetails = async (orderNumber: string) => {
    try {
      // For admin users, we need to find the order by orderNumber first, then get details by ID
      const findOrderResponse = await fetch(`/api/admin/orders/find-by-number/${orderNumber}`, {
        credentials: 'include'
      });
      
      if (!findOrderResponse.ok) {
        throw new Error('Failed to find order');
      }
      
      const findOrderData = await findOrderResponse.json();
      if (!findOrderData.success || !findOrderData.order) {
        throw new Error('Order not found');
      }
      
      // Now get the order details using the customer order ID
      const detailsResponse = await fetch(`/api/admin/orders/${findOrderData.order.id}/details`, {
        credentials: 'include'
      });
      
      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const detailsData = await detailsResponse.json();
      if (detailsData.success) {
        console.log('📋 [ORDER DETAILS] Order fetched:', detailsData.order.orderNumber);
        console.log('📋 [ORDER DETAILS] Items count:', detailsData.order.items?.length || 0);
        console.log('📋 [ORDER DETAILS] Items data:', detailsData.order.items);
        setOrderDetails(detailsData.order);
        setOrderDocuments(detailsData.documents || []);
        setOrderDetailsModalOpen(true);
      } else {
        throw new Error(detailsData.message || 'Failed to get order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        variant: "destructive", 
        title: "خطا",
        description: "امکان دریافت جزئیات سفارش وجود ندارد"
      });
    }
  };

  // Auto-refresh controlled by global settings
  useEffect(() => {
    if (allOrders && allOrders.length >= 0) {
      const checkRefreshSettings = () => {
        const globalSettings = localStorage.getItem('global-refresh-settings');
        if (globalSettings) {
          const settings = JSON.parse(globalSettings);
          const financeSettings = settings.departments.finance;
          
          if (financeSettings.autoRefresh) {
            const refreshInterval = settings.syncEnabled 
              ? settings.globalInterval 
              : financeSettings.interval;
            
            return refreshInterval * 1000;
          }
        }
        return 600000;
      };

      const intervalMs = checkRefreshSettings();
      const interval = setInterval(() => {
        const currentSettings = localStorage.getItem('global-refresh-settings');
        if (currentSettings) {
          const settings = JSON.parse(currentSettings);
          if (settings.departments.finance.autoRefresh) {
            refetch();
          }
        }
      }, intervalMs);

      return () => clearInterval(interval);
    }
  }, [allOrders, refetch]);

  // Mutations for approve/reject
  const approveMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: number; notes: string }) => {
      console.log(`🔄 [FINANCE] Sending approve request for order ${orderId}`);
      return apiRequest(`/api/finance/orders/${orderId}/approve`, {
        method: 'POST',
        body: { notes }
      });
    },
    onSuccess: (response) => {
      console.log(`✅ [FINANCE] Order approved successfully:`, response);
      toast({
        title: "✅ سفارش تایید شد",
        description: "پرداخت تایید شد و سفارش به واحد انبار منتقل شد"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/order-management/financial'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial/orders'] });
      setDialogOpen(false);
      setOrderDetailsModalOpen(false); // Close both modals
      setSelectedOrder(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      console.error(`❌ [FINANCE] Approve error:`, error);
      toast({
        title: "خطا در تایید",
        description: error.message || "امکان تایید سفارش وجود ندارد",
        variant: "destructive"
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: number; notes: string }) => {
      console.log(`🔄 [FINANCE] Sending reject request for order ${orderId}`);
      return apiRequest(`/api/finance/orders/${orderId}/reject`, {
        method: 'POST',
        body: { notes }
      });
    },
    onSuccess: (response) => {
      console.log(`❌ [FINANCE] Order rejected successfully:`, response);
      toast({
        title: "❌ سفارش رد شد",
        description: "پرداخت رد شد و به قسمت سفارشات رد شده منتقل شد"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/order-management/financial'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial/orders'] });
      setDialogOpen(false);
      setOrderDetailsModalOpen(false); // Close both modals
      setSelectedOrder(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      console.error(`❌ [FINANCE] Reject error:`, error);
      toast({
        title: "خطا در رد سفارش",
        description: error.message || "امکان رد سفارش وجود ندارد",
        variant: "destructive"
      });
    }
  });

  // Process pending bank gateway payments
  const processPendingBankPayments = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/admin/orders/process-pending-bank-payments', {
        method: 'POST'
      });
    },
    onSuccess: (response) => {
      toast({
        title: "پردازش خودکار انجام شد",
        description: `${response.data?.processed} سفارش از ${response.data?.totalFound} سفارش پردازش شد`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/financial/orders'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در پردازش خودکار",
        description: error.message || "امکان پردازش سفارشات وجود ندارد",
        variant: "destructive"
      });
    }
  });

  // Generate tracking codes for order
  const generateTrackingCodes = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest(`/api/tracking/generate/${orderId}`, {
        method: 'POST'
      });
    },
    onSuccess: (response) => {
      toast({
        title: "کدهای ردیابی ایجاد شدند",
        description: `${response.trackingCodes?.length || 0} کد ردیابی برای کالاها ایجاد شد`
      });
      // loadTrackingCodes(selectedOrderForTracking?.customerOrderId);
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ایجاد کدهای ردیابی",
        description: error.message || "امکان ایجاد کدهای ردیابی وجود ندارد",
        variant: "destructive"
      });
    }
  });

  // Load tracking codes for order
  const loadTrackingCodes = async (orderId?: number) => {
    if (!orderId) return;
    
    try {
      const response = await apiRequest(`/api/tracking/order/${orderId}`);
      // setTrackingCodes(response.trackingCodes || []);
    } catch (error) {
      console.error("Error loading tracking codes:", error);
    }
  };

  // Handle tracking modal open
  const handleTrackingModal = (order: OrderManagement) => {
    // setSelectedOrderForTracking(order);
    // setShowTrackingModal(true);
    // loadTrackingCodes(order.customerOrderId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'payment_uploaded':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">در انتظار بررسی مالی</Badge>;
      case 'financial_reviewing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">در حال بررسی</Badge>;
      case 'financial_approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700">تأیید شده</Badge>;
      case 'auto_approved':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700">تأیید خودکار درگاه</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleOrderReview = (order: OrderManagement) => {
    setSelectedOrder(order);
    setReviewNotes(order.financialNotes || "");
    setDialogOpen(true);
  };



  const handleApprove = () => {
    if (!selectedOrder) return;
    approveMutation.mutate({ 
      orderId: selectedOrder.customerOrderId, 
      notes: reviewNotes 
    });
  };

  const handleReject = () => {
    if (!selectedOrder) return;
    rejectMutation.mutate({ 
      orderId: selectedOrder.customerOrderId, 
      notes: reviewNotes 
    });
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageModalOpen(true);
  };

  // Handle accept order from order details modal
  const handleAcceptOrder = () => {
    if (!orderDetails || !selectedOrder) return;
    console.log('🔄 [FINANCE] Accepting order from modal - Management ID:', selectedOrder.id, 'Customer Order ID:', selectedOrder.customerOrderId);
    approveMutation.mutate({ 
      orderId: selectedOrder.customerOrderId, // FIXED: USE CUSTOMER ORDER ID FOR API
      notes: `سفارش تأیید شد از طریق مودال جزئیات - ${new Date().toLocaleDateString('en-US')}` 
    });
    // Don't close modal here - let the mutation success handler close it
  };

  // Handle reject order from order details modal  
  const handleRejectOrder = () => {
    if (!orderDetails || !selectedOrder) return;
    console.log('🔄 [FINANCE] Rejecting order from modal - Management ID:', selectedOrder.id, 'Customer Order ID:', selectedOrder.customerOrderId);
    rejectMutation.mutate({ 
      orderId: selectedOrder.customerOrderId, // FIXED: USE CUSTOMER ORDER ID FOR API
      notes: `سفارش رد شد از طریق مودال جزئیات - ${new Date().toLocaleDateString('en-US')}` 
    });
    // Don't close modal here - let the mutation success handler close it
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">در حال بارگذاری...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
                  واحد مالی
                </h1>
                <p className="text-gray-600 mt-1">مدیریت و بررسی پرداخت‌های دریافتی</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button 
                onClick={processPendingBankPayments.mutate}
                disabled={processPendingBankPayments.isPending}
                className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Timer className={`h-4 w-4 ${processPendingBankPayments.isPending ? 'animate-spin' : ''}`} />
                <span>پردازش خودکار درگاه</span>
              </Button>
              <Button 
                onClick={() => refetch()}
                variant="outline"
                className="flex items-center space-x-2 space-x-reverse"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>تازه‌سازی</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">کل سفارشات</p>
                  <p className="text-3xl font-bold text-white">{allOrders.length}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">در انتظار بررسی</p>
                  <p className="text-3xl font-bold text-white">{pendingOrders.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">تایید شده</p>
                  <p className="text-3xl font-bold text-white">{transferredOrders.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">مجموع مبالغ</p>
                  <p className="text-2xl font-bold text-white">
                    {totalAmount.toLocaleString()} IQD
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="جستجو بر اساس نام مشتری، ایمیل یا شماره سفارش..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 px-3 border rounded-md bg-white"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="pending_payment">در انتظار پرداخت</option>
                  <option value="payment_uploaded">فیش آپلود شده</option>
                  <option value="financial_reviewing">در حال بررسی</option>
                  <option value="financial_approved">تایید شده</option>
                  <option value="financial_rejected">رد شده</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm border rounded-lg p-1">
            <TabsTrigger value="pending" className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Clock className="h-4 w-4" />
              <span>در انتظار بررسی ({pendingOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="transferred" className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <ChevronRight className="h-4 w-4" />
              <span>ارجاع شده به انبار ({filteredTransferredOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <XCircle className="h-4 w-4" />
              <span>رد شده ({rejectedOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="orphan" className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <AlertTriangle className="h-4 w-4" />
              <span>سفارشات موقت ({orphanStats?.stats?.active || 0})</span>
            </TabsTrigger>

          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">همه سفارشات بررسی شده</h3>
                  <p className="text-gray-500">در حال حاضر سفارش جدیدی برای بررسی وجود ندارد</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onOrderSelect={() => {
                    setSelectedOrder(order);
                    setDialogOpen(true);
                  }} fetchOrderDetails={fetchOrderDetails} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transferred" className="space-y-4">
            {filteredTransferredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ChevronRight className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">سفارشی به انبار ارجاع نشده</h3>
                  <p className="text-gray-500">در حال حاضر سفارش تایید شده‌ای که به انبار ارجاع شده باشد وجود ندارد</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTransferredOrders.map((order) => (
                  <TransferredOrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ سفارش رد شده‌ای وجود ندارد</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rejectedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} readOnly fetchOrderDetails={fetchOrderDetails} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orphan Orders Tab */}
          <TabsContent value="orphan" className="space-y-6">
            <div className="space-y-6">
              {/* Statistics Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    مدیریت سفارشات موقت (Grace Period Orders)
                  </CardTitle>
                  <CardDescription>
                    سفارشات با مهلت 3 روزه پرداخت و سیستم اطلاع‌رسانی خودکار
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="border-amber-200 bg-amber-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Timer className="h-5 w-5 text-amber-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">فعال</p>
                            <p className="text-xl font-bold text-amber-600">{orphanStats?.stats?.active || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">منقضی شده</p>
                            <p className="text-xl font-bold text-red-600">{orphanStats?.stats?.expired || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Bell className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">اطلاع‌رسانی امروز</p>
                            <p className="text-xl font-bold text-blue-600">{orphanStats?.stats?.notificationsToday || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">پرداخت شده</p>
                            <p className="text-xl font-bold text-green-600">{orphanStats?.stats?.paid || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Notification Management Tabs */}
                  <Tabs defaultValue="active-orders" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="active-orders">سفارشات فعال</TabsTrigger>
                      <TabsTrigger value="notifications">تنظیمات اطلاع‌رسانی</TabsTrigger>
                      <TabsTrigger value="templates">قالب‌های پیام</TabsTrigger>
                      <TabsTrigger value="schedule">برنامه‌ریزی ارسال</TabsTrigger>
                    </TabsList>

                    {/* Active Grace Period Orders */}
                    <TabsContent value="active-orders" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            سفارشات در مهلت 3 روزه
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {activeOrders?.orders?.length > 0 ? (
                              activeOrders.orders.map((order: any) => (
                                <Card key={order.id} className="border-l-4 border-l-amber-500">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <span className="font-medium">سفارش #{order.orderNumber}</span>
                                        <Badge className="bg-amber-100 text-amber-800">مهلت فعال</Badge>
                                        <span className="text-sm text-muted-foreground">
                                          {order.totalAmount} {order.currency}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-red-600 font-medium">
                                          باقی‌مانده: {Math.floor(order.hoursRemaining / 24)} روز {order.hoursRemaining % 24} ساعت
                                        </span>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => sendReminderMutation.mutate({
                                            orderId: order.id,
                                            type: 'sms'
                                          })}
                                          disabled={sendReminderMutation.isPending}
                                        >
                                          <Bell className="h-4 w-4 mr-1" />
                                          ارسال یادآور
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <span className="font-medium">نام مشتری:</span>
                                        <span>{order.customerName || order.customer?.firstName} {order.customer?.lastName}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <Phone className="h-4 w-4" />
                                        <span>{order.customerPhone || order.customer?.phone}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <Mail className="h-4 w-4" />
                                        <span>{order.customerEmail || order.customer?.email}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-red-600">
                                        <Calendar className="h-4 w-4" />
                                        <span>انقضا: {new Date(order.gracePeriodExpires).toLocaleDateString('fa-IR')}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                هیچ سفارش فعالی در مهلت 3 روزه یافت نشد
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Notification Settings */}
                    <TabsContent value="notifications" className="space-y-4">
                      <NotificationSettingsManager 
                        notificationSettings={notificationSettings}
                        onSettingsUpdate={() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/orphan-orders/notification-settings'] });
                        }}
                      />
                    </TabsContent>

                    {/* Message Templates */}
                    <TabsContent value="templates" className="space-y-4">
                      <MessageTemplatesManager 
                        templates={templatesData}
                        onTemplateUpdate={() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/orphan-orders/templates'] });
                        }}
                      />
                    </TabsContent>

                    {/* Schedule */}
                    <TabsContent value="schedule" className="space-y-4">
                      <ScheduleManager 
                        schedules={schedulesData}
                        notificationSettings={notificationSettings}
                      />
                    </TabsContent>


                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </TabsContent>


        </Tabs>
        
        {/* Review Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>بررسی پرداخت سفارش {selectedOrder?.orderNumber}</DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">نام مشتری</Label>
                    <p className="font-medium">{getCustomerInfo(selectedOrder).firstName} {getCustomerInfo(selectedOrder).lastName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">ایمیل</Label>
                    <p className="font-medium">{getCustomerInfo(selectedOrder).email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">تلفن</Label>
                    <p className="font-medium">{getCustomerInfo(selectedOrder).phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">مبلغ کل</Label>
                    <p className="font-medium text-green-600">{parseFloat(selectedOrder.totalAmount).toLocaleString()} {selectedOrder.currency}</p>
                  </div>
                </div>

                {selectedOrder.receiptUrl && (
                  <div className="border rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-600 mb-2 block">فیش بانکی</Label>
                    <div className="flex items-center gap-4">
                      <img 
                        src={selectedOrder.receiptUrl} 
                        alt="Bank Receipt" 
                        className="w-32 h-32 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => openImageModal(selectedOrder.receiptUrl!)}
                      />
                      <div className="flex-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openImageModal(selectedOrder.receiptUrl!)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          مشاهده بزرگ
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="reviewNotes" className="text-sm font-medium">یادداشت بررسی</Label>
                  <Textarea
                    id="reviewNotes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="یادداشت خود را برای این بررسی وارد کنید..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="flex justify-between gap-4 pt-4">
                  {selectedOrder.currentStatus === 'auto_approved' ? (
                    <div className="flex items-center justify-center p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-emerald-600 mr-2" />
                      <span className="text-emerald-700 font-medium">
                        این سفارش به صورت خودکار از طریق درگاه بانکی تأیید شده است
                      </span>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={rejectMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        {rejectMutation.isPending ? 'در حال رد...' : 'رد پرداخت'}
                      </Button>
                      <Button
                        onClick={handleApprove}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {approveMutation.isPending ? 'در حال تایید...' : 'تایید پرداخت'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Order Details Modal */}
        <Dialog open={orderDetailsModalOpen} onOpenChange={setOrderDetailsModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                جزئیات کامل سفارش {orderDetails?.orderNumber}
              </DialogTitle>
            </DialogHeader>
            
            {orderDetails && (
              <div className="space-y-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      اطلاعات مشتری
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">نام مشتری</Label>
                        <p className="font-medium">{orderDetails.customer?.firstName} {orderDetails.customer?.lastName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">ایمیل</Label>
                        <p className="font-medium">{orderDetails.customer?.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">تلفن</Label>
                        <p className="font-medium">{orderDetails.customer?.phone}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">آدرس</Label>
                        <p className="font-medium">{orderDetails.customer?.address}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">شهر</Label>
                        <p className="font-medium">{orderDetails.customer?.city}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">استان</Label>
                        <p className="font-medium">{orderDetails.customer?.province}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      اقلام سفارش ({orderDetails.items?.length || 0} قلم)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {orderDetails.items && orderDetails.items.length > 0 ? (
                        orderDetails.items.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 font-bold">{Math.floor(parseFloat(item.quantity || 0))}</span>
                              </div>
                              <div>
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-sm text-gray-600">قیمت واحد: {Math.floor(parseFloat(item.unitPrice || 0)).toLocaleString()} {orderDetails.currency}</p>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-green-600">
                                {Math.floor(parseFloat(item.totalPrice || 0)).toLocaleString()} {orderDetails.currency}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                          </div>
                          <p className="text-red-700 font-medium">⚠️ سفارش معیوب: بدون آیتم اما دارای مبلغ</p>
                          <p className="text-sm text-red-600 mt-1">این سفارش دارای مبلغ {Math.floor(parseFloat(orderDetails.totalAmount || 0)).toLocaleString()} {orderDetails.currency} است اما هیچ آیتمی ندارد</p>
                          <p className="text-xs text-red-500 mt-2">احتمالاً در فرآیند ثبت سفارش مشکلی پیش آمده است</p>
                          {Math.floor(parseFloat(orderDetails.totalAmount || 0)) > 0 && (
                            <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-600">
                              <strong>توصیه:</strong> این سفارش نیاز به بررسی دقیق دارد. سفارش نباید بدون آیتم مبلغ داشته باشد.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      اطلاعات پرداخت
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Cost Breakdown */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-4">تفکیک هزینه‌ها</h4>
                        <div className="space-y-3">
                          {/* Items Subtotal */}
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">مجموع اقلام:</span>
                            <span className="font-medium">
                              {(() => {
                                const itemsTotal = orderDetails.items?.reduce((sum: number, item: any) => 
                                  sum + parseFloat(item.totalPrice || 0), 0) || 0;
                                return Math.floor(itemsTotal).toLocaleString();
                              })()} {orderDetails.currency}
                            </span>
                          </div>
                          
                          {/* Shipping Cost - Always show */}
                          <div className="flex justify-between items-center">
                            <span className="text-blue-600">هزینه حمل:</span>
                            <span className="font-medium text-blue-600">
                              {Math.floor(parseFloat(orderDetails.shippingCost || orderDetails.shipping_cost || 0)).toLocaleString()} {orderDetails.currency}
                            </span>
                          </div>
                          
                          {/* VAT - Only show if non-zero */}
                          {(parseFloat(orderDetails.vatAmount || orderDetails.vat_amount || 0) > 0) && (
                            <div className="flex justify-between items-center">
                              <span className="text-green-600">مالیات بر ارزش افزوده:</span>
                              <span className="font-medium text-green-600">
                                {Math.floor(parseFloat(orderDetails.vatAmount || orderDetails.vat_amount || 0)).toLocaleString()} {orderDetails.currency}
                              </span>
                            </div>
                          )}
                          
                          {/* Total with separator */}
                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-lg text-gray-900">مجموع کل:</span>
                              <span className="font-bold text-lg text-green-600">
                                {Math.floor(parseFloat(orderDetails.totalAmount)).toLocaleString()} {orderDetails.currency}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Status & Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">وضعیت پرداخت</Label>
                          <Badge className="mt-1">{orderDetails.currentStatus}</Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">تاریخ سفارش</Label>
                          <p className="font-medium">
                            {new Date(orderDetails.createdAt).toLocaleDateString('en-US')}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">آخرین بروزرسانی</Label>
                          <p className="font-medium">
                            {new Date(orderDetails.updatedAt).toLocaleDateString('en-US')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Documents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      مدارک ارسالی مشتری
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // Collect all available documents
                      const allDocuments = [];
                      
                      // Use orderDocuments state that gets populated from fetchOrderDetails
                      if (orderDocuments && Array.isArray(orderDocuments) && orderDocuments.length > 0) {
                        allDocuments.push(...orderDocuments);
                      }
                      
                      // Fallback: Add documents from orderDetails.documents array if exists
                      if (orderDetails.documents && Array.isArray(orderDetails.documents) && orderDetails.documents.length > 0) {
                        allDocuments.push(...orderDetails.documents);
                      }
                      
                      // Fallback: Add bank receipt from selectedOrder if no documents found
                      if (allDocuments.length === 0 && selectedOrder?.receiptUrl) {
                        allDocuments.push({
                          id: 'bank_receipt',
                          type: 'payment_receipt',
                          description: 'فیش واریز بانکی',
                          receiptUrl: selectedOrder.receiptUrl,
                          fileName: 'فیش بانکی',
                          uploadedAt: orderDetails.updatedAt || orderDetails.createdAt
                        });
                      }
                      
                      return allDocuments.length > 0 ? (
                        <div className="space-y-3">
                          {allDocuments.map((doc: any, index: number) => (
                            <div key={doc.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {doc.description || doc.fileName || 'مدرک ارسالی'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(doc.uploadedAt).toLocaleDateString('en-US')} 
                                    {doc.fileName && ` • ${doc.fileName}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {doc.type === 'payment_receipt' ? 'فیش بانکی' : doc.type}
                                </Badge>
                                {doc.receiptUrl && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.open(doc.receiptUrl, '_blank')}
                                    className="h-8 px-3"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    مشاهده
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>هیچ مدرک اضافی ارسال نشده است</p>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      عملیات تأیید سفارش
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 justify-center">
                      {orderDetails.currentStatus === 'auto_approved' ? (
                        <div className="col-span-2 flex items-center justify-center p-6 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <CheckCircle className="h-8 w-8 text-emerald-600 mr-3" />
                          <div className="text-center">
                            <p className="text-lg font-bold text-emerald-700">تأیید خودکار درگاه بانکی</p>
                            <p className="text-sm text-emerald-600 mt-1">این سفارش خودکار تأیید شده و به انبار ارسال گردیده</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button 
                            onClick={handleAcceptOrder}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                            disabled={orderDetails.currentStatus === 'financial_approved' || orderDetails.currentStatus === 'warehouse_pending'}
                          >
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                            قبول سفارش
                          </Button>
                          <Button 
                            onClick={handleRejectOrder}
                            variant="destructive"
                            className="px-8 py-3 text-lg"
                            disabled={orderDetails.currentStatus === 'financial_rejected'}
                          >
                            <XCircle className="h-5 w-5 mr-2" />
                            رد سفارش
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 text-center">
                        پس از تأیید، سفارش به بخش انبارداری ارسال می‌شود
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Modal */}
        <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>مشاهده فیش بانکی</DialogTitle>
            </DialogHeader>
            {selectedImageUrl && (
              <div className="flex justify-center">
                <img 
                  src={selectedImageUrl} 
                  alt="Bank Receipt Full Size" 
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// OrderCard Component
interface OrderCardProps {
  order: OrderManagement;
  onOrderSelect?: () => void;
  readOnly?: boolean;
  fetchOrderDetails?: (orderNumber: string) => void;
}

function OrderCard({ order, onOrderSelect, readOnly = false, fetchOrderDetails }: OrderCardProps) {
  const customerInfo = getCustomerInfo(order);
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending_payment':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'payment_uploaded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'financial_reviewing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'financial_approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'financial_rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pending':
        return 'در انتظار';
      case 'pending_payment':
        return 'در انتظار پرداخت';
      case 'payment_uploaded':
        return 'فیش پرداخت آپلود شده';
      case 'financial_reviewing':
        return 'در حال بررسی مالی';
      case 'financial_approved':
        return 'تایید شده';
      case 'financial_rejected':
        return 'رد شده';
      default:
        return status;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">سفارش {order.orderNumber || 'در حال بارگذاری...'}</h3>
              <p className="text-sm text-gray-600">{customerInfo.firstName} {customerInfo.lastName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <Badge className={`border ${getStatusBadgeColor(order.currentStatus)}`}>
              {getStatusDisplayName(order.currentStatus)}
            </Badge>
            <div className="text-left">
              <p className="font-bold text-lg text-green-600">
                {parseFloat(order.totalAmount).toLocaleString()} {order.currency}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{order.customer?.email}</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{order.customer?.phone}</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {new Date(order.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {order.receiptUrl && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Receipt className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">فیش بانکی ارسال شده</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                نیاز به بررسی
              </Badge>
            </div>
          </div>
        )}

        {order.financialNotes && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">یادداشت مالی:</p>
            <p className="text-sm text-gray-600">{order.financialNotes}</p>
          </div>
        )}

        {!readOnly && (
          <div className="flex justify-end gap-2">
            {fetchOrderDetails && order.orderNumber && (
              <Button 
                onClick={() => fetchOrderDetails(order.orderNumber)}
                size="sm"
                variant="outline"
                className="flex items-center space-x-2 space-x-reverse"
              >
                <FileText className="h-4 w-4" />
                <span>مشاهده جزئیات</span>
              </Button>
            )}
            <Button 
              onClick={onOrderSelect}
              size="sm"
              className="flex items-center space-x-2 space-x-reverse"
            >
              <Eye className="h-4 w-4" />
              <span>بررسی و تایید</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// TransferredOrderCard Component for approved orders sent to warehouse
interface TransferredOrderCardProps {
  order: OrderManagement;
}

function TransferredOrderCard({ order }: TransferredOrderCardProps) {
  const customerInfo = getCustomerInfo(order);
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'warehouse_pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warehouse_notified':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'warehouse_processing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'warehouse_approved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'warehouse_pending':
        return 'در انتظار بررسی انبار';
      case 'warehouse_notified':
        return 'اطلاع رسانی انبار';
      case 'warehouse_processing':
        return 'در حال پردازش انبار';
      case 'warehouse_approved':
        return 'تایید نهایی انبار';
      default:
        return status;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChevronRight className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">سفارش {order.orderNumber || 'در حال بارگذاری...'}</h3>
              <p className="text-sm text-gray-600">{customerInfo.firstName} {customerInfo.lastName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <Badge className={`border ${getStatusBadgeColor(order.currentStatus)}`}>
              {getStatusDisplayName(order.currentStatus)}
            </Badge>
            <div className="text-left">
              <p className="font-bold text-lg text-green-600">
                {parseFloat(order.totalAmount).toLocaleString()} {order.currency}
              </p>
              <p className="text-xs text-gray-500">
                تایید مالی: {order.financialReviewedAt && new Date(order.financialReviewedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{order.customer?.email}</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{order.customer?.phone}</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              بروزرسانی: {new Date(order.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">تایید شده توسط بخش مالی</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              ارجاع شده به انبار
            </Badge>
          </div>
        </div>

        {order.financialNotes && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">یادداشت مالی:</p>
            <p className="text-sm text-gray-600">{order.financialNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Notification Settings Manager Component
interface NotificationSettingsManagerProps {
  notificationSettings: any;
  onSettingsUpdate: () => void;
}

function NotificationSettingsManager({ notificationSettings, onSettingsUpdate }: NotificationSettingsManagerProps) {
  const [settings, setSettings] = useState({
    notification_type: 'both',
    trigger_hours_before_expiry: [72, 48, 24, 12, 6],
    is_enabled: true,
    max_notifications_per_order: 5,
    notification_interval_hours: 12,
    send_to_admin: true,
    admin_notification_types: ['email']
  });

  const { toast } = useToast();

  useEffect(() => {
    if (notificationSettings?.settings) {
      setSettings(notificationSettings.settings);
    }
  }, [notificationSettings]);

  const updateSettings = useMutation({
    mutationFn: async (newSettings: any) => {
      return apiRequest('/api/orphan-orders/notification-settings', {
        method: 'PUT',
        body: newSettings
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ تنظیمات ذخیره شد",
        description: "تنظیمات اطلاع‌رسانی با موفقیت بروزرسانی شد"
      });
      onSettingsUpdate();
    },
    onError: () => {
      toast({
        title: "❌ خطا در ذخیره",
        description: "خطا در بروزرسانی تنظیمات اطلاع‌رسانی",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    updateSettings.mutate(settings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          تنظیمات کلی اطلاع‌رسانی
        </CardTitle>
        <CardDescription>
          مدیریت تنظیمات اطلاع‌رسانی خودکار برای سفارشات موقت
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>نوع اطلاع‌رسانی</Label>
            <select
              value={settings.notification_type}
              onChange={(e) => setSettings({ ...settings, notification_type: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="sms">پیامک</option>
              <option value="email">ایمیل</option>
              <option value="both">هر دو</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>حداکثر تعداد یادآور</Label>
            <Input
              type="number"
              value={settings.max_notifications_per_order}
              onChange={(e) => setSettings({ ...settings, max_notifications_per_order: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>فاصله زمانی بین یادآورها (ساعت)</Label>
            <Input
              type="number"
              value={settings.notification_interval_hours}
              onChange={(e) => setSettings({ ...settings, notification_interval_hours: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.is_enabled}
                onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
              />
              فعال‌سازی سیستم اطلاع‌رسانی
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>زمان‌های یادآوری (ساعت قبل از انقضا)</Label>
          <div className="flex flex-wrap gap-2">
            {[72, 48, 24, 12, 6, 3, 1].map((hour) => (
              <label key={hour} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={settings.trigger_hours_before_expiry?.includes(hour)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSettings({
                        ...settings,
                        trigger_hours_before_expiry: [...(settings.trigger_hours_before_expiry || []), hour].sort((a, b) => b - a)
                      });
                    } else {
                      setSettings({
                        ...settings,
                        trigger_hours_before_expiry: settings.trigger_hours_before_expiry?.filter(h => h !== hour) || []
                      });
                    }
                  }}
                />
                <span className="text-sm">{hour}h</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={updateSettings.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updateSettings.isPending ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Message Templates Manager Component
interface MessageTemplatesManagerProps {
  templates: any;
  onTemplateUpdate: () => void;
}

function MessageTemplatesManager({ templates, onTemplateUpdate }: MessageTemplatesManagerProps) {
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    template_type: 'sms',
    subject: '',
    content: '',
    is_active: true,
    is_default: false
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { toast } = useToast();

  const createTemplate = useMutation({
    mutationFn: async (template: any) => {
      return apiRequest('/api/orphan-orders/templates', {
        method: 'POST',
        body: template
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ قالب ایجاد شد",
        description: "قالب پیام جدید با موفقیت ایجاد شد"
      });
      setNewTemplate({
        template_name: '',
        template_type: 'sms',
        subject: '',
        content: '',
        is_active: true,
        is_default: false
      });
      setShowCreateForm(false);
      onTemplateUpdate();
    }
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, template }: { id: number; template: any }) => {
      return apiRequest(`/api/orphan-orders/templates/${id}`, {
        method: 'PUT',
        body: template
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ قالب بروزرسانی شد",
        description: "قالب پیام با موفقیت بروزرسانی شد"
      });
      setEditingTemplate(null);
      onTemplateUpdate();
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/orphan-orders/templates/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ قالب حذف شد",
        description: "قالب پیام با موفقیت حذف شد"
      });
      onTemplateUpdate();
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            قالب‌های پیام
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            size="sm"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            قالب جدید
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreateForm && (
          <Card className="border-green-200">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>نام قالب</Label>
                  <Input
                    value={newTemplate.template_name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, template_name: e.target.value })}
                    placeholder="نام قالب پیام"
                  />
                </div>
                <div>
                  <Label>نوع قالب</Label>
                  <select
                    value={newTemplate.template_type}
                    onChange={(e) => setNewTemplate({ ...newTemplate, template_type: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="sms">پیامک</option>
                    <option value="email">ایمیل</option>
                  </select>
                </div>
              </div>
              {newTemplate.template_type === 'email' && (
                <div>
                  <Label>موضوع ایمیل</Label>
                  <Input
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    placeholder="موضوع ایمیل"
                  />
                </div>
              )}
              <div>
                <Label>متن پیام</Label>
                <Textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="متن پیام با متغیرها مانند {{customer_name}}, {{order_number}}"
                  rows={4}
                />
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTemplate.is_default}
                    onChange={(e) => setNewTemplate({ ...newTemplate, is_default: e.target.checked })}
                  />
                  <Label>قالب پیش‌فرض</Label>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    انصراف
                  </Button>
                  <Button 
                    onClick={() => createTemplate.mutate(newTemplate)}
                    disabled={createTemplate.isPending}
                  >
                    ایجاد قالب
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {templates?.templates?.map((template: any) => (
            <Card key={template.id} className={`${template.is_default ? 'border-blue-200 bg-blue-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{template.template_name}</h4>
                      <Badge variant={template.template_type === 'email' ? 'default' : 'secondary'}>
                        {template.template_type === 'email' ? 'ایمیل' : 'پیامک'}
                      </Badge>
                      {template.is_default && (
                        <Badge className="bg-blue-100 text-blue-800">پیش‌فرض</Badge>
                      )}
                      {!template.is_active && (
                        <Badge variant="destructive">غیرفعال</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.content}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTemplate.mutate(template.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Schedule Manager Component
interface ScheduleManagerProps {
  schedules: any;
  notificationSettings: any;
}

function ScheduleManager({ schedules, notificationSettings }: ScheduleManagerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          برنامه‌ریزی ارسال یادآورها
        </CardTitle>
        <CardDescription>
          مدیریت زمان‌بندی خودکار ارسال یادآورها
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">بررسی روزانه</h4>
                <Badge className="bg-green-100 text-green-800">فعال</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                بررسی روزانه سفارشات در مهلت 3 روزه
              </p>
              <div className="text-xs text-gray-500">
                آخرین اجرا: {new Date().toLocaleDateString('en-US')} - {new Date().toLocaleTimeString('en-US')}
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">هشدارهای فوری</h4>
                <Badge className="bg-amber-100 text-amber-800">فعال</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                ارسال هشدار برای سفارشات نزدیک به انقضا
              </p>
              <div className="text-xs text-gray-500">
                آخرین اجرا: {new Date().toLocaleDateString('en-US')} - {new Date().toLocaleTimeString('en-US')}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">تنظیمات فعلی برنامه‌ریزی</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-xs text-gray-600">زمان‌های یادآوری</Label>
                <p className="font-medium">
                  {notificationSettings?.settings?.trigger_hours_before_expiry?.join(', ') || '72, 48, 24, 12, 6'} ساعت قبل
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">فاصله بین یادآورها</Label>
                <p className="font-medium">
                  {notificationSettings?.settings?.notification_interval_hours || 12} ساعت
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">حداکثر یادآور</Label>
                <p className="font-medium">
                  {notificationSettings?.settings?.max_notifications_per_order || 5} پیام
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

export default FinanceOrders;
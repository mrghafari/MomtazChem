import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  AlertCircle,
  Activity,
  BarChart3,
  Wrench,
  Upload,
  HelpCircle,
  Printer,
  ImageIcon,
  MapPinIcon,
  User,
  Package,
  FileIcon,
  MoreHorizontal,
  Check,
  X
} from "lucide-react";
import InternalBarcodeCard from "@/components/InternalBarcodeCard";
import GlobalRefreshControl from "@/components/GlobalRefreshControl";

import { useToast } from "@/hooks/use-toast";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { formatCurrency } from "@/lib/utils";
import PaymentMethodBadge from "@/components/PaymentMethodBadge";
import { format } from "date-fns";

// Safe date formatting function to prevent Invalid Date errors
const formatDateSafe = (dateString: string | null | undefined, locale = 'en-US', options = {}): string => {
  if (!dateString) return 'تاریخ نامشخص';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'تاریخ نامعتبر';
    
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    });
  } catch (error) {
    return 'خطا در تاریخ';
  }
};

interface OrderManagement {
  id: number;
  customerOrderId: number;
  orderNumber?: string;
  currentStatus: string;
  totalAmount: string;
  currency: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentReceiptUrl?: string;
  financialNotes?: string;
  financialReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string;
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
  financialReviewerId?: number;
  deliveryCode?: string;
  shippingAddress?: any;
  billingAddress?: any;
  manuallyApproved?: boolean;
  graceStartTime?: string;
  gracePeriodEnd?: string;
  walletUsed?: number;
  remainingAmount?: number;
  orderItems?: Array<{
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    sku?: string;
    barcode?: string;
  }>;
}

function FinanceOrders() {
  // All hooks declared at the top level first
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<OrderManagement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [receiptAmount, setReceiptAmount] = useState("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("pending");
  const [orderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [orderDocuments, setOrderDocuments] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");
  const [showPartialDialog, setShowPartialDialog] = useState(false);
  
  // All query hooks at the top level
  const { data: adminUser, isLoading: isCheckingAuth } = useQuery({
    queryKey: ['/api/admin/me'],
    queryFn: () => fetch('/api/admin/me', { credentials: 'include' }).then(res => res.json()),
    retry: false,
    staleTime: 0,
  });

  const { orderCount } = useOrderNotifications({
    department: 'financial',
    enabled: adminUser?.success || false
  });

  const { data: ordersResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/financial/orders'],
    queryFn: () => fetch('/api/financial/orders', { credentials: 'include' }).then(res => res.json()),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const { data: approvedOrdersResponse, isLoading: isLoadingApproved, refetch: refetchApproved } = useQuery({
    queryKey: ['/api/financial/approved-orders'],
    queryFn: async () => {
      const res = await fetch('/api/financial/approved-orders', { credentials: 'include' });
      const data = await res.json();
      return data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  // All mutations at the top level
  const approveOrderMutation = useMutation({
    mutationFn: async ({ orderId, notes, amount }: { orderId: number; notes: string; amount?: string }) => {
      const payload: any = { orderId, notes };
      if (amount) payload.amount = amount;
      
      return await apiRequest('/api/financial/approve', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "سفارش با موفقیت تایید شد",
        variant: "default",
      });
      refetch();
      refetchApproved();
      setDialogOpen(false);
      setShowPartialDialog(false);
      setPartialAmount("");
      setReviewNotes("");
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در تایید سفارش",
        variant: "destructive",
      });
    },
  });

  const rejectOrderMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: number; notes: string }) => {
      return await apiRequest('/api/financial/reject', {
        method: 'POST',
        body: JSON.stringify({ orderId, notes }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "سفارش رد شد",
        variant: "default",
      });
      refetch();
      setDialogOpen(false);
      setReviewNotes("");
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در رد سفارش",
        variant: "destructive",
      });
    },
  });

  // Conditional rendering AFTER all hooks
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>بررسی احراز هویت...</p>
        </div>
      </div>
    );
  }

  if (!adminUser || !adminUser.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              دسترسی محدود
            </CardTitle>
            <CardDescription className="text-center">
              برای دسترسی به بخش مالی، ابتدا وارد حساب مدیریت شوید
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-sm text-gray-600">
              شما با حساب مشتری وارد شده‌اید. لطفاً از حساب مدیریت استفاده کنید.
            </p>
            <Button 
              onClick={() => window.location.href = '/admin/login'} 
              className="w-full"
            >
              ورود به حساب مدیریت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allOrders: OrderManagement[] = ordersResponse?.orders || [];
  const transferredOrders: OrderManagement[] = Array.isArray(approvedOrdersResponse) 
    ? approvedOrdersResponse 
    : (approvedOrdersResponse?.orders || []);

  // Filter orders based on search and status
  const filteredOrders = allOrders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.customerOrderId.toString().includes(searchTerm) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.customerFirstName} ${order.customerLastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.currentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleApproveOrder = (order: OrderManagement) => {
    setSelectedOrder(order);
    if (order.walletUsed && parseFloat(order.totalAmount) > (order.walletUsed || 0)) {
      setShowPartialDialog(true);
    } else {
      setDialogOpen(true);
    }
  };

  const handleViewDetails = async (order: OrderManagement) => {
    try {
      const response = await fetch(`/api/orders/${order.customerOrderId}/details`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setOrderDetails(data.order);
        setOrderDocuments(data.documents || []);
        setOrderDetailsModalOpen(true);
      } else {
        toast({
          title: "خطا",
          description: "خطا در دریافت جزئیات سفارش",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در دریافت جزئیات سفارش",
        variant: "destructive",
      });
    }
  };

  const renderStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string }> = {
      'pending_financial_review': { label: 'در انتظار بررسی مالی', variant: 'secondary' },
      'pending_payment': { label: 'در انتظار پرداخت', variant: 'destructive' },
      'payment_verified': { label: 'پرداخت تایید شده', variant: 'default' },
      'approved': { label: 'تایید شده', variant: 'default' },
      'rejected': { label: 'رد شده', variant: 'destructive' },
      'processing': { label: 'در حال پردازش', variant: 'secondary' },
      'shipped': { label: 'ارسال شده', variant: 'default' },
      'delivered': { label: 'تحویل داده شده', variant: 'default' },
    };

    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              سفارشات مالی
              {orderCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {orderCount} جدید
                </Badge>
              )}
            </h1>
            <p className="text-gray-600">مدیریت و بررسی سفارشات در انتظار تایید مالی</p>
          </div>
          <div className="flex items-center gap-4">
            <GlobalRefreshControl />
            <Button
              onClick={() => {
                refetch();
                refetchApproved();
              }}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              بروزرسانی
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل مبلغ سفارشات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  allOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0),
                  allOrders[0]?.currency || 'IQD'
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                در انتظار بررسی مالی
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">سفارشات در انتظار</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allOrders.length}</div>
              <p className="text-xs text-muted-foreground">
                نیاز به بررسی
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">سفارشات تایید شده</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transferredOrders.length}</div>
              <p className="text-xs text-muted-foreground">
                منتقل شده به انبار
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">میانگین مبلغ</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  allOrders.length > 0 
                    ? allOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0) / allOrders.length
                    : 0,
                  allOrders[0]?.currency || 'IQD'
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                به ازای هر سفارش
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="جستجو بر اساس شماره سفارش، نام مشتری یا ایمیل..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="pending_financial_review">در انتظار بررسی مالی</option>
                  <option value="pending_payment">در انتظار پرداخت</option>
                  <option value="payment_verified">پرداخت تایید شده</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Different Views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              در انتظار بررسی ({filteredOrders.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              تایید شده ({transferredOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>سفارشات در انتظار بررسی مالی</CardTitle>
                <CardDescription>
                  سفارشات نیازمند بررسی و تایید مالی
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="h-8 w-8 animate-spin" />
                    <span className="mr-2">در حال بارگذاری...</span>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">هیچ سفارشی یافت نشد</h3>
                    <p className="text-gray-500">در حال حاضر سفارشی برای بررسی مالی وجود ندارد</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-medium text-lg">
                                سفارش #{order.customerOrderId}
                              </span>
                              {renderStatusBadge(order.currentStatus)}
                              {order.paymentMethod && (
                                <PaymentMethodBadge method={order.paymentMethod} />
                              )}
                              {order.manuallyApproved && (
                                <Badge variant="default" className="bg-blue-100 text-blue-800">
                                  تایید دستی
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">مشتری:</span>
                                <span className="font-medium">
                                  {order.customerName || `${order.customerFirstName} ${order.customerLastName}`}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">مبلغ:</span>
                                <span className="font-medium text-green-600">
                                  {formatCurrency(parseFloat(order.totalAmount), order.currency)}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">تاریخ:</span>
                                <span>{formatDateSafe(order.createdAt)}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">ایمیل:</span>
                                <span className="text-xs">{order.customerEmail}</span>
                              </div>
                            </div>

                            {order.walletUsed && order.walletUsed > 0 && (
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 text-sm">
                                  <Wallet className="h-4 w-4 text-blue-600" />
                                  <span className="text-blue-800 font-medium">پرداخت ترکیبی:</span>
                                </div>
                                <div className="mt-2 space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>مبلغ کیف پول:</span>
                                    <span className="font-medium text-blue-600">
                                      {formatCurrency(order.walletUsed, order.currency)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>مبلغ باقیمانده:</span>
                                    <span className="font-medium text-orange-600">
                                      {formatCurrency(order.remainingAmount || 0, order.currency)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {order.gracePeriodEnd && (
                              <div className="bg-orange-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-orange-800">
                                  <Timer className="h-4 w-4" />
                                  <span className="font-medium">مهلت پرداخت:</span>
                                  <span>{formatDateSafe(order.gracePeriodEnd)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              جزئیات
                            </Button>
                            
                            {order.receiptUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedImageUrl(order.receiptUrl!);
                                  setImageModalOpen(true);
                                }}
                                className="gap-1"
                              >
                                <Receipt className="h-4 w-4" />
                                رسید
                              </Button>
                            )}
                            
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApproveOrder(order)}
                              className="gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              بررسی
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>سفارشات تایید شده</CardTitle>
                <CardDescription>
                  سفارشات تایید شده و منتقل شده به انبار
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingApproved ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="h-8 w-8 animate-spin" />
                    <span className="mr-2">در حال بارگذاری...</span>
                  </div>
                ) : transferredOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">هیچ سفارش تایید شده‌ای یافت نشد</h3>
                    <p className="text-gray-500">سفارشات تایید شده در اینجا نمایش داده می‌شوند</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transferredOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-medium text-lg">
                                سفارش #{order.customerOrderId}
                              </span>
                              {renderStatusBadge(order.currentStatus)}
                              {order.paymentMethod && (
                                <PaymentMethodBadge method={order.paymentMethod} />
                              )}
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                تایید شده
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">مشتری:</span>
                                <span className="font-medium">
                                  {order.customerName || `${order.customerFirstName} ${order.customerLastName}`}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">مبلغ:</span>
                                <span className="font-medium text-green-600">
                                  {formatCurrency(parseFloat(order.totalAmount), order.currency)}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">تاریخ تایید:</span>
                                <span>{formatDateSafe(order.financialReviewedAt)}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">وضعیت:</span>
                                <span className="text-green-600 font-medium">منتقل به انبار</span>
                              </div>
                            </div>

                            {order.financialNotes && (
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                                  <MessageSquare className="h-4 w-4" />
                                  <span className="font-medium">یادداشت مالی:</span>
                                </div>
                                <p className="text-sm text-gray-600">{order.financialNotes}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                              className="gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              جزئیات
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>بررسی سفارش #{selectedOrder?.customerOrderId}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">مشتری:</span>
                  <span className="font-medium mr-2">
                    {selectedOrder.customerName || `${selectedOrder.customerFirstName} ${selectedOrder.customerLastName}`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">مبلغ:</span>
                  <span className="font-medium mr-2 text-green-600">
                    {formatCurrency(parseFloat(selectedOrder.totalAmount), selectedOrder.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">روش پرداخت:</span>
                  <span className="mr-2">
                    {selectedOrder.paymentMethod && (
                      <PaymentMethodBadge method={selectedOrder.paymentMethod} />
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">تاریخ سفارش:</span>
                  <span className="mr-2">{formatDateSafe(selectedOrder.createdAt)}</span>
                </div>
              </div>

              {selectedOrder.receiptUrl && (
                <div className="space-y-2">
                  <Label>رسید پرداخت</Label>
                  <div className="border rounded-lg p-4">
                    <img 
                      src={selectedOrder.receiptUrl} 
                      alt="رسید پرداخت" 
                      className="max-w-full h-auto max-h-64 mx-auto cursor-pointer"
                      onClick={() => {
                        setSelectedImageUrl(selectedOrder.receiptUrl!);
                        setImageModalOpen(true);
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reviewNotes">یادداشت بررسی</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="یادداشت‌های مربوط به بررسی سفارش..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isProcessing}
                >
                  انصراف
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsProcessing(true);
                    rejectOrderMutation.mutate({
                      orderId: selectedOrder.id,
                      notes: reviewNotes
                    });
                  }}
                  disabled={isProcessing || rejectOrderMutation.isPending}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  رد سفارش
                </Button>
                <Button
                  onClick={() => {
                    setIsProcessing(true);
                    approveOrderMutation.mutate({
                      orderId: selectedOrder.id,
                      notes: reviewNotes
                    });
                  }}
                  disabled={isProcessing || approveOrderMutation.isPending}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  تایید سفارش
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Partial Payment Dialog */}
      <Dialog open={showPartialDialog} onOpenChange={setShowPartialDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>پرداخت ترکیبی - سفارش #{selectedOrder?.customerOrderId}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>مبلغ کل سفارش:</span>
                  <span className="font-medium">
                    {formatCurrency(parseFloat(selectedOrder.totalAmount), selectedOrder.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>مبلغ کیف پول:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(selectedOrder.walletUsed || 0, selectedOrder.currency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span>مبلغ باقیمانده:</span>
                  <span className="text-orange-600">
                    {formatCurrency(selectedOrder.remainingAmount || 0, selectedOrder.currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="partialAmount">مبلغ دریافت شده (اختیاری)</Label>
                <Input
                  id="partialAmount"
                  type="number"
                  placeholder="در صورت دریافت بخشی از مبلغ..."
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  اگر مشتری بخشی از مبلغ باقیمانده را پرداخت کرده، آن را وارد کنید
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewNotes">یادداشت بررسی</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="یادداشت‌های مربوط به بررسی سفارش..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPartialDialog(false)}
                  disabled={isProcessing}
                >
                  انصراف
                </Button>
                <Button
                  onClick={() => {
                    setIsProcessing(true);
                    approveOrderMutation.mutate({
                      orderId: selectedOrder.id,
                      notes: reviewNotes,
                      amount: partialAmount || undefined
                    });
                  }}
                  disabled={isProcessing || approveOrderMutation.isPending}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  تایید سفارش
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>نمایش رسید</DialogTitle>
          </DialogHeader>
          {selectedImageUrl && (
            <div className="flex justify-center">
              <img 
                src={selectedImageUrl} 
                alt="رسید پرداخت" 
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Details Modal */}
      <Dialog open={orderDetailsModalOpen} onOpenChange={setOrderDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات سفارش #{orderDetails?.customerOrderId}</DialogTitle>
          </DialogHeader>
          
          {orderDetails && (
            <div className="space-y-6">
              {/* Order Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">محصولات سفارش</h3>
                <div className="space-y-2">
                  {orderDetails.orderItems?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-gray-600">
                          SKU: {item.sku} | بارکد: {item.barcode}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">تعداد</div>
                        <div className="font-medium">{item.quantity}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">قیمت واحد</div>
                        <div className="font-medium">
                          {formatCurrency(parseFloat(item.unitPrice), orderDetails.currency)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">قیمت کل</div>
                        <div className="font-medium text-green-600">
                          {formatCurrency(parseFloat(item.totalPrice), orderDetails.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Addresses */}
              {orderDetails.shippingAddress && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">آدرس ارسال</h3>
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <p>{orderDetails.shippingAddress.address}</p>
                    <p>{orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.province}</p>
                    <p>کد پستی: {orderDetails.shippingAddress.postalCode}</p>
                  </div>
                </div>
              )}

              {/* Documents */}
              {orderDocuments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">مستندات</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {orderDocuments.map((doc: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">{doc.fileName}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{doc.fileType}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FinanceOrders;
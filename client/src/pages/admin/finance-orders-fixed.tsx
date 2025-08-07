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
  Printer
} from "lucide-react";
import InternalBarcodeCard from "@/components/InternalBarcodeCard";
import GlobalRefreshControl from "@/components/GlobalRefreshControl";

import { useToast } from "@/hooks/use-toast";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { formatCurrency } from "@/lib/utils";
import PaymentMethodBadge from "@/components/PaymentMethodBadge";

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
}

function FinanceOrders() {
  // All state hooks at the top
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

  // All query hooks at the top
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">سفارشات مالی</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>لیست سفارشات</CardTitle>
            <CardDescription>
              سفارشات نیازمند بررسی مالی
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Clock className="h-8 w-8 animate-spin" />
                <span className="mr-2">در حال بارگذاری...</span>
              </div>
            ) : allOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">هیچ سفارشی یافت نشد</h3>
                <p className="text-gray-500">در حال حاضر سفارشی برای بررسی مالی وجود ندارد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            سفارش #{order.customerOrderId}
                          </span>
                          <Badge variant="outline">
                            {order.currentStatus}
                          </Badge>
                          {order.paymentMethod && (
                            <PaymentMethodBadge method={order.paymentMethod} />
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>مشتری: {order.customerName || `${order.customerFirstName} ${order.customerLastName}`}</p>
                          <p>مبلغ: {formatCurrency(parseFloat(order.totalAmount), order.currency)}</p>
                          <p>تاریخ: {formatDateSafe(order.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
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
      </div>
    </div>
  );
}

export default FinanceOrders;
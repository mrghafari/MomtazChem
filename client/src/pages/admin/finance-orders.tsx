import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Building
} from "lucide-react";
import InternalBarcodeCard from "@/components/InternalBarcodeCard";
import GlobalRefreshControl from "@/components/GlobalRefreshControl";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface OrderManagement {
  id: number;
  customerOrderId: number;
  currentStatus: string;
  totalAmount: string;
  currency: string;
  paymentReceiptUrl?: string;
  financialNotes?: string;
  financialReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  receiptUrl?: string;
  receiptFileName?: string;
  receiptMimeType?: string;
  financialReviewerId?: number;
  deliveryCode?: string;
}

export default function FinanceOrders() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<OrderManagement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("pending");

  // Get orders for financial review
  const { data: ordersResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/order-management/financial'],
    queryFn: () => fetch('/api/order-management/financial', { credentials: 'include' }).then(res => res.json())
  });

  const allOrders: OrderManagement[] = ordersResponse?.orders || [];
  
  // Filter and search functionality
  const filteredOrders = allOrders.filter(order => {
    const searchMatch = !searchTerm || 
      order.customerFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerOrderId?.toString().includes(searchTerm);
    
    const statusMatch = statusFilter === "all" || order.currentStatus === statusFilter;
    
    return searchMatch && statusMatch;
  });

  // Separate orders by status for tabs
  const pendingOrders = filteredOrders.filter(order => 
    ['pending', 'pending_payment', 'payment_uploaded', 'financial_reviewing'].includes(order.currentStatus)
  );
  
  const approvedOrders = filteredOrders.filter(order => 
    order.currentStatus === 'financial_approved'
  );
  
  const rejectedOrders = filteredOrders.filter(order => 
    order.currentStatus === 'financial_rejected'
  );

  // Statistics
  const totalAmount = allOrders.reduce((sum, order) => 
    sum + parseFloat(order.totalAmount || '0'), 0
  );
  
  const totalApproved = approvedOrders.reduce((sum, order) => 
    sum + parseFloat(order.totalAmount || '0'), 0
  );

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
      return apiRequest(`/api/order-management/${orderId}/approve`, {
        method: 'PUT',
        body: { notes, status: 'financial_approved' }
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ سفارش تایید شد",
        description: "پرداخت تایید شد و سفارش به واحد انبار منتقل شد"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/order-management/financial'] });
      setDialogOpen(false);
      setSelectedOrder(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "خطا در تایید",
        description: error.message || "امکان تایید سفارش وجود ندارد",
        variant: "destructive"
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: number; notes: string }) => {
      return apiRequest(`/api/order-management/${orderId}/reject`, {
        method: 'PUT',
        body: { notes, status: 'financial_rejected' }
      });
    },
    onSuccess: () => {
      toast({
        title: "❌ سفارش رد شد",
        description: "پرداخت رد شد و اطلاع‌رسانی به مشتری ارسال شد"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/order-management/financial'] });
      setDialogOpen(false);
      setSelectedOrder(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "خطا در رد سفارش",
        description: error.message || "امکان رد سفارش وجود ندارد",
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
      loadTrackingCodes(selectedOrderForTracking?.customerOrderId);
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
      setTrackingCodes(response.trackingCodes || []);
    } catch (error) {
      console.error("Error loading tracking codes:", error);
    }
  };

  // Handle tracking modal open
  const handleTrackingModal = (order: Order) => {
    setSelectedOrderForTracking(order);
    setShowTrackingModal(true);
    loadTrackingCodes(order.customerOrderId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'payment_uploaded':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">در انتظار بررسی مالی</Badge>;
      case 'financial_reviewing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">در حال بررسی</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleOrderReview = (order: Order) => {
    setSelectedOrder(order);
    setReviewNotes(order.financialNotes || "");
    setIsDialogOpen(true);
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
                  <p className="text-3xl font-bold text-white">{approvedOrders.length}</p>
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
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm border rounded-lg p-1">
            <TabsTrigger value="pending" className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Clock className="h-4 w-4" />
              <span>در انتظار ({pendingOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <CheckCircle className="h-4 w-4" />
              <span>تایید شده ({approvedOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center space-x-2 space-x-reverse data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <XCircle className="h-4 w-4" />
              <span>رد شده ({rejectedOrders.length})</span>
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
                  }} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ سفارش تایید شده‌ای وجود ندارد</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {approvedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} readOnly />
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
                  <OrderCard key={order.id} order={order} readOnly />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Review Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>بررسی پرداخت سفارش #{selectedOrder?.customerOrderId}</DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">نام مشتری</Label>
                    <p className="font-medium">{selectedOrder.customerFirstName} {selectedOrder.customerLastName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">ایمیل</Label>
                    <p className="font-medium">{selectedOrder.customerEmail}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">تلفن</Label>
                    <p className="font-medium">{selectedOrder.customerPhone}</p>
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
                </div>
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
}

function OrderCard({ order, onOrderSelect, readOnly = false }: OrderCardProps) {
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
              <h3 className="font-bold text-lg text-gray-900">سفارش #{order.customerOrderId}</h3>
              <p className="text-sm text-gray-600">{order.customerFirstName} {order.customerLastName}</p>
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
            <span className="text-sm text-gray-600">{order.customerEmail}</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{order.customerPhone}</span>
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
          <div className="flex justify-end">
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
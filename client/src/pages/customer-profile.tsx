import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { User, Package, Calendar, DollarSign, ShoppingBag, LogOut, MapPin, Building, Phone, Mail, Edit, FileText, Download, Clock, AlertTriangle, PlayCircle, Trash2, History, Search, X, ShoppingCart, Plus, Upload, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PaymentMethodBadge from "@/components/PaymentMethodBadge";
import { BankReceiptUploadModal } from "@/components/BankReceiptUploadModal";

// کامپوننت کنتور زمانی برای ارسال حواله بانکی
const BankTransferCountdown = ({ orderDate, gracePeriodHours = 72 }: { orderDate: string, gracePeriodHours?: number }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const orderTime = new Date(orderDate).getTime();
      const expiryTime = orderTime + (gracePeriodHours * 60 * 60 * 1000);
      const now = new Date().getTime();
      const timeDiff = expiryTime - now;

      if (timeDiff <= 0) {
        setIsExpired(true);
        setTimeRemaining("مهلت به پایان رسیده");
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days} روز و ${hours} ساعت باقی مانده`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours} ساعت و ${minutes} دقیقه باقی مانده`);
      } else {
        setTimeRemaining(`${minutes} دقیقه باقی مانده`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // هر دقیقه به‌روزرسانی

    return () => clearInterval(interval);
  }, [orderDate, gracePeriodHours]);

  return (
    <div className={`text-xs mt-2 p-2 rounded ${isExpired ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        <span className="font-medium">
          {isExpired ? "⚠️ مهلت ارسال حواله به پایان رسیده" : `⏰ ${timeRemaining}`}
        </span>
      </div>
      {!isExpired && (
        <p className="text-xs mt-1 text-blue-600">
          برای جلوگیری از لغو خودکار سفارش، حواله را ارسال کنید
        </p>
      )}
      {isExpired && (
        <p className="text-xs mt-1 text-red-600">
          سفارش در معرض لغو خودکار قرار دارد
        </p>
      )}
    </div>
  );
};

const CustomerProfile = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Purchase history modal states
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [completeHistory, setCompleteHistory] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  
  // Main profile filter state
  const [mainProfileFilter, setMainProfileFilter] = useState<string>("all");
  
  // CSV export states
  const [showCsvExport, setShowCsvExport] = useState(false);
  const [csvStartDate, setCsvStartDate] = useState("");
  const [csvEndDate, setCsvEndDate] = useState("");
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  
  // Bank receipt upload modal states
  const [showBankReceiptModal, setShowBankReceiptModal] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>("");
  
  // Get customer information
  const { data: customerData, isLoading: customerLoading, error: customerError } = useQuery<any>({
    queryKey: ["/api/customers/me"],
    retry: 1,
  });

  // Get customer order history
  const { data: orderData, isLoading: ordersLoading } = useQuery<any>({
    queryKey: ["/api/customers/orders"],
    retry: 1,
    enabled: !!customerData?.success,
  });

  // Get abandoned carts
  const { data: abandonedCartsData, isLoading: abandonedCartsLoading } = useQuery<any>({
    queryKey: ["/api/customers/abandoned-carts"],
    retry: 1,
    enabled: !!customerData?.success,
  });

  // Get order status category
  const getOrderCategory = (order: any) => {
    const status = order.status?.toLowerCase();
    const paymentStatus = order.paymentStatus?.toLowerCase();
    const paymentMethod = order.paymentMethod;
    const managementStatus = order.managementStatus?.toLowerCase();
    const hasFinancialReview = order.financialReviewedAt;
    
    // Check for bank transfer orders
    if (paymentMethod === 'واریز بانکی با مهلت 3 روزه' || paymentMethod === 'bank_transfer_grace') {
      return 'bank_transfer';
    }
    
    // Check for completed orders
    if (status === 'confirmed' || status === 'delivered' || paymentStatus === 'paid') {
      return 'completed';
    }
    
    // Check for wallet payments that have been financially reviewed
    if ((paymentMethod === 'wallet_full' || paymentMethod === 'wallet_partial' || paymentMethod === 'wallet_combined') && hasFinancialReview) {
      return 'processing';
    }
    
    // Check for orders in warehouse or processing stages
    if (status === 'processing' || status === 'shipped' || status === 'ready_for_delivery' || 
        managementStatus === 'warehouse_pending' || managementStatus === 'warehouse_approved' || 
        managementStatus === 'warehouse_ready') {
      return 'processing';
    }
    
    // Check for partial payments that have been approved
    if (paymentStatus === 'partial' && hasFinancialReview) {
      return 'processing';
    }
    
    // Default to pending payment
    return 'pending';
  };

  // Sort orders: 3-day bank transfer orders first, then regular orders
  const rawOrders = orderData?.orders || [];
  const sortedOrders = rawOrders.sort((a: any, b: any) => {
    // Check if order is 3-day bank transfer (both Persian display name and English API name)
    const aIs3DayBank = a.paymentMethod === 'واریز بانکی با مهلت 3 روزه' || a.paymentMethod === 'bank_transfer_grace';
    const bIs3DayBank = b.paymentMethod === 'واریز بانکی با مهلت 3 روزه' || b.paymentMethod === 'bank_transfer_grace';
    
    // 3-day bank transfers come first
    if (aIs3DayBank && !bIs3DayBank) return -1;
    if (!aIs3DayBank && bIs3DayBank) return 1;
    
    // If both are same type, sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Get all orders for status counting (including hidden ones)
  const allOrdersForCounting = completeHistory.length > 0 ? completeHistory : sortedOrders;
  
  // Filter orders based on main profile filter
  const orders = mainProfileFilter === "all" ? sortedOrders : sortedOrders.filter(order => getOrderCategory(order) === mainProfileFilter);
  
  const totalOrders = orderData?.totalOrders || 0;
  const hiddenOrders = orderData?.hiddenOrders || 0;
  const abandonedCarts = abandonedCartsData?.carts || [];
  const abandonedCartsCount = abandonedCarts.length;

  // Load complete purchase history
  const loadCompleteHistory = async () => {
    if (completeHistory.length > 0) return; // Already loaded
    
    setIsLoadingHistory(true);
    try {
      const response = await apiRequest('/api/customers/orders/complete-history', {
        method: 'GET'
      });
      if (response.success) {
        setCompleteHistory(response.orders || []);
      }
    } catch (error) {
      console.error('Error loading purchase history:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در بارگیری سابقه خرید",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load complete history on component mount for accurate status counting
  useEffect(() => {
    if (customerData?.success) {
      loadCompleteHistory();
    }
  }, [customerData?.success]);

  // Filter history based on search and category filter
  let filteredHistory = completeHistory;
  
  // Apply category filter
  if (selectedFilter !== "all") {
    filteredHistory = filteredHistory.filter(order => getOrderCategory(order) === selectedFilter);
  }
  
  // Apply search filter
  if (searchTerm) {
    filteredHistory = filteredHistory.filter(order => 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some((item: any) => 
        item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/customers/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "خروج موفق",
          description: "شما با موفقیت از سیستم خارج شدید",
        });
        setLocation("/shop");
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در خروج از سیستم",
      });
    }
  };

  const handleDeleteTemporaryOrder = async (orderId: number, orderNumber: string) => {
    if (!confirm(`آیا از حذف سفارش موقت ${orderNumber} اطمینان دارید؟\nشماره سفارش حذف شده به عنوان "حذف شده" باقی می‌ماند و محصولات رزرو شده آزاد خواهند شد.`)) {
      return;
    }

    try {
      const response = await apiRequest(`/api/customers/orders/${orderId}/delete-temporary`, {
        method: 'DELETE'
      });

      if (response.success) {
        toast({
          title: "سفارش حذف شد",
          description: `سفارش ${orderNumber} با موفقیت حذف شد و محصولات آزاد شدند`,
        });
        
        // Refresh orders
        queryClient.invalidateQueries({ queryKey: ["/api/customers/orders"] });
      }
    } catch (error) {
      console.error('Delete order error:', error);
      toast({
        variant: "destructive",
        title: "خطا در حذف سفارش",
        description: "نتوانستیم سفارش را حذف کنیم. لطفاً دوباره تلاش کنید.",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // CSV Export Function
  const handleCsvExport = async () => {
    // No date validation required - user can export all orders if no dates selected

    setIsExportingCsv(true);
    try {
      const params = new URLSearchParams();
      if (csvStartDate) params.append('startDate', csvStartDate);
      if (csvEndDate) params.append('endDate', csvEndDate);

      const response = await fetch(`/api/customers/export-orders-csv?${params}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در دریافت فایل CSV');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const dateRange = csvStartDate && csvEndDate 
        ? `${csvStartDate}_to_${csvEndDate}`
        : csvStartDate 
        ? `from_${csvStartDate}`
        : `until_${csvEndDate}`;
      
      link.download = `completed-orders-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "خروجی CSV آماده شد",
        description: "فایل CSV سفارشات تکمیل شده با موفقیت دانلود شد",
      });

      setShowCsvExport(false);
      setCsvStartDate("");
      setCsvEndDate("");

    } catch (error: any) {
      console.error('CSV export error:', error);
      toast({
        variant: "destructive",
        title: "خطا در خروجی CSV",
        description: error.message || "خطا در ایجاد فایل CSV",
      });
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Handle opening bank receipt upload modal
  const handleOpenBankReceiptModal = (orderNumber: string) => {
    setSelectedOrderNumber(orderNumber);
    setShowBankReceiptModal(true);
  };

  // Handle modal success (refresh orders)
  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/customers/orders"] });
  };

  const formatTimeRemaining = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      return `${minutes} دقیقه`;
    } else if (hours < 24) {
      return `${Math.floor(hours)} ساعت`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} روز`;
    }
  };

  const getStatusColor = (status: string, paymentStatus?: string) => {
    // اگر رسید آپلود شده باشد، رنگ آبی برای "منتظر تأیید مالی"
    if (paymentStatus === 'receipt_uploaded') {
      return 'bg-blue-100 text-blue-800';
    }
    
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'payment_grace_period':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string, paymentStatus?: string, order?: any) => {
    // اگر رسید آپلود شده باشد، نمایش "منتظر تأیید مالی"
    if (paymentStatus === 'receipt_uploaded') {
      return 'منتظر تأیید مالی';
    }
    
    // Check for wallet payments and warehouse status for more accurate labels
    const paymentMethod = order?.paymentMethod;
    const managementStatus = order?.managementStatus?.toLowerCase();
    const hasFinancialReview = order?.financialReviewedAt;
    
    // Special handling for wallet payments
    if ((paymentMethod === 'wallet_full' || paymentMethod === 'wallet_partial' || paymentMethod === 'wallet_combined') && hasFinancialReview) {
      if (managementStatus === 'warehouse_pending') {
        return 'در حال پردازش - انبار';
      }
      if (managementStatus === 'warehouse_approved') {
        return 'تایید شده - آماده ارسال';
      }
    }
    
    // Special handling for partial payments that are approved
    if (paymentStatus === 'partial' && hasFinancialReview) {
      if (managementStatus === 'warehouse_pending') {
        return 'در حال پردازش - انبار';
      }
    }
    
    switch (status) {
      case 'confirmed':
        return 'تایید شده';
      case 'pending':
        return 'در انتظار';
      case 'payment_grace_period':
        return 'مهلت پرداخت';
      case 'cancelled':
        return 'لغو شده';
      default:
        return status;
    }
  };

  // Loading state
  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (customerError || !customerData?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">خطا در دسترسی</h2>
            <p className="text-gray-600 mb-4">لطفاً وارد حساب کاربری خود شوید</p>
            <Button onClick={() => setLocation("/shop")} className="w-full">
              بازگشت به فروشگاه
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            سلام {customerData?.customer?.firstName || 'کاربر'} عزیز!
          </h1>
          <p className="text-gray-600">
            به پنل کاربری خود خوش آمدید
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    اطلاعات حساب کاربری
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLocation("/customer/profile/edit")}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                  >
                    <Edit className="w-4 h-4" />
                    ویرایش
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      {customerData.customer.firstName} {customerData.customer.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{customerData.customer.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{customerData.customer.phone}</span>
                  </div>
                  {customerData.customer.company && (
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{customerData.customer.company}</span>
                    </div>
                  )}
                  {customerData.customer.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{customerData.customer.address}</span>
                    </div>
                  )}
                  {(customerData.customer.city || customerData.customer.province) && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {customerData.customer.city && customerData.customer.province 
                          ? `${customerData.customer.city}, ${customerData.customer.province}`
                          : customerData.customer.city || customerData.customer.province
                        }
                      </span>
                    </div>
                  )}
                </div>
                <Separator />
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  خروج از حساب
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Orders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex flex-col gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    سفارشات شما
                    {orders.length > 0 && (
                      <Badge variant="secondary">
                        {orders.length} سفارش
                      </Badge>
                    )}
                  </CardTitle>
                  
                  {/* Order Status Indicators */}
                  {(orders.length > 0 || completeHistory.length > 0) && (
                    <div className="flex items-center gap-3 text-xs">
                      {(() => {
                        // Count all orders (including complete history) for accurate status display
                        const statusCounts = allOrdersForCounting.reduce((acc: any, order: any) => {
                          const category = getOrderCategory(order);
                          acc[category] = (acc[category] || 0) + 1;
                          return acc;
                        }, {});
                        
                        return (
                          <>
                            {/* All Orders Filter */}
                            <button
                              onClick={() => setMainProfileFilter("all")}
                              className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-all cursor-pointer ${
                                mainProfileFilter === "all"
                                  ? "bg-purple-100 border-purple-300 shadow-md"
                                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                              <span className={`font-medium ${mainProfileFilter === "all" ? "text-purple-700" : "text-gray-700"}`}>
                                {allOrdersForCounting.length} همه
                              </span>
                            </button>

                            {statusCounts.completed > 0 && (
                              <button
                                onClick={() => setMainProfileFilter("completed")}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-all cursor-pointer ${
                                  mainProfileFilter === "completed"
                                    ? "bg-green-100 border-green-300 shadow-md"
                                    : "bg-green-50 border-green-200 hover:bg-green-100"
                                }`}
                              >
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className={`font-medium ${mainProfileFilter === "completed" ? "text-green-800" : "text-green-700"}`}>
                                  {statusCounts.completed} تکمیل شده
                                </span>
                              </button>
                            )}
                            {statusCounts.pending > 0 && (
                              <button
                                onClick={() => setMainProfileFilter("pending")}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-all cursor-pointer ${
                                  mainProfileFilter === "pending"
                                    ? "bg-yellow-100 border-yellow-300 shadow-md"
                                    : "bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
                                }`}
                              >
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className={`font-medium ${mainProfileFilter === "pending" ? "text-yellow-800" : "text-yellow-700"}`}>
                                  {statusCounts.pending} در انتظار پرداخت
                                </span>
                              </button>
                            )}
                            {statusCounts.processing > 0 && (
                              <button
                                onClick={() => setMainProfileFilter("processing")}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-all cursor-pointer ${
                                  mainProfileFilter === "processing"
                                    ? "bg-blue-100 border-blue-300 shadow-md"
                                    : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                                }`}
                              >
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className={`font-medium ${mainProfileFilter === "processing" ? "text-blue-800" : "text-blue-700"}`}>
                                  {statusCounts.processing} در حال پردازش
                                </span>
                              </button>
                            )}
                            {statusCounts.bank_transfer > 0 && (
                              <button
                                onClick={() => setMainProfileFilter("bank_transfer")}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-all cursor-pointer ${
                                  mainProfileFilter === "bank_transfer"
                                    ? "bg-orange-100 border-orange-300 shadow-md"
                                    : "bg-orange-50 border-orange-200 hover:bg-orange-100"
                                }`}
                              >
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span className={`font-medium ${mainProfileFilter === "bank_transfer" ? "text-orange-800" : "text-orange-700"}`}>
                                  {statusCounts.bank_transfer} حواله بانکی
                                </span>
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {abandonedCartsCount > 0 && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="flex items-center gap-3 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 px-4 py-2 rounded-lg hover:from-rose-200 hover:to-pink-200 transition-all duration-200 border-2 border-rose-300 shadow-md hover:shadow-lg transform hover:scale-105">
                          <ShoppingCart className="w-5 h-5 text-rose-600" />
                          <span className="text-sm font-bold">
                            {abandonedCartsCount} سبد خرید رها شده
                          </span>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-orange-600" />
                            سبدهای خرید رها شده ({abandonedCartsCount} سبد)
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <p className="text-orange-800 text-sm">
                              <strong>توضیح:</strong> این کالاها در سبد خرید شما قرار دارند ولی خرید تکمیل نشده است.
                            </p>
                          </div>
                          
                          {abandonedCarts.map((cart: any) => (
                            <Card key={cart.id} className="border-orange-200">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h3 className="font-semibold text-gray-900">
                                      سبد خرید #{cart.id}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      آخرین فعالیت: {formatDate(cart.lastActivity)}
                                    </p>
                                  </div>
                                  <div className="text-left">
                                    <p className="text-lg font-bold text-orange-600">
                                      ${parseFloat(cart.totalValue || 0).toFixed(2)}
                                    </p>
                                    <Badge className="bg-orange-100 text-orange-800">
                                      {cart.itemCount} کالا
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-orange-200 flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => setLocation("/shop")}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    تکمیل خرید
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">هنوز سفارشی ندارید</h3>
                    <p className="text-gray-500 mb-6">برای مشاهده تاریخچه سفارشات، خرید خود را شروع کنید.</p>
                    <Button onClick={() => setLocation("/shop")}>
                      شروع خرید
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => {
                      // Check if this is a 3-day bank transfer order
                      const is3DayBankTransfer = order.paymentMethod === 'واریز بانکی با مهلت 3 روزه' || order.paymentMethod === 'bank_transfer_grace';
                      
                      return (
                      <div key={order.id} className={`border rounded-lg p-4 ${
                        is3DayBankTransfer 
                          ? 'border-orange-300 bg-orange-50' 
                          : (order.status === 'pending' || order.status === 'payment_grace_period') 
                            ? 'border-amber-200 bg-amber-50' 
                            : ''
                      }`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">
                                {order.orderNumber}
                              </h4>
                              {(order.status === 'pending' || order.status === 'payment_grace_period') && (
                                <Badge className="bg-orange-100 text-orange-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  سفارش موقت
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(order.createdAt)}
                            </p>
                            
                            {/* نمایش پیام منتظر ارسال حواله و کنتور زمانی برای سفارشات بانکی 3 روزه */}
                            {is3DayBankTransfer && (order.status === 'pending' || order.status === 'payment_grace_period') && (
                              <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 mt-2 text-right">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm text-orange-900 font-bold flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    سفارش با مهلت 3 روزه پرداخت
                                  </p>
                                  <Badge className="bg-orange-200 text-orange-800 text-xs">
                                    مهلت ویژه
                                  </Badge>
                                </div>
                                
                                {!order.receiptPath ? (
                                  <>
                                    <p className="text-xs text-orange-800 mb-2">
                                      منتظر ارسال حواله وجه خرید - لطفاً حواله بانکی را آپلود کنید
                                    </p>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Button 
                                        size="sm" 
                                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                                        onClick={() => handleOpenBankReceiptModal(order.orderNumber)}
                                      >
                                        <Upload className="w-3 h-3 mr-1" />
                                        آپلود حواله بانکی
                                      </Button>
                                      <span className="text-xs text-orange-700">
                                        مهلت پرداخت: 72 ساعت از زمان سفارش
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                      حواله آپلود شده
                                    </Badge>
                                    <span className="text-xs text-orange-700">
                                      در انتظار بررسی مالی
                                    </span>
                                  </div>
                                )}
                                
                                {/* کنتور زمانی برای ارسال وجه */}
                                <div className="mt-2">
                                  <BankTransferCountdown 
                                    orderDate={order.createdAt}
                                    gracePeriodHours={72}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {(() => {
                              // Calculate correct total from actual order components
                              const subtotalAmount = order.items ? order.items.reduce((sum: number, item: any) => {
                                return sum + parseFloat(item.totalPrice || 0);
                              }, 0) : 0;
                              const vatAmount = parseFloat(order.vatAmount || '0');
                              const shippingCost = parseFloat(order.shippingCost || '0');
                              const surchargeAmount = parseFloat(order.surchargeAmount || '0');
                              const correctTotal = subtotalAmount + vatAmount + shippingCost + surchargeAmount;
                              
                              return (
                                <p className="font-semibold text-lg">{Math.floor(correctTotal)} {order.currency || 'IQD'}</p>
                              );
                            })()}
                            <Badge className={getStatusColor(order.status, order.paymentStatus)}>
                              {getStatusLabel(order.status, order.paymentStatus, order)}
                            </Badge>
                            
                            {/* 🧾 نمایش نوع فاکتور (پیش‌فاکتور یا فاکتور رسمی) */}
                            {order.invoiceType && (
                              <div className="mt-2">
                                <Badge 
                                  className={
                                    order.invoiceType === 'official_invoice' 
                                      ? "bg-green-100 text-green-800 border-green-200" 
                                      : "bg-blue-100 text-blue-800 border-blue-200"
                                  }
                                >
                                  {order.invoiceType === 'official_invoice' ? '📄 فاکتور رسمی' : '📋 پیش‌فاکتور'}
                                </Badge>
                                {order.invoiceType === 'official_invoice' && order.invoiceConvertedAt && (
                                  <p className="text-xs text-green-600 mt-1">
                                    تبدیل شده در: {new Date(order.invoiceConvertedAt).toLocaleDateString('fa-IR')}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* نمایش دلیل رد سفارش از بخش مالی */}
                            {(order.status === 'financial_rejected' || order.status === 'rejected') && order.financialNotes && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <h6 className="text-sm font-medium text-red-800 mb-1">دلیل رد سفارش:</h6>
                                    <p className="text-sm text-red-700">{order.financialNotes}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {order.items && order.items.length > 0 && (
                          <div>
                            <Separator className="mb-3" />
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-700">اقلام سفارش:</h5>
                              {order.items.map((item: any, index: number) => {
                                // Use correct field names from order_items schema
                                const productName = item.productName || 'نامشخص';
                                const quantity = parseFloat(item.quantity || 0);
                                const totalPrice = parseFloat(item.totalPrice || 0);
                                
                                return (
                                  <div key={item.id || index} className="flex justify-between text-sm">
                                    <span>{productName} × {Math.floor(quantity)}</span>
                                    <span>{Math.floor(totalPrice)} IQD</span>
                                  </div>
                                );
                              })}
                              
                              {/* نمایش جزئیات قیمت */}
                              <div className="mt-3 pt-2 border-t border-gray-200 space-y-1">
                                {(() => {
                                  // Get values from order data (totalAmount already includes shipping, VAT, etc.)
                                  const totalAmount = parseFloat(order.totalAmount || '0');
                                  const vatAmount = parseFloat(order.vatAmount || '0');
                                  const shippingCost = parseFloat(order.shippingCost || '0');
                                  const surchargeAmount = parseFloat(order.surchargeAmount || '0');
                                  
                                  // Calculate subtotal from actual order items
                                  const subtotalAmount = order.items ? order.items.reduce((sum: number, item: any) => {
                                    return sum + parseFloat(item.totalPrice || 0);
                                  }, 0) : 0;
                                  
                                  return (
                                    <>
                                      {/* مجموع اقلام */}
                                      {subtotalAmount > 0 && (
                                        <div className="flex justify-between text-sm text-gray-600">
                                          <span>مجموع اقلام:</span>
                                          <span>{Math.floor(subtotalAmount)} IQD</span>
                                        </div>
                                      )}
                                      
                                      {/* هزینه حمل - جداگانه نمایش داده می‌شود */}
                                      {shippingCost > 0 && (
                                        <div className="flex justify-between text-sm text-blue-700">
                                          <span>هزینه حمل:</span>
                                          <span>{Math.floor(shippingCost)} IQD</span>
                                        </div>
                                      )}
                                      
                                      {/* مالیات بر ارزش افزوده - فقط اگر مبلغ بزرگتر از صفر باشد */}
                                      {vatAmount > 0 && (
                                        <div className="flex justify-between text-sm text-green-700 font-medium">
                                          <span>مالیات بر ارزش افزوده:</span>
                                          <span>{Math.floor(vatAmount)} IQD</span>
                                        </div>
                                      )}
                                      
                                      {/* عوارض (اگر وجود داشته باشد) */}
                                      {surchargeAmount > 0 && (
                                        <div className="flex justify-between text-sm text-orange-700">
                                          <span>عوارض:</span>
                                          <span>{Math.floor(surchargeAmount)} IQD</span>
                                        </div>
                                      )}
                                      
                                      {/* خط جداکننده قبل از مجموع کل */}
                                      <div className="border-t border-gray-300 my-2"></div>
                                      
                                      {/* مجموع کل - استفاده از totalAmount از database (شامل همه هزینه‌ها) */}
                                      <div className="flex justify-between text-sm font-bold text-gray-800">
                                        <span>مجموع کل:</span>
                                        <span>{Math.floor(totalAmount)} IQD</span>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-gray-200 flex gap-2 flex-wrap">
                          {/* دکمه‌های مدیریت سفارش فقط برای سفارشات بانکی 3 روزه */}
                          {(order.status === 'pending' || order.status === 'payment_grace_period') && 
                           (order.paymentMethod === 'واریز بانکی با مهلت 3 روزه' || order.paymentMethod === 'bank_transfer_grace') && 
                           !order.receiptPath && (
                            <>
                              {/* دکمه آپلود رسید بانکی */}
                              <Button
                                size="sm"
                                onClick={() => handleOpenBankReceiptModal(order.orderNumber)}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                آپلود حواله بانکی
                              </Button>
                              
                              {/* دکمه حذف سفارش موقت */}
                              {(!order.paymentStatus || order.paymentStatus === 'pending' || order.paymentStatus === 'unpaid') && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteTemporaryOrder(order.id, order.orderNumber)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  حذف سفارش موقت
                                </Button>
                              )}
                            </>
                          )}
                          
                          {/* نمایش وضعیت برای سفارشات با رسید آپلود شده */}
                          {(order.paymentMethod === 'واریز بانکی با مهلت 3 روزه' || order.paymentMethod === 'bank_transfer_grace') && 
                           order.receiptPath && (
                            <>
                              {/* وضعیت در دست بررسی مالی */}
                              {(order.status === 'payment_uploaded' || order.status === 'pending' || order.status === 'payment_grace_period') && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <p className="text-sm text-blue-800 font-medium flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    📄 حواله بانکی آپلود شده - در دست بررسی مالی
                                  </p>
                                  <p className="text-xs text-blue-700 mt-1">
                                    لطفاً منتظر تایید بخش مالی باشید. پس از تایید، سفارش به انبار منتقل می‌شود.
                                  </p>
                                </div>
                              )}
                              
                              {/* وضعیت تایید شده */}
                              {order.status === 'confirmed' && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <p className="text-sm text-green-800 font-medium flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    ✅ حواله بانکی تایید شد - سفارش در حال پردازش
                                  </p>
                                  <p className="text-xs text-green-700 mt-1">
                                    سفارش شما از بخش مالی تایید شده و در حال پردازش در انبار است
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* 🧾 دکمه دانلود فاکتور/پیش فاکتور بر اساس نوع فاکتور */}
                          {order.invoiceType === 'official_invoice' ? (
                            <Button
                              size="sm"
                              onClick={() => window.open(`/download-invoice/${order.id}`, '_blank')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              دانلود فاکتور رسمی
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => window.open(`/download-proforma-invoice/${order.id}`, '_blank')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              دانلود پیش‌فاکتور
                            </Button>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Purchase History and CSV Export Buttons */}
            {orders && orders.length > 0 && (
              <div className="mt-4 space-y-2">
                <Button
                  onClick={() => {
                    setShowPurchaseHistory(true);
                    loadCompleteHistory();
                  }}
                  variant="outline"
                  className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  مشاهده سابقه خرید کامل
                </Button>
                
                <Button
                  onClick={() => setShowCsvExport(true)}
                  variant="outline"
                  className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  خروجی CSV سفارشات تکمیل شده
                </Button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Purchase History Modal */}
      <Dialog open={showPurchaseHistory} onOpenChange={setShowPurchaseHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-purple-700">سابقه خرید کامل</DialogTitle>
          </DialogHeader>
          
          {/* Order Types Header with Filters */}
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-3 text-center">انواع سفارشات</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              {/* All Orders Filter */}
              <button
                onClick={() => setSelectedFilter("all")}
                className={`flex items-center gap-2 p-2 rounded-md shadow-sm transition-all cursor-pointer ${
                  selectedFilter === "all" 
                    ? "bg-purple-100 border-2 border-purple-400 shadow-md" 
                    : "bg-white hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className={selectedFilter === "all" ? "text-purple-800 font-medium" : "text-gray-700"}>همه</span>
              </button>
              
              {/* Completed Orders Filter */}
              <button
                onClick={() => setSelectedFilter("completed")}
                className={`flex items-center gap-2 p-2 rounded-md shadow-sm transition-all cursor-pointer ${
                  selectedFilter === "completed" 
                    ? "bg-green-100 border-2 border-green-400 shadow-md" 
                    : "bg-white hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className={selectedFilter === "completed" ? "text-green-800 font-medium" : "text-gray-700"}>تکمیل شده</span>
              </button>
              
              {/* Pending Payment Filter */}
              <button
                onClick={() => setSelectedFilter("pending")}
                className={`flex items-center gap-2 p-2 rounded-md shadow-sm transition-all cursor-pointer ${
                  selectedFilter === "pending" 
                    ? "bg-yellow-100 border-2 border-yellow-400 shadow-md" 
                    : "bg-white hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className={selectedFilter === "pending" ? "text-yellow-800 font-medium" : "text-gray-700"}>در انتظار پرداخت</span>
              </button>
              
              {/* Processing Orders Filter */}
              <button
                onClick={() => setSelectedFilter("processing")}
                className={`flex items-center gap-2 p-2 rounded-md shadow-sm transition-all cursor-pointer ${
                  selectedFilter === "processing" 
                    ? "bg-blue-100 border-2 border-blue-400 shadow-md" 
                    : "bg-white hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className={selectedFilter === "processing" ? "text-blue-800 font-medium" : "text-gray-700"}>در حال پردازش</span>
              </button>
              
              {/* Bank Transfer Filter */}
              <button
                onClick={() => setSelectedFilter("bank_transfer")}
                className={`flex items-center gap-2 p-2 rounded-md shadow-sm transition-all cursor-pointer ${
                  selectedFilter === "bank_transfer" 
                    ? "bg-orange-100 border-2 border-orange-400 shadow-md" 
                    : "bg-white hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className={selectedFilter === "bank_transfer" ? "text-orange-800 font-medium" : "text-gray-700"}>حواله بانکی</span>
              </button>
            </div>
            <div className="mt-3 text-xs text-purple-600 text-center">
              نکته: سفارشات با حواله بانکی سه‌روزه در اولویت نمایش قرار می‌گیرند • کلیک کنید تا فیلتر شود
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="جستجو در شماره سفارش، وضعیت یا نام محصول..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4"
            />
            {searchTerm && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-2 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Loading State */}
          {isLoadingHistory && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="mr-3">در حال بارگیری...</span>
            </div>
          )}

          {/* Results Count */}
          {!isLoadingHistory && (
            <div className="mb-4 text-sm text-gray-600 flex justify-between items-center">
              <span>
                {searchTerm || selectedFilter !== "all" ? (
                  `${filteredHistory.length} سفارش پیدا شد از ${completeHistory.length} سفارش کل`
                ) : (
                  `${completeHistory.length} سفارش کل`
                )}
              </span>
              {(searchTerm || selectedFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedFilter("all");
                  }}
                  className="text-xs text-purple-600 hover:text-purple-800 underline"
                >
                  پاک کردن فیلترها
                </button>
              )}
            </div>
          )}

          {/* Simple Orders List */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredHistory.length === 0 && !isLoadingHistory && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "نتیجه‌ای یافت نشد" : "سفارشی موجود نیست"}
              </div>
            )}
            
            {filteredHistory.map((order: any) => (
              <Card key={order.id} className="border-purple-200 hover:border-purple-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">سفارش {order.orderNumber}</h4>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      {(() => {
                        // Calculate correct total from components
                        const subtotalAmount = order.items ? order.items.reduce((sum: number, item: any) => {
                          return sum + parseFloat(item.totalPrice || 0);
                        }, 0) : 0;
                        const vatAmount = parseFloat(order.vatAmount || '0');
                        const shippingCost = parseFloat(order.shippingCost || '0');
                        const surchargeAmount = parseFloat(order.surchargeAmount || '0');
                        const correctTotal = subtotalAmount + vatAmount + shippingCost + surchargeAmount;
                        
                        return (
                          <p className="font-semibold text-lg">{Math.floor(correctTotal)} IQD</p>
                        );
                      })()}
                      <Badge className={getStatusColor(order.status, order.paymentStatus)}>
                        {getStatusLabel(order.status, order.paymentStatus, order)}
                      </Badge>
                      
                      {/* 🧾 نمایش نوع فاکتور در سابقه خرید */}
                      {order.invoiceType && (
                        <div className="mt-1">
                          <Badge 
                            className={
                              order.invoiceType === 'official_invoice' 
                                ? "bg-green-100 text-green-800 border-green-200 text-xs" 
                                : "bg-blue-100 text-blue-800 border-blue-200 text-xs"
                            }
                          >
                            {order.invoiceType === 'official_invoice' ? '📄 فاکتور رسمی' : '📋 پیش‌فاکتور'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* نمایش دلیل رد سفارش در سابقه خرید */}
                  {(order.status === 'financial_rejected' || order.status === 'rejected') && order.financialNotes && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h6 className="text-sm font-medium text-red-800 mb-1">دلیل رد سفارش:</h6>
                          <p className="text-sm text-red-700">{order.financialNotes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Items Preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-3">
                      <Separator className="mb-2" />
                      <h5 className="text-sm font-medium text-gray-700 mb-2">اقلام سفارش:</h5>
                      {order.items.slice(0, 3).map((item: any, index: number) => (
                        <div key={item.id || index} className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>{item.productName || 'نامشخص'} × {Math.floor(parseFloat(item.quantity || 0))}</span>
                          <span>{Math.floor(parseFloat(item.totalPrice || 0))} IQD</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-500">و {order.items.length - 3} محصول دیگر...</p>
                      )}
                    </div>
                  )}

                  {/* Cost Breakdown */}
                  <div className="mb-3 p-2 bg-gray-50 rounded text-sm space-y-1">
                    {(() => {
                      const subtotalAmount = order.items ? order.items.reduce((sum: number, item: any) => {
                        return sum + parseFloat(item.totalPrice || 0);
                      }, 0) : 0;
                      const vatAmount = parseFloat(order.vatAmount || '0');
                      const shippingCost = parseFloat(order.shippingCost || '0');
                      const surchargeAmount = parseFloat(order.surchargeAmount || '0');
                      
                      return (
                        <>
                          {subtotalAmount > 0 && (
                            <div className="flex justify-between">
                              <span>مجموع اقلام:</span>
                              <span>{Math.floor(subtotalAmount)} IQD</span>
                            </div>
                          )}
                          {shippingCost > 0 && (
                            <div className="flex justify-between text-blue-700">
                              <span>هزینه حمل:</span>
                              <span>{Math.floor(shippingCost)} IQD</span>
                            </div>
                          )}
                          {vatAmount > 0 && (
                            <div className="flex justify-between text-green-700">
                              <span>مالیات:</span>
                              <span>{Math.floor(vatAmount)} IQD</span>
                            </div>
                          )}
                          {surchargeAmount > 0 && (
                            <div className="flex justify-between text-orange-700">
                              <span>عوارض:</span>
                              <span>{Math.floor(surchargeAmount)} IQD</span>
                            </div>
                          )}
                          <Separator className="my-1" />
                          <div className="flex justify-between font-bold">
                            <span>مجموع کل:</span>
                            <span>{Math.floor(subtotalAmount + vatAmount + shippingCost + surchargeAmount)} IQD</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {/* دکمه حذف سفارش موقت در سابقه خرید - فقط برای سفارشات پرداخت نشده و بدون رسید */}
                    {(order.status === 'pending' || order.status === 'payment_grace_period') && 
                     (!order.paymentStatus || order.paymentStatus === 'pending' || order.paymentStatus === 'unpaid') &&
                     !order.receiptPath && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteTemporaryOrder(order.id, order.orderNumber)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        حذف سفارش موقت
                      </Button>
                    )}
                    
                    {/* 🧾 دکمه دانلود فاکتور/پیش فاکتور بر اساس نوع فاکتور در سابقه خرید */}
                    {order.invoiceType === 'official_invoice' ? (
                      <Button
                        size="sm"
                        onClick={() => window.open(`/download-invoice/${order.id}`, '_blank')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        دانلود فاکتور رسمی
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => window.open(`/download-proforma-invoice/${order.id}`, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        دانلود پیش‌فاکتور
                      </Button>
                    )}
                    
                    {/* دکمه درخواست فاکتور رسمی برای سفارشات پرداخت شده */}
                    {order.paymentStatus === 'paid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Handle official invoice request
                          window.open(`mailto:info@momtazchem.com?subject=درخواست فاکتور رسمی - سفارش ${order.orderNumber}&body=سلام، لطفاً فاکتور رسمی برای سفارش ${order.orderNumber} را ارسال کنید.`, '_blank');
                        }}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        درخواست فاکتور رسمی
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Export Modal */}
      <Dialog open={showCsvExport} onOpenChange={setShowCsvExport}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-700 flex items-center gap-2">
              <Download className="w-5 h-5" />
              خروجی CSV سفارشات تکمیل شده
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              انتخاب بازه زمانی برای خروجی فایل CSV سفارشات تکمیل شده
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  از تاریخ (اختیاری)
                </label>
                <Input
                  type="date"
                  value={csvStartDate}
                  onChange={(e) => setCsvStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تا تاریخ (اختیاری)
                </label>
                <Input
                  type="date"
                  value={csvEndDate}
                  onChange={(e) => setCsvEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 اگر تاریخی انتخاب نکنید، تمام سفارشات تکمیل شده صادر می‌شود.
                فایل CSV شامل سفارشات تایید شده، تحویل داده شده، یا پرداخت شده خواهد بود.
              </p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCsvExport}
                disabled={isExportingCsv}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isExportingCsv ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    در حال ایجاد CSV...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    دانلود CSV
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => {
                  setShowCsvExport(false);
                  setCsvStartDate("");
                  setCsvEndDate("");
                }}
                variant="outline"
                disabled={isExportingCsv}
              >
                انصراف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank Receipt Upload Modal */}
      <BankReceiptUploadModal
        open={showBankReceiptModal}
        onOpenChange={setShowBankReceiptModal}
        orderNumber={selectedOrderNumber}
        onSuccess={handleModalSuccess}
      />
    </>
  );
};

export default CustomerProfile;
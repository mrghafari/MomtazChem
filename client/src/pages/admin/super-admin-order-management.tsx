import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PaymentMethodBadge from '@/components/PaymentMethodBadge';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Trash2, 
  AlertTriangle, 
  Eye, 
  Search, 
  Shield, 
  RefreshCw,
  Calendar,
  User,
  Mail,
  DollarSign,
  Package,
  Database,
  XCircle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  fullCustomerName?: string;
  fullCustomerEmail?: string;
  totalAmount: string;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}



export default function SuperAdminOrderManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showProductionResetDialog, setShowProductionResetDialog] = useState(false);
  const [preserveCustomers, setPreserveCustomers] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [customerEmailSearch, setCustomerEmailSearch] = useState('');
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Email suggestions query for autocomplete
  const { data: emailSuggestionsData } = useQuery({
    queryKey: ['/api/super-admin/email-suggestions', customerEmailSearch],
    queryFn: async () => {
      if (!customerEmailSearch.trim() || customerEmailSearch.trim().length < 3) {
        return { success: true, data: [] };
      }
      const response = await fetch(`/api/super-admin/email-suggestions?q=${encodeURIComponent(customerEmailSearch.trim())}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: customerEmailSearch.trim().length >= 3,
    staleTime: 5000, // Cache suggestions for 5 seconds
  });

  // Update suggestions when data changes
  React.useEffect(() => {
    if (emailSuggestionsData?.data) {
      setEmailSuggestions(emailSuggestionsData.data);
      setShowSuggestions(emailSuggestionsData.data.length > 0 && customerEmailSearch.trim().length >= 3);
    } else {
      setEmailSuggestions([]);
      setShowSuggestions(false);
    }
  }, [emailSuggestionsData, customerEmailSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = (email: string) => {
    setCustomerEmailSearch(email);
    setShowSuggestions(false);
  };

  // Handle input change
  const handleEmailInputChange = (value: string) => {
    setCustomerEmailSearch(value);
    if (value.trim().length < 3) {
      setShowSuggestions(false);
    }
  };

  // Fetch deletable orders
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['/api/super-admin/deletable-orders'],
    retry: (failureCount, error) => {
      if (error.message.includes('401') || error.message.includes('403')) return false;
      return failureCount < 2;
    },
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache at all - always fresh (v5 syntax)
    refetchOnWindowFocus: true, // Refetch when user comes back
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Force refresh function that completely clears super-admin cache
  const forceRefreshSuperAdminOrders = async () => {
    // Clear all super-admin cache first
    await queryClient.invalidateQueries({ queryKey: ['/api/super-admin/deletable-orders'] });
    await queryClient.removeQueries({ queryKey: ['/api/super-admin/deletable-orders'] });
    // Then refetch
    await refetch();
    toast({
      title: "🔄 به‌روزرسانی شد",
      description: "لیست سفارشات قابل حذف از سرور بازیابی شد",
    });
  };

  // Fetch customer orders by email
  const { data: customerOrdersResponse, isLoading: customerOrdersLoading } = useQuery({
    queryKey: ['/api/super-admin/customer-orders-by-email', customerEmailSearch],
    queryFn: async () => {
      if (!customerEmailSearch.trim()) return null;
      const encodedEmail = encodeURIComponent(customerEmailSearch.trim());
      const response = await fetch(`/api/super-admin/customer-orders-by-email/${encodedEmail}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: activeTab === 'customer-orders' && customerEmailSearch.trim() !== '',
    retry: (failureCount, error) => {
      if (error.message.includes('401') || error.message.includes('403')) return false;
      return failureCount < 2;
    }
  });



  // Extract orders from response with proper error handling
  const orders: Order[] = Array.isArray((response as any)?.data) ? (response as any).data : [];
  const customerOrders: Order[] = Array.isArray((customerOrdersResponse as any)?.data) ? (customerOrdersResponse as any).data : [];
  
  // Debug logging
  console.log('API Response:', response);
  console.log('Orders array:', orders);

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderNumber: string) => {
      const response = await fetch(`/api/super-admin/orders/${orderNumber}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در حذف سفارش');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "سفارش حذف شد",
        description: data.message,
      });
      setShowDeleteDialog(false);
      setSelectedOrder(null);
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/deletable-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/customer-orders-by-email'] });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "خطا در حذف سفارش",
        description: error.message,
        variant: "destructive"
      });
      setShowDeleteDialog(false);
    }
  });

  // Production reset mutation
  const productionResetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/super-admin/reset-for-production', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preserveCustomers
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در پاک‌سازی تولیدی');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "پاک‌سازی موفق",
        description: `${data.message} - ${data.tablesCleared} جدول پاک شد، ${data.recordsDeleted} رکورد حذف شد. کنتور سفارشات از ابتدا شروع خواهد شد.`,
        variant: "default",
      });
      setShowProductionResetDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/deletable-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/customer-orders-by-email'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در پاک‌سازی",
        description: error.message || "مشکلی در پاک‌سازی رخ داده است",
        variant: "destructive",
      });
    },
  });

  // Filter orders based on search with null safety
  const filteredOrders = (orders || []).filter((order: Order) => 
    order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order?.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order?.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check for authentication errors  
  const hasAuthError = (response as any)?.error?.message?.includes('401');
  
  if (hasAuthError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 flex items-center justify-center" dir="rtl">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-red-600 flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              خطای احراز هویت
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">برای دسترسی به این بخش باید وارد حساب مدیریت شوید.</p>
            <Button 
              onClick={() => window.location.href = '/admin/login'}
              className="w-full"
            >
              ورود به پنل مدیریت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDeleteClick = (order: Order) => {
    setSelectedOrder(order);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedOrder) {
      deleteOrderMutation.mutate(selectedOrder.orderNumber);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">مکمل</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">در انتظار</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">لغو شده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAmount = (amount: string, currency: string) => {
    const numericAmount = parseFloat(amount);
    return `${numericAmount.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="mr-2 text-lg">در حال بارگذاری...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-red-900 dark:text-red-100 flex items-center gap-3">
                <Shield className="h-8 w-8 text-red-600" />
                مدیریت سایت - سوپر ادمین
              </h1>
              <p className="text-red-700 dark:text-red-300 mt-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                مدیریت کامل سیستم شامل سفارشات و تنظیمات مدیریتی
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Production Reset Button */}
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setShowProductionResetDialog(true)}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <Database className="w-4 h-4" />
                پاک‌سازی تولیدی
              </Button>
              
              {/* Refresh Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={forceRefreshSuperAdminOrders}
                className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <RefreshCw className="w-4 h-4" />
                به‌روزرسانی قوی
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              مدیریت سفارشات
            </TabsTrigger>
            <TabsTrigger value="customer-orders" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              سفارشات مشتری
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {/* Search and Stats */}
        <Card className="mb-6 border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Search className="h-6 w-6 text-red-600" />
              جستجو و آمار
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Label htmlFor="search">جستجو بر اساس شماره سفارش، نام مشتری، ایمیل یا تلفن</Label>
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجو..."
                  className="mt-1"
                />
              </div>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="mt-6"
              >
                <RefreshCw className="h-4 w-4 ml-2" />
                بروزرسانی
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-red-200">
                <Package className="h-6 w-6 text-red-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-red-900">{(orders || []).length}</div>
                <div className="text-sm text-red-600">کل سفارشات</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-red-200">
                <Search className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-blue-900">{(filteredOrders || []).length}</div>
                <div className="text-sm text-blue-600">نتایج فیلتر</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="h-6 w-6 text-red-600" />
              لیست سفارشات قابل حذف ({(filteredOrders || []).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(filteredOrders || []).length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">سفارشی یافت نشد</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'نتیجه‌ای برای جستجوی شما یافت نشد' : 'هیچ سفارشی برای حذف وجود ندارد'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(filteredOrders || []).map((order: Order) => (
                  <div
                    key={order.id}
                    className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-blue-500" />
                            <span className="font-bold text-blue-900">{order.orderNumber}</span>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-green-500" />
                            <span className="font-medium">{order.customerName}</span>
                            {order.customerPhone && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
                                📱 {order.customerPhone}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            {order.customerEmail}
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{formatAmount(order.totalAmount, order.currency)}</span>
                          </div>
                          <PaymentMethodBadge 
                            paymentMethod={order.paymentMethod}
                          />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            <span className="text-sm">{formatDate(order.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(order)}
                          disabled={deleteOrderMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          حذف کامل
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

          <TabsContent value="customer-orders" className="space-y-6">
            {/* Customer Search */}
            <Card className="mb-6 border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="h-6 w-6 text-blue-600" />
                  جستجوی سفارشات مشتری
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 relative">
                    <Label htmlFor="customer-search">آدرس ایمیل مشتری</Label>
                    <Input
                      id="customer-search"
                      value={customerEmailSearch}
                      onChange={(e) => handleEmailInputChange(e.target.value)}
                      placeholder="مثال: customer@example.com"
                      className="mt-1"
                      type="email"
                      onFocus={() => {
                        if (customerEmailSearch.trim().length >= 3 && emailSuggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow clicks
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                    />
                    {showSuggestions && emailSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                        {emailSuggestions.map((email, index) => (
                          <div
                            key={index}
                            onClick={() => handleSuggestionSelect(email)}
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-900 dark:text-gray-100">{email}</span>
                            </div>
                          </div>
                        ))}
                        {customerEmailSearch.trim().length >= 3 && emailSuggestions.length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            هیچ ایمیل مشابهی یافت نشد
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      if (customerEmailSearch.trim()) {
                        // The query will automatically fetch when customerEmailSearch changes
                      }
                    }}
                    variant="default"
                    disabled={!customerEmailSearch.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Search className="h-4 w-4 ml-2" />
                    جستجو
                  </Button>
                </div>
                {customerEmailSearch.trim() && (
                  <div className="text-sm text-blue-600">
                    جستجو برای سفارشات مشتری با ایمیل: {customerEmailSearch}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Orders Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Package className="h-6 w-6 text-green-600" />
                  سفارشات مشتری
                  {customerOrders.length > 0 && (
                    <Badge className="bg-green-100 text-green-800 ml-2">
                      {customerOrders.length} سفارش
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customerOrdersLoading && customerEmailSearch.trim() ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="mr-2 text-lg">در حال جستجو...</span>
                  </div>
                ) : !customerEmailSearch.trim() ? (
                  <div className="text-center py-12">
                    <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">آدرس ایمیل مشتری را وارد کنید</h3>
                    <p className="text-gray-500">برای جستجوی سفارشات، آدرس ایمیل مشتری مورد نظر را در بالا وارد کنید</p>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">سفارشی یافت نشد</h3>
                    <p className="text-gray-500">هیچ سفارشی برای مشتری با ایمیل {customerEmailSearch} پیدا نشد</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerOrders.map((order: Order) => (
                      <div key={order.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Package className="h-5 w-5 text-blue-500" />
                                <span className="font-semibold text-lg text-blue-700">
                                  {order.orderNumber || 'بدون شماره سفارش'}
                                </span>
                                {getStatusBadge(order.status)}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-green-500" />
                                  <span>{order.customerName || order.fullCustomerName || 'نامشخص'}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-blue-500" />
                                  <span>{order.customerEmail || order.fullCustomerEmail || 'ایمیل نامشخص'}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-yellow-500" />
                                  <span>{formatAmount(order.totalAmount, order.currency)}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-purple-500" />
                                  <span>{formatDate(order.createdAt)}</span>
                                </div>
                              </div>
                              
                              <div className="mt-2">
                                <PaymentMethodBadge 
                                  paymentMethod={order.paymentMethod}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(order)}
                              disabled={deleteOrderMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف سفارش
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                تأیید حذف کامل سفارش
              </AlertDialogTitle>
              <AlertDialogDescription className="text-right space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-800 mb-2">⚠️ هشدار مهم:</p>
                  <p className="text-red-700">
                    این عملیات سفارش <strong>{selectedOrder?.orderNumber}</strong> را به طور کامل از تمام بخش‌های سیستم حذف می‌کند:
                  </p>
                </div>
                
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>سفارش اصلی و آیتم‌های آن</li>
                  <li>رکوردهای مدیریت سفارش</li>
                  <li>رسیدهای پرداخت</li>
                  <li>تراکنش‌های کیف پول</li>
                  <li>تأییدیه‌های تحویل GPS</li>
                  <li>تاریخچه انتخاب وسیله نقلیه</li>
                  <li>کدهای تأیید تحویل</li>
                  <li>لاگ‌های ایمیل و SMS</li>
                  <li>سایر رکوردهای مرتبط</li>
                </ul>
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium">
                    🚨 این عملیات غیرقابل بازگشت است و امکان بازیابی اطلاعات وجود ندارد.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse">
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleteOrderMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteOrderMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                    در حال حذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 ml-2" />
                    بله، حذف کامل شود
                  </>
                )}
              </AlertDialogAction>
              <AlertDialogCancel disabled={deleteOrderMutation.isPending}>
                انصراف
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Production Reset Confirmation Dialog */}
        <AlertDialog open={showProductionResetDialog} onOpenChange={setShowProductionResetDialog}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-6 w-6" />
                پاک‌سازی کامل برای محیط تولیدی
              </AlertDialogTitle>
              <AlertDialogDescription className="text-right space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-bold text-red-800 mb-3">⚠️ هشدار خطرناک:</p>
                  <p className="text-red-700 mb-2">
                    این عملیات تمامی داده‌های تست را از سیستم پاک می‌کند و آن را برای محیط تولیدی آماده می‌کند:
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-800">جداول پاک شونده:</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>تمام سفارشات تست</li>
                      <li className={preserveCustomers ? "text-gray-400 line-through" : ""}>
                        مشتریان آزمایشی {preserveCustomers && "(حفظ می‌شود)"}
                      </li>
                      <li>تراکنش‌های کیف پول</li>
                      <li>رسیدهای پرداخت</li>
                      <li>کدهای تحویل GPS</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-800">کنتورهای بازنشانی:</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>شماره سفارشات → M2500001</li>
                      <li className={preserveCustomers ? "text-gray-400 line-through" : ""}>
                        شماره مشتریان → {preserveCustomers ? "تغییر نمی‌کند" : "1"}
                      </li>
                      <li>سایر کنتورها → صفر</li>
                    </ul>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-bold mb-2">🚨 توجه مهم:</p>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>• این عملیات غیرقابل بازگشت است</li>
                    <li>• فقط قبل از راه‌اندازی رسمی استفاده کنید</li>
                    <li>• سیستم آماده دریافت سفارشات واقعی می‌شود</li>
                    <li>• پشتیبان‌گیری قبل از اجرا توصیه می‌شود</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">
                    ✅ پس از پاک‌سازی، سیستم کاملاً تمیز و آماده برای محیط تولیدی خواهد بود.
                  </p>
                </div>

                {/* Customer Preservation Option */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Checkbox
                      id="preserve-customers"
                      checked={preserveCustomers}
                      onCheckedChange={(checked) => setPreserveCustomers(checked === true)}
                      className="h-5 w-5"
                    />
                    <div className="flex-1">
                      <Label htmlFor="preserve-customers" className="text-blue-800 font-medium cursor-pointer">
                        حفظ اطلاعات مشتریان موجود
                      </Label>
                      <p className="text-blue-600 text-sm mt-1">
                        در صورت فعال بودن، اطلاعات مشتریان و آدرس‌های آن‌ها پاک نمی‌شوند. فقط سفارشات و تراکنش‌ها حذف می‌شوند.
                      </p>
                    </div>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse">
              <AlertDialogAction
                onClick={() => productionResetMutation.mutate()}
                disabled={productionResetMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {productionResetMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                    در حال پاک‌سازی...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 ml-2" />
                    تائید - پاک‌سازی کامل
                  </>
                )}
              </AlertDialogAction>
              <AlertDialogCancel disabled={productionResetMutation.isPending}>
                انصراف
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
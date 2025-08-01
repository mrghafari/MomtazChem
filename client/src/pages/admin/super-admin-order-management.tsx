import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  CreditCard,
  Settings,
  Building2,
  Wallet
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
  totalAmount: string;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentGateway {
  id: number;
  name: string;
  type: string;
  enabled: boolean;
  config: any;
  createdAt: string;
  updatedAt: string;
}

export default function SuperAdminOrderManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch deletable orders
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['/api/super-admin/deletable-orders'],
    retry: (failureCount, error) => {
      if (error.message.includes('401') || error.message.includes('403')) return false;
      return failureCount < 2;
    }
  });

  // Fetch payment gateways
  const { data: gatewaysResponse, isLoading: gatewaysLoading } = useQuery({
    queryKey: ['/api/payment/gateways'],
    retry: (failureCount, error) => {
      if (error.message.includes('401') || error.message.includes('403')) return false;
      return failureCount < 2;
    }
  });

  // Extract gateways with proper error handling
  const gateways = Array.isArray(gatewaysResponse) ? gatewaysResponse : [];

  // Extract orders from response with proper error handling
  const orders = Array.isArray(response?.data) ? response.data : [];
  
  // Debug logging
  console.log('API Response:', response);
  console.log('Orders array:', orders);
  console.log('Gateways Response:', gatewaysResponse);
  console.log('Gateways array:', gateways);

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

  // Toggle gateway status mutation
  const toggleGatewayMutation = useMutation({
    mutationFn: async (gatewayId: number) => {
      return apiRequest(`/api/payment/gateways/${gatewayId}/toggle`, { method: 'PATCH' });
    },
    onSuccess: () => {
      toast({
        title: "وضعیت درگاه تغییر کرد",
        description: "وضعیت درگاه پرداخت با موفقیت تغییر کرد. فقط یک درگاه می‌تواند فعال باشد.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment/gateways'] });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "تغییر وضعیت درگاه با شکست مواجه شد.",
        variant: "destructive",
      });
    },
  });

  // Filter orders based on search with null safety
  const filteredOrders = (orders || []).filter(order => 
    order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order?.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check for authentication errors
  const hasAuthError = response?.error?.message?.includes('401') || gatewaysResponse?.error?.message?.includes('401');
  
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

  const getGatewayIcon = (type: string) => {
    switch (type) {
      case 'iraqi_bank':
        return <Building2 className="w-5 h-5" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5" />;
      case 'digital_wallet':
        return <Wallet className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getGatewayTypeLabel = (type: string) => {
    switch (type) {
      case 'iraqi_bank':
        return 'بانک عراقی';
      case 'credit_card':
        return 'کارت اعتباری';
      case 'digital_wallet':
        return 'کیف پول دیجیتال';
      case 'bank_transfer':
        return 'حواله بانکی';
      default:
        return type;
    }
  };

  if (isLoading || gatewaysLoading) {
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
          <h1 className="text-3xl font-bold text-red-900 dark:text-red-100 flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-600" />
            مدیریت سایت - سوپر ادمین
          </h1>
          <p className="text-red-700 dark:text-red-300 mt-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            مدیریت کامل سیستم شامل سفارشات، درگاه‌های پرداخت و تنظیمات
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              مدیریت سفارشات
            </TabsTrigger>
            <TabsTrigger value="gateways" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              درگاه‌های پرداخت
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
                <Label htmlFor="search">جستجو بر اساس شماره سفارش، نام مشتری یا ایمیل</Label>
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
                {(filteredOrders || []).map((order) => (
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
                          <Badge variant="outline">{order.paymentMethod}</Badge>
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

          <TabsContent value="gateways" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  مدیریت درگاه‌های پرداخت
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {(gateways || []).length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">درگاه پرداختی یافت نشد</h3>
                      <p className="text-gray-500">هیچ درگاه پرداختی در سیستم ثبت نشده است</p>
                    </div>
                  ) : (
                    (gateways || []).map((gateway: PaymentGateway) => (
                      <div key={gateway.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getGatewayIcon(gateway.type)}
                              <div>
                                <h3 className="font-semibold text-lg">{gateway.name}</h3>
                                <p className="text-sm text-gray-600">{getGatewayTypeLabel(gateway.type)}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <Badge 
                                variant={gateway.enabled ? "default" : "secondary"}
                                className={gateway.enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {gateway.enabled ? 'فعال' : 'غیرفعال'}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(gateway.updatedAt)}
                              </p>
                            </div>
                            
                            <Button
                              onClick={() => toggleGatewayMutation.mutate(gateway.id)}
                              disabled={toggleGatewayMutation.isPending}
                              size="sm"
                              variant={gateway.enabled ? "outline" : "default"}
                            >
                              {gateway.enabled ? 'غیرفعال کردن' : 'فعال کردن'}
                            </Button>
                          </div>
                        </div>
                        
                        {gateway.config && (
                          <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                            <h4 className="font-medium mb-2">تنظیمات درگاه:</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {Object.entries(gateway.config).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="font-medium">{key}:</span>
                                  <span className="text-gray-600">
                                    {key.toLowerCase().includes('secret') ? '***' : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
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
      </div>
    </div>
  );
}
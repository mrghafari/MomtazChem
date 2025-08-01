import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Truck, Package, Settings, Plus, Edit, Eye, MapPin, Phone, Car, Calendar, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import DeliveryMethodsManagement from "@/components/DeliveryMethodsManagement";
import ShippingRatesManagement from "@/components/ShippingRatesManagement";

// Types
interface LogisticsOrder {
  id: number;
  customerOrderId: number;
  orderNumber?: string;
  currentStatus: string;
  totalAmount: string;
  currency: string;
  deliveryMethod: string;
  transportationType?: string;
  
  // Weight information for shipping calculations
  totalWeight?: string;
  weightUnit?: string;
  
  // Warehouse processing date for logistics planning
  warehouseProcessedAt?: string;
  
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  postalServiceName?: string;
  postalTrackingCode?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  driverName?: string;
  driverPhone?: string;
  deliveryCompanyName?: string;
  deliveryCompanyPhone?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  shippingAddress?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
}

interface ShippingRate {
  id: number;
  deliveryMethod: string;
  transportationType?: string;
  cityName?: string;
  provinceName?: string;
  basePrice: string;
  pricePerKg?: string;
  freeShippingThreshold?: string;
  estimatedDays?: number;
  trackingAvailable: boolean;
  insuranceAvailable: boolean;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Validation schemas
const deliveryInfoSchema = z.object({
  trackingNumber: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
  deliveryPersonName: z.string().optional(),
  deliveryPersonPhone: z.string().optional(),
  postalServiceName: z.string().optional(),
  postalTrackingCode: z.string().optional(),
  vehicleType: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleColor: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  deliveryCompanyName: z.string().optional(),
  deliveryCompanyPhone: z.string().optional(),
  notes: z.string().optional(),
});

const shippingRateSchema = z.object({
  deliveryMethod: z.string().min(1, "روش ارسال الزامی است"),
  transportationType: z.string().optional(),
  cityName: z.string().optional(),
  provinceName: z.string().optional(),
  basePrice: z.string().min(1, "قیمت پایه الزامی است"),
  pricePerKg: z.string().optional(),
  freeShippingThreshold: z.string().optional(),
  estimatedDays: z.number().optional(),
  trackingAvailable: z.boolean().default(false),
  insuranceAvailable: z.boolean().default(false),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export default function LogisticsDepartment() {
  const [selectedOrder, setSelectedOrder] = useState<LogisticsOrder | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shippingRateDialogOpen, setShippingRateDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const deliveryForm = useForm({
    resolver: zodResolver(deliveryInfoSchema),
    defaultValues: {
      trackingNumber: "",
      estimatedDeliveryDate: "",
      deliveryPersonName: "",
      deliveryPersonPhone: "",
      postalServiceName: "",
      postalTrackingCode: "",
      vehicleType: "",
      vehiclePlate: "",
      vehicleModel: "",
      vehicleColor: "",
      driverName: "",
      driverPhone: "",
      deliveryCompanyName: "",
      deliveryCompanyPhone: "",
      notes: "",
    }
  });

  const shippingRateForm = useForm({
    resolver: zodResolver(shippingRateSchema),
    defaultValues: {
      deliveryMethod: "",
      transportationType: undefined,
      cityName: "",
      provinceName: "",
      basePrice: "",
      pricePerKg: "",
      freeShippingThreshold: "",
      estimatedDays: undefined,
      trackingAvailable: false,
      insuranceAvailable: false,
      description: "",
      isActive: true,
    }
  });

  // Check logistics authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/logistics/auth/me');
        if (!response.ok) {
          setLocation('/admin/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setLocation('/admin/login');
      }
    };

    checkAuth();
  }, [setLocation]);

  // Get refresh interval from global settings
  const getRefreshInterval = () => {
    const globalSettings = localStorage.getItem('global-refresh-settings');
    if (globalSettings) {
      const settings = JSON.parse(globalSettings);
      const logisticsSettings = settings.departments.logistics;
      
      if (logisticsSettings?.autoRefresh) {
        const refreshInterval = settings.syncEnabled 
          ? settings.globalInterval 
          : logisticsSettings.interval;
        return refreshInterval * 1000; // Convert seconds to milliseconds
      }
    }
    return 600000; // Default 10 minutes if no settings found
  };

  // Fetch logistics orders
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ["/api/order-management/logistics"],
    refetchInterval: getRefreshInterval(),
  });

  // Fetch shipping rates
  const { data: shippingRatesData, isLoading: ratesLoading, refetch: refetchRates } = useQuery({
    queryKey: ["/api/logistics/shipping-rates"],
  });

  const orders = (ordersData as any)?.orders || [];
  const shippingRates = (shippingRatesData as any)?.data || [];

  // Update delivery info mutation
  const updateDeliveryMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/logistics/orders/${selectedOrder?.id}/delivery-info`, { method: 'PUT', body: data });
    },
    onSuccess: () => {
      toast({ title: "موفق", description: "اطلاعات ارسال به‌روزرسانی شد" });
      queryClient.invalidateQueries({ queryKey: ["/api/order-management/logistics"] });
      setDialogOpen(false);
      setSelectedOrder(null);
      deliveryForm.reset();
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در به‌روزرسانی اطلاعات ارسال", variant: "destructive" });
    }
  });

  // Complete delivery mutation
  const completeDeliveryMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest(`/api/logistics/orders/${orderId}/complete`, { method: 'POST', body: {} });
    },
    onSuccess: () => {
      toast({ title: "موفق", description: "تحویل سفارش تکمیل شد" });
      queryClient.invalidateQueries({ queryKey: ["/api/order-management/logistics"] });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در تکمیل تحویل", variant: "destructive" });
    }
  });

  // Shipping rate mutations
  const saveShippingRateMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = editingRate 
        ? `/api/logistics/shipping-rates/${editingRate.id}`
        : '/api/logistics/shipping-rates';
      const method = editingRate ? 'PUT' : 'POST';
      return apiRequest(endpoint, { method, body: data });
    },
    onSuccess: () => {
      toast({ 
        title: "موفق", 
        description: editingRate ? "نرخ ارسال به‌روزرسانی شد" : "نرخ ارسال جدید اضافه شد" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/shipping-rates"] });
      setShippingRateDialogOpen(false);
      setEditingRate(null);
      shippingRateForm.reset();
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در ذخیره نرخ ارسال", variant: "destructive" });
    }
  });

  const deleteShippingRateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/logistics/shipping-rates/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: "موفق", description: "نرخ ارسال حذف شد" });
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/shipping-rates"] });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در حذف نرخ ارسال", variant: "destructive" });
    }
  });

  // Handlers
  const handleOrderClick = (order: LogisticsOrder) => {
    setSelectedOrder(order);
    
    // Pre-populate form with existing data
    deliveryForm.reset({
      trackingNumber: order.trackingNumber || "",
      estimatedDeliveryDate: order.estimatedDeliveryDate ? order.estimatedDeliveryDate.split('T')[0] : "",
      deliveryPersonName: order.deliveryPersonName || "",
      deliveryPersonPhone: order.deliveryPersonPhone || "",
      postalServiceName: order.postalServiceName || "",
      postalTrackingCode: order.postalTrackingCode || "",
      vehicleType: order.vehicleType || "",
      vehiclePlate: order.vehiclePlate || "",
      vehicleModel: order.vehicleModel || "",
      vehicleColor: order.vehicleColor || "",
      driverName: order.driverName || "",
      driverPhone: order.driverPhone || "",
      deliveryCompanyName: order.deliveryCompanyName || "",
      deliveryCompanyPhone: order.deliveryCompanyPhone || "",
      notes: "",
    });
    
    setDialogOpen(true);
  };

  const handleShippingRateEdit = (rate: ShippingRate) => {
    setEditingRate(rate);
    shippingRateForm.reset(rate as any);
    setShippingRateDialogOpen(true);
  };

  const handleShippingRateAdd = () => {
    setEditingRate(null);
    shippingRateForm.reset();
    setShippingRateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'warehouse_approved':
        return <Badge className="bg-blue-100 text-blue-800">آماده ارسال</Badge>;
      case 'logistics_assigned':
        return <Badge className="bg-orange-100 text-orange-800">در حال پردازش</Badge>;
      case 'logistics_dispatched':
        return <Badge className="bg-purple-100 text-purple-800">ارسال شده</Badge>;
      case 'logistics_delivered':
        return <Badge className="bg-green-100 text-green-800">تحویل داده شده</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDeliveryMethodLabel = (method: string) => {
    switch (method) {
      case 'post': return 'پست';
      case 'courier': return 'پیک';
      case 'truck': return 'کامیون';
      case 'personal_pickup': return 'تحویل حضوری';
      default: return method;
    }
  };

  if (ordersLoading || ratesLoading) {
    return <div className="flex items-center justify-center min-h-screen">در حال بارگذاری...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Truck className="w-8 h-8 text-blue-600" />
              بخش لجستیک
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              مدیریت ارسال سفارشات و تنظیم هزینه‌های حمل
            </p>
          </div>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="w-full flex flex-wrap justify-center gap-2 h-auto p-2">
            <TabsTrigger value="orders" className="flex items-center gap-2 px-4 py-2">
              <Package className="w-4 h-4" />
              سفارشات
            </TabsTrigger>
            <TabsTrigger value="vehicle-optimization" className="flex items-center gap-2 px-4 py-2">
              <Car className="w-4 h-4" />
              انتخاب وسیله نقلیه
            </TabsTrigger>
            <TabsTrigger value="delivery-methods" className="flex items-center gap-2 px-4 py-2">
              <Truck className="w-4 h-4" />
              انواع ارسال
            </TabsTrigger>
            <TabsTrigger value="shipping-rates" className="flex items-center gap-2 px-4 py-2">
              <BarChart3 className="w-4 h-4" />
              تعرفه‌های ارسال
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="space-y-4">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">هیچ سفارشی برای پردازش وجود ندارد</p>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order: LogisticsOrder) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <h3 className="text-lg font-semibold">سفارش {order.orderNumber}</h3>
                            {getStatusBadge(order.currentStatus)}
                            <Badge variant="outline">{getDeliveryMethodLabel(order.deliveryMethod)}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">اطلاعات مشتری</h4>
                              <p className="text-sm text-gray-600">
                                {order.customer?.firstName && order.customer?.lastName 
                                  ? `${order.customer.firstName} ${order.customer.lastName}`
                                  : 'نام مشتری ناشناس'
                                }
                              </p>
                              <p className="text-sm text-gray-600">{order.customer?.phone || 'شماره تلفن ثبت نشده'}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">اطلاعات ارسال</h4>
                              
                              {/* Total Weight Display */}
                              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800">
                                    وزن کل: {order.totalWeight ? `${order.totalWeight} ${order.weightUnit || 'kg'}` : 'محاسبه نشده'}
                                  </span>
                                </div>
                                <p className="text-xs text-blue-600 mt-1">
                                  برای انتخاب وسیله حمل مناسب از این وزن استفاده کنید
                                </p>
                              </div>
                              
                              {/* Warehouse Processing Date Display */}
                              <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-800">
                                    تاریخ پردازش انبار: {order.warehouseProcessedAt ? 
                                      new Date(order.warehouseProcessedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      }) : 'در انتظار پردازش'
                                    }
                                  </span>
                                </div>
                                <p className="text-xs text-green-600 mt-1">
                                  زمان تایید و آماده‌سازی سفارش در انبار
                                </p>
                              </div>
                              
                              {order.trackingNumber && (
                                <p className="text-sm text-gray-600">کد رهگیری: {order.trackingNumber}</p>
                              )}
                              {order.estimatedDeliveryDate && (
                                <p className="text-sm text-gray-600">
                                  تاریخ تحویل: {new Date(order.estimatedDeliveryDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </p>
                              )}
                              {order.deliveryPersonName && (
                                <p className="text-sm text-gray-600">تحویل‌دهنده: {order.deliveryPersonName}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleOrderClick(order)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            مدیریت ارسال
                          </Button>
                          
                          <Button
                            onClick={() => window.open(`/admin/vehicle-optimization?orderId=${order.id}&weight=${order.totalWeight}&destination=${encodeURIComponent(order.shippingAddress?.city || '')}`, '_blank')}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Car className="w-4 h-4 mr-2" />
                            انتخاب وسیله نقلیه
                          </Button>
                          
                          {order.currentStatus !== 'logistics_delivered' && (
                            <Button
                              onClick={() => completeDeliveryMutation.mutate(order.id)}
                              className="bg-green-600 hover:bg-green-700"
                              disabled={completeDeliveryMutation.isPending}
                            >
                              <Package className="w-4 h-4 mr-2" />
                              تکمیل تحویل
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>



          {/* Vehicle Optimization Tab */}
          <TabsContent value="vehicle-optimization">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  انتخاب وسیله نقلیه بهینه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">هیچ سفارشی برای بهینه‌سازی وسیله نقلیه وجود ندارد</p>
                    </div>
                  ) : (
                    orders.map((order: LogisticsOrder) => (
                      <Card key={order.id} className="hover:shadow-md transition-shadow bg-purple-50 border-purple-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-4">
                                <h3 className="text-lg font-semibold">سفارش {order.orderNumber}</h3>
                                {getStatusBadge(order.currentStatus)}
                                <Badge variant="outline" className="bg-purple-100">{getDeliveryMethodLabel(order.deliveryMethod)}</Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <span className="font-medium text-purple-700">مشتری:</span>
                                  <p className="text-gray-700">
                                    {order.customer?.firstName && order.customer?.lastName 
                                      ? `${order.customer.firstName} ${order.customer.lastName}`
                                      : 'نامشخص'}
                                  </p>
                                </div>
                                
                                <div>
                                  <span className="font-medium text-purple-700">وزن:</span>
                                  <p className="text-gray-700">
                                    {order.totalWeight ? `${order.totalWeight} ${order.weightUnit || 'kg'}` : 'نامشخص'}
                                  </p>
                                </div>
                                
                                <div>
                                  <span className="font-medium text-purple-700">مقصد:</span>
                                  <p className="text-gray-700">
                                    {order.shippingAddress?.city || 'نامشخص'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <Button
                              onClick={() => window.open(`/admin/vehicle-optimization?orderId=${order.id}&weight=${order.totalWeight}&destination=${encodeURIComponent(order.shippingAddress?.city || '')}`, '_blank')}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Car className="w-4 h-4 mr-2" />
                              انتخاب وسیله نقلیه
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Methods Tab */}
          <TabsContent value="delivery-methods">
            <DeliveryMethodsManagement />
          </TabsContent>

          {/* Shipping Rates Tab */}
          <TabsContent value="shipping-rates">
            <ShippingRatesManagement />
          </TabsContent>
        </Tabs>

        {/* Vehicle Optimization Button */}
        <div className="mt-6 text-center">
          <Button 
            onClick={() => window.location.href = '/admin/vehicle-optimization'} 
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 mx-auto"
          >
            <Car className="w-5 h-5" />
            سیستم انتخاب وسیله نقلیه بهینه
          </Button>
          <p className="text-sm text-gray-600 mt-2">
            الگوریتم هوشمند انتخاب وسیله نقلیه بر اساس وزن، مسافت و هزینه
          </p>
        </div>

        {/* Delivery Info Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>مدیریت ارسال سفارش #{selectedOrder?.customerOrderId}</DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <Form {...deliveryForm}>
                <form onSubmit={deliveryForm.handleSubmit((data) => updateDeliveryMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* General Delivery Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">اطلاعات کلی</h3>
                      
                      <FormField
                        control={deliveryForm.control}
                        name="trackingNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>کد رهگیری</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="کد رهگیری ارسال" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={deliveryForm.control}
                        name="estimatedDeliveryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاریخ تحویل تخمینی</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={deliveryForm.control}
                        name="deliveryPersonName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نام تحویل‌دهنده</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="نام فرد تحویل‌دهنده" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={deliveryForm.control}
                        name="deliveryPersonPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>شماره تماس تحویل‌دهنده</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="شماره تماس" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Method-specific fields */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        اطلاعات {getDeliveryMethodLabel(selectedOrder.deliveryMethod)}
                      </h3>
                      
                      {selectedOrder.deliveryMethod === 'post' && (
                        <>
                          <FormField
                            control={deliveryForm.control}
                            name="postalServiceName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>نام سرویس پستی</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="پست ایران، پیشتاز، ..." />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={deliveryForm.control}
                            name="postalTrackingCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>کد رهگیری پستی</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="کد رهگیری پست" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                      
                      {(selectedOrder.deliveryMethod === 'courier' || selectedOrder.deliveryMethod === 'truck') && (
                        <>
                          <FormField
                            control={deliveryForm.control}
                            name="vehicleType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>نوع وسیله نقلیه</FormLabel>
                                <FormControl>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="انتخاب نوع وسیله" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="motorcycle">موتورسیکلت</SelectItem>
                                      <SelectItem value="car">خودرو</SelectItem>
                                      <SelectItem value="van">ون</SelectItem>
                                      <SelectItem value="truck">کامیون</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={deliveryForm.control}
                            name="vehiclePlate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>پلاک وسیله نقلیه</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="شماره پلاک" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={deliveryForm.control}
                            name="vehicleModel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>مدل وسیله نقلیه</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="مدل و برند" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={deliveryForm.control}
                            name="vehicleColor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>رنگ وسیله نقلیه</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="رنگ وسیله" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={deliveryForm.control}
                            name="driverName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>نام راننده</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="نام و نام خانوادگی راننده" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={deliveryForm.control}
                            name="driverPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>شماره تماس راننده</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="شماره موبایل راننده" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                      
                      <FormField
                        control={deliveryForm.control}
                        name="deliveryCompanyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نام شرکت حمل</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="تیپاکس، ماهکس، ..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={deliveryForm.control}
                        name="deliveryCompanyPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تلفن شرکت حمل</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="شماره تماس شرکت" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <FormField
                    control={deliveryForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>یادداشت‌ها</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="یادداشت‌های اضافی در مورد ارسال" rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      انصراف
                    </Button>
                    <Button type="submit" disabled={updateDeliveryMutation.isPending}>
                      {updateDeliveryMutation.isPending ? "در حال ذخیره..." : "ذخیره اطلاعات"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>

        {/* Shipping Rate Dialog */}
        <Dialog open={shippingRateDialogOpen} onOpenChange={setShippingRateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRate ? "ویرایش نرخ ارسال" : "افزودن نرخ ارسال جدید"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...shippingRateForm}>
              <form onSubmit={shippingRateForm.handleSubmit((data) => saveShippingRateMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={shippingRateForm.control}
                    name="deliveryMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>روش ارسال</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب روش ارسال" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="post">پست</SelectItem>
                              <SelectItem value="courier">پیک</SelectItem>
                              <SelectItem value="truck">کامیون</SelectItem>
                              <SelectItem value="personal_pickup">تحویل حضوری</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={shippingRateForm.control}
                    name="transportationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع وسیله نقلیه</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب وسیله" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="motorcycle">موتورسیکلت</SelectItem>
                              <SelectItem value="car">خودرو</SelectItem>
                              <SelectItem value="van">ون</SelectItem>
                              <SelectItem value="truck">کامیون</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={shippingRateForm.control}
                    name="cityName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شهر (اختیاری)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="نام شهر برای قیمت‌گذاری خاص" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={shippingRateForm.control}
                    name="provinceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>استان (اختیاری)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="نام استان" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={shippingRateForm.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>قیمت پایه (IQD)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={shippingRateForm.control}
                    name="pricePerKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>قیمت هر کیلوگرم (اختیاری)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={shippingRateForm.control}
                    name="freeShippingThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>حد آستانه ارسال رایگان</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="مبلغ برای ارسال رایگان" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={shippingRateForm.control}
                    name="estimatedDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مدت تحویل (روز)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="تعداد روز" onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={shippingRateForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توضیحات</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="توضیحات سرویس برای مشتریان" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => setShippingRateDialogOpen(false)}>
                    انصراف
                  </Button>
                  <Button type="submit" disabled={saveShippingRateMutation.isPending}>
                    {saveShippingRateMutation.isPending ? "در حال ذخیره..." : "ذخیره"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
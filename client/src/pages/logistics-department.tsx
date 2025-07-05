import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Truck, CheckCircle, XCircle, Clock, Package, MapPin, Phone, User, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface OrderManagement {
  id: number;
  customerOrderId: number;
  currentStatus: string;
  deliveryCode: string | null;
  
  // Warehouse (completed)
  warehouseAssigneeId: number | null;
  warehouseProcessedAt: string | null;
  warehouseNotes: string | null;
  
  // Logistics
  logisticsAssigneeId: number | null;
  logisticsProcessedAt: string | null;
  logisticsNotes: string | null;
  trackingNumber: string | null;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  deliveryPersonName: string | null;
  deliveryPersonPhone: string | null;
  
  createdAt: string;
  updatedAt: string;
  
  // Customer info
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  
  // Order info
  order?: {
    totalAmount: number;
    orderItems: Array<{
      productName: string;
      quantity: number;
      price: number;
    }>;
  };
}

interface LogisticsUser {
  id: number;
  username: string;
  email: string;
  department: string;
}

export default function LogisticsDepartment() {
  const [selectedOrder, setSelectedOrder] = useState<OrderManagement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [user, setUser] = useState<LogisticsUser | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      trackingNumber: "",
      estimatedDeliveryDate: "",
      deliveryPersonName: "",
      deliveryPersonPhone: "",
      notes: "",
      action: "assign" as "assign" | "dispatch" | "deliver"
    }
  });

  // Check authentication and user department
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/logistics/auth/me');
        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.user.department === 'logistics') {
            setUser(userData.user);
          } else {
            setLocation('/logistics/login');
          }
        } else {
          setLocation('/logistics/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setLocation('/logistics/login');
      }
    };

    checkAuth();
  }, [setLocation]);

  // Fetch logistics pending orders - only warehouse approved orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/logistics/orders"],
    enabled: !!user,
    refetchInterval: 300000, // Auto-refresh every 5 minutes
  });

  // Process order mutation
  const processOrderMutation = useMutation({
    mutationFn: async (data: { 
      orderId: number; 
      action: "assign" | "dispatch" | "deliver"; 
      trackingNumber?: string;
      estimatedDeliveryDate?: string;
      deliveryPersonName?: string;
      deliveryPersonPhone?: string;
      notes: string;
    }) => {
      return apiRequest(`/api/logistics/orders/${data.orderId}/process`, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          assigneeId: user?.id
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/orders"] });
      setDialogOpen(false);
      setSelectedOrder(null);
      form.reset();
      toast({
        title: "موفق",
        description: "سفارش با موفقیت پردازش شد",
      });
    },
    onError: (error) => {
      toast({
        title: "خطا",
        description: "خطا در پردازش سفارش",
        variant: "destructive",
      });
    }
  });

  const handleProcessOrder = (values: { 
    trackingNumber: string;
    estimatedDeliveryDate: string;
    deliveryPersonName: string;
    deliveryPersonPhone: string;
    notes: string; 
    action: "assign" | "dispatch" | "deliver";
  }) => {
    if (!selectedOrder) return;
    
    processOrderMutation.mutate({
      orderId: selectedOrder.id,
      ...values
    });
  };

  const logout = async () => {
    try {
      await fetch('/api/logistics/logout', { method: 'POST' });
      setLocation('/logistics/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const generateTrackingNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TRK${timestamp}${random}`;
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">در حال بارگذاری...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Truck className="w-8 h-8 text-purple-600" />
              بخش لجستیک
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              مدیریت ارسال و تحویل سفارشات
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className="text-sm">{user.username}</span>
            </div>
            <Button 
              variant="outline" 
              onClick={logout}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              خروج
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">آماده ارسال</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">در حال ارسال</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تحویل شده امروز</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مشکل ارسال</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="text-center py-8">در حال بارگذاری...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">هیچ سفارشی آماده ارسال نیست</h3>
              <p className="text-gray-500">تمام سفارشات آماده شده از انبار پردازش شده‌اند</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: OrderManagement) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <Badge variant="secondary" className="px-3 py-1">
                          سفارش #{order.customerOrderId}
                        </Badge>
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          آماده شده از انبار
                        </Badge>
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          آماده ارسال
                        </Badge>
                        {order.deliveryCode && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            کد تحویل: {order.deliveryCode}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">اطلاعات مشتری</h4>
                          <p className="text-sm text-gray-600">
                            {order.customer?.firstName} {order.customer?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{order.customer?.phone}</p>
                          <div className="flex items-start gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600">{order.customer?.address}, {order.customer?.city}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">اطلاعات سفارش</h4>
                          <p className="text-sm text-gray-600">
                            مبلغ کل: {order.order?.totalAmount?.toLocaleString()} تومان
                          </p>
                          <p className="text-sm text-gray-600">
                            تاریخ آماده‌سازی: {order.warehouseProcessedAt ? new Date(order.warehouseProcessedAt).toLocaleDateString('fa-IR') : '-'}
                          </p>
                          {order.trackingNumber && (
                            <p className="text-sm text-gray-600">
                              کد رهگیری: {order.trackingNumber}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">وضعیت ارسال</h4>
                          {order.deliveryPersonName && (
                            <p className="text-sm text-gray-600">
                              پیک: {order.deliveryPersonName}
                            </p>
                          )}
                          {order.deliveryPersonPhone && (
                            <p className="text-sm text-gray-600">
                              تلفن پیک: {order.deliveryPersonPhone}
                            </p>
                          )}
                          {order.estimatedDeliveryDate && (
                            <p className="text-sm text-gray-600">
                              تاریخ تحویل: {new Date(order.estimatedDeliveryDate).toLocaleDateString('fa-IR')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {order.warehouseNotes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <h5 className="text-sm font-medium text-blue-800 mb-1">یادداشت انبار:</h5>
                          <p className="text-sm text-blue-700">{order.warehouseNotes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => {
                          setSelectedOrder(order);
                          form.setValue("trackingNumber", order.trackingNumber || generateTrackingNumber());
                          setDialogOpen(true);
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        مدیریت ارسال
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Process Order Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>مدیریت ارسال سفارش #{selectedOrder?.customerOrderId}</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProcessOrder)} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    type="button"
                    variant={form.watch("action") === "assign" ? "default" : "outline"}
                    onClick={() => form.setValue("action", "assign")}
                    className="h-16"
                  >
                    <Package className="w-5 h-5 mr-2" />
                    تخصیص پیک
                  </Button>
                  
                  <Button
                    type="button"
                    variant={form.watch("action") === "dispatch" ? "default" : "outline"}
                    onClick={() => form.setValue("action", "dispatch")}
                    className="h-16"
                  >
                    <Truck className="w-5 h-5 mr-2" />
                    ارسال کالا
                  </Button>
                  
                  <Button
                    type="button"
                    variant={form.watch("action") === "deliver" ? "default" : "outline"}
                    onClick={() => form.setValue("action", "deliver")}
                    className="h-16"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    تحویل نهایی
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trackingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>کد رهگیری</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="کد رهگیری مرسوله" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estimatedDeliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاریخ تحویل (تخمینی)</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryPersonName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام پیک</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="نام و نام خانوادگی پیک" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="deliveryPersonPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تلفن پیک</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="شماره تلفن پیک" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>یادداشت</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="توضیحات ارسال، نحوه تحویل، شرایط خاص و غیره..."
                          rows={3}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    انصراف
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={processOrderMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {processOrderMutation.isPending ? "در حال پردازش..." : 
                     form.watch("action") === "assign" ? "تخصیص پیک" :
                     form.watch("action") === "dispatch" ? "ارسال کالا" : "تایید تحویل"}
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
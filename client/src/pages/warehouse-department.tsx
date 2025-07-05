import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Package, CheckCircle, XCircle, Clock, Truck, Box, LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface OrderManagement {
  id: number;
  customerOrderId: number;
  currentStatus: string;
  deliveryCode: string | null;
  
  // Financial (completed)
  financialReviewerId: number | null;
  financialReviewedAt: string | null;
  financialNotes: string | null;
  
  // Warehouse
  warehouseAssigneeId: number | null;
  warehouseProcessedAt: string | null;
  warehouseNotes: string | null;
  
  createdAt: string;
  updatedAt: string;
  
  // Customer info
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
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

interface WarehouseUser {
  id: number;
  username: string;
  email: string;
  department: string;
}

export default function WarehouseDepartment() {
  const [selectedOrder, setSelectedOrder] = useState<OrderManagement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [user, setUser] = useState<WarehouseUser | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      notes: "",
      action: "approve" as "approve" | "reject"
    }
  });

  // Check authentication and user department
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/warehouse/auth/me');
        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.user.department === 'warehouse') {
            setUser(userData.user);
          } else {
            setLocation('/warehouse/login');
          }
        } else {
          setLocation('/warehouse/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setLocation('/warehouse/login');
      }
    };

    checkAuth();
  }, [setLocation]);

  // Fetch warehouse pending orders - only financially approved orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/warehouse/orders"],
    enabled: !!user,
    refetchInterval: 300000, // Auto-refresh every 5 minutes
  });

  // Process order mutation
  const processOrderMutation = useMutation({
    mutationFn: async (data: { orderId: number; action: "approve" | "reject"; notes: string }) => {
      return apiRequest(`/api/warehouse/orders/${data.orderId}/process`, {
        method: 'POST',
        body: JSON.stringify({
          action: data.action,
          notes: data.notes,
          assigneeId: user?.id
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/orders"] });
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

  const handleProcessOrder = (values: { notes: string; action: "approve" | "reject" }) => {
    if (!selectedOrder) return;
    
    processOrderMutation.mutate({
      orderId: selectedOrder.id,
      action: values.action,
      notes: values.notes
    });
  };

  const logout = async () => {
    try {
      await fetch('/api/warehouse/logout', { method: 'POST' });
      setLocation('/warehouse/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
              <Package className="w-8 h-8 text-blue-600" />
              بخش انبار
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              آماده‌سازی و تایید سفارشات برای ارسال
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">سفارشات در انتظار</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">آماده شده امروز</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">رد شده امروز</CardTitle>
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
              <Box className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">هیچ سفارشی در انتظار نیست</h3>
              <p className="text-gray-500">تمام سفارشات تایید شده مالی پردازش شده‌اند</p>
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
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          تایید مالی شده
                        </Badge>
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          در انتظار آماده‌سازی
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">اطلاعات مشتری</h4>
                          <p className="text-sm text-gray-600">
                            {order.customer?.firstName} {order.customer?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{order.customer?.phone}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">اطلاعات سفارش</h4>
                          <p className="text-sm text-gray-600">
                            مبلغ کل: {order.order?.totalAmount?.toLocaleString()} تومان
                          </p>
                          <p className="text-sm text-gray-600">
                            تاریخ تایید مالی: {order.financialReviewedAt ? new Date(order.financialReviewedAt).toLocaleDateString('fa-IR') : '-'}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">کالاهای سفارش</h4>
                          <div className="space-y-1">
                            {order.order?.orderItems?.slice(0, 2).map((item, index) => (
                              <p key={index} className="text-sm text-gray-600">
                                {item.productName} × {item.quantity}
                              </p>
                            ))}
                            {order.order?.orderItems && order.order.orderItems.length > 2 && (
                              <p className="text-sm text-gray-500">
                                و {order.order.orderItems.length - 2} کالای دیگر...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {order.financialNotes && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <h5 className="text-sm font-medium text-green-800 mb-1">یادداشت بخش مالی:</h5>
                          <p className="text-sm text-green-700">{order.financialNotes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => {
                          setSelectedOrder(order);
                          setDialogOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        آماده‌سازی
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>آماده‌سازی سفارش #{selectedOrder?.customerOrderId}</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProcessOrder)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={form.watch("action") === "approve" ? "default" : "outline"}
                    onClick={() => form.setValue("action", "approve")}
                    className="h-16"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    کالاها آماده شد
                  </Button>
                  
                  <Button
                    type="button"
                    variant={form.watch("action") === "reject" ? "destructive" : "outline"}
                    onClick={() => form.setValue("action", "reject")}
                    className="h-16"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    عدم موجودی
                  </Button>
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>یادداشت (اختیاری)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="توضیحات آماده‌سازی، کالاهای موجود/ناموجود، تاریخ تکمیل و غیره..."
                          rows={4}
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
                    className={form.watch("action") === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                  >
                    {processOrderMutation.isPending ? "در حال پردازش..." : 
                     form.watch("action") === "approve" ? "تایید آماده‌سازی" : "گزارش عدم موجودی"}
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
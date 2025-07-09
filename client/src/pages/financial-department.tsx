import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Eye, CheckCircle, XCircle, Clock, DollarSign, FileText, LogOut, User, ZoomIn, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import GlobalRefreshControl from "@/components/GlobalRefreshControl";

interface OrderManagement {
  id: number;
  customerOrderId: number;
  currentStatus: string;
  deliveryCode: string | null;
  
  // Order Details
  totalAmount: number | string | null;
  currency: string | null;
  
  // Financial
  financialReviewerId: number | null;
  financialReviewedAt: string | null;
  financialNotes: string | null;
  paymentReceiptUrl: string | null;
  
  createdAt: string;
  updatedAt: string;
  
  // Customer info
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  
  // Receipt info
  receipt?: {
    url: string;
    fileName?: string;
    mimeType?: string;
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

interface FinancialUser {
  id: number;
  username: string;
  email: string;
  department: string;
}

export default function FinancialDepartment() {
  const [selectedOrder, setSelectedOrder] = useState<OrderManagement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [user, setUser] = useState<FinancialUser | null>(null);
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
        const response = await fetch('/api/financial/auth/me');
        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.user.department === 'financial') {
            setUser(userData.user);
          } else {
            setLocation('/financial/login');
          }
        } else {
          setLocation('/financial/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setLocation('/financial/login');
      }
    };

    checkAuth();
  }, [setLocation]);

  // Fetch financial pending orders - only orders needing financial review
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ["/api/financial/orders"],
    enabled: !!user,
    refetchInterval: 300000, // Auto-refresh every 5 minutes
  });

  const orders = ordersData?.orders || [];

  // Process order mutation
  const processOrderMutation = useMutation({
    mutationFn: async (data: { orderId: number; action: "approve" | "reject"; notes: string }) => {
      return apiRequest(`/api/financial/orders/${data.orderId}/process`, {
        method: 'POST',
        body: JSON.stringify({
          action: data.action,
          notes: data.notes,
          reviewerId: user?.id
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/orders"] });
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
      await fetch('/api/financial/logout', { method: 'POST' });
      setLocation('/financial/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Function to open image modal
  const openImageModal = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageModalOpen(true);
  };

  // Function to determine if URL is an image
  const isImageUrl = (url: string, mimeType?: string) => {
    if (mimeType) {
      return mimeType.startsWith('image/');
    }
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
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
              <DollarSign className="w-8 h-8 text-green-600" />
              بخش مالی
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              بررسی و تایید پرداخت‌های مشتریان
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
              <CardTitle className="text-sm font-medium">تایید شده امروز</CardTitle>
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

        {/* Refresh Control */}
        <div className="mb-6">
          <GlobalRefreshControl 
            pageName="financial"
            onRefresh={() => refetch()}
            isLoading={isLoading}
          />
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="text-center py-8">در حال بارگذاری...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">هیچ سفارشی در انتظار نیست</h3>
              <p className="text-gray-500">تمام سفارشات مالی پردازش شده‌اند</p>
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
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          در انتظار بررسی مالی
                        </Badge>
                        {order.paymentReceiptUrl && (
                          <Badge variant="default" className="bg-blue-100 text-blue-800">
                            <FileText className="w-3 h-3 mr-1" />
                            رسید موجود
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">اطلاعات مشتری</h4>
                          <p className="text-sm text-gray-600 font-medium">
                            {order.customer?.firstName && order.customer?.lastName 
                              ? `${order.customer.firstName} ${order.customer.lastName}`
                              : 'نام مشتری ناشناس'
                            }
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.customer?.email || 'ایمیل ثبت نشده'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.customer?.phone || 'شماره تلفن ثبت نشده'}
                          </p>
                          
                          {/* Receipt Thumbnail */}
                          {(order.receipt?.url || order.paymentReceiptUrl) && (
                            <div className="mt-3">
                              <h5 className="text-xs font-medium text-gray-700 mb-2">فیش پرداخت:</h5>
                              {isImageUrl(order.receipt?.url || order.paymentReceiptUrl!, order.receipt?.mimeType) ? (
                                <div 
                                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
                                  onClick={() => openImageModal(order.receipt?.url || order.paymentReceiptUrl!)}
                                >
                                  <img 
                                    src={order.receipt?.url || order.paymentReceiptUrl!}
                                    alt="فیش پرداخت"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                                    <ZoomIn className="w-4 h-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className="w-20 h-20 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-400 bg-gray-50"
                                  onClick={() => window.open(order.receipt?.url || order.paymentReceiptUrl!, '_blank')}
                                >
                                  <FileText className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">اطلاعات سفارش</h4>
                          {/* مبلغ سفارش */}
                          {order.totalAmount && (
                            <p className="text-sm text-gray-600 font-bold">
                              مبلغ کل: {typeof order.totalAmount === 'number' 
                                ? order.totalAmount.toLocaleString('fa-IR')
                                : order.totalAmount
                              } {order.currency || 'IQD'}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            تاریخ ثبت: {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                          </p>
                          {order.paymentReceiptUrl && (
                            <p className="text-sm text-green-600 font-medium">
                              ✓ فیش پرداخت آپلود شده
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => {
                          setSelectedOrder(order);
                          setDialogOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        بررسی
                      </Button>
                      
                      {order.paymentReceiptUrl && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(order.paymentReceiptUrl!, '_blank')}
                          className="border-green-300 text-green-600 hover:bg-green-50"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          مشاهده رسید
                        </Button>
                      )}
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
              <DialogTitle>بررسی سفارش #{selectedOrder?.customerOrderId}</DialogTitle>
            </DialogHeader>
            
            {/* Order Summary */}
            {selectedOrder && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">مشتری:</span>
                    <span className="font-medium ml-2">
                      {selectedOrder.customer?.firstName && selectedOrder.customer?.lastName 
                        ? `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}`
                        : 'نام مشتری ناشناس'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">تلفن:</span>
                    <span className="font-medium ml-2">
                      {selectedOrder.customer?.phone || 'شماره تلفن ثبت نشده'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">تاریخ ثبت:</span>
                    <span className="font-medium ml-2">
                      {new Date(selectedOrder.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  {selectedOrder.totalAmount && (
                    <div>
                      <span className="text-gray-600">مبلغ سفارش:</span>
                      <span className="font-bold text-blue-600 ml-2">
                        {typeof selectedOrder.totalAmount === 'number' 
                          ? selectedOrder.totalAmount.toLocaleString('fa-IR')
                          : selectedOrder.totalAmount
                        } {selectedOrder.currency || 'IQD'}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">فیش پرداخت:</span>
                    {(selectedOrder.receipt?.url || selectedOrder.paymentReceiptUrl) ? (
                      <div className="flex items-center gap-3 mt-2">
                        {/* Receipt Thumbnail in Modal */}
                        {isImageUrl(selectedOrder.receipt?.url || selectedOrder.paymentReceiptUrl!, selectedOrder.receipt?.mimeType) ? (
                          <div 
                            className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
                            onClick={() => openImageModal(selectedOrder.receipt?.url || selectedOrder.paymentReceiptUrl!)}
                          >
                            <img 
                              src={selectedOrder.receipt?.url || selectedOrder.paymentReceiptUrl!}
                              alt="فیش پرداخت"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-3 h-3 text-white opacity-0 hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="w-16 h-16 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-400 bg-gray-50"
                            onClick={() => window.open(selectedOrder.receipt?.url || selectedOrder.paymentReceiptUrl!, '_blank')}
                          >
                            <FileText className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => window.open(selectedOrder.receipt?.url || selectedOrder.paymentReceiptUrl!, '_blank')}
                          className="text-green-600 hover:text-green-700 p-0 h-auto font-medium"
                        >
                          مشاهده فیش ارسالی
                        </Button>
                      </div>
                    ) : (
                      <span className="text-red-600 ml-2">فیش ارسال نشده</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
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
                    تایید پرداخت
                  </Button>
                  
                  <Button
                    type="button"
                    variant={form.watch("action") === "reject" ? "destructive" : "outline"}
                    onClick={() => form.setValue("action", "reject")}
                    className="h-16"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    رد پرداخت
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
                          placeholder="دلیل تایید یا رد پرداخت را بنویسید..."
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
                     form.watch("action") === "approve" ? "تایید نهایی" : "رد نهایی"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Image Modal for Receipt Viewing */}
        <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle className="flex items-center justify-between">
                <span>مشاهده فیش پرداخت</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageModalOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              {selectedImageUrl && (
                <img
                  src={selectedImageUrl}
                  alt="فیش پرداخت"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Eye, 
  Edit, 
  Truck,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Percent,
  Calculator,
  TrendingDown,
  RefreshCw,
  BarChart3,
  CreditCard,
  FileText,
  User,
  Phone,
  Mail,
  Receipt,
  Building,
  Clock,
  AlertCircle,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ShopProduct, Customer, Order } from "@shared/shop-schema";
import SalesReport from "@/pages/sales-report";
import InvoiceManagement from "@/pages/admin/invoice-management";
import ShopInvoiceManagement from "@/components/ShopInvoiceManagement";
import PaymentMethodBadge from "@/components/PaymentMethodBadge";
import BulkPurchaseProductCard from "@/components/BulkPurchaseProductCard";

export default function ShopAdmin() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [proformaDeadlineDays, setProformaDeadlineDays] = useState("3");
  const [reminderDays, setReminderDays] = useState("1");
  const [reminderHour, setReminderHour] = useState("10");
  const [smsTemplateId, setSmsTemplateId] = useState("");
  const [emailTemplateId, setEmailTemplateId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Fetch email templates for reminder configuration
  const { data: emailTemplatesResponse } = useQuery({
    queryKey: ['/api/shop/email-templates'],
    enabled: isAuthenticated
  });

  // Fetch SMS templates for reminder configuration
  const { data: smsTemplatesResponse } = useQuery({
    queryKey: ['/api/shop/sms-templates'],
    enabled: isAuthenticated
  });

  // Extract templates from response data
  const emailTemplates = emailTemplatesResponse?.data || [];
  const smsTemplates = smsTemplatesResponse?.data || [];

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Fetch shop statistics
  const { data: stats = {} } = useQuery({
    queryKey: ["/api/shop/statistics"],
    enabled: isAuthenticated,
  });

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/shop/orders"],
    enabled: isAuthenticated,
  });

  // Fetch products for inventory management
  const { data: products = [] } = useQuery<ShopProduct[]>({
    queryKey: ["/api/shop/products"],
    enabled: isAuthenticated,
  });

  // Fetch proforma reminders
  const { data: reminderSchedules } = useQuery({
    queryKey: ["/api/shop/proforma-reminders"],
    enabled: isAuthenticated,
  });

  // Fetch discount settings
  const { data: discountsResponse = {} } = useQuery({
    queryKey: ["/api/shop/discounts"],
    enabled: isAuthenticated,
  });

  const discounts = discountsResponse?.data || [];

  // Fetch accounting stats
  const { data: accountingStats = {} } = useQuery({
    queryKey: ["/api/shop/accounting-stats"],
    enabled: isAuthenticated,
  });

  // Fetch returns
  const { data: returns = [], isLoading: returnsLoading } = useQuery({
    queryKey: ["/api/shop/returns"],
    enabled: isAuthenticated,
  });

  // Fetch return statistics
  const { data: returnStats = {} } = useQuery({
    queryKey: ["/api/shop/returns/stats"],
    enabled: isAuthenticated,
  });

  // Fetch financial transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/shop/financial-transactions"],
    enabled: isAuthenticated,
  });

  // Fetch shop settings for proforma deadline - properly type the response
  const { data: shopSettingsResponse, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/shop/settings'],
    enabled: isAuthenticated,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache for debugging  
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Extract the actual settings data from the response
  const shopSettings = shopSettingsResponse?.data || [];

  // Load existing proforma deadline settings
  useEffect(() => {
    console.log('📄 [PROFORMA DEADLINE] Raw response:', shopSettingsResponse);
    console.log('📄 [PROFORMA DEADLINE] Parsed settings:', shopSettings);
    if (Array.isArray(shopSettings) && shopSettings.length > 0) {
      const proformaDeadline = shopSettings.find((s: any) => s.setting_key === 'proforma_deadline_days');
      console.log('📄 [PROFORMA DEADLINE] Found setting:', proformaDeadline);
      if (proformaDeadline) {
        console.log('📄 [PROFORMA DEADLINE] Setting state to:', proformaDeadline.setting_value);
        setProformaDeadlineDays(proformaDeadline.setting_value);
      }
    }
  }, [shopSettingsResponse, shopSettings]);

  // Save proforma deadline mutation
  const saveProformaDeadlineMutation = useMutation({
    mutationFn: async (days: string) => {
      console.log('💾 [PROFORMA DEADLINE] Saving days:', days);
      const settings = [{
        setting_key: 'proforma_deadline_days',
        setting_value: days,
        setting_type: 'number',
        display_name: 'Purchase Proforma Deadline (Days)',
        description: 'Number of days for proforma payment deadline',
        category: 'payment',
        is_public: true,
        validation_rule: 'min:1,max:30',
        default_value: '3'
      }];
      console.log('💾 [PROFORMA DEADLINE] Settings to save:', settings);
      const result = await apiRequest('/api/shop/settings', { method: 'POST', body: { settings } });
      console.log('💾 [PROFORMA DEADLINE] Save result:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success", 
        description: "Proforma deadline updated successfully",
      });
      // Force refresh the settings data
      queryClient.invalidateQueries({ queryKey: ['/api/shop/settings'] });
      queryClient.refetchQueries({ queryKey: ['/api/shop/settings'] });
      // Also invalidate related queries that might use this setting
      queryClient.invalidateQueries({ queryKey: ['/api/public/payment-methods'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update proforma deadline",
        variant: "destructive",
      });
    },
  });

  // Add reminder mutation
  const addReminderMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/shop/proforma-reminders`, {
        method: "POST",
        body: {
          reminderHour: parseInt(reminderHour),
          daysBefore: parseInt(reminderDays),
          messageTemplate: `یادآوری: مهلت پرداخت حواله شما ${reminderDays === "0" ? "امروز" : `${reminderDays} روز دیگر`} به پایان می‌رسد.`,
          messageSubject: `یادآوری پرداخت حواله - ${reminderDays === "0" ? "روز پایان مهلت" : `${reminderDays} روز مانده`}`,
          notificationMethod: "email",
          isActive: true,
          priority: parseInt(reminderDays) + 1,
          smsTemplateId: smsTemplateId || null,
          emailTemplateId: emailTemplateId || null
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/proforma-reminders"] });
      setReminderDays("1");
      setReminderHour("10");
      setSmsTemplateId("");
      setEmailTemplateId("");
      toast({
        title: "موفق",
        description: "یادآوری جدید با موفقیت اضافه شد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در اضافه کردن یادآوری",
        variant: "destructive",
      });
    },
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/shop/proforma-reminders/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/proforma-reminders"] });
      toast({
        title: "موفق",
        description: "یادآوری با موفقیت حذف شد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا", 
        description: error.message || "خطا در حذف یادآوری",
        variant: "destructive",
      });
    },
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: number; updates: any }) => {
      return apiRequest(`/api/shop/orders/${orderId}`, { method: "PATCH", body: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/statistics"] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    },
  });

  // Update discount mutation
  const updateDiscountMutation = useMutation({
    mutationFn: async ({ discountId, updates }: { discountId: number; updates: any }) => {
      return apiRequest(`/api/shop/discounts/${discountId}`, { method: "PATCH", body: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/discounts"] });
      toast({
        title: "Discount Updated",
        description: "Discount has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update discount.",
        variant: "destructive",
      });
    },
  });

  // Delete discount mutation
  const deleteDiscountMutation = useMutation({
    mutationFn: async (discountId: number) => {
      return apiRequest(`/api/shop/discounts/${discountId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/discounts"] });
      toast({
        title: "موفقیت",
        description: "تخفیف با موفقیت حذف شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در حذف تخفیف",
        variant: "destructive",
      });
    },
  });

  // Returns handlers
  const handleDeleteReturn = async (returnId: number) => {
    try {
      await apiRequest("DELETE", `/api/shop/returns/${returnId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/shop/returns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/returns/stats"] });
      toast({
        title: "Success",
        description: "Return deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete return",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shop Administration</h1>
            <p className="text-gray-600">Manage your e-commerce operations</p>
          </div>
          <Button
            onClick={() => queryClient.invalidateQueries()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-green-600">{products.length}</p>
                </div>
                <Package className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">${accountingStats.totalRevenue || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="discounts">Discount Settings</TabsTrigger>
            <TabsTrigger value="bulk-purchases">Bulk Purchases</TabsTrigger>
            <TabsTrigger value="proforma-deadline">Purchase Proforma Deadline</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="invoices">Invoice Management</TabsTrigger>
            <TabsTrigger value="returns">Returned Items</TabsTrigger>
            <TabsTrigger value="reports">Sales Reports</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Order Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Orders filters and search */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Orders table with horizontal and vertical scroll */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full min-w-[1200px]">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Order Number
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                            Customer Name
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                            Mobile
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-52">
                            Email
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Total Amount
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Status
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Date
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.length > 0 ? orders.map((order: any) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm font-medium text-gray-900 w-32">
                              <div className="truncate">#{order.orderNumber || order.id}</div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 w-48">
                              <div className="truncate">
                                {order.customer ? 
                                  `${order.customer.firstName} ${order.customer.lastName}` : 
                                  order.customerName || 'نامشخص'
                                }
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 w-36">
                              <div className="truncate">
                                {order.customer?.phone || order.mobileNumber || 'نامشخص'}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 w-52">
                              <div className="truncate">
                                {order.customer?.email || order.email || 'نامشخص'}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 w-32">
                              <div className="truncate font-medium">
                                ${order.totalAmount || 0}
                              </div>
                            </td>
                            <td className="px-3 py-2 w-32">
                              <Badge variant={order.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                                {order.status === 'pending' ? 'در انتظار' :
                                 order.status === 'confirmed' ? 'تایید شده' :
                                 order.status === 'shipped' ? 'ارسال شده' :
                                 order.status === 'delivered' ? 'تحویل داده شده' :
                                 order.status === 'cancelled' ? 'لغو شده' :
                                 order.status}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 w-32">
                              <div className="truncate">
                                {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 w-24">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedOrder(order)}
                                className="flex items-center gap-1 text-xs px-2 py-1"
                              >
                                <Eye className="w-3 h-3" />
                                جزئیات
                              </Button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                              هیچ سفارشی یافت نشد
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Scroll indicator */}
                  <div className="bg-gray-100 px-4 py-1 text-xs text-gray-500 text-center border-t">
                    {orders.length > 15 && (
                      <span>Scroll to view all {orders.length} orders</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Inventory Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {products.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        <p className="text-sm text-gray-600">Price: ${product.unitPrice}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Stock: {product.stockQuantity}</p>
                        <Badge variant={product.stockQuantity > 10 ? 'default' : 'destructive'}>
                          {product.stockQuantity > 10 ? 'In Stock' : 'Low Stock'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discounts Tab */}
          <TabsContent value="discounts" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Discount Settings
                </CardTitle>
                <Button 
                  onClick={() => {
                    setEditingDiscount(null);
                    setIsDiscountDialogOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Discount
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {discounts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Percent className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No discounts created yet</p>
                      <p className="text-sm">Click "Create New Discount" to get started</p>
                    </div>
                  ) : (
                    discounts.map((discount: any) => (
                      <div key={discount.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{discount.name}</h3>
                          <p className="text-sm text-gray-600">{discount.description}</p>
                          <p className="text-sm text-green-600">{discount.discountPercentage}% off</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={discount.isActive ? 'default' : 'secondary'}>
                            {discount.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingDiscount(discount);
                              setIsDiscountDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('آیا از حذف این تخفیف اطمینان دارید؟')) {
                                deleteDiscountMutation.mutate(discount.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deleteDiscountMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Purchases Tab */}
          <TabsContent value="bulk-purchases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Bulk Purchase Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No products available</p>
                      <p className="text-sm">Add products to configure bulk purchases</p>
                    </div>
                  ) : (
                    products.map((product: any) => (
                      <BulkPurchaseProductCard 
                        key={product.id} 
                        product={product}
                        onUpdate={() => {
                          queryClient.invalidateQueries({ queryKey: ["/api/shop/products"] });
                          toast({
                            title: "Success",
                            description: "Bulk purchase settings updated successfully",
                          });
                        }}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchase Proforma Deadline Tab */}
          <TabsContent value="proforma-deadline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Purchase Proforma Deadline Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This setting applies to all products in the shop and displays in checkout and purchase cards.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proforma_deadline">Payment Deadline (Days)</Label>
                    <Input
                      id="proforma_deadline"
                      type="number"
                      min="1"
                      max="30"
                      value={proformaDeadlineDays}
                      onChange={(e) => setProformaDeadlineDays(e.target.value)}
                      placeholder="3"
                    />
                    <p className="text-sm text-muted-foreground">
                      Number of days for payment deadline (minimum 1 day, maximum 30 days)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Preview Message</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm">
                        Payment deadline: <strong>{proformaDeadlineDays} days</strong>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This message displays in purchase cards and checkout page
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={() => saveProformaDeadlineMutation.mutate(proformaDeadlineDays)}
                    disabled={saveProformaDeadlineMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {saveProformaDeadlineMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saveProformaDeadlineMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>

                <Separator className="my-6" />

                {/* Reminder Schedule Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    جدول زمانی یادآوری مشتریان
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4 space-x-reverse p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Label htmlFor="reminder-days">روز قبل از پایان مهلت:</Label>
                        <Input
                          id="reminder-days"
                          type="number"
                          min="0"
                          max="10"
                          value={reminderDays}
                          onChange={(e) => setReminderDays(e.target.value)}
                          className="w-16"
                        />
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Label htmlFor="reminder-hour">ساعت ارسال:</Label>
                        <Input
                          id="reminder-hour"
                          type="number"
                          min="0"
                          max="23"
                          value={reminderHour}
                          onChange={(e) => setReminderHour(e.target.value)}
                          className="w-16"
                        />
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Label htmlFor="sms-template">قالب پیامک:</Label>
                        <Select value={smsTemplateId} onValueChange={setSmsTemplateId}>
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="انتخاب قالب پیامک" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(smsTemplates) && smsTemplates.map((template: any) => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.templateNumber} - {template.templateName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Label htmlFor="email-template">قالب ایمیل:</Label>
                        <Select value={emailTemplateId} onValueChange={setEmailTemplateId}>
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="انتخاب قالب ایمیل" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(emailTemplates) && emailTemplates.map((template: any) => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.name} ({template.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => addReminderMutation.mutate()}
                        disabled={addReminderMutation.isPending}
                      >
                        {addReminderMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        افزودن
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {reminderSchedules?.data?.map((schedule: any) => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-4 space-x-reverse">
                            <Badge variant="outline" className="bg-blue-100">
                              {schedule.days_before === 0 ? 'روز پایان مهلت' : `${schedule.days_before} روز قبل`}
                            </Badge>
                            <span className="text-sm">ساعت {schedule.reminder_hour}:00</span>
                            <span className="text-sm text-gray-600">{schedule.message_subject}</span>
                            {(schedule.sms_template_id || schedule.email_template_id) && (
                              <div className="flex items-center space-x-1 space-x-reverse text-xs text-blue-600">
                                {schedule.sms_template_id && (
                                  <span className="bg-blue-100 px-2 py-1 rounded">پیامک: {schedule.sms_template_id}</span>
                                )}
                                {schedule.email_template_id && (
                                  <span className="bg-green-100 px-2 py-1 rounded">ایمیل: {schedule.email_template_id}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => deleteReminderMutation.mutate(schedule.id)}
                            disabled={deleteReminderMutation.isPending}
                          >
                            {deleteReminderMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      ))}
                      
                      {(!reminderSchedules?.data || reminderSchedules.data.length === 0) && (
                        <div className="text-center py-4 text-gray-500">
                          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">هیچ یادآوری تنظیم نشده است</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    یادآوری‌ها بر اساس ساعت محلی ارسال می‌شوند. مشتریان از طریق ایمیل و پیامک اطلاع‌رسانی خواهند شد.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Inventory Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {products.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        <p className="text-sm text-gray-600">Price: ${product.unitPrice}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Stock: {product.stockQuantity}</p>
                        <Badge variant={product.stockQuantity > 10 ? 'default' : 'destructive'}>
                          {product.stockQuantity > 10 ? 'In Stock' : 'Low Stock'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice Management Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <ShopInvoiceManagement />
          </TabsContent>

          {/* Returns Tab */}
          <TabsContent value="returns" className="space-y-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Returned Items Management</h3>
                <Button onClick={() => setShowReturnForm(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add New Return
                </Button>
              </div>

              {/* Return Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-center">Total Returns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-center text-blue-600">
                      {returnStats?.totalReturns || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-center">Total Return Amount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-center text-red-600">
                      ${returnStats?.totalReturnAmount || '0'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-center">Pending Returns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-center text-orange-600">
                      {returnStats?.pendingReturns || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-center">Approved Returns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-center text-green-600">
                      {returnStats?.approvedReturns || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Returns Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Returns List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Product Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Customer Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Phone
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Return Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {returns && returns.length > 0 ? returns.map((returnItem: any) => (
                          <tr key={returnItem.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              {returnItem.productName}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {returnItem.returnQuantity}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {returnItem.customerName}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {returnItem.customerPhone}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {new Date(returnItem.returnDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              ${returnItem.totalReturnAmount}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <Badge variant={
                                returnItem.refundStatus === 'approved' ? 'default' :
                                returnItem.refundStatus === 'pending' ? 'secondary' :
                                returnItem.refundStatus === 'rejected' ? 'destructive' : 'secondary'
                              }>
                                {returnItem.refundStatus === 'pending' ? 'Pending' :
                                 returnItem.refundStatus === 'approved' ? 'Approved' :
                                 returnItem.refundStatus === 'rejected' ? 'Rejected' :
                                 returnItem.refundStatus === 'refunded' ? 'Refunded' :
                                 returnItem.refundStatus}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedReturn(returnItem);
                                    setShowReturnDialog(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteReturn(returnItem.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                              No returns found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sales Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <SalesReport />
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-right">
                جزئیات سفارش #{selectedOrder.orderNumber || selectedOrder.id}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6" dir="rtl">
              {/* Customer Information */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  اطلاعات مشتری
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">نام مشتری</p>
                    <p className="font-medium">
                      {selectedOrder.customer ? 
                        `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}` : 
                        selectedOrder.customerName || 'نامشخص'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">شماره موبایل</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {selectedOrder.customer?.phone || selectedOrder.mobileNumber || 'نامشخص'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ایمیل</p>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedOrder.customer?.email || selectedOrder.email || 'نامشخص'}
                    </p>
                  </div>
                  {selectedOrder.customer?.company && (
                    <div>
                      <p className="text-sm text-gray-600">شرکت</p>
                      <p className="font-medium flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {selectedOrder.customer.company}
                      </p>
                    </div>
                  )}
                  {selectedOrder.customer?.city && (
                    <div>
                      <p className="text-sm text-gray-600">شهر</p>
                      <p className="font-medium">{selectedOrder.customer.city}</p>
                    </div>
                  )}
                  {selectedOrder.customer?.address && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">آدرس</p>
                      <p className="font-medium">{selectedOrder.customer.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  خلاصه سفارش
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">شماره سفارش</p>
                    <p className="font-medium">#{selectedOrder.orderNumber || selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">تاریخ سفارش</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedOrder.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">وضعیت سفارش</p>
                    <Badge className="mt-1" variant={selectedOrder.status === 'confirmed' ? 'default' : 'secondary'}>
                      {selectedOrder.status === 'pending' ? 'در انتظار' :
                       selectedOrder.status === 'confirmed' ? 'تایید شده' :
                       selectedOrder.status === 'shipped' ? 'ارسال شده' :
                       selectedOrder.status === 'delivered' ? 'تحویل داده شده' :
                       selectedOrder.status === 'cancelled' ? 'لغو شده' :
                       selectedOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">مبلغ کل</p>
                    <p className="font-bold text-lg text-green-600">${selectedOrder.totalAmount}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  اقلام سفارش ({selectedOrder.items?.length || 0} قلم)
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.productName || item.name || 'نام محصول'}</p>
                          <p className="text-sm text-gray-600">کد محصول: {item.productSku || item.sku || 'نامشخص'}</p>
                          <p className="text-sm text-blue-600">قیمت واحد: ${item.price || item.unitPrice || 0}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">تعداد: {item.quantity || 1}</p>
                          <p className="text-lg font-bold text-green-600">
                            ${((item.price || item.unitPrice || 0) * (item.quantity || 1)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>هیچ قلمی برای این سفارش یافت نشد</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div className="border rounded-lg p-4 bg-purple-50">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  اطلاعات پرداخت
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">روش پرداخت</p>
                    <PaymentMethodBadge paymentMethod={selectedOrder.paymentMethod} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">وضعیت پرداخت</p>
                    <Badge variant={selectedOrder.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                      {selectedOrder.paymentStatus === 'paid' ? 'پرداخت شده' :
                       selectedOrder.paymentStatus === 'pending' ? 'در انتظار پرداخت' :
                       selectedOrder.paymentStatus === 'failed' ? 'ناموفق' :
                       selectedOrder.paymentStatus || 'نامشخص'}
                    </Badge>
                  </div>
                  
                  {/* Payment Source Details */}
                  {(selectedOrder.walletAmountUsed > 0 || selectedOrder.paymentMethod === 'wallet_partial' || selectedOrder.paymentMethod === 'wallet_full') && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-2">جزئیات منابع تامین وجه</p>
                      <div className="space-y-2">
                        {selectedOrder.walletAmountUsed > 0 && (
                          <div className="flex justify-between items-center p-2 bg-green-100 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-green-800">کیف پول</span>
                            </div>
                            <span className="font-bold text-green-700">
                              ${parseFloat(selectedOrder.walletAmountUsed || 0).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {selectedOrder.paymentMethod === 'wallet_partial' && selectedOrder.walletAmountUsed === 0 && (
                          <div className="flex justify-between items-center p-2 bg-orange-100 rounded-lg border border-orange-200">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                              <span className="text-sm font-medium text-orange-800">کیف پول (سفارش ناقص)</span>
                            </div>
                            <span className="font-bold text-orange-700">
                              پرداخت ناتمام - کیف پول کسر نشده
                            </span>
                          </div>
                        )}
                        {selectedOrder.paymentMethod === 'wallet_partial' && selectedOrder.walletAmountUsed > 0 && (
                          <div className="flex justify-between items-center p-2 bg-blue-100 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-medium text-blue-800">درگاه بانکی</span>
                            </div>
                            <span className="font-bold text-blue-700">
                              ${(parseFloat(selectedOrder.totalAmount || 0) - parseFloat(selectedOrder.walletAmountUsed || 0)).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {selectedOrder.paymentMethod === 'bank_transfer' && !selectedOrder.walletAmountUsed && (
                          <div className="flex justify-between items-center p-2 bg-purple-100 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                              <span className="text-sm font-medium text-purple-800">درگاه بانکی (کامل)</span>
                            </div>
                            <span className="font-bold text-purple-700">
                              ${parseFloat(selectedOrder.totalAmount || 0).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedOrder.discount && selectedOrder.discount > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">تخفیف</p>
                      <p className="font-medium text-orange-600">${selectedOrder.discount}</p>
                    </div>
                  )}
                  {selectedOrder.tax && selectedOrder.tax > 0 && (
                    <div>
                      <p className="text-sm text-gray-600">مالیات</p>
                      <p className="font-medium">${selectedOrder.tax}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Information */}
              {(selectedOrder.shippingAddress || selectedOrder.carrier) && (
                <div className="border rounded-lg p-4 bg-orange-50">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    اطلاعات ارسال
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedOrder.carrier && (
                      <div>
                        <p className="text-sm text-gray-600">شرکت حمل</p>
                        <p className="font-medium">{selectedOrder.carrier}</p>
                      </div>
                    )}
                    {selectedOrder.trackingNumber && (
                      <div>
                        <p className="text-sm text-gray-600">کد رهگیری</p>
                        <p className="font-medium">{selectedOrder.trackingNumber}</p>
                      </div>
                    )}
                    {selectedOrder.shippingAddress && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">آدرس ارسال</p>
                        <p className="font-medium">
                          {typeof selectedOrder.shippingAddress === 'object' 
                            ? `${selectedOrder.shippingAddress.address || ''} ${selectedOrder.shippingAddress.city || ''} ${selectedOrder.shippingAddress.postalCode || ''}`.trim()
                            : selectedOrder.shippingAddress}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Actions */}
              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                >
                  بستن
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    // Update order status functionality can be added here
                    console.log('Update order status for:', selectedOrder.id);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  ویرایش سفارش
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Return Form Dialog */}
      {showReturnForm && (
        <Dialog open={showReturnForm} onOpenChange={setShowReturnForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Return</DialogTitle>
            </DialogHeader>
            <ReturnForm onClose={() => setShowReturnForm(false)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Return Details Dialog */}
      {selectedReturn && (
        <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Return Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Product Name</label>
                <p className="text-sm bg-gray-50 p-2 rounded">{selectedReturn.productName}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Customer Name</label>
                <p className="text-sm bg-gray-50 p-2 rounded">{selectedReturn.customerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Return Quantity</label>
                <p className="text-sm bg-gray-50 p-2 rounded">{selectedReturn.returnQuantity}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Return Amount</label>
                <p className="text-sm bg-gray-50 p-2 rounded">${selectedReturn.totalReturnAmount}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Return Reason</label>
                <p className="text-sm bg-gray-50 p-2 rounded">{selectedReturn.returnReason}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Badge variant={
                  selectedReturn.refundStatus === 'approved' ? 'default' :
                  selectedReturn.refundStatus === 'pending' ? 'secondary' :
                  selectedReturn.refundStatus === 'rejected' ? 'destructive' : 'secondary'
                }>
                  {selectedReturn.refundStatus}
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Discount Creation/Edit Dialog */}
      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              {editingDiscount ? 'ویرایش تخفیف' : 'ایجاد تخفیف جدید'}
            </DialogTitle>
          </DialogHeader>
          <DiscountForm 
            discount={editingDiscount} 
            onClose={() => {
              setIsDiscountDialogOpen(false);
              setEditingDiscount(null);
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Discount Form Component
function DiscountForm({ discount, onClose }: { discount?: any; onClose: () => void }) {
  const [name, setName] = useState(discount?.name || '');
  const [description, setDescription] = useState(discount?.description || '');
  const [discountPercentage, setDiscountPercentage] = useState(discount?.discountPercentage || '');
  const [minOrderAmount, setMinOrderAmount] = useState(discount?.minOrderAmount || '');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(discount?.maxDiscountAmount || '');
  const [validFrom, setValidFrom] = useState(discount?.validFrom?.split('T')[0] || '');
  const [validTo, setValidTo] = useState(discount?.validTo?.split('T')[0] || '');
  const [isActive, setIsActive] = useState(discount?.isActive ?? true);
  const [usageLimit, setUsageLimit] = useState(discount?.usageLimit || '');
  const [applyToAllProducts, setApplyToAllProducts] = useState(discount?.applyToAllProducts ?? true);
  const [selectedProducts, setSelectedProducts] = useState<number[]>(discount?.applicableProducts || []);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products for selection
  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    enabled: !applyToAllProducts,
  });

  // Create/Update mutation
  const saveDiscountMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = discount ? `/api/shop/discounts/${discount.id}` : '/api/shop/discounts';
      const method = discount ? 'PATCH' : 'POST';
      return apiRequest(url, { method, body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/discounts'] });
      toast({ 
        title: "موفقیت", 
        description: discount ? "تخفیف با موفقیت بروزرسانی شد" : "تخفیف با موفقیت ایجاد شد" 
      });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا", 
        description: error?.message || "خطا در ذخیره تخفیف", 
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: name.trim(),
      description: description.trim(),
      discountPercentage: parseFloat(discountPercentage),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      validFrom: validFrom || null,
      validTo: validTo || null,
      isActive,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      applyToAllProducts,
      applicableProducts: applyToAllProducts ? [] : selectedProducts
    };

    if (!data.name || !data.discountPercentage) {
      toast({ 
        title: "خطا", 
        description: "نام و درصد تخفیف الزامی است", 
        variant: "destructive" 
      });
      return;
    }

    if (data.discountPercentage < 0 || data.discountPercentage > 100) {
      toast({ 
        title: "خطا", 
        description: "درصد تخفیف باید بین 0 و 100 باشد", 
        variant: "destructive" 
      });
      return;
    }

    saveDiscountMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">نام تخفیف *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="تخفیف ویژه"
          required
          className="text-right"
        />
      </div>
      
      <div>
        <Label htmlFor="description">توضیحات</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="توضیحات تخفیف..."
          className="text-right"
        />
      </div>
      
      <div>
        <Label htmlFor="discountPercentage">درصد تخفیف (%) *</Label>
        <Input
          id="discountPercentage"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={discountPercentage}
          onChange={(e) => setDiscountPercentage(e.target.value)}
          placeholder="10"
          required
          className="text-center"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minOrderAmount">حداقل مبلغ سفارش ($)</Label>
          <Input
            id="minOrderAmount"
            type="number"
            min="0"
            step="0.01"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            placeholder="100"
            className="text-center"
          />
        </div>
        
        <div>
          <Label htmlFor="maxDiscountAmount">حداکثر مبلغ تخفیف ($)</Label>
          <Input
            id="maxDiscountAmount"
            type="number"
            min="0"
            step="0.01"
            value={maxDiscountAmount}
            onChange={(e) => setMaxDiscountAmount(e.target.value)}
            placeholder="50"
            className="text-center"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="validFrom">تاریخ شروع (میلادی)</Label>
          <Input
            id="validFrom"
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className="text-left"
          />
        </div>
        
        <div>
          <Label htmlFor="validTo">تاریخ پایان (میلادی)</Label>
          <Input
            id="validTo"
            type="date"
            value={validTo}
            onChange={(e) => setValidTo(e.target.value)}
            className="text-left"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="usageLimit">محدودیت استفاده</Label>
        <Input
          id="usageLimit"
          type="number"
          min="1"
          value={usageLimit}
          onChange={(e) => setUsageLimit(e.target.value)}
          placeholder="100"
          className="text-center"
        />
      </div>
      
      {/* Product Selection */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="applyToAllProducts"
            checked={applyToAllProducts}
            onCheckedChange={(checked) => {
              setApplyToAllProducts(checked as boolean);
              if (checked) {
                setSelectedProducts([]);
              }
            }}
          />
          <Label htmlFor="applyToAllProducts">اعمال روی تمام محصولات</Label>
        </div>
        
        {!applyToAllProducts && (
          <div>
            <Label>انتخاب محصول مشخص:</Label>
            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
              {products.map((product: any) => (
                <div key={product.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`product-${product.id}`}
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProducts([...selectedProducts, product.id]);
                      } else {
                        setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                      }
                    }}
                  />
                  <Label htmlFor={`product-${product.id}`} className="flex-1 text-sm">
                    {product.name}
                  </Label>
                </div>
              ))}
            </div>
            {selectedProducts.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {selectedProducts.length} محصول انتخاب شده
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked as boolean)}
        />
        <Label htmlFor="isActive">فعال</Label>
      </div>
      
      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          انصراف
        </Button>
        <Button 
          type="submit" 
          disabled={saveDiscountMutation.isPending}
          className="flex-1"
        >
          {saveDiscountMutation.isPending 
            ? 'در حال ذخیره...' 
            : (discount ? 'بروزرسانی' : 'ایجاد')
          }
        </Button>
      </div>
    </form>
  );
}

// Return Form Component
function ReturnForm({ onClose }: { onClose: () => void }) {
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [productUnit, setProductUnit] = useState(""); // واحد اندازه‌گیری از کاردکس
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [returnQuantity, setReturnQuantity] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [totalReturnAmount, setTotalReturnAmount] = useState("");
  const [refundStatus, setRefundStatus] = useState("pending");
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [phoneSuggestions, setPhoneSuggestions] = useState<any[]>([]);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Add refs for timeout management
  const phoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const productTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch phone suggestions
  const fetchPhoneSuggestions = async (phone: string) => {
    if (!phone || phone.length < 3) {
      setPhoneSuggestions([]);
      setShowPhoneSuggestions(false);
      return;
    }
    
    try {
      console.log('Fetching phone suggestions for:', phone);
      const data = await apiRequest(`/api/crm/customers/search-phone/${encodeURIComponent(phone)}`, { method: 'GET' });
      
      console.log('Phone suggestions received:', data);
      
      if (data && data.success && data.customers) {
        setPhoneSuggestions(data.customers);
        setShowPhoneSuggestions(data.customers.length > 0);
      } else {
        setPhoneSuggestions([]);
        setShowPhoneSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching phone suggestions:', error);
      setPhoneSuggestions([]);
      setShowPhoneSuggestions(false);
    }
  };

  // Function to select customer from suggestions
  const selectCustomerFromSuggestion = (customer: any) => {
    setCustomerPhone(customer.phone);
    setCustomerName(customer.displayName);
    setCustomerEmail(customer.email || '');
    setShowPhoneSuggestions(false);
    
    toast({
      title: "مشتری انتخاب شد",
      description: `اطلاعات مشتری ${customer.displayName} بارگذاری شد`,
    });
  };

  // Handle phone number change with debouncing
  const handlePhoneChange = (phone: string) => {
    setCustomerPhone(phone);
    
    // Clear existing timeout
    if (phoneTimeoutRef.current) {
      clearTimeout(phoneTimeoutRef.current);
    }
    
    // Set new timeout for phone suggestions
    phoneTimeoutRef.current = setTimeout(() => {
      if (phone && phone.length >= 3) {
        fetchPhoneSuggestions(phone);
      } else {
        setPhoneSuggestions([]);
        setShowPhoneSuggestions(false);
      }
    }, 500); // 500ms delay
  };

  // Function to fetch product suggestions
  const fetchProductSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setProductSuggestions([]);
      setShowProductSuggestions(false);
      return;
    }

    try {
      console.log('Fetching product suggestions for:', query);
      const data = await apiRequest(`/api/shop/products`, { method: 'GET' });
      
      console.log('Products data received:', data?.length);
      
      if (Array.isArray(data)) {
        const filtered = data
          .filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase())
          )
          .map(product => ({
            id: product.id,
            name: product.name,
            displayText: `${product.name} (ID: ${product.id})`
          }))
          .slice(0, 5); // Show max 5 suggestions
        
        console.log('Filtered suggestions:', filtered);
        setProductSuggestions(filtered);
        setShowProductSuggestions(filtered.length > 0);
      }
    } catch (error) {
      console.error('Error fetching product suggestions:', error);
    }
  };

  // Handle product name change with debouncing
  const handleProductNameChange = (name: string) => {
    setProductName(name);
    setShowProductSuggestions(false);
    
    // Clear existing timeout
    if (productTimeoutRef.current) {
      clearTimeout(productTimeoutRef.current);
    }
    
    // Set new timeout
    productTimeoutRef.current = setTimeout(() => {
      if (name && name.length >= 3) {
        fetchProductSuggestions(name);
      }
    }, 300); // 300ms delay
  };

  // Handle product suggestion selection
  const selectProductFromSuggestion = async (product: any) => {
    setProductId(product.id.toString());
    setProductName(product.name);
    setShowProductSuggestions(false);
    
    // Fetch product unit from kardex
    try {
      const response = await apiRequest(`/api/products/kardex/${product.id}/unit`, { method: 'GET' });
      if (response.success && response.unit) {
        setProductUnit(response.unit);
        console.log(`✅ واحد محصول از کاردکس دریافت شد: ${response.unit}`);
      } else {
        setProductUnit(''); // Empty if no unit available
        console.log('❌ واحد محصول در کاردکس یافت نشد');
      }
    } catch (error) {
      console.error('Error fetching product unit:', error);
      setProductUnit(''); // Empty if error
    }
    
    toast({
      title: "محصول انتخاب شد",
      description: `محصول ${product.name} انتخاب شد`,
    });
  };

  const createReturnMutation = useMutation({
    mutationFn: async (returnData: any) => {
      const response = await apiRequest('/api/shop/returns', { method: 'POST', body: returnData });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "موفق",
        description: "برگشت محصول با موفقیت ثبت شد"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/returns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/returns/stats"] });
      
      // Clear all form fields
      setProductId('');
      setProductName('');
      setProductUnit('');
      setReturnQuantity('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setReturnReason('');
      setTotalReturnAmount('');
      setRefundStatus('pending');
      setShowReturnForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create return",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productName || !returnQuantity || !customerName || !customerPhone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createReturnMutation.mutate({
      productId: productId ? parseInt(productId) : 1, // Default to 1 if no ID provided
      productName,
      productSku: productId ? `SKU-${productId}` : 'SKU-DEFAULT', // Generate SKU
      returnQuantity: parseInt(returnQuantity),
      customerName,
      customerPhone,
      returnReason,
      unitPrice: 0, // Default unit price
      totalReturnAmount: parseFloat(totalReturnAmount) || 0,
      refundStatus,
      returnDate: new Date() // Keep as Date object for Drizzle
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="productId">Product ID (Optional)</Label>
          <Input
            id="productId"
            type="number"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="Enter product ID"
          />
        </div>
        
        <div className="relative">
          <Label htmlFor="productName">Product Name *</Label>
          <Input
            id="productName"
            value={productName}
            onChange={(e) => handleProductNameChange(e.target.value)}
            placeholder="Enter product name"
            required
          />
          
          {/* Product Suggestions Dropdown */}
          {showProductSuggestions && productSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1 max-h-60 overflow-y-auto">
              {productSuggestions.map((product, index) => (
                <button
                  key={product.id || index}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 text-sm"
                  onClick={() => selectProductFromSuggestion(product)}
                >
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-500">Product ID: {product.id}</div>
                </button>
              ))}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            حداقل 3 حرف از نام محصول را تایپ کنید تا لیست محصولات نمایش داده شود
          </p>
        </div>

        <div>
          <Label htmlFor="returnQuantity">Return Quantity * {productUnit && `(${productUnit})`}</Label>
          <div className="flex gap-2">
            <Input
              id="returnQuantity"
              type="number"
              value={returnQuantity}
              onChange={(e) => setReturnQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
              className="flex-1"
            />
            {productUnit && productUnit !== 'units' && (
              <div className="flex items-center px-3 py-2 bg-gray-100 rounded-md border text-sm text-gray-700 font-medium min-w-[60px] justify-center">
                {productUnit}
              </div>
            )}
          </div>
          {productId && (
            <p className="text-xs text-gray-500 mt-1">
              واحد اندازه‌گیری از کاردکس: {productUnit || 'نامشخص'}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="totalReturnAmount">Return Amount ($)</Label>
          <Input
            id="totalReturnAmount"
            type="number"
            step="0.01"
            value={totalReturnAmount}
            onChange={(e) => setTotalReturnAmount(e.target.value)}
            placeholder="Enter return amount"
          />
        </div>

        <div>
          <Label htmlFor="customerName">Customer Name *</Label>
          <Input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer name"
            required
          />
        </div>

        <div className="relative">
          <Label htmlFor="customerPhone">Customer Phone * {isLoadingCustomer && "(جستجو...)"}</Label>
          <Input
            id="customerPhone"
            value={customerPhone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="Enter phone number"
            required
          />
          
          {/* Phone suggestions dropdown */}
          {showPhoneSuggestions && phoneSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1 max-h-60 overflow-y-auto">
              {phoneSuggestions.map((customer, index) => (
                <button
                  key={customer.id || index}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 text-sm"
                  onClick={() => selectCustomerFromSuggestion(customer)}
                >
                  <div className="font-medium text-gray-900">{customer.displayText}</div>
                  <div className="text-xs text-gray-500">{customer.email}</div>
                </button>
              ))}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            حداقل 3 رقم از شماره تلفن را تایپ کنید تا لیست مشتریان نمایش داده شود
          </p>
        </div>

        <div>
          <Label htmlFor="customerEmail">Customer Email</Label>
          <Input
            id="customerEmail"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Enter email address"
          />
        </div>

        <div>
          <Label htmlFor="refundStatus">Refund Status</Label>
          <Select value={refundStatus} onValueChange={setRefundStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="returnReason">Return Reason</Label>
        <Input
          id="returnReason"
          value={returnReason}
          onChange={(e) => setReturnReason(e.target.value)}
          placeholder="Enter reason for return"
        />
      </div>

      <div className="flex gap-4 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createReturnMutation.isPending}>
          {createReturnMutation.isPending ? "Creating..." : "Create Return"}
        </Button>
      </div>
    </form>
  );
}
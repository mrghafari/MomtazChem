import { useState, useEffect } from "react";
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
  Clock
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ShopProduct, Customer, Order } from "@shared/shop-schema";
import SalesReport from "@/pages/sales-report";
import InvoiceManagement from "@/pages/admin/invoice-management";

export default function ShopAdmin() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="discounts">Discount Settings</TabsTrigger>
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Discount Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {discounts.map((discount: any) => (
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
                          onClick={() => setEditingDiscount(discount)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice Management Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <InvoiceManagement />
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
                    <p className="font-medium">
                      {selectedOrder.paymentMethod === 'bank_transfer' ? 'واریز بانکی' : 
                       selectedOrder.paymentMethod === 'cash_on_delivery' ? 'پرداخت در محل' :
                       selectedOrder.paymentMethod === 'company_credit' ? 'اعتبار شرکت' :
                       selectedOrder.paymentMethod === 'wallet' ? 'کیف پول' :
                       selectedOrder.paymentMethod || 'نامشخص'}
                    </p>
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
    </div>
  );
}

// Return Form Component
function ReturnForm({ onClose }: { onClose: () => void }) {
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [productSuggestions, setProductSuggestions] = useState<string[]>([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [returnQuantity, setReturnQuantity] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [totalReturnAmount, setTotalReturnAmount] = useState("");
  const [refundStatus, setRefundStatus] = useState("pending");
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Function to fetch customer by phone number
  const fetchCustomerByPhone = async (phone: string) => {
    if (!phone || phone.length < 3) return;
    
    setIsLoadingCustomer(true);
    try {
      const response = await apiRequest('GET', `/api/crm/customers/by-phone/${encodeURIComponent(phone)}`);
      const data = await response.json();
      
      if (data.success && data.customer) {
        const customer = data.customer;
        setCustomerName(`${customer.firstName || ''} ${customer.lastName || ''}`.trim());
        setCustomerEmail(customer.email || '');
        toast({
          title: "مشتری یافت شد",
          description: `اطلاعات مشتری ${customer.firstName} ${customer.lastName} بارگذاری شد`,
        });
      } else {
        // Clear fields if customer not found
        setCustomerName('');
        setCustomerEmail('');
        toast({
          title: "مشتری یافت نشد",
          description: "لطفاً اطلاعات مشتری را به صورت دستی وارد کنید",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast({
        title: "خطا در دریافت اطلاعات",
        description: "خطا در دریافت اطلاعات مشتری",
        variant: "destructive"
      });
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  // Handle phone number change with debouncing
  const handlePhoneChange = (phone: string) => {
    setCustomerPhone(phone);
    
    // Clear existing timeout
    const timeoutId = setTimeout(() => {
      if (phone && phone.length >= 3) {
        fetchCustomerByPhone(phone);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  };

  // Function to fetch product suggestions
  const fetchProductSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setProductSuggestions([]);
      setShowProductSuggestions(false);
      return;
    }

    try {
      const response = await apiRequest('GET', `/api/shop/products`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const filtered = data
          .filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase())
          )
          .map(product => product.name)
          .slice(0, 5); // Show max 5 suggestions
        
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
    const timeoutId = setTimeout(() => {
      if (name && name.length >= 3) {
        fetchProductSuggestions(name);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setProductName(suggestion);
    setShowProductSuggestions(false);
    setProductSuggestions([]);
  };

  const createReturnMutation = useMutation({
    mutationFn: async (returnData: any) => {
      const response = await apiRequest('POST', '/api/shop/returns', returnData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Return created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/returns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/returns/stats"] });
      onClose();
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
      productId: productId ? parseInt(productId) : null,
      productName,
      returnQuantity: parseInt(returnQuantity),
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      returnReason,
      totalReturnAmount: parseFloat(totalReturnAmount) || 0,
      refundStatus,
      returnDate: new Date().toISOString()
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
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {productSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            حداقل 3 حرف از نام محصول را تایپ کنید تا پیشنهادات نمایش داده شود
          </p>
        </div>

        <div>
          <Label htmlFor="returnQuantity">Return Quantity *</Label>
          <Input
            id="returnQuantity"
            type="number"
            value={returnQuantity}
            onChange={(e) => setReturnQuantity(e.target.value)}
            placeholder="Enter quantity"
            required
          />
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

        <div>
          <Label htmlFor="customerPhone">Customer Phone * {isLoadingCustomer && "(جستجو...)"}</Label>
          <Input
            id="customerPhone"
            value={customerPhone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="Enter phone number"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            اطلاعات مشتری پس از وارد کردن 3 رقم اول شماره تلفن به طور خودکار پر می‌شود
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
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
  CreditCard
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

// Discount Form Component
const DiscountForm = ({ discount, products, onSave, onCancel }: {
  discount?: any;
  products: ShopProduct[];
  onSave: (data: any) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: discount?.name || "",
    discountPercentage: discount?.discountPercentage || "",
    minQuantity: discount?.minQuantity || 1,
    description: discount?.description || "",
    isActive: discount?.isActive ?? true,
    applyToAllProducts: discount?.applyToAllProducts ?? true,
    applicableProducts: discount?.applicableProducts || [],
  });

  const handleProductSelection = (productId: number, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        applicableProducts: [...prev.applicableProducts, productId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        applicableProducts: prev.applicableProducts.filter((id: number) => id !== productId)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Discount Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Bulk Discount 10+"
            required
          />
        </div>
        <div>
          <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
          <Input
            id="discountPercentage"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.discountPercentage}
            onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minQuantity">Minimum Quantity</Label>
          <Input
            id="minQuantity"
            type="number"
            min="1"
            value={formData.minQuantity}
            onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: parseInt(e.target.value) }))}
            required
          />
        </div>
        <div className="flex items-center space-x-2 mt-6">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of this discount"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="applyToAllProducts"
            checked={formData.applyToAllProducts}
            onCheckedChange={(checked) => {
              setFormData(prev => ({ 
                ...prev, 
                applyToAllProducts: !!checked,
                applicableProducts: !!checked ? [] : prev.applicableProducts
              }));
            }}
          />
          <Label htmlFor="applyToAllProducts">Apply to all products</Label>
        </div>

        {!formData.applyToAllProducts && (
          <div>
            <Label>Select Products for Discount</Label>
            <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg p-4">
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={formData.applicableProducts.includes(product.id)}
                      onCheckedChange={(checked) => handleProductSelection(product.id, !!checked)}
                    />
                    <Label htmlFor={`product-${product.id}`} className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {product.sku} - ${product.price}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {formData.applicableProducts.length > 0 && (
              <div className="mt-2 text-sm text-blue-600">
                {formData.applicableProducts.length} product(s) selected
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {discount ? "Update Discount" : "Create Discount"}
        </Button>
      </div>
    </form>
  );
};

const ShopAdmin = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // All hooks must be called before any conditional returns
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
  const { data: discounts = [] } = useQuery({
    queryKey: ["/api/shop/discounts"],
    enabled: isAuthenticated,
  });

  // Fetch accounting statistics
  const { data: accountingStats = {} } = useQuery({
    queryKey: ["/api/shop/accounting-stats"],
    enabled: isAuthenticated,
  });

  // Fetch financial transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/shop/financial-transactions"],
    enabled: isAuthenticated,
  });

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Export sales report handler
  const handleExportSalesReport = async () => {
    try {
      const response = await fetch('/api/analytics/sales/export?format=csv', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate sales report');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Sales report exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export sales report",
        variant: "destructive",
      });
    }
  };

  // Generate monthly report handler
  const handleGenerateMonthlyReport = async () => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const response = await fetch(`/api/analytics/sales/export?format=json&month=${currentMonth}&year=${currentYear}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate monthly report');
      }

      const data = await response.json();
      
      // Create a formatted report
      const reportContent = `Monthly Sales Report - ${currentMonth}/${currentYear}
      
Total Orders: ${data.summary.totalOrders}
Total Revenue: $${data.summary.totalRevenue.toFixed(2)}
Report Date: ${data.summary.reportDate}

Detailed Sales Data:
${data.data.map((item: any) => 
  `${item.orderDate} - ${item.productName} (Qty: ${item.quantity}) - $${item.itemTotal.toFixed(2)}`
).join('\n')}`;

      // Download as text file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `monthly-report-${currentMonth}-${currentYear}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Monthly report generated successfully",
      });
    } catch (error) {
      console.error('Monthly report error:', error);
      toast({
        title: "Error",
        description: "Failed to generate monthly report",
        variant: "destructive",
      });
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: number; updates: any }) => {
      return apiRequest(`/api/shop/orders/${orderId}`, "PATCH", updates);
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
      return apiRequest(`/api/shop/discounts/${discountId}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/discounts"] });
      setIsDiscountDialogOpen(false);
      setEditingDiscount(null);
      toast({
        title: "Discount Updated",
        description: "Discount settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update discount settings.",
        variant: "destructive",
      });
    },
  });

  // Create discount mutation
  const createDiscountMutation = useMutation({
    mutationFn: async (discountData: any) => {
      return apiRequest("/api/shop/discounts", "POST", discountData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/discounts"] });
      setIsDiscountDialogOpen(false);
      setEditingDiscount(null);
      toast({
        title: "Discount Created",
        description: "New discount has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create discount.",
        variant: "destructive",
      });
    },
  });

  // Filter orders
  const filteredOrders = orders ? orders.filter(order => {
    const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
    const matchesSearch = searchTerm === "" || 
                         order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  }) : [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shop Management</h1>
            <p className="text-gray-600 mt-2">Manage orders, inventory, and discount settings</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats as any)?.totalOrders || 0}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${(stats as any)?.totalRevenue || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats as any)?.pendingOrders || 0}</p>
                </div>
                <Package className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Shipped Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats as any)?.shippedOrders || 0}</p>
                </div>
                <Truck className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">Orders Management</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
            <TabsTrigger value="discounts">Discount Settings</TabsTrigger>
            <TabsTrigger value="accounting">Accounting</TabsTrigger>
          </TabsList>

          {/* Orders Management */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Orders</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ordersLoading ? (
                    <div className="text-center py-8">Loading orders...</div>
                  ) : filteredOrders.length > 0 ? (
                    <div className="space-y-3">
                      {filteredOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">#{order.orderNumber}</h3>
                              <p className="text-sm text-gray-600">
                                Order Date: {formatDate(order.orderDate.toString())}
                              </p>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold">${order.totalAmount}</p>
                              <p className="text-sm text-gray-600">{order.customerEmail}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Select
                                value={order.status}
                                onValueChange={(newStatus) => {
                                  updateOrderMutation.mutate({
                                    orderId: order.id,
                                    updates: { status: newStatus }
                                  });
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No orders found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Management */}
          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product: any) => (
                      <Card key={product.id} className="p-4">
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        <p className="text-sm">Stock: {product.stockQuantity}</p>
                        <p className="text-sm">Price: ${product.price}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discount Settings */}
          <TabsContent value="discounts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
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
                    Add Discount
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(discounts) && discounts.length > 0 ? (
                    <div className="space-y-3">
                      {discounts.map((discount: any) => (
                        <div key={discount.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{discount.name}</h3>
                              <Badge variant={discount.isActive ? "default" : "secondary"}>
                                {discount.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {discount.discountPercentage}% off for {discount.minQuantity}+ items
                            </div>
                            {discount.description && (
                              <div className="text-sm text-gray-500 mt-1">
                                {discount.description}
                              </div>
                            )}
                            {discount.applicableProducts && discount.applicableProducts.length > 0 && (
                              <div className="text-sm text-blue-600 mt-1">
                                Applied to {discount.applicableProducts.length} selected products
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
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
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No discount rules found. Click "Add Discount" to create your first discount.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Discount Edit/Create Dialog */}
            <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingDiscount ? "Edit Discount" : "Create New Discount"}
                  </DialogTitle>
                </DialogHeader>
                <DiscountForm
                  discount={editingDiscount}
                  products={products}
                  onSave={(discountData: any) => {
                    if (editingDiscount) {
                      updateDiscountMutation.mutate({
                        discountId: editingDiscount.id,
                        updates: discountData
                      });
                    } else {
                      createDiscountMutation.mutate(discountData);
                    }
                  }}
                  onCancel={() => {
                    setIsDiscountDialogOpen(false);
                    setEditingDiscount(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Accounting Dashboard */}
          <TabsContent value="accounting">
            <div className="space-y-6">
              {/* Accounting Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${(accountingStats as any)?.todaySales || 0}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Today's Returns</p>
                        <p className="text-2xl font-bold text-red-600">
                          ${(accountingStats as any)?.todayReturns || 0}
                        </p>
                      </div>
                      <TrendingDown className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${(accountingStats as any)?.monthlyRevenue || 0}
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Net Profit</p>
                        <p className="text-2xl font-bold text-purple-600">
                          ${(accountingStats as any)?.netProfit || 0}
                        </p>
                      </div>
                      <Calculator className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Financial Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray(transactions) && transactions.length > 0 ? (
                      <div className="space-y-3">
                        {transactions.slice(0, 10).map((transaction: any) => (
                          <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className={`w-3 h-3 rounded-full ${
                                transaction.type === 'sale' ? 'bg-green-500' :
                                transaction.type === 'refund' ? 'bg-red-500' :
                                transaction.type === 'return' ? 'bg-orange-500' :
                                'bg-gray-500'
                              }`} />
                              <div>
                                <h4 className="font-semibold">{transaction.description}</h4>
                                <p className="text-sm text-gray-600">
                                  {new Date(transaction.processingDate).toLocaleDateString('fa-IR')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${
                                transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'sale' ? '+' : '-'}${transaction.amount}
                              </p>
                              <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No financial transactions found. Transactions will appear here after orders are processed.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      className="flex items-center gap-2" 
                      variant="outline"
                      onClick={handleExportSalesReport}
                    >
                      <Download className="w-4 h-4" />
                      Export Sales Report
                    </Button>
                    <Button 
                      className="flex items-center gap-2" 
                      variant="outline"
                      onClick={handleGenerateMonthlyReport}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Generate Monthly Report
                    </Button>
                    <Button 
                      className="flex items-center gap-2" 
                      variant="outline"
                      onClick={() => setLocation("/analytics/sales")}
                    >
                      <BarChart3 className="w-4 h-4" />
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ShopAdmin;
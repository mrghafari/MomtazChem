import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Package, 
  Bell, 
  Settings, 
  BarChart3, 
  Search,
  Archive,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Truck,
  Loader,
  RefreshCw,
  TestTube,
  Database,
  Edit2,
  Save,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Import existing components
import InventoryAlerts from "@/pages/admin/inventory-alerts";
import InventoryNotificationSettings from "@/pages/admin/inventory-notification-settings";

interface UnifiedProduct {
  id: number;
  name: string;
  category: string;
  stockQuantity: number;
  minStockLevel: number;
  lowStockThreshold: number;
  inStock: boolean;
  shopPrice?: number;
  shopSku?: string;
  shopId?: number;
}

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(0);
  const { toast } = useToast();

  // Fetch unified products - single source of truth
  const { data: unifiedProducts = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ["/api/inventory/unified/products"],
    retry: false,
  });

  // Query for goods in transit
  const { data: goodsInTransit, isLoading: transitLoading, refetch: refetchTransit } = useQuery({
    queryKey: ['/api/shop/goods-in-transit'],
    refetchInterval: 30000
  });

  // Query for inventory movements
  const { data: inventoryMovements, isLoading: movementsLoading } = useQuery({
    queryKey: ['/api/shop/inventory-movements'],
    refetchInterval: 30000
  });

  // Filter products based on search
  const filteredProducts = unifiedProducts.filter((product: UnifiedProduct) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate unified statistics from actual data
  const unifiedStats = {
    totalProducts: unifiedProducts.length,
    inStock: unifiedProducts.filter((p: UnifiedProduct) => p.inStock).length,
    outOfStock: unifiedProducts.filter((p: UnifiedProduct) => !p.inStock).length,
    lowStock: unifiedProducts.filter((p: UnifiedProduct) => 
      p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold
    ).length,
    criticalStock: unifiedProducts.filter((p: UnifiedProduct) => 
      p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel
    ).length,
  };

  // Force refresh unified inventory
  const forceRefreshMutation = useMutation({
    mutationFn: () => apiRequest("/api/inventory/force-refresh", "POST"),
    onSuccess: () => {
      toast({
        title: "✅ Inventory Refreshed",
        description: "All inventory data has been synchronized successfully",
        duration: 3000
      });
      refetchProducts();
      refetchTransit();
    },
    onError: () => {
      toast({
        title: "❌ Refresh Failed",
        description: "Failed to refresh inventory data",
        variant: "destructive",
        duration: 3000
      });
    }
  });

  // Test unified inventory system
  const testUnifiedSystemMutation = useMutation({
    mutationFn: () => apiRequest("/api/inventory/unified/products", "GET"),
    onSuccess: () => {
      toast({
        title: "✅ System Test Successful",
        description: "Unified inventory system is working correctly",
        duration: 3000
      });
      refetchProducts();
    },
    onError: () => {
      toast({
        title: "❌ System Test Failed",
        description: "There was an error testing the unified inventory system",
        variant: "destructive",
        duration: 3000
      });
    }
  });

  // Update product inventory
  const updateInventoryMutation = useMutation({
    mutationFn: ({ productName, newQuantity }: { productName: string; newQuantity: number }) =>
      apiRequest(`/api/products/${encodeURIComponent(productName)}/inventory`, "PATCH", { 
        newQuantity,
        reason: "Manual admin update"
      }),
    onSuccess: () => {
      toast({
        title: "✅ Inventory Updated",
        description: "Product inventory updated successfully",
        duration: 3000
      });
      setEditingProduct(null);
      refetchProducts();
    },
    onError: () => {
      toast({
        title: "❌ Update Failed",
        description: "Failed to update product inventory",
        variant: "destructive",
        duration: 3000
      });
    }
  });

  const handleSaveEdit = (productName: string) => {
    if (editingQuantity >= 0) {
      updateInventoryMutation.mutate({ productName, newQuantity: editingQuantity });
    }
  };

  const startEdit = (product: UnifiedProduct) => {
    setEditingProduct(product.name);
    setEditingQuantity(product.stockQuantity);
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditingQuantity(0);
  };

  // Mutation for marking goods as delivered
  const markAsDeliveredMutation = useMutation({
    mutationFn: async (transitId: number) => {
      const response = await fetch(`/api/shop/goods-in-transit/${transitId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'delivered',
          actualDeliveryDate: new Date(),
        }),
      });
      if (!response.ok) {
        throw new Error('خطا در تحویل کالا');
      }
      return response.json();
    },
    onSuccess: () => {
      if (refetchTransit) {
        refetchTransit();
      }
    },
    onError: (error: any) => {
      console.error('Error marking as delivered:', error);
    },
  });

  const handleMarkAsDelivered = (transitId: number) => {
    markAsDeliveredMutation.mutate(transitId);
  };

  const inventoryStats = {
    totalProducts: unifiedStats.totalProducts,
    lowStockProducts: unifiedStats.lowStock,
    outOfStockProducts: unifiedStats.outOfStock,
    activeAlerts: unifiedStats.criticalStock + unifiedStats.lowStock,
    notificationsSent: unifiedStats.lowStock + unifiedStats.criticalStock,
    goodsInTransit: goodsInTransit?.filter((item: any) => item.status === 'in_transit')?.length || 0,
    transitValue: goodsInTransit?.filter((item: any) => item.status === 'in_transit')
      ?.reduce((sum: number, item: any) => sum + (parseFloat(item.totalAmount) || 0), 0) || 0,
    lastUpdateTime: new Date().toLocaleString('fa-IR')
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مدیریت موجودی</h1>
          <p className="text-gray-600 mt-2">
            مدیریت کامل موجودی، هشدارها و اطلاع‌رسانی‌های خودکار
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            آخرین بروزرسانی: {inventoryStats.lastUpdateTime}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">کل محصولات</p>
                <p className="text-2xl font-bold text-blue-600">{inventoryStats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">موجودی کم</p>
                <p className="text-2xl font-bold text-orange-600">{inventoryStats.lowStockProducts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">اتمام موجودی</p>
                <p className="text-2xl font-bold text-red-600">{inventoryStats.outOfStockProducts}</p>
              </div>
              <Archive className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">هشدارهای فعال</p>
                <p className="text-2xl font-bold text-purple-600">{inventoryStats.activeAlerts}</p>
              </div>
              <Bell className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">کالای در راه</p>
                <p className="text-2xl font-bold text-orange-600">{inventoryStats.goodsInTransit}</p>
                <p className="text-xs text-gray-500">
                  {transitLoading ? 'در حال بارگیری...' : `${inventoryStats.transitValue.toLocaleString()} دینار`}
                </p>
              </div>
              <Truck className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Button 
          onClick={() => forceRefreshMutation.mutate()}
          disabled={forceRefreshMutation.isPending}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className={`w-4 h-4 ${forceRefreshMutation.isPending ? 'animate-spin' : ''}`} />
          {forceRefreshMutation.isPending ? 'در حال همگام‌سازی...' : 'همگام‌سازی موجودی'}
        </Button>
        
        <Button 
          onClick={() => testUnifiedSystemMutation.mutate()}
          disabled={testUnifiedSystemMutation.isPending}
          variant="outline"
          className="flex items-center gap-2"
        >
          <TestTube className="w-4 h-4" />
          تست سیستم
        </Button>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            نمای کلی
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            مدیریت محصولات
          </TabsTrigger>
          <TabsTrigger value="transit" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            کالای در راه
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            هشدارها
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            تنظیمات
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            آنالیز
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Archive className="w-4 h-4" />
            گزارشات
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            اتوماسیون
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  فعالیت‌های اخیر
                </CardTitle>
                <CardDescription>
                  آخرین تغییرات موجودی و هشدارها
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">هشدار موجودی کم</p>
                    <p className="text-xs text-gray-600">تینر فوری 10000 - موجودی: 2 واحد</p>
                  </div>
                  <Badge variant="destructive">فوری</Badge>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Bell className="w-5 h-5 text-orange-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">ارسال اطلاع‌رسانی</p>
                    <p className="text-xs text-gray-600">به 3 مخاطب ایمیل ارسال شد</p>
                  </div>
                  <Badge variant="secondary">ارسال شده</Badge>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">بروزرسانی موجودی</p>
                    <p className="text-xs text-gray-600">محصول جدید اضافه شد</p>
                  </div>
                  <Badge variant="outline">تکمیل شده</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  عملیات سریع
                </CardTitle>
                <CardDescription>
                  دسترسی سریع به عملکردهای مهم
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("alerts")}
                >
                  <Bell className="w-4 h-4" />
                  مشاهده همه هشدارها
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="w-4 h-4" />
                  تنظیمات اطلاع‌رسانی
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("analytics")}
                >
                  <TrendingUp className="w-4 h-4" />
                  گزارش عملکرد
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("reports")}
                >
                  <Archive className="w-4 h-4" />
                  دانلود گزارشات
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>وضعیت سیستم</CardTitle>
              <CardDescription>
                وضعیت کلی سیستم مدیریت موجودی
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-900">سیستم اطلاع‌رسانی</p>
                    <p className="text-sm text-green-600">فعال و عملیاتی</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Bell className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="font-medium text-blue-900">پایش موجودی</p>
                    <p className="text-sm text-blue-600">در حال بررسی</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-500" />
                  <div>
                    <p className="font-medium text-purple-900">مخاطبین</p>
                    <p className="text-sm text-purple-600">5 مخاطب فعال</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <Label htmlFor="search">جستجوی محصولات</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="جستجو بر اساس نام یا دسته‌بندی..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {filteredProducts.length} محصول
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unified Products Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  مدیریت یکپارچه محصولات
                </CardTitle>
                <CardDescription>
                  مدیریت موجودی تمامی محصولات از یک مکان واحد
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-gray-500" />
                    <span className="ml-2 text-gray-500">در حال بارگیری محصولات...</span>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredProducts.map((product: UnifiedProduct) => (
                        <Card key={product.id} className="border-2">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Product Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium text-lg text-gray-900 mb-1">
                                    {product.name}
                                  </h3>
                                  <Badge variant="outline" className="text-xs">
                                    {product.category}
                                  </Badge>
                                </div>
                                <Badge variant={product.inStock ? 'default' : 'destructive'}>
                                  {product.inStock ? 'موجود' : 'ناموجود'}
                                </Badge>
                              </div>

                              {/* Inventory Info */}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-blue-50 p-2 rounded">
                                  <p className="text-blue-600 font-medium">موجودی فعلی</p>
                                  <p className="text-lg font-bold text-blue-800">
                                    {editingProduct === product.name ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          value={editingQuantity}
                                          onChange={(e) => setEditingQuantity(parseInt(e.target.value) || 0)}
                                          className="w-16 h-8 text-sm"
                                          min="0"
                                        />
                                        <Button 
                                          size="sm" 
                                          onClick={() => handleSaveEdit(product.name)}
                                          disabled={updateInventoryMutation.isPending}
                                        >
                                          <Save className="w-3 h-3" />
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={cancelEdit}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        {product.stockQuantity}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => startEdit(product)}
                                          className="p-1 h-6 w-6"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </p>
                                </div>
                                <div className="bg-orange-50 p-2 rounded">
                                  <p className="text-orange-600 font-medium">حد کمینه</p>
                                  <p className="text-lg font-bold text-orange-800">
                                    {product.minStockLevel}
                                  </p>
                                </div>
                              </div>

                              {/* Status Indicators */}
                              <div className="flex gap-2">
                                {product.stockQuantity <= product.minStockLevel && product.stockQuantity > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    حد بحرانی
                                  </Badge>
                                )}
                                {product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > product.minStockLevel && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Bell className="w-3 h-3 mr-1" />
                                    موجودی کم
                                  </Badge>
                                )}
                                {product.stockQuantity > product.lowStockThreshold && (
                                  <Badge variant="outline" className="text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    موجودی کافی
                                  </Badge>
                                )}
                              </div>

                              {/* Shop Integration Info */}
                              {product.shopPrice && (
                                <div className="text-xs text-gray-500 border-t pt-2">
                                  <p>قیمت فروش: {product.shopPrice?.toLocaleString()} دینار</p>
                                  {product.shopSku && <p>کد فروشگاه: {product.shopSku}</p>}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>هیچ محصولی یافت نشد</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transit" className="space-y-6">
          <div className="space-y-6">
            {/* Transit Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">موارد در راه</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {goodsInTransit?.filter((item: any) => item.status === 'in_transit')?.length || 0}
                      </p>
                    </div>
                    <Truck className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">ارزش کل</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {(goodsInTransit?.filter((item: any) => item.status === 'in_transit')
                          ?.reduce((sum: number, item: any) => sum + (parseFloat(item.totalAmount) || 0), 0) || 0).toLocaleString()} دینار
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">تحویل شده</p>
                      <p className="text-2xl font-bold text-green-600">
                        {goodsInTransit?.filter((item: any) => item.status === 'delivered')?.length || 0}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transit Items List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  کالاهای در راه
                </CardTitle>
                <CardDescription>
                  مدیریت کالاهای در راه به مشتریان
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transitLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-gray-500" />
                    <span className="ml-2 text-gray-500">در حال بارگیری...</span>
                  </div>
                ) : goodsInTransit && goodsInTransit.length > 0 ? (
                  <div className="space-y-4">
                    {goodsInTransit.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-lg">{item.productName}</h3>
                              <Badge variant={item.status === 'in_transit' ? 'default' : 'secondary'}>
                                {item.status === 'in_transit' ? 'در راه' : 'تحویل شده'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">کد سفارش:</span> {item.orderId}
                              </div>
                              <div>
                                <span className="font-medium">مقدار:</span> {item.quantity}
                              </div>
                              <div>
                                <span className="font-medium">مبلغ کل:</span> {(item.totalAmount || 0).toLocaleString()} دینار
                              </div>
                              <div>
                                <span className="font-medium">تاریخ:</span> {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                              </div>
                            </div>
                            {item.notes && (
                              <p className="text-sm text-gray-500 mt-2">
                                <span className="font-medium">یادداشت:</span> {item.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {item.status === 'in_transit' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleMarkAsDelivered(item.id)}
                                disabled={markAsDeliveredMutation.isPending}
                              >
                                {markAsDeliveredMutation.isPending ? 'در حال تحویل...' : 'تحویل شد'}
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              جزئیات
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    هیچ کالایی در راه نیست
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <InventoryAlerts />
        </TabsContent>

        <TabsContent value="settings">
          <InventoryNotificationSettings />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>آنالیز عملکرد موجودی</CardTitle>
              <CardDescription>
                تحلیل روند موجودی و هشدارها
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">در حال توسعه</p>
              <p className="text-sm text-gray-500">
                آنالیز دقیق روند موجودی، الگوهای مصرف و پیش‌بینی نیاز
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>گزارشات موجودی</CardTitle>
              <CardDescription>
                دانلود گزارشات تفصیلی موجودی
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">در حال توسعه</p>
              <p className="text-sm text-gray-500">
                گزارشات کامل موجودی، تاریخچه تغییرات و آمار عملکرد
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اتوماسیون موجودی</CardTitle>
              <CardDescription>
                تنظیمات خودکارسازی فرآیندها
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">در حال توسعه</p>
              <p className="text-sm text-gray-500">
                خودکارسازی سفارش‌گیری، تخصیص موجودی و بازسازی انبار
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
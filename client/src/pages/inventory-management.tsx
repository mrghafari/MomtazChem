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
  X,
  Mail,
  MessageSquare,
  XCircle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
  
  // Threshold settings state
  const [thresholdSettings, setThresholdSettings] = useState({
    settingName: 'global_default',
    lowStockThreshold: 10,
    warningStockLevel: 5,
    emailEnabled: true,
    smsEnabled: true,
    managerEmail: 'manager@momtazchem.com',
    managerPhone: '+9647700000000',
    managerName: 'مدیر انبار',
    checkFrequency: 60,
    businessHoursOnly: true,
    weekendsEnabled: false,
    isActive: true
  });

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

  // Fetch threshold settings
  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ["/api/inventory/threshold-settings"],
    retry: false,
  });

  // Update thresholdSettings when data is loaded
  useEffect(() => {
    if (settingsData?.data && settingsData.data.length > 0) {
      const settings = settingsData.data[0];
      setThresholdSettings({
        settingName: settings.settingName || 'global_default',
        lowStockThreshold: settings.lowStockThreshold || 10,
        warningStockLevel: settings.warningStockLevel || 5,
        emailEnabled: settings.emailEnabled ?? true,
        smsEnabled: settings.smsEnabled ?? true,
        managerEmail: settings.managerEmail || 'manager@momtazchem.com',
        managerPhone: settings.managerPhone || '+9647700000000',
        managerName: settings.managerName || 'مدیر انبار',
        checkFrequency: settings.checkFrequency || 60,
        businessHoursOnly: settings.businessHoursOnly ?? true,
        weekendsEnabled: settings.weekendsEnabled ?? false,
        isActive: settings.isActive ?? true
      });
    }
  }, [settingsData]);

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

  // Save threshold settings mutation
  const saveThresholdMutation = useMutation({
    mutationFn: (settings: typeof thresholdSettings) =>
      apiRequest("/api/inventory/threshold-settings", "POST", settings),
    onSuccess: () => {
      toast({
        title: "✅ تنظیمات ذخیره شد",
        description: "تنظیمات آستانه موجودی با موفقیت ذخیره شد",
        duration: 3000
      });
      refetchSettings();
    },
    onError: () => {
      toast({
        title: "❌ خطا در ذخیره",
        description: "خطا در ذخیره تنظیمات آستانه موجودی",
        variant: "destructive",
        duration: 3000
      });
    }
  });

  const handleSaveThresholdSettings = () => {
    saveThresholdMutation.mutate(thresholdSettings);
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

  // Calculate inventory statistics (consolidated)
  const inventoryStats = {
    totalProducts: unifiedStats.totalProducts,
    inStock: unifiedStats.inStock,
    outOfStock: unifiedStats.outOfStock,
    lowStock: unifiedStats.lowStock,
    criticalStock: unifiedStats.criticalStock,
    goodsInTransit: goodsInTransit?.filter((item: any) => item.status === 'in_transit')?.length || 0,
    transitValue: goodsInTransit?.filter((item: any) => item.status === 'in_transit')
      ?.reduce((sum: number, item: any) => sum + (parseFloat(item.totalAmount) || 0), 0) || 0,
    lastUpdateTime: new Date().toLocaleString('en-US')
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
                <p className="text-sm font-medium text-gray-600">موجود</p>
                <p className="text-2xl font-bold text-green-600">{inventoryStats.inStock}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">موجودی کم</p>
                <p className="text-2xl font-bold text-orange-600">{inventoryStats.lowStock}</p>
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
                <p className="text-2xl font-bold text-red-600">{inventoryStats.outOfStock}</p>
              </div>
              <Archive className="w-8 h-8 text-red-500" />
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            نمای کلی
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
                  onClick={() => setActiveTab("transit")}
                >
                  <Truck className="w-4 h-4" />
                  کالاهای در راه
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
                                <span className="font-medium">تاریخ:</span> {new Date(item.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
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

        <TabsContent value="settings" className="space-y-6">
          {/* Threshold Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                تنظیمات آستانه موجودی
              </CardTitle>
              <CardDescription>
                تنظیم حدود هشدار موجودی و پیکربندی ارسال پیام و ایمیل به مدیر
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Threshold Levels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    حد پایین (هشدار اولیه)
                  </Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    value={thresholdSettings.lowStockThreshold}
                    onChange={(e) => setThresholdSettings(prev => ({ 
                      ...prev, 
                      lowStockThreshold: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="مثال: 10"
                    className="text-right"
                  />
                  <p className="text-sm text-muted-foreground">
                    وقتی موجودی به این حد برسد، هشدار اولیه ارسال می‌شود و در فروشگاه نمایش داده می‌شود
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warningStockLevel" className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    حد هشدار (بحرانی)
                  </Label>
                  <Input
                    id="warningStockLevel"
                    type="number"
                    value={thresholdSettings.warningStockLevel}
                    onChange={(e) => setThresholdSettings(prev => ({ 
                      ...prev, 
                      warningStockLevel: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="مثال: 5"
                    className="text-right"
                  />
                  <p className="text-sm text-muted-foreground">
                    وقتی موجودی به این حد برسد، هشدار بحرانی فوری ارسال می‌شود
                  </p>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">تنظیمات اطلاع‌رسانی</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="emailEnabled"
                      checked={thresholdSettings.emailEnabled}
                      onCheckedChange={(checked) => setThresholdSettings(prev => ({ 
                        ...prev, 
                        emailEnabled: checked 
                      }))}
                    />
                    <Label htmlFor="emailEnabled" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      ارسال ایمیل
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="smsEnabled"
                      checked={thresholdSettings.smsEnabled}
                      onCheckedChange={(checked) => setThresholdSettings(prev => ({ 
                        ...prev, 
                        smsEnabled: checked 
                      }))}
                    />
                    <Label htmlFor="smsEnabled" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      ارسال پیامک
                    </Label>
                  </div>
                </div>
              </div>

              {/* Manager Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">اطلاعات تماس مدیر</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="managerName">نام مدیر</Label>
                    <Input
                      id="managerName"
                      value={thresholdSettings.managerName}
                      onChange={(e) => setThresholdSettings(prev => ({ 
                        ...prev, 
                        managerName: e.target.value 
                      }))}
                      placeholder="مدیر انبار"
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="managerEmail">ایمیل مدیر</Label>
                    <Input
                      id="managerEmail"
                      type="email"
                      value={thresholdSettings.managerEmail}
                      onChange={(e) => setThresholdSettings(prev => ({ 
                        ...prev, 
                        managerEmail: e.target.value 
                      }))}
                      placeholder="manager@momtazchem.com"
                      className="text-left"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="managerPhone">شماره موبایل مدیر</Label>
                    <Input
                      id="managerPhone"
                      type="tel"
                      value={thresholdSettings.managerPhone}
                      onChange={(e) => setThresholdSettings(prev => ({ 
                        ...prev, 
                        managerPhone: e.target.value 
                      }))}
                      placeholder="+9647700000000"
                      className="text-left"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveThresholdSettings}
                  disabled={saveThresholdMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saveThresholdMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Original Notification Settings */}
          <InventoryNotificationSettings />
        </TabsContent>


      </Tabs>
    </div>
  );
}
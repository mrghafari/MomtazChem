import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Package, AlertTriangle, TrendingUp, Search, RefreshCw, CheckCircle, XCircle, Settings, Save, Bell, Mail, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

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

export default function UnifiedInventory() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  
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

  // Fetch unified products
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/inventory/unified/products"],
    retry: false,
  });

  // Fetch threshold settings
  const { data: settingsData } = useQuery({
    queryKey: ["/api/inventory/threshold-settings"],
    retry: false,
  });

  // Fetch alerts log
  const { data: alertsLog = [] } = useQuery({
    queryKey: ["/api/inventory/alerts-log"],
    retry: false,
  });

  // Filter products based on search and stock status
  const filteredProducts = products.filter((product: UnifiedProduct) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // If showOutOfStock is false, only show products that are in stock
    if (!showOutOfStock && !product.inStock) {
      return false;
    }
    
    return matchesSearch;
  });

  // Calculate statistics
  const stats = {
    totalProducts: products.length,
    inStock: products.filter((p: UnifiedProduct) => p.inStock).length,
    outOfStock: products.filter((p: UnifiedProduct) => !p.inStock).length,
    lowStock: products.filter((p: UnifiedProduct) => 
      p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold
    ).length,
    criticalStock: products.filter((p: UnifiedProduct) => 
      p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel
    ).length,
  };

  // Test unified inventory system
  const testUnifiedSystemMutation = useMutation({
    mutationFn: () => apiRequest("/api/inventory/unified/products", "GET"),
    onSuccess: () => {
      toast({
        title: "✅ System Test Successful",
        description: "Unified inventory system is working correctly",
        duration: 3000
      });
      refetch();
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

  // Save threshold settings mutation
  const saveThresholdSettingsMutation = useMutation({
    mutationFn: (settings: any) => apiRequest("/api/inventory/threshold-settings", "POST", settings),
    onSuccess: () => {
      toast({
        title: "✅ تنظیمات ذخیره شد",
        description: "تنظیمات آستانه موجودی با موفقیت بروزرسانی شد",
        duration: 3000
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/threshold-settings"] });
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
      refetch();
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

  const getStockStatus = (product: UnifiedProduct) => {
    if (!product.inStock) return { status: "Out of Stock", color: "destructive" };
    if (product.stockQuantity <= product.minStockLevel) return { status: "Critical", color: "destructive" };
    if (product.stockQuantity <= product.lowStockThreshold) return { status: "Low Stock", color: "warning" };
    return { status: "In Stock", color: "success" };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground animate-pulse mb-4" />
            <p className="text-muted-foreground">در حال بارگذاری سیستم موجودی واحد...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/admin/site-management")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            بازگشت
          </Button>
          <Package className="h-6 w-6 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold">سیستم موجودی واحد</h1>
            <p className="text-muted-foreground">
              showcase_products منشا اصلی موجودی - shop_products فقط قیمت و SKU
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => testUnifiedSystemMutation.mutate()}
            disabled={testUnifiedSystemMutation.isPending}
            variant="outline"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            تست سیستم
          </Button>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">کل محصولات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">موجود</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ناموجود</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">موجودی کم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">وضعیت بحرانی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalStock}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="products">فهرست محصولات</TabsTrigger>
          <TabsTrigger value="alerts">هشدارها</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            تنظیمات آستانه
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>معماری سیستم موجودی واحد</CardTitle>
              <CardDescription>
                نحوه عملکرد سیستم جدید موجودی
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    showcase_products (منشا اصلی)
                  </h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• موجودی (stockQuantity)</li>
                    <li>• حداقل موجودی (minStockLevel)</li>
                    <li>• آستانه هشدار (lowStockThreshold)</li>
                    <li>• وضعیت موجودی (inStock)</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-blue-600 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    shop_products (اطلاعات تکمیلی)
                  </h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• قیمت فروش (price)</li>
                    <li>• کد محصول (sku)</li>
                    <li>• تخفیفات و قیمت‌گذاری</li>
                    <li>• مشخصات فروش</li>
                  </ul>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">مزایای سیستم واحد:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• حذف تناقض در موجودی بین showcase و shop</li>
                  <li>• منشا واحد اطلاعات موجودی</li>
                  <li>• سادگی در مدیریت و نگهداری</li>
                  <li>• کاهش خطای انسانی</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>فهرست محصولات با موجودی واحد</CardTitle>
              <CardDescription>
                تمام محصولات با موجودی از showcase_products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="search">جستجو:</Label>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="جستجو بر اساس نام یا دسته‌بندی..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-out-of-stock"
                    checked={showOutOfStock}
                    onCheckedChange={(checked) => setShowOutOfStock(!!checked)}
                  />
                  <Label htmlFor="show-out-of-stock" className="text-sm cursor-pointer">
                    نمایش محصولات با موجودی صفر
                  </Label>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام محصول</TableHead>
                      <TableHead>دسته‌بندی</TableHead>
                      <TableHead>موجودی فعلی</TableHead>
                      <TableHead>حداقل موجودی</TableHead>
                      <TableHead>آستانه هشدار</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>قیمت فروش</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product: UnifiedProduct) => {
                      const stockStatus = getStockStatus(product);
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{product.stockQuantity}</span>
                              {product.stockQuantity <= product.lowStockThreshold && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{product.minStockLevel}</TableCell>
                          <TableCell>{product.lowStockThreshold}</TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.color as any}>
                              {stockStatus.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {product.shopPrice ? (
                              <span className="font-mono">{product.shopPrice.toLocaleString()} IQD</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                هشدارهای موجودی
              </CardTitle>
              <CardDescription>
                محصولاتی که نیاز به توجه دارند
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Critical Stock */}
                {stats.criticalStock > 0 && (
                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <h3 className="font-semibold text-red-800 mb-2">موجودی بحرانی ({stats.criticalStock} محصول)</h3>
                    <div className="space-y-2">
                      {products
                        .filter((p: UnifiedProduct) => p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel)
                        .map((product: UnifiedProduct) => (
                          <div key={product.id} className="flex justify-between items-center text-sm">
                            <span>{product.name}</span>
                            <Badge variant="destructive">{product.stockQuantity} واحد</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Low Stock */}
                {stats.lowStock > 0 && (
                  <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <h3 className="font-semibold text-orange-800 mb-2">موجودی کم ({stats.lowStock} محصول)</h3>
                    <div className="space-y-2">
                      {products
                        .filter((p: UnifiedProduct) => 
                          p.stockQuantity > p.minStockLevel && p.stockQuantity <= p.lowStockThreshold
                        )
                        .map((product: UnifiedProduct) => (
                          <div key={product.id} className="flex justify-between items-center text-sm">
                            <span>{product.name}</span>
                            <Badge variant="warning">{product.stockQuantity} واحد</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Out of Stock */}
                {stats.outOfStock > 0 && (
                  <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">ناموجود ({stats.outOfStock} محصول)</h3>
                    <div className="space-y-2">
                      {products
                        .filter((p: UnifiedProduct) => !p.inStock)
                        .map((product: UnifiedProduct) => (
                          <div key={product.id} className="flex justify-between items-center text-sm">
                            <span>{product.name}</span>
                            <Badge variant="secondary">ناموجود</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {stats.criticalStock === 0 && stats.lowStock === 0 && stats.outOfStock === 0 && (
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg text-center">
                    <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
                    <p className="text-green-800 font-medium">همه محصولات در وضعیت مناسب هستند</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
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

              {/* Advanced Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">تنظیمات پیشرفته</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkFrequency">فرکانس بررسی (دقیقه)</Label>
                    <Input
                      id="checkFrequency"
                      type="number"
                      value={thresholdSettings.checkFrequency}
                      onChange={(e) => setThresholdSettings(prev => ({ 
                        ...prev, 
                        checkFrequency: parseInt(e.target.value) || 60 
                      }))}
                      placeholder="60"
                      className="text-right"
                    />
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="businessHoursOnly"
                      checked={thresholdSettings.businessHoursOnly}
                      onCheckedChange={(checked) => setThresholdSettings(prev => ({ 
                        ...prev, 
                        businessHoursOnly: checked 
                      }))}
                    />
                    <Label htmlFor="businessHoursOnly">فقط ساعات کاری</Label>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="weekendsEnabled"
                      checked={thresholdSettings.weekendsEnabled}
                      onCheckedChange={(checked) => setThresholdSettings(prev => ({ 
                        ...prev, 
                        weekendsEnabled: checked 
                      }))}
                    />
                    <Label htmlFor="weekendsEnabled">شامل آخر هفته</Label>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={() => saveThresholdSettingsMutation.mutate(thresholdSettings)}
                  disabled={saveThresholdSettingsMutation.isPending}
                  className="w-full md:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveThresholdSettingsMutation.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                گزارش هشدارهای ارسال شده
              </CardTitle>
              <CardDescription>
                آخرین هشدارهای موجودی ارسال شده به مدیر
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLog && alertsLog.data && alertsLog.data.length > 0 ? (
                <div className="space-y-4">
                  {alertsLog.data.slice(0, 10).map((alert: any) => (
                    <div key={alert.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{alert.productName}</h4>
                        <Badge variant={alert.alertType === 'warning_level' ? 'destructive' : 'warning'}>
                          {alert.alertType === 'warning_level' ? 'بحرانی' : 'هشدار'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>موجودی فعلی: {alert.currentStock} - حد آستانه: {alert.thresholdValue}</p>
                        <p>ارسال شده در: {new Date(alert.sentAt).toLocaleDateString('fa-IR')}</p>
                        <div className="flex gap-4">
                          <span className={`${alert.emailSent ? 'text-green-600' : 'text-gray-400'}`}>
                            ایمیل: {alert.emailSent ? '✓' : '✗'}
                          </span>
                          <span className={`${alert.smsSent ? 'text-green-600' : 'text-gray-400'}`}>
                            پیامک: {alert.smsSent ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  هنوز هیچ هشداری ارسال نشده است
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
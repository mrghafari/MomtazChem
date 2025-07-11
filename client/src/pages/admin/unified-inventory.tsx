import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Package, AlertTriangle, TrendingUp, Search, RefreshCw, CheckCircle, XCircle } from "lucide-react";
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

  // Fetch unified products
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/inventory/unified/products"],
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
      </Tabs>
    </div>
  );
}
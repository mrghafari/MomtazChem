import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  Mail, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings,
  Users
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ShopProduct {
  id: number;
  name: string;
  category: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
  inStock: boolean;
  price: string;
  priceUnit: string;
}

export default function InventoryAlerts() {
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/shop/products"],
  });

  const checkAllInventoryMutation = useMutation({
    mutationFn: () => apiRequest("/api/inventory/check-all", "POST"),
    onSuccess: () => {
      toast({
        title: "Inventory Check Complete",
        description: "All products checked and alerts sent if needed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/products"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check inventory levels.",
        variant: "destructive",
      });
    },
  });

  const checkProductMutation = useMutation({
    mutationFn: (productId: number) => apiRequest(`/api/inventory/check-product/${productId}`, "POST"),
    onSuccess: (data: any, productId: number) => {
      const product = products.find((p: ShopProduct) => p.id === productId);
      toast({
        title: data.alertSent ? "Alert Sent" : "Stock OK",
        description: data.alertSent 
          ? `Low stock alert sent for ${product?.name}`
          : `Stock levels are adequate for ${product?.name}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check product inventory.",
        variant: "destructive",
      });
    },
  });

  const handleCheckAll = async () => {
    setIsCheckingAll(true);
    try {
      await checkAllInventoryMutation.mutateAsync();
    } finally {
      setIsCheckingAll(false);
    }
  };

  const handleCheckProduct = (productId: number) => {
    checkProductMutation.mutate(productId);
  };

  // Calculate inventory statistics
  const getInventoryStats = () => {
    const totalProducts = products.length;
    const outOfStock = products.filter((p: ShopProduct) => (p.stockQuantity || 0) <= 0).length;
    const lowStock = products.filter((p: ShopProduct) => {
      const stock = p.stockQuantity || 0;
      const threshold = p.minStockLevel || 5; // حد مینیمم برای اعلام به مدیر تولید
      return stock > 0 && stock <= threshold;
    }).length;
    const adequateStock = totalProducts - outOfStock - lowStock;

    return { totalProducts, outOfStock, lowStock, adequateStock };
  };

  const stats = getInventoryStats();
  const outOfStockProducts = products.filter((p: ShopProduct) => (p.stockQuantity || 0) <= 0);
  const lowStockProducts = products.filter((p: ShopProduct) => {
    const stock = p.stockQuantity || 0;
    const threshold = p.minStockLevel || 5; // حد مینیمم برای اعلام به مدیر تولید
    return stock > 0 && stock <= threshold;
  });
  const adequateStockProducts = products.filter((p: ShopProduct) => {
    const stock = p.stockQuantity || 0;
    const threshold = p.minStockLevel || 5; // حد مینیمم برای اعلام به مدیر تولید
    return stock > threshold;
  });

  const getStockStatus = (product: ShopProduct) => {
    const stock = product.stockQuantity || 0;
    const threshold = product.minStockLevel || 5; // حد مینیمم برای اعلام به مدیر تولید
    
    if (stock <= 0) return { status: 'out_of_stock', label: 'Out of Stock', color: 'bg-red-500' };
    if (stock <= threshold) return { status: 'low_stock', label: 'Low Stock', color: 'bg-yellow-500' };
    return { status: 'adequate', label: 'Adequate', color: 'bg-green-500' };
  };

  const getStockPercentage = (product: ShopProduct) => {
    const stock = product.stockQuantity || 0;
    const threshold = product.minStockLevel || 5; // حد مینیمم برای اعلام به مدیر تولید
    const maxStock = threshold * 3; // Assume optimal stock is 3x threshold
    return Math.min((stock / maxStock) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Alerts</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Monitor stock levels and manage inventory alerts</p>
        </div>
        
        <div className="flex gap-3">
          <Link href="/admin/inventory-notification-settings">
            <Button 
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              تنظیمات اطلاع‌رسانی
            </Button>
          </Link>
          
          <Button 
            onClick={handleCheckAll}
            disabled={isCheckingAll || checkAllInventoryMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCheckingAll ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check All Inventory
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Adequate Stock</p>
                <p className="text-2xl font-bold text-green-600">{stats.adequateStock}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Information */}
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription>
          Inventory alerts are automatically sent to <strong>info@momtazchem.com</strong> when stock levels fall below the minimum threshold. 
          The system checks inventory every hour during business hours (8 AM - 6 PM).
        </AlertDescription>
      </Alert>

      {/* Product Inventory Tabs */}
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alerts ({stats.outOfStock + stats.lowStock})
          </TabsTrigger>
          <TabsTrigger value="out-of-stock">
            <XCircle className="w-4 h-4 mr-2" />
            Out of Stock ({stats.outOfStock})
          </TabsTrigger>
          <TabsTrigger value="low-stock">
            <TrendingDown className="w-4 h-4 mr-2" />
            Low Stock ({stats.lowStock})
          </TabsTrigger>
          <TabsTrigger value="all">
            <BarChart3 className="w-4 h-4 mr-2" />
            All Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {outOfStockProducts.length === 0 && lowStockProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Inventory Alerts</h3>
                <p className="text-gray-500">All products have adequate stock levels.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {outOfStockProducts.map((product: ShopProduct) => (
                <Card key={product.id} className="border-red-200 bg-red-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="destructive">Out of Stock</Badge>
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <span className="text-sm text-gray-500">({product.sku})</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{product.category}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">Current: <strong className="text-red-600">0</strong></span>
                          <span className="text-sm">Manager Alert Threshold: <strong>{product.minStockLevel || 5}</strong></span>
                          <span className="text-sm">Price: <strong>{product.price} {product.priceUnit}</strong></span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCheckProduct(product.id)}
                        disabled={checkProductMutation.isPending}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Send Alert
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {lowStockProducts.map((product: ShopProduct) => (
                <Card key={product.id} className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700">Low Stock</Badge>
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <span className="text-sm text-gray-500">({product.sku})</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{product.category}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">Current: <strong className="text-yellow-600">{product.stockQuantity}</strong></span>
                          <span className="text-sm">Manager Alert Threshold: <strong>{product.minStockLevel || 5}</strong></span>
                          <span className="text-sm">Price: <strong>{product.price} {product.priceUnit}</strong></span>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Stock Level</span>
                            <span>{getStockPercentage(product).toFixed(0)}%</span>
                          </div>
                          <Progress value={getStockPercentage(product)} className="h-2" />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCheckProduct(product.id)}
                        disabled={checkProductMutation.isPending}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Send Alert
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="out-of-stock" className="space-y-4">
          {outOfStockProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Out of Stock Products</h3>
                <p className="text-gray-500">All products have some inventory available.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outOfStockProducts.map((product: ShopProduct) => (
                <Card key={product.id} className="border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.category} • {product.sku}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{product.price} {product.priceUnit}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCheckProduct(product.id)}
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Alert
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          {lowStockProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Low Stock Products</h3>
                <p className="text-gray-500">All products have adequate stock levels.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lowStockProducts.map((product: ShopProduct) => (
                <Card key={product.id} className="border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">Low Stock</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.category} • {product.sku}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Stock: {product.stockQuantity} / {product.lowStockThreshold || 10}</span>
                        <span>{product.price} {product.priceUnit}</span>
                      </div>
                      <Progress value={getStockPercentage(product)} className="h-2" />
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleCheckProduct(product.id)}
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Send Alert
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product: ShopProduct) => {
              const status = getStockStatus(product);
              return (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
                      <Badge 
                        variant={status.status === 'out_of_stock' ? 'destructive' : 'outline'}
                        className={status.status === 'low_stock' ? 'border-yellow-500 text-yellow-700' : ''}
                      >
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{product.category} • {product.sku}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Stock: {product.stockQuantity || 0}</span>
                        <span>Min: {product.lowStockThreshold || 10}</span>
                      </div>
                      <Progress value={getStockPercentage(product)} className="h-1" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium">{product.price} {product.priceUnit}</span>
                        {status.status !== 'adequate' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckProduct(product.id)}
                            className="h-6 px-2 text-xs"
                          >
                            <Mail className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
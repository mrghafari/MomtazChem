import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import LowStockAlert from '@/components/LowStockAlert';
import { 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  RefreshCw, 
  Plus,
  Edit,
  Save,
  X
} from 'lucide-react';

interface LowStockProduct {
  id: number;
  name: string;
  stockQuantity: number;
  minimumStock: number;
  availableQuantity: number;
  difference: number;
}

export default function InventoryAlerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [newMinimumStock, setNewMinimumStock] = useState<number>(0);

  // Get low stock products
  const { data: lowStockData, isLoading: isLoadingLowStock, refetch: refetchLowStock } = useQuery({
    queryKey: ['/api/inventory/low-stock'],
    refetchInterval: 300000, // تحديث كل 5 دقائق
  });

  // Get all products for minimum stock management
  const { data: allProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/shop/products'],
  });

  const lowStockProducts: LowStockProduct[] = lowStockData?.data?.products || [];
  const totalLowStockItems = lowStockProducts.length;

  // Update minimum stock mutation
  const updateMinimumStockMutation = useMutation({
    mutationFn: async ({ productId, minimumStock }: { productId: number; minimumStock: number }) => {
      return await apiRequest(`/api/shop/products/${productId}/minimum-stock`, 'PUT', {
        minimumStock: minimumStock
      });
    },
    onSuccess: () => {
      toast({
        title: "موفق",
        description: "حد مینیمم موجودی با موفقیت به‌روزرسانی شد"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      setEditingProduct(null);
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی حد مینیمم موجودی",
        variant: "destructive"
      });
    }
  });

  const handleUpdateMinimumStock = (productId: number) => {
    if (newMinimumStock < 0) {
      toast({
        title: "خطا",
        description: "حد مینیمم موجودی نمی‌تواند منفی باشد",
        variant: "destructive"
      });
      return;
    }
    updateMinimumStockMutation.mutate({ productId, minimumStock: newMinimumStock });
  };

  const startEditing = (productId: number, currentMinimum: number) => {
    setEditingProduct(productId);
    setNewMinimumStock(currentMinimum);
  };

  const cancelEditing = () => {
    setEditingProduct(null);
    setNewMinimumStock(0);
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">هشدارهای موجودی</h1>
            <p className="text-gray-500">مدیریت و نظارت بر سطح موجودی کالاها</p>
          </div>
          <Button
            onClick={() => {
              refetchLowStock();
              queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
            }}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            بروزرسانی
          </Button>
        </div>

        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="alerts" className="flex-1">
              هشدارهای فعلی
              {totalLowStockItems > 0 && (
                <Badge variant="destructive" className="mr-2">
                  {totalLowStockItems}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              تنظیمات حد مینیمم
            </TabsTrigger>
          </TabsList>

          {/* Current Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <LowStockAlert />
            
            {/* Detailed Low Stock Products List */}
            {totalLowStockItems > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-500" />
                    جزئیات کالاهای کم‌موجود
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-3 px-4">نام کالا</th>
                          <th className="text-right py-3 px-4">موجودی فعلی</th>
                          <th className="text-right py-3 px-4">حد مینیمم</th>
                          <th className="text-right py-3 px-4">کمبود</th>
                          <th className="text-right py-3 px-4">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStockProducts.map((product) => (
                          <tr key={product.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{product.name}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{product.stockQuantity}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="secondary">{product.minimumStock}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="destructive">
                                {Math.abs(product.difference)} واحد
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-red-600 text-xs">نیاز به تأمین</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Minimum Stock Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  تنظیم حد مینیمم موجودی کالاها
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingProducts ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-4">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allProducts?.map((product: any) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>موجودی فعلی: {product.stockQuantity || 0}</span>
                            <span>حد فعلی: {product.minimumStock || 0}</span>
                            {(product.stockQuantity || 0) < (product.minimumStock || 0) && (
                              <Badge variant="destructive" className="text-xs">
                                کم‌موجود
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {editingProduct === product.id ? (
                            <>
                              <Input
                                type="number"
                                min="0"
                                value={newMinimumStock}
                                onChange={(e) => setNewMinimumStock(parseInt(e.target.value) || 0)}
                                className="w-20"
                                placeholder="0"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdateMinimumStock(product.id)}
                                disabled={updateMinimumStockMutation.isPending}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(product.id, product.minimumStock || 0)}
                            >
                              <Edit className="w-4 h-4 ml-1" />
                              ویرایش
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
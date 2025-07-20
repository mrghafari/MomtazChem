import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, TrendingDown } from 'lucide-react';

interface LowStockProduct {
  id: number;
  name: string;
  stockQuantity: number;
  minimumStock: number;
  availableQuantity: number;
  difference: number;
}

export default function LowStockAlert() {
  const { data: lowStockData, isLoading } = useQuery({
    queryKey: ['/api/inventory/low-stock'],
    refetchInterval: 60000, // تحديث كل دقيقة
  });

  const lowStockProducts: LowStockProduct[] = lowStockData?.products || [];
  const totalLowStockItems = lowStockProducts.length;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            بررسی موجودی کم...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          هشدار موجودی کم
          <Badge variant={totalLowStockItems > 0 ? "destructive" : "secondary"}>
            {totalLowStockItems} کالا
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalLowStockItems === 0 ? (
          <Alert className="border-green-200 bg-green-50">
            <Package className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-700">
              همه کالاها در سطح مناسب موجودی قرار دارند
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>{totalLowStockItems}</strong> کالا زیر حد مینیمم موجودی قرار دارند
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-red-500" />
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        موجودی فعلی: <span className="font-medium">{product.stockQuantity}</span> |
                        حد مینیمم: <span className="font-medium">{product.minimumStock}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <Badge variant="destructive">
                      کمبود {Math.abs(product.difference)} واحد
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Package, 
  Hash, 
  Calendar, 
  FileText, 
  Search,
  Eye,
  RefreshCw
} from 'lucide-react';

interface BatchDetails {
  batchNumber: string;
  stock: number;
  createdAt: Date;
  notes?: string;
}

interface ProductInventory {
  productName: string;
  barcode: string;
  totalStock: number;
  batches: BatchDetails[];
}

export default function DetailedInventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);

  // Fetch detailed inventory with batch information
  const { data: inventoryData, isLoading, refetch } = useQuery({
    queryKey: ['/api/inventory/detailed-with-batches'],
    queryFn: async () => {
      const response = await apiRequest('/api/inventory/detailed-with-batches');
      return response.data || [];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch specific product batch details
  const { data: productBatchData, isLoading: productBatchLoading } = useQuery({
    queryKey: ['/api/inventory/product-batch-details', selectedBarcode],
    queryFn: async () => {
      if (!selectedBarcode) return null;
      const response = await apiRequest(`/api/inventory/product-batch-details/${selectedBarcode}`);
      return response.data || null;
    },
    enabled: !!selectedBarcode,
  });

  // Filter inventory based on search term
  const filteredInventory = inventoryData?.filter((item: ProductInventory) =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barcode.includes(searchTerm)
  ) || [];

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>در حال بارگذاری اطلاعات موجودی...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-6 h-6" />
            موجودی انبار با جزئیات بچ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">جستجو در محصولات</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="نام محصول یا بارکد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              بروزرسانی
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredInventory.length}
              </div>
              <div className="text-sm text-gray-600">کل محصولات</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredInventory.reduce((sum, item) => sum + item.totalStock, 0)}
              </div>
              <div className="text-sm text-gray-600">کل موجودی</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredInventory.reduce((sum, item) => sum + item.batches.length, 0)}
              </div>
              <div className="text-sm text-gray-600">کل بچ‌ها</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInventory.map((item: ProductInventory) => (
          <Card key={item.barcode} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.productName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{item.barcode}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {item.totalStock} واحد
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">جزئیات بچ:</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedBarcode(item.barcode)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    مشاهده جزئیات
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {item.batches.slice(0, 3).map((batch, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">بچ {batch.batchNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          {batch.stock} واحد
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(batch.createdAt)}
                      </span>
                    </div>
                  ))}
                  
                  {item.batches.length > 3 && (
                    <div className="text-center text-sm text-gray-500">
                      و {item.batches.length - 3} بچ دیگر...
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Product Batch Details Modal */}
      {selectedBarcode && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">جزئیات بچ محصول</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBarcode(null)}
              >
                ✕
              </Button>
            </div>

            {productBatchLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">در حال بارگذاری...</p>
              </div>
            ) : productBatchData ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800">{productBatchData.productName}</h4>
                  <p className="text-sm text-blue-600">بارکد: {productBatchData.barcode}</p>
                  <p className="text-sm text-blue-600">کل موجودی: {productBatchData.totalStock} واحد</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h5 className="font-medium">تمام بچ‌ها:</h5>
                  {productBatchData.batches.map((batch: BatchDetails, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">بچ {batch.batchNumber}</span>
                          <Badge variant="secondary">{batch.stock} واحد</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(batch.createdAt)}
                        </div>
                      </div>
                      {batch.notes && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4 mt-0.5" />
                          <span>{batch.notes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">اطلاعات بچ یافت نشد</p>
            )}
          </div>
        </Card>
      )}

      {/* No Results */}
      {filteredInventory.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center p-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">موجودی یافت نشد</h3>
            <p className="text-gray-600">
              {searchTerm ? 'هیچ محصولی با این جستجو یافت نشد' : 'هیچ محصولی در انبار موجود نیست'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
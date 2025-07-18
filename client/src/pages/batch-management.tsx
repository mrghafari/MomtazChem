import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Package, Calendar, Hash, Weight, DollarSign, TrendingDown, TrendingUp } from "lucide-react";

interface Batch {
  id: number;
  name: string;
  batch_number: string;
  stock_quantity: number;
  created_at: string;
  unit_price: number;
  net_weight: number;
  gross_weight: number;
}

interface BatchResponse {
  success: boolean;
  barcode: string;
  batches: Batch[];
  totalBatches: number;
  totalStock: number;
}

export default function BatchManagement() {
  const [searchBarcode, setSearchBarcode] = useState("");
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch batches for selected barcode
  const { data: batchData, isLoading } = useQuery<BatchResponse>({
    queryKey: ['batches', selectedBarcode],
    queryFn: async () => {
      if (!selectedBarcode) return null;
      const response = await fetch(`/api/batches/${selectedBarcode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }
      return response.json();
    },
    enabled: !!selectedBarcode,
  });

  // Fetch current selling batch
  const { data: currentBatch } = useQuery({
    queryKey: ['selling-batch', selectedBarcode],
    queryFn: async () => {
      if (!selectedBarcode) return null;
      const response = await fetch(`/api/selling-batch/${selectedBarcode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch current selling batch');
      }
      return response.json();
    },
    enabled: !!selectedBarcode,
  });

  const handleSearch = () => {
    if (searchBarcode.trim()) {
      setSelectedBarcode(searchBarcode.trim());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getBatchStatus = (batch: Batch, isCurrentSelling: boolean) => {
    if (batch.stock_quantity === 0) {
      return { text: 'تمام شده', color: 'bg-gray-500' };
    }
    if (isCurrentSelling) {
      return { text: 'در حال فروش', color: 'bg-green-500' };
    }
    return { text: 'در انتظار', color: 'bg-blue-500' };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مدیریت بچ‌ها (LIFO)</h1>
          <p className="text-gray-600 mt-1">مدیریت بچ‌های محصولات با سیستم LIFO</p>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <span className="text-sm">{user?.username}</span>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            جستجوی بچ‌ها
          </CardTitle>
          <CardDescription>
            بارکد محصول را وارد کنید تا تمام بچ‌های آن را مشاهده کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="barcode">بارکد محصول</Label>
              <Input
                id="barcode"
                value={searchBarcode}
                onChange={(e) => setSearchBarcode(e.target.value)}
                placeholder="مثال: 8649677123456"
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                جستجو
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Selling Batch */}
      {currentBatch?.success && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <TrendingUp className="w-5 h-5" />
              بچ فعال در حال فروش (LIFO)
            </CardTitle>
            <CardDescription className="text-green-700">
              این بچ در حال حاضر برای فروش انتخاب می‌شود
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm text-green-700">شماره بچ</p>
                  <p className="font-medium">{currentBatch.currentBatch.batchNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm text-green-700">موجودی</p>
                  <p className="font-medium">{currentBatch.currentBatch.stockQuantity} واحد</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm text-green-700">تاریخ تولید</p>
                  <p className="font-medium">{formatDate(currentBatch.currentBatch.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 text-white">فعال</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch Summary */}
      {batchData?.success && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">تعداد بچ‌ها</p>
                  <p className="text-2xl font-bold">{batchData.totalBatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">کل موجودی</p>
                  <p className="text-2xl font-bold">{batchData.totalStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">بارکد</p>
                  <p className="text-lg font-mono">{batchData.barcode}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">بچ‌های خالی</p>
                  <p className="text-2xl font-bold">
                    {batchData.batches.filter(b => b.stock_quantity === 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Batch List */}
      {batchData?.success && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              لیست بچ‌ها (مرتب شده بر اساس LIFO)
            </CardTitle>
            <CardDescription>
              بچ‌های جدیدتر در بالا قرار دارند و اول فروخته می‌شوند
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {batchData.batches.map((batch, index) => {
                const isCurrentSelling = currentBatch?.success && 
                  currentBatch.currentBatch.batchId === batch.id;
                const status = getBatchStatus(batch, isCurrentSelling);
                
                return (
                  <div key={batch.id} className={`p-4 rounded-lg border-2 ${
                    isCurrentSelling 
                      ? 'border-green-300 bg-green-50' 
                      : batch.stock_quantity === 0 
                        ? 'border-gray-300 bg-gray-50' 
                        : 'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <Badge className={`${status.color} text-white`}>
                            {status.text}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium">{batch.name}</p>
                          <p className="text-sm text-gray-600">بچ: {batch.batch_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">موجودی</p>
                          <p className="font-bold">{batch.stock_quantity}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">قیمت</p>
                          <p className="font-medium">{batch.unit_price?.toLocaleString()} IQD</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">وزن خالص</p>
                          <p className="font-medium">{batch.net_weight} kg</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">تاریخ تولید</p>
                          <p className="font-medium">{formatDate(batch.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">در حال بارگذاری اطلاعات بچ‌ها...</p>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {selectedBarcode && batchData && !batchData.success && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">بچی یافت نشد</h3>
            <p className="text-gray-600">
              برای بارکد {selectedBarcode} هیچ بچی در سیستم ثبت نشده است
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
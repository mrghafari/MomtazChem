import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Package2, Clock, ArrowRight, TrendingUp, Layers } from "lucide-react";
// Import { Skeleton } from "@/components/ui/skeleton";

interface FIFOBatchDisplayProps {
  productName: string;
  className?: string;
  showDetails?: boolean;
}

interface BatchInfo {
  totalStock: number;
  batchCount: number;
  oldestBatch: any;
  newestBatch: any;
  nextToSell: any;
  allBatches: any[];
}

export function FIFOBatchDisplay({ productName, className = "", showDetails = false }: FIFOBatchDisplayProps) {
  const [showBatchDialog, setShowBatchDialog] = useState(false);

  // Fetch FIFO batch information
  const { data: batchData, isLoading, error } = useQuery({
    queryKey: [`/api/products/${encodeURIComponent(productName)}/batches/fifo`],
    enabled: !!productName
  });

  const batchInfo: BatchInfo = (batchData as any)?.data || {
    totalStock: 0,
    batchCount: 0,
    oldestBatch: null,
    newestBatch: null,
    nextToSell: null,
    allBatches: []
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'تاریخ نامشخص';
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-28"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !batchInfo) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <div className="flex items-center gap-1">
          <Package2 className="w-4 h-4" />
          <span>اطلاعات بچ در دسترس نیست</span>
        </div>
      </div>
    );
  }

  // No batches available
  if (batchInfo.batchCount === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <div className="flex items-center gap-1">
          <Package2 className="w-4 h-4" />
          <span>بدون بچ موجود</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* FIFO Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              فروش FIFO - {batchInfo.batchCount} بچ
            </span>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
            {batchInfo.totalStock} واحد
          </Badge>
        </div>

        {/* Next to sell batch */}
        {batchInfo.nextToSell && (
          <div className="bg-white rounded p-2 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-green-700">
                    اولین مورد برای فروش
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  بچ: {batchInfo.nextToSell.batchNumber || 'بدون شماره'}
                </div>
                <div className="text-xs text-gray-600">
                  موجودی: {batchInfo.nextToSell.stockQuantity} واحد
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  تاریخ تولید
                </div>
                <div className="text-xs font-medium text-gray-700">
                  {formatDate(batchInfo.nextToSell.createdAt)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show all batches button */}
        {batchInfo.batchCount > 1 && showDetails && (
          <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
              >
                مشاهده تمام بچ‌ها ({batchInfo.batchCount})
                <ArrowRight className="w-3 h-3 mr-1" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-green-600" />
                  بچ‌های محصول {productName}
                  <Badge variant="outline" className="mr-auto">
                    {batchInfo.batchCount} بچ موجود
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {batchInfo.allBatches.map((batch, index) => (
                  <Card key={batch.id} className={`
                    ${index === 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}
                  `}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          بچ: {batch.batchNumber || 'بدون شماره'}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              اولین مورد
                            </Badge>
                          )}
                          <Badge variant="outline">
                            ردیف {index + 1}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">موجودی</div>
                          <div className="font-medium">{batch.stockQuantity} واحد</div>
                        </div>
                        <div>
                          <div className="text-gray-600">قیمت واحد</div>
                          <div className="font-medium">{batch.unitPrice} {batch.currency}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">تاریخ تولید</div>
                          <div className="font-medium">{formatDate(batch.createdAt)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">وزن</div>
                          <div className="font-medium">
                            {batch.weight || 'نامشخص'} {batch.weightUnit || ''}
                          </div>
                        </div>
                      </div>
                      
                      {batch.expiryDate && (
                        <div className="mt-2 flex items-center gap-1 text-orange-600">
                          <Calendar className="w-3 h-3" />
                          <span className="text-xs">
                            انقضا: {formatDate(batch.expiryDate)}
                          </span>
                        </div>
                      )}
                      
                      {batch.willSellNext && (
                        <div className="mt-2 text-xs text-green-600 font-medium">
                          {batch.willSellNext}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* FIFO Explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    سیستم فروش FIFO (اول وارد، اول خارج)
                  </span>
                </div>
                <p className="text-xs text-blue-700">
                  در این سیستم، قدیمی‌ترین بچ‌ها ابتدا فروخته می‌شوند. این روش برای محصولات شیمیایی با تاریخ انقضا مناسب است.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export default FIFOBatchDisplay;
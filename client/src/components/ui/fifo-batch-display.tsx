import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Package2, Clock, ArrowLeft, TrendingUp, Layers, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FIFOBatchDisplayProps {
  productName: string;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

interface BatchInfo {
  totalStock: string;
  batchCount: number;
  oldestBatch: any;
  newestBatch: any;
  nextToSell: any;
  allBatches: any[];
}

export default function FIFOBatchDisplay({ 
  productName, 
  className = "", 
  showDetails = false,
  compact = false 
}: FIFOBatchDisplayProps) {
  const { t } = useLanguage();
  
  // Fetch FIFO batch data
  const { data: batchData, isLoading, error } = useQuery({
    queryKey: [`/api/products/${encodeURIComponent(productName)}/batches/display`],
    enabled: !!productName
  });

  const batchInfo: BatchInfo = (batchData as any)?.data || {
    totalStock: "0",
    batchCount: 0,
    oldestBatch: null,
    newestBatch: null,
    nextToSell: null,
    allBatches: []
  };

  // Format date for Gregorian display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-green-200 rounded w-24 mb-2"></div>
          <div className="h-3 bg-green-200 rounded w-32 mb-1"></div>
          <div className="h-3 bg-green-200 rounded w-28"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !batchInfo.oldestBatch) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <span>{t.productManagement.batchInfoNotAvailable}</span>
      </div>
    );
  }

  const oldestBatch = batchInfo.nextToSell || batchInfo.oldestBatch;

  // Compact display
  if (compact) {
    return (
      <div className={`text-sm ${className}`}>
        <div className="flex items-center gap-2 text-green-700">
          <Package2 className="h-3 w-3" />
          <span className="font-medium">{oldestBatch.batchNumber}</span>
          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
            {oldestBatch.stockQuantity} واحد
          </Badge>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          اولین مورد برای فروش
        </div>
      </div>
    );
  }

  // Full display
  return (
    <div className={`border border-green-200 rounded-lg p-3 bg-green-50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-green-600" />
          <h4 className="font-semibold text-green-800">بچ اولویت فروش</h4>
        </div>
        <Badge className="bg-green-600 hover:bg-green-700">
          FIFO
        </Badge>
      </div>

      {/* Oldest Batch Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-700">شماره بچ:</span>
          <span className="text-sm font-bold text-green-800">{oldestBatch.batchNumber}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-700">موجودی:</span>
          <Badge variant="outline" className="text-green-600 border-green-300">
            {oldestBatch.stockQuantity} واحد
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-700">تاریخ تولید:</span>
          <span className="text-sm text-green-600 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(oldestBatch.createdAt)}
          </span>
        </div>
        
        <div className="bg-green-100 p-2 rounded text-center">
          <span className="text-xs font-medium text-green-700">
            {oldestBatch.displayText || "اولین مورد برای فروش"}
          </span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="text-center">
          <div className="font-semibold text-green-800">{batchInfo.batchCount}</div>
          <div className="text-green-600">کل بچ‌ها</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-green-800">{batchInfo.totalStock}</div>
          <div className="text-green-600">کل موجودی</div>
        </div>
      </div>

      {/* Details Dialog */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full text-green-700 border-green-300 hover:bg-green-100">
                <Sparkles className="h-3 w-3 mr-2" />
                مشاهده جزئیات همه بچ‌ها
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" dir="rtl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package2 className="h-5 w-5 text-green-600" />
                  جزئیات بچ‌های {productName}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">{batchInfo.batchCount}</div>
                    <div className="text-sm text-green-600">تعداد بچ</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">{batchInfo.totalStock}</div>
                    <div className="text-sm text-green-600">کل موجودی</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">FIFO</div>
                    <div className="text-sm text-green-600">روش فروش</div>
                  </div>
                </div>

                {/* All Batches */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {batchInfo.allBatches.map((batch: any, index: number) => (
                    <div 
                      key={batch.id} 
                      className={`p-3 rounded-lg border ${
                        batch.isOldest 
                          ? 'bg-green-100 border-green-300' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={
                              batch.isOldest 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-gray-600 hover:bg-gray-700'
                            }
                          >
                            ردیف {batch.fifoOrder}
                          </Badge>
                          <span className="font-medium">{batch.batchNumber}</span>
                        </div>
                        {batch.isOldest && (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            اولویت فروش
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">موجودی: </span>
                          <span className="font-medium">{batch.stockQuantity} واحد</span>
                        </div>
                        <div>
                          <span className="text-gray-600">تاریخ: </span>
                          <span className="font-medium">{formatDate(batch.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-600">
                        {batch.displayText}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
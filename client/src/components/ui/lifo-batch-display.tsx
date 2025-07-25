/**
 * LIFO Batch Display Component
 * Shows newest batch information first - complementary to FIFO system
 * Used for displaying latest batch info on product cards
 */
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Package2, Clock, ArrowLeft, TrendingUp, Layers, Sparkles } from "lucide-react";

interface LIFOBatchDisplayProps {
  productName: string;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

interface BatchInfo {
  totalStock: string;
  batchCount: number;
  newestBatch: any;
  oldestBatch: any;
  nextToShow: any;
  allBatches: any[];
}

export default function LIFOBatchDisplay({ 
  productName, 
  className = "", 
  showDetails = false,
  compact = false 
}: LIFOBatchDisplayProps) {
  
  // Fetch LIFO batch data
  const { data: batchData, isLoading, error } = useQuery({
    queryKey: [`/api/products/${encodeURIComponent(productName)}/batches/lifo`],
    enabled: !!productName
  });

  const batchInfo: BatchInfo = (batchData as any)?.data || {
    totalStock: "0",
    batchCount: 0,
    newestBatch: null,
    oldestBatch: null,
    nextToShow: null,
    allBatches: []
  };

  // Format date for Persian display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-orange-200 rounded w-24 mb-2"></div>
          <div className="h-3 bg-orange-200 rounded w-32 mb-1"></div>
          <div className="h-3 bg-orange-200 rounded w-28"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !batchInfo.newestBatch) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <span>اطلاعات بچ در دسترس نیست</span>
      </div>
    );
  }

  const newestBatch = batchInfo.newestBatch;

  // Compact display for product cards
  if (compact) {
    return (
      <div className={`bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">جدیدترین بچ</span>
          </div>
          <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
            {newestBatch.displayText}
          </Badge>
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">بچ:</span>
            <span className="font-mono text-orange-700">{newestBatch.batchNumber || 'بدون شماره'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">موجودی:</span>
            <span className="font-semibold text-orange-800">{newestBatch.stockQuantity} واحد</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">تاریخ تولید:</span>
            <span className="text-xs text-gray-700">{formatDate(newestBatch.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Full display with details
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main newest batch card */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-orange-800">جدیدترین بچ با موجودی</h4>
          </div>
          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
            LIFO #{newestBatch.lifoOrder}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package2 className="w-4 h-4 text-orange-600" />
              <span className="text-gray-600">شماره بچ:</span>
              <span className="font-mono bg-orange-100 px-2 py-1 rounded text-orange-800">
                {newestBatch.batchNumber || 'بدون شماره'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="text-gray-600">موجودی:</span>
              <span className="font-bold text-orange-800">{newestBatch.stockQuantity} واحد</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <span className="text-gray-600">تاریخ تولید:</span>
              <span className="text-gray-700">{formatDate(newestBatch.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-gray-600">قیمت واحد:</span>
              <span className="text-gray-700">{newestBatch.unitPrice} {newestBatch.currency}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 bg-orange-100 rounded-md">
          <p className="text-sm text-orange-800 text-center font-medium">
            {newestBatch.displayText}
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Layers className="w-4 h-4" />
          <span>کل بچ‌ها: {batchInfo.batchCount}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Package2 className="w-4 h-4" />
          <span>مجموع موجودی: {batchInfo.totalStock} واحد</span>
        </div>
      </div>

      {/* Details dialog */}
      {showDetails && batchInfo.allBatches.length > 1 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <ArrowLeft className="w-4 h-4 ml-2" />
              مشاهده همه بچ‌ها (LIFO)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-600" />
                همه بچ‌های {productName} (LIFO - جدید به قدیم)
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {batchInfo.allBatches.map((batch, index) => (
                <div 
                  key={batch.id}
                  className={`p-4 rounded-lg border-2 ${
                    batch.isNewest 
                      ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50' 
                      : batch.isOldest
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-orange-200 bg-orange-25'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold flex items-center gap-2">
                      <Package2 className="w-4 h-4" />
                      بچ: {batch.batchNumber || `بچ ${index + 1}`}
                    </h5>
                    <Badge 
                      variant={batch.isNewest ? "default" : "outline"}
                      className={batch.isNewest ? "bg-orange-500" : ""}
                    >
                      ردیف {batch.lifoOrder}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">موجودی: </span>
                      <span className="font-semibold">{batch.stockQuantity} واحد</span>
                    </div>
                    <div>
                      <span className="text-gray-600">قیمت: </span>
                      <span>{batch.unitPrice} {batch.currency}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">تاریخ: </span>
                      <span>{formatDate(batch.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className={`p-2 rounded text-center text-xs font-medium ${
                    batch.isNewest 
                      ? 'bg-orange-500 text-white' 
                      : batch.isOldest
                      ? 'bg-gray-400 text-white'
                      : 'bg-orange-200 text-orange-800'
                  }`}>
                    {batch.displayText}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
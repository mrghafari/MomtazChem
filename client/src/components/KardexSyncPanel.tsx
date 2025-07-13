import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, 
  Database, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  Eye
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SyncStatus {
  kardexCount: number;
  shopCount: number;
  inSync: boolean;
  missingInShop: string[];
  extraInShop: string[];
}

interface SyncResult {
  added: number;
  updated: number;
  removed: number;
  unchanged: number;
  deletedFromShop?: number;
  addedToShop?: number;
  kardexProducts?: number;
}

export function KardexSyncPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  // Query for sync status
  const { data: syncStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/kardex-sync/status'],
    queryFn: () => apiRequest<{ data: SyncStatus }>('/api/kardex-sync/status'),
    refetchInterval: 30000, // بررسی هر 30 ثانیه
  });

  // Smart sync mutation
  const smartSyncMutation = useMutation({
    mutationFn: () => apiRequest<{ data: SyncResult }>('/api/kardex-sync/smart-sync', {
      method: 'POST'
    }),
    onSuccess: (data) => {
      toast({
        title: "همگام‌سازی هوشمند انجام شد",
        description: `${data.data.added} اضافه، ${data.data.updated} بروزرسانی، ${data.data.removed} حذف شد`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/kardex-sync/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: () => {
      toast({
        title: "خطا در همگام‌سازی",
        description: "لطفاً مجدداً تلاش کنید",
        variant: "destructive",
      });
    }
  });

  // Full rebuild mutation
  const fullRebuildMutation = useMutation({
    mutationFn: () => apiRequest<{ data: SyncResult }>('/api/kardex-sync/full-rebuild', {
      method: 'POST'
    }),
    onSuccess: (data) => {
      toast({
        title: "بازسازی کامل انجام شد",
        description: `${data.data.addedToShop} محصول از کاردکس به فروشگاه کپی شد`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/kardex-sync/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
    onError: () => {
      toast({
        title: "خطا در بازسازی",
        description: "لطفاً مجدداً تلاش کنید",
        variant: "destructive",
      });
    }
  });

  const status = syncStatus?.data;
  const isInSync = status?.inSync;
  const hasMissingProducts = status?.missingInShop?.length > 0;
  const hasExtraProducts = status?.extraInShop?.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <CardTitle>همگام‌سازی کاردکس ↔ فروشگاه</CardTitle>
            {isInSync ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                همگام
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                نیاز به همگام‌سازی
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Eye className="h-4 w-4" />
            {isExpanded ? 'بستن' : 'جزئیات'}
          </Button>
        </div>
        <CardDescription>
          کاردکس منبع اصلی است - فروشگاه باید همیشه کپی کاردکس باشد
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium">کاردکس</span>
            <span className="text-lg font-bold text-blue-600">
              {statusLoading ? "..." : status?.kardexCount || 0}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm font-medium">فروشگاه</span>
            <span className="text-lg font-bold text-green-600">
              {statusLoading ? "..." : status?.shopCount || 0}
            </span>
          </div>
        </div>

        {/* Sync Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => smartSyncMutation.mutate()}
            disabled={smartSyncMutation.isPending || statusLoading}
            className="flex-1"
            variant={isInSync ? "secondary" : "default"}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {smartSyncMutation.isPending ? "در حال همگام‌سازی..." : "همگام‌سازی هوشمند"}
          </Button>
          
          <Button
            onClick={() => fullRebuildMutation.mutate()}
            disabled={fullRebuildMutation.isPending || statusLoading}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {fullRebuildMutation.isPending ? "در حال بازسازی..." : "بازسازی کامل"}
          </Button>
        </div>

        {/* Detailed Status (Expandable) */}
        {isExpanded && status && (
          <>
            <Separator />
            <div className="space-y-3">
              {hasMissingProducts && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">
                    محصولات موجود در کاردکس ولی غایب در فروشگاه ({status.missingInShop.length})
                  </h4>
                  <div className="space-y-1">
                    {status.missingInShop.slice(0, 3).map((name, index) => (
                      <div key={index} className="text-sm text-orange-700 flex items-center">
                        <ArrowRight className="h-3 w-3 mr-1" />
                        {name}
                      </div>
                    ))}
                    {status.missingInShop.length > 3 && (
                      <div className="text-sm text-orange-600 font-medium">
                        و {status.missingInShop.length - 3} محصول دیگر...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasExtraProducts && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">
                    محصولات اضافی در فروشگاه که در کاردکس نیستند ({status.extraInShop.length})
                  </h4>
                  <div className="space-y-1">
                    {status.extraInShop.slice(0, 3).map((name, index) => (
                      <div key={index} className="text-sm text-red-700 flex items-center">
                        <ArrowRight className="h-3 w-3 mr-1" />
                        {name}
                      </div>
                    ))}
                    {status.extraInShop.length > 3 && (
                      <div className="text-sm text-red-600 font-medium">
                        و {status.extraInShop.length - 3} محصول دیگر...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isInSync && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center text-green-800">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="font-medium">همه چیز همگام است!</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    فروشگاه کاملاً با کاردکس هماهنگ است
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <strong>همگام‌سازی هوشمند:</strong> فقط تغییرات را اعمال می‌کند<br />
          <strong>بازسازی کامل:</strong> فروشگاه را پاک کرده و از کاردکس بازسازی می‌کند
        </div>
      </CardContent>
    </Card>
  );
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap, RefreshCw, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface SyncStatus {
  kardexCount: number;
  shopCount: number;
  inSync: boolean;
  extraProducts: number;
  missingProducts: number;
}

interface SyncResult {
  added: number;
  updated: number;
  removed: number;
  addedToShop?: number;
}

export function KardexSyncPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get refresh interval from global settings
  const getRefreshInterval = () => {
    const globalSettings = localStorage.getItem('global-refresh-settings');
    if (globalSettings) {
      const settings = JSON.parse(globalSettings);
      const inventorySettings = settings.departments.inventory;
      
      if (inventorySettings?.autoRefresh) {
        const refreshInterval = settings.syncEnabled 
          ? settings.globalInterval 
          : inventorySettings.interval;
        return refreshInterval * 1000; // Convert seconds to milliseconds
      }
    }
    return 300000; // Default 5 minutes if no settings found
  };

  // Get quick refresh delay from global settings (1/10th of main interval)
  const getQuickRefreshDelay = () => {
    const baseInterval = getRefreshInterval();
    return Math.min(baseInterval / 10, 1000); // Maximum 1 second delay
  };

  // Query for sync status
  const { data: syncStatus, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['/api/kardex-sync/status'],
    queryFn: () => apiRequest<{ data: SyncStatus }>('/api/kardex-sync/status'),
    refetchInterval: getRefreshInterval(),
    retry: false, // Don't retry on auth errors
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
      // فوری بروزرسانی کنید تا اعداد جدید نمایش داده شود
      queryClient.invalidateQueries({ queryKey: ['/api/kardex-sync/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      // رفرش فوری وضعیت بر اساس تنظیمات گلوبال
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/kardex-sync/status'] });
      }, getQuickRefreshDelay());
      // Immediate refresh to show changes
      window.location.reload();
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
      // فوری بروزرسانی کنید تا اعداد جدید نمایش داده شود
      queryClient.invalidateQueries({ queryKey: ['/api/kardex-sync/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      // رفرش فوری وضعیت بر اساس تنظیمات گلوبال
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/kardex-sync/status'] });
      }, getQuickRefreshDelay());
      // Immediate refresh to show changes
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "خطا در بازسازی",
        description: "لطفاً مجدداً تلاش کنید",
        variant: "destructive",
      });
    }
  });

  // Cleanup extra products mutation
  const cleanupMutation = useMutation({
    mutationFn: () => apiRequest<{ data: { deletedCount: number; deletedProducts: string[] } }>('/api/kardex-sync/cleanup-extra', {
      method: 'POST'
    }),
    onSuccess: (data) => {
      toast({
        title: "حذف محصولات اضافی انجام شد",
        description: `${data.data.deletedCount} محصول از فروشگاه حذف شد`,
      });
      // فوری بروزرسانی کنید تا اعداد جدید نمایش داده شود
      queryClient.invalidateQueries({ queryKey: ['/api/kardex-sync/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      // رفرش فوری وضعیت بر اساس تنظیمات گلوبال
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/kardex-sync/status'] });
      }, getQuickRefreshDelay());
      // Immediate refresh to show changes
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "خطا در حذف محصولات اضافی",
        description: "لطفاً مجدداً تلاش کنید",
        variant: "destructive",
      });
    }
  });

  // Cleanup duplicate SKUs mutation
  const cleanupDuplicatesMutation = useMutation({
    mutationFn: () => apiRequest<{ data: { deletedCount: number; duplicates: Array<{sku: string; deletedProduct: string; keptProduct: string}> } }>('/api/kardex-sync/cleanup-duplicates', {
      method: 'POST'
    }),
    onSuccess: (data) => {
      toast({
        title: "حذف SKU تکراری انجام شد",
        description: `${data.data.deletedCount} محصول با SKU تکراری حذف شد`,
      });
      console.log('🔍 [SKU-CLEANUP] جزئیات:', data.data.duplicates);
      // فوری بروزرسانی کنید تا اعداد جدید نمایش داده شود
      queryClient.invalidateQueries({ queryKey: ['/api/kardex-sync/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      // رفرش فوری وضعیت بر اساس تنظیمات گلوبال
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/kardex-sync/status'] });
      }, getQuickRefreshDelay());
      // Immediate refresh to show changes
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "خطا در حذف محصولات تکراری",
        description: "لطفاً مجدداً تلاش کنید",
        variant: "destructive",
      });
    }
  });

  if (statusLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            بررسی وضعیت همگام‌سازی...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (statusError || !syncStatus?.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">خطا در بارگیری وضعیت همگام‌سازی</CardTitle>
          <CardDescription>
            امکان اتصال به سرور همگام‌سازی وجود ندارد. لطفاً وارد سیستم مدیریت شوید.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { kardexCount, shopCount, inSync, extraProducts, missingProducts } = syncStatus.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          وضعیت همگام‌سازی کاردکس و فروشگاه
        </CardTitle>
        <CardDescription>
          مدیریت همگام‌سازی محصولات بین سیستم کاردکس و فروشگاه آنلاین
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{kardexCount}</div>
            <div className="text-sm text-gray-600">کاردکس</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{shopCount}</div>
            <div className="text-sm text-gray-600">فروشگاه</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className={`text-2xl font-bold ${inSync ? 'text-green-600' : 'text-red-600'}`}>
              {inSync ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600">همگام‌سازی</div>
          </div>
        </div>

        {/* Sync Status */}
        {!inSync && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800">
              <strong>نیاز به همگام‌سازی:</strong>
              {missingProducts > 0 && <div>• {missingProducts} محصول در فروشگاه موجود نیست</div>}
              {extraProducts > 0 && <div>• {extraProducts} محصول اضافی در فروشگاه وجود دارد</div>}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={() => smartSyncMutation.mutate()}
            disabled={smartSyncMutation.isPending}
            className="w-full"
          >
            {smartSyncMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                در حال همگام‌سازی...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 ml-2" />
                همگام‌سازی هوشمند
              </>
            )}
          </Button>

          <Button
            onClick={() => fullRebuildMutation.mutate()}
            disabled={fullRebuildMutation.isPending}
            variant="outline"
            className="w-full"
          >
            {fullRebuildMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                در حال بازسازی...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 ml-2" />
                بازسازی کامل
              </>
            )}
          </Button>

          {extraProducts > 0 && (
            <Button
              onClick={() => cleanupMutation.mutate()}
              disabled={cleanupMutation.isPending}
              variant="destructive"
              className="w-full"
            >
              {cleanupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  در حال حذف...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف محصولات اضافی ({extraProducts})
                </>
              )}
            </Button>
          )}

          <Button
            onClick={() => cleanupDuplicatesMutation.mutate()}
            disabled={cleanupDuplicatesMutation.isPending}
            variant="outline"
            className="w-full"
          >
            {cleanupDuplicatesMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                در حال حذف تکراری...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 ml-2" />
                حذف SKU تکراری
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <strong>راهنما:</strong>
          <ul className="mt-1 space-y-1">
            <li>• <strong>همگام‌سازی هوشمند:</strong> فقط تغییرات ضروری را اعمال می‌کند</li>
            <li>• <strong>بازسازی کامل:</strong> تمام محصولات کاردکس را به فروشگاه کپی می‌کند</li>
            <li>• <strong>حذف محصولات اضافی:</strong> محصولاتی که در کاردکس نیستند را از فروشگاه حذف می‌کند</li>
            <li>• <strong>حذف SKU تکراری:</strong> محصولات با SKU یکسان را شناسایی و حذف می‌کند</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
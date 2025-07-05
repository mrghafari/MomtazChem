import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Clock, Play, Pause, Settings } from "lucide-react";
import { useGlobalRefresh } from "@/hooks/useGlobalRefresh";

interface GlobalRefreshControlProps {
  pageName: string;
  onRefresh: () => void;
  isLoading?: boolean;
  className?: string;
}

export default function GlobalRefreshControl({ 
  pageName, 
  onRefresh, 
  isLoading = false,
  className = ""
}: GlobalRefreshControlProps) {
  const {
    isActive,
    timeLeft,
    interval,
    toggleAutoRefresh,
    manualRefresh,
    formatTime,
    syncEnabled
  } = useGlobalRefresh(pageName, onRefresh);

  return (
    <Card className={`border-blue-200 bg-blue-50/30 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          کنترل به‌روزرسانی {pageName}
          {syncEnabled && (
            <Badge variant="outline" className="text-xs">
              متمرکز
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Manual Refresh Button */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={manualRefresh}
            disabled={isLoading}
            size="sm"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            به‌روزرسانی دستی
          </Button>
          
          <Button
            onClick={toggleAutoRefresh}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="px-3"
          >
            {isActive ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          {isActive && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(timeLeft)}
            </Badge>
          )}
        </div>

        {/* Status Info */}
        <div className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="font-medium">وضعیت:</span>
            {isActive ? 'فعال' : 'غیرفعال'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            فاصله زمانی: {Math.floor(interval / 60)} دقیقه
            {syncEnabled && <span className="mr-2">• مدیریت متمرکز</span>}
          </div>
          {isActive && (
            <div className="text-xs text-gray-500 mt-1">
              به‌روزرسانی بعدی تا {formatTime(timeLeft)} دیگر
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
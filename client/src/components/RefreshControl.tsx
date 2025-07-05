import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, Clock, Play, Pause, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RefreshControlProps {
  onRefresh: () => void;
  isLoading?: boolean;
  departmentName: string;
}

const REFRESH_INTERVALS = [
  { value: 30, label: "30 ثانیه" },
  { value: 60, label: "1 دقیقه" },
  { value: 120, label: "2 دقیقه" },
  { value: 300, label: "5 دقیقه" },
  { value: 600, label: "10 دقیقه" },
  { value: 1800, label: "30 دقیقه" },
  { value: 3600, label: "1 ساعت" }
];

export default function RefreshControl({ onRefresh, isLoading = false, departmentName }: RefreshControlProps) {
  const { toast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(false); // Disabled by default
  const [refreshInterval, setRefreshInterval] = useState(600); // 10 minutes default
  const [timeLeft, setTimeLeft] = useState(refreshInterval);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Load saved settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(`refresh-settings-${departmentName}`);
    if (savedSettings) {
      const { autoRefresh: savedAutoRefresh, refreshInterval: savedInterval } = JSON.parse(savedSettings);
      setAutoRefresh(savedAutoRefresh);
      setRefreshInterval(savedInterval);
      setTimeLeft(savedInterval);
    }
  }, [departmentName]);

  // Save settings to localStorage
  useEffect(() => {
    const settings = { autoRefresh, refreshInterval };
    localStorage.setItem(`refresh-settings-${departmentName}`, JSON.stringify(settings));
  }, [autoRefresh, refreshInterval, departmentName]);

  // Auto refresh logic
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const id = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            onRefresh();
            toast({
              title: "صفحه به‌روزرسانی شد",
              description: `داده‌های ${departmentName} به‌طور خودکار به‌روزرسانی شدند`,
            });
            return refreshInterval;
          }
          return prev - 1;
        });
      }, 1000);
      
      setIntervalId(id);
      return () => clearInterval(id);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      setTimeLeft(refreshInterval);
    }
  }, [autoRefresh, refreshInterval, onRefresh, departmentName, toast]);

  // Reset timer when interval changes
  useEffect(() => {
    setTimeLeft(refreshInterval);
  }, [refreshInterval]);

  const handleManualRefresh = () => {
    onRefresh();
    setTimeLeft(refreshInterval);
    toast({
      title: "صفحه به‌روزرسانی شد",
      description: `داده‌های ${departmentName} دستی به‌روزرسانی شدند`,
    });
  };

  const handleIntervalChange = (value: string) => {
    const newInterval = parseInt(value);
    setRefreshInterval(newInterval);
    setTimeLeft(newInterval);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          کنترل به‌روزرسانی {departmentName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Manual Refresh Button */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleManualRefresh}
            disabled={isLoading}
            size="sm"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            به‌روزرسانی دستی
          </Button>
          
          {autoRefresh && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(timeLeft)}
            </Badge>
          )}
        </div>

        {/* Auto Refresh Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-refresh" className="flex items-center gap-2">
            {autoRefresh ? (
              <Play className="h-4 w-4 text-green-600" />
            ) : (
              <Pause className="h-4 w-4 text-gray-600" />
            )}
            به‌روزرسانی خودکار
          </Label>
          <Switch 
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
          />
        </div>

        {/* Refresh Interval Selector */}
        {autoRefresh && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">فاصله زمانی به‌روزرسانی</Label>
            <Select value={refreshInterval.toString()} onValueChange={handleIntervalChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFRESH_INTERVALS.map((interval) => (
                  <SelectItem key={interval.value} value={interval.value.toString()}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Status Info */}
        <div className="text-sm text-gray-600 bg-white p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="font-medium">وضعیت:</span>
            {autoRefresh ? 'فعال' : 'غیرفعال'}
          </div>
          {autoRefresh && (
            <div className="text-xs text-gray-500">
              به‌روزرسانی بعدی تا {formatTime(timeLeft)} دیگر
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
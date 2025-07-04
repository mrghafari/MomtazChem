import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, 
  Clock, 
  Play, 
  Pause, 
  Settings, 
  Zap,
  DollarSign,
  Package,
  Truck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const REFRESH_INTERVALS = [
  { value: 10, label: "10 ثانیه" },
  { value: 30, label: "30 ثانیه" },
  { value: 60, label: "1 دقیقه" },
  { value: 120, label: "2 دقیقه" },
  { value: 300, label: "5 دقیقه" },
  { value: 600, label: "10 دقیقه" },
  { value: 1800, label: "30 دقیقه" },
  { value: 3600, label: "1 ساعت" }
];

const DEPARTMENTS = [
  { 
    key: 'finance', 
    name: 'واحد مالی', 
    icon: DollarSign, 
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  { 
    key: 'warehouse', 
    name: 'واحد انبار', 
    icon: Package, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  { 
    key: 'logistics', 
    name: 'واحد لجستیک', 
    icon: Truck, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
];

export default function GlobalRefreshSettings() {
  const { toast } = useToast();
  const [globalSettings, setGlobalSettings] = useState({
    syncEnabled: true,
    globalInterval: 30,
    departments: {
      finance: { autoRefresh: true, interval: 30 },
      warehouse: { autoRefresh: true, interval: 30 },
      logistics: { autoRefresh: true, interval: 30 }
    }
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('global-refresh-settings');
    if (savedSettings) {
      setGlobalSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('global-refresh-settings', JSON.stringify(globalSettings));
    
    // Also update individual department settings
    DEPARTMENTS.forEach(dept => {
      const deptSettings = {
        autoRefresh: globalSettings.departments[dept.key as keyof typeof globalSettings.departments].autoRefresh,
        refreshInterval: globalSettings.syncEnabled 
          ? globalSettings.globalInterval 
          : globalSettings.departments[dept.key as keyof typeof globalSettings.departments].interval
      };
      localStorage.setItem(`refresh-settings-${dept.name}`, JSON.stringify(deptSettings));
    });
  }, [globalSettings]);

  const handleGlobalIntervalChange = (value: string) => {
    const newInterval = parseInt(value);
    setGlobalSettings(prev => ({
      ...prev,
      globalInterval: newInterval,
      departments: globalSettings.syncEnabled ? {
        finance: { ...prev.departments.finance, interval: newInterval },
        warehouse: { ...prev.departments.warehouse, interval: newInterval },
        logistics: { ...prev.departments.logistics, interval: newInterval }
      } : prev.departments
    }));
    
    toast({
      title: "تنظیمات ذخیره شد",
      description: `فاصله زمانی جدید: ${REFRESH_INTERVALS.find(i => i.value === newInterval)?.label}`,
    });
  };

  const handleSyncToggle = (enabled: boolean) => {
    setGlobalSettings(prev => ({
      ...prev,
      syncEnabled: enabled,
      departments: enabled ? {
        finance: { ...prev.departments.finance, interval: prev.globalInterval },
        warehouse: { ...prev.departments.warehouse, interval: prev.globalInterval },
        logistics: { ...prev.departments.logistics, interval: prev.globalInterval }
      } : prev.departments
    }));

    toast({
      title: enabled ? "همگام‌سازی فعال شد" : "همگام‌سازی غیرفعال شد",
      description: enabled ? "همه واحدها با یک فاصله زمانی عمل می‌کنند" : "هر واحد تنظیمات جداگانه‌ای دارد",
    });
  };

  const handleDepartmentAutoRefreshToggle = (deptKey: string, enabled: boolean) => {
    setGlobalSettings(prev => ({
      ...prev,
      departments: {
        ...prev.departments,
        [deptKey]: {
          ...prev.departments[deptKey as keyof typeof prev.departments],
          autoRefresh: enabled
        }
      }
    }));

    const dept = DEPARTMENTS.find(d => d.key === deptKey);
    toast({
      title: `${dept?.name}`,
      description: enabled ? "به‌روزرسانی خودکار فعال شد" : "به‌روزرسانی خودکار غیرفعال شد",
    });
  };

  const handleDepartmentIntervalChange = (deptKey: string, value: string) => {
    const newInterval = parseInt(value);
    setGlobalSettings(prev => ({
      ...prev,
      departments: {
        ...prev.departments,
        [deptKey]: {
          ...prev.departments[deptKey as keyof typeof prev.departments],
          interval: newInterval
        }
      }
    }));

    const dept = DEPARTMENTS.find(d => d.key === deptKey);
    toast({
      title: `${dept?.name}`,
      description: `فاصله زمانی جدید: ${REFRESH_INTERVALS.find(i => i.value === newInterval)?.label}`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div className="container mx-auto p-6 min-h-screen" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Zap className="h-8 w-8 text-purple-600" />
          کنترل مرکزی به‌روزرسانی
        </h1>
        <p className="text-gray-600">تنظیم زمان به‌روزرسانی برای همه واحدهای سازمان</p>
      </div>

      {/* Global Settings */}
      <Card className="mb-8 border-purple-200 bg-purple-50/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Settings className="h-6 w-6 text-purple-600" />
            تنظیمات کلی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sync Toggle */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-3">
              {globalSettings.syncEnabled ? (
                <Play className="h-5 w-5 text-green-600" />
              ) : (
                <Pause className="h-5 w-5 text-gray-600" />
              )}
              <div>
                <Label className="text-base font-medium">همگام‌سازی واحدها</Label>
                <p className="text-sm text-gray-600">
                  {globalSettings.syncEnabled 
                    ? "همه واحدها با یک فاصله زمانی به‌روزرسانی می‌شوند" 
                    : "هر واحد تنظیمات جداگانه‌ای دارد"}
                </p>
              </div>
            </div>
            <Switch 
              checked={globalSettings.syncEnabled}
              onCheckedChange={handleSyncToggle}
            />
          </div>

          {/* Global Interval */}
          {globalSettings.syncEnabled && (
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                فاصله زمانی کلی
              </Label>
              <Select 
                value={globalSettings.globalInterval.toString()} 
                onValueChange={handleGlobalIntervalChange}
              >
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

          {/* Current Status */}
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
            <Badge 
              variant="secondary" 
              className={`text-lg px-6 py-2 ${
                globalSettings.syncEnabled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {globalSettings.syncEnabled 
                ? `همگام‌سازی فعال - ${REFRESH_INTERVALS.find(i => i.value === globalSettings.globalInterval)?.label}`
                : 'تنظیمات جداگانه'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Department Settings */}
      <div className="grid gap-6 md:grid-cols-3">
        {DEPARTMENTS.map((dept) => {
          const deptSettings = globalSettings.departments[dept.key as keyof typeof globalSettings.departments];
          const IconComponent = dept.icon;
          
          return (
            <Card key={dept.key} className={`border-gray-200 ${dept.bgColor}`}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconComponent className={`h-5 w-5 ${dept.color}`} />
                  {dept.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Auto Refresh Toggle */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">به‌روزرسانی خودکار</Label>
                  <Switch 
                    checked={deptSettings.autoRefresh}
                    onCheckedChange={(enabled) => handleDepartmentAutoRefreshToggle(dept.key, enabled)}
                  />
                </div>

                {/* Individual Interval (only if sync is disabled) */}
                {!globalSettings.syncEnabled && deptSettings.autoRefresh && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">فاصله زمانی</Label>
                    <Select 
                      value={deptSettings.interval.toString()} 
                      onValueChange={(value) => handleDepartmentIntervalChange(dept.key, value)}
                    >
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

                {/* Status */}
                <div className="text-center">
                  <Badge 
                    variant="outline" 
                    className={`${
                      deptSettings.autoRefresh 
                        ? 'bg-green-100 text-green-800 border-green-300' 
                        : 'bg-gray-100 text-gray-600 border-gray-300'
                    }`}
                  >
                    {deptSettings.autoRefresh 
                      ? `فعال - ${REFRESH_INTERVALS.find(i => i.value === (globalSettings.syncEnabled ? globalSettings.globalInterval : deptSettings.interval))?.label}`
                      : 'غیرفعال'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Section */}
      <Card className="mt-8 border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            راهنما
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>همگام‌سازی فعال:</strong> همه واحدها با یک فاصله زمانی مشترک به‌روزرسانی می‌شوند
          </p>
          <p>
            <strong>همگام‌سازی غیرفعال:</strong> هر واحد می‌تواند فاصله زمانی مختص خود را داشته باشد
          </p>
          <p>
            <strong>توجه:</strong> تغییرات بلافاصله در تمام صفحات واحدها اعمال می‌شود
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
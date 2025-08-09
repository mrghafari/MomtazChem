import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Settings, Calendar, Clock, Save, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShopSettings {
  id?: number;
  settingKey: string;
  settingValue: string;
  settingType: string;
  displayName: string;
  displayNameEn?: string;
  description?: string;
  category: string;
  isPublic: boolean;
  validationRule?: string;
  defaultValue?: string;
}

export default function ShopManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Settings state
  const [proformaDeadlineDays, setProformaDeadlineDays] = useState("3");
  const [currency, setCurrency] = useState("IQD");
  const [timezone, setTimezone] = useState("Asia/Baghdad");
  const [businessHours, setBusinessHours] = useState("8:00-17:00");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth');
        if (!response.ok) {
          setLocation('/admin/login');
        }
      } catch (error) {
        setLocation('/admin/login');
      }
    };
    checkAuth();
  }, [setLocation]);

  // Fetch shop settings
  const { data: shopSettings = [], isLoading } = useQuery<ShopSettings[]>({
    queryKey: ['/api/shop/settings'],
    queryFn: async () => {
      const response = await apiRequest('/api/shop/settings', { method: 'GET' });
      return response.data || [];
    },
  });



  // Load existing settings
  useEffect(() => {
    if (shopSettings.length > 0) {
      const proformaDeadline = shopSettings.find(s => s.settingKey === 'proforma_deadline_days');
      const currencySetting = shopSettings.find(s => s.settingKey === 'default_currency');
      const timezoneSetting = shopSettings.find(s => s.settingKey === 'timezone');
      const businessHoursSetting = shopSettings.find(s => s.settingKey === 'business_hours');

      if (proformaDeadline) setProformaDeadlineDays(proformaDeadline.settingValue);
      if (currencySetting) setCurrency(currencySetting.settingValue);
      if (timezoneSetting) setTimezone(timezoneSetting.settingValue);
      if (businessHoursSetting) setBusinessHours(businessHoursSetting.settingValue);
    }
  }, [shopSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<ShopSettings>[]) => {
      return apiRequest('/api/shop/settings', { method: 'POST', body: { settings } });
    },
    onSuccess: () => {
      toast({
        title: "✅ تنظیمات ذخیره شد",
        description: "تنظیمات فروشگاه با موفقیت به‌روزرسانی شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/settings'] });
      setIsUpdating(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطا در ذخیره تنظیمات",
        description: error.message || "امکان ذخیره تنظیمات وجود ندارد",
        variant: "destructive",
      });
      setIsUpdating(false);
    },
  });



  const handleSaveSettings = () => {
    setIsUpdating(true);
    const settingsToSave = [
      {
        settingKey: 'proforma_deadline_days',
        settingValue: proformaDeadlineDays,
        settingType: 'number',
        displayName: 'مهلت پیش فاکتور خرید (روز)',
        displayNameEn: 'Proforma Invoice Deadline (Days)',
        description: 'تعداد روزهای مهلت برای پرداخت پیش فاکتور',
        category: 'payment',
        isPublic: true,
        validationRule: 'min:1,max:30',
        defaultValue: '3'
      },
      {
        settingKey: 'default_currency',
        settingValue: currency,
        settingType: 'text',
        displayName: 'واحد پول پیش‌فرض',
        displayNameEn: 'Default Currency',
        description: 'واحد پول پیش‌فرض برای فروشگاه',
        category: 'general',
        isPublic: true,
        defaultValue: 'IQD'
      },
      {
        settingKey: 'timezone',
        settingValue: timezone,
        settingType: 'text',
        displayName: 'منطقه زمانی',
        displayNameEn: 'Timezone',
        description: 'منطقه زمانی سیستم',
        category: 'general',
        isPublic: false,
        defaultValue: 'Asia/Baghdad'
      },
      {
        settingKey: 'business_hours',
        settingValue: businessHours,
        settingType: 'text',
        displayName: 'ساعات کاری',
        displayNameEn: 'Business Hours',
        description: 'ساعات کاری روزانه فروشگاه',
        category: 'general',
        isPublic: true,
        defaultValue: '8:00-17:00'
      }
    ];

    saveSettingsMutation.mutate(settingsToSave);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="mr-2">در حال بارگذاری تنظیمات...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">مدیریت فروشگاه</h1>
          <p className="text-muted-foreground">تنظیمات عمومی و پیکربندی فروشگاه</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          مدیریت تنظیمات
        </Badge>
      </div>

      <Tabs defaultValue="payment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            مهلت پیش فاکتور
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            تنظیمات عمومی
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            ساعات کاری
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            سیستم
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                مهلت پیش فاکتور خرید
              </CardTitle>
              <CardDescription>
                تعداد روزهای مهلت برای پرداخت پیش فاکتور که در کارت خرید و checkout نمایش داده می‌شود
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  این تنظیم بر تمام محصولات فروشگاه اعمال می‌شود و در صفحه checkout و کارت خرید نمایش داده می‌شود.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proforma_deadline">مهلت پرداخت (روز)</Label>
                  <Input
                    id="proforma_deadline"
                    type="number"
                    min="1"
                    max="30"
                    value={proformaDeadlineDays}
                    onChange={(e) => setProformaDeadlineDays(e.target.value)}
                    placeholder="3"
                  />
                  <p className="text-sm text-muted-foreground">
                    تعداد روزهای مهلت برای پرداخت (حداقل 1 روز، حداکثر 30 روز)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>پیش‌نمایش پیام</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">
                      مهلت پرداخت: <strong>{proformaDeadlineDays} روز</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      این پیام در کارت خرید و صفحه checkout نمایش داده می‌شود
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات عمومی فروشگاه</CardTitle>
              <CardDescription>تنظیمات پایه‌ای که بر کل فروشگاه تأثیر می‌گذارد</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">واحد پول پیش‌فرض</Label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="IQD">دینار عراقی (IQD)</option>
                    <option value="USD">دلار آمریکا (USD)</option>
                    <option value="EUR">یورو (EUR)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">منطقه زمانی</Label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="Asia/Baghdad">بغداد (Asia/Baghdad)</option>
                    <option value="Asia/Tehran">تهران (Asia/Tehran)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                ساعات کاری
              </CardTitle>
              <CardDescription>تعیین ساعات کاری روزانه فروشگاه</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_hours">ساعات کاری روزانه</Label>
                <Input
                  id="business_hours"
                  value={businessHours}
                  onChange={(e) => setBusinessHours(e.target.value)}
                  placeholder="8:00-17:00"
                />
                <p className="text-sm text-muted-foreground">
                  فرمت: ساعت شروع-ساعت پایان (مثال: 8:00-17:00)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات سیستم</CardTitle>
              <CardDescription>وضعیت فعلی تنظیمات سیستم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>تعداد تنظیمات بارگذاری شده:</span>
                  <Badge variant="secondary">{shopSettings.length}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>آخرین به‌روزرسانی:</span>
                  <span className="text-sm text-muted-foreground">
                    {shopSettings.length > 0 ? 'امروز' : 'هرگز'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleSaveSettings}
          disabled={isUpdating}
          className="flex items-center gap-2"
        >
          {isUpdating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isUpdating ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        </Button>
      </div>
    </div>
  );
}
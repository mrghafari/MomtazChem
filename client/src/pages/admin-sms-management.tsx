import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  MessageSquare, 
  Settings, 
  Users, 
  BarChart3, 
  Shield, 
  Clock, 
  Truck, 
  CheckCircle2,
  XCircle,
  RefreshCw,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SmsTemplatesSimple from '@/components/sms-templates-simple';

interface SmsSettings {
  id?: number;
  isEnabled: boolean;
  provider: string;
  customProviderName?: string;
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
  senderNumber?: string;
  apiEndpoint?: string;
  serviceType?: string;
  patternId?: string;
  codeLength: number;
  codeExpiry: number;
  maxAttempts: number;
  rateLimitMinutes: number;
}

interface CustomerSmsSettings {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  smsEnabled: boolean;
  customerStatus: string;
  totalOrders: number;
  lastOrderDate?: string;
}

interface SmsStats {
  totalVerifications: number;
  verificationsSentToday: number;
  successfulVerifications: number;
  customersWithSmsEnabled: number;
  systemEnabled: boolean;
}

interface DeliveryLog {
  id: number;
  orderId: number;
  customerName: string;
  phone: string;
  verificationCode: string;
  smsStatus: 'sent' | 'delivered' | 'failed';
  createdAt: string;
  deliveredAt?: string;
  isVerified: boolean;
}

export default function AdminSmsManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SmsSettings>({
    isEnabled: false,
    provider: 'kavenegar',
    codeLength: 6,
    codeExpiry: 300,
    maxAttempts: 3,
    rateLimitMinutes: 60
  });
  const [customersWithSms, setCustomersWithSms] = useState<CustomerSmsSettings[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerSmsSettings[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<SmsStats>({
    totalVerifications: 0,
    verificationsSentToday: 0,
    successfulVerifications: 0,
    customersWithSmsEnabled: 0,
    systemEnabled: false
  });
  const [localSmsStates, setLocalSmsStates] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem('sms-local-states');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);

  useEffect(() => {
    loadSmsSettings();
    loadSmsStats();
    loadCustomersWithSms();
    loadDeliveryLogs();
  }, []);

  // Save local SMS states to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sms-local-states', JSON.stringify(localSmsStates));
  }, [localSmsStates]);

  // Filter customers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customersWithSms);
    } else {
      const filtered = customersWithSms.filter(customer => 
        customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        (customer.company && customer.company.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  }, [customersWithSms, searchQuery]);

  const loadSmsSettings = async () => {
    try {
      const response = await fetch('/api/admin/sms/settings');
      const result = await response.json();
      if (result.success && result.data) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Error loading SMS settings:', error);
    }
  };

  const loadSmsStats = async () => {
    try {
      const response = await fetch('/api/admin/sms/stats');
      const result = await response.json();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error loading SMS stats:', error);
    }
  };

  const loadCustomersWithSms = async () => {
    try {
      const response = await fetch('/api/admin/sms/customers');
      const result = await response.json();
      if (result.success && result.data) {
        setCustomersWithSms(result.data);
      }
    } catch (error) {
      console.error('Error loading customers with SMS:', error);
    }
  };

  const loadDeliveryLogs = async () => {
    try {
      const response = await fetch('/api/admin/sms/delivery-logs');
      const result = await response.json();
      if (result.success && result.data) {
        setDeliveryLogs(result.data);
      }
    } catch (error) {
      console.error('Error loading delivery logs:', error);
    }
  };

  const handleToggleSystem = async (enabled: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sms/toggle-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, isEnabled: enabled }));
        setStats(prev => ({ ...prev, systemEnabled: enabled }));
        toast({
          title: enabled ? 'فعال شد' : 'غیرفعال شد',
          description: `سیستم SMS ${enabled ? 'فعال' : 'غیرفعال'} شد`
        });
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'مشکل در تغییر وضعیت سیستم',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sms/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast({
          title: 'ذخیره شد',
          description: 'تنظیمات SMS ذخیره شد'
        });
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'مشکل در ذخیره تنظیمات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCustomerSms = async (customerId: number, enabled: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sms/customer/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, enabled })
      });

      if (response.ok) {
        setCustomersWithSms(prev => 
          prev.map(customer => 
            customer.id === customerId ? { ...customer, smsEnabled: enabled } : customer
          )
        );
        
        setLocalSmsStates(prev => ({ ...prev, [customerId]: enabled }));
        
        toast({
          title: enabled ? 'فعال شد' : 'غیرفعال شد',
          description: `SMS برای مشتری ${enabled ? 'فعال' : 'غیرفعال'} شد`
        });
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'مشکل در تغییر وضعیت SMS مشتری',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSmsToggle = async (action: 'enable' | 'disable') => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sms/bulk-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const enabled = action === 'enable';
        setCustomersWithSms(prev => 
          prev.map(customer => ({ ...customer, smsEnabled: enabled }))
        );
        
        const newLocalStates: Record<number, boolean> = {};
        customersWithSms.forEach(customer => {
          newLocalStates[customer.id] = enabled;
        });
        setLocalSmsStates(newLocalStates);
        
        toast({
          title: enabled ? 'همه فعال شدند' : 'همه غیرفعال شدند',
          description: `SMS برای همه مشتریان ${enabled ? 'فعال' : 'غیرفعال'} شد`
        });
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'مشکل در تغییر وضعیت SMS',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Authentication Management</h1>
          <p className="text-muted-foreground">
            مدیریت سیستم SMS و قالب‌های ساده
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={settings.isEnabled ? "default" : "secondary"}>
            {settings.isEnabled ? "System Active" : "System Disabled"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            آمار کلی
          </TabsTrigger>
          <TabsTrigger value="templates">
            <MessageSquare className="h-4 w-4 mr-2" />
            SMS Categories
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            تنظیمات
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="h-4 w-4 mr-2" />
            مشتریان
          </TabsTrigger>
          <TabsTrigger value="delivery">
            <Truck className="h-4 w-4 mr-2" />
            لاگ تحویل
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">وضعیت سیستم</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.systemEnabled ? "فعال" : "غیرفعال"}
                </div>
                <p className="text-xs text-muted-foreground">
                  سیستم SMS
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل تاییدیه‌ها</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVerifications}</div>
                <p className="text-xs text-muted-foreground">
                  کل کدهای SMS ارسال شده
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تاییدیه‌های امروز</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.verificationsSentToday}</div>
                <p className="text-xs text-muted-foreground">
                  کدهای امروز
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مشتریان فعال</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.customersWithSmsEnabled}</div>
                <p className="text-xs text-muted-foreground">
                  مشتریان با SMS فعال
                </p>
              </CardContent>
            </Card>
          </div>

          {/* SMS Usage Summary - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle>سیستم SMS ساده</CardTitle>
              <CardDescription>
                مدیریت قالب‌های SMS بدون دسته‌بندی
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  قالب‌های SMS از طریق tab "SMS Categories" قابل مدیریت است
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>عملیات سریع</CardTitle>
              <CardDescription>
                مدیریت سیستم SMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">SMS Authentication System</Label>
                  <div className="text-sm text-muted-foreground">
                    {settings.isEnabled 
                      ? "System is currently active and processing SMS verifications"
                      : "System is disabled - no SMS codes will be sent"
                    }
                  </div>
                </div>
                <Switch
                  checked={settings.isEnabled}
                  onCheckedChange={handleToggleSystem}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات پیشرفته SMS</CardTitle>
              <CardDescription>
                پیکربندی تنظیمات احراز هویت SMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">SMS Provider</Label>
                  <Select value={settings.provider} onValueChange={(value) => setSettings(prev => ({ ...prev, provider: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asiacell">Asiacell</SelectItem>
                      <SelectItem value="zain_iraq">Zain Iraq</SelectItem>
                      <SelectItem value="korek_telecom">Korek Telecom</SelectItem>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="plivo">Plivo</SelectItem>
                      <SelectItem value="infobip">Infobip</SelectItem>
                      <SelectItem value="custom">شرکت جدید - سفارشی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.provider === 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="customProviderName">نام شرکت سفارشی</Label>
                    <Input
                      id="customProviderName"
                      placeholder="نام شرکت ارائه‌دهنده SMS"
                      value={settings.customProviderName || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, customProviderName: e.target.value }))}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key / Token</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="کلید API یا Token"
                    value={settings.apiKey || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">نام کاربری</Label>
                  <Input
                    id="username"
                    placeholder="نام کاربری حساب SMS"
                    value={settings.username || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">رمز عبور</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="رمز عبور حساب SMS"
                    value={settings.password || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderNumber">شماره ارسال</Label>
                  <Input
                    id="senderNumber"
                    placeholder="شماره ارسال کننده (خط اختصاصی)"
                    value={settings.senderNumber || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, senderNumber: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiEndpoint">آدرس API</Label>
                  <Input
                    id="apiEndpoint"
                    placeholder="https://api.provider.com/send"
                    value={settings.apiEndpoint || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceType">نوع سرویس</Label>
                  <Select value={settings.serviceType || 'pattern'} onValueChange={(value) => setSettings(prev => ({ ...prev, serviceType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pattern">پیامک الگویی (Pattern)</SelectItem>
                      <SelectItem value="simple">پیامک ساده (Simple)</SelectItem>
                      <SelectItem value="otp">کد یکبار مصرف (OTP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patternId">شناسه الگو</Label>
                  <Input
                    id="patternId"
                    placeholder="Pattern ID برای پیامک‌های الگویی"
                    value={settings.patternId || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, patternId: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codeLength">Code Length</Label>
                  <Input
                    id="codeLength"
                    type="number"
                    min="4"
                    max="8"
                    value={settings.codeLength}
                    onChange={(e) => setSettings(prev => ({ ...prev, codeLength: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codeExpiry">Code Expiry (seconds)</Label>
                  <Input
                    id="codeExpiry"
                    type="number"
                    min="60"
                    max="3600"
                    value={settings.codeExpiry}
                    onChange={(e) => setSettings(prev => ({ ...prev, codeExpiry: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Max Attempts</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    min="1"
                    max="5"
                    value={settings.maxAttempts}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rateLimitMinutes">Rate Limit (minutes)</Label>
                  <Input
                    id="rateLimitMinutes"
                    type="number"
                    min="1"
                    max="120"
                    value={settings.rateLimitMinutes}
                    onChange={(e) => setSettings(prev => ({ ...prev, rateLimitMinutes: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
                Save Settings
              </Button>
            </CardContent>
          </Card>

          {/* Provider Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                راهنمای ارائه‌دهندگان SMS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="border-l-4 border-green-500 pl-3">
                    <h4 className="font-medium text-green-700">اپراتورهای عراق</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <strong>Asiacell</strong> - asiacell.com</li>
                      <li>• <strong>Zain Iraq</strong> - iq.zain.com</li>
                      <li>• <strong>Korek Telecom</strong> - korek.com</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <h4 className="font-medium text-blue-700">ارائه‌دهندگان بین‌المللی</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <strong>Twilio</strong> - twilio.com</li>
                      <li>• <strong>Plivo</strong> - plivo.com</li>
                      <li>• <strong>Infobip</strong> - infobip.com</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <strong>نکته مهم:</strong> برای استفاده از اپراتورهای عراق، با بخش فنی هر اپراتور تماس بگیرید تا API credentials و اطلاعات اتصال را دریافت کنید.
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <strong>شرکت سفارشی:</strong> اگر ارائه‌دهنده SMS شما در لیست نیست، گزینه "شرکت جدید - سفارشی" را انتخاب کرده و اطلاعات API خود را وارد کنید.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!settings.isEnabled && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                SMS authentication system is currently disabled. Enable it from the Overview tab to start processing SMS verifications.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مدیریت دسترسی SMS مشتریان</CardTitle>
              <CardDescription>
                مدیریت دسترسی احراز هویت SMS برای مشتریان به صورت جداگانه
              </CardDescription>
              
              {/* Search Box */}
              <div className="space-y-4 mt-4">
                <div className="flex items-center space-x-4 gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="جستجو مشتریان (نام، ایمیل، تلفن، شرکت)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-md"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {filteredCustomers.length} از {customersWithSms.length} مشتری
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkSmsToggle('enable')}
                    disabled={loading}
                  >
                    فعال کردن همه
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkSmsToggle('disable')}
                    disabled={loading}
                  >
                    غیرفعال کردن همه
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {customersWithSms.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">مشتری با SMS فعال وجود ندارد</h3>
                  <p className="text-muted-foreground">
                    احراز هویت SMS را برای مشتریان از پروفایل‌های جداگانه آن‌ها در بخش CRM فعال کنید.
                  </p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">مشتری یافت نشد</h3>
                  <p className="text-muted-foreground">
                    هیچ مشتری با این جستجو پیدا نشد. جستجوی خود را تغییر دهید.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {customer.email} • {customer.phone}
                        </div>
                        {customer.company && (
                          <div className="text-sm text-muted-foreground">
                            شرکت: {customer.company}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline">{customer.customerStatus}</Badge>
                          <span className="text-muted-foreground">
                            {customer.totalOrders} سفارش
                          </span>
                          {customer.lastOrderDate && (
                            <span className="text-muted-foreground">
                              • آخرین سفارش: {new Date(customer.lastOrderDate).toLocaleDateString('fa-IR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={localSmsStates[customer.id] ?? customer.smsEnabled}
                          onCheckedChange={(enabled) => handleToggleCustomerSms(customer.id, enabled)}
                          disabled={loading}
                        />
                        <Badge variant={customer.smsEnabled ? "default" : "secondary"}>
                          {customer.smsEnabled ? "فعال" : "غیرفعال"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>لاگ تحویل SMS</CardTitle>
              <CardDescription>
                پیگیری SMS های ارسالی برای تحویل سفارشات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Truck className="h-4 w-4" />
                  <AlertDescription>
                    هنگام ارسال سفارش توسط بخش لجستیک، SMS حاوی کد تحویل و اطلاعات پیک به صورت خودکار برای مشتری ارسال می‌شود.
                  </AlertDescription>
                </Alert>

                {deliveryLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">هیچ SMS تحویل ارسال نشده</h3>
                    <p className="text-muted-foreground">
                      زمانی که سفارشی توسط بخش لجستیک ارسال شود، SMS تحویل در اینجا نمایش داده خواهد شد.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>شماره سفارش</TableHead>
                        <TableHead>نام مشتری</TableHead>
                        <TableHead>شماره تلفن</TableHead>
                        <TableHead>کد تحویل</TableHead>
                        <TableHead>وضعیت SMS</TableHead>
                        <TableHead>تاریخ ارسال</TableHead>
                        <TableHead>تحویل شده</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveryLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">#{log.orderId}</TableCell>
                          <TableCell>{log.customerName}</TableCell>
                          <TableCell>{log.phone}</TableCell>
                          <TableCell>
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                              {log.verificationCode}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                log.smsStatus === 'delivered' ? 'default' : 
                                log.smsStatus === 'sent' ? 'secondary' : 'destructive'
                              }
                            >
                              {log.smsStatus === 'delivered' ? 'تحویل شده' :
                               log.smsStatus === 'sent' ? 'ارسال شده' : 'ناموفق'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(log.createdAt).toLocaleDateString('en-US')}
                          </TableCell>
                          <TableCell>
                            {log.isVerified ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {deliveryLogs.length} رکورد نمایش داده شده
                  </div>
                  <Button
                    onClick={loadDeliveryLogs}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    بروزرسانی
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <SmsTemplatesSimple />
        </TabsContent>
      </Tabs>
    </div>
  );
}
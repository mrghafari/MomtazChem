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
  BarChart3, 
  Shield, 
  Clock, 
  Truck, 
  CheckCircle2,
  XCircle,
  RefreshCw,
  Info,
  AlertTriangle,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SmsTemplatesSimple from '@/components/sms-templates-simple';

interface SmsSettings {
  id?: number;
  isEnabled: boolean;
  provider: string;
  customProviderName?: string;
  
  // Authentication credentials
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
  accessToken?: string;
  clientId?: string;
  clientSecret?: string;
  
  // Provider configuration
  senderNumber?: string;
  senderId?: string;
  apiEndpoint?: string;
  baseUrl?: string;
  serviceType?: string;
  patternId?: string;
  templateId?: string;
  serviceCode?: string;
  applicationId?: string;
  
  // Additional provider-specific fields
  countryCode?: string;
  encoding?: string;
  messageType?: string;
  priority?: string;
  validityPeriod?: number;
  
  // Security and validation
  webhookUrl?: string;
  webhookSecret?: string;
  ipWhitelist?: string[];
  
  // Rate limiting and quotas
  dailyLimit?: number;
  monthlyLimit?: number;
  rateLimitPerMinute?: number;
  
  // Message configuration
  codeLength: number;
  codeExpiry: number;
  maxAttempts: number;
  rateLimitMinutes?: number;
  
  // System fields
  isTestMode?: boolean;
  rateLimitMinutes: number;
}



interface SmsLog {
  id: number;
  recipientName: string;
  recipientPhone: string;
  messageText: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
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
  const [testLoading, setTestLoading] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("پیام تست از سیستم Momtaz Chemical");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    messageId?: string;
  } | null>(null);
  const [settings, setSettings] = useState<SmsSettings>({
    isEnabled: false,
    provider: 'infobip',
    encoding: 'UTF-8',
    messageType: 'TEXT',
    priority: 'NORMAL',
    validityPeriod: 1440,
    dailyLimit: 1000,
    monthlyLimit: 30000,
    rateLimitPerMinute: 10,
    codeLength: 4,
    codeExpiry: 10,
    maxAttempts: 3,
    rateLimitMinutes: 60,
    isTestMode: true
  });

  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SmsLog[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');


  useEffect(() => {
    loadSmsSettings();
    loadSmsLogs();
  }, []);



  // Filter SMS logs based on search and time filters
  useEffect(() => {
    let filtered = [...smsLogs];

    // Apply text search filter
    if (logSearchQuery.trim()) {
      filtered = filtered.filter(log => 
        log.recipientName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.recipientPhone.includes(logSearchQuery) ||
        log.messageText.toLowerCase().includes(logSearchQuery.toLowerCase())
      );
    }

    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      if (timeFilter === 'today') {
        filterDate.setHours(0, 0, 0, 0);
      } else if (timeFilter === 'week') {
        filterDate.setDate(now.getDate() - 7);
      } else if (timeFilter === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      }
      
      filtered = filtered.filter(log => new Date(log.sentAt) >= filterDate);
    }

    setFilteredLogs(filtered);
  }, [smsLogs, logSearchQuery, timeFilter]);

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

  const loadSmsLogs = async () => {
    try {
      const response = await fetch('/api/admin/sms/logs');
      const result = await response.json();
      if (result.success) {
        setSmsLogs(result.data || []);
      }
    } catch (error) {
      console.error('Error loading SMS logs:', error);
      setSmsLogs([]);
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
        setSettings(prev => ({ ...prev, isEnabled: enabled }));
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

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/admin/sms/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();
      
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message,
          messageId: data.messageId
        });
        toast({
          title: "موفقیت",
          description: "اتصال SMS با موفقیت تست شد"
        });
      } else {
        setTestResult({
          success: false,
          message: data.message
        });
        toast({
          title: "خطا در تست اتصال",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error testing SMS connection:', error);
      setTestResult({
        success: false,
        message: "خطا در تست اتصال SMS"
      });
      toast({
        title: "خطا",
        description: "خطا در تست اتصال SMS",
        variant: "destructive"
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleTestSms = async () => {
    if (!testPhone || !testMessage) {
      toast({
        title: "خطا",
        description: "شماره تلفن و پیام الزامی است",
        variant: "destructive"
      });
      return;
    }

    setTestLoading(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/admin/sms/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: testPhone,
          message: testMessage
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message,
          messageId: data.messageId
        });
        toast({
          title: "موفقیت",
          description: "پیامک با موفقیت ارسال شد"
        });
      } else {
        setTestResult({
          success: false,
          message: data.message
        });
        toast({
          title: "خطا در ارسال",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      setTestResult({
        success: false,
        message: "خطا در ارسال پیامک تست"
      });
      toast({
        title: "خطا",
        description: "خطا در ارسال پیامک تست",
        variant: "destructive"
      });
    } finally {
      setTestLoading(false);
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
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            تنظیمات
          </TabsTrigger>

          <TabsTrigger value="templates">
            <MessageSquare className="h-4 w-4 mr-2" />
            قالب‌های SMS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>آمار کلی ارسال SMS</CardTitle>
              <CardDescription>
                تاریخچه کامل پیام‌های ارسالی با امکان فیلتر کردن
              </CardDescription>
              
              {/* فیلترها */}
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="searchSms">جستجو در پیام‌ها</Label>
                    <Input
                      id="searchSms"
                      placeholder="نام، شماره تلفن، یا متن پیام..."
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="timeFilter">بازه زمانی</Label>
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه زمان‌ها</SelectItem>
                        <SelectItem value="today">امروز</SelectItem>
                        <SelectItem value="week">هفته گذشته</SelectItem>
                        <SelectItem value="month">ماه گذشته</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={loadSmsLogs} 
                      variant="outline"
                      disabled={loading}
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      بروزرسانی
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  نمایش {filteredLogs.length} از {smsLogs.length} پیام
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">هیچ پیام SMS ارسالی وجود ندارد</h3>
                  <p className="text-muted-foreground">
                    پیام‌های ارسالی در اینجا نمایش داده خواهند شد
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام دریافت‌کننده</TableHead>
                      <TableHead>شماره موبایل</TableHead>
                      <TableHead>متن ارسالی</TableHead>
                      <TableHead>زمان ارسال</TableHead>
                      <TableHead>وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.recipientName}</TableCell>
                        <TableCell>{log.recipientPhone}</TableCell>
                        <TableCell className="max-w-xs truncate">{log.messageText}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.sentAt).toLocaleString('fa-IR')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              log.status === 'delivered' ? 'default' : 
                              log.status === 'sent' ? 'secondary' : 'destructive'
                            }
                          >
                            {log.status === 'delivered' ? 'تحویل شده' :
                             log.status === 'sent' ? 'ارسال شده' : 'ناموفق'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
                      <SelectItem value="msg91">MSG91</SelectItem>
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
                  <Label htmlFor="serviceCode">کد سرویس</Label>
                  <Input
                    id="serviceCode"
                    placeholder="کد سرویس خاص SMS Provider"
                    value={settings.serviceCode || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, serviceCode: e.target.value }))}
                  />
                </div>

                {/* Additional Authentication Fields */}
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="JWT یا Access Token"
                    value={settings.accessToken || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, accessToken: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    placeholder="OAuth Client ID"
                    value={settings.clientId || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, clientId: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderId">Sender ID</Label>
                  <Input
                    id="senderId"
                    placeholder="نام فرستنده (برای برخی ارائه‌دهندگان)"
                    value={settings.senderId || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, senderId: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateId">Template ID</Label>
                  <Input
                    id="templateId"
                    placeholder="شناسه قالب پیام"
                    value={settings.templateId || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, templateId: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicationId">Application ID</Label>
                  <Input
                    id="applicationId"
                    placeholder="شناسه اپلیکیشن"
                    value={settings.applicationId || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, applicationId: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    placeholder="https://yoursite.com/webhook/sms"
                    value={settings.webhookUrl || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyLimit">حد روزانه پیام</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    placeholder="1000"
                    value={settings.dailyLimit || 1000}
                    onChange={(e) => setSettings(prev => ({ ...prev, dailyLimit: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">اولویت ارسال</Label>
                  <Select value={settings.priority || 'NORMAL'} onValueChange={(value) => setSettings(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">پایین</SelectItem>
                      <SelectItem value="NORMAL">عادی</SelectItem>
                      <SelectItem value="HIGH">بالا</SelectItem>
                      <SelectItem value="URGENT">فوری</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isTestMode">حالت تست</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isTestMode"
                      checked={settings.isTestMode || false}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, isTestMode: checked }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {settings.isTestMode ? 'حالت تست فعال' : 'حالت تست غیرفعال'}
                    </span>
                  </div>
                </div>

                {/* SMS Test Section */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium">تست ارسال SMS</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="testPhone">شماره تلفن تست</Label>
                      <Input
                        id="testPhone"
                        placeholder="+964770xxxxxxx"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="testMessage">متن پیام تست</Label>
                      <Input
                        id="testMessage"
                        placeholder="این یک پیام تست است"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-start">
                    <Button 
                      onClick={handleTestSms}
                      disabled={testLoading || !testPhone || !testMessage}
                      className="w-full md:w-auto"
                    >
                      {testLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          در حال ارسال...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          ارسال پیام تست
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {testResult && (
                    <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {testResult.message}
                        {testResult.messageId && (
                          <span className="block mt-1 text-xs text-gray-600">
                            شناسه پیام: {testResult.messageId}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
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

          {/* SMS Test Card */}
          {settings.isEnabled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  تست ارسال SMS
                </CardTitle>
                <CardDescription>
                  تست اتصال و ارسال پیامک با تنظیمات فعلی
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testPhone">شماره تلفن تست</Label>
                  <Input
                    id="testPhone"
                    placeholder="9647503533769"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="testMessage">پیام تست</Label>
                  <Input
                    id="testMessage"
                    placeholder="پیام تست از سیستم Momtaz Chemical"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={handleTestConnection} 
                    disabled={testLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {testLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                    تست اتصال
                  </Button>
                  
                  <Button 
                    onClick={handleTestSms} 
                    disabled={testLoading || !testPhone || !testMessage}
                    className="w-full"
                  >
                    {testLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                    ارسال پیام تست
                  </Button>
                </div>

                {testResult && (
                  <Alert className={testResult.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
                    {testResult.success ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                    <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                      {testResult.message}
                      {testResult.messageId && (
                        <div className="text-xs mt-1 opacity-75">
                          Message ID: {testResult.messageId}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

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
                      <li>• <strong>MSG91</strong> - msg91.com</li>
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



        <TabsContent value="templates" className="space-y-4">
          <SmsTemplatesSimple />
        </TabsContent>
      </Tabs>
    </div>
  );
}
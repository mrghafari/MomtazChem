import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  MessageSquare, 
  Settings, 
  Users, 
  BarChart3, 
  Shield, 
  Clock, 
  Send, 
  Phone, 
  ShoppingCart, 
  Truck, 
  Package, 
  AlertTriangle, 
  UserCheck,
  Bell,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SmsTemplateManagement from '@/components/sms-template-management';

interface SmsSettings {
  id?: number;
  isEnabled: boolean;
  provider: string;
  apiKey?: string;
  apiSecret?: string;
  senderNumber?: string;
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

interface SmsUsageCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  messageTemplate: string;
  triggerConditions: string[];
  recipients: string[];
  frequency: string;
  priority: 'high' | 'medium' | 'low';
  statistics?: {
    totalSent: number;
    lastSent?: string;
    successRate: number;
  };
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
  
  // SMS Usage Categories - All identified SMS use cases in the system
  const [smsUsageCategories, setSmsUsageCategories] = useState<SmsUsageCategory[]>([
    {
      id: 'customer_authentication',
      name: 'احراز هویت مشتری',
      description: 'کد تایید ورود و ثبت نام مشتریان',
      icon: UserCheck,
      enabled: true,
      messageTemplate: 'کد تایید ورود شما: {{code}}\nمعتبر تا {{expiry}} دقیقه\nممتازکم',
      triggerConditions: ['Customer login', 'Customer registration', 'Password reset'],
      recipients: ['Registered customers'],
      frequency: 'On-demand',
      priority: 'high',
      statistics: { totalSent: 45, lastSent: '2025-01-16', successRate: 98.2 }
    },
    {
      id: 'delivery_verification',
      name: 'کد تحویل سفارش',
      description: 'ارسال کد تحویل برای سفارشات در حال ارسال',
      icon: Truck,
      enabled: true,
      messageTemplate: '{{customerName}} عزیز، سفارش شما در راه است.\nکد تحویل: {{verificationCode}}\nاین کد را هنگام تحویل به پیک اعلام کنید.\nممتازکم',
      triggerConditions: ['Order shipped', 'Delivery personnel assigned'],
      recipients: ['Customers with shipped orders'],
      frequency: 'Per shipment',
      priority: 'high',
      statistics: { totalSent: 23, lastSent: '2025-01-15', successRate: 95.7 }
    },
    {
      id: 'logistics_delivery_codes',
      name: 'کدهای تحویل لجستیک',
      description: 'ارسال کدهای ۴ رقمی تولید شده توسط بخش لجستیک برای تحویل محموله',
      icon: Shield,
      enabled: true,
      messageTemplate: '{{customerName}} عزیز، سفارش شما در راه است.\nکد تحویل: {{verificationCode}}\nاین کد را هنگام تحویل به پیک اعلام کنید.\nممتازکم',
      triggerConditions: ['Logistics code generated', 'Delivery code resent'],
      recipients: ['Customers with pending deliveries'],
      frequency: 'On-demand by logistics department',
      priority: 'high',
      statistics: { totalSent: 0, lastSent: undefined, successRate: 100 }
    },
    {
      id: 'order_notifications',
      name: 'اطلاع‌رسانی سفارش',
      description: 'وضعیت سفارش، تایید پرداخت، آماده‌سازی',
      icon: ShoppingCart,
      enabled: true,
      messageTemplate: 'سفارش {{orderNumber}} شما {{status}} شد.\nزمان تقریبی تحویل: {{estimatedDelivery}}\nممتازکم',
      triggerConditions: ['Order confirmed', 'Payment received', 'Order prepared', 'Order shipped'],
      recipients: ['Order customers'],
      frequency: 'Per order status change',
      priority: 'medium',
      statistics: { totalSent: 78, lastSent: '2025-01-16', successRate: 97.4 }
    },
    {
      id: 'inventory_alerts',
      name: 'هشدار موجودی',
      description: 'اطلاع‌رسانی کمبود موجودی به مدیران',
      icon: Package,
      enabled: false,
      messageTemplate: 'هشدار موجودی:\n{{productName}} ({{sku}})\nموجودی فعلی: {{currentStock}}\nحد مینیمم: {{minThreshold}}\nممتازکم',
      triggerConditions: ['Stock below minimum', 'Out of stock'],
      recipients: ['Inventory managers', 'Warehouse staff'],
      frequency: 'Real-time alerts',
      priority: 'high',
      statistics: { totalSent: 12, lastSent: '2025-01-14', successRate: 100 }
    },
    {
      id: 'admin_notifications',
      name: 'اطلاع‌رسانی مدیریت',
      description: 'ارسال پیام‌های مدیریتی و اطلاعیه‌ها',
      icon: Bell,
      enabled: true,
      messageTemplate: 'اطلاعیه مهم:\n{{message}}\nتاریخ: {{date}}\nممتازکم - مدیریت',
      triggerConditions: ['Manual admin send', 'System alerts', 'Important announcements'],
      recipients: ['All staff', 'Selected user groups'],
      frequency: 'As needed',
      priority: 'medium',
      statistics: { totalSent: 34, lastSent: '2025-01-13', successRate: 96.8 }
    },
    {
      id: 'wallet_notifications',
      name: 'اطلاع‌رسانی کیف پول',
      description: 'تراکنش‌های کیف پول، شارژ و برداشت',
      icon: Phone,
      enabled: true,
      messageTemplate: 'تراکنش کیف پول:\nمبلغ: {{amount}} دینار\nنوع: {{transactionType}}\nموجودی: {{balance}} دینار\nممتازکم',
      triggerConditions: ['Wallet recharge', 'Payment from wallet', 'Refund to wallet'],
      recipients: ['Wallet users'],
      frequency: 'Per transaction',
      priority: 'medium',
      statistics: { totalSent: 67, lastSent: '2025-01-16', successRate: 98.5 }
    },
    {
      id: 'security_alerts',
      name: 'هشدارهای امنیتی',
      description: 'ورود مشکوک، تغییر رمز عبور، تلاش‌های ناموفق',
      icon: Shield,
      enabled: true,
      messageTemplate: 'هشدار امنیتی:\n{{alertType}}\nزمان: {{timestamp}}\nIP: {{ipAddress}}\nممتازکم - امنیت',
      triggerConditions: ['Suspicious login', 'Password changed', 'Failed login attempts'],
      recipients: ['Account owners', 'Security team'],
      frequency: 'Real-time',
      priority: 'high',
      statistics: { totalSent: 8, lastSent: '2025-01-12', successRate: 100 }
    },
    {
      id: 'marketing_campaigns',
      name: 'کمپین‌های بازاریابی',
      description: 'تخفیف‌ها، محصولات جدید، اطلاعیه‌های تجاری',
      icon: Send,
      enabled: false,
      messageTemplate: '{{campaignTitle}}\n{{description}}\nکد تخفیف: {{discountCode}}\nاعتبار تا: {{validUntil}}\nممتازکم',
      triggerConditions: ['New product launch', 'Special offers', 'Seasonal campaigns'],
      recipients: ['Subscribed customers', 'Target segments'],
      frequency: 'Campaign-based',
      priority: 'low',
      statistics: { totalSent: 156, lastSent: '2025-01-10', successRate: 94.2 }
    }
  ]);
  
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SmsUsageCategory | null>(null);
  const [editingTemplate, setEditingTemplate] = useState(false);

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
        // Apply server data but maintain local state overrides
        setCustomersWithSms(result.data.map((serverCustomer: any) => {
          // If we have a local state override for this customer, use it
          if (localSmsStates[serverCustomer.id] !== undefined) {
            return {
              ...serverCustomer,
              smsEnabled: localSmsStates[serverCustomer.id]
            };
          }
          return serverCustomer;
        }));
      }
    } catch (error) {
      console.error('Error loading customers with SMS:', error);
    }
  };

  const handleToggleSystem = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sms/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !settings.isEnabled }),
      });

      const result = await response.json();
      if (result.success) {
        setSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
        toast({
          title: "Success",
          description: result.message,
        });
        loadSmsStats();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "خطا در تغییر وضعیت سیستم SMS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sms/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
        toast({
          title: "Success",
          description: result.message,
        });
        loadSmsStats();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "خطا در ذخیره تنظیمات SMS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCustomerSms = async (customerId: number, enable: boolean) => {
    // Immediately update local state and prevent any further data loading
    const newStates = {
      ...localSmsStates,
      [customerId]: enable
    };
    setLocalSmsStates(newStates);
    
    // Also update the customers list directly to prevent conflicts
    setCustomersWithSms(prev => 
      prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, smsEnabled: enable }
          : customer
      )
    );

    try {
      const response = await fetch(`/api/admin/sms/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ smsEnabled: enable })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: enable ? "SMS فعال شد" : "SMS غیرفعال شد",
          description: result.message,
        });
        
        // Only reload stats to update counters
        await loadSmsStats();
      } else {
        // Revert both local state and customers list if API call failed
        setLocalSmsStates(prev => ({
          ...prev,
          [customerId]: !enable
        }));
        
        setCustomersWithSms(prev => 
          prev.map(customer => 
            customer.id === customerId 
              ? { ...customer, smsEnabled: !enable }
              : customer
          )
        );
        
        toast({
          title: "خطا",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert both local state and customers list if API call failed
      setLocalSmsStates(prev => ({
        ...prev,
        [customerId]: !enable
      }));
      
      setCustomersWithSms(prev => 
        prev.map(customer => 
          customer.id === customerId 
            ? { ...customer, smsEnabled: !enable }
            : customer
        )
      );
      
      toast({
        title: "خطا",
        description: "خطا در تغییر تنظیمات SMS مشتری",
        variant: "destructive",
      });
    }
  };

  const handleBulkSmsToggle = async (action: 'enable' | 'disable') => {
    setLoading(true);
    const enableSms = action === 'enable';
    
    // Store previous local states for potential rollback
    const previousLocalStates = { ...localSmsStates };
    
    // Immediately update all customers' SMS status in local state
    const newLocalStates: Record<number, boolean> = {};
    customersWithSms.forEach(customer => {
      newLocalStates[customer.id] = enableSms;
    });
    setLocalSmsStates(prev => ({ ...prev, ...newLocalStates }));

    try {
      const response = await fetch('/api/admin/sms/customers/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: action === 'enable' ? "SMS برای همه فعال شد" : "SMS برای همه غیرفعال شد",
          description: result.message,
        });
        
        // Only reload stats to update counters
        await loadSmsStats();
      } else {
        // Revert to previous local states if API call failed
        setLocalSmsStates(previousLocalStates);
        
        toast({
          title: "خطا",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert to previous local states if API call failed
      setLocalSmsStates(previousLocalStates);
      
      toast({
        title: "خطا",
        description: "خطا در تغییر انبوه تنظیمات SMS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const toggleCategoryEnabled = async (categoryId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/sms/category/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, enabled })
      });

      if (response.ok) {
        setSmsUsageCategories(prev => 
          prev.map(cat => 
            cat.id === categoryId ? { ...cat, enabled } : cat
          )
        );
        toast({
          title: enabled ? 'فعال شد' : 'غیرفعال شد',
          description: `دسته ${categoryId} ${enabled ? 'فعال' : 'غیرفعال'} شد`
        });
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'مشکل در تغییر وضعیت دسته',
        variant: 'destructive'
      });
    }
  };

  const updateCategoryTemplate = async (categoryId: string, newTemplate: string) => {
    try {
      const response = await fetch('/api/admin/sms/category/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, template: newTemplate })
      });

      if (response.ok) {
        setSmsUsageCategories(prev => 
          prev.map(cat => 
            cat.id === categoryId ? { ...cat, messageTemplate: newTemplate } : cat
          )
        );
        toast({
          title: 'ذخیره شد',
          description: 'قالب پیام به‌روزرسانی شد'
        });
        setEditingTemplate(false);
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'مشکل در ذخیره قالب',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Authentication Management</h1>
          <p className="text-muted-foreground">
            Manage SMS two-factor authentication settings and customer access
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
          <TabsTrigger value="categories">
            <MessageSquare className="h-4 w-4 mr-2" />
            دسته‌بندی SMS
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
          <TabsTrigger value="templates">
            <MessageSquare className="h-4 w-4 mr-2" />
            قالب‌های پیامک
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

          {/* SMS Usage Summary */}
          <Card>
            <CardHeader>
              <CardTitle>استفاده از SMS در سیستم</CardTitle>
              <CardDescription>
                خلاصه‌ای از کاربردهای مختلف SMS در سیستم ممتازکم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {smsUsageCategories.slice(0, 4).map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <div key={category.id} className="flex items-center space-x-3 space-x-reverse">
                      <div className={`p-2 rounded-lg ${category.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.statistics?.totalSent || 0} پیام ارسال شده
                        </p>
                      </div>
                    </div>
                  );
                })}
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
              <CardTitle>SMS Provider Configuration</CardTitle>
              <CardDescription>
                Configure your SMS service provider settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="provider">SMS Provider</Label>
                  <Select value={settings.provider} onValueChange={(value) => setSettings(prev => ({ ...prev, provider: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kavenegar">Kavenegar</SelectItem>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="ippanel">IP Panel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderNumber">Sender Number</Label>
                  <Input
                    id="senderNumber"
                    value={settings.senderNumber || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, senderNumber: e.target.value }))}
                    placeholder="e.g., 10008566"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={settings.apiKey || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Your SMS provider API key"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={settings.apiSecret || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, apiSecret: e.target.value }))}
                    placeholder="Your SMS provider API secret"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    max="600"
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
                        <div className="text-xs text-muted-foreground">
                          {customer.totalOrders} سفارش • آخرین سفارش: {customer.lastOrderDate || 'هیچ'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 gap-2">
                        <Badge variant={
                          (localSmsStates[customer.id] !== undefined ? localSmsStates[customer.id] : customer.smsEnabled) 
                            ? "default" : "secondary"
                        }>
                          {(localSmsStates[customer.id] !== undefined ? localSmsStates[customer.id] : customer.smsEnabled) 
                            ? "فعال" : "غیرفعال"}
                        </Badge>
                        <Switch
                          checked={localSmsStates[customer.id] !== undefined ? localSmsStates[customer.id] : customer.smsEnabled}
                          onCheckedChange={(checked) => handleToggleCustomerSms(customer.id, checked)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <SmsTemplateManagement />
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                لاگ تحویل SMS
              </CardTitle>
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
          <SmsTemplateManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
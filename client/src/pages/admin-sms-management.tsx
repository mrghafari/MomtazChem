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
import { MessageSquare, Settings, Users, BarChart3, Shield, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [localSmsStates, setLocalSmsStates] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadSmsSettings();
    loadSmsStats();
    loadCustomersWithSms();
  }, []);

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

  const loadCustomersWithSms = async (preserveLocalChanges = false) => {
    try {
      const response = await fetch('/api/admin/sms/customers');
      const result = await response.json();
      if (result.success && result.data) {
        if (preserveLocalChanges) {
          // Preserve any recent local state changes by merging with server data
          setCustomersWithSms(prev => {
            const serverData = result.data;
            // Create a map of current local state changes
            const localChanges = new Map();
            prev.forEach(customer => {
              localChanges.set(customer.id, customer);
            });
            
            // Apply server data but preserve any recent local changes
            return serverData.map((serverCustomer: any) => {
              const localCustomer = localChanges.get(serverCustomer.id);
              if (localCustomer && localCustomer.updatedAt > serverCustomer.updatedAt) {
                // Keep local changes if they're more recent
                return localCustomer;
              }
              return serverCustomer;
            });
          });
        } else {
          setCustomersWithSms(result.data);
        }
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
    // Store the new state permanently in local storage
    setLocalSmsStates(prev => ({
      ...prev,
      [customerId]: enable
    }));

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
        // Revert the local state change if API call failed
        setLocalSmsStates(prev => ({
          ...prev,
          [customerId]: !enable
        }));
        
        toast({
          title: "خطا",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert the local state change if API call failed
      setLocalSmsStates(prev => ({
        ...prev,
        [customerId]: !enable
      }));
      
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
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="h-4 w-4 mr-2" />
            Customer Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.systemEnabled ? "Active" : "Disabled"}
                </div>
                <p className="text-xs text-muted-foreground">
                  SMS authentication system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVerifications}</div>
                <p className="text-xs text-muted-foreground">
                  All time SMS codes sent
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Verifications</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.verificationsSentToday}</div>
                <p className="text-xs text-muted-foreground">
                  SMS codes sent today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enabled Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.customersWithSmsEnabled}</div>
                <p className="text-xs text-muted-foreground">
                  Customers with SMS auth
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage the SMS authentication system
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
      </Tabs>
    </div>
  );
}
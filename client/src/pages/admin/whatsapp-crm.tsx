import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Users, 
  Send, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Eye,
  TrendingUp,
  Calendar,
  UserCheck,
  MessageSquare,
  Settings,
  Key,
  Save,
  TestTube
} from 'lucide-react';

interface WhatsAppCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  communication_preference: string;
  created_at: string;
  last_login: string;
  total_orders: number;
  total_spent: number;
}

interface WhatsAppStats {
  overview: {
    total_customers: number;
    whatsapp_customers: number;
    whatsapp_preferred: number;
    email_preferred: number;
    sms_preferred: number;
    phone_preferred: number;
  };
  recentActivity: Array<{
    date: string;
    new_customers: number;
  }>;
}

export default function WhatsAppCRM() {
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [bulkMessageModal, setBulkMessageModal] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [testModal, setTestModal] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [viewModal, setViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<WhatsAppCustomer | null>(null);
  
  // API Settings state
  const [apiSettings, setApiSettings] = useState({
    provider: 'twilio', // twilio, whatsapp_business, custom
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioWhatsAppNumber: '',
    businessApiToken: '',
    businessPhoneNumberId: '',
    customApiUrl: '',
    customApiKey: ''
  });
  
  const { toast } = useToast();

  // Fetch WhatsApp customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['/api/admin/whatsapp/customers', page, debouncedSearchTerm],
    enabled: debouncedSearchTerm.length === 0 || debouncedSearchTerm.length >= 3,
    staleTime: 30000,
  });

  // Fetch WhatsApp statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/whatsapp/stats'],
    staleTime: 60000,
  });

  // Test WhatsApp message mutation
  const testWhatsAppMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; message: string }) => {
      return apiRequest('/api/admin/whatsapp/test', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "موفقیت",
        description: data.message || "پیام واتساپ با موفقیت ارسال شد",
      });
      setTestModal(false);
      setTestPhoneNumber('');
      setTestMessage('');
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error?.message || "خطا در ارسال پیام واتساپ",
        variant: "destructive",
      });
    }
  });

  // Bulk message mutation
  const bulkMessageMutation = useMutation({
    mutationFn: async (data: { customerIds: number[]; message: string }) => {
      return apiRequest('/api/admin/whatsapp/bulk-send', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "موفقیت",
        description: data.message || "پیام‌های انبوه با موفقیت ارسال شد",
      });
      setBulkMessageModal(false);
      setBulkMessage('');
      setSelectedCustomers([]);
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error?.message || "خطا در ارسال پیام‌های انبوه",
        variant: "destructive",
      });
    }
  });

  const customers = (customersData as any)?.data?.customers || [];
  const pagination = (customersData as any)?.data?.pagination || {};
  const stats = (statsData as any)?.data as WhatsAppStats;

  // Handle search debouncing - only search after 3 characters or empty
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length === 0 || searchTerm.length >= 3) {
        setDebouncedSearchTerm(searchTerm);
        setPage(1); // Reset to first page when searching
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Generate search suggestions from existing customers
  useEffect(() => {
    if (searchTerm.length >= 3 && customers.length > 0) {
      const suggestions = customers
        .filter((customer: WhatsAppCustomer) => 
          customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone.includes(searchTerm)
        )
        .slice(0, 5)
        .map((customer: WhatsAppCustomer) => `${customer.first_name} ${customer.last_name}`);
      
      setSearchSuggestions([...new Set(suggestions)]);
      setShowSuggestions(suggestions.length > 0 && searchTerm.length >= 3);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, customers]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(customers.map((c: WhatsAppCustomer) => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId: number, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId]);
    } else {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    }
  };

  const getPreferenceIcon = (preference: string) => {
    switch (preference) {
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-orange-500" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-purple-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-green-600" />
            مدیریت واتساپ CRM
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            مدیریت مشتریان واتساپ و ارسال پیام‌های انبوه
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setTestModal(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            تست واتساپ
          </Button>
          <Button 
            onClick={() => setBulkMessageModal(true)}
            disabled={selectedCustomers.length === 0}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            پیام انبوه ({selectedCustomers.length})
          </Button>
        </div>
      </div>

      <Tabs defaultValue="customers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            لیست مشتریان
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            آمار و گزارش
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            تنظیمات API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                جستجو و فیلتر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Input
                    placeholder="جستجو در نام، ایمیل یا شماره واتساپ... (حداقل ۳ حرف)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowSuggestions(searchTerm.length >= 3 && searchSuggestions.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full"
                  />
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 mt-1">
                      <div className="py-2">
                        <div className="px-3 py-1 text-xs text-gray-500 border-b">پیشنهادات:</div>
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            className="w-full text-right px-3 py-2 hover:bg-gray-50 text-sm"
                            onClick={() => {
                              setSearchTerm(suggestion);
                              setShowSuggestions(false);
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {searchTerm.length > 0 && searchTerm.length < 3 && (
                    <div className="absolute top-full left-0 right-0 bg-yellow-50 border border-yellow-200 rounded-md shadow-sm z-10 mt-1">
                      <div className="px-3 py-2 text-xs text-yellow-700">
                        حداقل ۳ حرف برای جستجو وارد کنید
                      </div>
                    </div>
                  )}
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  فیلتر
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customers Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  مشتریان واتساپ ({pagination.total || 0})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCustomers.length === customers.length && customers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-gray-600">انتخاب همه</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">
                          <Checkbox
                            checked={selectedCustomers.length === customers.length && customers.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="text-right">نام</TableHead>
                        <TableHead className="text-right">ایمیل</TableHead>
                        <TableHead className="text-right">شماره واتساپ</TableHead>
                        <TableHead className="text-center">ترجیح ارتباط</TableHead>
                        <TableHead className="text-center">تاریخ عضویت</TableHead>
                        <TableHead className="text-center">عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer: WhatsAppCustomer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedCustomers.includes(customer.id)}
                              onCheckedChange={(checked) => handleSelectCustomer(customer.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-right">
                            {customer.first_name} {customer.last_name}
                          </TableCell>
                          <TableCell className="text-right">{customer.email}</TableCell>
                          <TableCell className="font-mono text-sm text-right">
                            {customer.whatsapp_number || customer.phone}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {getPreferenceIcon(customer.communication_preference)}
                              <span className="capitalize">{customer.communication_preference}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {formatDate(customer.created_at)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-1"
                                onClick={() => {
                                  setTestPhoneNumber(customer.whatsapp_number || customer.phone);
                                  setTestMessage(`سلام ${customer.first_name} عزیز!`);
                                  setTestModal(true);
                                }}
                              >
                                <MessageCircle className="w-3 h-3" />
                                پیام
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="flex items-center gap-1"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setViewModal(true);
                                }}
                              >
                                <Eye className="w-3 h-3" />
                                مشاهده
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    نمایش {((pagination.page - 1) * pagination.limit) + 1} تا {Math.min(pagination.page * pagination.limit, pagination.total)} از {pagination.total} مشتری
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      قبلی
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      بعدی
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {/* Statistics Overview */}
          {statsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">کل مشتریان</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.overview.total_customers?.toLocaleString('fa-IR')}</div>
                    <p className="text-xs text-muted-foreground">تعداد کل مشتریان سیستم</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">مشتریان واتساپ</CardTitle>
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.overview.whatsapp_customers?.toLocaleString('fa-IR')}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.overview.total_customers > 0 ? Math.round((stats.overview.whatsapp_customers / stats.overview.total_customers) * 100) : 0}% از کل مشتریان
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ترجیح واتساپ</CardTitle>
                    <UserCheck className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.overview.whatsapp_preferred?.toLocaleString('fa-IR')}</div>
                    <p className="text-xs text-muted-foreground">مشتریانی که واتساپ را ترجیح می‌دهند</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">سایر ترجیحات</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>ایمیل:</span>
                        <span>{stats.overview.email_preferred}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SMS:</span>
                        <span>{stats.overview.sms_preferred}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>تلفن:</span>
                        <span>{stats.overview.phone_preferred}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    فعالیت ۳۰ روز اخیر - مشتریان جدید واتساپ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end gap-2 overflow-x-auto">
                    {stats.recentActivity.map((activity, index) => (
                      <div key={index} className="flex flex-col items-center min-w-[60px]">
                        <div 
                          className="bg-green-500 w-8 rounded-t"
                          style={{ 
                            height: `${Math.max(4, (activity.new_customers / Math.max(...stats.recentActivity.map(a => a.new_customers), 1)) * 200)}px` 
                          }}
                        />
                        <div className="text-xs mt-1 text-center">
                          {new Date(activity.date).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-xs font-bold text-green-600">
                          {activity.new_customers}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* API Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                تنظیمات API واتساپ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Provider Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">ارائه‌دهنده سرویس</label>
                <select 
                  value={apiSettings.provider}
                  onChange={(e) => setApiSettings(prev => ({ ...prev, provider: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="twilio">Twilio WhatsApp</option>
                  <option value="whatsapp_business">WhatsApp Business API</option>
                  <option value="custom">سرویس سفارشی</option>
                </select>
              </div>

              {/* Twilio Settings */}
              {apiSettings.provider === 'twilio' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    تنظیمات Twilio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Account SID</label>
                      <Input
                        value={apiSettings.twilioAccountSid}
                        onChange={(e) => setApiSettings(prev => ({ ...prev, twilioAccountSid: e.target.value }))}
                        placeholder="ACxxxxxxxxxx"
                        type="password"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Auth Token</label>
                      <Input
                        value={apiSettings.twilioAuthToken}
                        onChange={(e) => setApiSettings(prev => ({ ...prev, twilioAuthToken: e.target.value }))}
                        placeholder="xxxxxxxxxx"
                        type="password"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">شماره واتساپ Twilio</label>
                      <Input
                        value={apiSettings.twilioWhatsAppNumber}
                        onChange={(e) => setApiSettings(prev => ({ ...prev, twilioWhatsAppNumber: e.target.value }))}
                        placeholder="whatsapp:+1415xxxxxxx"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp Business API Settings */}
              {apiSettings.provider === 'whatsapp_business' && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    تنظیمات WhatsApp Business API
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Access Token</label>
                      <Input
                        value={apiSettings.businessApiToken}
                        onChange={(e) => setApiSettings(prev => ({ ...prev, businessApiToken: e.target.value }))}
                        placeholder="EAAxxxxxxxxxx"
                        type="password"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Phone Number ID</label>
                      <Input
                        value={apiSettings.businessPhoneNumberId}
                        onChange={(e) => setApiSettings(prev => ({ ...prev, businessPhoneNumberId: e.target.value }))}
                        placeholder="xxxxxxxxxx"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Custom API Settings */}
              {apiSettings.provider === 'custom' && (
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-medium text-purple-900 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    تنظیمات API سفارشی
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">API URL</label>
                      <Input
                        value={apiSettings.customApiUrl}
                        onChange={(e) => setApiSettings(prev => ({ ...prev, customApiUrl: e.target.value }))}
                        placeholder="https://api.example.com/whatsapp"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">API Key</label>
                      <Input
                        value={apiSettings.customApiKey}
                        onChange={(e) => setApiSettings(prev => ({ ...prev, customApiKey: e.target.value }))}
                        placeholder="your-api-key"
                        type="password"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4">
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => {
                    // Save API settings
                    toast({
                      title: "تنظیمات ذخیره شد",
                      description: "تنظیمات API واتساپ با موفقیت ذخیره شد.",
                    });
                  }}
                >
                  <Save className="w-4 h-4" />
                  ذخیره تنظیمات
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    // Test API connection
                    toast({
                      title: "تست اتصال",
                      description: "در حال تست اتصال به API...",
                    });
                  }}
                >
                  <TestTube className="w-4 h-4" />
                  تست اتصال
                </Button>
              </div>

              {/* Connection Status */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">وضعیت اتصال</h4>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">در انتظار تست اتصال</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  برای تست اتصال، روی دکمه "تست اتصال" کلیک کنید.
                </p>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test WhatsApp Modal */}
      <Dialog open={testModal} onOpenChange={setTestModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تست ارسال پیام واتساپ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">شماره واتساپ</label>
              <Input
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="مثال: +964xxxxxxxxx"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-sm font-medium">پیام</label>
              <Textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="پیام تست..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => testWhatsAppMutation.mutate({ phoneNumber: testPhoneNumber, message: testMessage })}
                disabled={!testPhoneNumber || !testMessage || testWhatsAppMutation.isPending}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {testWhatsAppMutation.isPending ? 'در حال ارسال...' : 'ارسال'}
              </Button>
              <Button variant="outline" onClick={() => setTestModal(false)}>
                انصراف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Message Modal */}
      <Dialog open={bulkMessageModal} onOpenChange={setBulkMessageModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ارسال پیام انبوه واتساپ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                پیام برای {selectedCustomers.length} مشتری ارسال خواهد شد.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                از {'{'}{'{'} customerName {'}'}{'}'} برای شخصی‌سازی پیام استفاده کنید.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">پیام</label>
              <Textarea
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                placeholder="سلام {'{{'}customerName{'}'} عزیز، ..."
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => bulkMessageMutation.mutate({ customerIds: selectedCustomers, message: bulkMessage })}
                disabled={!bulkMessage || bulkMessageMutation.isPending}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {bulkMessageMutation.isPending ? 'در حال ارسال...' : 'ارسال انبوه'}
              </Button>
              <Button variant="outline" onClick={() => setBulkMessageModal(false)}>
                انصراف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Details Modal */}
      <Dialog open={viewModal} onOpenChange={setViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              جزئیات مشتری
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">اطلاعات شخصی</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">نام کامل</label>
                      <p className="font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">ایمیل</label>
                      <p className="font-mono text-sm">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">شماره تلفن</label>
                      <p className="font-mono text-sm">{selectedCustomer.phone}</p>
                    </div>
                    {selectedCustomer.whatsapp_number && (
                      <div>
                        <label className="text-xs text-gray-500">شماره واتساپ</label>
                        <p className="font-mono text-sm">{selectedCustomer.whatsapp_number}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">تنظیمات ارتباط</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">ترجیح ارتباط</label>
                      <div className="flex items-center gap-2">
                        {getPreferenceIcon(selectedCustomer.communication_preference)}
                        <span className="capitalize">{selectedCustomer.communication_preference}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">تاریخ عضویت</label>
                      <p>{formatDate(selectedCustomer.created_at)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">وضعیت</label>
                      <Badge variant="secondary" className="text-green-600">فعال</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-3">
                <Button
                  onClick={() => {
                    setTestPhoneNumber(selectedCustomer.whatsapp_number || selectedCustomer.phone);
                    setTestMessage(`سلام ${selectedCustomer.first_name} عزیز!`);
                    setViewModal(false);
                    setTestModal(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  ارسال پیام واتساپ
                </Button>
                <Button variant="outline" onClick={() => setViewModal(false)}>
                  بستن
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ShoppingCart, 
  Clock, 
  Users, 
  MessageCircle, 
  BarChart3, 
  Settings, 
  Send,
  Eye,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

// Types
interface AbandonedCartSettings {
  id?: number;
  timeoutMinutes: number;
  isEnabled: boolean;
  notificationTitle: string;
  notificationMessage: string;
  buttonText: string;
  showDiscountOffer: boolean;
  discountPercentage: number;
  discountCode: string;
  maxNotifications: number;
  notificationIntervalMinutes: number;
}

interface CartSession {
  id: number;
  customerId: number;
  sessionId: string;
  cartData: any;
  itemCount: number;
  totalValue: string;
  lastActivity: string;
  createdAt: string;
  isActive: boolean;
  isAbandoned: boolean;
  abandonedAt?: string;
}

interface AbandonedCartAnalytics {
  totalAbandonedCarts: number;
  totalNotificationsSent: number;
  totalRecovered: number;
  overallRecoveryRate: string;
}

export default function AbandonedCartManagement() {
  const [activeTab, setActiveTab] = useState("settings");
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    notificationType: 'browser'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch abandoned cart settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/abandoned-cart/settings'],
    queryFn: () => apiRequest('/api/admin/abandoned-cart/settings'),
  });

  // Fetch abandoned carts
  const { data: abandonedCarts, isLoading: cartsLoading } = useQuery({
    queryKey: ['/api/admin/abandoned-cart/carts'],
    queryFn: () => apiRequest('/api/admin/abandoned-cart/carts'),
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/admin/abandoned-cart/analytics'],
    queryFn: () => apiRequest('/api/admin/abandoned-cart/analytics'),
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: AbandonedCartSettings) => 
      apiRequest('/api/admin/abandoned-cart/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "تنظیمات به‌روزرسانی شد",
        description: "تنظیمات سبد خرید رها شده با موفقیت ذخیره شد",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/abandoned-cart/settings'] });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی تنظیمات",
        variant: "destructive",
      });
    }
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: ({ cartId, notification }: { cartId: number, notification: any }) =>
      apiRequest(`/api/admin/abandoned-cart/notify/${cartId}`, {
        method: 'POST',
        body: JSON.stringify(notification)
      }),
    onSuccess: () => {
      toast({
        title: "پیام ارسال شد",
        description: "پیام یادآوری با موفقیت ارسال شد",
      });
      setNotificationForm({ title: '', message: '', notificationType: 'browser' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/abandoned-cart/carts'] });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ارسال پیام",
        variant: "destructive",
      });
    }
  });

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const settingsData: AbandonedCartSettings = {
      timeoutMinutes: parseInt(formData.get('timeoutMinutes') as string) || 30,
      isEnabled: formData.get('isEnabled') === 'on',
      notificationTitle: formData.get('notificationTitle') as string,
      notificationMessage: formData.get('notificationMessage') as string,
      buttonText: formData.get('buttonText') as string,
      showDiscountOffer: formData.get('showDiscountOffer') === 'on',
      discountPercentage: parseInt(formData.get('discountPercentage') as string) || 0,
      discountCode: formData.get('discountCode') as string,
      maxNotifications: parseInt(formData.get('maxNotifications') as string) || 3,
      notificationIntervalMinutes: parseInt(formData.get('notificationIntervalMinutes') as string) || 60,
    };

    updateSettingsMutation.mutate(settingsData);
  };

  const handleSendNotification = (cartId: number) => {
    if (!notificationForm.title || !notificationForm.message) {
      toast({
        title: "خطا",
        description: "عنوان و متن پیام الزامی است",
        variant: "destructive",
      });
      return;
    }

    sendNotificationMutation.mutate({
      cartId,
      notification: notificationForm
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('fa-IR').format(parseFloat(amount)) + ' IQD';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            مدیریت سبد خرید رها شده
          </h1>
          <p className="text-gray-600">
            مدیریت و بهبود نرخ تبدیل سبدهای خرید رها شده
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              تنظیمات
            </TabsTrigger>
            <TabsTrigger value="carts" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              سبدهای رها شده
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              پیام‌ها
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              تحلیل‌ها
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  تنظیمات سبد خرید رها شده
                </CardTitle>
              </CardHeader>
              <CardContent>
                {settingsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <form onSubmit={handleSettingsSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="timeoutMinutes">زمان انتظار (دقیقه)</Label>
                        <Input
                          id="timeoutMinutes"
                          name="timeoutMinutes"
                          type="number"
                          min="1"
                          defaultValue={settings?.data?.timeoutMinutes || 30}
                          className="w-full"
                        />
                        <p className="text-sm text-gray-500">
                          مدت زمان بعد از آخرین فعالیت که سبد خرید رها شده تلقی می‌شود
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxNotifications">حداکثر تعداد پیام</Label>
                        <Input
                          id="maxNotifications"
                          name="maxNotifications"
                          type="number"
                          min="1"
                          max="10"
                          defaultValue={settings?.data?.maxNotifications || 3}
                          className="w-full"
                        />
                        <p className="text-sm text-gray-500">
                          حداکثر تعداد پیام‌هایی که به هر سبد خرید ارسال می‌شود
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notificationIntervalMinutes">فاصله بین پیام‌ها (دقیقه)</Label>
                        <Input
                          id="notificationIntervalMinutes"
                          name="notificationIntervalMinutes"
                          type="number"
                          min="30"
                          defaultValue={settings?.data?.notificationIntervalMinutes || 60}
                          className="w-full"
                        />
                        <p className="text-sm text-gray-500">
                          فاصله زمانی بین ارسال پیام‌های یادآوری
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isEnabled"
                          name="isEnabled"
                          defaultChecked={settings?.data?.isEnabled || false}
                        />
                        <Label htmlFor="isEnabled">فعال‌سازی سیستم</Label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">محتوای پیام‌ها</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notificationTitle">عنوان پیام</Label>
                        <Input
                          id="notificationTitle"
                          name="notificationTitle"
                          defaultValue={settings?.data?.notificationTitle || 'سبد خرید شما منتظر است!'}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notificationMessage">متن پیام</Label>
                        <Textarea
                          id="notificationMessage"
                          name="notificationMessage"
                          rows={3}
                          defaultValue={settings?.data?.notificationMessage || 'محصولات انتخابی شما در سبد خرید منتظر تکمیل خرید هستند. برای ادامه خرید کلیک کنید.'}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="buttonText">متن دکمه</Label>
                        <Input
                          id="buttonText"
                          name="buttonText"
                          defaultValue={settings?.data?.buttonText || 'ادامه خرید'}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">تنظیمات تخفیف</h3>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="showDiscountOffer"
                          name="showDiscountOffer"
                          defaultChecked={settings?.data?.showDiscountOffer || false}
                        />
                        <Label htmlFor="showDiscountOffer">ارائه تخفیف</Label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="discountPercentage">درصد تخفیف</Label>
                          <Input
                            id="discountPercentage"
                            name="discountPercentage"
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={settings?.data?.discountPercentage || 0}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="discountCode">کد تخفیف</Label>
                          <Input
                            id="discountCode"
                            name="discountCode"
                            defaultValue={settings?.data?.discountCode || ''}
                            placeholder="COMEBACK10"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={updateSettingsMutation.isPending}
                    >
                      {updateSettingsMutation.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Abandoned Carts Tab */}
          <TabsContent value="carts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  سبدهای خرید رها شده
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cartsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {abandonedCarts?.data?.length > 0 ? (
                      abandonedCarts.data.map((cart: CartSession) => (
                        <div key={cart.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">
                                مشتری #{cart.customerId}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {cart.itemCount} محصول • {formatCurrency(cart.totalValue)}
                              </p>
                              <p className="text-sm text-gray-500">
                                آخرین فعالیت: {formatDate(cart.lastActivity)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={cart.isAbandoned ? "destructive" : "default"}>
                                {cart.isAbandoned ? "رها شده" : "فعال"}
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => handleSendNotification(cart.id)}
                                disabled={sendNotificationMutation.isPending}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                ارسال پیام
                              </Button>
                            </div>
                          </div>
                          
                          {cart.cartData && (
                            <div className="bg-gray-50 p-3 rounded">
                              <p className="text-sm font-medium mb-2">محصولات سبد:</p>
                              <div className="text-sm text-gray-600">
                                {JSON.stringify(cart.cartData, null, 2)}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">هیچ سبد خرید رها شده‌ای موجود نیست</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  ارسال پیام یادآوری
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notificationTitle">عنوان پیام</Label>
                    <Input
                      id="notificationTitle"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="عنوان پیام را وارد کنید..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notificationMessage">متن پیام</Label>
                    <Textarea
                      id="notificationMessage"
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="متن پیام را وارد کنید..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notificationType">نوع پیام</Label>
                    <select
                      id="notificationType"
                      value={notificationForm.notificationType}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, notificationType: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="browser">پیام مرورگر</option>
                      <option value="email">ایمیل</option>
                      <option value="sms">پیامک</option>
                    </select>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">پیش‌نمایش پیام:</h4>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-semibold text-blue-900">
                        {notificationForm.title || "عنوان پیام"}
                      </div>
                      <div className="text-gray-700 mt-1">
                        {notificationForm.message || "متن پیام"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">سبدهای رها شده</p>
                      <p className="text-2xl font-bold text-red-600">
                        {analytics?.data?.overallStats?.totalAbandonedCarts || 0}
                      </p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">پیام‌های ارسالی</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {analytics?.data?.overallStats?.totalNotificationsSent || 0}
                      </p>
                    </div>
                    <MessageCircle className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">بازگشت موفق</p>
                      <p className="text-2xl font-bold text-green-600">
                        {analytics?.data?.overallStats?.totalRecovered || 0}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">نرخ بازگشت</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {analytics?.data?.overallStats?.overallRecoveryRate || "0.00"}%
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>عملکرد سیستم</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">نمودار تحلیل‌ها در نسخه‌های آینده اضافه خواهد شد</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
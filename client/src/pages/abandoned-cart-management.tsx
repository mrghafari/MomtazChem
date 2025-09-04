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
import { useLanguage } from "@/contexts/LanguageContext";
import { getMultilingualMessage } from "@/components/multilingual-messages";
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
  const { t, language } = useLanguage();

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
        body: data
      }),
    onSuccess: () => {
      toast({
        title: getMultilingualMessage(language, 'settings_updated'),
        description: getMultilingualMessage(language, 'settings_saved_successfully'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/abandoned-cart/settings'] });
    },
    onError: () => {
      toast({
        title: getMultilingualMessage(language, 'error'),
        description: getMultilingualMessage(language, 'error_updating_settings'),
        variant: "destructive",
      });
    }
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: ({ cartId, notification }: { cartId: number, notification: any }) =>
      apiRequest(`/api/admin/abandoned-cart/notify/${cartId}`, {
        method: 'POST',
        body: notification
      }),
    onSuccess: () => {
      toast({
        title: getMultilingualMessage(language, 'notification_sent'),
        description: getMultilingualMessage(language, 'notification_sent_successfully'),
      });
      setNotificationForm({ title: '', message: '', notificationType: 'browser' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/abandoned-cart/carts'] });
    },
    onError: () => {
      toast({
        title: getMultilingualMessage(language, 'error'),
        description: getMultilingualMessage(language, 'error_sending_notification'),
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
        title: getMultilingualMessage(language, 'error'),
        description: language === 'fa' ? "عنوان و متن پیام الزامی است" : language === 'ar' ? "عنوان الإشعار والرسالة مطلوبان" : language === 'ku' ? "ناونیشان و دەقی پەیام پێویستە" : "Notification title and message are required",
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
            {getMultilingualMessage(language, 'abandoned_cart_title')}
          </h1>
          <p className="text-gray-600">
            {language === 'fa' ? 'مدیریت و بهبود نرخ تبدیل سبدهای خرید رها شده' : language === 'ar' ? 'إدارة وتحسين معدل تحويل السلال المهجورة' : language === 'ku' ? 'بەڕێوەبەرایەتی و باشترکردنی ڕێژەی گۆڕینی سەبەتە بەجێهێڵراوەکان' : 'Manage and improve abandoned cart conversion rates'}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {getMultilingualMessage(language, 'abandoned_cart_settings')}
            </TabsTrigger>
            <TabsTrigger value="carts" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {getMultilingualMessage(language, 'abandoned_carts')}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {language === 'fa' ? 'پیام‌ها' : language === 'ar' ? 'الرسائل' : language === 'ku' ? 'پەیامەکان' : 'Messages'}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {getMultilingualMessage(language, 'analytics')}
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {getMultilingualMessage(language, 'abandoned_cart_settings')}
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
                        <Label htmlFor="timeoutMinutes">{getMultilingualMessage(language, 'timeout_minutes')}</Label>
                        <Input
                          id="timeoutMinutes"
                          name="timeoutMinutes"
                          type="number"
                          min="1"
                          defaultValue={settings?.data?.timeoutMinutes || 30}
                          className="w-full"
                        />
                        <p className="text-sm text-gray-500">
                          {language === 'fa' ? 'مدت زمان بعد از آخرین فعالیت که سبد خرید رها شده تلقی می‌شود' : language === 'ar' ? 'المدة الزمنية بعد آخر نشاط يعتبر فيها السلة مهجورة' : language === 'ku' ? 'ماوەی کاتی دوای دوایین چالاکی کە سەبەتە بە بەجێهێڵراو دادەنرێت' : 'Time after last activity when cart is considered abandoned'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxNotifications">{getMultilingualMessage(language, 'max_notifications')}</Label>
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
                          {language === 'fa' ? 'حداکثر تعداد پیام‌هایی که به هر سبد خرید ارسال می‌شود' : language === 'ar' ? 'الحد الأقصى لعدد الرسائل التي يتم إرسالها لكل سلة' : language === 'ku' ? 'زۆرترین ژمارەی پەیام کە بۆ هەر سەبەتێک دەنێردرێت' : 'Maximum number of messages sent to each cart'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notificationIntervalMinutes">{getMultilingualMessage(language, 'notification_interval')}</Label>
                        <Input
                          id="notificationIntervalMinutes"
                          name="notificationIntervalMinutes"
                          type="number"
                          min="30"
                          defaultValue={settings?.data?.notificationIntervalMinutes || 60}
                          className="w-full"
                        />
                        <p className="text-sm text-gray-500">
                          {language === 'fa' ? 'فاصله زمانی بین ارسال پیام‌های یادآوری' : language === 'ar' ? 'الفترة الزمنية بين إرسال الرسائل التذكيرية' : language === 'ku' ? 'ماوەی کاتی لە نێوان ناردنی پەیامە یادەوەری‌یەکان' : 'Time interval between reminder messages'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isEnabled"
                          name="isEnabled"
                          defaultChecked={settings?.data?.isEnabled || false}
                        />
                        <Label htmlFor="isEnabled">{getMultilingualMessage(language, 'enable_abandoned_cart_recovery')}</Label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        {language === 'fa' ? 'محتوای پیام‌ها' : language === 'ar' ? 'محتوى الرسائل' : language === 'ku' ? 'ناوەڕۆکی پەیامەکان' : 'Message Content'}
                      </h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notificationTitle">{getMultilingualMessage(language, 'notification_title')}</Label>
                        <Input
                          id="notificationTitle"
                          name="notificationTitle"
                          defaultValue={settings?.data?.notificationTitle || getMultilingualMessage(language, 'default_notification_title')}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notificationMessage">{getMultilingualMessage(language, 'notification_message')}</Label>
                        <Textarea
                          id="notificationMessage"
                          name="notificationMessage"
                          rows={3}
                          defaultValue={settings?.data?.notificationMessage || getMultilingualMessage(language, 'default_notification_message')}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="buttonText">{getMultilingualMessage(language, 'button_text')}</Label>
                        <Input
                          id="buttonText"
                          name="buttonText"
                          defaultValue={settings?.data?.buttonText || getMultilingualMessage(language, 'default_button_text')}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        {language === 'fa' ? 'تنظیمات تخفیف' : language === 'ar' ? 'إعدادات الخصم' : language === 'ku' ? 'ڕێکخستنەکانی داشکاندن' : 'Discount Settings'}
                      </h3>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="showDiscountOffer"
                          name="showDiscountOffer"
                          defaultChecked={settings?.data?.showDiscountOffer || false}
                        />
                        <Label htmlFor="showDiscountOffer">{getMultilingualMessage(language, 'show_discount_offer')}</Label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="discountPercentage">{getMultilingualMessage(language, 'discount_percentage')}</Label>
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
                          <Label htmlFor="discountCode">{getMultilingualMessage(language, 'discount_code')}</Label>
                          <Input
                            id="discountCode"
                            name="discountCode"
                            defaultValue={settings?.data?.discountCode || ''}
                            placeholder={getMultilingualMessage(language, 'default_discount_code')}
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
                      {updateSettingsMutation.isPending ? 
                        (language === 'fa' ? "در حال ذخیره..." : language === 'ar' ? "جاري الحفظ..." : language === 'ku' ? "لە پاشەکەوتکردن..." : "Saving...") : 
                        getMultilingualMessage(language, 'save_settings')
                      }
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
                  {getMultilingualMessage(language, 'abandoned_carts')}
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
                                {getMultilingualMessage(language, 'customer')} #{cart.customerId}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {cart.itemCount} {getMultilingualMessage(language, 'items')} • {formatCurrency(cart.totalValue)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {getMultilingualMessage(language, 'last_activity')}: {formatDate(cart.lastActivity)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={cart.isAbandoned ? "destructive" : "default"}>
                                {cart.isAbandoned ? 
                                  (language === 'fa' ? 'رها شده' : language === 'ar' ? 'مهجور' : language === 'ku' ? 'بەجێهێڵراو' : 'Abandoned') : 
                                  (language === 'fa' ? 'فعال' : language === 'ar' ? 'نشط' : language === 'ku' ? 'چالاک' : 'Active')
                                }
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => handleSendNotification(cart.id)}
                                disabled={sendNotificationMutation.isPending}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                {getMultilingualMessage(language, 'send_notification')}
                              </Button>
                            </div>
                          </div>
                          
                          {cart.cartData && (
                            <div className="bg-gray-50 p-3 rounded">
                              <p className="text-sm font-medium mb-2">
                                {language === 'fa' ? 'محصولات سبد:' : language === 'ar' ? 'منتجات السلة:' : language === 'ku' ? 'بەرهەمەکانی سەبەتە:' : 'Cart Products:'}
                              </p>
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
                        <p className="text-gray-500">
                          {language === 'fa' ? 'هیچ سبد خرید رها شده‌ای موجود نیست' : language === 'ar' ? 'لا توجد سلات مهجورة' : language === 'ku' ? 'هیچ سەبەتێکی بەجێهێڵراو نییە' : 'No abandoned carts found'}
                        </p>
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
                  {language === 'fa' ? 'ارسال پیام یادآوری' : language === 'ar' ? 'إرسال رسالة تذكير' : language === 'ku' ? 'ناردنی پەیامی یادەوەری' : 'Send Reminder Message'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notificationTitle">{getMultilingualMessage(language, 'notification_title')}</Label>
                    <Input
                      id="notificationTitle"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={
                        language === 'fa' ? 'عنوان پیام را وارد کنید...' : 
                        language === 'ar' ? 'أدخل عنوان الرسالة...' : 
                        language === 'ku' ? 'ناونیشانی پەیام بنووسە...' : 
                        'Enter message title...'
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notificationMessage">{getMultilingualMessage(language, 'notification_message')}</Label>
                    <Textarea
                      id="notificationMessage"
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder={
                        language === 'fa' ? 'متن پیام را وارد کنید...' : 
                        language === 'ar' ? 'أدخل نص الرسالة...' : 
                        language === 'ku' ? 'دەقی پەیام بنووسە...' : 
                        'Enter message text...'
                      }
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notificationType">
                      {language === 'fa' ? 'نوع پیام' : language === 'ar' ? 'نوع الرسالة' : language === 'ku' ? 'جۆری پەیام' : 'Message Type'}
                    </Label>
                    <select
                      id="notificationType"
                      value={notificationForm.notificationType}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, notificationType: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="browser">
                        {language === 'fa' ? 'پیام مرورگر' : language === 'ar' ? 'رسالة المتصفح' : language === 'ku' ? 'پەیامی گەڕۆک' : 'Browser Message'}
                      </option>
                      <option value="email">
                        {language === 'fa' ? 'ایمیل' : language === 'ar' ? 'بريد إلكتروني' : language === 'ku' ? 'ئیمەیل' : 'Email'}
                      </option>
                      <option value="sms">
                        {language === 'fa' ? 'پیامک' : language === 'ar' ? 'رسالة نصية' : language === 'ku' ? 'پەیامی دەقی' : 'SMS'}
                      </option>
                      <option value="whatsapp">
                        {language === 'fa' ? 'واتساپ' : language === 'ar' ? 'واتساب' : language === 'ku' ? 'واتساپ' : 'WhatsApp'}
                      </option>
                    </select>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">
                      {language === 'fa' ? 'پیش‌نمایش پیام:' : language === 'ar' ? 'معاينة الرسالة:' : language === 'ku' ? 'پێشبینینی پەیام:' : 'Message Preview:'}
                    </h4>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-semibold text-blue-900">
                        {notificationForm.title || getMultilingualMessage(language, 'notification_title')}
                      </div>
                      <div className="text-gray-700 mt-1">
                        {notificationForm.message || getMultilingualMessage(language, 'notification_message')}
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
                      <p className="text-sm font-medium text-gray-600">
                        {language === 'fa' ? 'سبدهای رها شده' : language === 'ar' ? 'السلات المهجورة' : language === 'ku' ? 'سەبەتە بەجێهێڵراوەکان' : 'Abandoned Carts'}
                      </p>
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
                      <p className="text-sm font-medium text-gray-600">
                        {language === 'fa' ? 'پیام‌های ارسالی' : language === 'ar' ? 'الرسائل المرسلة' : language === 'ku' ? 'پەیامە نێردراوەکان' : 'Messages Sent'}
                      </p>
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
                      <p className="text-sm font-medium text-gray-600">
                        {language === 'fa' ? 'بازگشت موفق' : language === 'ar' ? 'الاسترداد الناجح' : language === 'ku' ? 'گەڕانەوەی سەرکەوتوو' : 'Successfully Recovered'}
                      </p>
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
                      <p className="text-sm font-medium text-gray-600">
                        {language === 'fa' ? 'نرخ بازگشت' : language === 'ar' ? 'معدل الاسترداد' : language === 'ku' ? 'ڕێژەی گەڕانەوە' : 'Recovery Rate'}
                      </p>
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
                <CardTitle>
                  {language === 'fa' ? 'عملکرد سیستم' : language === 'ar' ? 'أداء النظام' : language === 'ku' ? 'کارایی سیستەم' : 'System Performance'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      {language === 'fa' ? 'نمودار تحلیل‌ها در نسخه‌های آینده اضافه خواهد شد' : 
                       language === 'ar' ? 'ستتم إضافة رسوم التحليل في الإصدارات المستقبلية' : 
                       language === 'ku' ? 'هێمای تەحلیل لە وەشانەکانی دواتر زیاد دەکرێت' : 
                       'Analytics charts will be added in future versions'}
                    </p>
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
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Bell, 
  Settings, 
  BarChart3, 
  Search,
  Archive,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Truck,
  Loader
} from "lucide-react";

// Import existing components
import InventoryAlerts from "@/pages/admin/inventory-alerts";
import InventoryNotificationSettings from "@/pages/admin/inventory-notification-settings";

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState("overview");

  // Query for goods in transit
  const { data: goodsInTransit, isLoading: transitLoading, refetch: refetchTransit } = useQuery({
    queryKey: ['/api/shop/goods-in-transit'],
    refetchInterval: 30000
  });

  // Query for inventory movements
  const { data: inventoryMovements, isLoading: movementsLoading } = useQuery({
    queryKey: ['/api/shop/inventory-movements'],
    refetchInterval: 30000
  });

  // Mutation for marking goods as delivered
  const markAsDeliveredMutation = useMutation({
    mutationFn: async (transitId: number) => {
      const response = await fetch(`/api/shop/goods-in-transit/${transitId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'delivered',
          actualDeliveryDate: new Date(),
        }),
      });
      if (!response.ok) {
        throw new Error('خطا در تحویل کالا');
      }
      return response.json();
    },
    onSuccess: () => {
      if (refetchTransit) {
        refetchTransit();
      }
    },
    onError: (error: any) => {
      console.error('Error marking as delivered:', error);
    },
  });

  const handleMarkAsDelivered = (transitId: number) => {
    markAsDeliveredMutation.mutate(transitId);
  };

  const inventoryStats = {
    totalProducts: 25,
    lowStockProducts: 3,
    outOfStockProducts: 1,
    activeAlerts: 4,
    notificationsSent: 12,
    goodsInTransit: goodsInTransit?.filter((item: any) => item.status === 'in_transit')?.length || 0,
    transitValue: goodsInTransit?.filter((item: any) => item.status === 'in_transit')
      ?.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0) || 0,
    lastUpdateTime: new Date().toLocaleString('fa-IR')
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مدیریت موجودی</h1>
          <p className="text-gray-600 mt-2">
            مدیریت کامل موجودی، هشدارها و اطلاع‌رسانی‌های خودکار
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            آخرین بروزرسانی: {inventoryStats.lastUpdateTime}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">کل محصولات</p>
                <p className="text-2xl font-bold text-blue-600">{inventoryStats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">موجودی کم</p>
                <p className="text-2xl font-bold text-orange-600">{inventoryStats.lowStockProducts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">اتمام موجودی</p>
                <p className="text-2xl font-bold text-red-600">{inventoryStats.outOfStockProducts}</p>
              </div>
              <Archive className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">هشدارهای فعال</p>
                <p className="text-2xl font-bold text-purple-600">{inventoryStats.activeAlerts}</p>
              </div>
              <Bell className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">کالای در راه</p>
                <p className="text-2xl font-bold text-orange-600">{inventoryStats.goodsInTransit}</p>
                <p className="text-xs text-gray-500">
                  {transitLoading ? 'در حال بارگیری...' : `${inventoryStats.transitValue.toLocaleString()} دینار`}
                </p>
              </div>
              <Truck className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            نمای کلی
          </TabsTrigger>
          <TabsTrigger value="transit" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            کالای در راه
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            هشدارها
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            تنظیمات
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            آنالیز
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Archive className="w-4 h-4" />
            گزارشات
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            اتوماسیون
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  فعالیت‌های اخیر
                </CardTitle>
                <CardDescription>
                  آخرین تغییرات موجودی و هشدارها
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">هشدار موجودی کم</p>
                    <p className="text-xs text-gray-600">تینر فوری 10000 - موجودی: 2 واحد</p>
                  </div>
                  <Badge variant="destructive">فوری</Badge>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Bell className="w-5 h-5 text-orange-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">ارسال اطلاع‌رسانی</p>
                    <p className="text-xs text-gray-600">به 3 مخاطب ایمیل ارسال شد</p>
                  </div>
                  <Badge variant="secondary">ارسال شده</Badge>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">بروزرسانی موجودی</p>
                    <p className="text-xs text-gray-600">محصول جدید اضافه شد</p>
                  </div>
                  <Badge variant="outline">تکمیل شده</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  عملیات سریع
                </CardTitle>
                <CardDescription>
                  دسترسی سریع به عملکردهای مهم
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("alerts")}
                >
                  <Bell className="w-4 h-4" />
                  مشاهده همه هشدارها
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="w-4 h-4" />
                  تنظیمات اطلاع‌رسانی
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("analytics")}
                >
                  <TrendingUp className="w-4 h-4" />
                  گزارش عملکرد
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("reports")}
                >
                  <Archive className="w-4 h-4" />
                  دانلود گزارشات
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>وضعیت سیستم</CardTitle>
              <CardDescription>
                وضعیت کلی سیستم مدیریت موجودی
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-900">سیستم اطلاع‌رسانی</p>
                    <p className="text-sm text-green-600">فعال و عملیاتی</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Bell className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="font-medium text-blue-900">پایش موجودی</p>
                    <p className="text-sm text-blue-600">در حال بررسی</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-500" />
                  <div>
                    <p className="font-medium text-purple-900">مخاطبین</p>
                    <p className="text-sm text-purple-600">5 مخاطب فعال</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transit" className="space-y-6">
          <div className="space-y-6">
            {/* Transit Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">موارد در راه</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {goodsInTransit?.filter((item: any) => item.status === 'in_transit')?.length || 0}
                      </p>
                    </div>
                    <Truck className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">ارزش کل</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {(goodsInTransit?.filter((item: any) => item.status === 'in_transit')
                          ?.reduce((sum: number, item: any) => sum + (item.totalAmount || 0), 0) || 0).toLocaleString()} دینار
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">تحویل شده</p>
                      <p className="text-2xl font-bold text-green-600">
                        {goodsInTransit?.filter((item: any) => item.status === 'delivered')?.length || 0}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transit Items List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  کالاهای در راه
                </CardTitle>
                <CardDescription>
                  مدیریت کالاهای در راه به مشتریان
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transitLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-gray-500" />
                    <span className="ml-2 text-gray-500">در حال بارگیری...</span>
                  </div>
                ) : goodsInTransit && goodsInTransit.length > 0 ? (
                  <div className="space-y-4">
                    {goodsInTransit.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-lg">{item.productName}</h3>
                              <Badge variant={item.status === 'in_transit' ? 'default' : 'secondary'}>
                                {item.status === 'in_transit' ? 'در راه' : 'تحویل شده'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">کد سفارش:</span> {item.orderId}
                              </div>
                              <div>
                                <span className="font-medium">مقدار:</span> {item.quantity}
                              </div>
                              <div>
                                <span className="font-medium">مبلغ کل:</span> {(item.totalAmount || 0).toLocaleString()} دینار
                              </div>
                              <div>
                                <span className="font-medium">تاریخ:</span> {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                              </div>
                            </div>
                            {item.notes && (
                              <p className="text-sm text-gray-500 mt-2">
                                <span className="font-medium">یادداشت:</span> {item.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {item.status === 'in_transit' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleMarkAsDelivered(item.id)}
                                disabled={markAsDeliveredMutation.isPending}
                              >
                                {markAsDeliveredMutation.isPending ? 'در حال تحویل...' : 'تحویل شد'}
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              جزئیات
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    هیچ کالایی در راه نیست
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <InventoryAlerts />
        </TabsContent>

        <TabsContent value="settings">
          <InventoryNotificationSettings />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>آنالیز عملکرد موجودی</CardTitle>
              <CardDescription>
                تحلیل روند موجودی و هشدارها
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">در حال توسعه</p>
              <p className="text-sm text-gray-500">
                آنالیز دقیق روند موجودی، الگوهای مصرف و پیش‌بینی نیاز
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>گزارشات موجودی</CardTitle>
              <CardDescription>
                دانلود گزارشات تفصیلی موجودی
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">در حال توسعه</p>
              <p className="text-sm text-gray-500">
                گزارشات کامل موجودی، تاریخچه تغییرات و آمار عملکرد
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اتوماسیون موجودی</CardTitle>
              <CardDescription>
                تنظیمات خودکارسازی فرآیندها
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">در حال توسعه</p>
              <p className="text-sm text-gray-500">
                خودکارسازی سفارش‌گیری، تخصیص موجودی و بازسازی انبار
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
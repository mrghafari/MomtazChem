import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard,
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  Settings,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Monitor
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";


// Summary Card Component
const SummaryCard = ({ 
  title, 
  value, 
  subtitle = "", 
  change, 
  changeType = "increase", 
  icon, 
  color = "bg-blue-500" 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeType?: "increase" | "decrease";
  icon: React.ReactNode;
  color?: string;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-sm text-muted-foreground mr-2">{subtitle}</p>}
          </div>
          {change !== undefined && (
            <p className={`text-xs ${changeType === "increase" ? "text-green-600" : "text-red-600"} flex items-center`}>
              {changeType === "increase" ? (
                <TrendingUp className="w-3 h-3 ml-1" />
              ) : (
                <TrendingDown className="w-3 h-3 ml-1" />
              )}
              {Math.abs(change)}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Quick Action Widget Component
const QuickActionWidget = ({ 
  title, 
  description, 
  icon, 
  color = "bg-blue-500", 
  count, 
  onClick 
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
  count?: number;
  onClick?: () => void;
}) => (
  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{description}</p>
          {count && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {count} مورد
            </Badge>
          )}
        </div>
        <div className={`p-2 rounded-lg ${color} flex-shrink-0 mr-3`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const ManagementDashboard = () => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['/api/management/dashboard'],
    staleTime: 300000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch system health data
  const { data: systemHealth } = useQuery({
    queryKey: ['/api/management/system-health'],
    staleTime: 60000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  });

  const refreshData = () => {
    refetch();
    setLastUpdated(new Date());
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">غیر مجاز</h2>
          <p className="text-gray-600">لطفاً وارد شوید</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/admin/site-management")}
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              بازگشت به مدیریت سایت
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                داشبورد مدیریتی
              </h1>
              <p className="text-gray-600 mt-1">
                مرکز کنترل و مدیریت سیستم‌های کسب‌وکار
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500">
              آخرین بروزرسانی: {lastUpdated.toLocaleTimeString('fa-IR')}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 ml-2" />
              تنظیمات
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نمای کلی</TabsTrigger>
            <TabsTrigger value="operations">عملیات</TabsTrigger>
            <TabsTrigger value="analytics">تحلیل‌ها</TabsTrigger>
            <TabsTrigger value="system">سیستم</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  <span className="mr-3">در حال بارگذاری...</span>
                </div>
              ) : (
                <>
                  {/* Key Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard
                      title="فروش امروز"
                      value={dashboardData?.data?.summary?.dailySales?.toLocaleString('fa-IR') || '0'}
                      subtitle="تومان"
                      change={12.5}
                      changeType="increase"
                      icon={<DollarSign className="w-4 h-4 text-white" />}
                      color="bg-green-500"
                    />
                    <SummaryCard
                      title="سفارشات فعال"
                      value={dashboardData?.data?.summary?.activeOrders || '0'}
                      change={-5.2}
                      changeType="decrease"
                      icon={<ShoppingCart className="w-4 h-4 text-white" />}
                      color="bg-blue-500"
                    />
                    <SummaryCard
                      title="مشتریان آنلاین"
                      value={dashboardData?.data?.summary?.onlineCustomers || '0'}
                      change={8.1}
                      changeType="increase"
                      icon={<Users className="w-4 h-4 text-white" />}
                      color="bg-purple-500"
                    />
                    <SummaryCard
                      title="هشدارهای سیستم"
                      value={dashboardData?.data?.summary?.systemAlerts || '0'}
                      icon={<AlertTriangle className="w-4 h-4 text-white" />}
                      color="bg-red-500"
                    />
                  </div>

                  {/* Quick Actions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickActionWidget
                      title="مدیریت سفارشات"
                      description="بررسی و پردازش سفارشات جدید"
                      icon={<ShoppingCart className="w-5 h-5 text-white" />}
                      color="bg-blue-500"
                      count={dashboardData?.data?.quickStats?.orderStatuses?.pending || 0}
                      onClick={() => setLocation("/admin/shop-admin")}
                    />
                    <QuickActionWidget
                      title="مدیریت موجودی"
                      description="کنترل انبار و موجودی محصولات"
                      icon={<Package className="w-5 h-5 text-white" />}
                      color="bg-green-500"
                      onClick={() => setLocation("/admin/warehouse-department")}
                    />
                    <QuickActionWidget
                      title="گزارشات مالی"
                      description="مشاهده گزارشات فروش و درآمد"
                      icon={<BarChart3 className="w-5 h-5 text-white" />}
                      color="bg-orange-500"
                      onClick={() => setLocation("/admin/financial-workflow")}
                    />
                    <QuickActionWidget
                      title="تنظیمات ایمیل"
                      description="مدیریت سیستم ایمیل و اطلاع‌رسانی"
                      icon={<Settings className="w-5 h-5 text-white" />}
                      color="bg-red-500"
                      onClick={() => setLocation("/admin/email-settings")}
                    />
                  </div>


                </>
              )}
            </div>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">وضعیت سفارشات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">در انتظار تایید</span>
                        <Badge variant="secondary">{dashboardData?.data?.quickStats?.orderStatuses?.pending || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">در حال پردازش</span>
                        <Badge variant="default">{dashboardData?.data?.quickStats?.orderStatuses?.processing || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">آماده ارسال</span>
                        <Badge variant="outline">{dashboardData?.data?.quickStats?.orderStatuses?.readyToShip || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">تحویل شده</span>
                        <Badge className="bg-green-500">{dashboardData?.data?.quickStats?.orderStatuses?.delivered || 0}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">عملکرد بخش‌ها</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>مالی</span>
                          <span>{dashboardData?.data?.quickStats?.departmentPerformance?.finance || 0}%</span>
                        </div>
                        <Progress value={dashboardData?.data?.quickStats?.departmentPerformance?.finance || 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>انبار</span>
                          <span>{dashboardData?.data?.quickStats?.departmentPerformance?.warehouse || 0}%</span>
                        </div>
                        <Progress value={dashboardData?.data?.quickStats?.departmentPerformance?.warehouse || 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>لجستیک</span>
                          <span>{dashboardData?.data?.quickStats?.departmentPerformance?.logistics || 0}%</span>
                        </div>
                        <Progress value={dashboardData?.data?.quickStats?.departmentPerformance?.logistics || 0} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">موجودی بحرانی</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboardData?.data?.quickStats?.criticalInventory?.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-gray-500">موجودی: {item.stock}</p>
                          </div>
                          <Badge 
                            variant={item.status === 'critical' ? 'destructive' : 
                                   item.status === 'low' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {item.status === 'critical' ? 'بحرانی' : 
                             item.status === 'low' ? 'کم' : 'هشدار'}
                          </Badge>
                        </div>
                      )) || (
                        <div className="text-center py-4 text-gray-500">
                          <Package className="w-6 h-6 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">موجودی بحرانی یافت نشد</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>آمار فروش</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">چارت آمار فروش</p>
                      <p className="text-sm text-gray-400">در دست توسعه</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>تحلیل مشتریان</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">آمار مشتریان</p>
                      <p className="text-sm text-gray-400">در دست توسعه</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <Monitor className="w-4 h-4 ml-2" />
                      وضعیت سرور
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">پردازنده</span>
                        <span className="text-sm font-medium">{systemHealth?.data?.server?.cpu || 0}%</span>
                      </div>
                      <Progress value={systemHealth?.data?.server?.cpu || 0} className="h-2" />
                      
                      <div className="flex justify-between">
                        <span className="text-sm">حافظه</span>
                        <span className="text-sm font-medium">{systemHealth?.data?.server?.memory || 0}%</span>
                      </div>
                      <Progress value={systemHealth?.data?.server?.memory || 0} className="h-2" />
                      
                      <div className="flex justify-between">
                        <span className="text-sm">دیسک</span>
                        <span className="text-sm font-medium">{systemHealth?.data?.server?.disk || 0}%</span>
                      </div>
                      <Progress value={systemHealth?.data?.server?.disk || 0} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">سرویس‌های سیستم</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">دیتابیس</span>
                        <Badge className={systemHealth?.data?.services?.database === 'online' ? 'bg-green-500' : 'bg-red-500'}>
                          {systemHealth?.data?.services?.database || 'نامشخص'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">ایمیل</span>
                        <Badge className={systemHealth?.data?.services?.email === 'online' ? 'bg-green-500' : 'bg-red-500'}>
                          {systemHealth?.data?.services?.email || 'نامشخص'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">پیامک</span>
                        <Badge className={systemHealth?.data?.services?.sms === 'online' ? 'bg-green-500' : 
                                         systemHealth?.data?.services?.sms === 'limited' ? 'bg-yellow-500' : 'bg-red-500'}>
                          {systemHealth?.data?.services?.sms || 'نامشخص'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">پشتیبان‌گیری</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">آخرین پشتیبان</span>
                        <span className="text-sm font-medium">{systemHealth?.data?.backup?.lastBackup || 'نامشخص'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">وضعیت</span>
                        <Badge className={systemHealth?.data?.backup?.status === 'success' ? 'bg-green-500' : 'bg-red-500'}>
                          {systemHealth?.data?.backup?.status === 'success' ? 'موفق' : 'ناموفق'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">بعدی</span>
                        <span className="text-sm font-medium">{systemHealth?.data?.backup?.nextScheduled || 'نامشخص'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ManagementDashboard;
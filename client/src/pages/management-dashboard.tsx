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
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Monitor
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Quick Action Widget Component
interface QuickActionWidgetProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  count?: number;
}

const QuickActionWidget: React.FC<QuickActionWidgetProps> = ({ 
  title, 
  description, 
  icon, 
  color,
  onClick,
  count 
}) => {
  return (
    <Card className="hover:shadow-md transition-all cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className={`p-3 rounded-lg ${color}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-gray-600 text-sm mt-1">{description}</p>
            {count !== undefined && (
              <Badge variant="secondary" className="mt-2">
                {count} مورد
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Management Summary Card
interface SummaryCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  color,
  subtitle 
}) => {
  const getChangeIcon = () => {
    if (changeType === 'increase') return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (changeType === 'decrease') return <TrendingDown className="w-3 h-3 text-red-500" />;
    return null;
  };

  const getChangeColor = () => {
    if (changeType === 'increase') return 'text-green-600';
    if (changeType === 'decrease') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">{value}</div>
        {subtitle && <p className="text-xs text-gray-500 mb-2">{subtitle}</p>}
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="ml-1">{change > 0 ? '+' : ''}{change}%</span>
            <span className="ml-1 text-gray-500">نسبت به دیروز</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function ManagementDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['/api/management/dashboard'],
    staleTime: 30000,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  const { data: systemHealth, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/management/system-health'],
    staleTime: 60000,
  });

  const refreshData = async () => {
    await refetch();
    setLastUpdated(new Date());
  };

  return (
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
            {/* Key Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="فروش امروز"
                value="2,543,000"
                subtitle="تومان"
                change={12.5}
                changeType="increase"
                icon={<DollarSign className="w-4 h-4 text-white" />}
                color="bg-green-500"
              />
              <SummaryCard
                title="سفارشات فعال"
                value="47"
                change={-5.2}
                changeType="decrease"
                icon={<ShoppingCart className="w-4 h-4 text-white" />}
                color="bg-blue-500"
              />
              <SummaryCard
                title="مشتریان آنلاین"
                value="124"
                change={8.1}
                changeType="increase"
                icon={<Users className="w-4 h-4 text-white" />}
                color="bg-purple-500"
              />
              <SummaryCard
                title="هشدارهای سیستم"
                value="3"
                changeType="neutral"
                icon={<AlertTriangle className="w-4 h-4 text-white" />}
                color="bg-orange-500"
              />
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-bold mb-4">اقدامات سریع</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickActionWidget
                  title="مدیریت سفارشات"
                  description="بررسی و پردازش سفارشات جدید"
                  icon={<ShoppingCart className="w-5 h-5 text-white" />}
                  color="bg-blue-500"
                  count={23}
                  onClick={() => setLocation("/admin/order-management")}
                />
                <QuickActionWidget
                  title="مدیریت موجودی"
                  description="کنترل و بروزرسانی موجودی محصولات"
                  icon={<Package className="w-5 h-5 text-white" />}
                  color="bg-green-500"
                  count={15}
                  onClick={() => setLocation("/admin/warehouse-management")}
                />
                <QuickActionWidget
                  title="مدیریت مشتریان"
                  description="پیگیری و خدمات به مشتریان"
                  icon={<Users className="w-5 h-5 text-white" />}
                  color="bg-purple-500"
                  count={8}
                  onClick={() => setLocation("/crm")}
                />
                <QuickActionWidget
                  title="گزارش‌های مالی"
                  description="تحلیل عملکرد مالی و فروش"
                  icon={<BarChart3 className="w-5 h-5 text-white" />}
                  color="bg-orange-500"
                  onClick={() => setLocation("/admin/finance-orders")}
                />
                <QuickActionWidget
                  title="تنظیمات ایمیل"
                  description="مدیریت سیستم ایمیل و اطلاع‌رسانی"
                  icon={<Settings className="w-5 h-5 text-white" />}
                  color="bg-red-500"
                  onClick={() => setLocation("/admin/email-settings")}
                />
                <QuickActionWidget
                  title="پشتیبانی فنی"
                  description="رسیدگی به تیکت‌های پشتیبانی"
                  icon={<AlertTriangle className="w-5 h-5 text-white" />}
                  color="bg-yellow-500"
                  count={12}
                  onClick={() => setLocation("/admin/ticketing-system")}
                />
              </div>
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 ml-2 text-blue-500" />
                  فعالیت‌های اخیر
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                      <span className="text-sm">سفارش #ORD-1234 با موفقیت تحویل داده شد</span>
                    </div>
                    <span className="text-xs text-gray-500">5 دقیقه پیش</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-blue-500 ml-2" />
                      <span className="text-sm">مشتری جدید "شرکت کیمیا پتروشیمی" ثبت‌نام کرد</span>
                    </div>
                    <span className="text-xs text-gray-500">15 دقیقه پیش</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 ml-2" />
                      <span className="text-sm">محصول "سولونت 402" به حد مجاز موجودی رسید</span>
                    </div>
                    <span className="text-xs text-gray-500">30 دقیقه پیش</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center">
                      <BarChart3 className="w-4 h-4 text-purple-500 ml-2" />
                      <span className="text-sm">گزارش فروش هفتگی تولید شد</span>
                    </div>
                    <span className="text-xs text-gray-500">1 ساعت پیش</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                      <Badge variant="secondary">8</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">در حال پردازش</span>
                      <Badge variant="default">15</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">آماده ارسال</span>
                      <Badge variant="outline">23</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">تحویل شده</span>
                      <Badge className="bg-green-500">145</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">عملکرد کارکنان</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">بخش مالی</span>
                      <div className="flex items-center gap-2">
                        <Progress value={85} className="w-16 h-2" />
                        <span className="text-sm">85%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">انبار</span>
                      <div className="flex items-center gap-2">
                        <Progress value={92} className="w-16 h-2" />
                        <span className="text-sm">92%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">لجستیک</span>
                      <div className="flex items-center gap-2">
                        <Progress value={78} className="w-16 h-2" />
                        <span className="text-sm">78%</span>
                      </div>
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
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-red-600">سولونت 402</span>
                      <span>12 واحد</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-orange-600">تینر PT-300</span>
                      <span>8 واحد</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-yellow-600">NPK Complex</span>
                      <span>25 واحد</span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-3">
                      مشاهده همه
                    </Button>
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
                <CardTitle>تحلیل فروش</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">فروش امروز</span>
                    <span className="font-semibold">2,543,000 تومان</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">فروش این هفته</span>
                    <span className="font-semibold">15,890,000 تومان</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">فروش این ماه</span>
                    <span className="font-semibold">75,230,000 تومان</span>
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
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">مشتریان جدید</span>
                    <span className="font-semibold">47 نفر</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">مشتریان فعال</span>
                    <span className="font-semibold">892 نفر</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">نرخ حفظ مشتری</span>
                    <span className="font-semibold">87.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Monitor className="w-4 h-4 ml-2" />
                  وضعیت سرور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">CPU</span>
                    <Badge className="bg-green-500">45%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Memory</span>
                    <Badge className="bg-blue-500">68%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Disk</span>
                    <Badge variant="secondary">32%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">وضعیت خدمات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">پایگاه داده</span>
                    <Badge className="bg-green-500">آنلاین</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">سرویس ایمیل</span>
                    <Badge className="bg-green-500">آنلاین</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">پیامک</span>
                    <Badge className="bg-yellow-500">محدود</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">بک‌آپ سیستم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    آخرین بک‌آپ: امروز 02:00
                  </div>
                  <div className="text-sm text-green-600">
                    وضعیت: موفق
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    ایجاد بک‌آپ جدید
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
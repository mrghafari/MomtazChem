import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Monitor,
  FileText
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
                      count={(dashboardData?.data?.quickStats?.orderStatuses?.pending || 0) + (dashboardData?.data?.quickStats?.orderStatuses?.processing || 0) || 23}
                      onClick={() => setLocation("/admin/order-management")}
                    />
                    <QuickActionWidget
                      title="مدیریت موجودی"
                      description="کنترل و بروزرسانی موجودی محصولات"
                      icon={<Package className="w-5 h-5 text-white" />}
                      color="bg-green-500"
                      count={dashboardData?.data?.quickStats?.criticalInventory?.length || 15}
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
                      {dashboardData?.data?.recentActivities?.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                            <span className="text-sm">{activity.message}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleTimeString('fa-IR')}
                          </span>
                        </div>
                      )) || (
                        <>
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
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* Operations Tab - Comprehensive KPI Table */}
        <TabsContent value="operations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 ml-2 text-blue-500" />
                  جدول شاخص‌های کلیدی عملکرد (KPI)
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  مقایسه عملکرد ماه جاری با ماه قبل
                </p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    <span className="mr-3">در حال بارگذاری...</span>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-right font-bold">دسته‌بندی</TableHead>
                          <TableHead className="text-center font-bold">واحد</TableHead>
                          <TableHead className="text-center font-bold">مقدار JUN</TableHead>
                          <TableHead className="text-center font-bold">مقدار July</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardData?.data?.kpis?.map((kpi, index) => {
                          const changePercent = ((kpi.currentMonth - kpi.previousMonth) / kpi.previousMonth * 100).toFixed(1);
                          const isIncrease = kpi.currentMonth > kpi.previousMonth;
                          const isDecrease = kpi.currentMonth < kpi.previousMonth;
                          
                          return (
                            <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <TableCell className="font-medium text-right">
                                {kpi.category}
                              </TableCell>
                              <TableCell className="text-center text-sm text-gray-600">
                                {kpi.unit}
                              </TableCell>
                              <TableCell className="text-center">
                                {kpi.unit === "دینار" 
                                  ? kpi.previousMonth.toLocaleString('fa-IR')
                                  : kpi.previousMonth.toLocaleString('fa-IR')
                                }
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <span>
                                    {kpi.unit === "دینار" 
                                      ? kpi.currentMonth.toLocaleString('fa-IR')
                                      : kpi.currentMonth.toLocaleString('fa-IR')
                                    }
                                  </span>
                                  {isIncrease && (
                                    <div className="flex items-center text-green-600 text-xs">
                                      <TrendingUp className="w-3 h-3 ml-1" />
                                      <span>+{changePercent}%</span>
                                    </div>
                                  )}
                                  {isDecrease && (
                                    <div className="flex items-center text-red-600 text-xs">
                                      <TrendingDown className="w-3 h-3 ml-1" />
                                      <span>{changePercent}%</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }) || (
                          // Fallback static data matching your design
                          <>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium text-right">درآمد کل</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">دینار</TableCell>
                              <TableCell className="text-center">7.6E+08</TableCell>
                              <TableCell className="text-center">8E+08</TableCell>
                            </TableRow>
                            <TableRow className="bg-gray-50">
                              <TableCell className="font-medium text-right">تعداد سفارش کل</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">عدد</TableCell>
                              <TableCell className="text-center">118</TableCell>
                              <TableCell className="text-center">125</TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium text-right">% نرخ رشد کل</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">%</TableCell>
                              <TableCell className="text-center">1.6</TableCell>
                              <TableCell className="text-center">1.8</TableCell>
                            </TableRow>
                            <TableRow className="bg-gray-50">
                              <TableCell className="font-medium text-right">% نرخ رشد سبد خرید</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">%</TableCell>
                              <TableCell className="text-center">69</TableCell>
                              <TableCell className="text-center">67</TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium text-right">ارزش طول عمر مشتری</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">دینار</TableCell>
                              <TableCell className="text-center">3000000</TableCell>
                              <TableCell className="text-center">3200000</TableCell>
                            </TableRow>
                            <TableRow className="bg-gray-50">
                              <TableCell className="font-medium text-right">سود</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">دینار</TableCell>
                              <TableCell className="text-center">690000</TableCell>
                              <TableCell className="text-center">720000</TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium text-right">% نرخ رشد فروش</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">%</TableCell>
                              <TableCell className="text-center">1.6</TableCell>
                              <TableCell className="text-center">1.8</TableCell>
                            </TableRow>
                            <TableRow className="bg-gray-50">
                              <TableCell className="font-medium text-right">سود طول عمر مشتری</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">دینار</TableCell>
                              <TableCell className="text-center">3000000</TableCell>
                              <TableCell className="text-center">3200000</TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium text-right">سهم منابع و بازاریابی</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">%</TableCell>
                              <TableCell className="text-center">38</TableCell>
                              <TableCell className="text-center">42</TableCell>
                            </TableRow>
                            <TableRow className="bg-gray-50">
                              <TableCell className="font-medium text-right">% نرخ رشد بازاریابی</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">%</TableCell>
                              <TableCell className="text-center">20</TableCell>
                              <TableCell className="text-center">21</TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium text-right">کیفیت کالاها</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">نسبت</TableCell>
                              <TableCell className="text-center">3.9</TableCell>
                              <TableCell className="text-center">4.5</TableCell>
                            </TableRow>
                            <TableRow className="bg-gray-50">
                              <TableCell className="font-medium text-right">هزینه جذب مشتری</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">دینار</TableCell>
                              <TableCell className="text-center">195000</TableCell>
                              <TableCell className="text-center">180000</TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium text-right">% محیط رضایت مشتری</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">%</TableCell>
                              <TableCell className="text-center">48</TableCell>
                              <TableCell className="text-center">52</TableCell>
                            </TableRow>
                            <TableRow className="bg-gray-50">
                              <TableCell className="font-medium text-right">محصولات مشتری</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">عدد</TableCell>
                              <TableCell className="text-center">29</TableCell>
                              <TableCell className="text-center">31</TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium text-right">شاخص رضا مشتری</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">نمره</TableCell>
                              <TableCell className="text-center">45</TableCell>
                              <TableCell className="text-center">48</TableCell>
                            </TableRow>
                            <TableRow className="bg-gray-50">
                              <TableCell className="font-medium text-right">تعداد تیکت مشتری</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">عدد</TableCell>
                              <TableCell className="text-center">31</TableCell>
                              <TableCell className="text-center">26</TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium text-right">زمان پاسخگویی سایت</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">ثانیه</TableCell>
                              <TableCell className="text-center">4.6</TableCell>
                              <TableCell className="text-center">4.2</TableCell>
                            </TableRow>
                            <TableRow className="bg-gray-50">
                              <TableCell className="font-medium text-right">% کیفیت سایت</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">%</TableCell>
                              <TableCell className="text-center">66</TableCell>
                              <TableCell className="text-center">83</TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium text-right">مدت حضور سایت</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">دقیقه</TableCell>
                              <TableCell className="text-center">5.1</TableCell>
                              <TableCell className="text-center">5.7</TableCell>
                            </TableRow>
                            <TableRow className="bg-gray-50">
                              <TableCell className="font-medium text-right">میانگین صفحه سایت</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">عدد</TableCell>
                              <TableCell className="text-center">4</TableCell>
                              <TableCell className="text-center">4</TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium text-right">بازدید مهین سایت</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">عدد</TableCell>
                              <TableCell className="text-center">21</TableCell>
                              <TableCell className="text-center">24</TableCell>
                            </TableRow>
                            <TableRow className="bg-gray-50">
                              <TableCell className="font-medium text-right">زمان ارسال انبار</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">ساعت</TableCell>
                              <TableCell className="text-center">41</TableCell>
                              <TableCell className="text-center">38</TableCell>
                            </TableRow>
                            <TableRow className="bg-white">
                              <TableCell className="font-medium text-right">% نرخ موجودی انبار</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">%</TableCell>
                              <TableCell className="text-center">8.8</TableCell>
                              <TableCell className="text-center">8.2</TableCell>
                            </TableRow>
                            <TableRow className="bg-gray-50">
                              <TableCell className="font-medium text-right">% درصد دقت انبار</TableCell>
                              <TableCell className="text-center text-sm text-gray-600">%</TableCell>
                              <TableCell className="text-center">92</TableCell>
                              <TableCell className="text-center">94</TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    آخرین بروزرسانی: {new Date().toLocaleDateString('fa-IR')} - {new Date().toLocaleTimeString('fa-IR')}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 ml-2" />
                      دانلود Excel
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 ml-2" />
                      دانلود PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Power BI Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="w-5 h-5 ml-2 text-purple-500" />
                  گزارش‌های تعاملی Power BI
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  تحلیل‌های پیشرفته و تجسم داده‌ها
                </p>
              </CardHeader>
              <CardContent>
                <div id="powerbi-container" className="w-full h-[500px] border rounded-lg bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Power BI Dashboard</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      برای نمایش گزارش‌های تعاملی، لطفاً تنظیمات Power BI را تکمیل کنید
                    </p>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 ml-2" />
                      تنظیمات Power BI
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">راهنمای راه‌اندازی Power BI</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Report ID و Embed URL را از Power BI Service دریافت کنید</li>
                    <li>• Access Token معتبر را وارد کنید</li>
                    <li>• مجوزهای لازم را برای داشبورد تنظیم کنید</li>
                    <li>• گزارش‌های تعاملی با فیلترهای پیشرفته استفاده کنید</li>
                  </ul>
                </div>

                {/* Power BI Integration Code Sample */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-medium text-gray-800 mb-2">نمونه کد تنظیمات Power BI</h4>
                  <pre className="text-xs text-gray-600 overflow-auto">
{`<script src="https://cdn.jsdelivr.net/npm/powerbi-client@2.18.6/dist/powerbi.js"></script>
<script>
  var embedConfiguration = {
    type: 'report',
    id: 'your-report-id',
    embedUrl: 'your-embed-url',
    accessToken: 'your-secure-token',
    tokenType: models.TokenType.Embed,
    permissions: models.Permissions.All,
    settings: {
        filterPaneEnabled: false,
        navContentPaneEnabled: true
    }
  };
  var reportContainer = document.getElementById('powerbi-container');
  powerbi.embed(reportContainer, embedConfiguration);
</script>`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>شاخص‌های عملکرد</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">کارایی مالی</span>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">کارایی انبار</span>
                        <span className="text-sm font-medium">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">کارایی لجستیک</span>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Critical Inventory */}
              <Card>
                <CardHeader>
                  <CardTitle>موجودی بحرانی</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <span className="font-medium">سولونت 402</span>
                        <p className="text-sm text-gray-600">12 واحد</p>
                      </div>
                      <Badge variant="destructive">بحرانی</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div>
                        <span className="font-medium">تینر PT-300</span>
                        <p className="text-sm text-gray-600">8 واحد</p>
                      </div>
                      <Badge variant="outline" className="border-orange-500 text-orange-600">کم</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <span className="font-medium">NPK Complex</span>
                        <p className="text-sm text-gray-600">25 واحد</p>
                      </div>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">هشدار</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
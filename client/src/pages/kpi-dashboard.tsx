import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  Target,
  Calendar,
  RefreshCw,
  Download,
  ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const KPICard: React.FC<KPICardProps> = ({ 
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
    <Card className="hover:shadow-md transition-shadow">
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
            <span className="ml-1 text-gray-500">از ماه گذشته</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Performance Gauge Component
interface PerformanceGaugeProps {
  title: string;
  value: number;
  target: number;
  unit: string;
}

const PerformanceGauge: React.FC<PerformanceGaugeProps> = ({ title, value, target, unit }) => {
  const percentage = Math.min((value / target) * 100, 100);
  const status = percentage >= 90 ? 'excellent' : percentage >= 70 ? 'good' : percentage >= 50 ? 'average' : 'poor';
  
  const getStatusColor = () => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'average': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'excellent': return 'عالی';
      case 'good': return 'خوب';
      case 'average': return 'متوسط';
      case 'poor': return 'ضعیف';
      default: return 'نامشخص';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {title}
          <Badge variant={status === 'excellent' ? 'default' : 'secondary'}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>فعلی: {value} {unit}</span>
            <span>هدف: {target} {unit}</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="text-center text-xs text-gray-500">
            {percentage.toFixed(1)}% از هدف
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function KPIDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Fetch KPI data
  const { data: salesKPIs, isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ['/api/kpi/sales'],
    staleTime: 30000,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  const { data: customerKPIs, isLoading: customerLoading, refetch: refetchCustomers } = useQuery({
    queryKey: ['/api/kpi/customers'],
    staleTime: 30000,
  });

  const { data: inventoryKPIs, isLoading: inventoryLoading, refetch: refetchInventory } = useQuery({
    queryKey: ['/api/kpi/inventory'],
    staleTime: 30000,
  });

  const { data: operationalKPIs, isLoading: operationalLoading, refetch: refetchOperational } = useQuery({
    queryKey: ['/api/kpi/operational'],
    staleTime: 30000,
  });

  const { data: financialKPIs, isLoading: financialLoading, refetch: refetchFinancial } = useQuery({
    queryKey: ['/api/kpi/financial'],
    staleTime: 30000,
  });

  const refreshAllData = async () => {
    await Promise.all([
      refetchSales(),
      refetchCustomers(),
      refetchInventory(),
      refetchOperational(),
      refetchFinancial()
    ]);
    setLastUpdated(new Date());
  };

  const isLoading = salesLoading || customerLoading || inventoryLoading || operationalLoading || financialLoading;

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
              داشبورد شاخص‌های عملکرد (KPI)
            </h1>
            <p className="text-gray-600 mt-1">
              نظارت بر شاخص‌های کلیدی عملکرد کسب‌وکار
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
            onClick={refreshAllData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 ml-2" />
            گزارش PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="sales">فروش</TabsTrigger>
          <TabsTrigger value="customers">مشتریان</TabsTrigger>
          <TabsTrigger value="inventory">موجودی</TabsTrigger>
          <TabsTrigger value="operations">عملیات</TabsTrigger>
          <TabsTrigger value="financial">مالی</TabsTrigger>
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
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    title="فروش امروز"
                    value={salesKPIs?.data?.dailySales?.toLocaleString('fa-IR') || '0'}
                    subtitle="تومان"
                    change={salesKPIs?.data?.salesGrowth || 0}
                    changeType={salesKPIs?.data?.salesGrowth > 0 ? "increase" : salesKPIs?.data?.salesGrowth < 0 ? "decrease" : "neutral"}
                    icon={<DollarSign className="w-4 h-4 text-white" />}
                    color="bg-green-500"
                  />
                  <KPICard
                    title="سفارشات کل"
                    value={salesKPIs?.data?.totalOrders || '0'}
                    change={salesKPIs?.data?.ordersGrowth || 0}
                    changeType={salesKPIs?.data?.ordersGrowth > 0 ? "increase" : salesKPIs?.data?.ordersGrowth < 0 ? "decrease" : "neutral"}
                    icon={<ShoppingCart className="w-4 h-4 text-white" />}
                    color="bg-blue-500"
                  />
                  <KPICard
                    title="مشتریان فعال"
                    value={customerKPIs?.data?.activeCustomers || '0'}
                    change={customerKPIs?.data?.customersGrowth || 0}
                    changeType={customerKPIs?.data?.customersGrowth > 0 ? "increase" : customerKPIs?.data?.customersGrowth < 0 ? "decrease" : "neutral"}
                    icon={<Users className="w-4 h-4 text-white" />}
                    color="bg-purple-500"
                  />
                  <KPICard
                    title="کالاهای کم موجود"
                    value={inventoryKPIs?.data?.lowStockProducts || '0'}
                    changeType="neutral"
                    icon={<AlertTriangle className="w-4 h-4 text-white" />}
                    color="bg-orange-500"
                  />
                </div>

                {/* Performance Gauges */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <PerformanceGauge
                    title="هدف فروش ماهانه"
                    value={salesKPIs?.data?.monthlySales || 0}
                    target={100000000}
                    unit="تومان"
                  />
                  <PerformanceGauge
                    title="رضایت مشتری"
                    value={customerKPIs?.data?.customerSatisfaction * 20 || 80}
                    target={90}
                    unit="%"
                  />
                  <PerformanceGauge
                    title="نرخ حفظ مشتری"
                    value={customerKPIs?.data?.customerRetention || 85}
                    target={90}
                    unit="%"
                  />
                  <PerformanceGauge
                    title="نرخ تبدیل"
                    value={salesKPIs?.data?.conversionRate || 10}
                    target={20}
                    unit="%"
                  />
                </div>
              </>
            )}

            {/* Critical Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 ml-2 text-red-500" />
                  هشدارهای مهم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                      <span className="text-sm">15 محصول کمتر از حد مجاز موجودی دارند</span>
                    </div>
                    <Button size="sm" variant="outline">بررسی</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-yellow-500 ml-2" />
                      <span className="text-sm">8 سفارش در انتظار تایید مالی</span>
                    </div>
                    <Button size="sm" variant="outline">بررسی</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <Target className="w-4 h-4 text-blue-500 ml-2" />
                      <span className="text-sm">نرخ فروش 25% بیشتر از ماه گذشته</span>
                    </div>
                    <Button size="sm" variant="outline">جزئیات</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              <span className="mr-3">در حال بارگذاری...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard
                title="فروش روزانه"
                value={salesKPIs?.data?.dailySales?.toLocaleString('fa-IR') || '0'}
                subtitle="تومان"
                change={salesKPIs?.data?.salesGrowth || 0}
                changeType={salesKPIs?.data?.salesGrowth > 0 ? "increase" : salesKPIs?.data?.salesGrowth < 0 ? "decrease" : "neutral"}
                icon={<BarChart3 className="w-4 h-4 text-white" />}
                color="bg-green-500"
              />
              <KPICard
                title="فروش هفتگی"
                value={salesKPIs?.data?.weeklySales?.toLocaleString('fa-IR') || '0'}
                subtitle="تومان"
                change={salesKPIs?.data?.salesGrowth || 0}
                changeType={salesKPIs?.data?.salesGrowth > 0 ? "increase" : salesKPIs?.data?.salesGrowth < 0 ? "decrease" : "neutral"}
                icon={<TrendingUp className="w-4 h-4 text-white" />}
                color="bg-blue-500"
              />
              <KPICard
                title="فروش ماهانه"
                value={salesKPIs?.data?.monthlySales?.toLocaleString('fa-IR') || '0'}
                subtitle="تومان"
                change={salesKPIs?.data?.salesGrowth || 0}
                changeType={salesKPIs?.data?.salesGrowth > 0 ? "increase" : salesKPIs?.data?.salesGrowth < 0 ? "decrease" : "neutral"}
                icon={<Calendar className="w-4 h-4 text-white" />}
                color="bg-purple-500"
              />
              <KPICard
                title="متوسط ارزش سفارش"
                value={salesKPIs?.data?.averageOrderValue?.toLocaleString('fa-IR') || '0'}
                subtitle="تومان"
                change={15.7}
                changeType="increase"
              icon={<DollarSign className="w-4 h-4 text-white" />}
              color="bg-green-600"
            />
            <KPICard
              title="تعداد سفارشات"
              value="156"
              change={5.8}
              changeType="increase"
              icon={<ShoppingCart className="w-4 h-4 text-white" />}
              color="bg-blue-600"
            />
            <KPICard
              title="نرخ تبدیل"
              value="15.8%"
              change={3.2}
              changeType="increase"
              icon={<Target className="w-4 h-4 text-white" />}
              color="bg-orange-500"
            />
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard
              title="کل مشتریان"
              value="1,234"
              change={8.1}
              changeType="increase"
              icon={<Users className="w-4 h-4 text-white" />}
              color="bg-purple-500"
            />
            <KPICard
              title="مشتریان جدید"
              value="47"
              subtitle="این ماه"
              change={12.3}
              changeType="increase"
              icon={<Users className="w-4 h-4 text-white" />}
              color="bg-green-500"
            />
            <KPICard
              title="مشتریان فعال"
              value="892"
              subtitle="30 روز گذشته"
              change={5.7}
              changeType="increase"
              icon={<Activity className="w-4 h-4 text-white" />}
              color="bg-blue-500"
            />
            <KPICard
              title="نرخ حفظ مشتری"
              value="87.5%"
              change={2.1}
              changeType="increase"
              icon={<CheckCircle className="w-4 h-4 text-white" />}
              color="bg-green-600"
            />
            <KPICard
              title="رضایت مشتری"
              value="4.6/5"
              change={0.3}
              changeType="increase"
              icon={<Target className="w-4 h-4 text-white" />}
              color="bg-yellow-500"
            />
            <KPICard
              title="متوسط خرید مشتری"
              value="3,250,000"
              subtitle="تومان"
              change={18.9}
              changeType="increase"
              icon={<DollarSign className="w-4 h-4 text-white" />}
              color="bg-purple-600"
            />
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard
              title="کل محصولات"
              value="456"
              icon={<Package className="w-4 h-4 text-white" />}
              color="bg-blue-500"
            />
            <KPICard
              title="محصولات موجود"
              value="441"
              change={-1.2}
              changeType="decrease"
              icon={<CheckCircle className="w-4 h-4 text-white" />}
              color="bg-green-500"
            />
            <KPICard
              title="کم موجودی"
              value="15"
              changeType="neutral"
              icon={<AlertTriangle className="w-4 h-4 text-white" />}
              color="bg-orange-500"
            />
            <KPICard
              title="ارزش کل موجودی"
              value="125,000,000"
              subtitle="تومان"
              change={5.3}
              changeType="increase"
              icon={<DollarSign className="w-4 h-4 text-white" />}
              color="bg-purple-500"
            />
            <KPICard
              title="گردش موجودی"
              value="8.5"
              subtitle="بار در سال"
              change={12.1}
              changeType="increase"
              icon={<RefreshCw className="w-4 h-4 text-white" />}
              color="bg-blue-600"
            />
            <KPICard
              title="محصولات پرفروش"
              value="12"
              subtitle="بیش از 100 فروش"
              icon={<TrendingUp className="w-4 h-4 text-white" />}
              color="bg-green-600"
            />
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard
              title="سفارشات در انتظار"
              value="23"
              icon={<Clock className="w-4 h-4 text-white" />}
              color="bg-yellow-500"
            />
            <KPICard
              title="سفارشات تحویل شده"
              value="145"
              subtitle="این ماه"
              change={15.2}
              changeType="increase"
              icon={<CheckCircle className="w-4 h-4 text-white" />}
              color="bg-green-500"
            />
            <KPICard
              title="زمان متوسط تحویل"
              value="2.3"
              subtitle="روز"
              change={-8.5}
              changeType="increase"
              icon={<Clock className="w-4 h-4 text-white" />}
              color="bg-blue-500"
            />
            <KPICard
              title="نرخ تحویل به موقع"
              value="92%"
              change={3.1}
              changeType="increase"
              icon={<Target className="w-4 h-4 text-white" />}
              color="bg-green-600"
            />
            <KPICard
              title="استعلامات پاسخ داده شده"
              value="87%"
              change={5.4}
              changeType="increase"
              icon={<Activity className="w-4 h-4 text-white" />}
              color="bg-purple-500"
            />
            <KPICard
              title="نرخ برگشت کالا"
              value="2.1%"
              change={-0.8}
              changeType="increase"
              icon={<RefreshCw className="w-4 h-4 text-white" />}
              color="bg-orange-500"
            />
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard
              title="درآمد ماهانه"
              value="75,230,000"
              subtitle="تومان"
              change={12.5}
              changeType="increase"
              icon={<DollarSign className="w-4 h-4 text-white" />}
              color="bg-green-500"
            />
            <KPICard
              title="سود خالص"
              value="18,500,000"
              subtitle="تومان"
              change={8.7}
              changeType="increase"
              icon={<TrendingUp className="w-4 h-4 text-white" />}
              color="bg-blue-500"
            />
            <KPICard
              title="حاشیه سود"
              value="24.6%"
              change={2.1}
              changeType="increase"
              icon={<BarChart3 className="w-4 h-4 text-white" />}
              color="bg-purple-500"
            />
            <KPICard
              title="هزینه‌های عملیاتی"
              value="12,300,000"
              subtitle="تومان"
              change={-3.2}
              changeType="increase"
              icon={<Activity className="w-4 h-4 text-white" />}
              color="bg-orange-500"
            />
            <KPICard
              title="نقدینگی"
              value="45,600,000"
              subtitle="تومان"
              change={15.8}
              changeType="increase"
              icon={<DollarSign className="w-4 h-4 text-white" />}
              color="bg-green-600"
            />
            <KPICard
              title="بدهی مشتریان"
              value="8,900,000"
              subtitle="تومان"
              change={-5.4}
              changeType="increase"
              icon={<Users className="w-4 h-4 text-white" />}
              color="bg-red-500"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
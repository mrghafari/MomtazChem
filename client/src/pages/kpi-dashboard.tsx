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
  ArrowLeft,
  Heart,
  Star,
  MessageSquare,
  UserPlus,
  UserCheck
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
          <TabsTrigger value="inventory">انبار</TabsTrigger>
          <TabsTrigger value="operations">سایت و بازاریابی</TabsTrigger>
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
                title="درآمد کل"
                value={salesKPIs?.data?.totalRevenue?.toLocaleString('fa-IR') || '0'}
                subtitle="تومان"
                change={salesKPIs?.data?.revenueGrowth || 0}
                changeType={salesKPIs?.data?.revenueGrowth > 0 ? "increase" : salesKPIs?.data?.revenueGrowth < 0 ? "decrease" : "neutral"}
                icon={<DollarSign className="w-4 h-4 text-white" />}
                color="bg-green-500"
              />
              <KPICard
                title="میانگین ارزش سفارش (AOV)"
                value={salesKPIs?.data?.averageOrderValue?.toLocaleString('fa-IR') || '0'}
                subtitle="تومان"
                change={salesKPIs?.data?.aovGrowth || 0}
                changeType={salesKPIs?.data?.aovGrowth > 0 ? "increase" : salesKPIs?.data?.aovGrowth < 0 ? "decrease" : "neutral"}
                icon={<TrendingUp className="w-4 h-4 text-white" />}
                color="bg-blue-500"
              />
              <KPICard
                title="نرخ تبدیل"
                value={`${salesKPIs?.data?.conversionRate || '0'}%`}
                subtitle="درصد"
                change={salesKPIs?.data?.conversionGrowth || 0}
                changeType={salesKPIs?.data?.conversionGrowth > 0 ? "increase" : salesKPIs?.data?.conversionGrowth < 0 ? "decrease" : "neutral"}
                icon={<Target className="w-4 h-4 text-white" />}
                color="bg-purple-500"
              />
              <KPICard
                title="نرخ ترک سبد خرید"
                value={`${salesKPIs?.data?.cartAbandonmentRate || '0'}%`}
                subtitle="درصد"
                change={salesKPIs?.data?.abandonnmentImprovement || 0}
                changeType={salesKPIs?.data?.abandonnmentImprovement > 0 ? "increase" : salesKPIs?.data?.abandonnmentImprovement < 0 ? "decrease" : "neutral"}
                icon={<ShoppingCart className="w-4 h-4 text-white" />}
                color="bg-orange-500"
              />
              <KPICard
                title="ارزش طول عمر مشتری (CLV)"
                value={salesKPIs?.data?.customerLifetimeValue?.toLocaleString('fa-IR') || '0'}
                subtitle="تومان"
                change={salesKPIs?.data?.clvGrowth || 0}
                changeType={salesKPIs?.data?.clvGrowth > 0 ? "increase" : salesKPIs?.data?.clvGrowth < 0 ? "decrease" : "neutral"}
                icon={<DollarSign className="w-4 h-4 text-white" />}
                color="bg-green-600"
              />
            </div>
          )}
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              <span className="mr-3">در حال بارگذاری...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard
                title="نرخ حفظ مشتری"
                value={`${customerKPIs?.data?.customerRetention || '0'}%`}
                subtitle="درصد"
                change={customerKPIs?.data?.retentionGrowth || 0}
                changeType={customerKPIs?.data?.retentionGrowth > 0 ? "increase" : customerKPIs?.data?.retentionGrowth < 0 ? "decrease" : "neutral"}
                icon={<Heart className="w-4 h-4 text-white" />}
                color="bg-red-500"
              />
              <KPICard
                title="نرخ خرید مجدد"
                value={`${customerKPIs?.data?.repeatPurchaseRate || '0'}%`}
                subtitle="درصد"
                change={customerKPIs?.data?.repeatPurchaseGrowth || 0}
                changeType={customerKPIs?.data?.repeatPurchaseGrowth > 0 ? "increase" : customerKPIs?.data?.repeatPurchaseGrowth < 0 ? "decrease" : "neutral"}
                icon={<RefreshCw className="w-4 h-4 text-white" />}
                color="bg-green-500"
              />
              <KPICard
                title="شاخص رضایت مشتری (NPS)"
                value={customerKPIs?.data?.netPromoterScore || '0'}
                subtitle="نمره (-100 تا 100)"
                change={customerKPIs?.data?.npsImprovement || 0}
                changeType={customerKPIs?.data?.npsImprovement > 0 ? "increase" : customerKPIs?.data?.npsImprovement < 0 ? "decrease" : "neutral"}
                icon={<Star className="w-4 h-4 text-white" />}
                color="bg-yellow-500"
              />
              <KPICard
                title="تعداد تیکت پشتیبانی"
                value={customerKPIs?.data?.supportTicketsCount || '0'}
                subtitle="تعداد"
                change={customerKPIs?.data?.ticketReduction || 0}
                changeType={customerKPIs?.data?.ticketReduction > 0 ? "increase" : customerKPIs?.data?.ticketReduction < 0 ? "decrease" : "neutral"}
                icon={<MessageSquare className="w-4 h-4 text-white" />}
                color="bg-orange-500"
              />
              <KPICard
                title="زمان پاسخ پشتیبانی"
                value={customerKPIs?.data?.averageResponseTime || '0'}
                subtitle="ساعت"
                change={customerKPIs?.data?.responseTimeImprovement || 0}
                changeType={customerKPIs?.data?.responseTimeImprovement > 0 ? "increase" : customerKPIs?.data?.responseTimeImprovement < 0 ? "decrease" : "neutral"}
                icon={<Clock className="w-4 h-4 text-white" />}
                color="bg-blue-500"
              />
              <KPICard
                title="هزینه جذب مشتری (CAC)"
                value={customerKPIs?.data?.customerAcquisitionCost?.toLocaleString('fa-IR') || '0'}
                subtitle="تومان"
                change={customerKPIs?.data?.cacReduction || 0}
                changeType={customerKPIs?.data?.cacReduction > 0 ? "increase" : customerKPIs?.data?.cacReduction < 0 ? "decrease" : "neutral"}
                icon={<DollarSign className="w-4 h-4 text-white" />}
                color="bg-purple-500"
              />
            </div>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              <span className="mr-3">در حال بارگذاری...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard
                title="نرخ گردش موجودی"
                value={`${inventoryKPIs?.data?.inventoryTurnoverRate || '0'}/ماه`}
                subtitle="بار در ماه"
                change={inventoryKPIs?.data?.turnoverImprovement || 0}
                changeType={inventoryKPIs?.data?.turnoverImprovement > 0 ? "increase" : inventoryKPIs?.data?.turnoverImprovement < 0 ? "decrease" : "neutral"}
                icon={<RefreshCw className="w-4 h-4 text-white" />}
                color="bg-blue-500"
              />
              <KPICard
                title="زمان تحقق سفارش"
                value={`${inventoryKPIs?.data?.fulfillmentTime || '0'} ساعت`}
                subtitle="ساعت"
                change={inventoryKPIs?.data?.fulfillmentImprovement || 0}
                changeType={inventoryKPIs?.data?.fulfillmentImprovement > 0 ? "increase" : inventoryKPIs?.data?.fulfillmentImprovement < 0 ? "decrease" : "neutral"}
                icon={<Clock className="w-4 h-4 text-white" />}
                color="bg-green-500"
              />
              <KPICard
                title="نرخ مرجوعی"
                value={`${inventoryKPIs?.data?.returnRate || '0'}%`}
                subtitle="درصد"
                change={inventoryKPIs?.data?.returnReduction || 0}
                changeType={inventoryKPIs?.data?.returnReduction > 0 ? "increase" : inventoryKPIs?.data?.returnReduction < 0 ? "decrease" : "neutral"}
                icon={<Package className="w-4 h-4 text-white" />}
                color="bg-orange-500"
              />
              <KPICard
                title="درصد دقت سفارشات"
                value={`${inventoryKPIs?.data?.orderAccuracy || '0'}%`}
                subtitle="درصد"
                change={inventoryKPIs?.data?.accuracyImprovement || 0}
                changeType={inventoryKPIs?.data?.accuracyImprovement > 0 ? "increase" : inventoryKPIs?.data?.accuracyImprovement < 0 ? "decrease" : "neutral"}
                icon={<CheckCircle className="w-4 h-4 text-white" />}
                color="bg-green-600"
              />
              <KPICard
                title="کل محصولات"
                value={inventoryKPIs?.data?.totalProducts || '0'}
                subtitle="تعداد"
                icon={<Package className="w-4 h-4 text-white" />}
                color="bg-purple-500"
              />
              <KPICard
                title="محصولات کم موجود"
                value={inventoryKPIs?.data?.lowStockProducts || '0'}
                subtitle="تعداد"
                icon={<AlertTriangle className="w-4 h-4 text-white" />}
                color="bg-red-500"
              />
            </div>
          )}
        </TabsContent>

        {/* Operations/Website & Marketing Tab */}
        <TabsContent value="operations">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              <span className="mr-3">در حال بارگذاری...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard
                title="زمان بارگذاری سایت"
                value={`${operationalKPIs?.data?.pageLoadTime || '0'} ثانیه`}
                subtitle="ثانیه"
                change={operationalKPIs?.data?.loadTimeImprovement || 0}
                changeType={operationalKPIs?.data?.loadTimeImprovement > 0 ? "increase" : operationalKPIs?.data?.loadTimeImprovement < 0 ? "decrease" : "neutral"}
                icon={<Clock className="w-4 h-4 text-white" />}
                color="bg-blue-500"
              />
              <KPICard
                title="نرخ پرش"
                value={`${operationalKPIs?.data?.bounceRate || '0'}%`}
                subtitle="درصد"
                change={operationalKPIs?.data?.bounceRateImprovement || 0}
                changeType={operationalKPIs?.data?.bounceRateImprovement > 0 ? "increase" : operationalKPIs?.data?.bounceRateImprovement < 0 ? "decrease" : "neutral"}
                icon={<TrendingDown className="w-4 h-4 text-white" />}
                color="bg-orange-500"
              />
              <KPICard
                title="مدت زمان حضور در سایت"
                value={`${operationalKPIs?.data?.avgSessionDuration || '0'} دقیقه`}
                subtitle="دقیقه"
                change={operationalKPIs?.data?.sessionDurationGrowth || 0}
                changeType={operationalKPIs?.data?.sessionDurationGrowth > 0 ? "increase" : operationalKPIs?.data?.sessionDurationGrowth < 0 ? "decrease" : "neutral"}
                icon={<Activity className="w-4 h-4 text-white" />}
                color="bg-green-500"
              />
              <KPICard
                title="میانگین صفحات مشاهده‌شده"
                value={`${operationalKPIs?.data?.avgPagesPerSession || '0'} صفحه`}
                subtitle="صفحه"
                change={operationalKPIs?.data?.pagesPerSessionGrowth || 0}
                changeType={operationalKPIs?.data?.pagesPerSessionGrowth > 0 ? "increase" : operationalKPIs?.data?.pagesPerSessionGrowth < 0 ? "decrease" : "neutral"}
                icon={<BarChart3 className="w-4 h-4 text-white" />}
                color="bg-purple-500"
              />
              <KPICard
                title="نرخ بازشدن ایمیل"
                value={`${operationalKPIs?.data?.emailOpenRate || '0'}%`}
                subtitle="درصد"
                change={operationalKPIs?.data?.emailOpenRateGrowth || 0}
                changeType={operationalKPIs?.data?.emailOpenRateGrowth > 0 ? "increase" : operationalKPIs?.data?.emailOpenRateGrowth < 0 ? "decrease" : "neutral"}
                icon={<MessageSquare className="w-4 h-4 text-white" />}
                color="bg-blue-600"
              />
              <KPICard
                title="بازدهی تبلیغات (ROAS)"
                value={`${operationalKPIs?.data?.roas || '0'}x`}
                subtitle="برابر"
                change={operationalKPIs?.data?.roasGrowth || 0}
                changeType={operationalKPIs?.data?.roasGrowth > 0 ? "increase" : operationalKPIs?.data?.roasGrowth < 0 ? "decrease" : "neutral"}
                icon={<Target className="w-4 h-4 text-white" />}
                color="bg-green-600"
              />
            </div>
          )}
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              <span className="mr-3">در حال بارگذاری...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard
                title="درآمد ماهانه"
                value={financialKPIs?.data?.monthlyRevenue?.toLocaleString('fa-IR') || '0'}
                subtitle="تومان"
                change={financialKPIs?.data?.revenueGrowth || 0}
                changeType={financialKPIs?.data?.revenueGrowth > 0 ? "increase" : financialKPIs?.data?.revenueGrowth < 0 ? "decrease" : "neutral"}
                icon={<DollarSign className="w-4 h-4 text-white" />}
                color="bg-green-500"
              />
              <KPICard
                title="سود خالص"
                value={financialKPIs?.data?.netProfit?.toLocaleString('fa-IR') || '0'}
                subtitle="تومان"
                change={financialKPIs?.data?.profitGrowth || 0}
                changeType={financialKPIs?.data?.profitGrowth > 0 ? "increase" : financialKPIs?.data?.profitGrowth < 0 ? "decrease" : "neutral"}
                icon={<TrendingUp className="w-4 h-4 text-white" />}
                color="bg-blue-500"
              />
              <KPICard
                title="حاشیه سود"
                value={`${financialKPIs?.data?.profitMargin || '0'}%`}
                subtitle="درصد"
                change={5.2}
                changeType="increase"
                icon={<BarChart3 className="w-4 h-4 text-white" />}
                color="bg-purple-500"
              />
              <KPICard
                title="هزینه‌های عملیاتی"
                value={financialKPIs?.data?.operatingCosts?.toLocaleString('fa-IR') || '0'}
                subtitle="تومان"
                change={-3.8}
                changeType="decrease"
                icon={<Package className="w-4 h-4 text-white" />}
                color="bg-orange-500"
              />
              <KPICard
                title="جریان نقدی"
                value={financialKPIs?.data?.cashFlow?.toLocaleString('fa-IR') || '0'}
                subtitle="تومان"
                change={8.9}
                changeType="increase"
                icon={<Activity className="w-4 h-4 text-white" />}
                color="bg-green-600"
              />
              <KPICard
                title="حساب‌های دریافتنی"
                value={financialKPIs?.data?.accountsReceivable?.toLocaleString('fa-IR') || '0'}
                subtitle="تومان"
                change={-2.1}
                changeType="decrease"
                icon={<Calendar className="w-4 h-4 text-white" />}
                color="bg-blue-600"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
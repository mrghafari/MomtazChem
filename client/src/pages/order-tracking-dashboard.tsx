import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader, 
  RefreshCw, 
  Search,
  FileText,
  Truck,
  User,
  Calendar,
  DollarSign,
  MapPin,
  CreditCard,
  Warehouse,
  Route
} from "lucide-react";

export default function OrderTrackingDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all orders with their current status
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/order-tracking/all-orders'],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false
  });

  const orders = (response as any)?.orders || [];

  // Filter orders based on search
  const filteredOrders = Array.isArray(orders) ? orders.filter((order: any) =>
    order.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerOrderId?.toString().includes(searchTerm)
  ) : [];

  // Group orders by status
  const ordersByStatus = {
    pending_payment: filteredOrders.filter((order: any) => order.currentStatus === 'pending_payment'),
    payment_confirmed: filteredOrders.filter((order: any) => order.currentStatus === 'payment_confirmed'),
    financial_pending: filteredOrders.filter((order: any) => order.currentStatus === 'financial_pending'),
    financial_approved: filteredOrders.filter((order: any) => order.currentStatus === 'financial_approved'),
    warehouse_pending: filteredOrders.filter((order: any) => order.currentStatus === 'warehouse_pending'),
    warehouse_approved: filteredOrders.filter((order: any) => order.currentStatus === 'warehouse_approved'),
    logistics_assigned: filteredOrders.filter((order: any) => order.currentStatus === 'logistics_assigned'),
    logistics_processing: filteredOrders.filter((order: any) => order.currentStatus === 'logistics_processing'),
    logistics_dispatched: filteredOrders.filter((order: any) => order.currentStatus === 'logistics_dispatched'),
    in_transit: filteredOrders.filter((order: any) => order.currentStatus === 'in_transit'),
    delivered: filteredOrders.filter((order: any) => order.currentStatus === 'delivered'),
    cancelled: filteredOrders.filter((order: any) => order.currentStatus === 'cancelled')
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fa-IR');
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('fa-IR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_payment: { label: "در انتظار پرداخت", variant: "destructive" as const, icon: CreditCard },
      payment_confirmed: { label: "پرداخت تایید شده", variant: "secondary" as const, icon: CheckCircle },
      financial_pending: { label: "در انتظار تایید مالی", variant: "outline" as const, icon: Clock },
      financial_approved: { label: "تایید مالی", variant: "default" as const, icon: CheckCircle },
      warehouse_pending: { label: "در انتظار انبار", variant: "outline" as const, icon: Warehouse },
      warehouse_approved: { label: "تایید انبار", variant: "default" as const, icon: Package },
      logistics_assigned: { label: "تخصیص لجستیک", variant: "secondary" as const, icon: Route },
      logistics_processing: { label: "پردازش لجستیک", variant: "secondary" as const, icon: Truck },
      logistics_dispatched: { label: "ارسال شده", variant: "default" as const, icon: MapPin },
      in_transit: { label: "در حال حمل", variant: "default" as const, icon: Truck },
      delivered: { label: "تحویل داده شده", variant: "default" as const, icon: CheckCircle },
      cancelled: { label: "لغو شده", variant: "destructive" as const, icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "outline" as const,
      icon: Clock
    };

    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusCardColor = (status: string) => {
    const colors = {
      pending_payment: "border-red-200 bg-red-50",
      payment_confirmed: "border-blue-200 bg-blue-50",
      financial_pending: "border-yellow-200 bg-yellow-50",
      financial_approved: "border-green-200 bg-green-50",
      warehouse_pending: "border-orange-200 bg-orange-50",
      warehouse_approved: "border-emerald-200 bg-emerald-50",
      logistics_assigned: "border-purple-200 bg-purple-50",
      logistics_processing: "border-indigo-200 bg-indigo-50",
      logistics_dispatched: "border-teal-200 bg-teal-50",
      in_transit: "border-cyan-200 bg-cyan-50",
      delivered: "border-green-200 bg-green-50",
      cancelled: "border-gray-200 bg-gray-50"
    };

    return colors[status as keyof typeof colors] || "border-gray-200 bg-gray-50";
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">داشبورد ردیابی سفارشات</h1>
          <p className="text-gray-600 mt-1">
            نمای کلی از وضعیت تمام سفارشات در سیستم
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          بازخوانی
        </Button>
      </div>

      {/* Search and Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <Label htmlFor="search">جستجوی سفارشات</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="جستجو بر اساس شماره سفارش یا نام مشتری..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {filteredOrders.length} سفارش
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders by Status */}
      {error || response === null ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">نیاز به احراز هویت</h3>
              <p className="text-gray-600 text-center max-w-md">
                برای دسترسی به داشبورد ردیابی سفارشات، لطفاً وارد حساب ادمین شوید.
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => window.location.href = '/admin/login'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  ورود به حساب ادمین
                </Button>
                <Button 
                  onClick={() => refetch()}
                  variant="outline"
                  className="border-gray-300"
                >
                  تلاش مجدد
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">در حال بارگیری سفارشات...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(ordersByStatus).map(([status, statusOrders]) => (
            <Card key={status} className={`${getStatusCardColor(status)} transition-all hover:shadow-md`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusBadge(status)}
                </CardTitle>
                <CardDescription>
                  {statusOrders.length} سفارش
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statusOrders.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {statusOrders.map((order: any) => (
                      <div key={order.id} className="bg-white rounded-lg p-3 border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-sm">
                              {order.orderNumber}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {order.customer?.firstName} {order.customer?.lastName}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-sm text-blue-600">
                              {formatCurrency(order.totalAmount)} {order.currency}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </div>
                        {order.city && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            {order.city}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    هیچ سفارشی در این وضعیت وجود ندارد
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
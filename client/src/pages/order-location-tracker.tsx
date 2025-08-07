import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Package, 
  CreditCard, 
  Truck, 
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Building2,
  Users,
  ShoppingCart
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface OrderLocation {
  id: number;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  currency: string;
  currentDepartment: string;
  status: string;
  currentLocation: string;
  lastUpdate: string;
  nextAction: string;
  priority: 'high' | 'medium' | 'low';
}

// فعلاً از mock data استفاده می‌کنم تا UI را ساخته، سپس API واقعی متصل خواهم کرد
const mockOrderLocations: OrderLocation[] = [
  {
    id: 1,
    orderNumber: 'M2511386',
    customerName: 'احمد حسینی',
    totalAmount: 250000,
    currency: 'IQD',
    currentDepartment: 'financial',
    status: 'pending_approval',
    currentLocation: 'بخش مالی - در انتظار تأیید',
    lastUpdate: '2025-08-07 19:30:00',
    nextAction: 'بررسی مدارک پرداخت',
    priority: 'high'
  },
  {
    id: 2,
    orderNumber: 'M2511385',
    customerName: 'فاطمه احمدی',
    totalAmount: 180000,
    currency: 'IQD',
    currentDepartment: 'warehouse',
    status: 'processing',
    currentLocation: 'انبار - در حال آماده‌سازی',
    lastUpdate: '2025-08-07 18:45:00',
    nextAction: 'بسته‌بندی محصولات',
    priority: 'medium'
  },
  {
    id: 3,
    orderNumber: 'M2511384',
    customerName: 'علی رضایی',
    totalAmount: 320000,
    currency: 'IQD',
    currentDepartment: 'logistics',
    status: 'ready_for_delivery',
    currentLocation: 'لجستیک - آماده ارسال',
    lastUpdate: '2025-08-07 17:20:00',
    nextAction: 'انتساب راننده',
    priority: 'high'
  }
];

const departmentIcons = {
  financial: CreditCard,
  warehouse: Package,
  logistics: Truck,
  completed: CheckCircle,
  cancelled: AlertCircle
};

const statusColors = {
  pending_approval: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  ready_for_delivery: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
};

export default function OrderLocationTracker() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  // API call برای دریافت مکان سفارشات
  const { data: apiResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/orders/locations'],
    refetchInterval: 30000 // هر 30 ثانیه refresh
  });

  const orders = apiResponse?.orders || mockOrderLocations;

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || order.currentDepartment === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departmentCounts = {
    financial: orders.filter(o => o.currentDepartment === 'financial').length,
    warehouse: orders.filter(o => o.currentDepartment === 'warehouse').length,
    logistics: orders.filter(o => o.currentDepartment === 'logistics').length,
    completed: orders.filter(o => o.currentDepartment === 'completed').length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ردیابی مکان سفارشات</h1>
          <p className="text-gray-600 mt-2">مشاهده وضعیت فعلی و مکان هر سفارش در سیستم</p>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          به‌روزرسانی
        </Button>
      </div>

      {/* آمار کلی بخش‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">بخش مالی</p>
                <p className="text-2xl font-bold">{departmentCounts.financial}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">انبار</p>
                <p className="text-2xl font-bold">{departmentCounts.warehouse}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="p-2 bg-green-100 rounded-lg">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">لجستیک</p>
                <p className="text-2xl font-bold">{departmentCounts.logistics}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="p-2 bg-gray-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">تکمیل شده</p>
                <p className="text-2xl font-bold">{departmentCounts.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* فیلترها */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="جستجو بر اساس شماره سفارش یا نام مشتری..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">همه بخش‌ها</option>
                <option value="financial">بخش مالی</option>
                <option value="warehouse">انبار</option>
                <option value="logistics">لجستیک</option>
                <option value="completed">تکمیل شده</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* لیست سفارشات */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const DepartmentIcon = departmentIcons[order.currentDepartment as keyof typeof departmentIcons] || Building2;
          
          return (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <DepartmentIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                        <p className="text-gray-600">{order.customerName}</p>
                      </div>
                      <Badge className={priorityColors[order.priority]}>
                        {order.priority === 'high' ? 'فوری' : order.priority === 'medium' ? 'متوسط' : 'عادی'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">مکان فعلی</p>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <p className="font-medium">{order.currentLocation}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">اقدام بعدی</p>
                        <p className="font-medium mt-1">{order.nextAction}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">آخرین به‌روزرسانی</p>
                        <p className="font-medium mt-1">{new Date(order.lastUpdate).toLocaleString('fa-IR')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-left">
                    <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                      {order.status === 'pending_approval' ? 'در انتظار تأیید' :
                       order.status === 'processing' ? 'در حال پردازش' :
                       order.status === 'ready_for_delivery' ? 'آماده ارسال' :
                       order.status === 'delivered' ? 'تحویل شده' : 'لغو شده'}
                    </Badge>
                    <p className="text-lg font-bold mt-2">
                      {order.totalAmount.toLocaleString()} {order.currency}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <ShoppingCart className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">سفارشی یافت نشد</h3>
            <p className="text-gray-600">با تغییر فیلترها یا کلیدواژه جستجو دوباره تلاش کنید.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
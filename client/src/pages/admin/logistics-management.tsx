import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  Users, 
  Route, 
  MessageSquare, 
  BarChart3, 
  Plus, 
  Edit, 
  Eye, 
  Map,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  MapPin,
  Calendar,
  Weight,
  RefreshCw,
  Send,
  Shield,
  User
} from 'lucide-react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

// Types
interface TransportationCompany {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  serviceTypes: string[];
  coverageAreas: string[];
  maxWeight: string;
  maxVolume: string;
  baseRate: string;
  ratePerKm: string;
  ratePerKg: string;
  isActive: boolean;
  rating: string;
  totalDeliveries: number;
  successfulDeliveries: number;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryVehicle {
  id: number;
  companyId: number;
  vehicleType: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  plateNumber: string;
  maxWeight: string;
  maxVolume?: string;
  fuelType?: string;
  insuranceNumber?: string;
  insuranceExpiry?: string;
  licenseExpiry?: string;
  isActive: boolean;
  currentStatus: string;
  lastMaintenanceDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryPersonnel {
  id: number;
  companyId: number;
  vehicleId?: number;
  fullName: string;
  phone: string;
  email?: string;
  nationalId?: string;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  workStartTime?: string;
  workEndTime?: string;
  workDays: string[];
  totalDeliveries: number;
  successfulDeliveries: number;
  averageRating: string;
  totalRatings: number;
  isActive: boolean;
  currentStatus: string;
  lastLocationUpdate?: string;
  currentLatitude?: string;
  currentLongitude?: string;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryRoute {
  id: number;
  routeName: string;
  driverId: number;
  vehicleId: number;
  startLocation: string;
  endLocation?: string;
  estimatedDistance?: string;
  estimatedDuration?: number;
  orderIds: number[];
  totalStops: number;
  completedStops: number;
  status: string;
  plannedStartTime?: string;
  actualStartTime?: string;
  plannedEndTime?: string;
  actualEndTime?: string;
  totalWeight?: string;
  totalVolume?: string;
  fuelConsumed?: string;
  actualDistance?: string;
  routeGpsData?: string;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryVerificationCode {
  id: number;
  customerOrderId: number;
  verificationCode: string;
  customerPhone: string;
  customerName: string;
  smsMessage?: string;
  smsSentAt?: string;
  smsStatus: string;
  smsProvider?: string;
  smsMessageId?: string;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationLocation?: string;
  verificationLatitude?: string;
  verificationLongitude?: string;
  deliveryAttempts: number;
  lastAttemptAt?: string;
  failureReasons: string[];
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

interface LogisticsOrder {
  id: number;
  customerOrderId: number;
  currentStatus: string;
  calculatedWeight?: number;
  weightUnit?: string;
  totalWeight?: string;
  totalAmount: string;
  currency: string;
  deliveryMethod?: string;
  transportationType?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  warehouseProcessedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const LogisticsManagement = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enable audio notifications for logistics orders
  const { orderCount } = useOrderNotifications({
    department: 'logistics',
    enabled: true
  });

  // Queries
  const { data: pendingOrdersResponse, isLoading: loadingOrders } = useQuery({
    queryKey: ['/api/logistics/orders/pending'],
    enabled: activeTab === 'orders'
  });

  // Get orders that have reached logistics stage (warehouse approved)
  const { data: logisticsOrdersResponse, isLoading: loadingLogisticsOrders } = useQuery({
    queryKey: ['/api/logistics/orders'],
    enabled: activeTab === 'orders'
  });
  
  const pendingOrders = pendingOrdersResponse?.data || [];
  const logisticsOrders = logisticsOrdersResponse?.orders || [];

  const { data: companiesResponse, isLoading: loadingCompanies } = useQuery({
    queryKey: ['/api/logistics/companies'],
    enabled: activeTab === 'companies'
  });

  const { data: vehiclesResponse, isLoading: loadingVehicles } = useQuery({
    queryKey: ['/api/logistics/vehicles'],
    enabled: activeTab === 'vehicles'
  });

  const { data: personnelResponse, isLoading: loadingPersonnel } = useQuery({
    queryKey: ['/api/logistics/personnel'],
    enabled: activeTab === 'personnel'
  });

  const { data: routesResponse, isLoading: loadingRoutes } = useQuery({
    queryKey: ['/api/logistics/routes'],
    enabled: activeTab === 'routes'
  });

  const { data: verificationCodesResponse, isLoading: loadingCodes } = useQuery({
    queryKey: ['/api/logistics/verification-codes'],
    enabled: activeTab === 'verification'
  });

  const companies = companiesResponse?.data || [];
  const vehicles = vehiclesResponse?.data || [];
  const personnel = personnelResponse?.data || [];
  const routes = routesResponse?.data || [];
  const verificationCodes = verificationCodesResponse?.data || [];

  // Generate verification code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async (data: { customerOrderId: number; customerPhone: string; customerName: string }) => {
      const response = await fetch('/api/logistics/verification-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to generate verification code');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "کد تایید تولید شد", description: "کد 4 رقمی برای مشتری ارسال شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/verification-codes'] });
    },
    onError: () => {
      toast({ title: "خطا", description: "تولید کد تایید ناموفق بود", variant: "destructive" });
    }
  });

  // Assign logistics personnel mutation
  const assignPersonnelMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: number; data: any }) => {
      const response = await fetch(`/api/logistics/orders/${orderId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to assign personnel');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "اختصاص موفق", description: "پرسنل لجستیک به سفارش اختصاص داده شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/orders/pending'] });
    },
    onError: () => {
      toast({ title: "خطا", description: "اختصاص پرسنل ناموفق بود", variant: "destructive" });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'warehouse_approved': { color: 'bg-blue-500', text: 'تایید انبار' },
      'logistics_assigned': { color: 'bg-yellow-500', text: 'اختصاص لجستیک' },
      'logistics_processing': { color: 'bg-orange-500', text: 'در حال پردازش' },
      'logistics_dispatched': { color: 'bg-purple-500', text: 'ارسال شده' },
      'logistics_delivered': { color: 'bg-green-500', text: 'تحویل داده شده' },
      'available': { color: 'bg-green-500', text: 'آزاد' },
      'assigned': { color: 'bg-yellow-500', text: 'اختصاص یافته' },
      'in_transit': { color: 'bg-blue-500', text: 'در حال حمل' },
      'maintenance': { color: 'bg-red-500', text: 'تعمیر' },
      'offline': { color: 'bg-gray-500', text: 'آفلاین' },
    };
    const config = statusMap[status] || { color: 'bg-gray-500', text: status };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const OrdersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">مدیریت سفارشات لجستیک</h3>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {logisticsOrders.length} سفارش در لجستیک
          </Badge>
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            {pendingOrders.length} سفارش در انتظار
          </Badge>
        </div>
      </div>

      {/* سفارشاتی که به مرحله لجستیک رسیده‌اند */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h4 className="text-md font-semibold text-green-800">سفارشات تایید شده انبار (در لجستیک)</h4>
        </div>
        
        {loadingLogisticsOrders ? (
          <div className="text-center py-8">در حال بارگذاری سفارشات لجستیک...</div>
        ) : logisticsOrders.length === 0 ? (
          <Card className="border-green-200">
            <CardContent className="text-center py-8">
              <Package className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <p className="text-green-600">هیچ سفارش تایید شده‌ای از انبار موجود نیست</p>
            </CardContent>
          </Card>
        ) : (
          logisticsOrders.map((order: any) => (
            <Card key={order.id} className="border-r-4 border-r-green-500 bg-green-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-green-800 text-lg">سفارش #{order.customerOrderId}</h4>
                  <Badge variant="default" className="bg-green-600 text-white">
                    تایید شده انبار
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {/* Customer Info Block */}
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      اطلاعات گیرنده
                    </h5>
                    <p className="text-sm text-gray-700">{order.customerName}</p>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Phone className="w-3 h-3 mr-1" />
                      {order.customerPhone}
                    </p>
                  </div>

                  {/* Shipment Details Block */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      وزن محموله
                    </h5>
                    <p className="text-lg font-bold text-blue-700 flex items-center">
                      <Weight className="w-4 h-4 mr-1" />
                      {order.totalWeight ? `${order.totalWeight} ${order.weightUnit || 'kg'}` : 'محاسبه نشده'}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">برای انتخاب وسیله حمل</p>
                  </div>

                  {/* Order Date Block */}
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      تاریخ سفارش
                    </h5>
                    <p className="text-lg font-bold text-green-700">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-green-600 mt-1">زمان ثبت سفارش</p>
                  </div>

                  {/* Delivery Date Block */}
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <h5 className="font-medium text-orange-800 mb-2 flex items-center">
                      <Truck className="w-4 h-4 mr-2" />
                      تاریخ تحویل سفارش
                    </h5>
                    <p className="text-lg font-bold text-orange-700">
                      {order.estimatedDeliveryDate ? 
                        new Date(order.estimatedDeliveryDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'تعیین نشده'
                      }
                    </p>
                    <p className="text-xs text-orange-600 mt-1">زمان تحویل به مشتری</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      toast({
                        title: "کد ارسال شد",
                        description: `کد تحویل برای سفارش #${order.customerOrderId} به ${order.customerPhone} ارسال شد`,
                      });
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    ارسال کد به مشتری
                  </Button>
                  <Button size="sm" variant="outline" className="border-green-500 text-green-700 hover:bg-green-100">
                    <Users className="w-4 h-4 mr-2" />
                    اختصاص راننده
                  </Button>
                  <Button size="sm" variant="outline" className="border-green-500 text-green-700 hover:bg-green-100">
                    <MapPin className="w-4 h-4 mr-2" />
                    پیگیری مسیر
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    تحویل شد
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* سفارشات در انتظار */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <h4 className="text-md font-semibold text-orange-800">سفارشات در انتظار پردازش لجستیک</h4>
        </div>

      <div className="grid gap-4">
        {loadingOrders ? (
          <div className="text-center py-8">در حال بارگذاری...</div>
        ) : pendingOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">هیچ سفارش در انتظار لجستیک وجود ندارد</p>
            </CardContent>
          </Card>
        ) : (
          pendingOrders.map((order: LogisticsOrder) => (
            <Card key={order.id} className="border-r-4 border-r-blue-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-blue-800 text-lg">سفارش #{order.customerOrderId}</h4>
                  {getStatusBadge(order.currentStatus)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {/* Customer Info Block */}
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      اطلاعات گیرنده
                    </h5>
                    <p className="text-sm text-gray-700">{order.customerName || 'نامشخص'}</p>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Phone className="w-3 h-3 mr-1" />
                      {order.customerPhone || 'نامشخص'}
                    </p>
                  </div>

                  {/* Shipment Details Block */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      وزن محموله
                    </h5>
                    <p className="text-lg font-bold text-blue-700 flex items-center">
                      <Weight className="w-4 h-4 mr-1" />
                      {order.totalWeight ? `${order.totalWeight} ${order.weightUnit || 'kg'}` : 'محاسبه نشده'}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">برای انتخاب وسیله حمل</p>
                  </div>

                  {/* Order Date Block */}
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      تاریخ سفارش
                    </h5>
                    <p className="text-lg font-bold text-green-700">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-green-600 mt-1">زمان ثبت سفارش</p>
                  </div>

                  {/* Delivery Date Block */}
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <h5 className="font-medium text-orange-800 mb-2 flex items-center">
                      <Truck className="w-4 h-4 mr-2" />
                      تاریخ تحویل سفارش
                    </h5>
                    <p className="text-lg font-bold text-orange-700">
                      {order.estimatedDeliveryDate ? 
                        new Date(order.estimatedDeliveryDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'تعیین نشده'
                      }
                    </p>
                    <p className="text-xs text-orange-600 mt-1">زمان تحویل به مشتری</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Users className="w-4 h-4 mr-2" />
                        اختصاص پرسنل
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>اختصاص پرسنل لجستیک</DialogTitle>
                        <DialogDescription>
                          سفارش #{order.customerOrderId} را به پرسنل لجستیک اختصاص دهید
                        </DialogDescription>
                      </DialogHeader>
                      <AssignPersonnelForm 
                        orderId={order.customerOrderId} 
                        onSubmit={(data) => assignPersonnelMutation.mutate({ orderId: order.customerOrderId, data })}
                      />
                    </DialogContent>
                  </Dialog>

                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    جزئیات
                  </Button>
                  
                  <Button size="sm" variant="outline">
                    <MapPin className="w-4 h-4 mr-2" />
                    پیگیری
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </div>
    </div>
  );

  const CompaniesTab = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [companyFormData, setCompanyFormData] = useState({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      contractEndDate: '',
      serviceTypes: [] as string[],
      coverageAreas: [] as string[],
      maxWeight: '',
      maxVolume: '',
      baseRate: '',
      ratePerKm: '',
      ratePerKg: ''
    });

    const addCompanyMutation = useMutation({
      mutationFn: async (data: any) => {
        const response = await fetch('/api/logistics/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create company');
        return response.json();
      },
      onSuccess: () => {
        setShowAddForm(false);
        setCompanyFormData({
          name: '',
          contactPerson: '',
          phone: '',
          email: '',
          address: '',
          contractEndDate: '',
          serviceTypes: [],
          coverageAreas: [],
          maxWeight: '',
          maxVolume: '',
          baseRate: '',
          ratePerKm: '',
          ratePerKg: ''
        });
        queryClient.invalidateQueries({ queryKey: ['/api/logistics/companies'] });
      }
    });

    const handleSubmitCompany = (e: React.FormEvent) => {
      e.preventDefault();
      if (!companyFormData.name || !companyFormData.phone || !companyFormData.contractEndDate) {
        alert('لطفاً نام شرکت، شماره تماس و پایان قرارداد را وارد کنید');
        return;
      }
      addCompanyMutation.mutate(companyFormData);
    };

    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">شرکت‌های حمل و نقل</h3>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          شرکت جدید
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>ثبت شرکت حمل و نقل جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitCompany} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">نام شرکت *</Label>
                  <Input
                    id="name"
                    value={companyFormData.name}
                    onChange={(e) => setCompanyFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="نام شرکت حمل و نقل"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">نام مسئول</Label>
                  <Input
                    id="contactPerson"
                    value={companyFormData.contactPerson}
                    onChange={(e) => setCompanyFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    placeholder="نام شخص رابط"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">شماره تماس *</Label>
                  <Input
                    id="phone"
                    value={companyFormData.phone}
                    onChange={(e) => setCompanyFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="شماره تماس شرکت"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyFormData.email}
                    onChange={(e) => setCompanyFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="آدرس ایمیل"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">آدرس</Label>
                <Input
                  id="address"
                  value={companyFormData.address}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="آدرس کامل شرکت"
                />
              </div>

              <div>
                <Label htmlFor="contractEndDate">پایان قرارداد *</Label>
                <Input
                  id="contractEndDate"
                  type="date"
                  value={companyFormData.contractEndDate}
                  onChange={(e) => setCompanyFormData(prev => ({ ...prev, contractEndDate: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="maxWeight">حداکثر وزن (کیلوگرم)</Label>
                  <Input
                    id="maxWeight"
                    type="number"
                    value={companyFormData.maxWeight}
                    onChange={(e) => setCompanyFormData(prev => ({ ...prev, maxWeight: e.target.value }))}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="baseRate">نرخ پایه (دینار)</Label>
                  <Input
                    id="baseRate"
                    type="number"
                    value={companyFormData.baseRate}
                    onChange={(e) => setCompanyFormData(prev => ({ ...prev, baseRate: e.target.value }))}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <Label htmlFor="ratePerKm">نرخ هر کیلومتر</Label>
                  <Input
                    id="ratePerKm"
                    type="number"
                    value={companyFormData.ratePerKm}
                    onChange={(e) => setCompanyFormData(prev => ({ ...prev, ratePerKm: e.target.value }))}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={addCompanyMutation.isPending}>
                  {addCompanyMutation.isPending ? 'در حال ثبت...' : 'ثبت شرکت'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  لغو
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {loadingCompanies ? (
          <div className="text-center py-8">در حال بارگذاری...</div>
        ) : companies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Truck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">هیچ شرکت حمل و نقل ثبت نشده است</p>
            </CardContent>
          </Card>
        ) : (
          companies.map((company: TransportationCompany) => (
            <Card key={company.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{company.name}</h4>
                    <p className="text-sm text-gray-600">{company.contactPerson}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm">📞 {company.phone}</span>
                      <span className="text-sm">✉️ {company.email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm">⭐ {company.rating}/5</span>
                      <span className="text-sm">({company.totalDeliveries} تحویل)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {company.isActive ? (
                      <Badge className="bg-green-500">فعال</Badge>
                    ) : (
                      <Badge className="bg-red-500">غیرفعال</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    ویرایش
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    جزئیات
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
    );
  };

  const VehiclesTab = () => {
    const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
    const [vehicleFormData, setVehicleFormData] = useState({
      vehicleNumber: '',
      ownerName: '',
      ownerPhone: '',
      ownerAddress: '',
      ownerEmail: '',
      vehicleType: '',
      make: '',
      model: '',
      year: '',
      plateNumber: '',
      maxWeight: '',
      maxVolume: '',
      fuelType: '',
      insuranceNumber: '',
      insuranceExpiry: '',
      licenseExpiry: '',
      dailyRate: '',
      kmRate: '',
      isSettled: false
    });

    const addVehicleMutation = useMutation({
      mutationFn: async (data: any) => {
        const response = await fetch('/api/logistics/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create vehicle');
        return response.json();
      },
      onSuccess: () => {
        setShowAddVehicleForm(false);
        setVehicleFormData({
          vehicleNumber: '',
          ownerName: '',
          ownerPhone: '',
          ownerAddress: '',
          ownerEmail: '',
          vehicleType: '',
          make: '',
          model: '',
          year: '',
          plateNumber: '',
          maxWeight: '',
          maxVolume: '',
          fuelType: '',
          insuranceNumber: '',
          insuranceExpiry: '',
          licenseExpiry: '',
          dailyRate: '',
          kmRate: '',
          isSettled: false
        });
        queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicles'] });
      }
    });

    const handleSubmitVehicle = (e: React.FormEvent) => {
      e.preventDefault();
      if (!vehicleFormData.vehicleNumber || !vehicleFormData.ownerName || !vehicleFormData.ownerPhone || !vehicleFormData.plateNumber) {
        alert('لطفاً شماره وسیله، نام صاحب، شماره تلفن و پلاک را وارد کنید');
        return;
      }
      addVehicleMutation.mutate(vehicleFormData);
    };

    return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">وسایل نقلیه</h3>
        <Button onClick={() => setShowAddVehicleForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          وسیله جدید
        </Button>
      </div>

      {showAddVehicleForm && (
        <Card>
          <CardHeader>
            <CardTitle>ثبت وسیله نقلیه جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleNumber">شماره وسیله نقلیه *</Label>
                  <Input
                    id="vehicleNumber"
                    value={vehicleFormData.vehicleNumber}
                    onChange={(e) => setVehicleFormData(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                    placeholder="شماره شناسایی وسیله"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ownerName">نام صاحب وسیله *</Label>
                  <Input
                    id="ownerName"
                    value={vehicleFormData.ownerName}
                    onChange={(e) => setVehicleFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                    placeholder="نام کامل مالک"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerPhone">شماره تلفن صاحب *</Label>
                  <Input
                    id="ownerPhone"
                    value={vehicleFormData.ownerPhone}
                    onChange={(e) => setVehicleFormData(prev => ({ ...prev, ownerPhone: e.target.value }))}
                    placeholder="شماره تماس مالک"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ownerEmail">ایمیل صاحب</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={vehicleFormData.ownerEmail}
                    onChange={(e) => setVehicleFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                    placeholder="آدرس ایمیل مالک"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ownerAddress">آدرس صاحب</Label>
                <Input
                  id="ownerAddress"
                  value={vehicleFormData.ownerAddress}
                  onChange={(e) => setVehicleFormData(prev => ({ ...prev, ownerAddress: e.target.value }))}
                  placeholder="آدرس کامل مالک"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleType">نوع وسیله *</Label>
                  <Select
                    value={vehicleFormData.vehicleType}
                    onValueChange={(value) => setVehicleFormData(prev => ({ ...prev, vehicleType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب نوع وسیله" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="truck">کامیون</SelectItem>
                      <SelectItem value="van">ون</SelectItem>
                      <SelectItem value="pickup">پیکاپ</SelectItem>
                      <SelectItem value="motorcycle">موتورسیکلت</SelectItem>
                      <SelectItem value="trailer">تریلر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="plateNumber">شماره پلاک *</Label>
                  <Input
                    id="plateNumber"
                    value={vehicleFormData.plateNumber}
                    onChange={(e) => setVehicleFormData(prev => ({ ...prev, plateNumber: e.target.value }))}
                    placeholder="شماره پلاک وسیله"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="make">برند</Label>
                  <Input
                    id="make"
                    value={vehicleFormData.make}
                    onChange={(e) => setVehicleFormData(prev => ({ ...prev, make: e.target.value }))}
                    placeholder="برند وسیله"
                  />
                </div>
                <div>
                  <Label htmlFor="model">مدل</Label>
                  <Input
                    id="model"
                    value={vehicleFormData.model}
                    onChange={(e) => setVehicleFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="مدل وسیله"
                  />
                </div>
                <div>
                  <Label htmlFor="year">سال ساخت</Label>
                  <Input
                    id="year"
                    type="number"
                    value={vehicleFormData.year}
                    onChange={(e) => setVehicleFormData(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="سال"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxWeight">حداکثر وزن (کیلوگرم)</Label>
                  <Input
                    id="maxWeight"
                    type="number"
                    value={vehicleFormData.maxWeight}
                    onChange={(e) => setVehicleFormData(prev => ({ ...prev, maxWeight: e.target.value }))}
                    placeholder="حداکثر ظرفیت وزن"
                  />
                </div>
                <div>
                  <Label htmlFor="fuelType">نوع سوخت</Label>
                  <Select
                    value={vehicleFormData.fuelType}
                    onValueChange={(value) => setVehicleFormData(prev => ({ ...prev, fuelType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="نوع سوخت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline">بنزین</SelectItem>
                      <SelectItem value="diesel">دیزل</SelectItem>
                      <SelectItem value="gas">گاز</SelectItem>
                      <SelectItem value="hybrid">هیبرید</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dailyRate">نرخ روزانه (دینار)</Label>
                  <Input
                    id="dailyRate"
                    type="number"
                    value={vehicleFormData.dailyRate}
                    onChange={(e) => setVehicleFormData(prev => ({ ...prev, dailyRate: e.target.value }))}
                    placeholder="نرخ اجاره روزانه"
                  />
                </div>
                <div>
                  <Label htmlFor="kmRate">نرخ کیلومتری (دینار)</Label>
                  <Input
                    id="kmRate"
                    type="number"
                    value={vehicleFormData.kmRate}
                    onChange={(e) => setVehicleFormData(prev => ({ ...prev, kmRate: e.target.value }))}
                    placeholder="نرخ هر کیلومتر"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={addVehicleMutation.isPending}>
                  {addVehicleMutation.isPending ? 'در حال ثبت...' : 'ثبت وسیله'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddVehicleForm(false)}>
                  لغو
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {loadingVehicles ? (
          <div className="text-center py-8">در حال بارگذاری...</div>
        ) : vehicles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Truck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">هیچ وسیله نقلیه ثبت نشده است</p>
            </CardContent>
          </Card>
        ) : (
          vehicles.map((vehicle: DeliveryVehicle) => (
            <Card key={vehicle.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{vehicle.make} {vehicle.model}</h4>
                        <p className="text-sm text-gray-600">شماره وسیله: {vehicle.plateNumber}</p>
                        <p className="text-sm text-gray-600">نام صاحب: محمد علی احمدی</p>
                        <p className="text-sm text-gray-600">تلفن: 09123456789</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(vehicle.currentStatus)}
                        <div className="mt-2">
                          <Badge variant={Math.random() > 0.5 ? "default" : "destructive"}>
                            {Math.random() > 0.5 ? "تسویه شده" : "تسویه نشده"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <span className="text-sm font-medium">نوع وسیله:</span>
                        <span className="text-sm mr-2">{vehicle.vehicleType}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">حداکثر وزن:</span>
                        <span className="text-sm mr-2">{vehicle.maxWeight} کیلو</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">سفارشات فعال:</span>
                        <span className="text-sm mr-2">{Math.floor(Math.random() * 5)} سفارش</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">درآمد ماهانه:</span>
                        <span className="text-sm mr-2">{(Math.random() * 1000000).toFixed(0)} دینار</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      ویرایش
                    </Button>
                    <Button size="sm" variant="outline">
                      <Truck className="w-4 h-4 mr-2" />
                      سفارشات
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      صورتحساب
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <MapPin className="w-4 h-4 mr-2" />
                      موقعیت
                    </Button>
                    <Button size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      گزارش
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
    );
  };

  const PersonnelTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">پرسنل تحویل</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          راننده جدید
        </Button>
      </div>

      <div className="grid gap-4">
        {loadingPersonnel ? (
          <div className="text-center py-8">در حال بارگذاری...</div>
        ) : personnel.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">هیچ پرسنل تحویل ثبت نشده است</p>
            </CardContent>
          </Card>
        ) : (
          personnel.map((person: DeliveryPersonnel) => (
            <Card key={person.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{person.fullName}</h4>
                    <p className="text-sm text-gray-600">📞 {person.phone}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm">گواهینامه: {person.licenseType}</span>
                      <span className="text-sm">⭐ {person.averageRating}/5</span>
                      <span className="text-sm">({person.totalDeliveries} تحویل)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(person.currentStatus)}
                    {person.lastLocationUpdate && (
                      <p className="text-xs text-gray-500 mt-1">
                        آخرین به‌روزرسانی: {new Date(person.lastLocationUpdate).toLocaleString('en-US')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    ویرایش
                  </Button>
                  <Button size="sm" variant="outline">
                    <MapPin className="w-4 h-4 mr-2" />
                    موقعیت فعلی
                  </Button>
                  <Button size="sm" variant="outline">
                    <Phone className="w-4 h-4 mr-2" />
                    تماس
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const RoutesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">مسیرهای تحویل</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          مسیر جدید
        </Button>
      </div>

      <div className="grid gap-4">
        {loadingRoutes ? (
          <div className="text-center py-8">در حال بارگذاری...</div>
        ) : routes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Route className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">هیچ مسیر تحویل برنامه‌ریزی نشده است</p>
            </CardContent>
          </Card>
        ) : (
          routes.map((route: DeliveryRoute) => (
            <Card key={route.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold">{route.routeName}</h4>
                    <p className="text-sm text-gray-600">از: {route.startLocation}</p>
                    {route.endLocation && (
                      <p className="text-sm text-gray-600">به: {route.endLocation}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {getStatusBadge(route.status)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">توقف‌ها:</span>
                    <p>{route.completedStops}/{route.totalStops}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">مسافت تخمینی:</span>
                    <p>{route.estimatedDistance} کیلومتر</p>
                  </div>
                  <div>
                    <span className="text-gray-500">زمان تخمینی:</span>
                    <p>{route.estimatedDuration} دقیقه</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    ویرایش
                  </Button>
                  <Button size="sm" variant="outline">
                    <Map className="w-4 h-4 mr-2" />
                    نقشه
                  </Button>
                  <Button size="sm" variant="outline">
                    <Clock className="w-4 h-4 mr-2" />
                    شروع مسیر
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const VerificationTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">کدهای تایید تحویل</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            ارسال مجدد
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {loadingCodes ? (
          <div className="text-center py-8">در حال بارگذاری...</div>
        ) : verificationCodes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">هیچ کد تایید تحویل تولید نشده است</p>
            </CardContent>
          </Card>
        ) : (
          verificationCodes.map((code: DeliveryVerificationCode) => (
            <Card key={code.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold">سفارش #{code.customerOrderId}</h4>
                    <p className="text-sm text-gray-600">مشتری: {code.customerName}</p>
                    <p className="text-sm text-gray-600">تلفن: {code.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-blue-600 mb-2">
                      {code.verificationCode}
                    </div>
                    {code.isVerified ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">تایید شده</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">در انتظار تایید</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">وضعیت SMS:</span>
                    <p>{code.smsStatus === 'sent' ? 'ارسال شده' : 'در انتظار'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">تلاش‌های تحویل:</span>
                    <p>{code.deliveryAttempts}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">انقضا:</span>
                    <p>{new Date(code.expiresAt).toLocaleDateString('en-US')}</p>
                  </div>
                </div>

                {code.isVerified && code.verifiedBy && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm">
                      <strong>تایید شده توسط:</strong> {code.verifiedBy}
                    </p>
                    {code.verifiedAt && (
                      <p className="text-xs text-gray-600">
                        {new Date(code.verifiedAt).toLocaleString('en-US')}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    ارسال مجدد
                  </Button>
                  <Button size="sm" variant="outline">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    تایید دستی
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const AnalyticsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">تحلیل‌های لجستیک</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">سفارشات امروز</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">تحویل‌های موفق</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">رانندگان فعال</p>
                <p className="text-2xl font-bold">{personnel.filter(p => p.currentStatus === 'available').length}</p>
              </div>
              <Users className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">وسایل آزاد</p>
                <p className="text-2xl font-bold">{vehicles.filter(v => v.currentStatus === 'available').length}</p>
              </div>
              <Truck className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>گزارش عملکرد هفتگی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            نمودار عملکرد لجستیک در دست توسعه است
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">مدیریت لجستیک</h1>
        <p className="text-gray-600 mt-2">
          مدیریت حمل و نقل، تحویل کالاها و ردیابی سفارشات
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            سفارشات
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            شرکت‌ها
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            وسایل نقلیه
          </TabsTrigger>
          <TabsTrigger value="personnel" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            پرسنل
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Route className="w-4 h-4" />
            مسیرها
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            کدهای تایید
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>

        <TabsContent value="companies">
          <CompaniesTab />
        </TabsContent>

        <TabsContent value="vehicles">
          <VehiclesTab />
        </TabsContent>

        <TabsContent value="personnel">
          <PersonnelTab />
        </TabsContent>

        <TabsContent value="routes">
          <RoutesTab />
        </TabsContent>

        <TabsContent value="verification">
          <VerificationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper component for assigning personnel
const AssignPersonnelForm = ({ orderId, onSubmit }: { orderId: number; onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    logisticsAssigneeId: '',
    deliveryMethod: '',
    transportationType: '',
    estimatedDeliveryDate: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="logisticsAssigneeId">پرسنل لجستیک</Label>
        <Select 
          value={formData.logisticsAssigneeId} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, logisticsAssigneeId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="انتخاب پرسنل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">علی محمدی</SelectItem>
            <SelectItem value="2">حسن احمدی</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="deliveryMethod">روش تحویل</Label>
        <Select 
          value={formData.deliveryMethod} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, deliveryMethod: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="انتخاب روش تحویل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="courier">پیک</SelectItem>
            <SelectItem value="post">پست</SelectItem>
            <SelectItem value="truck">کامیون</SelectItem>
            <SelectItem value="personal_pickup">تحویل حضوری</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="transportationType">نوع وسیله نقلیه</Label>
        <Select 
          value={formData.transportationType} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, transportationType: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="انتخاب نوع وسیله" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="motorcycle">موتورسیکلت</SelectItem>
            <SelectItem value="car">خودرو</SelectItem>
            <SelectItem value="truck">کامیون</SelectItem>
            <SelectItem value="van">ون</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="estimatedDeliveryDate">تاریخ تحویل تخمینی</Label>
        <Input 
          type="datetime-local"
          value={formData.estimatedDeliveryDate}
          onChange={(e) => setFormData(prev => ({ ...prev, estimatedDeliveryDate: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="notes">یادداشت</Label>
        <Textarea 
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="یادداشت اختیاری..."
        />
      </div>

      <Button type="submit" className="w-full">
        اختصاص پرسنل
      </Button>
    </form>
  );
};

export default LogisticsManagement;
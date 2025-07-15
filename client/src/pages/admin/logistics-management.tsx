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
  Weight
} from 'lucide-react';

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
  totalAmount: string;
  currency: string;
  deliveryMethod?: string;
  transportationType?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  createdAt: string;
  updatedAt: string;
}

const LogisticsManagement = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: pendingOrdersResponse, isLoading: loadingOrders } = useQuery({
    queryKey: ['/api/logistics/orders/pending'],
    enabled: activeTab === 'orders'
  });
  
  const pendingOrders = pendingOrdersResponse?.data || [];

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['/api/logistics/companies'],
    enabled: activeTab === 'companies'
  });

  const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
    queryKey: ['/api/logistics/vehicles'],
    enabled: activeTab === 'vehicles'
  });

  const { data: personnel = [], isLoading: loadingPersonnel } = useQuery({
    queryKey: ['/api/logistics/personnel'],
    enabled: activeTab === 'personnel'
  });

  const { data: routes = [], isLoading: loadingRoutes } = useQuery({
    queryKey: ['/api/logistics/routes'],
    enabled: activeTab === 'routes'
  });

  const { data: verificationCodes = [], isLoading: loadingCodes } = useQuery({
    queryKey: ['/api/logistics/verification-codes'],
    enabled: activeTab === 'verification'
  });

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
        <h3 className="text-lg font-semibold">سفارشات تایید شده انبار</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Package className="w-4 h-4 mr-2" />
            همه سفارشات
          </Button>
        </div>
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
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold">سفارش #{order.customerOrderId}</h4>
                    <p className="text-sm text-gray-600">
                      مبلغ: {order.totalAmount} {order.currency}
                    </p>
                    {order.calculatedWeight && (
                      <div className="flex items-center gap-2 mt-2">
                        <Weight className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">وزن: {order.calculatedWeight} {order.weightUnit}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.currentStatus)}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-US')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
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

                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => generateCodeMutation.mutate({
                      customerOrderId: order.customerOrderId,
                      customerPhone: "09123456789", // This should come from order data
                      customerName: "مشتری" // This should come from order data
                    })}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    تولید کد تحویل
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

  const CompaniesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">شرکت‌های حمل و نقل</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          شرکت جدید
        </Button>
      </div>

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

  const VehiclesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">وسایل نقلیه</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          وسیله جدید
        </Button>
      </div>

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
                  <div>
                    <h4 className="font-semibold">{vehicle.make} {vehicle.model}</h4>
                    <p className="text-sm text-gray-600">پلاک: {vehicle.plateNumber}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm">نوع: {vehicle.vehicleType}</span>
                      <span className="text-sm">حداکثر وزن: {vehicle.maxWeight} کیلوگرم</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(vehicle.currentStatus)}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    ویرایش
                  </Button>
                  <Button size="sm" variant="outline">
                    <MapPin className="w-4 h-4 mr-2" />
                    موقعیت
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

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
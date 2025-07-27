import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Users, 
  Truck, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  Plus, 
  Edit, 
  Eye, 
  Phone,
  User,
  Shield,
  AlertTriangle,
  FileText,
  Printer,
  Calculator,
  History,
  Mail,
  Flame,
  Weight,
  Scale
} from 'lucide-react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import PostalServicesTab from '@/components/PostalServicesTab';


// Safe date formatting function to prevent Invalid Date errors
const formatDateSafe = (dateString: string | null | undefined, locale = 'en-US', options = {}): string => {
  if (!dateString) return 'تاریخ نامشخص';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'تاریخ نامعتبر';
    
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    });
  } catch (error) {
    return 'خطا در تاریخ';
  }
};

interface TransportationCompany {
  id: number;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  website?: string;
  isActive: boolean;
  rating?: number;
  totalDeliveries: number;
}

interface PostalService {
  id: number;
  name: string;
  nameEn?: string;
  contactInfo?: string;
  phone: string;
  email?: string;
  website?: string;
  maxWeightKg: number;
  allowsFlammable: boolean;
  basePrice: number;
  pricePerKg: number;
  estimatedDays: number;
  trackingAvailable: boolean;
  isActive: boolean;
  supportedRegions?: string[];
  specialRequirements?: string;
}

interface LogisticsOrder {
  id: number;
  customerOrderId: number;
  orderNumber?: string;
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
  deliveryCode?: string;
  isVerified?: boolean;
  customerAddress?: string;
  
  // Delivery Address information
  shippingAddress?: string;
  billingAddress?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  deliveryNotes?: string;
  
  // GPS Location data for logistics coordination
  gpsLatitude?: number | string | null;
  gpsLongitude?: number | string | null;
  locationAccuracy?: number | string | null;
  hasGpsLocation?: boolean;
  
  // Customer information
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

const LogisticsManagement = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orderButtonStates, setOrderButtonStates] = useState<{[orderId: number]: { 
    isCodeSent: boolean; 
    existingCode: string | null; 
    isGenerating: boolean;
  }}>({});
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<any>(null);
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
  
  // States for delivery code resending
  const [resendingCodes, setResendingCodes] = useState<{[orderId: number]: boolean}>({});
  const [resentCodes, setResentCodes] = useState<{[orderId: number]: boolean}>({});
  
  // States for order details modal
  const [selectedOrder, setSelectedOrder] = useState<LogisticsOrder | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

  // States for postal services
  const [isCreatePostalDialogOpen, setIsCreatePostalDialogOpen] = useState(false);
  const [selectedPostalService, setSelectedPostalService] = useState<PostalService | null>(null);

  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [shippingWeight, setShippingWeight] = useState<number>(1);
  const [orderValue, setOrderValue] = useState<number>(0);
  const [shippingCalculation, setShippingCalculation] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enable audio notifications for logistics orders
  const { orderCount } = useOrderNotifications({
    department: 'logistics',
    enabled: true
  });

  // Get orders that have reached logistics stage (warehouse approved)
  const { data: logisticsOrdersResponse, isLoading: loadingLogisticsOrders } = useQuery({
    queryKey: ['/api/order-management/logistics'],
    enabled: activeTab === 'orders'
  });
  
  const logisticsOrders = (logisticsOrdersResponse as any)?.orders || [];
  
  // Debug: Log first order to check orderNumber field
  if (logisticsOrders.length > 0) {
    console.log('🔍 [LOGISTICS MGMT] First order data:', {
      id: logisticsOrders[0].id,
      customerOrderId: logisticsOrders[0].customerOrderId,
      orderNumber: logisticsOrders[0].orderNumber,
      hasOrderNumber: !!logisticsOrders[0].orderNumber,
      allFields: Object.keys(logisticsOrders[0])
    });
  }
  
  // Map data to add customer object structure for compatibility
  const mappedLogisticsOrders = logisticsOrders.map((order: any) => ({
    ...order,
    // Use existing customer object if available, otherwise create from individual fields
    customer: order.customer || {
      firstName: order.customerFirstName,
      lastName: order.customerLastName,
      email: order.customerEmail,
      phone: order.customerPhone
    },
    // Ensure customerAddress is available for display
    customerAddress: order.customerAddress || 'آدرس ثبت نشده',
    // Add GPS location availability flag
    hasGpsLocation: !!(order.gpsLatitude && order.gpsLongitude)
  }));

  const { data: companiesResponse, isLoading: loadingCompanies } = useQuery({
    queryKey: ['/api/logistics/companies'],
    enabled: activeTab === 'companies'
  });

  // Iraqi provinces and cities data
  const { data: provincesResponse, isLoading: loadingProvinces } = useQuery({
    queryKey: ['/api/logistics/provinces'],
    enabled: activeTab === 'cities' || activeTab === 'shipping' || activeTab === 'geography'
  });

  // Geography data for new geography tab
  const { data: geographyProvincesResponse, isLoading: loadingGeographyProvinces } = useQuery({
    queryKey: ['/api/logistics/provinces-detailed'],
    enabled: activeTab === 'geography'
  });

  const { data: geographyCitiesResponse, isLoading: loadingGeographyCities } = useQuery({
    queryKey: ['/api/logistics/cities-detailed'],
    enabled: activeTab === 'geography'
  });

  // Vehicle optimization states
  const [isCreateVehicleDialogOpen, setIsCreateVehicleDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [optimizationRequest, setOptimizationRequest] = useState<any>({});

  const { data: citiesResponse, isLoading: loadingCities } = useQuery({
    queryKey: ['/api/logistics/cities'],
    enabled: activeTab === 'cities' || activeTab === 'shipping' || activeTab === 'geography'
  });

  const { data: shippingRatesResponse, isLoading: loadingShippingRates } = useQuery({
    queryKey: ['/api/logistics/shipping-rates'],
    enabled: activeTab === 'shipping'
  });

  // Vehicle optimization queries
  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['/api/logistics/vehicle-templates'],
    enabled: activeTab === 'vehicles'
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/logistics/vehicle-selection-history'],
    enabled: activeTab === 'vehicles'
  });

  const companies = (companiesResponse as any)?.data || [];
  const vehicles = (vehiclesData as any)?.data || [];
  const history = (historyData as any)?.data || [];

  // Vehicle optimization mutations
  const createVehicleMutation = useMutation({
    mutationFn: (data: any) => 
      fetch('/api/logistics/vehicle-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicle-templates'] });
      setIsCreateVehicleDialogOpen(false);
      toast({ title: "موفقیت", description: "الگوی خودرو ایجاد شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در ایجاد الگوی خودرو", variant: "destructive" });
    }
  });

  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & any) => 
      fetch(`/api/logistics/vehicle-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicle-templates'] });
      setEditingVehicle(null);
      toast({ title: "موفقیت", description: "الگوی خودرو بروزرسانی شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در بروزرسانی الگوی خودرو", variant: "destructive" });
    }
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: (id: number) => 
      fetch(`/api/logistics/vehicle-templates/${id}`, {
        method: 'DELETE'
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicle-templates'] });
      toast({ title: "موفقیت", description: "الگوی خودرو حذف شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در حذف الگوی خودرو", variant: "destructive" });
    }
  });

  const optimizeVehicleMutation = useMutation({
    mutationFn: (data: any) => 
      fetch('/api/logistics/select-optimal-vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicle-selection-history'] });
      toast({ 
        title: "انتخاب بهینه انجام شد", 
        description: `وسیله انتخاب شده: ${result.data.selectedVehicle.vehicleName} - هزینه: ${parseInt(result.data.selectedVehicle.totalCost).toLocaleString()} دینار`
      });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در انتخاب وسیله بهینه", variant: "destructive" });
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
    const config = (statusMap as any)[status] || { color: 'bg-gray-500', text: status };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  // Show order details in modal
  const handleShowOrderDetails = (order: LogisticsOrder) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  const VEHICLE_TYPES = {
    motorcycle: "موتور",
    van: "وانت", 
    light_truck: "کامیون سبک",
    heavy_truck: "کامیون سنگین"
  };

  const ROUTE_TYPES = {
    urban: "شهری",
    interurban: "بین شهری",
    highway: "آزادراه"
  };

  const handleCreateVehicle = (formData: FormData) => {
    const vehicleData = {
      name: formData.get('name') as string,
      nameEn: formData.get('nameEn') as string,
      vehicleType: formData.get('vehicleType') as string,
      maxWeightKg: formData.get('maxWeightKg') as string,
      maxVolumeM3: formData.get('maxVolumeM3') as string || null,
      allowedRoutes: (formData.get('allowedRoutes') as string).split(',').map(r => r.trim()),
      basePrice: formData.get('basePrice') as string,
      pricePerKm: formData.get('pricePerKm') as string,
      pricePerKg: formData.get('pricePerKg') as string || "0",
      supportsHazardous: formData.get('supportsHazardous') === 'true',
      supportsRefrigerated: formData.get('supportsRefrigerated') === 'true',
      supportsFragile: formData.get('supportsFragile') !== 'false',
      averageSpeedKmh: formData.get('averageSpeedKmh') as string || "50",
      fuelConsumptionL100km: formData.get('fuelConsumptionL100km') as string || null,
      priority: parseInt(formData.get('priority') as string) || 0
    };
    createVehicleMutation.mutate(vehicleData);
  };

  const handleOptimizeVehicle = () => {
    if (!optimizationRequest.orderNumber || !optimizationRequest.weightKg || !optimizationRequest.routeType || !optimizationRequest.distanceKm) {
      toast({ title: "خطا", description: "لطفاً همه فیلدهای اجباری را پر کنید", variant: "destructive" });
      return;
    }
    optimizeVehicleMutation.mutate(optimizationRequest);
  };

  const handleDeleteVehicle = (vehicleId: number) => {
    if (confirm("آیا از حذف این الگوی خودرو مطمئن هستید؟")) {
      deleteVehicleMutation.mutate(vehicleId);
    }
  };

  const handleEditVehicle = (formData: FormData) => {
    if (!editingVehicle) return;
    
    const data = {
      name: formData.get('name') as string,
      nameEn: formData.get('nameEn') as string,
      vehicleType: formData.get('vehicleType') as string,
      maxWeightKg: parseInt(formData.get('maxWeightKg') as string),
      basePrice: parseInt(formData.get('basePrice') as string),
      pricePerKm: parseInt(formData.get('pricePerKm') as string),
      allowedRoutes: formData.get('allowedRoutes') as string,
      averageSpeedKmh: parseInt(formData.get('averageSpeedKmh') as string) || 50,
      isActive: formData.get('isActive') === 'on'
    };

    updateVehicleMutation.mutate({ id: editingVehicle.id, ...data });
  };

  const VehicleOptimizationTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="h-5 w-5" />
              سیستم انتخاب بهینه وسیله نقلیه
            </h2>
            <p className="text-muted-foreground text-sm">مدیریت الگوهای خودرو و انتخاب بهینه بر اساس الگوریتم هزینه</p>
          </div>
        </div>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">الگوهای خودرو</TabsTrigger>
            <TabsTrigger value="optimization">انتخاب بهینه</TabsTrigger>
            <TabsTrigger value="history">تاریخچه انتخاب</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-medium">الگوهای خودرو</h3>
              <Dialog open={isCreateVehicleDialogOpen} onOpenChange={setIsCreateVehicleDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 ml-2" />
                    افزودن الگوی جدید
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>افزودن الگوی خودروی جدید</DialogTitle>
                    <DialogDescription>اطلاعات الگوی خودرو را برای استفاده در انتخاب بهینه وارد کنید</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); handleCreateVehicle(new FormData(e.currentTarget)); }}>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">نام فارسی *</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nameEn">نام انگلیسی</Label>
                        <Input id="nameEn" name="nameEn" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleType">نوع خودرو *</Label>
                        <select name="vehicleType" required className="w-full p-2 border rounded">
                          <option value="">انتخاب نوع خودرو</option>
                          {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxWeightKg">حداکثر وزن (کیلوگرم) *</Label>
                        <Input id="maxWeightKg" name="maxWeightKg" type="number" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="basePrice">قیمت پایه (دینار) *</Label>
                        <Input id="basePrice" name="basePrice" type="number" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pricePerKm">قیمت هر کیلومتر (دینار) *</Label>
                        <Input id="pricePerKm" name="pricePerKm" type="number" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="allowedRoutes">مسیرهای مجاز *</Label>
                        <Input id="allowedRoutes" name="allowedRoutes" placeholder="urban,interurban,highway" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="averageSpeedKmh">سرعت متوسط (کیلومتر/ساعت)</Label>
                        <Input id="averageSpeedKmh" name="averageSpeedKmh" type="number" defaultValue="50" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateVehicleDialogOpen(false)}>انصراف</Button>
                      <Button type="submit" disabled={createVehicleMutation.isPending}>
                        {createVehicleMutation.isPending ? "در حال ایجاد..." : "ایجاد الگو"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام</TableHead>
                      <TableHead>نوع</TableHead>
                      <TableHead>حداکثر وزن</TableHead>
                      <TableHead>قیمت پایه</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehiclesLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">در حال بارگذاری...</TableCell>
                      </TableRow>
                    ) : vehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">هیچ الگوی خودرویی یافت نشد</TableCell>
                      </TableRow>
                    ) : (
                      vehicles.map((vehicle: any) => (
                        <TableRow key={vehicle.id}>
                          <TableCell>{vehicle.name}</TableCell>
                          <TableCell>{(VEHICLE_TYPES as any)[vehicle.vehicleType] || vehicle.vehicleType}</TableCell>
                          <TableCell>{vehicle.maxWeightKg} کیلوگرم</TableCell>
                          <TableCell>{parseInt(vehicle.basePrice).toLocaleString()} دینار</TableCell>
                          <TableCell>
                            <Badge variant={vehicle.isActive ? "default" : "secondary"}>
                              {vehicle.isActive ? "فعال" : "غیرفعال"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingVehicle(vehicle)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                ویرایش
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteVehicle(vehicle.id)}
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                حذف
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit Vehicle Dialog */}
            <Dialog open={!!editingVehicle} onOpenChange={(open) => !open && setEditingVehicle(null)}>
              <DialogContent className="max-w-2xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle>ویرایش الگوی خودرو</DialogTitle>
                  <DialogDescription>اطلاعات الگوی خودرو را ویرایش کنید</DialogDescription>
                </DialogHeader>
                {editingVehicle && (
                  <form onSubmit={(e) => { e.preventDefault(); handleEditVehicle(new FormData(e.currentTarget)); }}>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">نام فارسی *</Label>
                        <Input 
                          id="edit-name" 
                          name="name" 
                          defaultValue={editingVehicle.name}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-nameEn">نام انگلیسی</Label>
                        <Input 
                          id="edit-nameEn" 
                          name="nameEn" 
                          defaultValue={editingVehicle.nameEn || ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-vehicleType">نوع خودرو *</Label>
                        <select 
                          name="vehicleType" 
                          defaultValue={editingVehicle.vehicleType}
                          required 
                          className="w-full p-2 border rounded"
                        >
                          <option value="">انتخاب نوع خودرو</option>
                          {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-maxWeightKg">حداکثر وزن (کیلوگرم) *</Label>
                        <Input 
                          id="edit-maxWeightKg" 
                          name="maxWeightKg" 
                          type="number" 
                          defaultValue={editingVehicle.maxWeightKg}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-basePrice">قیمت پایه (دینار) *</Label>
                        <Input 
                          id="edit-basePrice" 
                          name="basePrice" 
                          type="number" 
                          defaultValue={editingVehicle.basePrice}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-pricePerKm">قیمت هر کیلومتر (دینار) *</Label>
                        <Input 
                          id="edit-pricePerKm" 
                          name="pricePerKm" 
                          type="number" 
                          defaultValue={editingVehicle.pricePerKm}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-allowedRoutes">مسیرهای مجاز *</Label>
                        <Input 
                          id="edit-allowedRoutes" 
                          name="allowedRoutes" 
                          defaultValue={editingVehicle.allowedRoutes}
                          placeholder="urban,interurban,highway" 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-averageSpeedKmh">سرعت متوسط (کیلومتر/ساعت)</Label>
                        <Input 
                          id="edit-averageSpeedKmh" 
                          name="averageSpeedKmh" 
                          type="number" 
                          defaultValue={editingVehicle.averageSpeedKmh || 50}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="edit-isActive" 
                            name="isActive" 
                            defaultChecked={editingVehicle.isActive}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="edit-isActive">فعال</Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setEditingVehicle(null)}>
                        انصراف
                      </Button>
                      <Button type="submit" disabled={updateVehicleMutation.isPending}>
                        {updateVehicleMutation.isPending ? "در حال بروزرسانی..." : "بروزرسانی"}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  انتخاب بهینه وسیله نقلیه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>شماره سفارش *</Label>
                    <Input 
                      value={optimizationRequest.orderNumber || ''} 
                      onChange={(e) => setOptimizationRequest({...optimizationRequest, orderNumber: e.target.value})}
                      placeholder="M2507240001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وزن (کیلوگرم) *</Label>
                    <Input 
                      type="number"
                      value={optimizationRequest.weightKg || ''} 
                      onChange={(e) => setOptimizationRequest({...optimizationRequest, weightKg: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>نوع مسیر *</Label>
                    <select 
                      value={optimizationRequest.routeType || ''} 
                      onChange={(e) => setOptimizationRequest({...optimizationRequest, routeType: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">انتخاب نوع مسیر</option>
                      {Object.entries(ROUTE_TYPES).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>مسافت (کیلومتر) *</Label>
                    <Input 
                      type="number"
                      value={optimizationRequest.distanceKm || ''} 
                      onChange={(e) => setOptimizationRequest({...optimizationRequest, distanceKm: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleOptimizeVehicle} 
                  disabled={optimizeVehicleMutation.isPending}
                  className="w-full mt-4"
                >
                  {optimizeVehicleMutation.isPending ? "در حال محاسبه..." : "انتخاب بهینه"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  تاریخچه انتخاب وسیله
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>شماره سفارش</TableHead>
                      <TableHead>وزن</TableHead>
                      <TableHead>مسیر</TableHead>
                      <TableHead>وسیله انتخابی</TableHead>
                      <TableHead>هزینه</TableHead>
                      <TableHead>تاریخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">در حال بارگذاری...</TableCell>
                      </TableRow>
                    ) : history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">هیچ تاریخچه‌ای یافت نشد</TableCell>
                      </TableRow>
                    ) : (
                      history.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.orderNumber}</TableCell>
                          <TableCell>{item.orderWeightKg} کیلوگرم</TableCell>
                          <TableCell>{(ROUTE_TYPES as any)[item.routeType] || item.routeType}</TableCell>
                          <TableCell>{item.selectedVehicleName}</TableCell>
                          <TableCell>{parseInt(item.totalCost).toLocaleString()} دینار</TableCell>
                          <TableCell>{formatDateSafe(item.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Print order details
  const handlePrintOrderDetails = () => {
    if (!selectedOrder) return;
    
    const printContent = `
      <html>
        <head>
          <title>جزئیات سفارش ${selectedOrder.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .section h3 { color: #333; margin-bottom: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-item { margin-bottom: 8px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-right: 10px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>جزئیات سفارش لجستیک</h1>
            <h2>سفارش ${selectedOrder.orderNumber}</h2>
            <p>تاریخ چاپ: ${new Date().toLocaleDateString('en-US')}</p>
          </div>

          <div class="section">
            <h3>🧑‍💼 اطلاعات مشتری</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">نام و نام خانوادگی:</span>
                <span class="value">${(selectedOrder.customer?.firstName || selectedOrder.customerFirstName)} ${(selectedOrder.customer?.lastName || selectedOrder.customerLastName)}</span>
              </div>
              <div class="info-item">
                <span class="label">شماره تماس:</span>
                <span class="value" style="font-size: 20px; font-weight: bold; color: #2563eb;">${selectedOrder.customer?.phone || selectedOrder.customerPhone}</span>
              </div>
              <div class="info-item">
                <span class="label">ایمیل:</span>
                <span class="value">${selectedOrder.customer?.email || selectedOrder.customerEmail || 'ثبت نشده'}</span>
              </div>
              <div class="info-item">
                <span class="label">کد تحویل:</span>
                <span class="value" style="font-size: 18px; font-weight: bold; color: #7c3aed;">${selectedOrder.deliveryCode || 'کد ندارد'}</span>
              </div>
            </div>
          </div>

          ${selectedOrder.shippingAddress ? `
          <div class="section">
            <h3>📍 آدرس تحویل</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">گیرنده:</span>
                <span class="value">${(selectedOrder.shippingAddress as any)?.name}</span>
              </div>
              <div class="info-item">
                <span class="label">تلفن گیرنده:</span>
                <span class="value" style="font-size: 20px; font-weight: bold; color: #2563eb;">${(selectedOrder.shippingAddress as any)?.phone}</span>
              </div>
              <div class="info-item" style="grid-column: 1 / -1;">
                <span class="label">آدرس کامل:</span>
                <span class="value" style="font-size: 18px; font-weight: bold; color: #059669; line-height: 1.5;">${(selectedOrder.shippingAddress as any)?.address}</span>
              </div>
              <div class="info-item">
                <span class="label">شهر:</span>
                <span class="value">${(selectedOrder.shippingAddress as any)?.city}</span>
              </div>
              <div class="info-item">
                <span class="label">کد پستی:</span>
                <span class="value">${(selectedOrder.shippingAddress as any)?.postalCode}</span>
              </div>
            </div>
          </div>
          ` : ''}

          <div class="section">
            <h3>📦 جزئیات سفارش</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">وزن محموله:</span>
                <span class="value">${selectedOrder.calculatedWeight || selectedOrder.totalWeight} کیلوگرم</span>
              </div>
              <div class="info-item">
                <span class="label">روش تحویل:</span>
                <span class="value">${selectedOrder.deliveryMethod || 'پیک'}</span>
              </div>
            </div>
          </div>

          ${selectedOrder.deliveryNotes ? `
          <div class="section">
            <h3>📝 یادداشت‌های تحویل</h3>
            <p>${selectedOrder.deliveryNotes}</p>
          </div>
          ` : ''}
        </body>
      </html>
    `;

    // Create a temporary iframe for printing instead of opening a new window
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();
      
      // Wait a moment for content to load, then print
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  // Send or resend delivery code SMS using template #3
  const handleSendDeliveryCode = async (orderManagementId: number, hasExistingCode: boolean) => {
    setResendingCodes(prev => ({ ...prev, [orderManagementId]: true }));
    
    try {
      const response = await fetch(`/api/order-management/send-delivery-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderManagementId,
          action: hasExistingCode ? 'resend' : 'send'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setResentCodes(prev => ({ ...prev, [orderManagementId]: true }));
        toast({
          title: '✅ کد تحویل ارسال شد',
          description: `کد تحویل ${result.deliveryCode} با استفاده از قالب شماره 3 ارسال شد`,
        });
        
        // Reset success state after 3 seconds
        setTimeout(() => {
          setResentCodes(prev => ({ ...prev, [orderManagementId]: false }));
        }, 3000);
        
        // Refresh orders to show updated delivery code
        queryClient.invalidateQueries({ queryKey: ['/api/order-management/logistics'] });
      } else {
        toast({
          title: '❌ خطا در ارسال کد',
          description: result.message || 'خطا در ارسال پیامک کد تحویل',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error sending delivery code:', error);
      toast({
        title: '❌ خطا در ارسال',
        description: 'خطا در اتصال به سرور برای ارسال کد تحویل',
        variant: 'destructive',
      });
    } finally {
      setResendingCodes(prev => ({ ...prev, [orderManagementId]: false }));
    }
  };



  const OrdersTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">مدیریت سفارشات لجستیک</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {mappedLogisticsOrders.length} سفارش در لجستیک
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="text-md font-semibold text-green-800">سفارشات تایید شده انبار (در لجستیک)</h4>
          </div>
          
          {loadingLogisticsOrders ? (
            <div className="text-center py-8">در حال بارگذاری سفارشات لجستیک...</div>
          ) : mappedLogisticsOrders.length === 0 ? (
            <Card className="border-green-200">
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <p className="text-green-600">هیچ سفارش تایید شده‌ای از انبار موجود نیست</p>
              </CardContent>
            </Card>
          ) : (
            mappedLogisticsOrders.map((order: LogisticsOrder) => (
              <Card key={order.id} className="border-r-4 border-r-green-500 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-green-800 text-lg">سفارش {order.orderNumber}</h4>
                    <Badge variant="default" className="bg-green-600 text-white">
                      تایید شده انبار
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
                    {/* Customer Info Block - Clickable */}
                    <div 
                      className="bg-white rounded-lg p-3 border border-green-200 cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                      onClick={() => handleShowOrderDetails(order)}
                    >
                      <h5 className="font-medium text-green-800 mb-2 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        اطلاعات گیرنده
                        <span className="text-xs text-green-600 mr-auto">(کلیک کنید)</span>
                      </h5>
                      <div className="space-y-2">
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-xs text-gray-500 mb-1">نام مشتری</p>
                          <p className="text-sm font-medium text-gray-800">
                            {order.customer?.firstName || order.customerFirstName} {order.customer?.lastName || order.customerLastName}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded p-2 flex items-center">
                          <Phone className="w-3 h-3 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-700">{order.customer?.phone || order.customerPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Weight Block */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        وزن محموله
                      </h5>
                      <p className="text-lg font-bold text-blue-700 flex items-center">
                        <Package className="w-4 h-4 mr-1" />
                        {order.calculatedWeight || order.totalWeight ? `${order.calculatedWeight || order.totalWeight} کیلوگرم` : 'محاسبه نشده'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">مجموع وزن ناخالص کالاها</p>
                    </div>

                    {/* Delivery Code Block */}
                    <div className={`rounded-lg p-3 border ${
                      order.deliveryCode
                        ? 'bg-purple-50 border-purple-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h5 className={`font-medium mb-2 flex items-center ${
                        order.deliveryCode
                          ? 'text-purple-800' 
                          : 'text-gray-600'
                      }`}>
                        <Shield className="w-4 h-4 mr-2" />
                        کد تحویل
                      </h5>
                      <p className={`text-lg font-bold mb-2 ${
                        order.deliveryCode
                          ? 'text-purple-700' 
                          : 'text-gray-500'
                      }`}>
                        {order.deliveryCode || 'کد ندارد'}
                      </p>
                      <p className={`text-xs mb-2 ${
                        order.deliveryCode
                          ? 'text-purple-600' 
                          : 'text-gray-500'
                      }`}>
                        کد 4 رقمی تحویل
                      </p>

                    </div>

                    {/* Delivery Address Block */}
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <h5 className="font-medium text-orange-800 mb-2 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        آدرس تحویل
                      </h5>
                      <div className="space-y-1">
                        {(() => {
                          // Check if shipping address is already an object (parsed by API)
                          const shippingData = typeof order.shippingAddress === 'object' && order.shippingAddress !== null
                            ? order.shippingAddress
                            : null;
                            
                          if (shippingData) {
                            return (
                              <>
                                <p className="text-sm font-medium text-orange-800">
                                  {(shippingData as any).name}
                                </p>
                                <p className="text-xs text-orange-600 flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {(shippingData as any).phone}
                                </p>
                                <p className="text-sm text-orange-700">
                                  {(shippingData as any).address}
                                </p>
                                <p className="text-xs text-orange-600">
                                  {(shippingData as any).city} - {(shippingData as any).postalCode}
                                </p>
                              </>
                            );
                          }
                          
                          // Fallback to recipient address or customer address
                          return (
                            <p className="text-sm text-orange-700">
                              {order.recipientAddress || order.customerAddress || 'آدرس ثبت نشده'}
                            </p>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-orange-600 mt-2 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        آدرس دریافت کالا
                      </p>
                    </div>



                    {/* Order Date Block */}
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <h5 className="font-medium text-green-800 mb-2 flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        تاریخ سفارش
                      </h5>
                      <p className="text-sm font-medium text-green-700">
                        {formatDateSafe(order.createdAt)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">تاریخ ثبت سفارش</p>
                    </div>

                    {/* Delivery Date Block */}
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <h5 className="font-medium text-yellow-800 mb-2 flex items-center">
                        <Truck className="w-4 h-4 mr-2" />
                        تاریخ تحویل
                      </h5>
                      <p className="text-sm font-medium text-yellow-700">
                        {order.actualDeliveryDate ? formatDateSafe(order.actualDeliveryDate) : 'در انتظار تحویل'}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">تاریخ تحویل سفارش</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap items-center">
                      <Button 
                        size="sm" 
                        onClick={() => handleSendDeliveryCode(order.id, !!order.deliveryCode)}
                        disabled={resendingCodes[order.id]}
                        className={`${
                          resentCodes[order.id] 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {resendingCodes[order.id] ? (
                          <>
                            <Send className="w-4 h-4 mr-2 animate-spin" />
                            در حال ارسال...
                          </>
                        ) : resentCodes[order.id] ? (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            کد ارسال شد ✓
                          </>
                        ) : order.deliveryCode ? (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            ارسال مجدد کد
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            ارسال کد به مشتری
                          </>
                        )}
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
                      {order.hasGpsLocation && (
                        <div className="border border-gray-300 rounded-lg p-1.5 bg-gray-50 h-fit">
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-blue-500 text-blue-700 hover:bg-blue-100 px-2 py-1 text-xs h-8"
                              onClick={async () => {
                                const lat = parseFloat(order.gpsLatitude?.toString() || '0').toFixed(6);
                                const lng = parseFloat(order.gpsLongitude?.toString() || '0').toFixed(6);
                                const gpsText = `GPS موقعیت: ${lat}, ${lng}`;
                                const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                                const fullText = `${gpsText}\nGoogle Maps: ${mapsUrl}`;
                                
                                try {
                                  await navigator.clipboard.writeText(fullText);
                                  alert('📋 مختصات GPS کپی شد!');
                                } catch (err) {
                                  console.error('Copy failed:', err);
                                  alert('خطا در کپی کردن');
                                }
                              }}
                              title="کپی مختصات GPS"
                            >
                              📋 کپی
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-green-500 text-green-700 hover:bg-green-100 px-2 py-1 text-xs h-8"
                              onClick={async () => {
                                const lat = parseFloat(order.gpsLatitude?.toString() || '0').toFixed(6);
                                const lng = parseFloat(order.gpsLongitude?.toString() || '0').toFixed(6);
                                const gpsText = `GPS موقعیت سفارش ${order.orderNumber}: ${lat}, ${lng}`;
                                const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                                
                                if (navigator.share) {
                                  try {
                                    await navigator.share({
                                      title: `موقعیت GPS سفارش ${order.orderNumber}`,
                                      text: gpsText,
                                      url: mapsUrl
                                    });
                                  } catch (err) {
                                    // If share fails, copy to clipboard as fallback
                                    try {
                                      await navigator.clipboard.writeText(`${gpsText}\n${mapsUrl}`);
                                      alert('📋 مختصات GPS کپی شد!');
                                    } catch (copyErr) {
                                      window.open(mapsUrl, '_blank');
                                    }
                                  }
                                } else {
                                  // Fallback: copy to clipboard
                                  try {
                                    await navigator.clipboard.writeText(`${gpsText}\n${mapsUrl}`);
                                    alert('📋 مختصات GPS کپی شد!');
                                  } catch (err) {
                                    window.open(mapsUrl, '_blank');
                                  }
                                }
                              }}
                              title="اشتراک گذاری موقعیت GPS"
                            >
                              📤 اشتراک
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-500 text-red-700 hover:bg-red-100 px-2 py-1 text-xs h-8"
                              onClick={() => {
                                const lat = parseFloat(order.gpsLatitude?.toString() || '0');
                                const lng = parseFloat(order.gpsLongitude?.toString() || '0');
                                const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                                window.open(mapsUrl, '_blank');
                              }}
                              title="باز کردن در Google Maps"
                            >
                              🗺️ نقشه
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  const CompaniesTab = () => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [companyFormData, setCompanyFormData] = useState({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      website: '',
      contractEndDate: '',
      maxWeight: '',
      baseRate: '',
      ratePerKm: ''
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
          website: '',
          contractEndDate: '',
          maxWeight: '',
          baseRate: '',
          ratePerKm: ''
        });
        queryClient.invalidateQueries({ queryKey: ['/api/logistics/companies'] });
        toast({ title: "موفق", description: "شرکت حمل و نقل جدید ثبت شد" });
      }
    });

    const handleSubmitCompany = (e: React.FormEvent) => {
      e.preventDefault();
      if (!companyFormData.name || !companyFormData.phone) {
        toast({ 
          title: "خطا", 
          description: "لطفاً نام شرکت و شماره تماس را وارد کنید",
          variant: "destructive"
        });
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
                  <Label htmlFor="website">وب‌سایت</Label>
                  <Input
                    id="website"
                    type="url"
                    value={companyFormData.website}
                    onChange={(e) => setCompanyFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://www.example.com"
                  />
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
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="text-sm">📞 {company.phone}</span>
                        <span className="text-sm">✉️ {company.email}</span>
                        {company.website && (
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            🌐 {company.website}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm">⭐ {company.rating || 0}/5</span>
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

  // Calculate shipping cost mutation
  const calculateShippingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/logistics/calculate-shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to calculate shipping');
      return response.json();
    },
    onSuccess: (data) => {
      setShippingCalculation(data);
      toast({ title: "محاسبه هزینه حمل با موفقیت انجام شد" });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا در محاسبه هزینه حمل", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Cities and Provinces Tab
  const CitiesTab = () => {
    const provinces = (provincesResponse as any)?.provinces || [];
    const cities = (citiesResponse as any)?.cities || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Provinces */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                استان‌های عراق ({provinces.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loadingProvinces ? (
                  <div className="text-center py-4">در حال بارگذاری...</div>
                ) : provinces.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">هیچ استانی یافت نشد</p>
                ) : (
                  provinces.map((province: any) => (
                    <div key={province.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{province.name_ar}</span>
                        <span className="text-sm text-gray-600 block">{province.name_en}</span>
                      </div>
                      <Badge variant="outline">{province.cities_count || 0} شهر</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                شهرهای عراق ({cities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loadingCities ? (
                  <div className="text-center py-4">در حال بارگذاری...</div>
                ) : cities.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">هیچ شهری یافت نشد</p>
                ) : (
                  cities.map((city: any) => (
                    <div key={city.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{city.name_ar}</span>
                        <span className="text-sm text-gray-600 block">{city.name_en}</span>
                      </div>
                      <span className="text-sm text-gray-500">{city.province_name}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipping Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              محاسبه هزینه حمل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="city">شهر مقصد</Label>
                <select 
                  id="city"
                  className="w-full p-2 border rounded"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option value="">انتخاب شهر</option>
                  {cities.map((city: any) => (
                    <option key={city.id} value={city.name_ar}>
                      {city.name_ar} ({city.province_name})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="weight">وزن (کیلوگرم)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={shippingWeight}
                  onChange={(e) => setShippingWeight(Number(e.target.value))}
                  min="0.1"
                  step="0.1"
                />
              </div>
              
              <div>
                <Label htmlFor="orderValue">ارزش سفارش (دینار)</Label>
                <Input
                  id="orderValue"
                  type="number"
                  value={orderValue}
                  onChange={(e) => setOrderValue(Number(e.target.value))}
                  min="0"
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={() => {
                    if (!selectedCity || !shippingWeight) {
                      toast({ 
                        title: "خطا", 
                        description: "لطفاً شهر و وزن را انتخاب کنید",
                        variant: "destructive" 
                      });
                      return;
                    }
                    calculateShippingMutation.mutate({
                      cityName: selectedCity,
                      weight: shippingWeight,
                      orderValue: orderValue
                    });
                  }}
                  disabled={calculateShippingMutation.isPending}
                  className="w-full"
                >
                  {calculateShippingMutation.isPending ? 'در حال محاسبه...' : 'محاسبه هزینه'}
                </Button>
              </div>
            </div>

            {/* Shipping Calculation Results */}
            {shippingCalculation && (
              <div className="mt-6 space-y-4">
                <h4 className="font-semibold">نتایج محاسبه هزینه حمل برای {shippingCalculation.city}</h4>
                <div className="grid gap-4">
                  {shippingCalculation.calculations.map((calc: any, index: number) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-500">{calc.delivery_method}</Badge>
                              {calc.transportation_type && (
                                <Badge variant="outline">{calc.transportation_type}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{calc.description}</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <span>هزینه پایه: {Number(calc.base_price).toLocaleString()} دینار</span>
                              <span>هزینه وزن: {calc.weight_cost.toLocaleString()} دینار</span>
                              <span>زمان تحویل: {calc.estimated_days} روز</span>
                              <span>بیمه: {calc.insurance_available ? 'موجود' : 'غیر موجود'}</span>
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="text-lg font-bold text-green-600">
                              {calc.is_free_shipping ? 'ارسال رایگان' : `${calc.final_total.toLocaleString()} دینار`}
                            </div>
                            {calc.insurance_cost > 0 && (
                              <div className="text-sm text-gray-600">
                                بیمه: {calc.insurance_cost.toLocaleString()} دینار
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Shipping Rates Tab
  const ShippingRatesTab = () => {
    const shippingRates = (shippingRatesResponse as any)?.data || [];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">نرخ‌های حمل و نقل عراق</h3>
          <Badge variant="outline">{shippingRates.length} نرخ فعال</Badge>
        </div>

        <div className="grid gap-4">
          {loadingShippingRates ? (
            <div className="text-center py-8">در حال بارگذاری...</div>
          ) : shippingRates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">هیچ نرخ حملی ثبت نشده است</p>
              </CardContent>
            </Card>
          ) : (
            shippingRates.map((rate: any) => (
              <Card key={rate.id} className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-500">{rate.delivery_method}</Badge>
                        {rate.transportation_type && (
                          <Badge variant="outline">{rate.transportation_type}</Badge>
                        )}
                      </div>
                      <h4 className="font-semibold">{rate.city_name}, {rate.province_name}</h4>
                      <p className="text-sm text-gray-600">{rate.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <span>هزینه پایه: {Number(rate.base_price).toLocaleString()} دینار</span>
                        <span>هزینه هر کیلو: {Number(rate.price_per_kg || 0).toLocaleString()} دینار</span>
                        <span>زمان تحویل: {rate.estimated_days} روز</span>
                        <span>حداکثر وزن: {rate.max_weight || 'نامحدود'} کیلو</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {rate.tracking_available && (
                          <Badge variant="outline" className="bg-green-50">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            قابلیت ردیابی
                          </Badge>
                        )}
                        {rate.insurance_available && (
                          <Badge variant="outline" className="bg-blue-50">
                            <Shield className="w-3 h-3 mr-1" />
                            بیمه {rate.insurance_rate}%
                          </Badge>
                        )}
                        {rate.sms_verification_enabled && (
                          <Badge variant="outline" className="bg-yellow-50">
                            <Phone className="w-3 h-3 mr-1" />
                            تأیید پیامکی
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <Badge className={rate.is_active ? "bg-green-500" : "bg-red-500"}>
                        {rate.is_active ? 'فعال' : 'غیرفعال'}
                      </Badge>
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

  // New Geography Tab for provinces and cities management with editing capabilities
  const GeographyTab = () => {
    const [editingProvince, setEditingProvince] = useState<any>(null);
    const [editingCity, setEditingCity] = useState<any>(null);
    const [isEditProvinceDialogOpen, setIsEditProvinceDialogOpen] = useState(false);
    const [isEditCityDialogOpen, setIsEditCityDialogOpen] = useState(false);
    const [selectedOriginCity, setSelectedOriginCity] = useState<any>(null);

    const geographyProvinces = (geographyProvincesResponse as any)?.data || [];
    const geographyCities = (geographyCitiesResponse as any)?.data || [];

    // Calculate dynamic distances based on selected origin city from database
    const calculateDistance = (targetCity: any) => {
      if (!selectedOriginCity) {
        // Return actual distance from Erbil (default) from database
        return targetCity.distance_from_erbil_km || 0;
      }
      
      // Get distances from database
      const originDistance = selectedOriginCity.distance_from_erbil_km || 0;
      const targetDistance = targetCity.distance_from_erbil_km || 0;
      
      // Calculate relative distance using Erbil as common reference point
      return Math.abs(targetDistance - originDistance);
    };

    // Calculate province distance (average of cities in province) from database
    const calculateProvinceDistance = (province: any) => {
      if (!selectedOriginCity) {
        // Return average distance from Erbil for all cities in province
        const provinceCities = geographyCities.filter((city: any) => city.province_id === province.id);
        if (provinceCities.length === 0) return 0;
        
        const totalDistance = provinceCities.reduce((sum: number, city: any) => 
          sum + (city.distance_from_erbil_km || 0), 0);
        return Math.round(totalDistance / provinceCities.length);
      }
      
      // Calculate relative distances from selected origin city
      const provinceCities = geographyCities.filter((city: any) => city.province_id === province.id);
      if (provinceCities.length === 0) return 0;
      
      const totalDistance = provinceCities.reduce((sum: number, city: any) => sum + calculateDistance(city), 0);
      return Math.round(totalDistance / provinceCities.length);
    };

    // Update province mutation
    const updateProvinceMutation = useMutation({
      mutationFn: (data: any) => 
        fetch(`/api/logistics/provinces/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(res => res.json()),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/logistics/provinces-detailed'] });
        setIsEditProvinceDialogOpen(false);
        setEditingProvince(null);
        toast({ title: "موفقیت", description: "استان با موفقیت به‌روزرسانی شد" });
      },
      onError: () => {
        toast({ title: "خطا", description: "خطا در به‌روزرسانی استان", variant: "destructive" });
      }
    });

    // Update city mutation
    const updateCityMutation = useMutation({
      mutationFn: (data: any) => 
        fetch(`/api/logistics/cities/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(res => res.json()),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/logistics/cities-detailed'] });
        setIsEditCityDialogOpen(false);
        setEditingCity(null);
        toast({ title: "موفقیت", description: "شهر با موفقیت به‌روزرسانی شد" });
      },
      onError: () => {
        toast({ title: "خطا", description: "خطا در به‌روزرسانی شهر", variant: "destructive" });
      }
    });

    const handleEditProvince = (formData: FormData) => {
      if (!editingProvince) return;
      
      const data = {
        id: editingProvince.id,
        name_arabic: formData.get('name_arabic') as string,
        name_english: formData.get('name_english') as string,
        capital: formData.get('capital') as string,
        region: formData.get('region') as string,
        is_active: formData.get('is_active') === 'on'
      };

      updateProvinceMutation.mutate(data);
    };

    const handleEditCity = (formData: FormData) => {
      if (!editingCity) return;
      
      const data = {
        id: editingCity.id,
        name_arabic: formData.get('name_arabic') as string,
        name_english: formData.get('name_english') as string,
        distance_from_erbil_km: parseInt(formData.get('distance_from_erbil_km') as string),
        is_active: formData.get('is_active') === 'on'
      };

      updateCityMutation.mutate(data);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              مدیریت جغرافیای عراق
            </h3>
            <p className="text-sm text-gray-600 mt-1">مدیریت 18 استان و 188 شهر عراق با قابلیت انتخاب مبدا</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-50">
              {geographyProvinces.length} استان
            </Badge>
            <Badge variant="outline" className="bg-green-50">
              {geographyCities.length} شهر
            </Badge>
          </div>
        </div>

        {/* Origin City Selection */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">انتخاب شهر مبدا برای محاسبه فواصل</h4>
                  <p className="text-sm text-blue-700">
                    {selectedOriginCity 
                      ? `مبدا انتخاب شده: ${selectedOriginCity.name_arabic || selectedOriginCity.name}` 
                      : 'مبدا پیش‌فرض: اربیل (تمام فاصله‌ها از اربیل محاسبه می‌شوند)'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedOriginCity?.id || ''}
                  onChange={(e) => {
                    const cityId = parseInt(e.target.value);
                    const city = geographyCities.find((c: any) => c.id === cityId);
                    setSelectedOriginCity(city || null);
                  }}
                  className="p-2 border rounded-md bg-white text-sm min-w-[200px]"
                >
                  <option value="">اربیل (پیش‌فرض)</option>
                  {geographyCities.map((city: any) => (
                    <option key={city.id} value={city.id}>
                      {city.name_arabic || city.name} - {city.province_name}
                    </option>
                  ))}
                </select>
                {selectedOriginCity && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedOriginCity(null)}
                    className="text-blue-600 border-blue-600 hover:bg-blue-100"
                  >
                    بازنشانی
                  </Button>
                )}
              </div>
            </div>
            {selectedOriginCity && (
              <div className="mt-3 p-3 bg-blue-100 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>نکته:</strong> فاصله‌ها بر اساس تفاوت فاصله شهرها از اربیل محاسبه می‌شوند. 
                  شهر انتخابی به عنوان مبدا (0 کیلومتر) نمایش داده می‌شود.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              شهرهای عراق ({geographyCities.length})
            </CardTitle>
            <CardDescription>
              مدیریت 188 شهر عراق با فاصله‌های قابل تنظیم بر اساس مبدا انتخابی
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingGeographyCities ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">شناسه</TableHead>
                      <TableHead className="text-right">نام عربی</TableHead>
                      <TableHead className="text-right">نام انگلیسی</TableHead>
                      <TableHead className="text-right">استان</TableHead>
                      <TableHead className="text-right">
                        فاصله از {selectedOriginCity ? (selectedOriginCity.name_arabic || selectedOriginCity.name) : 'اربیل'} (کیلومتر)
                      </TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {geographyCities.slice(0, 50).map((city: any) => (
                      <TableRow key={city.id}>
                        <TableCell className="font-medium">{city.id}</TableCell>
                        <TableCell>{city.name_arabic || city.name}</TableCell>
                        <TableCell>{city.name_english || city.name}</TableCell>
                        <TableCell>{city.province_name}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={selectedOriginCity?.id === city.id ? 
                              "bg-yellow-100 border-yellow-500 text-yellow-700" : 
                              "bg-green-50 border-green-200 text-green-700"
                            }
                          >
                            {selectedOriginCity?.id === city.id ? 
                              'مبدا (0 کیلومتر)' : 
                              `${calculateDistance(city)} کیلومتر`
                            }
                          </Badge>
                          {!selectedOriginCity && (
                            <div className="text-xs text-gray-500 mt-1">
                              (از اربیل: {city.distance_from_erbil_km || 0} کیلومتر)
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={city.is_active ? "default" : "secondary"}>
                            {city.is_active ? "فعال" : "غیرفعال"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingCity(city);
                              setIsEditCityDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            ویرایش
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {geographyCities.length > 50 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    و {geographyCities.length - 50} شهر دیگر...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Province Dialog */}
        <Dialog open={isEditProvinceDialogOpen} onOpenChange={setIsEditProvinceDialogOpen}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>ویرایش استان</DialogTitle>
              <DialogDescription>ویرایش اطلاعات استان {editingProvince?.name_arabic}</DialogDescription>
            </DialogHeader>
            {editingProvince && (
              <form onSubmit={(e) => { e.preventDefault(); handleEditProvince(new FormData(e.currentTarget)); }}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name_arabic">نام عربی *</Label>
                    <Input 
                      id="name_arabic" 
                      name="name_arabic" 
                      defaultValue={editingProvince.name_arabic}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_english">نام انگلیسی *</Label>
                    <Input 
                      id="name_english" 
                      name="name_english" 
                      defaultValue={editingProvince.name_english}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capital">مرکز استان *</Label>
                    <Input 
                      id="capital" 
                      name="capital" 
                      defaultValue={editingProvince.capital}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">منطقه</Label>
                    <select 
                      name="region" 
                      defaultValue={editingProvince.region}
                      className="w-full p-2 border rounded"
                    >
                      <option value="north">شمال</option>
                      <option value="center">مرکز</option>
                      <option value="south">جنوب</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="is_active" 
                        name="is_active" 
                        defaultChecked={editingProvince.is_active}
                      />
                      <Label htmlFor="is_active">فعال</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditProvinceDialogOpen(false)}>انصراف</Button>
                  <Button type="submit" disabled={updateProvinceMutation.isPending}>
                    {updateProvinceMutation.isPending ? "در حال به‌روزرسانی..." : "به‌روزرسانی"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit City Dialog */}
        <Dialog open={isEditCityDialogOpen} onOpenChange={setIsEditCityDialogOpen}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>ویرایش شهر</DialogTitle>
              <DialogDescription>ویرایش اطلاعات شهر {editingCity?.name_arabic || editingCity?.name}</DialogDescription>
            </DialogHeader>
            {editingCity && (
              <form onSubmit={(e) => { e.preventDefault(); handleEditCity(new FormData(e.currentTarget)); }}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="city_name_arabic">نام عربی *</Label>
                    <Input 
                      id="city_name_arabic" 
                      name="name_arabic" 
                      defaultValue={editingCity.name_arabic || editingCity.name}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city_name_english">نام انگلیسی</Label>
                    <Input 
                      id="city_name_english" 
                      name="name_english" 
                      defaultValue={editingCity.name_english || editingCity.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distance_from_erbil_km">فاصله از اربیل (کیلومتر) *</Label>
                    <Input 
                      id="distance_from_erbil_km" 
                      name="distance_from_erbil_km" 
                      type="number"
                      min="0"
                      defaultValue={editingCity.distance_from_erbil_km || 0}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>استان</Label>
                    <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                      {editingCity.province_name}
                    </p>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="city_is_active" 
                        name="is_active" 
                        defaultChecked={editingCity.is_active}
                      />
                      <Label htmlFor="city_is_active">فعال</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditCityDialogOpen(false)}>انصراف</Button>
                  <Button type="submit" disabled={updateCityMutation.isPending}>
                    {updateCityMutation.isPending ? "در حال به‌روزرسانی..." : "به‌روزرسانی"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">مدیریت لجستیک</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {mappedLogisticsOrders.length} سفارش فعال
          </Badge>
          {orderCount > 0 && (
            <Badge className="bg-orange-500 animate-pulse">
              {orderCount} سفارش جدید
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="orders">سفارشات</TabsTrigger>
          <TabsTrigger value="companies">شرکت‌های حمل</TabsTrigger>
          <TabsTrigger value="geography">جغرافیای عراق</TabsTrigger>
          <TabsTrigger value="shipping">نرخ‌های حمل</TabsTrigger>
          <TabsTrigger value="vehicles">وسایل نقلیه</TabsTrigger>
          <TabsTrigger value="postal">خدمات پست</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>

        <TabsContent value="companies">
          <CompaniesTab />
        </TabsContent>

        <TabsContent value="geography">
          <GeographyTab />
        </TabsContent>



        <TabsContent value="shipping">
          <ShippingRatesTab />
        </TabsContent>

        <TabsContent value="vehicles">
          <VehicleOptimizationTab />
        </TabsContent>

        <TabsContent value="postal">
          <PostalServicesTab />
        </TabsContent>
      </Tabs>

      {/* Order Details Modal */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <Button
                onClick={handlePrintOrderDetails}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                پرینت
              </Button>
              <div className="text-right flex-1">
                <DialogTitle className="text-right">
                  جزئیات سفارش {selectedOrder?.orderNumber || `#${selectedOrder?.customerOrderId}`}
                </DialogTitle>
                <DialogDescription className="text-right">
                  مشاهده کامل اطلاعات سفارش و آدرس تحویل
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  اطلاعات مشتری
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">نام و نام خانوادگی</Label>
                    <p className="font-medium">
                      {selectedOrder.customer?.firstName || selectedOrder.customerFirstName} {selectedOrder.customer?.lastName || selectedOrder.customerLastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">شماره تماس</Label>
                    <p className="font-medium flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-blue-600" />
                      {selectedOrder.customer?.phone || selectedOrder.customerPhone}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">ایمیل</Label>
                    <p className="font-medium">{selectedOrder.customer?.email || selectedOrder.customerEmail || 'ثبت نشده'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">کد تحویل</Label>
                    <p className="font-bold text-purple-700 text-lg">
                      {selectedOrder.deliveryCode || 'کد ندارد'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    آدرس تحویل
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">گیرنده</Label>
                      <p className="font-medium">{(selectedOrder.shippingAddress as any)?.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">تلفن گیرنده</Label>
                      <p className="font-medium flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-green-600" />
                        {(selectedOrder.shippingAddress as any)?.phone}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm text-gray-600">آدرس کامل</Label>
                      <p className="font-medium">{(selectedOrder.shippingAddress as any)?.address}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">شهر</Label>
                      <p className="font-medium">{(selectedOrder.shippingAddress as any)?.city}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">کد پستی</Label>
                      <p className="font-medium">{(selectedOrder.shippingAddress as any)?.postalCode}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Details */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  جزئیات سفارش
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">وزن محموله</Label>
                    <p className="font-medium">
                      {selectedOrder.calculatedWeight || selectedOrder.totalWeight} کیلوگرم
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">روش تحویل</Label>
                    <p className="font-medium">{selectedOrder.deliveryMethod || 'پیک'}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Notes */}
              {selectedOrder.deliveryNotes && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    یادداشت‌های تحویل
                  </h3>
                  <p className="text-gray-700">{selectedOrder.deliveryNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );


};

export default LogisticsManagement;
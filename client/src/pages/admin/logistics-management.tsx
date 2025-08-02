import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PaymentMethodBadge from '@/components/PaymentMethodBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
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
  Scale,
  ArrowUpDown,
  Bus,
  X,
  Minus,
  CreditCard,
  Wallet,
  DollarSign,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import PostalServicesTab from '@/components/PostalServicesTab';
import VehicleTemplateEditor from '@/components/admin/VehicleTemplateEditor';
import InternationalGeographyTab from '@/components/InternationalGeographyTab';


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

// Status display name mapping function
const getStatusDisplayName = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'pending': 'در انتظار',
    'confirmed': 'تایید شده',
    'financial_review': 'بررسی مالی',
    'warehouse_pending': 'در انتظار انبار',
    'warehouse_ready': 'آماده انبار',
    'warehouse_processing': 'در حال پردازش انبار',
    'logistics_pending': 'در انتظار لجستیک',
    'logistics_assigned': 'اختصاص یافته لجستیک',
    'logistics_dispatched': 'ارسال شده',
    'in_transit': 'در حال حمل',
    'delivered': 'تحویل داده شده',
    'cancelled': 'لغو شده',
    'returned': 'برگشت داده شده'
  };
  
  return statusMap[status] || status;
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

interface ReadyVehicle {
  id: number;
  vehicleType: string;
  licensePlate: string;
  driverName: string;
  driverMobile: string;
  loadCapacity: number;
  isAvailable: boolean;
  currentLocation?: string;
  notes?: string;
  supportsFlammable?: boolean;
  notAllowedFlammable?: boolean;
  createdAt: string;
  updatedAt: string;
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
  paymentMethod?: string; // نوع تسویه حساب
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
  
  // States for vehicle assignment
  const [isVehicleAssignmentOpen, setIsVehicleAssignmentOpen] = useState(false);
  const [selectedOrderForVehicle, setSelectedOrderForVehicle] = useState<LogisticsOrder | null>(null);
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<any>(null);
  const [availableFleetVehicles, setAvailableFleetVehicles] = useState<any[]>([]);
  
  // States for enhanced suitable vehicles display
  const [isSuitableVehiclesOpen, setIsSuitableVehiclesOpen] = useState(false);
  const [suitableVehiclesData, setSuitableVehiclesData] = useState<any>(null);

  // States for postal services
  const [isCreatePostalDialogOpen, setIsCreatePostalDialogOpen] = useState(false);
  const [selectedPostalService, setSelectedPostalService] = useState<PostalService | null>(null);
  
  // States for ready vehicles directory
  const [isCreateReadyVehicleDialogOpen, setIsCreateReadyVehicleDialogOpen] = useState(false);
  const [selectedReadyVehicle, setSelectedReadyVehicle] = useState<ReadyVehicle | null>(null);
  const [isEditReadyVehicleDialogOpen, setIsEditReadyVehicleDialogOpen] = useState(false);
  
  // Order Details Dialog states
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<LogisticsOrder | null>(null);
  const [isOrderDetailsDialogOpen, setIsOrderDetailsDialogOpen] = useState(false);
  const [customVehicleType, setCustomVehicleType] = useState('');
  const [customEditVehicleType, setCustomEditVehicleType] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showCustomEditInput, setShowCustomEditInput] = useState(false);

  // Handle showing order details
  const handleShowOrderDetails = (order: LogisticsOrder) => {
    setSelectedOrderForDetails(order);
    setIsOrderDetailsDialogOpen(true);
  };
  
  // State for vehicle editing (moved here before useEffect)
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  // Effect to handle custom vehicle type for editing
  React.useEffect(() => {
    if (editingVehicle) {
      const standardTypes = [
        'کامیون سنگین', 'کامیون متوسط', 'کامیون سبک', 'وانت سبک', 'وانت متوسط',
        'ون سبک', 'ون متوسط', 'اتوبوس مسافربری', 'اتوبوس شهری', 'مینی‌بوس',
        'تریلر', 'نیم‌تریلر', 'کشنده', 'کامیون کمپرسی', 'کامیون یخچالی',
        'تانکر', 'کامیون جرثقیل', 'یدک‌کش', 'آمبولانس', 'ماشین آتش‌نشانی',
        'تاکسی', 'خودرو سواری', 'موتورسیکلت', 'دوچرخه', 'اسکوتر'
      ];
      const isCustomType = !standardTypes.includes(editingVehicle.vehicleType);
      if (isCustomType) {
        setShowCustomEditInput(true);
        setCustomEditVehicleType(editingVehicle.vehicleType);
      } else {
        setShowCustomEditInput(false);
        setCustomEditVehicleType('');
      }
    }
  }, [editingVehicle]);

  // Ready vehicles API integration
  const { data: readyVehiclesData, isLoading: loadingReadyVehicles } = useQuery({
    queryKey: ['/api/logistics/ready-vehicles'],
    enabled: activeTab === 'ready-vehicles'
  });

  const readyVehicles = readyVehiclesData || [];

  // Create ready vehicle mutation
  const createReadyVehicleMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/logistics/ready-vehicles', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/ready-vehicles'] });
      setIsCreateReadyVehicleDialogOpen(false);
      toast({ title: "موفقیت", description: "خودرو آماده کار با موفقیت ایجاد شد" });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا", 
        description: error?.response?.data?.message || "خطا در ایجاد خودرو آماده کار", 
        variant: "destructive" 
      });
    }
  });

  // Update ready vehicle mutation
  const updateReadyVehicleMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/logistics/ready-vehicles/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/ready-vehicles'] });
      setIsEditReadyVehicleDialogOpen(false);
      setSelectedReadyVehicle(null);
      toast({ title: "موفقیت", description: "خودرو آماده کار با موفقیت بروزرسانی شد" });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا", 
        description: error?.response?.data?.message || "خطا در بروزرسانی خودرو آماده کار", 
        variant: "destructive" 
      });
    }
  });

  // Delete ready vehicle mutation
  const deleteReadyVehicleMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/logistics/ready-vehicles/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/ready-vehicles'] });
      toast({ title: "موفقیت", description: "خودرو آماده کار با موفقیت حذف شد" });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا", 
        description: error?.response?.data?.message || "خطا در حذف خودرو آماده کار", 
        variant: "destructive" 
      });
    }
  });

  // Handle create ready vehicle form submission
  const handleCreateReadyVehicle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Determine vehicle type based on selection
    const selectedVehicleType = formData.get('vehicleType') as string;
    const finalVehicleType = selectedVehicleType === 'سایر' ? customVehicleType : selectedVehicleType;
    
    const vehicleData = {
      vehicleType: finalVehicleType,
      licensePlate: formData.get('licensePlate') as string,
      driverName: formData.get('driverName') as string,
      driverMobile: formData.get('driverMobile') as string,
      loadCapacity: parseFloat(formData.get('loadCapacity') as string),
      currentLocation: formData.get('currentLocation') as string,
      notes: formData.get('notes') as string,
      isAvailable: formData.get('isAvailable') === 'true',
      supportsFlammable: formData.get('supportsFlammable') === 'true',
      notAllowedFlammable: formData.get('notAllowedFlammable') === 'true'
    };

    createReadyVehicleMutation.mutate(vehicleData);
    
    // Reset custom input state
    setShowCustomInput(false);
    setCustomVehicleType('');
  };

  // Handle edit ready vehicle form submission
  const handleEditReadyVehicle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedReadyVehicle) return;

    const formData = new FormData(e.currentTarget);
    
    // Determine vehicle type based on selection
    const selectedVehicleType = formData.get('vehicleType') as string;
    const finalVehicleType = selectedVehicleType === 'سایر' ? customEditVehicleType : selectedVehicleType;
    
    const vehicleData = {
      id: selectedReadyVehicle.id,
      vehicleType: finalVehicleType,
      licensePlate: formData.get('licensePlate') as string,
      driverName: formData.get('driverName') as string,
      driverMobile: formData.get('driverMobile') as string,
      loadCapacity: parseFloat(formData.get('loadCapacity') as string),
      currentLocation: formData.get('currentLocation') as string,
      notes: formData.get('notes') as string,
      isAvailable: formData.get('isAvailable') === 'true',
      supportsFlammable: formData.get('supportsFlammable') === 'true',
      notAllowedFlammable: formData.get('notAllowedFlammable') === 'true'
    };

    updateReadyVehicleMutation.mutate(vehicleData);
    
    // Reset custom input state
    setShowCustomEditInput(false);
    setCustomEditVehicleType('');
  };

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
  const { data: logisticsOrdersResponse, isLoading: loadingLogisticsOrders, refetch: refetchLogisticsOrders } = useQuery({
    queryKey: ['/api/order-management/logistics'],
    enabled: activeTab === 'orders',
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache at all - always fresh (v5 syntax)
    refetchOnWindowFocus: true, // Refetch when user comes back
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Force refresh function that completely clears cache
  const forceRefreshLogisticsOrders = async () => {
    // Clear all cache first
    await queryClient.invalidateQueries({ queryKey: ['/api/order-management/logistics'] });
    await queryClient.removeQueries({ queryKey: ['/api/order-management/logistics'] });
    // Then refetch
    await refetchLogisticsOrders();
    toast({
      title: "🔄 به‌روزرسانی شد",
      description: "لیست سفارشات لجستیک از سرور بازیابی شد",
    });
  };
  
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
    enabled: activeTab === 'cities' || activeTab === 'geography'
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
  const [optimizationRequest, setOptimizationRequest] = useState<any>({});

  const { data: citiesResponse, isLoading: loadingCities } = useQuery({
    queryKey: ['/api/logistics/cities'],
    enabled: activeTab === 'cities' || activeTab === 'geography'
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
        description: `وسیله انتخاب شده: ${result.data.selectedVehicle.vehicleName} - هزینه: ${parseInt(result.data.selectedVehicle.totalCost)} دینار`
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



  // Handle enhanced vehicle assignment workflow
  const handleVehicleAssignment = async (order: LogisticsOrder) => {
    try {
      console.log('🚚 [ENHANCED VEHICLE ASSIGNMENT] Starting for order:', order.orderNumber);
      
      // Get all suitable vehicles identified during checkout
      const suitableVehiclesResponse = await fetch(`/api/orders/${order.customerOrderId}/suitable-vehicles`, {
        credentials: 'include'
      });
      
      if (suitableVehiclesResponse.ok) {
        const suitableVehiclesData = await suitableVehiclesResponse.json();
        if (suitableVehiclesData.success) {
          setSuitableVehiclesData(suitableVehiclesData.data);
          console.log('✅ [SUITABLE VEHICLES] Found vehicles:', suitableVehiclesData.data.suitableVehicles.length);
          setSelectedOrderForVehicle(order);
          setIsSuitableVehiclesOpen(true);
          return;
        }
      }
      
      // Fallback to original vehicle assignment if suitable vehicles API fails
      console.log('⚠️ [FALLBACK] Using original vehicle assignment method');
      
      // Get customer's selected vehicle details from checkout
      const vehicleDetailsResponse = await fetch(`/api/orders/${order.customerOrderId}/vehicle-details`, {
        credentials: 'include'
      });
      
      let checkoutVehicleDetails = null;
      if (vehicleDetailsResponse.ok) {
        checkoutVehicleDetails = await vehicleDetailsResponse.json();
        setSelectedVehicleDetails(checkoutVehicleDetails);
        console.log('✅ [CHECKOUT VEHICLE] Found customer selected vehicle:', checkoutVehicleDetails);
      }
      
      // Get all ready vehicles (آماده به کار)
      const readyVehiclesResponse = await fetch('/api/logistics/ready-vehicles', {
        credentials: 'include'
      });
      
      let readyVehicles = [];
      if (readyVehiclesResponse.ok) {
        const readyVehiclesData = await readyVehiclesResponse.json();
        readyVehicles = readyVehiclesData.vehicles || [];
        console.log('🚛 [READY VEHICLES] Found ready vehicles:', readyVehicles.length);
        
        // Filter by weight capacity and availability
        const orderWeight = order.calculatedWeight || order.totalWeight || 0;
        const availableVehicles = readyVehicles.filter((vehicle: any) => 
          vehicle.isAvailable && 
          vehicle.loadCapacity >= orderWeight
        );
        
        setAvailableFleetVehicles(availableVehicles);
        console.log('✅ [FILTERED VEHICLES] Available vehicles for', orderWeight, 'kg:', availableVehicles.length);
        
        // Find suggested vehicle based on checkout selection
        if (checkoutVehicleDetails) {
          const suggestedVehicle = availableVehicles.find((vehicle: any) => 
            vehicle.vehicleType === checkoutVehicleDetails.vehicleType ||
            vehicle.vehicleType.includes(checkoutVehicleDetails.vehicleType) ||
            checkoutVehicleDetails.vehicleType.includes(vehicle.vehicleType)
          );
          
          if (suggestedVehicle) {
            console.log('🎯 [SUGGESTED VEHICLE] Matching checkout selection:', suggestedVehicle);
            // Mark as suggested for UI highlighting
            suggestedVehicle.isCheckoutSuggested = true;
          }
        }
      }
      
      setSelectedOrderForVehicle(order);
      setIsVehicleAssignmentOpen(true);
    } catch (error) {
      console.error('Error loading vehicle assignment data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات اختصاص وسیله ارسال محموله",
        variant: "destructive"
      });
    }
  };

  // Assign vehicle to order
  const assignVehicleToOrder = async (vehicleId: number, truckNumber: string, driverName: string, driverPhone: string) => {
    try {
      const response = await fetch(`/api/logistics/assign-vehicle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: selectedOrderForVehicle?.customerOrderId,
          orderManagementId: selectedOrderForVehicle?.id,
          vehicleId,
          truckNumber,
          driverName,
          driverPhone
        })
      });

      if (response.ok) {
        toast({
          title: "موفقیت",
          description: "خودرو با موفقیت به سفارش اختصاص یافت"
        });
        
        // Refresh the orders list
        queryClient.invalidateQueries({ queryKey: ['/api/order-management/logistics'] });
        setIsVehicleAssignmentOpen(false);
      } else {
        throw new Error('Assignment failed');
      }
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      toast({
        title: "خطا",
        description: "خطا در اختصاص وسیله ارسال محموله",
        variant: "destructive"
      });
    }
  };

  // Handler for selecting vehicles from suitable vehicles list
  const handleTemplateVehicleSelection = async (vehicle: any, isOptimal: boolean = false) => {
    if (!selectedOrderForVehicle) {
      toast({
        title: "خطا",
        description: "سفارش انتخاب شده‌ای برای اختصاص خودرو وجود ندارد",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create a new ready vehicle based on the template selection
      const readyVehicleData = {
        vehicleName: vehicle.name,
        vehicleType: vehicle.vehicleType,
        plateNumber: `TMP-${Date.now()}`, // Temporary plate number
        driverName: 'راننده موقت',
        driverPhone: '09120000000',
        licensePlate: `TMP-${Date.now()}`,
        maxWeight: vehicle.maxWeightKg,
        loadCapacity: vehicle.maxWeightKg,
        status: 'available',
        isCheckoutSuggested: isOptimal,
        totalCost: vehicle.totalCost,
        notes: `خودرو انتخاب شده از قالب ${vehicle.name} - ${isOptimal ? 'انتخاب بهینه سیستم' : 'انتخاب دستی'}`
      };

      // Call the create ready vehicle API
      const response = await fetch('/api/logistics/ready-vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(readyVehicleData)
      });

      if (response.ok) {
        const newVehicle = await response.json();
        
        // Add to available fleet vehicles immediately
        setAvailableFleetVehicles(prev => [
          {
            ...newVehicle,
            isCheckoutSuggested: isOptimal,
            driverMobile: newVehicle.driverPhone
          },
          ...prev
        ]);

        toast({
          title: isOptimal ? "🎯 انتخاب بهینه اضافه شد" : "✅ خودرو اضافه شد",
          description: `خودرو ${vehicle.name} ${isOptimal ? '(انتخاب بهینه سیستم)' : ''} به لیست خودروهای آماده اضافه شد و آماده اختصاص است`,
          variant: "default"
        });

        // Close the suitable vehicles dialog
        setIsSuitableVehiclesOpen(false);
        
        // Refresh ready vehicles list
        queryClient.invalidateQueries({ queryKey: ['/api/logistics/ready-vehicles'] });

      } else {
        throw new Error('Failed to create ready vehicle');
      }
    } catch (error) {
      console.error('Error creating ready vehicle from template:', error);
      toast({
        title: "خطا",
        description: "خطا در ایجاد خودرو آماده از قالب انتخابی",
        variant: "destructive"
      });
    }
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
      supportsFlammable: formData.get('supportsFlammable') === 'true',
      supportsRefrigerated: formData.get('supportsRefrigerated') === 'true',
      supportsFragile: formData.get('supportsFragile') !== 'false',
      averageSpeedKmh: formData.get('averageSpeedKmh') as string || "50",

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
    
    const allowedRoutesString = formData.get('allowedRoutes') as string;
    const allowedRoutesArray = allowedRoutesString ? allowedRoutesString.split(',').map(r => r.trim()) : ['urban'];
    
    const selectedVehicleType = formData.get('vehicleType') as string;
    const finalVehicleType = selectedVehicleType === 'سایر' ? customEditVehicleType : selectedVehicleType;
    
    const data = {
      name: formData.get('name') as string,
      nameEn: formData.get('nameEn') as string,
      vehicleType: finalVehicleType,
      maxWeightKg: parseFloat(formData.get('maxWeightKg') as string),
      maxVolumeM3: parseFloat(formData.get('maxVolumeM3') as string) || 0,
      basePrice: parseFloat(formData.get('basePrice') as string),
      pricePerKm: parseFloat(formData.get('pricePerKm') as string),
      allowedRoutes: allowedRoutesArray,
      averageSpeedKmh: parseFloat(formData.get('averageSpeedKmh') as string) || 50,
      supportsFlammable: formData.get('supportsFlammable') === 'true',

      isActive: formData.get('isActive') === 'on'
    };

    console.log('🚛 [VEHICLE EDIT] Sending data:', data);
    updateVehicleMutation.mutate({ id: editingVehicle.id, ...data });
  };

  const handleToggleVehicleStatus = (vehicleId: number, newStatus: boolean) => {
    updateVehicleMutation.mutate({ 
      id: vehicleId, 
      isActive: newStatus 
    });
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates">الگوهای خودرو</TabsTrigger>
            <TabsTrigger value="editor">ویرایش قالب‌ها</TabsTrigger>
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
                      <div className="space-y-2">
                        <Label htmlFor="supportsFlammable">مجاز برای حمل مواد آتش زا</Label>
                        <select name="supportsFlammable" className="w-full p-2 border rounded">
                          <option value="false">❌ غیرمجاز</option>
                          <option value="true">✅ مجاز</option>
                        </select>
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
                      <TableHead>حجم</TableHead>
                      <TableHead>قیمت پایه</TableHead>
                      <TableHead>مجاز برای حمل مواد آتش زا</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehiclesLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">در حال بارگذاری...</TableCell>
                      </TableRow>
                    ) : vehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">هیچ الگوی خودرویی یافت نشد</TableCell>
                      </TableRow>
                    ) : (
                      vehicles.map((vehicle: any) => (
                        <TableRow key={vehicle.id}>
                          <TableCell>{vehicle.name}</TableCell>
                          <TableCell>{(VEHICLE_TYPES as any)[vehicle.vehicleType] || vehicle.vehicleType}</TableCell>
                          <TableCell>{parseInt(vehicle.maxWeightKg)} کیلوگرم</TableCell>
                          <TableCell>{parseInt(vehicle.maxVolumeM3) || 0} متر مکعب</TableCell>
                          <TableCell>{parseInt(vehicle.basePrice)} دینار</TableCell>
                          <TableCell>
                            <Badge variant={vehicle.supportsFlammable ? "default" : "destructive"} className="text-xs">
                              {vehicle.supportsFlammable ? "✅ مجاز" : "❌ غیرمجاز"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={vehicle.isActive ? "default" : "secondary"}>
                                {vehicle.isActive ? "فعال" : "غیرفعال"}
                              </Badge>
                              <Button
                                size="sm"
                                variant={vehicle.isActive ? "destructive" : "default"}
                                onClick={() => handleToggleVehicleStatus(vehicle.id, !vehicle.isActive)}
                                disabled={updateVehicleMutation.isPending}
                              >
                                {vehicle.isActive ? "غیرفعال" : "فعال"}
                              </Button>
                            </div>
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
            <Dialog open={!!editingVehicle} onOpenChange={(open) => {
              if (!open) {
                setEditingVehicle(null);
                setShowCustomEditInput(false);
                setCustomEditVehicleType('');
              }
            }}>
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
                          defaultValue={Object.keys(VEHICLE_TYPES).includes(editingVehicle.vehicleType) ? editingVehicle.vehicleType : 'سایر'}
                          required 
                          className="w-full p-2 border rounded"
                          onChange={(e) => {
                            const value = e.target.value;
                            setShowCustomEditInput(value === 'سایر');
                            if (value !== 'سایر') {
                              setCustomEditVehicleType('');
                            }
                          }}
                        >
                          <option value="">انتخاب نوع خودرو</option>
                          {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                          ))}
                          <option value="سایر">سایر (وارد کردن نوع دلخواه)</option>
                        </select>
                        {showCustomEditInput && (
                          <div className="mt-2">
                            <Input 
                              name="customVehicleType"
                              value={customEditVehicleType}
                              onChange={(e) => setCustomEditVehicleType(e.target.value)}
                              placeholder="نوع خودروی مورد نظر را وارد کنید"
                              required={showCustomEditInput}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-maxWeightKg">حداکثر وزن (کیلوگرم) *</Label>
                        <input 
                          id="edit-maxWeightKg" 
                          name="maxWeightKg" 
                          type="number" 
                          defaultValue={parseInt(editingVehicle.maxWeightKg).toString()}
                          required 
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-basePrice">قیمت پایه (دینار) *</Label>
                        <input 
                          id="edit-basePrice" 
                          name="basePrice" 
                          type="number" 
                          defaultValue={parseInt(editingVehicle.basePrice).toString()}
                          required 
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-pricePerKm">قیمت هر کیلومتر (دینار) *</Label>
                        <input 
                          id="edit-pricePerKm" 
                          name="pricePerKm" 
                          type="number" 
                          defaultValue={parseInt(editingVehicle.pricePerKm).toString()}
                          required 
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <input 
                          id="edit-averageSpeedKmh" 
                          name="averageSpeedKmh" 
                          type="number" 
                          defaultValue={(parseInt(editingVehicle.averageSpeedKmh) || 50).toString()}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-maxVolumeM3">حجم حداکثر (متر مکعب)</Label>
                        <input 
                          id="edit-maxVolumeM3" 
                          name="maxVolumeM3" 
                          type="number" 
                          defaultValue={(parseInt(editingVehicle.maxVolumeM3) || 0).toString()}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-supportsFlammable">مجاز برای حمل مواد آتش زا</Label>
                        <select 
                          name="supportsFlammable" 
                          defaultValue={editingVehicle.supportsFlammable ? "true" : "false"}
                          className="w-full p-2 border rounded"
                        >
                          <option value="false">❌ غیرمجاز</option>
                          <option value="true">✅ مجاز</option>
                        </select>
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

          <TabsContent value="editor" className="space-y-4">
            <VehicleTemplateEditor />
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

  // Print order details - deprecated in favor of direct same-tab print
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

    // Use same-tab print instead of iframe
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    
    // Print and restore
    window.print();
    document.body.innerHTML = originalContent;
  };

  // Print function for order details
  const handlePrintOrder = (orderDetails: any) => {
    if (!orderDetails) return;

    const printContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>جزئیات سفارش ${orderDetails.orderNumber}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
          margin: 20px; 
          direction: rtl; 
          font-size: 14px;
          line-height: 1.6;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #2563eb; 
          padding-bottom: 10px; 
          margin-bottom: 20px; 
        }
        .company-name { 
          font-size: 24px; 
          font-weight: bold; 
          color: #2563eb; 
          margin-bottom: 5px;
        }
        .section { 
          margin-bottom: 15px; 
          border: 1px solid #e5e7eb; 
          border-radius: 8px; 
          padding: 12px;
        }
        .section-title { 
          font-weight: bold; 
          font-size: 16px; 
          color: #374151; 
          margin-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 10px; 
        }
        .info-item { 
          display: flex; 
          justify-content: space-between; 
          padding: 4px 0;
        }
        .label { 
          font-weight: 600; 
          color: #6b7280; 
        }
        .value { 
          color: #374151; 
        }
        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px;
        }
        .items-table th, .items-table td { 
          border: 1px solid #d1d5db; 
          padding: 8px; 
          text-align: right; 
        }
        .items-table th { 
          background-color: #f3f4f6; 
          font-weight: bold; 
        }
        .total-row { 
          background-color: #fef3c7; 
          font-weight: bold; 
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        .status-confirmed { background-color: #dcfce7; color: #166534; }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-rejected { background-color: #fecaca; color: #dc2626; }
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="/attached_assets/Logo_1753245273579.jpeg" alt="شرکت ممتاز شیمی" style="max-width: 120px; max-height: 80px; margin-bottom: 15px;" onerror="this.style.display='none'">
        <div class="company-name">ممتاز شیمی</div>
        <div>جزئیات سفارش ${orderDetails.orderNumber}</div>
        <div style="font-size: 12px; color: #6b7280;">تاریخ چاپ: ${new Date().toLocaleDateString('en-GB')}</div>
      </div>

      <div class="section">
        <div class="section-title">اطلاعات سفارش</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">شماره سفارش:</span>
            <span class="value">${orderDetails.orderNumber}</span>
          </div>
          <div class="info-item">
            <span class="label">تاریخ ثبت:</span>
            <span class="value">${orderDetails.createdAt ? new Date(orderDetails.createdAt).toLocaleDateString('en-GB') : 'نامشخص'}</span>
          </div>
          <div class="info-item">
            <span class="label">وضعیت:</span>
            <span class="value status-badge ${orderDetails.status === 'warehouse_approved' ? 'status-confirmed' : 
                                              orderDetails.status === 'pending' ? 'status-pending' : 'status-rejected'}">
              ${orderDetails.status === 'warehouse_approved' ? 'تایید انبار' : 
                orderDetails.status === 'logistics_dispatched' ? 'ارسال شده' : 
                orderDetails.status || 'نامشخص'}
            </span>
          </div>
          <div class="info-item">
            <span class="label">روش پرداخت:</span>
            <span class="value">${orderDetails.paymentMethod === 'digital_wallet' ? 'کیف پول دیجیتال' : 
                                  orderDetails.paymentMethod === 'iraqi_bank_gateway' ? 'درگاه بانکی عراقی' : 
                                  orderDetails.paymentMethod || 'نامشخص'}</span>
          </div>

          <div class="info-item">
            <span class="label">وزن کل:</span>
            <span class="value">${orderDetails.calculatedWeight || orderDetails.totalWeight || 'محاسبه نشده'} کیلوگرم</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">اطلاعات مشتری</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">نام:</span>
            <span class="value">${orderDetails.customerFirstName || ''} ${orderDetails.customerLastName || ''}</span>
          </div>
          <div class="info-item">
            <span class="label">ایمیل:</span>
            <span class="value">${orderDetails.customerEmail || 'نامشخص'}</span>
          </div>
          <div class="info-item">
            <span class="label">تلفن:</span>
            <span class="value">${orderDetails.customerPhone || 'نامشخص'}</span>
          </div>
        </div>
      </div>

      ${orderDetails.shippingAddress ? `
      <div class="section">
        <div class="section-title">آدرس تحویل</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">نام گیرنده:</span>
            <span class="value">${orderDetails.shippingAddress.name || 'نامشخص'}</span>
          </div>
          <div class="info-item">
            <span class="label">تلفن:</span>
            <span class="value">${orderDetails.shippingAddress.phone || 'نامشخص'}</span>
          </div>
          <div class="info-item" style="grid-column: 1 / -1;">
            <span class="label">آدرس:</span>
            <span class="value">${orderDetails.shippingAddress.address || 'نامشخص'}</span>
          </div>
          <div class="info-item">
            <span class="label">شهر:</span>
            <span class="value">${orderDetails.shippingAddress.city || 'نامشخص'}</span>
          </div>
          <div class="info-item">
            <span class="label">کد پستی:</span>
            <span class="value">${orderDetails.shippingAddress.postalCode || 'نامشخص'}</span>
          </div>
        </div>
      </div>` : ''}



      ${orderDetails.deliveryNotes || orderDetails.logisticsNotes ? `
      <div class="section">
        <div class="section-title">یادداشت تحویل</div>
        <div class="value">${orderDetails.deliveryNotes || orderDetails.logisticsNotes}</div>
      </div>` : ''}

      <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280;">
        این سند توسط سیستم مدیریت ممتاز شیمی تولید شده است
      </div>
    </body>
    </html>
    `;

    // Save current body content and replace with print content
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    
    // Print and restore
    window.print();
    document.body.innerHTML = originalContent;
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={forceRefreshLogisticsOrders}
              className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <RefreshCw className="w-4 h-4" />
              به‌روزرسانی قوی
            </Button>
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

                    {/* Payment Method Block */}
                    <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
                      <h5 className="font-medium text-teal-800 mb-2 flex items-center">
                        <CreditCard className="w-4 h-4 mr-2" />
                        نوع تسویه حساب
                      </h5>
                      <PaymentMethodBadge 
                        paymentMethod={order.paymentMethod}
                        totalAmount={order.totalAmount}
                        currency={order.currency}
                        size="md"
                        showAmount={true}
                      />
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
                            ? order.shippingAddress as any
                            : null;
                            
                          if (shippingData) {
                            return (
                              <>
                                {shippingData.name && (
                                  <p className="text-sm font-medium text-orange-800">
                                    {shippingData.name}
                                  </p>
                                )}
                                {shippingData.phone && (
                                  <p className="text-xs text-orange-600 flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {shippingData.phone}
                                  </p>
                                )}
                                <p className="text-sm text-orange-700">
                                  {shippingData.address || 'آدرس مشخص نشده'}
                                </p>
                                {(shippingData.city || shippingData.country) && (
                                  <p className="text-xs text-orange-600">
                                    {[shippingData.city, shippingData.country].filter(Boolean).join(' - ')}
                                    {shippingData.postalCode && ` - ${shippingData.postalCode}`}
                                  </p>
                                )}
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

                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-orange-500 text-orange-700 hover:bg-orange-100"
                        onClick={() => handleVehicleAssignment(order)}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        اختصاص وسیله ارسال محموله
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



  // New Geography Tab for provinces and cities management with editing capabilities
  const GeographyTab = () => {
    const [editingProvince, setEditingProvince] = useState<any>(null);
    const [editingCity, setEditingCity] = useState<any>(null);
    const [isEditProvinceDialogOpen, setIsEditProvinceDialogOpen] = useState(false);
    const [isEditCityDialogOpen, setIsEditCityDialogOpen] = useState(false);
    const [selectedOriginCity, setSelectedOriginCity] = useState<any>(null);
    const [citySortField, setCitySortField] = useState<string | null>(null);
    const [citySortDirection, setCitySortDirection] = useState<'asc' | 'desc'>('asc');

    const geographyProvinces = (geographyProvincesResponse as any)?.data || [];
    const geographyCities = (geographyCitiesResponse as any)?.data || [];

    // Calculate dynamic distances based on selected origin city
    const calculateDistance = (targetCity: any) => {
      if (!selectedOriginCity) return targetCity.distance_from_erbil_km || 0;
      
      const originDistance = selectedOriginCity.distance_from_erbil_km || 0;
      const targetDistance = targetCity.distance_from_erbil_km || 0;
      
      // Calculate relative distance using Erbil as common reference point
      return Math.abs(targetDistance - originDistance);
    };

    // Handle sorting for cities table
    const handleCitySort = (field: string) => {
      if (citySortField === field) {
        setCitySortDirection(citySortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setCitySortField(field);
        setCitySortDirection('asc');
      }
    };

    // Sort cities based on current sort field and direction
    const sortedCities = [...geographyCities].sort((a: any, b: any) => {
      if (!citySortField) return 0;
      
      let aValue, bValue;
      
      switch (citySortField) {
        case 'id':
          aValue = a.id || 0;
          bValue = b.id || 0;
          break;
        case 'name':
          aValue = a.name_arabic || a.name || '';
          bValue = b.name_arabic || b.name || '';
          break;
        case 'province':
          aValue = a.province_name || '';
          bValue = b.province_name || '';
          break;
        case 'distance':
          aValue = calculateDistance(a);
          bValue = calculateDistance(b);
          break;

        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue, 'ar');
        return citySortDirection === 'asc' ? result : -result;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const result = aValue - bValue;
        return citySortDirection === 'asc' ? result : -result;
      }
      
      return 0;
    });

    // Calculate province distance (average of cities in province)
    const calculateProvinceDistance = (province: any) => {
      if (!selectedOriginCity) return 0;
      
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
        is_active: formData.get('is_active') === 'on',
        has_intercity_bus_line: formData.get('has_intercity_bus_line') === 'on'
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
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg" style={{ position: 'relative' }}>
                  <Table className="relative" style={{ position: 'relative' }}>
                    <TableHeader 
                      className="sticky top-0 bg-white z-50 shadow-sm border-b"
                      style={{ 
                        position: 'sticky', 
                        top: 0, 
                        backgroundColor: 'white', 
                        zIndex: 50,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                      <TableRow className="bg-white" style={{ backgroundColor: 'white', position: 'relative', zIndex: 50 }}>
                        <TableHead className="text-right w-20 bg-white sticky top-0 z-50 border-b" style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 50 }}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCitySort('id')}
                            className="flex items-center justify-end gap-1 p-0 h-auto font-medium text-right w-full"
                          >
                            ردیف
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right w-48 bg-white sticky top-0 z-50 border-b" style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 50 }}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCitySort('name')}
                            className="flex items-center justify-end gap-1 p-0 h-auto font-medium text-right w-full"
                          >
                            نام شهر
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right w-32 bg-white sticky top-0 z-50 border-b" style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 50 }}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCitySort('province')}
                            className="flex items-center justify-end gap-1 p-0 h-auto font-medium text-right w-full"
                          >
                            استان
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right w-64 bg-white sticky top-0 z-50 border-b" style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 50 }}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCitySort('distance')}
                            className="flex items-center justify-end gap-1 p-0 h-auto font-medium text-right w-full"
                          >
                            فاصله از {selectedOriginCity ? (selectedOriginCity.name_arabic || selectedOriginCity.name) : 'اربیل'} (کیلومتر)
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>

                        <TableHead className="text-right w-32 bg-white sticky top-0 z-50 border-b" style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 50 }}>
                          <div className="flex items-center justify-end gap-1">
                            <Bus className="h-4 w-4 text-blue-600" />
                            <span>خط مسافربری</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-right w-24 bg-white sticky top-0 z-50 border-b" style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 50 }}>وضعیت</TableHead>
                        <TableHead className="text-right w-32 bg-white sticky top-0 z-50 border-b" style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 50 }}>عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedCities.map((city: any) => (
                      <TableRow key={city.id}>
                        <TableCell className="font-medium text-right w-20">{city.id}</TableCell>
                        <TableCell className="text-right w-48">
                          <div className="flex flex-col text-right space-y-1">
                            <span className="font-medium text-base">{city.name_arabic || city.name}</span>
                            {city.name_english && city.name_english !== city.name_arabic && (
                              <span className="text-sm text-gray-500 leading-tight">{city.name_english}</span>
                            )}
                            {city.name_kurdish && city.name_kurdish !== city.name_arabic && city.name_kurdish !== city.name_english && (
                              <span className="text-xs text-gray-400 leading-tight">{city.name_kurdish}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right w-32">{city.province_name}</TableCell>
                        <TableCell className="text-right w-64">
                          <div className="flex justify-end items-center gap-2">
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
                              <button
                                onClick={() => {
                                  setEditingCity(city);
                                  setIsEditCityDialogOpen(true);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-1 py-0.5 rounded transition-colors"
                                title="ویرایش سریع فاصله"
                              >
                                📍
                              </button>
                            )}
                          </div>
                          {!selectedOriginCity && (
                            <div className="text-xs text-gray-500 mt-1 text-right">
                              (از اربیل: {city.distance_from_erbil_km || 0} کیلومتر)
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-right w-32">
                          <div className="flex justify-end">
                            {city.has_intercity_bus_line ? (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                <Bus className="h-3 w-3 mr-1" />
                                دارد
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
                                ندارد
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right w-24">
                          <div className="flex justify-end">
                            <Badge variant={city.is_active ? "default" : "secondary"}>
                              {city.is_active ? "فعال" : "غیرفعال"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right w-32">
                          <div className="flex justify-end">
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    </TableBody>
                  </Table>
                </div>
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
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                ویرایش شهر
              </DialogTitle>
              <DialogDescription className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-blue-700">🏙️</span>
                  <span>ویرایش اطلاعات شهر <strong>{editingCity?.name_arabic || editingCity?.name}</strong></span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  استان: {editingCity?.province_name}
                </div>
              </DialogDescription>
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
                    <Label htmlFor="distance_from_erbil_km" className="text-blue-700 font-medium">
                      📍 فاصله از اربیل (کیلومتر) *
                    </Label>
                    <div className="relative">
                      <Input 
                        id="distance_from_erbil_km" 
                        name="distance_from_erbil_km" 
                        type="number"
                        min="0"
                        max="1000"
                        step="1"
                        defaultValue={editingCity.distance_from_erbil_km || 0}
                        required 
                        className="pl-20 text-center font-medium text-lg"
                        placeholder="0"
                      />
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                        کیلومتر
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                      💡 این فاصله برای محاسبه هزینه حمل و انتخاب خودرو استفاده می‌شود
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>استان</Label>
                    <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                      {editingCity.province_name}
                    </p>
                  </div>
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border-2 border-blue-200">
                      <input 
                        type="checkbox" 
                        id="city_has_intercity_bus_line" 
                        name="has_intercity_bus_line" 
                        defaultChecked={editingCity.has_intercity_bus_line}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Bus className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="city_has_intercity_bus_line" className="text-blue-800 font-medium">
                        خط مسافربری بین شهری موجود است
                      </Label>
                    </div>
                    <p className="text-xs text-blue-600 px-3">
                      💡 این گزینه نشان می‌دهد که آیا در این شهر خدمات اتوبوس بین شهری ارائه می‌شود یا خیر
                    </p>
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

  // Ready Vehicles Tab Component
  const ReadyVehiclesTab = () => {
    // Query for ready vehicles
    const { data: readyVehiclesData, isLoading: readyVehiclesLoading } = useQuery({
      queryKey: ['/api/logistics/ready-vehicles'],
      queryFn: () => fetch('/api/logistics/ready-vehicles', { credentials: 'include' }).then(res => res.json())
    });

    const readyVehicles = readyVehiclesData?.data || [];

    // Create ready vehicle mutation
    const createReadyVehicleMutation = useMutation({
      mutationFn: (data: Partial<ReadyVehicle>) => 
        fetch('/api/logistics/ready-vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        }).then(res => res.json()),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/logistics/ready-vehicles'] });
        setIsCreateReadyVehicleDialogOpen(false);
        toast({ title: "موفقیت", description: "خودرو آماده ثبت شد" });
      },
      onError: () => {
        toast({ title: "خطا", description: "خطا در ثبت خودرو آماده", variant: "destructive" });
      }
    });

    // Update ready vehicle mutation
    const updateReadyVehicleMutation = useMutation({
      mutationFn: ({ id, ...data }: { id: number } & Partial<ReadyVehicle>) => 
        fetch(`/api/logistics/ready-vehicles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        }).then(res => res.json()),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/logistics/ready-vehicles'] });
        setIsEditReadyVehicleDialogOpen(false);
        setSelectedReadyVehicle(null);
        toast({ title: "موفقیت", description: "خودرو آماده بروزرسانی شد" });
      },
      onError: () => {
        toast({ title: "خطا", description: "خطا در بروزرسانی خودرو آماده", variant: "destructive" });
      }
    });

    // Delete ready vehicle mutation
    const deleteReadyVehicleMutation = useMutation({
      mutationFn: (id: number) => 
        fetch(`/api/logistics/ready-vehicles/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        }).then(res => res.json()),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/logistics/ready-vehicles'] });
        toast({ title: "موفقیت", description: "خودرو آماده حذف شد" });
      },
      onError: () => {
        toast({ title: "خطا", description: "خطا در حذف خودرو آماده", variant: "destructive" });
      }
    });

    // Handle form submission for creating ready vehicle
    const handleCreateReadyVehicle = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      
      // Determine vehicle type based on selection
      const selectedVehicleType = formData.get('vehicleType') as string;
      const finalVehicleType = selectedVehicleType === 'سایر' ? customVehicleType : selectedVehicleType;
      
      createReadyVehicleMutation.mutate({
        vehicleType: finalVehicleType,
        licensePlate: formData.get('licensePlate') as string,
        driverName: formData.get('driverName') as string,
        driverMobile: formData.get('driverMobile') as string,
        loadCapacity: parseInt(formData.get('loadCapacity') as string),
        currentLocation: formData.get('currentLocation') as string,
        notes: formData.get('notes') as string,
        isAvailable: formData.get('isAvailable') === 'true',
        supportsFlammable: formData.get('supportsFlammable') === 'true',
        notAllowedFlammable: formData.get('notAllowedFlammable') === 'true'
      });
      
      // Reset custom input state
      setShowCustomInput(false);
      setCustomVehicleType('');
    };

    // Handle form submission for updating ready vehicle
    const handleUpdateReadyVehicle = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedReadyVehicle) return;
      
      const formData = new FormData(e.target as HTMLFormElement);
      
      // Determine vehicle type based on selection
      const selectedVehicleType = formData.get('vehicleType') as string;
      const finalVehicleType = selectedVehicleType === 'سایر' ? customEditVehicleType : selectedVehicleType;
      
      updateReadyVehicleMutation.mutate({
        id: selectedReadyVehicle.id,
        vehicleType: finalVehicleType,
        licensePlate: formData.get('licensePlate') as string,
        driverName: formData.get('driverName') as string,
        driverMobile: formData.get('driverMobile') as string,
        loadCapacity: parseInt(formData.get('loadCapacity') as string),
        currentLocation: formData.get('currentLocation') as string,
        notes: formData.get('notes') as string,
        isAvailable: formData.get('isAvailable') === 'true',
        supportsFlammable: formData.get('supportsFlammable') === 'true',
        notAllowedFlammable: formData.get('notAllowedFlammable') === 'true'
      });
      
      // Reset custom input state
      setShowCustomEditInput(false);
      setCustomEditVehicleType('');
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5 text-green-600" />
            دایرکتوری خودروهای آماده به کار
          </h3>
          <Button 
            onClick={() => setIsCreateReadyVehicleDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            افزودن خودرو آماده
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نوع خودرو</TableHead>
                  <TableHead>شماره خودرو</TableHead>
                  <TableHead>نام راننده</TableHead>
                  <TableHead>موبایل راننده</TableHead>
                  <TableHead>مواد آتش‌زا</TableHead>
                  <TableHead>موقعیت فعلی</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readyVehiclesLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">در حال بارگذاری...</TableCell>
                  </TableRow>
                ) : readyVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Truck className="h-12 w-12 text-gray-400" />
                        <p className="text-gray-600">هیچ خودرو آماده‌ای ثبت نشده</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  readyVehicles.map((vehicle: ReadyVehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.vehicleType}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {vehicle.licensePlate}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{vehicle.driverName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-blue-600" />
                          <span className="font-mono text-blue-600">{vehicle.driverMobile}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {vehicle.supportsFlammable ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              مجاز
                            </Badge>
                          ) : vehicle.notAllowedFlammable ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs">
                              <X className="h-3 w-3 mr-1" />
                              غیرمجاز
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300 text-xs">
                              <Minus className="h-3 w-3 mr-1" />
                              نامشخص
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {vehicle.currentLocation || 'نامشخص'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={vehicle.isAvailable ? "default" : "destructive"}>
                          {vehicle.isAvailable ? "آماده" : "مشغول"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setSelectedReadyVehicle(vehicle);
                              setIsEditReadyVehicleDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => deleteReadyVehicleMutation.mutate(vehicle.id)}
                            disabled={deleteReadyVehicleMutation.isPending}
                          >
                            <AlertTriangle className="h-4 w-4" />
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

        {/* Create Ready Vehicle Dialog */}
        <Dialog open={isCreateReadyVehicleDialogOpen} onOpenChange={setIsCreateReadyVehicleDialogOpen}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-600" />
                افزودن خودرو آماده به کار
              </DialogTitle>
              <DialogDescription>
                اطلاعات خودرو و راننده را برای ثبت در دایرکتوری وارد کنید
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateReadyVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">نوع خودرو *</Label>
                  <select 
                    id="vehicleType" 
                    name="vehicleType" 
                    required 
                    value={showCustomInput ? 'سایر' : ''}
                    onChange={(e) => {
                      if (e.target.value === 'سایر') {
                        setShowCustomInput(true);
                        setCustomVehicleType('');
                      } else {
                        setShowCustomInput(false);
                        setCustomVehicleType('');
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">انتخاب نوع خودرو</option>
                    <option value="اتوبوس مسافربری">اتوبوس مسافربری</option>
                    <option value="اتوبوس شهری">اتوبوس شهری</option>
                    <option value="مینی‌بوس">مینی‌بوس</option>
                    <option value="کامیون سنگین">کامیون سنگین</option>
                    <option value="کامیون متوسط">کامیون متوسط</option>
                    <option value="کامیون سبک">کامیون سبک</option>
                    <option value="وانت سبک">وانت سبک</option>
                    <option value="وانت متوسط">وانت متوسط</option>
                    <option value="ون سبک">ون سبک</option>
                    <option value="ون متوسط">ون متوسط</option>
                    <option value="موتورسیکلت">موتورسیکلت</option>
                    <option value="خودرو سواری">خودرو سواری</option>
                    <option value="تریلر">تریلر</option>
                    <option value="نیم‌تریلر">نیم‌تریلر</option>
                    <option value="کشنده">کشنده</option>
                    <option value="کامیون کمپرسی">کامیون کمپرسی</option>
                    <option value="کامیون یخچالی">کامیون یخچالی</option>
                    <option value="تانکر">تانکر</option>
                    <option value="کامیون جرثقیل">کامیون جرثقیل</option>
                    <option value="یدک‌کش">یدک‌کش</option>
                    <option value="آمبولانس">آمبولانس</option>
                    <option value="ماشین آتش‌نشانی">ماشین آتش‌نشانی</option>
                    <option value="تاکسی">تاکسی</option>
                    <option value="دوچرخه">دوچرخه</option>
                    <option value="اسکوتر">اسکوتر</option>
                    <option value="سایر">➕ سایر (نوع دلخواه)</option>
                  </select>
                  
                  {/* Custom vehicle type input */}
                  {showCustomInput && (
                    <div className="mt-2">
                      <input
                        type="text"
                        name="customVehicleType"
                        value={customVehicleType}
                        onChange={(e) => setCustomVehicleType(e.target.value)}
                        placeholder="نوع خودرو جدید را وارد کنید..."
                        required
                        className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                      />
                      <p className="text-xs text-blue-600 mt-1">💡 مثال: کامیون اسکانیا، اتوبوس مدرسه، ون سوخت‌رسانی</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">شماره خودرو *</Label>
                  <Input 
                    id="licensePlate" 
                    name="licensePlate" 
                    required 
                    placeholder="مثال: 12ج345678"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverName">نام راننده *</Label>
                  <Input 
                    id="driverName" 
                    name="driverName" 
                    required 
                    placeholder="نام و نام خانوادگی راننده"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverMobile">موبایل راننده *</Label>
                  <Input 
                    id="driverMobile" 
                    name="driverMobile" 
                    required 
                    placeholder="مثال: 07501234567"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loadCapacity">ظرفیت حمل (کیلوگرم) *</Label>
                  <Input 
                    id="loadCapacity" 
                    name="loadCapacity" 
                    type="number" 
                    required 
                    placeholder="مثال: 1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentLocation">موقعیت فعلی</Label>
                  <Input 
                    id="currentLocation" 
                    name="currentLocation" 
                    placeholder="مثال: اربیل، بغداد"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes">یادداشت‌ها</Label>
                  <Input 
                    id="notes" 
                    name="notes" 
                    placeholder="اطلاعات اضافی در مورد خودرو یا راننده"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="hidden" name="isAvailable" value="false" />
                    <input 
                      type="checkbox" 
                      id="isAvailable" 
                      name="isAvailable" 
                      value="true" 
                      defaultChecked
                    />
                    <Label htmlFor="isAvailable">آماده به کار</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-orange-700 flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    قابلیت حمل مواد آتش‌زا
                  </Label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="hidden" name="supportsFlammable" value="false" />
                      <input 
                        type="checkbox" 
                        id="supportsFlammable" 
                        name="supportsFlammable" 
                        value="true"
                      />
                      <Label htmlFor="supportsFlammable" className="text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1 inline" />
                        مجهز برای حمل مواد آتش‌زا
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="hidden" name="notAllowedFlammable" value="false" />
                      <input 
                        type="checkbox" 
                        id="notAllowedFlammable" 
                        name="notAllowedFlammable" 
                        value="true"
                      />
                      <Label htmlFor="notAllowedFlammable" className="text-red-700">
                        <X className="h-3 w-3 mr-1 inline" />
                        غیرمجاز برای مواد آتش‌زا
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateReadyVehicleDialogOpen(false)}>
                  انصراف
                </Button>
                <Button type="submit" disabled={createReadyVehicleMutation.isPending}>
                  {createReadyVehicleMutation.isPending ? "در حال ثبت..." : "ثبت خودرو"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Ready Vehicle Dialog */}
        <Dialog open={isEditReadyVehicleDialogOpen} onOpenChange={setIsEditReadyVehicleDialogOpen}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                ویرایش خودرو آماده
              </DialogTitle>
              <DialogDescription>
                ویرایش اطلاعات خودرو {selectedReadyVehicle?.licensePlate}
              </DialogDescription>
            </DialogHeader>
            
            {selectedReadyVehicle && (
              <form onSubmit={handleUpdateReadyVehicle} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-vehicleType">نوع خودرو *</Label>
                    <select 
                      id="edit-vehicleType" 
                      name="vehicleType" 
                      required 
                      value={showCustomEditInput ? 'سایر' : selectedReadyVehicle.vehicleType}
                      onChange={(e) => {
                        if (e.target.value === 'سایر') {
                          setShowCustomEditInput(true);
                          setCustomEditVehicleType(selectedReadyVehicle.vehicleType);
                        } else {
                          setShowCustomEditInput(false);
                          setCustomEditVehicleType('');
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">انتخاب نوع خودرو</option>
                      <option value="اتوبوس مسافربری">اتوبوس مسافربری</option>
                      <option value="اتوبوس شهری">اتوبوس شهری</option>
                      <option value="مینی‌بوس">مینی‌بوس</option>
                      <option value="کامیون سنگین">کامیون سنگین</option>
                      <option value="کامیون متوسط">کامیون متوسط</option>
                      <option value="کامیون سبک">کامیون سبک</option>
                      <option value="وانت سبک">وانت سبک</option>
                      <option value="وانت متوسط">وانت متوسط</option>
                      <option value="ون سبک">ون سبک</option>
                      <option value="ون متوسط">ون متوسط</option>
                      <option value="موتورسیکلت">موتورسیکلت</option>
                      <option value="خودرو سواری">خودرو سواری</option>
                      <option value="تریلر">تریلر</option>
                      <option value="نیم‌تریلر">نیم‌تریلر</option>
                      <option value="کشنده">کشنده</option>
                      <option value="کامیون کمپرسی">کامیون کمپرسی</option>
                      <option value="کامیون یخچالی">کامیون یخچالی</option>
                      <option value="تانکر">تانکر</option>
                      <option value="کامیون جرثقیل">کامیون جرثقیل</option>
                      <option value="یدک‌کش">یدک‌کش</option>
                      <option value="آمبولانس">آمبولانس</option>
                      <option value="ماشین آتش‌نشانی">ماشین آتش‌نشانی</option>
                      <option value="تاکسی">تاکسی</option>
                      <option value="دوچرخه">دوچرخه</option>
                      <option value="اسکوتر">اسکوتر</option>
                      <option value="سایر">➕ سایر (نوع دلخواه)</option>
                    </select>
                    
                    {/* Custom vehicle type input for edit */}
                    {showCustomEditInput && (
                      <div className="mt-2">
                        <input
                          type="text"
                          name="customEditVehicleType"
                          value={customEditVehicleType}
                          onChange={(e) => setCustomEditVehicleType(e.target.value)}
                          placeholder="نوع خودرو را ویرایش کنید..."
                          required
                          className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                        />
                        <p className="text-xs text-blue-600 mt-1">💡 نوع خودرو را تغییر دهید یا نام جدید وارد کنید</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-licensePlate">شماره خودرو *</Label>
                    <Input 
                      id="edit-licensePlate" 
                      name="licensePlate" 
                      required 
                      defaultValue={selectedReadyVehicle.licensePlate}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-driverName">نام راننده *</Label>
                    <Input 
                      id="edit-driverName" 
                      name="driverName" 
                      required 
                      defaultValue={selectedReadyVehicle.driverName}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-driverMobile">موبایل راننده *</Label>
                    <Input 
                      id="edit-driverMobile" 
                      name="driverMobile" 
                      required 
                      defaultValue={selectedReadyVehicle.driverMobile}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-loadCapacity">ظرفیت حمل (کیلوگرم) *</Label>
                    <Input 
                      id="edit-loadCapacity" 
                      name="loadCapacity" 
                      type="number" 
                      required 
                      defaultValue={selectedReadyVehicle.loadCapacity}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-currentLocation">موقعیت فعلی</Label>
                    <Input 
                      id="edit-currentLocation" 
                      name="currentLocation" 
                      defaultValue={selectedReadyVehicle.currentLocation || ''}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="edit-notes">یادداشت‌ها</Label>
                    <Input 
                      id="edit-notes" 
                      name="notes" 
                      defaultValue={selectedReadyVehicle.notes || ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="hidden" name="isAvailable" value="false" />
                      <input 
                        type="checkbox" 
                        id="edit-isAvailable" 
                        name="isAvailable" 
                        value="true" 
                        defaultChecked={selectedReadyVehicle.isAvailable}
                      />
                      <Label htmlFor="edit-isAvailable">آماده به کار</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-orange-700 flex items-center gap-2">
                      <Flame className="h-4 w-4" />
                      قابلیت حمل مواد آتش‌زا
                    </Label>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="hidden" name="supportsFlammable" value="false" />
                        <input 
                          type="checkbox" 
                          id="edit-supportsFlammable" 
                          name="supportsFlammable" 
                          value="true"
                          defaultChecked={selectedReadyVehicle.supportsFlammable}
                        />
                        <Label htmlFor="edit-supportsFlammable" className="text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1 inline" />
                          مجهز برای حمل مواد آتش‌زا
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="hidden" name="notAllowedFlammable" value="false" />
                        <input 
                          type="checkbox" 
                          id="edit-notAllowedFlammable" 
                          name="notAllowedFlammable" 
                          value="true"
                          defaultChecked={selectedReadyVehicle.notAllowedFlammable}
                        />
                        <Label htmlFor="edit-notAllowedFlammable" className="text-red-700">
                          <X className="h-3 w-3 mr-1 inline" />
                          غیرمجاز برای مواد آتش‌زا
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditReadyVehicleDialogOpen(false)}>
                    انصراف
                  </Button>
                  <Button type="submit" disabled={updateReadyVehicleMutation.isPending}>
                    {updateReadyVehicleMutation.isPending ? "در حال بروزرسانی..." : "بروزرسانی"}
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="orders">سفارشات</TabsTrigger>
          <TabsTrigger value="companies">شرکت‌های حمل</TabsTrigger>
          <TabsTrigger value="geography">جغرافیای عراق</TabsTrigger>
          <TabsTrigger value="international">جغرافیای خارج از عراق</TabsTrigger>
          <TabsTrigger value="vehicles">وسایل نقلیه</TabsTrigger>
          <TabsTrigger value="ready-vehicles">خودروهای آماده</TabsTrigger>
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





        <TabsContent value="vehicles">
          <VehicleOptimizationTab />
        </TabsContent>

        <TabsContent value="ready-vehicles">
          <ReadyVehiclesTab />
        </TabsContent>

        <TabsContent value="international">
          <InternationalGeographyTab />
        </TabsContent>

        <TabsContent value="postal">
          <PostalServicesTab />
        </TabsContent>
      </Tabs>

      {/* Vehicle Assignment Dialog */}
      <Dialog open={isVehicleAssignmentOpen} onOpenChange={setIsVehicleAssignmentOpen}>
        <DialogContent className="max-w-4xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-6 h-6 text-orange-600" />
              اختصاص وسیله ارسال محموله به سفارش {selectedOrderForVehicle?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              انتخاب خودروی مناسب از ناوگان شرکت بر اساس نوع خودروی انتخابی مشتری
            </DialogDescription>
          </DialogHeader>

          {selectedOrderForVehicle && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  اطلاعات سفارش
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">مشتری</Label>
                    <p className="font-medium">
                      {selectedOrderForVehicle.customer?.firstName} {selectedOrderForVehicle.customer?.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">وزن محموله</Label>
                    <p className="font-medium">
                      {selectedOrderForVehicle.calculatedWeight || selectedOrderForVehicle.totalWeight} کیلوگرم
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">مقصد</Label>
                    <p className="font-medium">
                      {(selectedOrderForVehicle.shippingAddress as any)?.city || 'نامشخص'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer's Selected Vehicle Details */}
              {selectedVehicleDetails && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    خودروی انتخابی مشتری از سیستم هوشمند
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">نوع خودرو</Label>
                      <p className="font-medium">{selectedVehicleDetails.vehicleType}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">نام خودرو</Label>
                      <p className="font-medium">{selectedVehicleDetails.vehicleName}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">هزینه محاسبه شده</Label>
                      <p className="font-medium text-green-700">
                        {parseInt(selectedVehicleDetails.totalCost || 0).toLocaleString()} دینار
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">ظرفیت حمل</Label>
                      <p className="font-medium">{selectedVehicleDetails.maxWeight} کیلوگرم</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Available Fleet Vehicles */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  خودروهای آماده از ناوگان شرکت
                </h3>
                
                {availableFleetVehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-orange-400" />
                    <p className="text-orange-600">هیچ خودروی مناسبی از این نوع در دسترس نیست</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableFleetVehicles.map((vehicle) => (
                      <div 
                        key={vehicle.id} 
                        className={`bg-white rounded-lg p-4 border transition-all duration-300 ${
                          vehicle.isCheckoutSuggested 
                            ? 'border-green-500 bg-green-50 ring-2 ring-green-200 shadow-lg' 
                            : 'border-orange-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className={`font-semibold ${
                            vehicle.isCheckoutSuggested ? 'text-green-800' : 'text-gray-800'
                          }`}>
                            {vehicle.vehicleType || vehicle.vehicleName}
                          </h4>
                          <div className="flex gap-2">
                            {vehicle.isCheckoutSuggested && (
                              <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white animate-pulse">
                                🎯 پیشنهاد سیستم
                              </Badge>
                            )}
                            <Badge className="bg-green-500 text-white">آماده</Badge>
                          </div>
                        </div>
                        
                        {vehicle.isCheckoutSuggested && (
                          <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              این خودرو مطابق انتخاب مشتری در سیستم هوشمند است
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">شماره پلاک:</span>
                            <span className="font-medium">{vehicle.licensePlate || vehicle.plateNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">راننده:</span>
                            <span className="font-medium">{vehicle.driverName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">تلفن راننده:</span>
                            <span className="font-medium">{vehicle.driverMobile || vehicle.driverPhone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">ظرفیت:</span>
                            <span className="font-medium">{vehicle.loadCapacity || vehicle.maxWeight} کیلوگرم</span>
                          </div>
                        </div>
                        
                        <Button 
                          className={`w-full transition-all duration-300 ${
                            vehicle.isCheckoutSuggested 
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg' 
                              : 'bg-orange-600 hover:bg-orange-700'
                          } text-white`}
                          onClick={() => assignVehicleToOrder(
                            vehicle.id, 
                            vehicle.licensePlate || vehicle.plateNumber, 
                            vehicle.driverName, 
                            vehicle.driverMobile || vehicle.driverPhone
                          )}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {vehicle.isCheckoutSuggested ? 'اختصاص خودروی پیشنهادی' : 'اختصاص این خودرو'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

              {/* Order Details - Enhanced Format */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
                <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center">
                  <Package className="w-6 h-6 mr-2" />
                  جزئیات کامل سفارش
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Weight Information */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <Weight className="w-4 h-4 mr-1 text-blue-600" />
                      اطلاعات وزن
                    </Label>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">وزن محاسبه شده:</span>
                        <span className="font-semibold text-blue-700">{selectedOrder.calculatedWeight || 0} کیلوگرم</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">وزن کل:</span>
                        <span className="font-semibold text-purple-700">{selectedOrder.totalWeight || 0} کیلوگرم</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">واحد وزن:</span>
                        <span className="font-medium">{selectedOrder.weightUnit || 'kg'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <Calculator className="w-4 h-4 mr-1 text-green-600" />
                      اطلاعات مالی
                    </Label>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">مبلغ کل:</span>
                        <span className="font-bold text-green-700">{Math.floor(parseFloat(selectedOrder.totalAmount || '0')).toLocaleString()} {selectedOrder.currency || 'IQD'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">ارز:</span>
                        <span className="font-medium">{selectedOrder.currency || 'دینار عراق'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">شماره سفارش:</span>
                        <span className="font-semibold text-orange-700">{selectedOrder.orderNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <Truck className="w-4 h-4 mr-1 text-purple-600" />
                      اطلاعات تحویل
                    </Label>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">روش تحویل:</span>
                        <span className="font-semibold text-purple-700">{selectedOrder.deliveryMethod || 'پیک'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">نوع حمل:</span>
                        <span className="font-medium">{selectedOrder.transportationType || 'استاندارد'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">کد ردیابی:</span>
                        <span className="font-medium text-blue-600">{selectedOrder.trackingNumber || 'نامشخص'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Dates Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <History className="w-4 h-4 mr-1 text-indigo-600" />
                      تاریخ‌های مهم
                    </Label>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">تاریخ ایجاد:</span>
                        <span className="font-medium">{formatDateSafe(selectedOrder.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">آخرین بروزرسانی:</span>
                        <span className="font-medium">{formatDateSafe(selectedOrder.updatedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">تاریخ تحویل تخمینی:</span>
                        <span className="font-medium">{formatDateSafe(selectedOrder.estimatedDeliveryDate) || 'نامشخص'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                      <AlertCircle className="w-4 h-4 mr-1 text-red-600" />
                      وضعیت و کد تحویل
                    </Label>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">وضعیت فعلی:</span>
                        <Badge variant={selectedOrder.currentStatus === 'logistics_dispatched' ? 'default' : 'secondary'}>
                          {getStatusDisplayName(selectedOrder.currentStatus)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">کد تحویل:</span>
                        <span className="font-bold text-red-600">{selectedOrder.deliveryCode || 'تعیین نشده'}</span>
                      </div>
                    </div>
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

      {/* Ready Vehicle Edit Dialog */}
      <Dialog open={isEditReadyVehicleDialogOpen} onOpenChange={setIsEditReadyVehicleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">
              ویرایش خودرو آماده کار
            </DialogTitle>
            <DialogDescription className="text-right">
              اطلاعات خودرو و راننده را به‌روزرسانی کنید
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditReadyVehicle} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vehicle Type */}
              <div className="space-y-2">
                <Label htmlFor="edit-vehicleType">نوع خودرو *</Label>
                <div className="space-y-2">
                  <select
                    id="edit-vehicleType"
                    name="vehicleType"
                    required
                    value={editingVehicle?.vehicleType === 'سایر' ? 'سایر' : editingVehicle?.vehicleType || ''}
                    onChange={(e) => {
                      const showCustom = e.target.value === 'سایر';
                      setShowCustomEditInput(showCustom);
                      if (!showCustom) {
                        setCustomEditVehicleType('');
                      }
                    }}
                    className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">انتخاب کنید...</option>
                    <option value="کامیون سنگین">کامیون سنگین</option>
                    <option value="کامیون متوسط">کامیون متوسط</option>
                    <option value="کامیون سبک">کامیون سبک</option>
                    <option value="وانت سبک">وانت سبک</option>
                    <option value="وانت متوسط">وانت متوسط</option>
                    <option value="ون سبک">ون سبک</option>
                    <option value="ون متوسط">ون متوسط</option>
                    <option value="اتوبوس مسافربری">اتوبوس مسافربری</option>
                    <option value="اتوبوس شهری">اتوبوس شهری</option>
                    <option value="مینی‌بوس">مینی‌بوس</option>
                    <option value="تریلر">تریلر</option>
                    <option value="نیم‌تریلر">نیم‌تریلر</option>
                    <option value="کشنده">کشنده</option>
                    <option value="کامیون کمپرسی">کامیون کمپرسی</option>
                    <option value="کامیون یخچالی">کامیون یخچالی</option>
                    <option value="تانکر">تانکر</option>
                    <option value="کامیون جرثقیل">کامیون جرثقیل</option>
                    <option value="یدک‌کش">یدک‌کش</option>
                    <option value="آمبولانس">آمبولانس</option>
                    <option value="ماشین آتش‌نشانی">ماشین آتش‌نشانی</option>
                    <option value="تاکسی">تاکسی</option>
                    <option value="خودرو سواری">خودرو سواری</option>
                    <option value="موتورسیکلت">موتورسیکلت</option>
                    <option value="دوچرخه">دوچرخه</option>
                    <option value="اسکوتر">اسکوتر</option>
                    <option value="سایر">➕ سایر (نوع دلخواه)</option>
                  </select>
                  
                  {/* Custom vehicle type input for edit */}
                  {showCustomEditInput && (
                    <div className="mt-2">
                      <input
                        type="text"
                        name="customVehicleType"
                        value={customEditVehicleType}
                        onChange={(e) => setCustomEditVehicleType(e.target.value)}
                        placeholder="نوع خودرو جدید را وارد کنید..."
                        required
                        className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                      />
                      <p className="text-xs text-blue-600 mt-1">💡 مثال: کامیون اسکانیا، اتوبوس مدرسه، ون سوخت‌رسانی</p>
                    </div>
                  )}
                </div>
              </div>

              {/* License Plate */}
              <div className="space-y-2">
                <Label htmlFor="edit-licensePlate">شماره خودرو *</Label>
                <Input 
                  id="edit-licensePlate" 
                  name="licensePlate" 
                  required 
                  defaultValue={editingVehicle?.licensePlate}
                  placeholder="مثال: 12ج345678"
                  className="font-mono"
                />
              </div>

              {/* Driver Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-driverName">نام راننده *</Label>
                <Input 
                  id="edit-driverName" 
                  name="driverName" 
                  required 
                  defaultValue={editingVehicle?.driverName}
                  placeholder="نام و نام خانوادگی راننده"
                />
              </div>

              {/* Driver Mobile */}
              <div className="space-y-2">
                <Label htmlFor="edit-driverMobile">موبایل راننده *</Label>
                <Input 
                  id="edit-driverMobile" 
                  name="driverMobile" 
                  required 
                  defaultValue={editingVehicle?.driverMobile}
                  placeholder="مثال: 07501234567"
                />
              </div>

              {/* Load Capacity */}
              <div className="space-y-2">
                <Label htmlFor="edit-loadCapacity">ظرفیت بار (کیلوگرم) *</Label>
                <Input 
                  id="edit-loadCapacity" 
                  name="loadCapacity" 
                  type="number" 
                  min="1" 
                  required 
                  defaultValue={editingVehicle?.loadCapacity}
                  placeholder="مثال: 5000"
                />
              </div>

              {/* Current Location */}
              <div className="space-y-2">
                <Label htmlFor="edit-currentLocation">موقعیت فعلی</Label>
                <Input 
                  id="edit-currentLocation" 
                  name="currentLocation" 
                  defaultValue={editingVehicle?.currentLocation}
                  placeholder="مثال: بغداد - منطقه المنصور"
                />
              </div>
            </div>

            {/* Availability and Safety Settings */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-gray-800 mb-3">تنظیمات دسترسی و ایمنی</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Available Status */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    id="edit-isAvailable"
                    name="isAvailable"
                    defaultChecked={editingVehicle?.isAvailable}
                    value="true"
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  />
                  <Label htmlFor="edit-isAvailable" className="text-sm font-medium text-gray-700">
                    در دسترس
                  </Label>
                </div>

                {/* Supports Flammable */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    id="edit-supportsFlammable"
                    name="supportsFlammable"
                    defaultChecked={editingVehicle?.supportsFlammable}
                    value="true"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="edit-supportsFlammable" className="text-sm font-medium text-gray-700">
                    مجاز به حمل مواد آتش‌زا
                  </Label>
                </div>

                {/* Not Allowed Flammable */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    id="edit-notAllowedFlammable"
                    name="notAllowedFlammable"
                    defaultChecked={editingVehicle?.notAllowedFlammable}
                    value="true"
                    className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                  />
                  <Label htmlFor="edit-notAllowedFlammable" className="text-sm font-medium text-gray-700">
                    ممنوع حمل مواد آتش‌زا
                  </Label>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="edit-notes">یادداشت‌ها</Label>
              <textarea
                id="edit-notes"
                name="notes"
                rows={3}
                defaultValue={editingVehicle?.notes}
                placeholder="یادداشت‌های اضافی در مورد خودرو یا راننده..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditReadyVehicleDialogOpen(false)}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={updateReadyVehicleMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateReadyVehicleMutation.isPending ? "در حال به‌روزرسانی..." : "به‌روزرسانی"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enhanced Suitable Vehicles Dialog */}
      <Dialog open={isSuitableVehiclesOpen} onOpenChange={setIsSuitableVehiclesOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-blue-600" />
              خودروهای مناسب برای سفارش {selectedOrderForVehicle?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              تمام خودروهای مناسب که در زمان خرید شناسایی شده‌اند
            </DialogDescription>
          </DialogHeader>

          {suitableVehiclesData && (
            <div className="space-y-6">
              {/* Order Summary */}
              <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    خلاصه سفارش
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">مقصد:</span>
                      <span className="font-medium">{suitableVehiclesData.order?.destinationCity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Weight className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">وزن:</span>
                      <span className="font-medium">{suitableVehiclesData.order?.weight} {suitableVehiclesData.order?.weightUnit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">مسافت:</span>
                      <span className="font-medium">{suitableVehiclesData.order?.distance} کیلومتر</span>
                    </div>
                    {suitableVehiclesData.order?.containsFlammableProducts && (
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">حاوی مواد آتش‌زا</span>
                      </div>
                    )}
                  </div>
                  
                  {suitableVehiclesData.order?.flammableProducts?.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">محصولات آتش‌زا:</h4>
                      <div className="flex flex-wrap gap-2">
                        {suitableVehiclesData.order.flammableProducts.map((product: any, index: number) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            <Flame className="h-3 w-3 mr-1" />
                            {product.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Optimal Vehicle */}
              {suitableVehiclesData.optimalVehicle && (
                <Card className="border-2 border-green-500 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      خودرو بهینه (پیشنهاد اول)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">نام:</span>
                        <p className="font-medium">{suitableVehiclesData.optimalVehicle.name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">نوع:</span>
                        <p className="font-medium">{suitableVehiclesData.optimalVehicle.vehicleType}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">هزینه کل:</span>
                        <p className="font-bold text-green-700">{Math.floor(suitableVehiclesData.optimalVehicle.totalCost).toLocaleString()} IQD</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">ظرفیت:</span>
                        <p className="font-medium">{suitableVehiclesData.optimalVehicle.maxWeightKg} کیلوگرم</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">هزینه مسافت:</span>
                        <p className="font-medium">{Math.floor(suitableVehiclesData.optimalVehicle.distanceCost).toLocaleString()} IQD</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">هزینه وزن:</span>
                        <p className="font-medium">{Math.floor(suitableVehiclesData.optimalVehicle.weightCost).toLocaleString()} IQD</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">بهره‌وری وزن:</span>
                        <p className="font-medium">{suitableVehiclesData.optimalVehicle.weightUtilization}%</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {suitableVehiclesData.optimalVehicle.safetyCompliant ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">{suitableVehiclesData.optimalVehicle.safetyCompliant ? 'مطابق ایمنی' : 'نامطابق ایمنی'}</span>
                      </div>
                    </div>
                    {suitableVehiclesData.optimalVehicle.description && (
                      <div className="mt-3 p-2 bg-white rounded border">
                        <span className="text-sm text-gray-600">توضیحات:</span>
                        <p className="text-sm mt-1">{suitableVehiclesData.optimalVehicle.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Alternative Vehicles */}
              {suitableVehiclesData.alternatives && suitableVehiclesData.alternatives.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowUpDown className="h-5 w-5 text-blue-600" />
                      گزینه‌های جایگزین ({suitableVehiclesData.alternatives.length} گزینه)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {suitableVehiclesData.alternatives.map((vehicle: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg bg-gray-50">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <span className="text-sm text-gray-600">نام:</span>
                              <p className="font-medium">{vehicle.name}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">نوع:</span>
                              <p className="font-medium">{vehicle.vehicleType}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">هزینه کل:</span>
                              <p className="font-bold text-blue-700">{Math.floor(vehicle.totalCost).toLocaleString()} IQD</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">ظرفیت:</span>
                              <p className="font-medium">{vehicle.maxWeightKg} کیلوگرم</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">بهره‌وری وزن:</span>
                              <p className="font-medium">{vehicle.weightUtilization}%</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {vehicle.safetyCompliant ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm">{vehicle.safetyCompliant ? 'مطابق ایمنی' : 'نامطابق ایمنی'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Available Fleet Vehicles Selection */}
              <Card className="border-2 border-orange-500 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5 text-orange-600" />
                    انتخاب از خودروهای آماده ناوگان شرکت
                  </CardTitle>
                  <CardDescription>
                    خودروهایی که نزدیک به انتخاب مشتری هستند و در حال حاضر آماده به کار می‌باشند
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableFleetVehicles && availableFleetVehicles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableFleetVehicles.map((vehicle: any) => (
                        <div 
                          key={vehicle.id} 
                          className={`bg-white rounded-lg p-4 border-2 transition-all duration-300 cursor-pointer hover:shadow-lg ${
                            vehicle.isCheckoutSuggested 
                              ? 'border-green-500 bg-green-50 ring-2 ring-green-200 shadow-lg' 
                              : 'border-orange-300 hover:border-orange-500'
                          }`}
                          onClick={() => {
                            // Handle vehicle selection
                            console.log('انتخاب خودرو آماده:', vehicle);
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className={`font-semibold ${
                              vehicle.isCheckoutSuggested ? 'text-green-800' : 'text-gray-800'
                            }`}>
                              {vehicle.vehicleType || vehicle.vehicleName}
                            </h4>
                            <div className="flex gap-2">
                              {vehicle.isCheckoutSuggested && (
                                <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white animate-pulse">
                                  🎯 پیشنهاد سیستم
                                </Badge>
                              )}
                              <Badge className="bg-green-500 text-white">آماده</Badge>
                            </div>
                          </div>
                          
                          {vehicle.isCheckoutSuggested && (
                            <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                                <CheckCircle className="w-4 h-4" />
                                این خودرو مطابق انتخاب مشتری در سیستم هوشمند است
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">شماره پلاک:</span>
                              <span className="font-medium">{vehicle.licensePlate || vehicle.plateNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">راننده:</span>
                              <span className="font-medium">{vehicle.driverName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">تلفن راننده:</span>
                              <span className="font-medium">{vehicle.driverMobile || vehicle.driverPhone}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">ظرفیت:</span>
                              <span className="font-medium">{vehicle.loadCapacity || vehicle.maxWeight} کیلوگرم</span>
                            </div>
                          </div>
                          
                          <Button 
                            className={`w-full transition-all duration-300 ${
                              vehicle.isCheckoutSuggested 
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg' 
                                : 'bg-orange-600 hover:bg-orange-700'
                            } text-white`}
                            onClick={(e) => {
                              e.stopPropagation();
                              assignVehicleToOrder(
                                vehicle.id, 
                                vehicle.licensePlate || vehicle.plateNumber, 
                                vehicle.driverName, 
                                vehicle.driverMobile || vehicle.driverPhone
                              );
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {vehicle.isCheckoutSuggested ? 'اختصاص خودروی پیشنهادی' : 'اختصاص این خودرو'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-orange-400" />
                      <p className="text-orange-600 mb-2">هیچ خودروی آماده‌ای از ناوگان شرکت در دسترس نیست</p>
                      <p className="text-sm text-gray-500">لطفاً از خودروهای مناسب زیر انتخاب کنید</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Suitable Vehicles */}
              {suitableVehiclesData.suitableVehicles && suitableVehiclesData.suitableVehicles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="h-5 w-5 text-purple-600" />
                      تمام خودروهای مناسب ({suitableVehiclesData.suitableVehicles.length} خودرو)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">ردیف</TableHead>
                            <TableHead className="text-right">نام خودرو</TableHead>
                            <TableHead className="text-right">نوع</TableHead>
                            <TableHead className="text-right">هزینه کل</TableHead>
                            <TableHead className="text-right">ظرفیت</TableHead>
                            <TableHead className="text-right">بهره‌وری</TableHead>
                            <TableHead className="text-right">ایمنی</TableHead>
                            <TableHead className="text-right">انتخاب</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {suitableVehiclesData.suitableVehicles.map((vehicle: any, index: number) => (
                            <TableRow key={index} className={index === 0 ? "bg-green-50" : ""}>
                              <TableCell className="font-medium">
                                {index + 1}
                                {index === 0 && <span className="mr-2 text-green-600 text-xs">(بهینه)</span>}
                              </TableCell>
                              <TableCell className="font-medium">{vehicle.name}</TableCell>
                              <TableCell>{vehicle.vehicleType}</TableCell>
                              <TableCell className="font-bold">
                                {Math.floor(vehicle.totalCost).toLocaleString()} IQD
                              </TableCell>
                              <TableCell>{vehicle.maxWeightKg} کگ</TableCell>
                              <TableCell>{vehicle.weightUtilization}%</TableCell>
                              <TableCell>
                                {vehicle.safetyCompliant ? (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    مطابق
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="bg-red-100 text-red-800">
                                    <X className="h-3 w-3 mr-1" />
                                    نامطابق
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  size="sm" 
                                  variant={index === 0 ? "default" : "outline"}
                                  className={index === 0 ? "bg-green-600 hover:bg-green-700 text-white" : "hover:bg-blue-50"}
                                  onClick={() => {
                                    console.log('انتخاب خودروی مناسب:', vehicle);
                                    // Handle template vehicle selection - create a ready vehicle entry
                                    handleTemplateVehicleSelection(vehicle, index === 0);
                                  }}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {index === 0 ? 'انتخاب بهینه' : 'انتخاب این خودرو'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Selected Vehicles Summary */}
              {availableFleetVehicles && availableFleetVehicles.length > 0 && (
                <Card className="border-2 border-blue-500 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      خودروهای انتخاب شده آماده اختصاص ({availableFleetVehicles.length} خودرو)
                    </CardTitle>
                    <CardDescription>
                      این خودروها از قالب‌های مناسب انتخاب شده و آماده اختصاص به سفارش هستند
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {availableFleetVehicles.slice(0, 6).map((vehicle: any, index: number) => (
                        <div 
                          key={vehicle.id || index} 
                          className={`bg-white rounded-lg p-3 border transition-all duration-300 ${
                            vehicle.isCheckoutSuggested 
                              ? 'border-green-500 bg-green-50 ring-1 ring-green-200' 
                              : 'border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className={`font-medium text-sm ${
                              vehicle.isCheckoutSuggested ? 'text-green-800' : 'text-gray-800'
                            }`}>
                              {vehicle.vehicleType || vehicle.vehicleName}
                            </h5>
                            {vehicle.isCheckoutSuggested && (
                              <Badge className="bg-green-600 text-white text-xs px-1 py-0">
                                🎯 بهینه
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-xs text-gray-600 mb-3">
                            <div className="flex justify-between">
                              <span>پلاک:</span>
                              <span className="font-medium">{vehicle.licensePlate || vehicle.plateNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ظرفیت:</span>
                              <span className="font-medium">{vehicle.loadCapacity || vehicle.maxWeight} کگ</span>
                            </div>
                            {vehicle.totalCost && (
                              <div className="flex justify-between">
                                <span>هزینه:</span>
                                <span className="font-medium text-blue-700">{Math.floor(vehicle.totalCost).toLocaleString()} IQD</span>
                              </div>
                            )}
                          </div>
                          
                          <Button 
                            size="sm" 
                            className={`w-full text-xs ${
                              vehicle.isCheckoutSuggested 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-blue-600 hover:bg-blue-700'
                            } text-white`}
                            onClick={() => assignVehicleToOrder(
                              vehicle.id, 
                              vehicle.licensePlate || vehicle.plateNumber, 
                              vehicle.driverName, 
                              vehicle.driverMobile || vehicle.driverPhone
                            )}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            اختصاص فوری
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {availableFleetVehicles.length > 6 && (
                      <div className="mt-4 text-center">
                        <Badge variant="outline" className="text-blue-600">
                          +{availableFleetVehicles.length - 6} خودروی دیگر در دسترس
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSuitableVehiclesOpen(false)}
            >
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={isOrderDetailsDialogOpen} onOpenChange={setIsOrderDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-right">
              جزئیات سفارش #{selectedOrderForDetails?.orderNumber || selectedOrderForDetails?.customerOrderId}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrderForDetails && (
            <div className="space-y-6" dir="rtl">
              {/* Order Status & Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    اطلاعات سفارش
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">شماره سفارش:</span>
                      <span className="font-medium">{selectedOrderForDetails.orderNumber || selectedOrderForDetails.customerOrderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">وضعیت:</span>
                      <span>{getStatusBadge(selectedOrderForDetails.currentStatus)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">مبلغ کل:</span>
                      <span className="font-medium">{Math.floor(parseFloat(selectedOrderForDetails.totalAmount)).toLocaleString()} {selectedOrderForDetails.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">وزن محموله:</span>
                      <span className="font-medium">{selectedOrderForDetails.calculatedWeight || selectedOrderForDetails.totalWeight || 0} {selectedOrderForDetails.weightUnit || 'کگ'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">روش تحویل:</span>
                      <span className="font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                        {selectedOrderForDetails.deliveryMethod || 'مشخص نشده'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">نوع حمل‌ونقل:</span>
                      <span className="font-medium">{selectedOrderForDetails.transportationType || 'تعیین نشده'}</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    اطلاعات مشتری
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">نام مشتری:</span>
                      <span className="font-medium">
                        {selectedOrderForDetails.customer 
                          ? `${selectedOrderForDetails.customer.firstName || ''} ${selectedOrderForDetails.customer.lastName || ''}`.trim() 
                          : selectedOrderForDetails.customerFirstName && selectedOrderForDetails.customerLastName 
                            ? `${selectedOrderForDetails.customerFirstName} ${selectedOrderForDetails.customerLastName}` 
                            : 'نامشخص'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">تلفن:</span>
                      <span className="font-medium">{selectedOrderForDetails.customer?.phone || selectedOrderForDetails.customerPhone || 'ثبت نشده'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ایمیل:</span>
                      <span className="font-medium">{selectedOrderForDetails.customer?.email || selectedOrderForDetails.customerEmail || 'ثبت نشده'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="border rounded-lg p-4 bg-orange-50">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  اطلاعات تحویل
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">آدرس ارسال:</p>
                    <p className="font-medium">
                      {(() => {
                        const shippingData = selectedOrderForDetails.shippingAddress;
                        if (typeof shippingData === 'object' && shippingData !== null) {
                          return [shippingData.address, shippingData.country].filter(Boolean).join(', ') || 'آدرس ثبت نشده';
                        }
                        return shippingData || selectedOrderForDetails.customerAddress || 'آدرس ثبت نشده';
                      })()}
                    </p>
                  </div>
                  {selectedOrderForDetails.recipientName && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">گیرنده:</p>
                      <p className="font-medium">{selectedOrderForDetails.recipientName}</p>
                      {selectedOrderForDetails.recipientPhone && (
                        <p className="text-sm text-gray-500">{selectedOrderForDetails.recipientPhone}</p>
                      )}
                    </div>
                  )}
                  {selectedOrderForDetails.hasGpsLocation && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">موقعیت جغرافیایی:</p>
                      <p className="text-sm text-green-600">✓ موقعیت GPS ثبت شده</p>
                      <p className="text-xs text-gray-500">
                        Lat: {selectedOrderForDetails.gpsLatitude}, Lng: {selectedOrderForDetails.gpsLongitude}
                      </p>
                    </div>
                  )}
                  {selectedOrderForDetails.deliveryNotes && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">توضیحات تحویل:</p>
                      <p className="font-medium">{selectedOrderForDetails.deliveryNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tracking Information */}
              {(selectedOrderForDetails.trackingNumber || selectedOrderForDetails.deliveryPersonName) && (
                <div className="border rounded-lg p-4 bg-purple-50">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    اطلاعات ردیابی
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedOrderForDetails.trackingNumber && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">کد رهگیری:</p>
                        <p className="font-medium">{selectedOrderForDetails.trackingNumber}</p>
                      </div>
                    )}
                    {selectedOrderForDetails.deliveryPersonName && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">تحویل‌دهنده:</p>
                        <p className="font-medium">{selectedOrderForDetails.deliveryPersonName}</p>
                        {selectedOrderForDetails.deliveryPersonPhone && (
                          <p className="text-sm text-gray-500">{selectedOrderForDetails.deliveryPersonPhone}</p>
                        )}
                      </div>
                    )}
                    {selectedOrderForDetails.estimatedDeliveryDate && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">تاریخ تحویل تقریبی:</p>
                        <p className="font-medium">{new Date(selectedOrderForDetails.estimatedDeliveryDate).toLocaleDateString('fa-IR')}</p>
                      </div>
                    )}
                    {selectedOrderForDetails.actualDeliveryDate && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">تاریخ تحویل واقعی:</p>
                        <p className="font-medium">{new Date(selectedOrderForDetails.actualDeliveryDate).toLocaleDateString('fa-IR')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => handlePrintOrder(selectedOrderForDetails)}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <Printer className="w-4 h-4" />
              چاپ جزئیات
            </Button>
            <Button variant="outline" onClick={() => setIsOrderDetailsDialogOpen(false)}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );


};

export default LogisticsManagement;
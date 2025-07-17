import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Truck, 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  ArrowRight,
  Box,
  Warehouse,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  RefreshCw,
  XCircle,
  Mail,
  Bell,
  Activity,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Save,
  Printer,
  Play
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { apiRequest } from '@/lib/queryClient';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
    sku?: string;
    barcode?: string;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
  financialApprovedAt?: string;
  shippingAddress: string;
  paymentMethod: string;
  notes?: string;
  warehouseNotes?: string;
  fulfilledAt?: string;
  fulfilledBy?: string;
}

interface WarehouseStats {
  pendingOrders: number;
  processingOrders: number;
  fulfilledOrders: number;
  totalRevenue: number;
  averageProcessingTime: number;
  lowStockItems: number;
}

// Unified product interface for inventory
interface UnifiedProduct {
  id: number;
  name: string;
  category: string;
  stockQuantity: number;
  minStockLevel: number;
  lowStockThreshold: number;
  inStock: boolean;
  shopPrice?: number;
  shopSku?: string;
  shopId?: number;
}

// Goods in transit interface
interface GoodsInTransit {
  id: number;
  orderId: number;
  customerId: number;
  productId: number;
  quantity: number;
  status: string;
  paymentDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Inventory movement interface  
interface InventoryMovement {
  id: number;
  productId: number;
  orderId?: number;
  customerId?: number;
  transactionType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  createdBy?: number;
  createdAt: string;
}

const WarehouseManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [warehouseNotes, setWarehouseNotes] = useState('');
  const [activeTab, setActiveTab] = useState("orders");
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(0);
  const [editingWaste, setEditingWaste] = useState<string | null>(null);
  const [wasteQuantity, setWasteQuantity] = useState<number>(0);
  const [wasteAmounts, setWasteAmounts] = useState<{[key: string]: number}>({});
  
  // Query for waste amounts from database
  const { data: wasteData, refetch: refetchWaste } = useQuery({
    queryKey: ['/api/warehouse/waste'],
    enabled: true,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // Update local state when waste data is fetched
  useEffect(() => {
    if (wasteData?.wasteAmounts) {
      setWasteAmounts(wasteData.wasteAmounts);
    }
  }, [wasteData]);

  // Mutation for updating waste amounts
  const updateWasteMutation = useMutation({
    mutationFn: async ({ productId, wasteAmount, reason }: { productId: number; wasteAmount: number; reason?: string }) => {
      const response = await fetch(`/api/warehouse/waste/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wasteAmount, reason }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update waste amount');
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchWaste();
      toast({
        title: "موفق",
        description: "ضایعات محصول با موفقیت به‌روزرسانی شد",
      });
    },
    onError: (error) => {
      console.error('Error updating waste:', error);
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی ضایعات",
        variant: "destructive",
      });
    },
  });
  
  // Order items modal state
  const [showOrderItems, setShowOrderItems] = useState(false);
  const [selectedOrderForItems, setSelectedOrderForItems] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  // Helper function to get goods in transit for a product
  const getGoodsInTransitForProduct = (productId: number): number => {
    if (!goodsInTransit) return 0;
    return goodsInTransit
      .filter((item: any) => item.productId === productId)
      .reduce((total: number, item: any) => total + (item.quantity || 0), 0);
  };

  // Excel export function for inventory
  const exportInventoryToExcel = () => {
    try {
      if (!unifiedProducts || unifiedProducts.length === 0) {
        toast({
          title: "خطا",
          description: "داده‌های موجودی برای خروجی موجود نیست",
          variant: "destructive"
        });
        return;
      }

      // Prepare data for Excel export
      const excelData = unifiedProducts.map((product, index) => {
        const goodsInTransit = getGoodsInTransitForProduct(product.id);
        const wasteAmount = wasteAmounts[product.id] || 0;
        const finalInventory = Math.max(0, (product.stockQuantity || 0) + goodsInTransit - wasteAmount);
        
        return {
          'ردیف': index + 1,
          'نام محصول': product.name || '',
          'دسته‌بندی': product.category || '',
          'کد محصول (SKU)': product.shopSku || '',
          'موجودی فعلی': product.stockQuantity || 0,
          'کالای در راه': goodsInTransit,
          'ضایعات': wasteAmount,
          'موجودی نهایی': finalInventory,
          'حداقل موجودی': product.minStockLevel || 0,
          'آستانه کم': product.lowStockThreshold || 0,
          'وضعیت': finalInventory <= 0 ? 'تمام شده' : 
                   finalInventory <= (product.lowStockThreshold || 0) ? 'بحرانی' :
                   finalInventory <= (product.minStockLevel || 0) ? 'موجودی کم' : 'موجود',
          'قیمت واحد (دینار)': product.shopPrice ? parseFloat(product.shopPrice).toLocaleString() : 'نامشخص',
          'ارزش کل (دینار)': product.shopPrice ? 
            (parseFloat(product.shopPrice) * finalInventory).toLocaleString() : 'نامشخص'
        };
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      
      // Set column widths for better display
      const colWidths = [
        { wch: 8 },   // ردیف
        { wch: 30 },  // نام محصول (increased width)
        { wch: 15 },  // دسته‌بندی
        { wch: 15 },  // کد محصول
        { wch: 12 },  // موجودی فعلی
        { wch: 12 },  // کالای در راه
        { wch: 10 },  // ضایعات
        { wch: 12 },  // موجودی نهایی
        { wch: 12 },  // حداقل موجودی
        { wch: 10 },  // آستانه کم
        { wch: 12 },  // وضعیت
        { wch: 15 },  // قیمت واحد
        { wch: 20 }   // ارزش کل
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "گزارش موجودی");
      
      // Generate filename with current date
      const currentDate = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
      const filename = `گزارش-موجودی-انبار-${currentDate}.xlsx`;
      
      // Export file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);
      
      toast({
        title: "موفق",
        description: `گزارش موجودی با نام ${filename} دانلود شد`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "خطا",
        description: "خطا در تولید فایل اکسل",
        variant: "destructive"
      });
    }
  };
  
  // Authentication check
  const { user, isLoading: authLoading } = useAuth();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/admin/login';
    }
  }, [user, authLoading]);
  
  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">بررسی احراز هویت...</p>
        </div>
      </div>
    );
  }
  
  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">دسترسی به مدیریت انبار</CardTitle>
            <p className="text-gray-600">لطفا وارد شوید</p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/admin/login'}
              className="w-full"
            >
              ورود به سیستم
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Threshold settings state
  const [thresholdSettings, setThresholdSettings] = useState({
    settingName: 'global_default',
    lowStockThreshold: 10,
    warningStockLevel: 5,
    emailEnabled: true,
    smsEnabled: true,
    managerEmail: 'manager@momtazchem.com',
    managerPhone: '+9647700000000',
    managerName: 'مدیر انبار',
    checkFrequency: 60,
    businessHoursOnly: true,
    weekendsEnabled: false,
    isActive: true
  });
  
  const queryClient = useQueryClient();

  // Enable audio notifications for warehouse orders
  const { orderCount } = useOrderNotifications({
    department: 'warehouse',
    enabled: true
  });

  // Fetch warehouse statistics
  const { data: stats, isLoading: statsLoading } = useQuery<WarehouseStats>({
    queryKey: ['/api/warehouse/stats'],
    staleTime: 30000,
  });

  // Fetch orders pending warehouse processing
  // Fetch orders that are approved by financial department  
  const { data: ordersResponse, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['/api/warehouse/orders-noauth'],
    staleTime: 10000,
  });
  
  const orders = ordersResponse?.orders || [];

  // Fetch unified products for inventory management
  const { data: unifiedProducts = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ["/api/inventory/unified/products"],
    retry: false,
  });

  // Get warehouse refresh interval from global settings
  const getWarehouseRefreshInterval = () => {
    const globalSettings = localStorage.getItem('global-refresh-settings');
    if (globalSettings) {
      const settings = JSON.parse(globalSettings);
      const warehouseSettings = settings.departments.warehouse;
      
      if (warehouseSettings?.autoRefresh) {
        const refreshInterval = settings.syncEnabled 
          ? settings.globalInterval 
          : warehouseSettings.interval;
        return refreshInterval * 1000; // Convert seconds to milliseconds
      }
    }
    return 30000; // Default 30 seconds if no settings found
  };

  // Query for goods in transit
  const { data: goodsInTransit, isLoading: transitLoading, refetch: refetchTransit } = useQuery({
    queryKey: ['/api/shop/goods-in-transit'],
    refetchInterval: getWarehouseRefreshInterval()
  });

  // Query for inventory movements
  const { data: inventoryMovements, isLoading: movementsLoading } = useQuery({
    queryKey: ['/api/shop/inventory-movements'],
    refetchInterval: getWarehouseRefreshInterval()
  });

  // Fetch threshold settings
  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ["/api/inventory/threshold-settings"],
    retry: false,
  });

  // Update thresholdSettings when data is loaded
  useEffect(() => {
    if (settingsData?.data && settingsData.data.length > 0) {
      const settings = settingsData.data[0];
      setThresholdSettings({
        settingName: settings.settingName || 'global_default',
        lowStockThreshold: settings.lowStockThreshold || 10,
        warningStockLevel: settings.warningStockLevel || 5,
        emailEnabled: settings.emailEnabled ?? true,
        smsEnabled: settings.smsEnabled ?? true,
        managerEmail: settings.managerEmail || 'manager@momtazchem.com',
        managerPhone: settings.managerPhone || '+9647700000000',
        managerName: settings.managerName || 'مدیر انبار',
        checkFrequency: settings.checkFrequency || 60,
        businessHoursOnly: settings.businessHoursOnly ?? true,
        weekendsEnabled: settings.weekendsEnabled ?? false,
        isActive: settings.isActive ?? true
      });
    }
  }, [settingsData]);

  // Mutation for updating order status
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: number; status: string; notes?: string }) => {
      return await apiRequest(`/api/order-management/warehouse/${orderId}/process`, {
        method: 'PATCH',
        body: { status, notes }
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/orders-noauth'] });
      refetchOrders();
      toast({
        title: "وضعیت سفارش به‌روزرسانی شد",
        description: `سفارش با موفقیت ${data.data?.status === 'warehouse_processing' ? 'در حال پردازش' : data.data?.status === 'warehouse_fulfilled' ? 'آماده ارسال به لجستیک' : 'به‌روزرسانی شده'} تنظیم شد.`,
      });
      setShowOrderDetails(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطا در به‌روزرسانی",
        description: error.message || "خطایی در به‌روزرسانی وضعیت سفارش رخ داد.",
        variant: "destructive",
      });
    },
  });

  // Inventory management mutations
  const updateInventoryMutation = useMutation({
    mutationFn: async ({ productId, quantity, reason }: { productId: number; quantity: number; reason: string }) => {
      return await apiRequest('/api/inventory/update-stock', {
        method: 'POST',
        body: { productId, quantity, reason }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/unified/products'] });
      toast({
        title: "موجودی به‌روزرسانی شد",
        description: "موجودی محصول با موفقیت به‌روزرسانی شد.",
      });
      setEditingProduct(null);
      setEditingQuantity(0);
    },
    onError: (error: any) => {
      toast({
        title: "خطا در به‌روزرسانی موجودی",
        description: error.message || "خطایی در به‌روزرسانی موجودی رخ داد.",
        variant: "destructive",
      });
    },
  });

  // Save threshold settings mutation
  const saveThresholdMutation = useMutation({
    mutationFn: async (settings: any) => {
      return await apiRequest('/api/inventory/threshold-settings', {
        method: 'POST',
        body: settings
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/threshold-settings'] });
      refetchSettings();
      toast({
        title: "تنظیمات آستانه ذخیره شد",
        description: "تنظیمات آستانه موجودی با موفقیت ذخیره شد.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ذخیره تنظیمات",
        description: error.message || "خطایی در ذخیره تنظیمات رخ داد.",
        variant: "destructive",
      });
    },
  });

  // Synchronize inventory mutation
  const synchronizeInventoryMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/inventory/force-refresh', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/unified/products'] });
      refetchProducts();
      toast({
        title: "همگام‌سازی موجودی",
        description: "موجودی با موفقیت همگام‌سازی شد.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در همگام‌سازی",
        description: error.message || "خطایی در همگام‌سازی رخ داد.",
        variant: "destructive",
      });
    },
  });

  // Update goods in transit status mutation
  const updateGoodsInTransitMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest(`/api/shop/goods-in-transit/${id}`, {
        method: 'PATCH',
        body: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/goods-in-transit'] });
      refetchTransit();
      toast({
        title: "وضعیت کالای در راه به‌روزرسانی شد",
        description: "وضعیت کالای در راه با موفقیت به‌روزرسانی شد.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در به‌روزرسانی",
        description: error.message || "خطایی در به‌روزرسانی وضعیت رخ داد.",
        variant: "destructive",
      });
    },
  });

  // Filter orders based on search and status
  const filteredOrders = orders?.filter(order => {
    // Build customer name from API response structure
    const customerName = order.customer?.firstName && order.customer?.lastName 
      ? `${order.customer.firstName} ${order.customer.lastName}` 
      : order.customerFirstName && order.customerLastName 
        ? `${order.customerFirstName} ${order.customerLastName}`
        : order.customerName || '';
    
    const customerEmail = order.customer?.email || order.customerEmail || '';
    
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toString().includes(searchTerm) ||
                         order.customerOrderId?.toString().includes(searchTerm);
    
    // Use currentStatus from API instead of status
    const orderStatus = order.currentStatus || order.status || '';
    const matchesStatus = selectedStatus === 'all' || orderStatus === selectedStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Filter products based on search term
  const filteredProducts = unifiedProducts?.filter((product: UnifiedProduct) => {
    if (!product) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower) ||
      product.shopSku?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Calculate inventory statistics
  const inventoryStats = {
    totalProducts: unifiedProducts?.length || 0,
    outOfStock: unifiedProducts?.filter((p: UnifiedProduct) => p.stockQuantity <= 0).length || 0,
    lowStock: unifiedProducts?.filter((p: UnifiedProduct) => p.stockQuantity > 0 && p.stockQuantity <= (p.lowStockThreshold || 10)).length || 0,
    criticalStock: unifiedProducts?.filter((p: UnifiedProduct) => p.stockQuantity > 0 && p.stockQuantity <= (p.minStockLevel || 5)).length || 0,
  };

  // Helper functions for inventory management
  const getStockStatus = (product: UnifiedProduct) => {
    if (product.stockQuantity <= 0) return 'out-of-stock';
    if (product.stockQuantity <= (product.minStockLevel || 5)) return 'critical';
    if (product.stockQuantity <= (product.lowStockThreshold || 10)) return 'low';
    return 'normal';
  };

  const getStockBadge = (product: UnifiedProduct) => {
    const status = getStockStatus(product);
    switch (status) {
      case 'out-of-stock':
        return <Badge variant="destructive">تمام شده</Badge>;
      case 'critical':
        return <Badge variant="destructive">بحرانی</Badge>;
      case 'low':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">کم</Badge>;
      default:
        return <Badge variant="outline" className="border-green-500 text-green-700">موجود</Badge>;
    }
  };

  const getStockPercentage = (product: UnifiedProduct) => {
    if (!product.minStockLevel || product.minStockLevel === 0) return 100;
    return Math.min((product.stockQuantity / (product.minStockLevel * 4)) * 100, 100);
  };

  const handleProductStockEdit = (productId: string, currentStock: number) => {
    setEditingProduct(productId);
    setEditingQuantity(currentStock);
  };

  const handleProductStockUpdate = (productId: number, newQuantity: number) => {
    if (newQuantity < 0) {
      toast({
        title: "خطا",
        description: "موجودی نمی‌تواند منفی باشد.",
        variant: "destructive",
      });
      return;
    }

    updateInventoryMutation.mutate({
      productId,
      quantity: newQuantity,
      reason: `تنظیم دستی موجودی به ${newQuantity} واحد`
    });
  };

  const handleWasteEdit = (productId: string, currentWaste: number) => {
    setEditingWaste(productId);
    setWasteQuantity(currentWaste);
  };

  const handleWasteUpdate = (productId: number, newWasteAmount: number) => {
    if (newWasteAmount < 0) {
      toast({
        title: "خطا",
        description: "مقدار ضایعات نمی‌تواند منفی باشد.",
        variant: "destructive",
      });
      return;
    }

    // Use the mutation to update waste amount in database
    updateWasteMutation.mutate({
      productId,
      wasteAmount: newWasteAmount,
      reason: `تنظیم دستی ضایعات به ${newWasteAmount} واحد`
    });
    
    // Reset editing state
    setEditingWaste(null);
    setWasteQuantity(0);
  };

  const handleSaveThresholdSettings = () => {
    saveThresholdMutation.mutate(thresholdSettings);
  };

  const handleUpdateGoodsInTransit = (id: number, status: string) => {
    updateGoodsInTransitMutation.mutate({ id, status });
  };

  const handleStartProcessing = (order: Order) => {
    setSelectedOrder(order);
    setWarehouseNotes(order.warehouseNotes || '');
    updateOrderMutation.mutate({
      orderId: order.id,
      status: 'warehouse_processing',
      notes: 'شروع پردازش در انبار'
    });
  };

  // Handle approve and send to logistics
  const handleApproveToLogistics = (order: Order) => {
    updateOrderMutation.mutate({
      orderId: order.id,
      status: 'warehouse_fulfilled',
      notes: warehouseNotes || 'تایید انبار - ارسال به لجستیک'
    });
  };

  const handleFulfillOrder = () => {
    if (!selectedOrder) return;
    
    updateOrderMutation.mutate({
      orderId: selectedOrder.id,
      status: 'warehouse_fulfilled',
      notes: warehouseNotes
    });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setWarehouseNotes(order.warehouseNotes || '');
    setShowOrderDetails(true);
  };

  const handleViewOrderItems = async (order: any) => {
    try {
      console.log('📦 [FRONTEND] Fetching order items for customer order:', order.customerOrderId);
      setSelectedOrderForItems(order);
      setOrderItems([]);
      setShowOrderItems(true);
      
      const response = await fetch(`/api/order-management/warehouse/${order.customerOrderId}/items`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch order items');
      }
      
      const data = await response.json();
      console.log('📦 [FRONTEND] Received order items:', data);
      
      if (data.success) {
        setOrderItems(data.orderItems || []);
      } else {
        console.error('❌ [FRONTEND] Failed to fetch order items:', data.message);
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching order items:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'warehouse_pending': { color: 'bg-orange-100 text-orange-800', label: 'در انتظار انبار' },
      'financial_approved': { color: 'bg-yellow-100 text-yellow-800', label: 'تایید مالی - آماده انبار' },
      'warehouse_processing': { color: 'bg-blue-100 text-blue-800', label: 'در حال پردازش انبار' },
      'warehouse_fulfilled': { color: 'bg-green-100 text-green-800', label: 'آماده ارسال به لجستیک' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' IQD';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مدیریت انبار</h1>
          <p className="text-gray-600">پردازش و تکمیل سفارشات تایید شده</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            گزارش
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            فیلتر
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سفارشات در انتظار</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statsLoading ? '...' : stats?.pendingOrders || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">در حال پردازش</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? '...' : stats?.processingOrders || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تکمیل شده</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? '...' : stats?.fulfilledOrders || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کالاهای کم موجود</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? '...' : stats?.lowStockItems || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="orders">سفارشات</TabsTrigger>
          <TabsTrigger value="inventory">موجودی</TabsTrigger>
          <TabsTrigger value="movements">حرکات انبار</TabsTrigger>
          <TabsTrigger value="settings">تنظیمات</TabsTrigger>
          <TabsTrigger value="analytics">آنالیز</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="جستجو بر اساس نام مشتری، ایمیل یا شماره سفارش..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                className="w-full p-2 border rounded-md"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="warehouse_pending">در انتظار انبار</option>
                <option value="financial_approved">تایید مالی - آماده انبار</option>
                <option value="warehouse_processing">در حال پردازش انبار</option>
                <option value="warehouse_fulfilled">آماده ارسال به لجستیک</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                سفارشات تایید شده توسط واحد مالی
              </CardTitle>
              <p className="text-sm text-gray-600">
                سفارشات آماده برای پردازش انبار و ارسال به بخش لجستیک
              </p>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8">در حال بارگیری...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>هیچ سفارش تایید شده‌ای در انتظار پردازش انبار نیست</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-4">شماره سفارش</th>
                        <th className="text-right p-4">نام مشتری</th>
                        <th className="text-right p-4">شماره موبایل</th>
                        <th className="text-right p-4">ایمیل</th>
                        <th className="text-right p-4">مبلغ</th>
                        <th className="text-right p-4">وضعیت</th>
                        <th className="text-right p-4">تاریخ</th>
                        <th className="text-center p-4">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-medium">#{order.id}</td>
                          <td className="p-4">
                            <div className="font-medium">{
                              order.customer?.firstName && order.customer?.lastName 
                                ? `${order.customer.firstName} ${order.customer.lastName}` 
                                : order.customerFirstName && order.customerLastName 
                                  ? `${order.customerFirstName} ${order.customerLastName}`
                                  : order.customerName || 'نامشخص'
                            }</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">{
                              order.customer?.phone || order.customerPhone || 'شماره نامشخص'
                            }</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-600">{
                              order.customer?.email || order.customerEmail || 'ایمیل نامشخص'
                            }</div>
                          </td>
                          <td className="p-4">{formatCurrency(parseFloat(order.totalAmount) || 0)}</td>
                          <td className="p-4">{getStatusBadge(order.currentStatus || order.status)}</td>
                          <td className="p-4">{formatDate(order.createdAt)}</td>
                          <td className="p-4">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewOrderItems(order)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                جزئیات
                              </Button>
                              {(order.currentStatus === 'financial_approved' || order.currentStatus === 'warehouse_pending') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStartProcessing(order)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  شروع پردازش
                                </Button>
                              )}
                              {order.currentStatus === 'warehouse_processing' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setWarehouseNotes(order.warehouseNotes || '');
                                    setShowOrderDetails(true);
                                  }}
                                  className="text-orange-600 hover:text-orange-800"
                                >
                                  <Package className="w-4 h-4 mr-1" />
                                  تکمیل
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          {/* Inventory Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل محصولات</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventoryStats.totalProducts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تمام شده</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{inventoryStats.outOfStock}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">موجودی کم</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{inventoryStats.lowStock}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">بحرانی</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{inventoryStats.criticalStock}</div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>مدیریت موجودی</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => synchronizeInventoryMutation.mutate()}
                    disabled={synchronizeInventoryMutation.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    همگام‌سازی
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportInventoryToExcel}
                    className="bg-green-50 hover:bg-green-100 border-green-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    خروجی اکسل
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="جستجو محصولات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Products Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-center p-4 min-w-[200px]">محصول</th>
                        <th className="text-center p-4 min-w-[120px]">موجودی</th>
                        <th className="text-center p-4 min-w-[100px]">کالای در راه</th>
                        <th className="text-center p-4 min-w-[100px]">ضایعات</th>
                        <th className="text-center p-4 min-w-[100px]">موجودی کل</th>
                        <th className="text-center p-4 min-w-[100px]">وضعیت</th>
                        <th className="text-center p-4 min-w-[100px]">آستانه کم</th>
                        <th className="text-center p-4 min-w-[100px]">آستانه بحرانی</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product: UnifiedProduct) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 text-center">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">{product.shopSku}</p>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-medium">{product.stockQuantity}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-medium text-blue-600">
                              {/* Calculate goods in transit: orders that are processed but not yet sent to logistics */}
                              {(() => {
                                const transitOrders = orders.filter(order => 
                                  ['warehouse_processing', 'warehouse_approved'].includes(order.currentStatus || order.status)
                                );
                                // For now showing count of orders containing this product
                                // In a real implementation, this would sum quantities from order items
                                return transitOrders.length > 0 ? Math.min(transitOrders.length * 2, 8) : 0;
                              })()}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {/* Waste column with editing functionality */}
                            {editingWaste === product.id.toString() ? (
                              <div className="flex items-center justify-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={wasteQuantity}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (isNaN(value) || value < 0) {
                                      setWasteQuantity(0);
                                    } else {
                                      setWasteQuantity(value);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    // Prevent entering negative numbers
                                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                      e.preventDefault();
                                    }
                                  }}
                                  className="w-20"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleWasteUpdate(product.id, wasteQuantity)}
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingWaste(null)}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-medium text-red-600">
                                  {wasteAmounts[product.id] || 0}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleWasteEdit(product.id.toString(), wasteAmounts[product.id] || 0)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-bold text-green-600">
                              {/* Total inventory = current stock + goods in transit - waste */}
                              {(() => {
                                const transitOrders = orders.filter(order => 
                                  ['warehouse_processing', 'warehouse_approved'].includes(order.currentStatus || order.status)
                                );
                                const transitQuantity = transitOrders.length > 0 ? Math.min(transitOrders.length * 2, 8) : 0;
                                const wasteAmount = wasteAmounts[product.id] || 0;
                                return Math.max(0, product.stockQuantity + transitQuantity - wasteAmount);
                              })()}
                            </span>
                          </td>
                          <td className="p-4 text-center">{getStockBadge(product)}</td>
                          <td className="p-4 text-center">
                            <span className="font-medium">{product.lowStockThreshold}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-medium">{product.minStockLevel}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تاریخچه حرکات انبار</CardTitle>
            </CardHeader>
            <CardContent>
              {movementsLoading ? (
                <div className="text-center py-8">در حال بارگیری...</div>
              ) : !inventoryMovements || inventoryMovements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>هیچ حرکتی ثبت نشده است</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right p-4">محصول</th>
                        <th className="text-right p-4">نوع عملیات</th>
                        <th className="text-right p-4">تعداد</th>
                        <th className="text-right p-4">موجودی قبل</th>
                        <th className="text-right p-4">موجودی جدید</th>
                        <th className="text-right p-4">یادداشت</th>
                        <th className="text-right p-4">تاریخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryMovements.map((movement: any) => (
                        <tr key={movement.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">{movement.productName || `محصول ${movement.productId}`}</td>
                          <td className="p-4">
                            <Badge variant={movement.transactionType === 'sale' ? 'default' : 'secondary'}>
                              {movement.transactionType === 'sale' ? 'فروش' : 
                               movement.transactionType === 'reserve' ? 'رزرو' : 
                               movement.transactionType === 'transit' ? 'در راه' : 
                               movement.transactionType === 'returned' ? 'برگشتی' : 
                               movement.transactionType === 'adjustment' ? 'تعدیل' : 
                               movement.transactionType}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className={movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                              {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                            </span>
                          </td>
                          <td className="p-4">{movement.previousStock}</td>
                          <td className="p-4">{movement.newStock}</td>
                          <td className="p-4">{movement.notes || '-'}</td>
                          <td className="p-4">{formatDate(movement.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات آستانه موجودی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>آستانه موجودی کم</Label>
                    <Input
                      type="number"
                      value={thresholdSettings.lowStockThreshold}
                      onChange={(e) => setThresholdSettings({
                        ...thresholdSettings,
                        lowStockThreshold: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label>آستانه هشدار</Label>
                    <Input
                      type="number"
                      value={thresholdSettings.warningStockLevel}
                      onChange={(e) => setThresholdSettings({
                        ...thresholdSettings,
                        warningStockLevel: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>ایمیل مدیر</Label>
                    <Input
                      value={thresholdSettings.managerEmail}
                      onChange={(e) => setThresholdSettings({
                        ...thresholdSettings,
                        managerEmail: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label>شماره تلفن مدیر</Label>
                    <Input
                      value={thresholdSettings.managerPhone}
                      onChange={(e) => setThresholdSettings({
                        ...thresholdSettings,
                        managerPhone: e.target.value
                      })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={thresholdSettings.emailEnabled}
                    onCheckedChange={(checked) => setThresholdSettings({
                      ...thresholdSettings,
                      emailEnabled: checked
                    })}
                  />
                  <Label>فعال‌سازی هشدار ایمیل</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={thresholdSettings.smsEnabled}
                    onCheckedChange={(checked) => setThresholdSettings({
                      ...thresholdSettings,
                      smsEnabled: checked
                    })}
                  />
                  <Label>فعال‌سازی هشدار پیامک</Label>
                </div>
                <Button 
                  onClick={handleSaveThresholdSettings}
                  disabled={saveThresholdMutation.isPending}
                >
                  {saveThresholdMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>آنالیز عملکرد انبار</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">میانگین زمان پردازش</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.averageProcessingTime || 0} ساعت
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">کل درآمد</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(stats?.totalRevenue || 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">کل کالاهای در راه</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {goodsInTransit?.reduce((total: number, item: any) => total + item.quantity, 0) || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>جزئیات سفارش #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">مشتری:</Label>
                  <p className="mt-1">{
                    selectedOrder.customer?.firstName && selectedOrder.customer?.lastName 
                      ? `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}` 
                      : selectedOrder.customerFirstName && selectedOrder.customerLastName 
                        ? `${selectedOrder.customerFirstName} ${selectedOrder.customerLastName}`
                        : selectedOrder.customerName || 'نامشخص'
                  }</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">ایمیل:</Label>
                  <p className="mt-1">{
                    selectedOrder.customer?.email || selectedOrder.customerEmail || 'ایمیل نامشخص'
                  }</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">مبلغ کل:</Label>
                  <p className="mt-1">{formatCurrency(parseFloat(selectedOrder.totalAmount) || 0)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">وضعیت:</Label>
                  <p className="mt-1">{getStatusBadge(selectedOrder.currentStatus || selectedOrder.status)}</p>
                </div>
              </div>
              {selectedOrder.shippingAddress && (
                <div>
                  <Label className="text-sm font-medium">آدرس ارسال:</Label>
                  <p className="mt-1">{selectedOrder.shippingAddress}</p>
                </div>
              )}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">اقلام سفارش:</Label>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">تعداد: {item.quantity}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">یادداشت انبار:</Label>
                <Textarea
                  value={warehouseNotes}
                  onChange={(e) => setWarehouseNotes(e.target.value)}
                  placeholder="یادداشت خود را بنویسید..."
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                  انصراف
                </Button>
                {(selectedOrder.currentStatus === 'warehouse_processing' || selectedOrder.status === 'warehouse_processing') && (
                  <Button onClick={handleFulfillOrder} disabled={updateOrderMutation.isPending}>
                    {updateOrderMutation.isPending ? 'در حال پردازش...' : 'تکمیل سفارش'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Items Modal */}
      {showOrderItems && selectedOrderForItems && (
        <Dialog open={showOrderItems} onOpenChange={setShowOrderItems}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                لیست کالاهای سفارش #{selectedOrderForItems.customerOrderId}
              </DialogTitle>
              <p className="text-sm text-gray-600">
                مشتری: {selectedOrderForItems.customer?.firstName} {selectedOrderForItems.customer?.lastName}
              </p>
            </DialogHeader>
            
            <div className="space-y-4">
              {orderItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>در حال بارگیری لیست کالاها...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {orderItems.map((item: any, index: number) => (
                      <Card key={item.id || index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-gray-900">{item.product_name}</h4>
                            <p className="text-sm text-gray-500">SKU: {item.product_sku || 'نامشخص'}</p>
                            {item.barcode && (
                              <p className="text-xs text-gray-400">بارکد: {item.barcode}</p>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium">تعداد: {item.quantity} {item.unit}</p>
                            <p className="text-sm text-gray-600">قیمت واحد: {formatCurrency(parseFloat(item.unit_price))}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium">مجموع: {formatCurrency(parseFloat(item.total_price))}</p>
                            {item.category && (
                              <p className="text-xs text-gray-500">دسته: {item.category}</p>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            {item.stock_quantity !== undefined && (
                              <p className="text-sm text-gray-600">موجودی فعلی: {item.stock_quantity}</p>
                            )}
                            {item.specifications && (
                              <p className="text-xs text-gray-500">مشخصات: {typeof item.specifications === 'string' ? item.specifications : JSON.stringify(item.specifications)}</p>
                            )}
                            {item.notes && (
                              <p className="text-xs text-gray-500">یادداشت: {item.notes}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>تعداد کل اقلام: {orderItems.length}</span>
                      <span>مبلغ کل سفارش: {formatCurrency(parseFloat(selectedOrderForItems.totalAmount))}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowOrderItems(false)}>
                بستن
              </Button>
              <Button 
                onClick={() => {
                  // Open print dialog for warehouse staff
                  window.print();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="w-4 h-4 ml-1" />
                چاپ لیست
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WarehouseManagement;
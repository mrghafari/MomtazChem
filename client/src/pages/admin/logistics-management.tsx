import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
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
  Printer
} from 'lucide-react';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

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
  
  const logisticsOrders = logisticsOrdersResponse?.orders || [];
  
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
    customerAddress: order.customerAddress || 'آدرس ثبت نشده'
  }));

  const { data: companiesResponse, isLoading: loadingCompanies } = useQuery({
    queryKey: ['/api/logistics/companies'],
    enabled: activeTab === 'companies'
  });

  // Iraqi provinces and cities data
  const { data: provincesResponse, isLoading: loadingProvinces } = useQuery({
    queryKey: ['/api/logistics/provinces'],
    enabled: activeTab === 'cities' || activeTab === 'shipping'
  });

  const { data: citiesResponse, isLoading: loadingCities } = useQuery({
    queryKey: ['/api/logistics/cities'],
    enabled: activeTab === 'cities' || activeTab === 'shipping'
  });

  const { data: shippingRatesResponse, isLoading: loadingShippingRates } = useQuery({
    queryKey: ['/api/logistics/shipping-rates'],
    enabled: activeTab === 'shipping'
  });

  const companies = companiesResponse?.data || [];

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

  // Show order details in modal
  const handleShowOrderDetails = (order: LogisticsOrder) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
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
                <span class="value">${selectedOrder.shippingAddress.name}</span>
              </div>
              <div class="info-item">
                <span class="label">تلفن گیرنده:</span>
                <span class="value" style="font-size: 20px; font-weight: bold; color: #2563eb;">${selectedOrder.shippingAddress.phone}</span>
              </div>
              <div class="info-item" style="grid-column: 1 / -1;">
                <span class="label">آدرس کامل:</span>
                <span class="value" style="font-size: 18px; font-weight: bold; color: #059669; line-height: 1.5;">${selectedOrder.shippingAddress.address}</span>
              </div>
              <div class="info-item">
                <span class="label">شهر:</span>
                <span class="value">${selectedOrder.shippingAddress.city}</span>
              </div>
              <div class="info-item">
                <span class="label">کد پستی:</span>
                <span class="value">${selectedOrder.shippingAddress.postalCode}</span>
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

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
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
                                  {shippingData.name}
                                </p>
                                <p className="text-xs text-orange-600 flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {shippingData.phone}
                                </p>
                                <p className="text-sm text-orange-700">
                                  {shippingData.address}
                                </p>
                                <p className="text-xs text-orange-600">
                                  {shippingData.city} - {shippingData.postalCode}
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
                  <div className="flex gap-2 flex-wrap">
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
    const provinces = provincesResponse?.provinces || [];
    const cities = citiesResponse?.cities || [];

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
    const shippingRates = shippingRatesResponse?.data || [];

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
          <TabsTrigger value="cities">شهرهای عراق</TabsTrigger>
          <TabsTrigger value="shipping">نرخ‌های حمل</TabsTrigger>
          <TabsTrigger value="vehicles">وسایل نقلیه</TabsTrigger>
          <TabsTrigger value="analytics">آنالیتیک</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>

        <TabsContent value="companies">
          <CompaniesTab />
        </TabsContent>

        <TabsContent value="cities">
          <CitiesTab />
        </TabsContent>

        <TabsContent value="shipping">
          <ShippingRatesTab />
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardContent className="p-6 text-center">
              <Truck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">مدیریت وسایل نقلیه در دست توسعه است</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">آنالیتیک لجستیک در دست توسعه است</p>
            </CardContent>
          </Card>
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
                      <p className="font-medium">{selectedOrder.shippingAddress.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">تلفن گیرنده</Label>
                      <p className="font-medium flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-green-600" />
                        {selectedOrder.shippingAddress.phone}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm text-gray-600">آدرس کامل</Label>
                      <p className="font-medium">{selectedOrder.shippingAddress.address}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">شهر</Label>
                      <p className="font-medium">{selectedOrder.shippingAddress.city}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">کد پستی</Label>
                      <p className="font-medium">{selectedOrder.shippingAddress.postalCode}</p>
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
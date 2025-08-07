import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Search, Filter, ArrowLeft, FileText, Clock, CheckCircle, XCircle, Plus, Edit3, Trash2, Download, Upload, RefreshCw, AlertTriangle, Calendar, Users, TrendingUp, TrendingDown, Eye, BarChart3, Package2, Truck, Weight, Calculator, FileSpreadsheet, ChevronRight, ChevronLeft, Printer } from 'lucide-react';
// CRITICAL: Removed ALL Dialog imports and toast to eliminate React Portal removeChild errors
// Using SafeModal instead - NO PORTALS, NO REMOVECHILD ERRORS
import SafeModal from '@/components/SafeModal';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import PaymentMethodBadge from '@/components/PaymentMethodBadge';

interface Order {
  id: number;
  customerOrderId: number;
  orderNumber?: string;
  currentStatus: string;
  status: string;
  deliveryCode: string | null;
  totalAmount: string;
  currency: string;
  paymentMethod?: string;
  totalWeight: string | null;
  weightUnit: string;
  deliveryMethod: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerName?: string;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  receipt?: {
    url: string;
    fileName: string;
    mimeType: string;
  };
  receiptUrl?: string;
  receiptFileName?: string;
  receiptMimeType?: string;
  createdAt: string;
  updatedAt: string;
  warehouseProcessedAt?: string;
  warehouseNotes?: string;
  financialReviewedAt?: string;
  financialNotes?: string;
  quantity: number;
  paymentDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  trackingNumber?: string;
  notes?: string;
}

const WarehouseManagementFixed: React.FC = () => {
  // All state declarations at the top
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [warehouseNotes, setWarehouseNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  // Print function for order details
  const handlePrintOrder = () => {
    if (!orderDetails) return;
    
    const formatCurrencyForPrint = (amount: number) => {
      return new Intl.NumberFormat('fa-IR', {
        style: 'currency',
        currency: 'IQD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount).replace('IQD', 'دینار عراقی');
    };

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>جزئیات سفارش ${orderDetails.orderNumber || `#${selectedOrder?.customerOrderId}`}</title>
        <style>
          body { font-family: 'Tahoma', sans-serif; margin: 20px; direction: rtl; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .company-logo { max-width: 150px; height: auto; margin-bottom: 10px; }
          .company-name { font-size: 24px; font-weight: bold; color: #1a365d; }
          .order-title { font-size: 18px; margin-top: 10px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
          .info-item { border: 1px solid #ddd; padding: 10px; border-radius: 4px; }
          .info-label { font-weight: bold; color: #666; font-size: 12px; }
          .info-value { margin-top: 5px; font-size: 14px; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          .items-table th { background-color: #f5f5f5; font-weight: bold; }
          .summary-box { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px; }
          .status-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 10px; }
          .status-item { padding: 10px; border-radius: 4px; text-align: center; border: 1px solid #ddd; }
          .status-approved { background-color: #d4edda; border-color: #c3e6cb; }
          .status-pending { background-color: #f8f9fa; border-color: #dee2e6; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print { 
            body { 
              margin: 0; 
              padding: 15mm 10mm 15mm 10mm; 
              box-sizing: border-box;
              font-size: 12pt;
              line-height: 1.4;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header { 
              margin-bottom: 15mm; 
              page-break-after: avoid;
            }
            .section { 
              margin-bottom: 8mm; 
              page-break-inside: avoid;
            }
            .info-grid { 
              grid-template-columns: 1fr 1fr; 
              gap: 5mm;
            }
            .info-item { 
              padding: 3mm; 
              margin-bottom: 2mm;
            }
            .items-table { 
              page-break-inside: avoid;
              margin-top: 5mm;
            }
            .items-table th, .items-table td { 
              padding: 2mm; 
              font-size: 10pt;
            }
            .summary-box { 
              padding: 5mm; 
              margin-top: 5mm;
            }
            .status-grid { 
              grid-template-columns: 1fr 1fr 1fr; 
              gap: 3mm;
            }
            .status-item { 
              padding: 3mm;
            }
            .footer { 
              margin-top: 10mm; 
              page-break-inside: avoid;
            }
            @page {
              margin: 15mm 10mm 15mm 10mm;
              size: A4;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/uploads/Logo_1753245273579.jpeg" alt="لوگوی شرکت" class="company-logo" />
          <div class="company-name">شرکت ممتاز شیمی</div>
          <div class="order-title">جزئیات سفارش ${orderDetails.orderNumber || `#${selectedOrder?.customerOrderId}`}</div>
          <div style="font-size: 12px; margin-top: 10px;">تاریخ چاپ: ${new Date().toLocaleDateString('en-GB')}</div>
        </div>

        <div class="section">
          <div class="section-title">اطلاعات مشتری</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">نام مشتری</div>
              <div class="info-value">${orderDetails.customer?.firstName || ''} ${orderDetails.customer?.lastName || ''}</div>
            </div>
            <div class="info-item">
              <div class="info-label">شماره تماس</div>
              <div class="info-value">${orderDetails.customer?.phone || 'نامشخص'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">ایمیل</div>
              <div class="info-value">${orderDetails.customer?.email || 'نامشخص'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">مبلغ کل</div>
              <div class="info-value" style="color: #059669; font-weight: bold;">${formatCurrencyForPrint(parseFloat(orderDetails.totalAmount) || 0)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">خلاصه سفارش</div>
          <div class="summary-box">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center;">
              <div>
                <div class="info-label">تعداد آیتم‌ها</div>
                <div style="font-size: 18px; font-weight: bold; color: #1d4ed8;">${orderDetails.totalItems}</div>
              </div>
              <div>
                <div class="info-label">مجموع وزن ناخالص</div>
                <div style="font-size: 18px; font-weight: bold; color: #1d4ed8;">${orderDetails.totalWeight ? `${parseFloat(orderDetails.totalWeight).toFixed(1)} kg` : 'محاسبه نشده'}</div>
              </div>
              <div>
                <div class="info-label">تاریخ سفارش</div>
                <div style="font-size: 14px; font-weight: bold;">${new Date(orderDetails.orderDate).toLocaleDateString('en-GB')}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">آیتم‌های سفارش</div>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 35%">نام محصول</th>
                <th style="width: 20%">کد محصول</th>
                <th style="width: 15%">تعداد</th>
                <th style="width: 15%">قیمت واحد</th>
                <th style="width: 15%">قیمت کل</th>
              </tr>
            </thead>
            <tbody>
              ${orderDetails.items?.map((item: any) => `
                <tr>
                  <td>${item.productName}</td>
                  <td style="font-family: monospace;">${item.productSku}</td>
                  <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
                  <td>${formatCurrencyForPrint(parseFloat(item.unitPrice) || 0)}</td>
                  <td style="font-weight: bold;">${formatCurrencyForPrint(parseFloat(item.totalPrice) || 0)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">وضعیت سفارش</div>
          <div class="status-grid">
            <div class="status-item ${orderDetails.financialApproved ? 'status-approved' : 'status-pending'}">
              <div style="font-weight: bold;">تایید مالی</div>
              <div>${orderDetails.financialApproved ? '✅ تایید شده' : '⏳ در انتظار'}</div>
            </div>
            <div class="status-item ${orderDetails.warehouseProcessed ? 'status-approved' : 'status-pending'}">
              <div style="font-weight: bold;">پردازش انبار</div>
              <div>${orderDetails.warehouseProcessed ? '✅ تایید شده' : '⏳ در انتظار'}</div>
            </div>
            <div class="status-item ${orderDetails.logisticsProcessed ? 'status-approved' : 'status-pending'}">
              <div style="font-weight: bold;">پردازش لجستیک</div>
              <div>${orderDetails.logisticsProcessed ? '✅ تایید شده' : '⏳ در انتظار'}</div>
            </div>
          </div>
        </div>

        ${orderDetails.warehouseNotes ? `
          <div class="section">
            <div class="section-title">یادداشت انبار</div>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
              ${orderDetails.warehouseNotes}
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <p>این سند توسط سیستم مدیریت انبار ممتاز شیمی تولید شده است</p>
          <p>تاریخ و زمان چاپ: ${new Date().toLocaleString('en-GB', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</p>
        </div>
      </body>
      </html>
    `;

    // CRITICAL FIX: Use a safer print method that doesn't destroy React DOM
    // Create a new window for printing instead of manipulating current DOM
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Better approach: Wait for images and content to load completely
      const handlePrint = () => {
        setTimeout(() => {
          printWindow.print();
          // Don't auto-close - let user close manually
          // printWindow.close();
        }, 1000); // Give more time for content to load
      };
      
      // Multiple event listeners to ensure print dialog opens
      if (printWindow.document.readyState === 'complete') {
        handlePrint();
      } else {
        printWindow.onload = handlePrint;
        // Additional fallback
        setTimeout(handlePrint, 1500);
      }
    } else {
      // Fallback: Use a blob and object URL (safer than DOM manipulation)
      const blob = new Blob([printContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const printWindow2 = window.open(url, '_blank');
      if (printWindow2) {
        setTimeout(() => {
          printWindow2.print();
          // Don't auto-close
          URL.revokeObjectURL(url);
        }, 1500);
      }
    }
  };
  
  // Header filter states
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState('');
  
  // Loading state for individual orders
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);
  
  // All hooks called consistently
  const queryClient = useQueryClient();
  
  const { user } = useAuth();

  // Queries
  const { data: ordersResponse, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['/api/order-management/warehouse'],
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache at all - always fresh (v5 syntax)
    refetchOnWindowFocus: true, // Refetch when user comes back
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Force refresh function that completely clears cache
  const forceRefreshOrders = async () => {
    // Clear all cache first
    await queryClient.invalidateQueries({ queryKey: ['/api/order-management/warehouse'] });
    await queryClient.removeQueries({ queryKey: ['/api/order-management/warehouse'] });
    // Then refetch
    await refetchOrders();
    console.log({
      title: "🔄 به‌روزرسانی شد",
      description: "لیست سفارشات از سرور بازیابی شد",
    });
  };

  const orders = (ordersResponse as any)?.orders || [];

  // Mutations
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: number; status: string; notes?: string }) => {
      setLoadingOrderId(orderId); // Set loading state for specific order
      return await apiRequest(`/api/order-management/warehouse/${orderId}/process`, {
        method: 'PATCH',
        body: { status, notes }
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/order-management/warehouse'] });
      refetchOrders();
      console.log({
        title: "وضعیت سفارش به‌روزرسانی شد",
        description: `سفارش با موفقیت ${data.data?.status === 'warehouse_processing' ? 'در حال پردازش' : data.data?.status === 'warehouse_approved' ? 'تایید شده - ارسال به لجستیک' : 'به‌روزرسانی شده'} تنظیم شد.`,
      });
      setShowOrderDetails(false);
      setLoadingOrderId(null); // Clear loading state
    },
    onError: (error: any) => {
      console.log({
        title: "خطا در به‌روزرسانی",
        description: error.message || "خطایی در به‌روزرسانی وضعیت سفارش رخ داد.",
        variant: "destructive",
      });
      setLoadingOrderId(null); // Clear loading state on error
    },
  });

  // Warehouse Notes Save Mutation
  const saveNotesMutation = useMutation({
    mutationFn: async ({ customerOrderId, notes }: { customerOrderId: number; notes: string }) => {
      return await apiRequest(`/api/warehouse/orders/${customerOrderId}/notes`, {
        method: 'POST',
        body: { notes }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/order-management/warehouse'] });
      console.log({
        title: "✅ یادداشت ذخیره شد",
        description: "یادداشت انبار با موفقیت ذخیره شد",
      });
    },
    onError: (error: any) => {
      console.log({
        title: "خطا در ذخیره",
        description: error.message || "خطایی در ذخیره یادداشت رخ داد",
        variant: "destructive",
      });
    },
  });

  // Filter orders based on search and status
  const filteredOrders = orders?.filter((order: Order) => {
    // Build customer name from API response structure
    const customerName = order.customer?.firstName && order.customer?.lastName 
      ? `${order.customer.firstName} ${order.customer.lastName}` 
      : order.customerFirstName && order.customerLastName 
        ? `${order.customerFirstName} ${order.customerLastName}`
        : order.customerName || '';
    
    const customerEmail = order.customer?.email || order.customerEmail || '';
    const customerPhone = order.customer?.phone || order.customerPhone || '';
    
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toString().includes(searchTerm) ||
                         order.customerOrderId?.toString().includes(searchTerm);
    
    // Use currentStatus from API instead of status
    const orderStatus = order.currentStatus || order.status || '';
    
    // Check for notes filter
    let matchesStatus = false;
    if (selectedStatus === 'all') {
      matchesStatus = true;
    } else if (selectedStatus === 'with_notes') {
      matchesStatus = !!(order.notes && order.notes.trim().length > 0);
    } else if (selectedStatus === 'without_notes') {
      matchesStatus = !(order.notes && order.notes.trim().length > 0);
    } else {
      matchesStatus = orderStatus === selectedStatus;
    }
    
    // Header filters
    const matchesOrderId = orderIdFilter === '' || order.id.toString().includes(orderIdFilter);
    const matchesCustomerName = customerNameFilter === '' || customerName.toLowerCase().includes(customerNameFilter.toLowerCase());
    const matchesPhone = phoneFilter === '' || customerPhone.includes(phoneFilter);
    const matchesEmail = emailFilter === '' || customerEmail.toLowerCase().includes(emailFilter.toLowerCase());
    const matchesStatusFilter = statusFilter === '' || orderStatus.includes(statusFilter);
    const matchesAmount = amountFilter === '' || parseFloat(order.totalAmount || '0').toString().includes(amountFilter);
    
    return matchesSearch && matchesStatus && matchesOrderId && matchesCustomerName && matchesPhone && matchesEmail && matchesStatusFilter && matchesAmount;
  })?.sort((a: any, b: any) => {
    // Sort by order number - older orders (lower order numbers) first
    // Extract numeric part from order numbers like M2511401, M2511501
    const orderNumberA = a.orderNumber || '';
    const orderNumberB = b.orderNumber || '';
    
    // Extract the numeric part after 'M'
    const numericA = parseInt(orderNumberA.replace(/[^0-9]/g, '')) || 0;
    const numericB = parseInt(orderNumberB.replace(/[^0-9]/g, '')) || 0;
    
    console.log('🔄 [SORTING DEBUG] Order A:', orderNumberA, '(', numericA, ') Order B:', orderNumberB, '(', numericB, ')');
    
    if (numericA !== numericB) {
      const result = numericA - numericB;
      console.log('🔄 [SORTING DEBUG] Sort result:', result, '- older order first');
      return result;
    }
    
    // If order numbers are the same, sort by creation date
    const dateA = new Date(a.createdAt || a.orderDate || '').getTime();
    const dateB = new Date(b.createdAt || b.orderDate || '').getTime();
    return dateA - dateB;
  }) || [];

  // Debug log the final sorted order
  console.log('🔄 [FINAL ORDER] Orders after sorting:', filteredOrders?.map(o => ({ 
    id: o.id, 
    customerOrderId: o.customerOrderId, 
    orderNumber: o.orderNumber 
  })));



  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'warehouse_pending': 'bg-yellow-100 text-yellow-800',
      'financial_approved': 'bg-green-100 text-green-800',
      'warehouse_notified': 'bg-blue-100 text-blue-800',
      'warehouse_processing': 'bg-orange-100 text-orange-800',
      'warehouse_verified': 'bg-blue-100 text-blue-800',
      'warehouse_approved': 'bg-green-100 text-green-800',
      'warehouse_rejected': 'bg-red-100 text-red-800'
    };
    
    const statusLabels: Record<string, string> = {
      'warehouse_pending': 'در انتظار انبار',
      'financial_approved': 'تایید مالی',
      'warehouse_notified': 'اطلاع رسانی انبار',
      'warehouse_processing': 'در حال پردازش',
      'warehouse_verified': 'تایید مرحله اول',
      'warehouse_approved': 'تایید نهایی',
      'warehouse_rejected': 'رد شده'
    };
    
    return (
      <Badge className={`${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const handleOrderAction = (orderId: number, status: string) => {
    updateOrderMutation.mutate({
      orderId,
      status,
      notes: warehouseNotes
    });
    setWarehouseNotes('');
  };

  const handleSaveNotes = () => {
    console.log("🔍 [WAREHOUSE NOTES] Save notes clicked");
    console.log("🔍 [WAREHOUSE NOTES] Selected order:", selectedOrder);
    console.log("🔍 [WAREHOUSE NOTES] Warehouse notes:", warehouseNotes);
    
    if (!selectedOrder || !warehouseNotes.trim()) {
      console.log("❌ [WAREHOUSE NOTES] Validation failed - missing order or notes");
      console.log({
        title: "خطا",
        description: "لطفاً یادداشت را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    console.log("✅ [WAREHOUSE NOTES] Starting mutation with data:", {
      customerOrderId: selectedOrder.customerOrderId,
      notes: warehouseNotes
    });

    saveNotesMutation.mutate({
      customerOrderId: selectedOrder.customerOrderId,
      notes: warehouseNotes
    });
  };

  const clearAllFilters = () => {
    setOrderIdFilter('');
    setCustomerNameFilter('');
    setPhoneFilter('');
    setEmailFilter('');
    setAmountFilter('');
    setStatusFilter('');
  };

  // Fetch complete order details with items
  const fetchOrderDetails = async (customerOrderId: number) => {
    setLoadingOrderDetails(true);
    try {
      const response = await apiRequest(`/api/order-management/warehouse/${customerOrderId}/details`, {
        method: 'GET'
      });
      setOrderDetails(response.order);
      console.log('Order details fetched:', response.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
      console.log({
        title: "خطا در بارگیری جزئیات سفارش",
        description: "خطایی در بارگیری جزئیات سفارش رخ داد.",
        variant: "destructive",
      });
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              مدیریت انبار
            </h1>
          </div>
          <p className="text-gray-600">
            مدیریت سفارشات، موجودی، و عملیات انبار
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-6">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              سفارشات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="جستجوی سفارش، مشتری، یا ایمیل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="warehouse_pending">در انتظار انبار</option>
                <option value="financial_approved">تایید مالی</option>
                <option value="warehouse_notified">اطلاع رسانی انبار</option>
                <option value="warehouse_processing">در حال پردازش</option>
                <option value="warehouse_approved">تایید شده</option>
                <option value="warehouse_rejected">رد شده</option>
                <option value="with_notes">دارای یادداشت</option>
                <option value="without_notes">بدون یادداشت</option>
              </select>
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                پاک کردن همه فیلترها
              </Button>
            </div>

            {/* Orders Table */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      سفارشات تایید شده توسط واحد مالی
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2 mr-11">
                      سفارشات آماده برای پردازش انبار و ارسال به بخش لجستیک
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {filteredOrders.length} سفارش
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={forceRefreshOrders}
                      className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                      <RefreshCw className="w-4 h-4" />
                      به‌روزرسانی قوی
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">در حال بارگیری سفارشات...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Package className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ سفارشی یافت نشد</h3>
                    <p>در حال حاضر هیچ سفارش تایید شده‌ای در انتظار پردازش انبار نیست</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-right p-4 font-semibold text-gray-700" style={{ width: '120px' }}>شماره سفارش</th>
                          <th className="text-right p-4 font-semibold text-gray-700" style={{ width: '250px' }}>اطلاعات مشتری</th>
                          <th className="text-right p-4 font-semibold text-gray-700" style={{ width: '140px' }}>وزن محموله</th>
                          <th className="text-right p-4 font-semibold text-gray-700" style={{ width: '120px' }}>مبلغ کل</th>
                          <th className="text-right p-4 font-semibold text-gray-700" style={{ width: '120px' }}>وضعیت</th>
                          <th className="text-center p-4 font-semibold text-gray-700" style={{ width: '200px' }}>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order: Order) => (
                          <tr key={order.id} className="border-b hover:bg-blue-50 transition-colors">
                            <td className="p-4" style={{ width: '120px' }}>
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-blue-600 truncate">{order.orderNumber || `#${order.id}`}</div>
                                {order.notes && order.notes.trim().length > 0 && (
                                  <div className="bg-orange-100 text-orange-600 p-1 rounded-full" title="دارای یادداشت">
                                    <Edit3 className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4" style={{ width: '250px' }}>
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900 truncate">{
                                  order.customer?.firstName && order.customer?.lastName 
                                    ? `${order.customer.firstName} ${order.customer.lastName}` 
                                    : order.customerFirstName && order.customerLastName 
                                      ? `${order.customerFirstName} ${order.customerLastName}`
                                      : order.customerName || 'نامشخص'
                                }</div>
                                <div className="text-sm text-gray-600 truncate">
                                  📱 {order.customer?.phone || order.customerPhone || 'شماره نامشخص'}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  📧 {order.customer?.email || order.customerEmail || 'ایمیل نامشخص'}
                                </div>
                                <PaymentMethodBadge 
                                  paymentMethod={order.paymentMethod}
                                  showIcon={true}
                                  className="text-xs"
                                />
                              </div>
                            </td>
                            <td className="p-4" style={{ width: '140px' }}>
                              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1">
                                <Weight className="w-3 h-3" />
                                {order.totalWeight ? `${parseFloat(order.totalWeight).toFixed(1)} kg` : 'محاسبه...'}
                              </div>
                            </td>
                            <td className="p-4" style={{ width: '120px' }}>
                              <div className="font-semibold text-green-600 text-sm truncate">
                                {formatCurrency(parseFloat(order.totalAmount) || 0)}
                              </div>
                            </td>
                            <td className="p-4" style={{ width: '120px' }}>{getStatusBadge(order.currentStatus || order.status)}</td>
                            <td className="p-4" style={{ width: '140px' }}>
                              <div className="text-sm text-gray-600 truncate">
                              </div>
                            </td>
                            <td className="p-4 text-center" style={{ width: '200px' }}>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setWarehouseNotes(order.warehouseNotes || ''); // Load existing notes
                                    setShowOrderDetails(true);
                                    // Fetch complete order details
                                    fetchOrderDetails(order.customerOrderId);
                                  }}
                                  className="text-xs"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  جزئیات
                                </Button>
                                {(order.currentStatus === 'financial_approved' || order.currentStatus === 'warehouse_pending') && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleOrderAction(order.id, 'warehouse_processing')}
                                    disabled={loadingOrderId === order.id}
                                    className="bg-orange-500 hover:bg-orange-600 text-xs"
                                  >
                                    <Package className="w-4 h-4 mr-1" />
                                    {loadingOrderId === order.id ? 'در حال پردازش...' : 'شروع پردازش'}
                                  </Button>
                                )}
                                {order.currentStatus === 'warehouse_processing' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleOrderAction(order.id, 'warehouse_verified')}
                                    disabled={loadingOrderId === order.id}
                                    className="bg-blue-500 hover:bg-blue-600 text-xs"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {loadingOrderId === order.id ? 'در حال تایید...' : 'تایید مرحله اول'}
                                  </Button>
                                )}
                                {order.currentStatus === 'warehouse_verified' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleOrderAction(order.id, 'warehouse_approved')}
                                    disabled={loadingOrderId === order.id}
                                    className="bg-green-500 hover:bg-green-600 text-xs"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    {loadingOrderId === order.id ? 'در حال تایید...' : 'تایید نهایی'}
                                  </Button>
                                )}
                                {order.currentStatus === 'warehouse_approved' && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleOrderAction(order.id, 'logistics_dispatched')}
                                    disabled={loadingOrderId === order.id}
                                    className="bg-blue-500 hover:bg-blue-600 text-xs"
                                  >
                                    <Truck className="w-4 h-4 mr-1" />
                                    {loadingOrderId === order.id ? 'در حال ارسال...' : 'ارسال به لجستیک'}
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
        </Tabs>

        {/* Order Details Modal - Using SafeModal (No React Portal Issues) */}
        <SafeModal
          isOpen={showOrderDetails}
          onClose={() => setShowOrderDetails(false)}
          title={`جزئیات سفارش ${selectedOrder?.orderNumber || `#${selectedOrder?.customerOrderId}` || ''}`}
          maxWidth="max-w-4xl"
          maxHeight="max-h-[80vh]"
        >
            {loadingOrderDetails ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">در حال بارگیری جزئیات سفارش...</p>
              </div>
            ) : orderDetails ? (
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">اطلاعات مشتری</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">نام مشتری</Label>
                      <p className="text-sm mt-1 font-medium">{
                        orderDetails.customer?.firstName && orderDetails.customer?.lastName 
                          ? `${orderDetails.customer.firstName} ${orderDetails.customer.lastName}` 
                          : 'نامشخص'
                      }</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">شماره موبایل</Label>
                      <p className="text-sm mt-1 font-medium">{orderDetails.customer?.phone || 'شماره نامشخص'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">ایمیل</Label>
                      <p className="text-sm mt-1 font-medium">{orderDetails.customer?.email || 'ایمیل نامشخص'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">مبلغ کل</Label>
                      <p className="text-sm mt-1 font-medium text-green-600">{formatCurrency(parseFloat(orderDetails.totalAmount) || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">خلاصه سفارش</h3>
                  <div className="grid grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
                    <div className="text-center">
                      <Label className="text-sm font-medium text-gray-700">تعداد آیتم‌ها</Label>
                      <p className="text-2xl font-bold text-blue-600">{orderDetails.totalItems}</p>
                    </div>
                    <div className="text-center">
                      <Label className="text-sm font-medium text-gray-700">مجموع وزن ناخالص</Label>
                      <p className="text-2xl font-bold text-blue-600">{orderDetails.totalWeight ? `${parseFloat(orderDetails.totalWeight).toFixed(1)} kg` : 'محاسبه نشده'}</p>
                    </div>
                    <div className="text-center">
                      <Label className="text-sm font-medium text-gray-700">تاریخ سفارش</Label>
                      <p className="text-sm font-medium text-gray-900">{new Date(orderDetails.orderDate).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">آیتم‌های سفارش</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-right p-3 text-sm font-medium text-gray-700" style={{ width: '35%' }}>نام محصول</th>
                          <th className="text-right p-3 text-sm font-medium text-gray-700" style={{ width: '20%' }}>کد محصول</th>
                          <th className="text-center p-3 text-sm font-medium text-gray-700" style={{ width: '15%' }}>تعداد</th>
                          <th className="text-right p-3 text-sm font-medium text-gray-700" style={{ width: '15%' }}>قیمت واحد</th>
                          <th className="text-right p-3 text-sm font-medium text-gray-700" style={{ width: '15%' }}>قیمت کل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderDetails.items?.map((item: any, index: number) => (
                          <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="p-3 text-sm truncate" style={{ width: '35%' }} title={item.productName}>{item.productName}</td>
                            <td className="p-3 text-sm font-mono text-gray-600 truncate" style={{ width: '20%' }} title={item.productSku}>{item.productSku}</td>
                            <td className="p-3 text-sm text-center font-medium" style={{ width: '15%' }}>{item.quantity}</td>
                            <td className="p-3 text-sm truncate" style={{ width: '15%' }}>{formatCurrency(parseFloat(item.unitPrice) || 0)}</td>
                            <td className="p-3 text-sm font-medium truncate" style={{ width: '15%' }}>{formatCurrency(parseFloat(item.totalPrice) || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Status */}
                <div>
                  <h3 className="font-semibold mb-3 text-lg">وضعیت سفارش</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`p-3 rounded-lg border ${orderDetails.financialApproved ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        {orderDetails.financialApproved ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${orderDetails.financialApproved ? 'text-green-800' : 'text-gray-600'}`}>
                          تایید مالی
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${orderDetails.warehouseProcessed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        {orderDetails.warehouseProcessed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${orderDetails.warehouseProcessed ? 'text-green-800' : 'text-gray-600'}`}>
                          پردازش انبار
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${orderDetails.logisticsProcessed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        {orderDetails.logisticsProcessed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${orderDetails.logisticsProcessed ? 'text-green-800' : 'text-gray-600'}`}>
                          پردازش لجستیک
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Notes */}
                <div>
                  <Label htmlFor="warehouseNotes">یادداشت انبار</Label>
                  <Textarea
                    id="warehouseNotes"
                    value={warehouseNotes}
                    onChange={(e) => setWarehouseNotes(e.target.value)}
                    placeholder="یادداشت برای این سفارش..."
                    className="mt-2"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={saveNotesMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saveNotesMutation.isPending ? 'در حال ذخیره...' : 'ذخیره یادداشت'}
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowOrderDetails(false)}
                  >
                    انصراف
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrintOrder}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    پرینت جزئیات
                  </Button>
                  {selectedOrder?.currentStatus === 'warehouse_approved' && (
                    <Button
                      onClick={() => handleOrderAction(selectedOrder.id, 'logistics_dispatched')}
                      disabled={loadingOrderId === selectedOrder.id}
                    >
                      <Truck className="w-4 h-4 mr-1" />
                      {loadingOrderId === selectedOrder.id ? 'در حال ارسال...' : 'ارسال به لجستیک'}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">خطا در بارگیری جزئیات سفارش</p>
              </div>
            )}
        </SafeModal>
      </div>
    </div>
  );
};

export default WarehouseManagementFixed;
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle, Clock, CreditCard, DollarSign, RefreshCw, Timer, ChevronRight, XCircle, FileText, Eye, Download, Truck, MapPin, ZoomIn, ZoomOut, RotateCw, Move, X, Wallet, Calculator } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
// type { OrderManagement } - using interface from API
// Temporarily remove SimpleReceiptViewer import - needs to be created
// 
// Helper function for safe date formatting - OUTSIDE component
const formatDateSafe = (dateString: string | undefined, locale: string = 'en-US') => {
  if (!dateString) return 'نامشخص';
  try {
    return new Date(dateString).toLocaleDateString(locale);
  } catch {
    return 'نامشخص';
  }
};

// Helper to get customer info safely
const getCustomerInfo = (order: any) => {
  // Try individual name fields first
  if (order.customerFirstName || order.customerLastName) {
    const nameParts = [order.customerFirstName, order.customerLastName].filter(Boolean);
    return {
      name: nameParts.join(' '),
      firstName: order.customerFirstName || '',
      lastName: order.customerLastName || '',
      email: order.customerEmail || '',
      phone: order.customerPhone || ''
    };
  }

  // Try customer object if it exists
  if (order.customer) {
    return {
      name: `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim(),
      firstName: order.customer.firstName || '',
      lastName: order.customer.lastName || '',
      email: order.customer.email || '',
      phone: order.customer.phone || ''
    };
  }

  // Try to extract from customer name field if it exists
  if (order.customerName) {
    const nameParts = order.customerName.split(' ');
    return {
      name: order.customerName,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: order.customerEmail || '',
      phone: order.customerPhone || ''
    };
  }

  // Fallback to customer object
  if (order.customer) {
    return {
      firstName: order.customer.firstName,
      lastName: order.customer.lastName,
      email: order.customer.email,
      phone: order.customer.phone
    };
  }

  // Final fallback to individual fields
  return {
    firstName: order.customerFirstName || '',
    lastName: order.customerLastName || '',
    email: order.customerEmail || '',
    phone: order.customerPhone || ''
  };
};

function FinanceOrders() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<OrderManagement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [receiptAmount, setReceiptAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [selectedFileMimeType, setSelectedFileMimeType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Enhanced image viewer states
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("pending");
  const [orderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [orderDocuments, setOrderDocuments] = useState<any[]>([]);
  const [orderDetailsWalletBalance, setOrderDetailsWalletBalance] = useState<number>(0);

  // Check admin authentication - MOVED to top to avoid conditional hooks
  const { data: adminUser, isLoading: isCheckingAuth, error: authError } = useQuery({
    queryKey: ['/api/admin/me'],
    queryFn: () => fetch('/api/admin/me', { credentials: 'include' }).then(res => res.json()),
    retry: false,
    staleTime: 0,
  });

  // Enable audio notifications - ALWAYS call hooks unconditionally
  const { orderCount } = useOrderNotifications({
    department: 'financial',
    enabled: Boolean(adminUser?.success) // Convert to boolean to avoid undefined
  });

  // Get orders for financial review - MOVED to top - Using global refresh control
  const { data: ordersResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/financial/orders'],
    queryFn: async () => {
      const res = await fetch('/api/financial/orders', { credentials: 'include' });
      const data = await res.json();
      return data;
    },
    enabled: Boolean(adminUser?.success), // Only run if authenticated
    staleTime: 0,
  });

  // Fetch approved orders that have been transferred to warehouse - MOVED to top
  const { data: approvedOrdersResponse, isLoading: isLoadingApproved, refetch: refetchApproved } = useQuery({
    queryKey: ['/api/financial/approved-orders'],
    queryFn: async () => {
      const res = await fetch('/api/financial/approved-orders', { credentials: 'include' });
      const data = await res.json();
      console.log('🔍 [APPROVED ORDERS] Raw response:', data);
      return data;
    },
    enabled: Boolean(adminUser?.success), // Only run if authenticated
    staleTime: 0,
    refetchOnWindowFocus: false, // Disable aggressive refetching
    refetchInterval: false, // Disable automatic refetch
  });

  // Fetch company information for logo - MOVED to top to avoid conditional hooks
  const { data: companyInfo } = useQuery({
    queryKey: ['/api/admin/company-information'],
    enabled: true
  });

  // Send reminder mutation - MOVED to top to avoid conditional hooks
  const sendReminderMutation = useMutation({
    mutationFn: async ({ orderId, type }: { orderId: number; type: string }) => {
      return apiRequest(`/api/finance/orders/${orderId}/reminder`, {
        method: 'POST',
        body: { type }
      });
    },
    onSuccess: () => {
      toast({
        title: "یادآوری ارسال شد",
        description: "پیام یادآوری با موفقیت ارسال شد"
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ارسال یادآوری",
        description: error.message || "امکان ارسال یادآوری وجود ندارد",
        variant: "destructive"
      });
    }
  });

  // Approve order mutation - MOVED to top
  const approveMutation = useMutation({
    mutationFn: async ({ orderId, notes, receiptAmount }: { orderId: number; notes: string; receiptAmount?: string }) => {
      console.log(`💰 [FINANCE] Approving order ${orderId} with notes: ${notes}`);
      return apiRequest(`/api/finance/orders/${orderId}/approve`, {
        method: 'POST',
        body: { notes, receiptAmount }
      });
    },
    onSuccess: (response) => {
      console.log(`✅ [FINANCE] Order approved successfully:`, response);
      toast({
        title: "✅ سفارش تأیید شد",
        description: "سفارش با موفقیت تأیید و به انبار ارجاع شد"
      });
      setDialogOpen(false);
      setSelectedOrder(null);
      setReviewNotes("");
      setReceiptAmount("");
      // Close order details modal if open
      if (orderDetailsModalOpen) {
        setOrderDetailsModalOpen(false);
        setOrderDetails(null);
      }
      // Refresh both pending and approved orders
      refetch();
      refetchApproved();
    },
    onError: (error: any) => {
      console.error(`❌ [FINANCE] Approval error:`, error);
      toast({
        title: "خطا در تأیید سفارش",
        description: error.message || "امکان تأیید سفارش وجود ندارد",
        variant: "destructive"
      });
    }
  });

  // Reject order mutation - MOVED to top
  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: number; notes: string }) => {
      console.log(`❌ [FINANCE] Rejecting order ${orderId} with notes: ${notes}`);
      return apiRequest(`/api/finance/orders/${orderId}/reject`, {
        method: 'POST',
        body: { notes }
      });
    },
    onSuccess: (response) => {
      console.log(`✅ [FINANCE] Order rejected successfully:`, response);
      toast({
        title: "❌ سفارش رد شد",
        description: "سفارش با موفقیت رد شد"
      });
      setDialogOpen(false);
      setSelectedOrder(null);
      setReviewNotes("");
      // Close order details modal if open
      if (orderDetailsModalOpen) {
        setOrderDetailsModalOpen(false);
        setOrderDetails(null);
      }
      // Refresh orders
      refetch();
    },
    onError: (error: any) => {
      console.error(`❌ [FINANCE] Rejection error:`, error);
      toast({
        title: "خطا در رد سفارش",
        description: error.message || "امکان رد سفارش وجود ندارد",
        variant: "destructive"
      });
    }
  });

  // Fix pending payments mutation - MOVED to top
  const fixPendingPaymentsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/finance/fix-pending-payments', {
        method: 'POST'
      });
    },
    onSuccess: (response) => {
      toast({
        title: "تصحیح پرداخت‌ها انجام شد",
        description: `${response.fixed} پرداخت تصحیح شد`
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "خطا در بهبود پرداخت",
        description: error.message || "خطا در تصحیح پرداخت‌های ناتمام",
        variant: "destructive"
      });
    }
  });

  // Calculate data variables FIRST before useCallbacks that might need them
  const allOrders: OrderManagement[] = ordersResponse?.orders || [];
  // Handle both array and object response formats
  const transferredOrders: OrderManagement[] = Array.isArray(approvedOrdersResponse) 
    ? approvedOrdersResponse 
    : (approvedOrdersResponse?.orders || []);

  // ALL useCallback functions MUST be after data definitions but before early returns to maintain hook order
  
  // Force refresh function that completely clears all finance cache
  const forceRefreshFinanceOrders = useCallback(async () => {
    // Clear all finance cache first
    await queryClient.invalidateQueries({ queryKey: ['/api/financial/orders'] });
    await queryClient.removeQueries({ queryKey: ['/api/financial/orders'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/financial/approved-orders'] });
    await queryClient.removeQueries({ queryKey: ['/api/financial/approved-orders'] });
    // Then refetch both
    await refetch();
    await refetchApproved();
    toast({
      title: "🔄 به‌روزرسانی شد",
      description: "تمام اطلاعات مالی از سرور بازیابی شد",
    });
  }, [refetch, refetchApproved, toast]);

  // Fetch order details function for admin users
  const fetchOrderDetails = useCallback(async (orderNumber: string) => {
    try {
      // For admin users, we need to find the order by orderNumber first, then get details by ID
      const findOrderResponse = await fetch(`/api/admin/orders/find-by-number/${orderNumber}`, {
        credentials: 'include'
      });
      
      if (!findOrderResponse.ok) {
        throw new Error('Order not found');
      }
      
      const findOrderData = await findOrderResponse.json();
      if (!findOrderData.success) {
        throw new Error(findOrderData.message || 'Order not found');
      }
      
      // Now get the order details using the customer order ID
      const detailsResponse = await fetch(`/api/admin/orders/${findOrderData.order.id}/details`, {
        credentials: 'include'
      });
      
      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const detailsData = await detailsResponse.json();
      if (detailsData.success) {
        console.log('📋 [ORDER DETAILS] Order fetched:', detailsData.order.orderNumber);
        console.log('📋 [ORDER DETAILS] Items count:', detailsData.order.items?.length || 0);
        console.log('📋 [ORDER DETAILS] Items data:', detailsData.order.items);
        setOrderDetails(detailsData.order);
        setOrderDocuments(detailsData.documents || []);
        
        // Fetch wallet balance for this customer using customer ID
        try {
          if (detailsData.order?.customerId) {
            const walletResponse = await fetch(`/api/wallet/balance/${detailsData.order.customerId}`, {
              credentials: 'include'
            });
            if (walletResponse.ok) {
              const walletResult = await walletResponse.json();
              setOrderDetailsWalletBalance(walletResult.data?.balance || 0);
            } else {
              setOrderDetailsWalletBalance(0);
            }
          } else {
            setOrderDetailsWalletBalance(0);
          }
        } catch (walletError) {
          console.error('Error fetching wallet balance for order details:', walletError);
          setOrderDetailsWalletBalance(0);
        }
        
        setOrderDetailsModalOpen(true);
      } else {
        throw new Error(detailsData.message || 'Failed to get order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        variant: "destructive", 
        title: "خطا",
        description: "امکان دریافت جزئیات سفارش وجود ندارد"
      });
    }
  }, [toast]);

  const loadTrackingCodes = useCallback(async (orderId?: number) => {
    if (!orderId) return;
    
    try {
      const response = await apiRequest(`/api/tracking/order/${orderId}`, { method: 'GET' });
      // setTrackingCodes(response.trackingCodes || []);
    } catch (error) {
      console.error("Error loading tracking codes:", error);
    }
  }, []);

  const handleTrackingModal = useCallback((order: OrderManagement) => {
    // setSelectedOrderForTracking(order);
    // setShowTrackingModal(true);
    // loadTrackingCodes(order.customerOrderId);
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'payment_uploaded':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">در انتظار بررسی مالی</Badge>;
      case 'financial_reviewing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">در حال بررسی</Badge>;
      case 'financial_approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700">تأیید شده</Badge>;
      case 'auto_approved':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700">تأیید درگاه بانکی</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  const handleOrderReview = useCallback(async (order: OrderManagement) => {
    setSelectedOrder(order);
    setReviewNotes(order.financialNotes || "");
    setReceiptAmount("");
    setDialogOpen(true);
    
    // Fetch wallet balance for this customer - simplified and more reliable approach
    if (order.customerOrderId) {
      setWalletLoading(true);
      try {
        console.log('🔍 [WALLET DEBUG] Starting wallet fetch for order:', order.orderNumber);
        
        // Get order details to get the customer ID directly
        const orderResponse = await fetch(`/api/admin/orders/${order.customerOrderId}/details`, {
          credentials: 'include'
        });
        
        console.log('🔍 [WALLET DEBUG] Order details response status:', orderResponse.status);
        
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          console.log('🔍 [WALLET DEBUG] Order data received:', orderData);
          
          if (orderData.success && orderData.order?.customerId) {
            const customerId = orderData.order.customerId;
            console.log('🔍 [WALLET DEBUG] Found customer ID:', customerId);
            
            // Get wallet balance using customer ID
            const walletResponse = await fetch(`/api/wallet/balance/${customerId}`, {
              credentials: 'include'
            });
            console.log('🔍 [WALLET DEBUG] Wallet response status:', walletResponse.status);
            
            if (walletResponse.ok) {
              const walletResult = await walletResponse.json();
              console.log('🔍 [WALLET DEBUG] Wallet result:', walletResult);
              const balance = walletResult.data?.balance || 0;
              console.log('🔍 [WALLET DEBUG] Final balance:', balance);
              setWalletBalance(balance);
            } else {
              const errorText = await walletResponse.text();
              console.error('🔍 [WALLET DEBUG] Wallet API failed:', walletResponse.status, errorText);
              setWalletBalance(0);
            }
          } else {
            console.error('🔍 [WALLET DEBUG] No customer ID in order data:', orderData);
            setWalletBalance(0);
          }
        } else {
          const errorText = await orderResponse.text();
          console.error('🔍 [WALLET DEBUG] Order details API failed:', orderResponse.status, errorText);
          setWalletBalance(0);
        }
      } catch (error) {
        console.error('🔍 [WALLET DEBUG] Exception during wallet fetch:', error);
        setWalletBalance(0);
      } finally {
        setWalletLoading(false);
      }
    } else {
      console.error('🔍 [WALLET DEBUG] No customerOrderId in order');
      setWalletBalance(0);
    }
  }, []);

  const handleApprove = useCallback(() => {
    if (!selectedOrder) return;
    approveMutation.mutate({ 
      orderId: selectedOrder.customerOrderId, 
      notes: reviewNotes,
      receiptAmount: receiptAmount 
    });
  }, [selectedOrder, approveMutation, reviewNotes, receiptAmount]);

  const handleReject = useCallback(() => {
    if (!selectedOrder) return;
    rejectMutation.mutate({ 
      orderId: selectedOrder.customerOrderId, 
      notes: reviewNotes 
    });
  }, [selectedOrder, rejectMutation, reviewNotes]);

  const openImageModal = useCallback(async (imageUrl: string) => {
    console.log('🖼️ [IMAGE MODAL] Opening image modal with URL:', imageUrl);
    
    // Convert object storage URLs to proper server endpoints
    let processedUrl = imageUrl;
    if (imageUrl.includes('/.private/uploads/')) {
      // Extract the file ID from the object storage URL
      const parts = imageUrl.split('/.private/uploads/');
      if (parts.length === 2) {
        const fileId = parts[1];
        processedUrl = `/objects/uploads/${fileId}`;
        console.log('🔄 [IMAGE MODAL] Converted object storage URL to server endpoint:', processedUrl);
      }
    }
    
    // Verify image exists before opening modal
    try {
      const response = await fetch(processedUrl, { method: 'HEAD', credentials: 'include' });
      if (!response.ok) {
        console.error('❌ [IMAGE MODAL] Image not accessible:', processedUrl, 'Status:', response.status);
        toast({
          title: "خطا در نمایش رسید",
          description: "امکان نمایش رسید وجود ندارد",
          variant: "destructive"
        });
        return;
      }
      console.log('✅ [IMAGE MODAL] Image verified accessible:', processedUrl);
    } catch (error) {
      console.error('❌ [IMAGE MODAL] Failed to verify image:', error);
      toast({
        title: "خطا در دسترسی به رسید",
        description: "مشکل در اتصال به سرور",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedImageUrl(processedUrl);
    setSelectedFileMimeType("");
    setImageModalOpen(true);
    // Reset zoom and pan when opening new image
    setZoomLevel(1);
    setRotation(0);
    setPanPosition({ x: 0, y: 0 });
  }, [toast]);

  // Function to determine if URL is an image
  const isImageUrl = (url: string, mimeType?: string) => {
    if (mimeType) {
      return mimeType.startsWith('image/');
    }
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  // Function to determine if URL is a PDF
  const isPdfUrl = (url: string, mimeType?: string) => {
    if (mimeType) {
      return mimeType === 'application/pdf';
    }
    return /\.pdf$/i.test(url);
  };

  // Function to get file type for display
  const getFileType = (url: string, mimeType?: string) => {
    if (isImageUrl(url, mimeType)) return 'image';
    if (isPdfUrl(url, mimeType)) return 'pdf';
    return 'unknown';
  };

  // Enhanced image viewer functions
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  }, []);

  const handleResetView = useCallback(() => {
    setZoomLevel(1);
    setRotation(0);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  }, [zoomLevel, panPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, zoomLevel, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handlePrintOrder = useCallback(async () => {
    if (!orderDetails) return;

    // Simple print implementation
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>جزئیات سفارش ${orderDetails.orderNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .info { margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
                th { background-color: #f5f5f5; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>جزئیات سفارش ${orderDetails.orderNumber}</h2>
                <p>تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}</p>
              </div>
              <div class="info">
                <strong>مشتری:</strong> ${orderDetails.customerName || 'نامشخص'}
              </div>
              <div class="info">
                <strong>ایمیل:</strong> ${orderDetails.customerEmail || 'نامشخص'}
              </div>
              <div class="info">
                <strong>تلفن:</strong> ${orderDetails.customerPhone || 'نامشخص'}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>نام محصول</th>
                    <th>تعداد</th>
                    <th>قیمت</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderDetails.items?.map((item: any) => `
                    <tr>
                      <td>${item.productName || 'نامشخص'}</td>
                      <td>${item.quantity || 0}</td>
                      <td>${item.price || 0}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="3">بدون آیتم</td></tr>'}
                </tbody>
              </table>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      toast({
        title: "خطا در چاپ",
        description: "امکان چاپ وجود ندارد",
        variant: "destructive",
      });
    }
  }, [orderDetails, toast]);

  const handleAcceptOrder = useCallback(() => {
    if (!orderDetails) return;
    
    // Find the corresponding order from allOrders using orderDetails.id (customer order ID)
    const correspondingOrder = allOrders.find(order => order.customerOrderId === orderDetails.id);
    
    if (!correspondingOrder) {
      console.error('🚫 [FINANCE] Could not find corresponding order for customer order ID:', orderDetails.id);
      return;
    }
    
    console.log('🔄 [FINANCE] Accepting order from modal - Management ID:', correspondingOrder.id, 'Customer Order ID:', correspondingOrder.customerOrderId);
    approveMutation.mutate({ 
      orderId: correspondingOrder.customerOrderId, // USE CUSTOMER ORDER ID FOR API
      notes: `سفارش تأیید شد از طریق مودال جزئیات - ${new Date().toLocaleDateString('en-US')}`,
      receiptAmount: receiptAmount 
    });
    // Don't close modal here - let the mutation success handler close it
  }, [orderDetails, allOrders, approveMutation, receiptAmount]);

  const handleRejectOrder = useCallback(() => {
    if (!orderDetails) return;
    
    // Find the corresponding order from allOrders using orderDetails.id (customer order ID)
    const correspondingOrder = allOrders.find(order => order.customerOrderId === orderDetails.id);
    
    if (!correspondingOrder) {
      console.error('🚫 [FINANCE] Could not find corresponding order for customer order ID:', orderDetails.id);
      return;
    }
    
    console.log('🔄 [FINANCE] Rejecting order from modal - Management ID:', correspondingOrder.id, 'Customer Order ID:', correspondingOrder.customerOrderId);
    rejectMutation.mutate({ 
      orderId: correspondingOrder.customerOrderId, // USE CUSTOMER ORDER ID FOR API
      notes: `سفارش رد شد از طریق مودال جزئیات - ${new Date().toLocaleDateString('en-US')}` 
    });
    // Don't close modal here - let the mutation success handler close it
  }, [orderDetails, allOrders, rejectMutation]);

  // Early return for loading state - AFTER all hooks are called
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>بررسی احراز هویت...</p>
        </div>
      </div>
    );
  }

  // Early return for unauthenticated state
  if (!adminUser || !adminUser.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              دسترسی محدود
            </CardTitle>
            <CardDescription className="text-center">
              برای دسترسی به بخش مالی، ابتدا وارد حساب مدیریت شوید
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-sm text-gray-600">
              شما با حساب مشتری وارد شده‌اید. لطفاً از حساب مدیریت استفاده کنید.
            </p>
            <Button 
              onClick={() => window.location.href = '/admin/login'} 
              className="w-full"
            >
              ورود به حساب مدیریت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter and search functionality
  const filteredOrders = allOrders.filter(order => {
    const searchMatch = !searchTerm || 
      order.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerOrderId?.toString().includes(searchTerm);
    
    const statusMatch = statusFilter === "all" || order.currentStatus === statusFilter;
    
    return searchMatch && statusMatch;
  }).sort((a, b) => {
    // Show older orders first (ascending order by creation date)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Separate pending orders by type for better organization
  const pendingOrders = filteredOrders.filter(order => 
    ['finance_pending', 'payment_uploaded', 'auto_approved'].includes(order.currentStatus)
  );
  
  const walletOrders = pendingOrders.filter(order => 
    order.paymentMethod === 'wallet_full' || order.paymentMethod === 'wallet_partial'
  );
  
  const bankOrders = pendingOrders.filter(order => 
    order.paymentMethod !== 'wallet_full' && order.paymentMethod !== 'wallet_partial'
  );

  // Filter transferred orders (chronological order: older first)
  const filteredTransferredOrders = transferredOrders.filter(order => {
    const searchMatch = !searchTerm || 
      order.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerOrderId?.toString().includes(searchTerm);
    
    return searchMatch;
  }).sort((a, b) => {
    // Show older orders first (ascending order by creation date)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Rejected orders
  const rejectedOrders = allOrders.filter(order => 
    order.currentStatus === 'finance_rejected'
  );

  // Statistics - Only calculate total for approved/transferred orders
  const totalAmount = transferredOrders.reduce((sum, order) => 
    sum + parseFloat(order.totalAmount || '0'), 0
  );
  
  const totalTransferred = filteredTransferredOrders.reduce((sum, order) => 
    sum + parseFloat(order.totalAmount || '0'), 0
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">در حال بارگذاری...</span>
        </div>
      </div>
    );
  }

  // Simple OrderCard component
  const OrderCard = ({ order, onOrderSelect, fetchOrderDetails, readOnly = false }: { 
    order: OrderManagement; 
    onOrderSelect?: () => void;
    fetchOrderDetails?: (orderNumber: string) => void;
    readOnly?: boolean;
  }) => {
    const customerInfo = getCustomerInfo(order);
    
    return (
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg">سفارش #{order.orderNumber}</h3>
              <p className="text-sm text-gray-600">
                {customerInfo.firstName} {customerInfo.lastName}
              </p>
              <p className="text-sm text-gray-500">{customerInfo.email}</p>
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">{parseFloat(order.totalAmount || '0').toLocaleString()} IQD</p>
              {getStatusBadge(order.currentStatus)}
            </div>
          </div>
          
          <div className="flex gap-2">
            {!readOnly && onOrderSelect && (
              <Button size="sm" onClick={onOrderSelect}>
                بررسی
              </Button>
            )}
            {fetchOrderDetails && (
              <Button size="sm" variant="outline" onClick={() => fetchOrderDetails(order.orderNumber)}>
                <Eye className="w-4 h-4 mr-1" />
                جزئیات
              </Button>
            )}
            {(order.receipt?.url || order.paymentReceiptUrl) && (
              <Button size="sm" variant="outline" onClick={() => openImageModal(order.receipt?.url || order.paymentReceiptUrl)}>
                <FileText className="w-4 h-4 mr-1" />
                رسید
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Simple TransferredOrderCard component
  const TransferredOrderCard = ({ order }: { order: OrderManagement }) => {
    const customerInfo = getCustomerInfo(order);
    
    return (
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">سفارش #{order.orderNumber}</h3>
              <p className="text-sm text-gray-600">
                {customerInfo.firstName} {customerInfo.lastName}
              </p>
              <p className="text-sm text-gray-500">تاریخ: {formatDateSafe(order.createdAt)}</p>
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">{parseFloat(order.totalAmount || '0').toLocaleString()} IQD</p>
              <Badge variant="outline" className="bg-green-50 text-green-700">ارجاع شده به انبار</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
                  واحد مالی
                </h1>
                <p className="text-gray-600 mt-1">مدیریت پرداخت‌ها</p>
              </div>
            </div>
            
            {/* Refresh Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={forceRefreshFinanceOrders}
              className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <RefreshCw className="w-4 h-4" />
              به‌روزرسانی قوی
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">کیف پول (نیاز به تایید)</p>
                  <p className="text-3xl font-bold text-white">{walletOrders.length}</p>
                </div>
                <Timer className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">درگاه بانکی</p>
                  <p className="text-3xl font-bold text-white">{bankOrders.length}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">مجموع مبالغ</p>
                  <p className="text-2xl font-bold text-white">
                    {totalAmount.toLocaleString()} IQD
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-indigo-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">تعداد ارجاع شده</p>
                  <p className="text-3xl font-bold text-white">{transferredOrders.length}</p>
                </div>
                <Truck className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different order states */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">در انتظار بررسی ({pendingOrders.length})</TabsTrigger>
            <TabsTrigger value="transferred">ارجاع شده ({transferredOrders.length})</TabsTrigger>
            <TabsTrigger value="rejected">رد شده ({rejectedOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">همه سفارشات بررسی شده</h3>
                  <p className="text-gray-500">در حال حاضر سفارشی برای بررسی مالی وجود ندارد</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Wallet Orders Section */}
                {walletOrders.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h3 className="font-medium text-green-800">سفارشات کیف پول - نیاز به تایید دستی</h3>
                    </div>
                    {walletOrders.map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        onOrderSelect={() => {
                          setSelectedOrder(order);
                          setDialogOpen(true);
                        }} 
                        fetchOrderDetails={fetchOrderDetails} 
                      />
                    ))}
                  </div>
                )}

                {/* Bank Orders Section */}
                {bankOrders.length > 0 && (
                  <div className="space-y-4">
                    {walletOrders.length > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h3 className="font-medium text-blue-800">سفارشات درگاه بانکی - بررسی دستی</h3>
                      </div>
                    )}
                    {bankOrders.map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order} 
                        onOrderSelect={() => {
                          setSelectedOrder(order);
                          setDialogOpen(true);
                        }} 
                        fetchOrderDetails={fetchOrderDetails} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transferred" className="space-y-4">
            {filteredTransferredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ChevronRight className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">سفارشی به انبار ارجاع نشده</h3>
                  <p className="text-gray-500">در حال حاضر سفارش تایید شده‌ای که به انبار ارجاع شده باشد وجود ندارد</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTransferredOrders.map((order) => (
                  <TransferredOrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ سفارش رد شده‌ای وجود ندارد</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rejectedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} readOnly fetchOrderDetails={fetchOrderDetails} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>بررسی سفارش #{selectedOrder?.orderNumber}</DialogTitle>
            {selectedOrder && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border">
                <div className="text-right text-sm text-gray-600 mb-1">مشتری:</div>
                <div className="text-right font-medium text-blue-900">
                  {getCustomerInfo(selectedOrder).name}
                </div>
                <div className="text-right text-xs text-gray-500">
                  {getCustomerInfo(selectedOrder).email}
                </div>
              </div>
            )}
            <DialogDescription>
              لطفاً تصمیم خود را اعلام کنید
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Order and Wallet Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <Label className="font-semibold text-blue-700">مبلغ سفارش</Label>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {selectedOrder?.totalAmount ? parseFloat(selectedOrder.totalAmount).toLocaleString() : '0'} IQD
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-green-600" />
                  <Label className="font-semibold text-green-700">موجودی کیف پول</Label>
                </div>
                <div className="text-lg font-bold text-green-600">
                  {walletLoading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      در حال بارگذاری...
                    </div>
                  ) : (
                    `${walletBalance.toLocaleString()} IQD`
                  )}
                </div>
              </div>
            </div>

            {/* Live Calculations */}
            {receiptAmount && selectedOrder && (
              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  محاسبات زنده
                </h4>
                {(() => {
                  const orderTotal = parseFloat(selectedOrder.totalAmount || '0');
                  const receiptAmountNum = parseFloat(receiptAmount) || 0;
                  const shortfall = orderTotal - receiptAmountNum;
                  const excess = receiptAmountNum - orderTotal; // اضافه واریزی
                  const canApprove = shortfall <= 0 || shortfall <= walletBalance;
                  
                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>مبلغ رسید واریزی:</span>
                        <span className="font-medium">{receiptAmountNum.toLocaleString()} IQD</span>
                      </div>
                      
                      {shortfall > 0 && (
                        <div className="flex justify-between">
                          <span>کسری واریزی:</span>
                          <span className="font-medium text-red-600">{shortfall.toLocaleString()} IQD</span>
                        </div>
                      )}
                      
                      {excess > 0 && (
                        <div className="flex justify-between">
                          <span>اضافه واریزی:</span>
                          <span className="font-medium text-blue-600">+{excess.toLocaleString()} IQD</span>
                        </div>
                      )}
                      
                      {shortfall > 0 && (
                        <div className="flex justify-between">
                          <span>کفایت کیف پول:</span>
                          <span className={`font-medium ${canApprove ? 'text-green-600' : 'text-red-600'}`}>
                            {canApprove ? '✅ کافی است' : '❌ ناکافی'}
                          </span>
                        </div>
                      )}
                      
                      {excess > 0 && (
                        <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400 mt-2">
                          <p className="text-blue-700 text-xs">
                            💰 مبلغ اضافی <strong>{excess.toLocaleString()} IQD</strong> به کیف پول مشتری اضافه خواهد شد
                          </p>
                        </div>
                      )}
                      
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span>وضعیت تایید:</span>
                          <span className={canApprove ? 'text-green-600' : 'text-red-600'}>
                            {canApprove ? '✅ قابل تایید' : '❌ غیرقابل تایید'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div>
              <Label htmlFor="receiptAmount">مبلغ رسید واریزی</Label>
              <Input 
                id="receiptAmount"
                type="number"
                value={receiptAmount}
                onChange={(e) => setReceiptAmount(e.target.value)}
                placeholder="مبلغ واریز شده را وارد کنید"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                مبلغی که مشتری واقعاً واریز کرده است
              </p>
            </div>
            
            <div>
              <Label htmlFor="notes">یادداشت‌ها</Label>
              <Textarea 
                id="notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="یادداشت‌های خود را وارد کنید..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              رد
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={(() => {
                if (!receiptAmount || !selectedOrder) return false;
                const orderTotal = parseFloat(selectedOrder.totalAmount || '0');
                const receiptAmountNum = parseFloat(receiptAmount) || 0;
                const shortfall = orderTotal - receiptAmountNum;
                return shortfall > 0 && shortfall > walletBalance;
              })()}
              className={(() => {
                if (!receiptAmount || !selectedOrder) return "";
                const orderTotal = parseFloat(selectedOrder.totalAmount || '0');
                const receiptAmountNum = parseFloat(receiptAmount) || 0;
                const shortfall = orderTotal - receiptAmountNum;
                const canApprove = shortfall <= 0 || shortfall <= walletBalance;
                return canApprove ? "bg-green-600 hover:bg-green-700" : "";
              })()}
            >
              تایید
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Image Modal for Receipt Viewing with Zoom */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0" style={{ width: '95vw', height: '95vh' }}>
          <DialogHeader className="p-4 pb-2 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                مشاهده فیش پرداخت
              </span>
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                    title="کوچک‌تر کردن"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-xs px-2 font-mono min-w-[50px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 5}
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                    title="بزرگ‌تر کردن"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRotate}
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                    title="چرخاندن ۹۰ درجه"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetView}
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                    title="بازگشت به حالت اولیه"
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageModalOpen(false)}
                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div 
            className="flex-1 overflow-hidden bg-gray-50 relative"
            style={{ height: 'calc(95vh - 80px)' }}
          >
            {selectedImageUrl && (
              <>
                {getFileType(selectedImageUrl, selectedFileMimeType) === 'image' ? (
                  <div
                    className="w-full h-full flex items-center justify-center cursor-move select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ cursor: isDragging ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default') }}
                  >
                    <img
                      src={selectedImageUrl}
                      alt="فیش پرداخت"
                      className="max-w-none transition-transform duration-200"
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                        transformOrigin: 'center center'
                      }}
                      draggable={false}
                      onError={(e) => {
                        console.error('❌ [IMAGE MODAL] Failed to load image:', selectedImageUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : getFileType(selectedImageUrl, selectedFileMimeType) === 'pdf' ? (
                  <div className="w-full h-full">
                    <iframe
                      src={selectedImageUrl}
                      className="w-full h-full border-0"
                      title="فیش پرداخت PDF"
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </div>
                ) : (
                  // If it's a PDF file but not handled above, open directly in new tab
                  isPdfUrl(selectedImageUrl, selectedFileMimeType) ? (
                    window.open(selectedImageUrl, '_blank'),
                    setImageModalOpen(false),
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center p-8">
                        <FileText className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <p className="text-lg text-gray-600">در حال باز کردن PDF در تب جدید...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center p-8">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg text-gray-600 mb-4">نوع فایل پشتیبانی نمی‌شود</p>
                        <Button
                          variant="outline"
                          onClick={() => window.open(selectedImageUrl, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          باز کردن در تب جدید
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </>
            )}
            
            {/* Zoom hint */}
            {zoomLevel > 1 && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                برای جابجایی تصویر آن را بکشید
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Details Modal */}
      <Dialog open={orderDetailsModalOpen} onOpenChange={setOrderDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات سفارش #{orderDetails?.orderNumber}</DialogTitle>
          </DialogHeader>
          
          {orderDetails && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle>اطلاعات مشتری</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>نام:</strong> {orderDetails.customerName || `${orderDetails.customer?.firstName || ''} ${orderDetails.customer?.lastName || ''}`.trim()}
                    </div>
                    <div>
                      <strong>ایمیل:</strong> {orderDetails.customerEmail || orderDetails.customer?.email}
                    </div>
                    <div>
                      <strong>تلفن:</strong> {orderDetails.customerPhone || orderDetails.customer?.phone}
                    </div>
                    <div>
                      <strong>تاریخ:</strong> {formatDateSafe(orderDetails.createdAt)}
                    </div>
                  </div>
                  
                  {/* Wallet Balance Information */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-700">موجودی کیف پول مشتری</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {orderDetailsWalletBalance.toLocaleString()} IQD
                      </div>
                    </div>
                  </div>
                  
                  {/* Addresses */}
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {/* Shipping Address */}
                    {orderDetails.shippingAddress && (
                      <div>
                        <h4 className="font-semibold mb-2 text-blue-700">📍 آدرس تحویل:</h4>
                        <div className="text-sm bg-blue-50 p-3 rounded border-r-4 border-blue-500">
                          <p><strong>نام گیرنده:</strong> {orderDetails.shippingAddress.name}</p>
                          <p><strong>تلفن:</strong> {orderDetails.shippingAddress.phone}</p>
                          <p><strong>آدرس کامل:</strong> {orderDetails.shippingAddress.address}</p>
                          <p><strong>شهر:</strong> {orderDetails.shippingAddress.city}</p>
                          {orderDetails.shippingAddress.postalCode && (
                            <p><strong>کد پستی:</strong> {orderDetails.shippingAddress.postalCode}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Billing Address */}
                    {orderDetails.billingAddress && (
                      <div>
                        <h4 className="font-semibold mb-2 text-green-700">🏢 آدرس صورتحساب:</h4>
                        <div className="text-sm bg-green-50 p-3 rounded border-r-4 border-green-500">
                          <p><strong>نام:</strong> {orderDetails.billingAddress.name}</p>
                          <p><strong>تلفن:</strong> {orderDetails.billingAddress.phone}</p>
                          <p><strong>آدرس:</strong> {orderDetails.billingAddress.address}</p>
                          <p><strong>شهر:</strong> {orderDetails.billingAddress.city}</p>
                          {orderDetails.billingAddress.postalCode && (
                            <p><strong>کد پستی:</strong> {orderDetails.billingAddress.postalCode}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>اقلام سفارش</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {orderDetails.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded bg-gray-50">
                        <div className="flex-1">
                          <div className="font-medium">{item.productName || item.name || 'نامشخص'}</div>
                          {item.sku && <div className="text-sm text-gray-500">SKU: {item.sku}</div>}
                        </div>
                        <div className="text-center px-4">
                          <div className="text-sm text-gray-500">تعداد</div>
                          <div className="font-medium">{item.quantity || 1}</div>
                        </div>
                        <div className="text-center px-4">
                          <div className="text-sm text-gray-500">قیمت واحد</div>
                          <div className="font-medium">{parseFloat(item.unitPrice || item.price || 0).toLocaleString()} IQD</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">مجموع</div>
                          <div className="font-bold text-blue-600">
                            {(parseFloat(item.unitPrice || item.price || 0) * parseInt(item.quantity || 1)).toLocaleString()} IQD
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Order Totals */}
                    <div className="mt-4 pt-4 border-t bg-blue-50 p-4 rounded">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>جمع کالاها:</span>
                          <span className="font-medium">
                            {(() => {
                              const itemsTotal = orderDetails.items?.reduce((sum: number, item: any) => {
                                return sum + (parseFloat(item.unitPrice || item.price || 0) * parseInt(item.quantity || 1));
                              }, 0) || 0;
                              return itemsTotal.toLocaleString();
                            })()} IQD
                          </span>
                        </div>
                        {orderDetails.shippingCost && parseFloat(orderDetails.shippingCost) > 0 && (
                          <div className="flex justify-between">
                            <span>هزینه ارسال:</span>
                            <span className="font-medium">{parseFloat(orderDetails.shippingCost).toLocaleString()} IQD</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-blue-700 border-t pt-2">
                          <span>مجموع کل:</span>
                          <span>{parseFloat(orderDetails.totalAmount || 0).toLocaleString()} IQD</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span>روش پرداخت: </span>
                          <span className="font-medium">
                            {orderDetails.paymentMethod === 'bank_transfer_grace' ? 'حواله بانکی (مهلت‌دار)' : 
                             orderDetails.paymentMethod === 'bank_transfer' ? 'حواله بانکی' :
                             orderDetails.paymentMethod === 'cash_on_delivery' ? 'پرداخت در محل' :
                             orderDetails.paymentMethod || 'نامشخص'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handlePrintOrder}>
                  <Download className="w-4 h-4 mr-1" />
                  چاپ
                </Button>
                <Button variant="destructive" onClick={handleRejectOrder}>
                  رد
                </Button>
                <Button onClick={handleAcceptOrder}>
                  تایید
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FinanceOrders;
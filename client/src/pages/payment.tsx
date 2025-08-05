import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, CreditCard, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PaymentGateway from "@/components/checkout/payment-gateway";

export default function Payment() {
  console.log('🚀 [PAYMENT COMPONENT] Payment component starting to load...');
  
  const [, params] = useRoute('/payment/:orderId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [walletAmount, setWalletAmount] = useState<number>(0);

  console.log('🚀 [PAYMENT COMPONENT] useRoute params:', params);
  
  // Also try URL params directly
  const urlParams = new URLSearchParams(window.location.search);
  const orderIdFromUrl = urlParams.get('orderId');
  const orderIdFromPath = params?.orderId;
  
  console.log('🚀 [PAYMENT COMPONENT] URL Params orderId:', orderIdFromUrl);
  console.log('🚀 [PAYMENT COMPONENT] Path Params orderId:', orderIdFromPath);
  
  // Keep orderId as string since orderNumber is a string (like "M123456")
  const orderId = orderIdFromPath || orderIdFromUrl;
  
  console.log('🚀 [PAYMENT COMPONENT] Final Order ID:', orderId);
  console.log('🚀 [PAYMENT COMPONENT] Window location:', window.location.href);

  // Fetch order details
  const { data: orderData, isLoading: orderLoading, error: orderError } = useQuery({
    queryKey: [`/api/customers/orders/${orderId}/payment`],
    enabled: !!orderId,
  });

  // Debug order query issues
  useEffect(() => {
    if (orderError) {
      console.error('🔍 [ORDER QUERY ERROR]:', orderError);
    }
  }, [orderError]);

  // Fetch active payment gateway
  const { data: activeGateway, isLoading: gatewayLoading } = useQuery({
    queryKey: ['/api/payment/active-gateway'],
    enabled: !!orderId,
  });

  // Read wallet amount from localStorage
  useEffect(() => {
    if (orderId) {
      const savedWalletAmount = localStorage.getItem(`wallet_amount_${orderId}`);
      if (savedWalletAmount) {
        const amount = parseFloat(savedWalletAmount);
        setWalletAmount(amount);
        console.log('💾 [LOCALSTORAGE] Retrieved wallet amount for order', orderId, ':', amount);
      } else {
        console.log('💾 [LOCALSTORAGE] No wallet amount found for order', orderId);
      }
    }
  }, [orderId]);

  // Debug active gateway data
  useEffect(() => {
    console.log('🔍 [PAYMENT PAGE DEBUG] Order ID:', orderId);
    console.log('🔍 [PAYMENT PAGE DEBUG] Active gateway data:', activeGateway);
    console.log('🔍 [PAYMENT PAGE DEBUG] Gateway loading:', gatewayLoading);
    console.log('🔍 [PAYMENT PAGE DEBUG] Order data:', orderData);
    console.log('🔍 [PAYMENT PAGE DEBUG] Order loading:', orderLoading);
    console.log('🔍 [PAYMENT PAGE DEBUG] Wallet amount from localStorage:', walletAmount);
    
    if (orderData && activeGateway) {
      const order = (orderData as any)?.order || orderData;
      console.log('🔍 [PAYMENT PAGE DEBUG] Payment method from order:', (order as any)?.paymentMethod);
      console.log('🔍 [PAYMENT PAGE DEBUG] Will auto-redirect?', (order as any)?.paymentMethod === 'online_payment');
    }
  }, [orderId, activeGateway, gatewayLoading, orderData, orderLoading, walletAmount]);

  // Update payment status mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      console.log('💰 [PAYMENT UPDATE] Sending payment data:', paymentData);
      return apiRequest(`/api/shop/orders/${orderId}/payment`, {
        method: 'POST',
        body: paymentData
      });
    },
    onSuccess: (response, variables) => {
      console.log('✅ [PAYMENT UPDATE] Payment update successful:', response);
      
      toast({
        title: "پرداخت تایید شد",
        description: "پرداخت شما ثبت شد و در حال تولید فاکتور است.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/shop/orders'] });
      queryClient.invalidateQueries({ queryKey: [`/api/customers/orders/${orderId}/payment`] });
      
      // Auto-generate invoice after successful payment - no manual intervention needed
      console.log('📄 [INVOICE] Auto-generating invoice...');
      generateInvoiceMutation.mutate();
    },
    onError: (error) => {
      console.error('❌ [PAYMENT UPDATE] Payment update failed:', error);
      toast({
        title: "خطا در ثبت پرداخت",
        description: "پرداخت انجام شد ولی ثبت آن با مشکل مواجه شد. با پشتیبانی تماس بگیرید.",
        variant: "destructive",
      });
    },
  });

  // Generate invoice mutation
  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      console.log('📄 [INVOICE GENERATION] Starting invoice generation for order:', orderId);
      return apiRequest('/api/invoices', {
        method: 'POST',
        body: {
          orderId: orderId,
          customerId: (orderData as any)?.customerId || (orderData as any)?.order?.customerId,
          language: 'ar' // Default to Arabic, can be made configurable
        }
      });
    },
    onSuccess: (response) => {
      console.log('✅ [INVOICE GENERATION] Invoice generated successfully:', response);
      
      toast({
        title: "فاکتور ایجاد شد",
        description: "فاکتور شما ایجاد شد و به ایمیل ارسال خواهد شد. در حال هدایت...",
      });
      
      // Clear any cached order data
      queryClient.invalidateQueries({ queryKey: ['/api/shop/orders'] });
      queryClient.invalidateQueries({ queryKey: [`/api/customers/orders/${orderId}/payment`] });
      
      // Immediate redirect to success page - fully automated
      console.log('🚀 [REDIRECT] Auto-redirecting to success page in 1.5 seconds');
      setTimeout(() => {
        setLocation(`/checkout/success/${orderId}`);
      }, 1500); // Reduced delay for faster UX
    },
    onError: (error) => {
      console.error('❌ [INVOICE GENERATION] Invoice generation failed:', error);
      
      toast({
        title: "مشکل در ایجاد فاکتور",
        description: "پرداخت موفق بود ولی فاکتور ایجاد نشد. با پشتیبانی تماس بگیرید.",
        variant: "destructive",
      });
      
      // Even if invoice fails, redirect to success page since payment was successful
      setTimeout(() => {
        setLocation(`/checkout/success/${orderId}`);
      }, 3000);
    },
  });

  const handlePaymentSuccess = (paymentResult: any) => {
    console.log('✅ [PAYMENT SUCCESS] Processing payment success:', paymentResult);
    setPaymentData(paymentResult);
    setPaymentProcessed(true);
    
    // Clear cart after successful payment
    console.log('🧹 [CART CLEAR] Clearing cart after successful payment');
    apiRequest('/api/cart/clear', { method: 'POST' })
      .then(() => console.log('✅ [CART CLEAR] Cart cleared successfully'))
      .catch(err => console.warn('⚠️ [CART CLEAR] Failed to clear cart:', err));
    
    // Clear localStorage for this order
    localStorage.removeItem(`wallet_amount_${orderId}`);
    console.log('🧹 [CLEANUP] Removed localStorage data for order:', orderId);
    
    // Immediate success notification
    toast({
      title: "پرداخت موفق",
      description: "پرداخت شما با موفقیت انجام شد. در حال تولید فاکتور...",
    });
    
    // Update order with payment information and automatically generate invoice
    updatePaymentMutation.mutate({
      paymentStatus: 'paid',
      paymentMethod: paymentResult.method,
      transactionId: paymentResult.transactionId,
      paymentData: paymentResult,
      autoComplete: true // Flag to indicate this should auto-complete
    });
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IQD',
    }).format(amount);
  };

  if (orderLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Order Not Found</h2>
            <p className="text-gray-500 mb-6">The order you're trying to pay for could not be found.</p>
            <Button onClick={() => setLocation("/shop")} className="w-full">
              Back to Shop
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const order = (orderData as any)?.order || orderData;

  // Skip payment for cash on delivery and company credit
  if ((order as any).paymentMethod === 'cash_on_delivery' || (order as any).paymentMethod === 'company_credit') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
            <p className="text-gray-600 mb-2">Thank you for your order.</p>
            <p className="text-lg font-semibold text-gray-900 mb-6">
              Order Number: #{order.orderNumber}
            </p>
            <div className="space-y-3">
              <Button onClick={() => setLocation("/shop")} className="w-full">
                Continue Shopping
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/")}
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentProcessed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-2">Your payment has been processed successfully.</p>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Order Number: #{order.orderNumber}
            </p>
            <p className="text-lg font-semibold text-green-600 mb-6">
              Amount Paid: {formatCurrency(order.totalAmount)}
            </p>
            {paymentData && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
                <p className="font-mono text-sm text-gray-900">{paymentData.transactionId}</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-8">
              Your invoice is being generated and will be sent to your email shortly.
            </p>
            <div className="space-y-3">
              <Button onClick={() => setLocation("/shop")} className="w-full">
                Continue Shopping
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/")}
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
          <p className="text-gray-600">Secure payment for Order #{order.orderNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Gateway */}
          <div className="lg:col-span-2">
            {gatewayLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>در حال بارگذاری درگاه پرداخت...</p>
                </CardContent>
              </Card>
            ) : activeGateway ? (
              <PaymentGateway
                paymentMethod={order.paymentMethod}
                totalAmount={parseFloat(order.totalAmount)}
                orderId={order.orderNumber}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                walletAmount={walletAmount}
                activeGateway={activeGateway}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">درگاه پرداخت در دسترس نیست</h3>
                  <p className="text-gray-500 mb-6">در حال حاضر هیچ درگاه پرداخت فعالی موجود نیست. لطفاً با پشتیبانی تماس بگیرید.</p>
                  <Button onClick={() => setLocation("/shop")} className="w-full">
                    بازگشت به فروشگاه
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {order.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.productName} × {item.quantity}</span>
                      <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.itemsSubtotal || order.totalAmount)}</span>
                  </div>
                  {order.shippingAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{formatCurrency(order.shippingAmount)}</span>
                    </div>
                  )}
                  {order.vatAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Tax (VAT)</span>
                      <span>{formatCurrency(order.vatAmount)}</span>
                    </div>
                  )}
                  {order.dutiesAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Duties</span>
                      <span>{formatCurrency(order.dutiesAmount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Payment Method</h4>
                  <Badge variant="outline" className="bg-blue-100">
                    {order.paymentMethod === 'iraqi_bank' ? 'Iraqi Bank Transfer' :
                     order.paymentMethod === 'credit_card' ? 'Credit/Debit Card' :
                     order.paymentMethod === 'bank_transfer' ? 'International Bank Transfer' :
                     order.paymentMethod === 'digital_wallet' ? 'Digital Wallet' :
                     order.paymentMethod}
                  </Badge>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Secured by 256-bit SSL encryption
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
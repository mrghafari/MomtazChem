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
  const [, params] = useRoute('/payment/:orderId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const orderId = params?.orderId ? parseInt(params.orderId) : null;

  // Fetch order details
  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ['/api/shop/orders', orderId],
    enabled: !!orderId,
  });

  // Update payment status mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return apiRequest(`/api/shop/orders/${orderId}/payment`, 'POST', paymentData);
    },
    onSuccess: () => {
      toast({
        title: "Payment Processed",
        description: "Your payment has been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/orders'] });
      
      // Generate invoice after successful payment
      generateInvoiceMutation.mutate();
    },
    onError: () => {
      toast({
        title: "Payment Update Failed",
        description: "Failed to update payment status.",
        variant: "destructive",
      });
    },
  });

  // Generate invoice mutation
  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/invoices', 'POST', {
        orderId: orderId,
        customerId: orderData?.customerId,
        language: 'ar' // Default to Arabic, can be made configurable
      });
    },
    onSuccess: () => {
      toast({
        title: "Invoice Generated",
        description: "Your invoice has been generated and will be sent to your email.",
      });
      
      // Redirect to success page
      setTimeout(() => {
        setLocation(`/checkout/success/${orderId}`);
      }, 2000);
    },
    onError: () => {
      toast({
        title: "Invoice Generation Failed",
        description: "Payment successful but invoice generation failed. Please contact support.",
        variant: "destructive",
      });
    },
  });

  const handlePaymentSuccess = (paymentResult: any) => {
    setPaymentData(paymentResult);
    setPaymentProcessed(true);
    
    // Update order with payment information
    updatePaymentMutation.mutate({
      paymentStatus: 'paid',
      paymentMethod: paymentResult.method,
      transactionId: paymentResult.transactionId,
      paymentData: paymentResult
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

  const order = orderData;

  // Skip payment for cash on delivery and company credit
  if (order.paymentMethod === 'cash_on_delivery' || order.paymentMethod === 'company_credit') {
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
            <PaymentGateway
              paymentMethod={order.paymentMethod}
              totalAmount={order.totalAmount}
              orderId={order.orderNumber}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
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
                    <span>{formatCurrency(order.totalAmount - (order.totalAmount * 0.09) - 50)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{formatCurrency(50)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (9%)</span>
                    <span>{formatCurrency(order.totalAmount * 0.09)}</span>
                  </div>
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
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ShoppingCart, CreditCard, Truck, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import AddressSelector from "@/components/checkout/address-selector";
import AuthModal from "@/components/checkout/auth-modal";

// Dynamic checkout form validation schema - required fields only if not logged in
const createCheckoutFormSchema = (isLoggedIn: boolean) => z.object({
  // Customer Information (required if not logged in)
  email: isLoggedIn ? z.string().optional() : z.string().email("Please enter a valid email address"),
  firstName: isLoggedIn ? z.string().optional() : z.string().min(2, "First name must be at least 2 characters"),
  lastName: isLoggedIn ? z.string().optional() : z.string().min(2, "Last name must be at least 2 characters"),
  phone: isLoggedIn ? z.string().optional() : z.string().min(10, "Please enter a valid phone number"),
  company: z.string().optional(),
  
  // Billing Address (pre-filled if logged in)
  billingAddress1: z.string().min(5, "Address is required"),
  billingAddress2: z.string().optional(),
  billingCity: z.string().min(2, "City is required"),
  billingState: z.string().min(2, "State/Province is required"),
  billingPostalCode: z.string().min(3, "Postal code is required"),
  billingCountry: z.string().min(2, "Country is required"),
  
  // Shipping Address
  sameAsShipping: z.boolean().default(true),
  shippingAddress1: z.string().optional(),
  shippingAddress2: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),
  
  // Order Details
  shippingMethod: z.string().min(1, "Please select a shipping method"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<ReturnType<typeof createCheckoutFormSchema>>;

interface CheckoutProps {
  cart: {[key: number]: number};
  products: any[];
  onOrderComplete: () => void;
}

export default function Checkout({ cart, products, onOrderComplete }: CheckoutProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletAmountToUse, setWalletAmountToUse] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Get customer information if logged in
  const { data: customerData, refetch: refetchCustomer } = useQuery<any>({
    queryKey: ["/api/customers/me"],
    retry: false,
  });

  // Get available delivery methods
  const { data: deliveryMethods = [] } = useQuery({
    queryKey: ['/api/checkout/delivery-methods']
  });

  // Determine if user is logged in first
  const isUserLoggedIn = (customerData?.success && customerData.customer) || isLoggedIn;
  
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(createCheckoutFormSchema(!!isUserLoggedIn)),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      company: "",
      billingAddress1: "",
      billingAddress2: "",
      billingCity: "",
      billingState: "",
      billingPostalCode: "",
      billingCountry: "Iran",
      sameAsShipping: true,
      shippingMethod: "",
      paymentMethod: "",
      notes: "",
    },
  });

  // Auto-fill form with customer data when available
  useEffect(() => {
    if (customerData?.success && customerData.customer) {
      const customer = customerData.customer;
      setIsLoggedIn(true);
      
      // Fill form with customer data from CRM
      form.setValue("email", customer.email || "");
      form.setValue("firstName", customer.firstName || "");
      form.setValue("lastName", customer.lastName || "");
      form.setValue("phone", customer.phone || "");
      form.setValue("company", customer.company || "");
      
      // Auto-fill address data from CRM
      if (customer.address) {
        form.setValue("billingAddress1", customer.address);
      }
      if (customer.city) {
        form.setValue("billingCity", customer.city);
      }
      if (customer.country) {
        form.setValue("billingCountry", customer.country);
      }
      if (customer.postalCode) {
        form.setValue("billingPostalCode", customer.postalCode);
      }
      // Since customer has complete address info, set state/province to city for simplicity
      if (customer.city) {
        form.setValue("billingState", customer.city);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, [customerData, form, isLoggedIn]);

  // Update form validation when authentication status changes
  useEffect(() => {
    // Re-create form with new validation schema based on login status
    const newResolver = zodResolver(createCheckoutFormSchema(!!isUserLoggedIn));
    form.clearErrors(); // Clear any existing validation errors
    // Force form re-validation
    setTimeout(() => {
      form.trigger();
    }, 100);
  }, [isUserLoggedIn, form]);

  // Fetch wallet balance for logged in users
  const fetchWalletBalance = async () => {
    if (!isUserLoggedIn) return;
    
    try {
      const response = await fetch('/api/customers/wallet/balance', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWalletBalance(result.balance || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  useEffect(() => {
    if (isUserLoggedIn) {
      fetchWalletBalance();
    }
  }, [isUserLoggedIn]);

  // Calculate order totals
  const cartItems = Object.entries(cart).map(([productId, quantity]) => {
    const product = products.find(p => p.id === parseInt(productId));
    return product ? {
      ...product,
      quantity,
      totalPrice: parseFloat(product.price) * quantity
    } : null;
  }).filter(Boolean);

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate shipping cost based on selected delivery method
  const selectedMethod = deliveryMethods.find(method => method.id.toString() === form.watch('shippingMethod'));
  let shippingCost = 0;
  
  if (selectedMethod) {
    const baseCost = parseFloat(selectedMethod.baseCost || '0');
    const freeShippingThreshold = parseFloat(selectedMethod.freeShippingThreshold || '0');
    
    if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
      shippingCost = 0; // Free shipping
    } else {
      shippingCost = baseCost;
      // Add weight-based cost if available
      if (selectedMethod.costPerKg) {
        const totalWeight = cartItems.reduce((sum, item) => sum + (parseFloat(item.weight || '1') * item.quantity), 0);
        shippingCost += parseFloat(selectedMethod.costPerKg) * totalWeight;
      }
    }
  }
  
  const taxRate = 0.09; // 9% tax
  const taxAmount = subtotal * taxRate;
  const beforeWalletTotal = subtotal + shippingCost + taxAmount;
  
  // Calculate wallet usage
  const maxWalletUsage = Math.min(walletBalance, beforeWalletTotal);
  const actualWalletUsage = useWallet ? Math.min(walletAmountToUse, maxWalletUsage) : 0;
  const totalAmount = beforeWalletTotal - actualWalletUsage;

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest("/api/shop/orders", "POST", orderData);
    },
    onSuccess: (data: any) => {
      const orderId = data.order.id;
      const paymentMethod = data.order.paymentMethod;
      
      // Check if payment processing is required
      const requiresPayment = ['iraqi_bank', 'credit_card', 'bank_transfer', 'digital_wallet'].includes(paymentMethod);
      
      if (requiresPayment) {
        // Redirect to payment page for processing
        setLocation(`/payment/${orderId}`);
      } else {
        // For cash on delivery and company credit, go directly to success
        setOrderNumber(orderId);
        setIsOrderComplete(true);
        onOrderComplete();
      }
      
      toast({
        title: "Order Placed Successfully!",
        description: `Your order #${orderId} has been created.`,
      });
    },
    onError: () => {
      toast({
        title: "Order Failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CheckoutFormData) => {
    // Use selected address for logged in users, otherwise use form data
    let customerInfo;
    
    if (isLoggedIn && selectedAddress) {
      // Use selected address from address selector
      customerInfo = {
        email: customerData?.customer?.email || data.email,
        firstName: selectedAddress.firstName,
        lastName: selectedAddress.lastName,
        phone: selectedAddress.phone,
        company: selectedAddress.company || '',
        country: selectedAddress.country,
        city: selectedAddress.city,
        address: `${selectedAddress.address}${selectedAddress.postalCode ? `, ${selectedAddress.postalCode}` : ''}`,
      };
    } else {
      // Use form data for non-logged in users
      const shippingAddress = data.sameAsShipping ? 
        `${data.billingAddress1}, ${data.billingAddress2 || ''}, ${data.billingCity}, ${data.billingState}, ${data.billingPostalCode}, ${data.billingCountry}`.trim() :
        `${data.shippingAddress1}, ${data.shippingAddress2 || ''}, ${data.shippingCity}, ${data.shippingState}, ${data.shippingPostalCode}, ${data.shippingCountry}`.trim();
      
      customerInfo = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        company: data.company || '',
        country: data.billingCountry,
        city: data.billingCity,
        address: shippingAddress,
      };
    }

    const orderData = {
      customerInfo,
      items: cartItems.map(item => ({
        productId: item.id,
        productName: item.name,
        productSku: item.sku || '',
        quantity: item.quantity,
        unitPrice: parseFloat(item.price),
      })),
      totalAmount: beforeWalletTotal,
      notes: data.notes || '',
      shippingMethod: data.shippingMethod,
      paymentMethod: actualWalletUsage >= beforeWalletTotal ? 'wallet_full' : 
                    actualWalletUsage > 0 ? 'wallet_partial' : data.paymentMethod,
      walletAmountUsed: actualWalletUsage,
      remainingAmount: totalAmount,
    };

    createOrderMutation.mutate(orderData);
  };

  if (Object.keys(cart).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some products to your cart to proceed with checkout.</p>
            <Button onClick={() => setLocation("/shop")} className="w-full">
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isOrderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
            <p className="text-gray-600 mb-2">Thank you for your order.</p>
            <p className="text-lg font-semibold text-gray-900 mb-6">
              Order Number: #{orderNumber}
            </p>
            <p className="text-sm text-gray-500 mb-8">
              You will receive an email confirmation shortly with tracking information.
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
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order details below</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {!isUserLoggedIn ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Welcome to Checkout</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8 space-y-6">
                  <User className="w-16 h-16 text-gray-300 mx-auto" />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Choose an option to continue</h3>
                    <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
                      <Button 
                        onClick={() => {
                          setAuthMode('login');
                          setAuthModalOpen(true);
                        }}
                        variant="default"
                        className="h-12 text-base"
                      >
                        Login to Existing Account
                      </Button>
                      <Button 
                        onClick={() => {
                          setAuthMode('register');
                          setAuthModalOpen(true);
                        }}
                        variant="outline"
                        className="h-12 text-base"
                      >
                        Create New Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Customer Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Customer Information
                        {isUserLoggedIn && (
                          <Badge variant="secondary" className="ml-2">
                            Auto-filled from account
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name {!isUserLoggedIn && "*"}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name {!isUserLoggedIn && "*"}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address {!isUserLoggedIn && "*"}</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number {!isUserLoggedIn && "*"}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Address Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      آدرس تحویل
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isUserLoggedIn ? (
                      <AddressSelector
                        selectedAddressId={selectedAddress?.id}
                        onAddressSelect={(address) => {
                          setSelectedAddress(address);
                          // Auto-fill form fields from selected address
                          form.setValue('billingAddress1', address.address);
                          form.setValue('billingCity', address.city);
                          form.setValue('billingState', address.state || '');
                          form.setValue('billingPostalCode', address.postalCode || '');
                          form.setValue('billingCountry', address.country);
                        }}
                      />
                    ) : (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="billingAddress1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>آدرس کامل *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="billingCity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>شهر *</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="billingPostalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>کد پستی</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Delivery Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      روش ارسال
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="shippingMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>انتخاب روش ارسال *</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="روش ارسال را انتخاب کنید" />
                              </SelectTrigger>
                              <SelectContent>
                                {deliveryMethods.map((method: any) => {
                                  const freeShippingThreshold = parseFloat(method.freeShippingThreshold || '0');
                                  const qualifiesForFreeShipping = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold;
                                  const baseCost = parseFloat(method.baseCost || '0');
                                  
                                  return (
                                    <SelectItem key={method.id} value={method.id.toString()}>
                                      <div className="flex items-center justify-between w-full">
                                        <span>{method.label}</span>
                                        <span className="ml-2 text-sm">
                                          {qualifiesForFreeShipping ? 'رایگان' : `${baseCost.toLocaleString()} IQD`}
                                          {method.estimatedDays && ` (${method.estimatedDays} روز)`}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Show delivery details */}
                    {selectedMethod && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>هزینه ارسال:</span>
                            <span className="font-medium">
                              {shippingCost === 0 ? 'رایگان' : `${shippingCost.toLocaleString()} IQD`}
                            </span>
                          </div>
                          {selectedMethod.freeShippingThreshold && parseFloat(selectedMethod.freeShippingThreshold) > 0 && (
                            <div className="text-xs text-green-600 dark:text-green-400">
                              {subtotal >= parseFloat(selectedMethod.freeShippingThreshold) 
                                ? `✓ ارسال رایگان برای خریدهای بالای ${parseFloat(selectedMethod.freeShippingThreshold).toLocaleString()} IQD`
                                : `برای ارسال رایگان ${(parseFloat(selectedMethod.freeShippingThreshold) - subtotal).toLocaleString()} IQD بیشتر خرید کنید`
                              }
                            </div>
                          )}
                          {selectedMethod.description && (
                            <div className="text-xs text-muted-foreground">
                              {selectedMethod.description}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      روش پرداخت
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>انتخاب روش پرداخت *</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="روش پرداخت را انتخاب کنید" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bank_receipt">ارسال فیش واریزی بانکی (Bank Receipt Upload)</SelectItem>
                                <SelectItem value="online_payment">پرداخت آنلاین (Online Payment)</SelectItem>
                                <SelectItem value="cash_on_delivery">پرداخت نقدی هنگام تحویل (Cash on Delivery)</SelectItem>
                                <SelectItem value="company_credit">حساب اعتباری شرکت (Company Credit)</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Wallet Payment Section */}
                    {isUserLoggedIn && walletBalance > 0 && (
                      <div className="p-4 bg-green-50 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-green-800">موجودی کیف پول</h4>
                            <p className="text-sm text-green-600">{walletBalance.toLocaleString()} IQD موجود است</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="useWallet"
                              checked={useWallet}
                              onChange={(e) => {
                                setUseWallet(e.target.checked);
                                if (e.target.checked) {
                                  setWalletAmountToUse(Math.min(walletBalance, beforeWalletTotal));
                                } else {
                                  setWalletAmountToUse(0);
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor="useWallet" className="text-sm font-medium text-green-700">
                              استفاده از کیف پول
                            </label>
                          </div>
                        </div>
                        
                        {useWallet && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-green-700">
                              مبلغ مورد استفاده از کیف پول (IQD)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={maxWalletUsage}
                              value={walletAmountToUse}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                setWalletAmountToUse(Math.min(value, maxWalletUsage));
                              }}
                              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder={`حداکثر ${maxWalletUsage.toLocaleString()} IQD`}
                            />
                            <div className="flex justify-between text-xs text-green-600">
                              <span>موجودی: {walletBalance.toLocaleString()} IQD</span>
                              <span>حداکثر قابل استفاده: {maxWalletUsage.toLocaleString()} IQD</span>
                            </div>
                            
                            {actualWalletUsage > 0 && (
                              <div className="mt-2 p-2 bg-green-100 rounded text-sm text-green-800">
                                <div className="flex justify-between">
                                  <span>مبلغ از کیف پول:</span>
                                  <span className="font-semibold">-{actualWalletUsage.toLocaleString()} IQD</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>مبلغ باقی‌مانده:</span>
                                  <span className="font-semibold">{totalAmount.toLocaleString()} IQD</span>
                                </div>
                                {actualWalletUsage >= beforeWalletTotal && (
                                  <div className="mt-1 text-green-700 font-medium">
                                    ✓ سفارش کاملاً با کیف پول پرداخت می‌شود
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Special delivery instructions or additional information..."
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? "Processing Order..." : "Place Order"}
                  </Button>
                </form>
              </Form>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">
                        {item.quantity} × ${item.price}
                      </p>
                    </div>
                    <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>جمع کالاها:</span>
                    <span>{subtotal.toLocaleString()} IQD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>هزینه ارسال:</span>
                    <span>{shippingCost === 0 ? "رایگان" : `${shippingCost.toLocaleString()} IQD`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مالیات (9%):</span>
                    <span>{taxAmount.toLocaleString()} IQD</span>
                  </div>
                  <Separator />
                  {actualWalletUsage > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>کیف پول استفاده شده:</span>
                      <span>-{actualWalletUsage.toLocaleString()} IQD</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>مجموع قابل پرداخت:</span>
                    <span>{totalAmount.toLocaleString()} IQD</span>
                  </div>
                </div>

                {shippingCost === 0 && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800">
                      🎉 شما واجد شرایط ارسال رایگان هستید!
                    </p>
                  </div>
                )}
                
                {actualWalletUsage >= beforeWalletTotal && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💳 این سفارش کاملاً با کیف پول شما پرداخت خواهد شد
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={async () => {
          setAuthModalOpen(false);
          // Refetch customer data to update authentication status
          await refetchCustomer();
          setIsLoggedIn(true);
          // Force form to re-validate with new authentication status
          form.trigger();
          // Show success message
          toast({
            title: "ورود موفق",
            description: "اکنون می‌توانید خرید خود را تکمیل کنید",
          });
        }}
        initialMode={authMode}
      />
    </div>
  );
}
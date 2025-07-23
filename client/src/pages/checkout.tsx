import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { CheckCircle, ShoppingCart, CreditCard, Truck, User, MapPin } from "lucide-react";
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
  
  // Recipient Information (can be different from customer)
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  recipientAddress: z.string().optional(),
  
  // Second Address Fields
  secondDeliveryAddress: z.string().optional(),
  secondDeliveryCity: z.string().optional(),
  secondDeliveryProvince: z.string().optional(),
  secondDeliveryPostalCode: z.string().optional(),
  recipientMobile: z.string().optional(),
  
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
  const [useSecondaryAddress, setUseSecondaryAddress] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletAmountToUse, setWalletAmountToUse] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [secondaryPaymentMethod, setSecondaryPaymentMethod] = useState('');
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [showRecipientFields, setShowRecipientFields] = useState(true); // Default to open for testing
  const [showPurchaseOrder, setShowPurchaseOrder] = useState(true);
  const [showCartManagement, setShowCartManagement] = useState(true);
  const [showSecondAddress, setShowSecondAddress] = useState(false);
  const [showRecipientMobile, setShowRecipientMobile] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

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
      
      // Auto-fill address data from CRM as default delivery address
      if (customer.address) {
        form.setValue("billingAddress1", customer.address);
        form.setValue("shippingAddress1", customer.address); // Set as default shipping address
      }
      if (customer.city) {
        form.setValue("billingCity", customer.city);
        form.setValue("shippingCity", customer.city); // Set as default shipping city
      }
      if (customer.country) {
        form.setValue("billingCountry", customer.country);
        form.setValue("shippingCountry", customer.country); // Set as default shipping country
      }
      if (customer.postalCode) {
        form.setValue("billingPostalCode", customer.postalCode);
        form.setValue("shippingPostalCode", customer.postalCode); // Set as default shipping postal code
      }
      // Use province/state from CRM as default
      const defaultState = customer.province || customer.state || customer.city || "";
      if (defaultState) {
        form.setValue("billingState", defaultState);
        form.setValue("shippingState", defaultState); // Set as default shipping state
      }
      
      // Auto-fill recipient information with customer data as default
      if (customer.firstName && customer.lastName) {
        form.setValue("recipientName", `${customer.firstName} ${customer.lastName}`);
      }
      if (customer.phone) {
        form.setValue("recipientPhone", customer.phone);
        form.setValue("recipientMobile", customer.phone); // Set as default recipient mobile
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



  // Move this useEffect after beforeWalletTotal calculation

  useEffect(() => {
    if (isUserLoggedIn) {
      fetchWalletBalance();
    }
  }, [isUserLoggedIn]);

  // Set customer info from query data
  useEffect(() => {
    if (customerData && customerData.user) {
      setCustomerInfo(customerData.user);
    }
  }, [customerData]);

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
  const selectedMethod = (deliveryMethods as any[])?.find((method: any) => method.id.toString() === form.watch('shippingMethod'));
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
  
  // Fetch tax settings for dynamic VAT calculation
  const { data: taxSettingsResponse } = useQuery({
    queryKey: ['/api/tax-settings'],
    queryFn: () => apiRequest('/api/tax-settings', 'GET'),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Extract tax settings array from response
  const taxSettings = taxSettingsResponse?.data || [];

  // Calculate VAT and duties from database settings
  // Handle both VAT and vat types for backward compatibility
  const vatSetting = taxSettings?.find(setting => 
    (setting.type === 'VAT' || setting.type === 'vat') && setting.isEnabled
  );
  const dutiesSetting = taxSettings?.find(setting => setting.type === 'duties' && setting.isEnabled);
  
  const vatRate = vatSetting ? parseFloat(vatSetting.rate) / 100 : 0; // Convert percentage to decimal
  const dutiesRate = dutiesSetting ? parseFloat(dutiesSetting.rate) / 100 : 0;
  
  const vatAmount = subtotal * vatRate;
  const dutiesAmount = subtotal * dutiesRate;
  const totalTaxAmount = vatAmount + dutiesAmount;
  
  // Debug logging for tax calculations
  console.log('🧮 Tax Debug:', {
    taxSettings,
    vatSetting,
    dutiesSetting,
    vatRate,
    dutiesRate,
    subtotal,
    vatAmount,
    dutiesAmount,
    totalTaxAmount
  });
  
  const beforeWalletTotal = subtotal + shippingCost + totalTaxAmount;
  
  // Auto-enable wallet usage when wallet payment methods are selected
  useEffect(() => {
    const paymentMethod = form.watch('paymentMethod');
    if (paymentMethod === 'wallet_payment' || paymentMethod === 'wallet_combined') {
      setUseWallet(true);
      if (paymentMethod === 'wallet_payment') {
        // For full wallet payment, use maximum possible amount
        setWalletAmountToUse(Math.min(walletBalance, beforeWalletTotal));
      } else {
        // For combined payment, start with partial amount
        setWalletAmountToUse(Math.min(walletBalance, beforeWalletTotal * 0.5));
      }
    }
  }, [form.watch('paymentMethod'), walletBalance, beforeWalletTotal]);
  
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
      
      // Invalidate wallet balance cache if wallet payment was used
      if (actualWalletUsage > 0) {
        queryClient.invalidateQueries({ queryKey: ['/api/customers/wallet/balance'] });
        queryClient.invalidateQueries({ queryKey: ['/api/customer/wallet'] });
        
        // Force refresh wallet balance
        fetchWalletBalance();
        
        console.log(`🔄 Wallet balance cache invalidated after ${actualWalletUsage} IQD payment`);
      }
      
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
    // Determine active delivery address and phone based on user input
    let deliveryAddress = '';
    let deliveryCity = '';
    let deliveryProvince = '';
    let deliveryCountry = '';
    let deliveryPostalCode = '';
    let recipientPhone = '';
    let recipientName = '';
    let activeDeliveryInfo = {
      addressSource: '',
      phoneSource: '',
      isSecondAddress: false,
      isDifferentMobile: false
    };
    
    // For logged in users with CRM data
    if (isUserLoggedIn && customerData?.customer) {
      const customer = customerData.customer;
      
      // Check if second address is specified (PRIORITY 1: Second Address)
      if (data.secondDeliveryAddress) {
        // Use second address information
        deliveryAddress = data.secondDeliveryAddress;
        deliveryCity = data.secondDeliveryCity || customer.city || '';
        deliveryProvince = data.secondDeliveryProvince || customer.province || customer.state || '';
        deliveryCountry = customer.country || '';
        deliveryPostalCode = data.secondDeliveryPostalCode || '';
        activeDeliveryInfo.addressSource = 'second_address';
        activeDeliveryInfo.isSecondAddress = true;
      } else {
        // Use CRM default address
        deliveryAddress = customer.address || '';
        deliveryCity = customer.city || '';
        deliveryProvince = customer.province || customer.state || '';
        deliveryCountry = customer.country || '';
        deliveryPostalCode = customer.postalCode || '';
        activeDeliveryInfo.addressSource = 'crm_default';
        activeDeliveryInfo.isSecondAddress = false;
      }
      
      // Check if different recipient mobile is specified (PRIORITY 2: Different Mobile)
      if (data.recipientMobile) {
        // Use specified recipient mobile
        recipientPhone = data.recipientMobile;
        activeDeliveryInfo.phoneSource = 'different_mobile';
        activeDeliveryInfo.isDifferentMobile = true;
      } else {
        // Use customer's default phone from CRM
        recipientPhone = customer.phone || '';
        activeDeliveryInfo.phoneSource = 'crm_default';
        activeDeliveryInfo.isDifferentMobile = false;
      }
      
      // Use customer name as default recipient unless different name specified
      recipientName = data.recipientName || `${customer.firstName} ${customer.lastName}`;
    } else {
      // For non-logged in users, use form data
      const shippingAddress = data.sameAsShipping ? 
        `${data.billingAddress1}, ${data.billingAddress2 || ''}, ${data.billingCity}, ${data.billingState}, ${data.billingPostalCode}, ${data.billingCountry}`.trim() :
        `${data.shippingAddress1}, ${data.shippingAddress2 || ''}, ${data.shippingCity}, ${data.shippingState}, ${data.shippingPostalCode}, ${data.shippingCountry}`.trim();
      
      deliveryAddress = shippingAddress;
      deliveryCity = data.billingCity;
      deliveryProvince = data.billingState;
      deliveryCountry = data.billingCountry;
      deliveryPostalCode = data.billingPostalCode;
      recipientPhone = data.recipientPhone || data.phone || '';
      recipientName = data.recipientName || `${data.firstName} ${data.lastName}`;
      activeDeliveryInfo.addressSource = 'guest_form';
      activeDeliveryInfo.phoneSource = 'guest_form';
    }

    // Prepare customer info
    let customerInfo;
    
    if (isLoggedIn && selectedAddress) {
      // Use selected address from address selector (legacy functionality)
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
    } else if (isUserLoggedIn && customerData?.customer) {
      // Use CRM customer data
      const customer = customerData.customer;
      customerInfo = {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        company: customer.company || '',
        country: deliveryCountry,
        city: deliveryCity,
        address: deliveryAddress,
      };
    } else {
      // Use form data for non-logged in users
      customerInfo = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        company: data.company || '',
        country: deliveryCountry,
        city: deliveryCity,
        address: deliveryAddress,
      };
    }

    // Console log for debugging active delivery logic
    console.log('📍 Active Delivery Info:', {
      addressSource: activeDeliveryInfo.addressSource,
      phoneSource: activeDeliveryInfo.phoneSource,
      isSecondAddress: activeDeliveryInfo.isSecondAddress,
      isDifferentMobile: activeDeliveryInfo.isDifferentMobile,
      deliveryAddress,
      deliveryCity,
      deliveryProvince,
      recipientPhone
    });

    const orderData = {
      customerInfo,
      recipientInfo: {
        recipientName: recipientName,
        recipientPhone: recipientPhone,
        recipientAddress: deliveryAddress,
        deliveryCity: deliveryCity,
        deliveryProvince: deliveryProvince,
        deliveryCountry: deliveryCountry,
        deliveryPostalCode: deliveryPostalCode,
      },
      // Critical: Active delivery details for warehouse and logistics
      activeDeliveryInfo: {
        addressSource: activeDeliveryInfo.addressSource,
        phoneSource: activeDeliveryInfo.phoneSource,
        isSecondAddressUsed: activeDeliveryInfo.isSecondAddress,
        isDifferentPhoneUsed: activeDeliveryInfo.isDifferentMobile,
        activeDeliveryAddress: deliveryAddress,
        activeDeliveryCity: deliveryCity,
        activeDeliveryProvince: deliveryProvince,
        activeDeliveryCountry: deliveryCountry,
        activeDeliveryPostalCode: deliveryPostalCode,
        activeRecipientPhone: recipientPhone,
        activeRecipientName: recipientName,
        // For warehouse and logistics tracking
        warehouseNotes: `آدرس فعال: ${activeDeliveryInfo.isSecondAddress ? 'آدرس دوم' : 'آدرس CRM'} | تلفن فعال: ${activeDeliveryInfo.isDifferentMobile ? 'موبایل متفاوت' : 'تلفن CRM'}`,
      },
      items: cartItems.map(item => ({
        productId: item.id,
        productName: item.name,
        productSku: item.sku || '',
        quantity: item.quantity,
        unitPrice: parseFloat(item.price),
      })),
      totalAmount: beforeWalletTotal,
      shippingCost: shippingCost,
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
                      <div className="space-y-6">
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
                        
                        {/* Secondary Address Option */}
                        {customerInfo?.secondaryAddress && (
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <input
                                type="checkbox"
                                id="useSecondaryAddress"
                                checked={useSecondaryAddress}
                                onChange={(e) => {
                                  setUseSecondaryAddress(e.target.checked);
                                  if (e.target.checked && customerInfo?.secondaryAddress) {
                                    // Auto-fill with secondary address
                                    form.setValue('billingAddress1', customerInfo.secondaryAddress);
                                    form.setValue('billingCity', customerInfo.city || '');
                                    form.setValue('billingState', customerInfo.state || '');
                                    form.setValue('billingPostalCode', customerInfo.postalCode || '');
                                    form.setValue('billingCountry', customerInfo.country || 'Iraq');
                                  } else if (selectedAddress) {
                                    // Revert to selected primary address
                                    form.setValue('billingAddress1', selectedAddress.address);
                                    form.setValue('billingCity', selectedAddress.city);
                                    form.setValue('billingState', selectedAddress.state || '');
                                    form.setValue('billingPostalCode', selectedAddress.postalCode || '');
                                    form.setValue('billingCountry', selectedAddress.country);
                                  }
                                }}
                                className="rounded"
                              />
                              <label htmlFor="useSecondaryAddress" className="text-sm font-medium text-blue-700 dark:text-blue-300 cursor-pointer">
                                استفاده از آدرس دوم (Secondary Address)
                              </label>
                            </div>
                            {useSecondaryAddress && (
                              <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border text-sm">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                  <MapPin className="w-4 h-4" />
                                  <span className="font-medium">آدرس دوم انتخاب شده:</span>
                                </div>
                                <p className="mt-1 text-gray-700 dark:text-gray-300">{customerInfo.secondaryAddress}</p>
                              </div>
                            )}
                          </div>
                        )}
                        

                      </div>
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

                {/* Recipient Information Section - For all users */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      اطلاعات گیرنده
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="font-medium text-purple-800 dark:text-purple-300">اطلاعات گیرنده</span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowRecipientFields(!showRecipientFields)}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                        >
                          {showRecipientFields ? '−' : '+'}
                        </Button>
                      </div>
                      
                      {showRecipientFields && (
                        <div className="mt-4 space-y-4">
                          <div className="text-sm text-purple-600 dark:text-purple-400 mb-3">
                            در صورتی که گیرنده شخص متفاوتی از مشتری است، این فیلدها را پر کنید
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="recipientName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>نام گیرنده</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="نام کامل گیرنده" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="recipientPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>شماره موبایل گیرنده</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="09123456789" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="recipientAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>آدرس دریافت کالا</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder="آدرس کامل محل تحویل" className="min-h-[80px]" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Second Address and Alternative Mobile - Only for logged in users */}
                {isUserLoggedIn && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        آدرس دوم یا شماره موبایل متفاوت
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600 mb-4">
                          در صورت نیاز به آدرس متفاوت یا شماره موبایل جدید برای تحویل، این بخش را پر کنید
                        </div>
                        
                        {/* Second Address Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">آدرس دوم (اختیاری)</label>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setShowSecondAddress(!showSecondAddress);
                                // Disable primary CRM address fields when second address is activated
                                if (!showSecondAddress) {
                                  // When activating second address, clear and disable primary fields
                                  form.setValue("billingAddress1", "");
                                  form.setValue("billingCity", "");
                                  form.setValue("billingState", "");
                                  form.setValue("billingPostalCode", "");
                                  form.setValue("billingCountry", "");
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {showSecondAddress ? 'پنهان کردن' : 'افزودن آدرس دوم'}
                            </Button>
                          </div>
                          
                          {showSecondAddress && (
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                              <FormField
                                control={form.control}
                                name="secondDeliveryAddress"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>آدرس کامل دوم</FormLabel>
                                    <FormControl>
                                      <Textarea {...field} placeholder="آدرس کامل محل تحویل دوم" className="min-h-[80px]" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name="secondDeliveryProvince"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>استان</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="استان" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="secondDeliveryCity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>شهر</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="شهر" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="secondDeliveryPostalCode"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>کد پستی</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="کد پستی" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Different Mobile Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">شماره موبایل متفاوت (اختیاری)</label>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setShowRecipientMobile(!showRecipientMobile);
                                // Disable primary CRM phone fields when different mobile is activated
                                if (!showRecipientMobile) {
                                  // When activating different mobile, clear primary phone fields
                                  form.setValue("phone", "");
                                  form.setValue("recipientPhone", "");
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {showRecipientMobile ? 'پنهان کردن' : 'افزودن شماره متفاوت'}
                            </Button>
                          </div>
                          
                          {showRecipientMobile && (
                            <div className="p-4 bg-gray-50 rounded-lg border">
                              <FormField
                                control={form.control}
                                name="recipientMobile"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>شماره موبایل تحویل‌گیرنده</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="09123456789" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                                {(deliveryMethods as any[])?.map((method: any) => {
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
                                {isUserLoggedIn && walletBalance > 0 && (
                                  <SelectItem value="wallet_payment">پرداخت با کیف پول (Wallet Payment)</SelectItem>
                                )}
                                {isUserLoggedIn && walletBalance > 0 && (
                                  <SelectItem value="wallet_combined">پرداخت ترکیبی (کیف پول + روش دیگر)</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Wallet Payment Section */}
                    {isUserLoggedIn && walletBalance > 0 && (form.watch('paymentMethod') === 'wallet_payment' || form.watch('paymentMethod') === 'wallet_combined' || useWallet) && (
                      <div className="p-4 bg-green-50 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-green-800">موجودی کیف پول</h4>
                            <p className="text-sm text-green-600">{walletBalance.toLocaleString()} IQD موجود است</p>
                          </div>
                          {form.watch('paymentMethod') !== 'wallet_payment' && form.watch('paymentMethod') !== 'wallet_combined' && (
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
                          )}
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

                    {/* Secondary Payment Method for Combined Payments */}
                    {form.watch('paymentMethod') === 'wallet_combined' && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-3">انتخاب روش پرداخت ثانویه برای مبلغ باقی‌مانده</h4>
                        <Select value={secondaryPaymentMethod} onValueChange={setSecondaryPaymentMethod}>
                          <SelectTrigger>
                            <SelectValue placeholder="روش پرداخت ثانویه را انتخاب کنید" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_receipt">ارسال فیش واریزی بانکی</SelectItem>
                            <SelectItem value="online_payment">پرداخت آنلاین</SelectItem>
                            <SelectItem value="cash_on_delivery">پرداخت نقدی هنگام تحویل</SelectItem>
                            <SelectItem value="company_credit">حساب اعتباری شرکت</SelectItem>
                          </SelectContent>
                        </Select>
                        {totalAmount > 0 && (
                          <p className="mt-2 text-sm text-blue-600">
                            مبلغ قابل پرداخت با روش ثانویه: {totalAmount.toLocaleString()} IQD
                          </p>
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
          <div className="lg:col-span-1 space-y-4">
            {/* Enhanced Checkout Features Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="text-sm font-medium text-blue-800 mb-1">🎉 Enhanced Checkout Features</div>
              <div className="text-xs text-blue-600">
                New: Purchase Order card with second address option and recipient mobile number fields below
              </div>
            </div>
            
            {/* Purchase Order Card */}
            <Card className="sticky top-8">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setShowPurchaseOrder(!showPurchaseOrder)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-600">Purchase Order</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">NEW</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {showPurchaseOrder ? '−' : '+'}
                  </span>
                </CardTitle>
              </CardHeader>
              {showPurchaseOrder && (
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      سفارش خرید شما شامل {cartItems.length} قلم محصول است
                    </div>
                    
                    {/* CRM Default Address Information - Only for logged in users */}
                    {isUserLoggedIn && customerData?.customer && (
                      <div className={`p-3 rounded-lg border transition-all duration-300 ${
                        (form.watch('secondDeliveryAddress') || form.watch('recipientMobile')) 
                          ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-60' 
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}>
                        <div className={`text-xs font-medium mb-2 flex items-center gap-2 ${
                          (form.watch('secondDeliveryAddress') || form.watch('recipientMobile'))
                            ? 'text-gray-600 dark:text-gray-400'
                            : 'text-blue-800 dark:text-blue-300'
                        }`}>
                          <MapPin className="w-3 h-3" />
                          {(form.watch('secondDeliveryAddress') || form.watch('recipientMobile')) 
                            ? 'آدرس پیش‌فرض (غیرفعال)' 
                            : 'آدرس پیش‌فرض تحویل (از CRM)'}
                        </div>
                        <div className={`space-y-1 text-xs ${
                          (form.watch('secondDeliveryAddress') || form.watch('recipientMobile'))
                            ? 'text-gray-500 dark:text-gray-500'
                            : 'text-blue-700 dark:text-blue-400'
                        }`}>
                          <div className="flex justify-between">
                            <span>استان:</span>
                            <span className="font-medium">{customerData.customer.province || customerData.customer.state || 'نامشخص'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>شهر:</span>
                            <span className="font-medium">{customerData.customer.city || 'نامشخص'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>آدرس کامل:</span>
                            <span className="font-medium text-right max-w-[60%]">{customerData.customer.address || 'نامشخص'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>کد پستی:</span>
                            <span className="font-medium">{customerData.customer.postalCode || 'نامشخص'}</span>
                          </div>
                        </div>
                        <div className={`mt-2 pt-2 border-t transition-colors ${
                          (form.watch('secondDeliveryAddress') || form.watch('recipientMobile'))
                            ? 'border-gray-300 dark:border-gray-600'
                            : 'border-blue-200 dark:border-blue-700'
                        }`}>
                          <div className={`text-xs italic ${
                            (form.watch('secondDeliveryAddress') || form.watch('recipientMobile'))
                              ? 'text-gray-500 dark:text-gray-500'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {(form.watch('secondDeliveryAddress') || form.watch('recipientMobile')) 
                              ? '⚠️ آدرس یا شماره جدید مشخص شده - این آدرس استفاده نخواهد شد'
                              : '💡 این آدرس به عنوان آدرس پیش‌فرض تحویل استفاده می‌شود. برای تغییر، آدرس دوم یا شماره موبایل متفاوت وارد کنید.'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Active Address/Phone Information - Shows when second address or different phone is specified */}
                    {isUserLoggedIn && (form.watch('secondDeliveryAddress') || form.watch('recipientMobile')) && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="text-xs font-medium text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          آدرس و اطلاعات فعال برای تحویل
                        </div>
                        <div className="space-y-1 text-xs text-green-700 dark:text-green-400">
                          {form.watch('secondDeliveryAddress') && (
                            <>
                              <div className="flex justify-between">
                                <span>آدرس فعال:</span>
                                <span className="font-medium text-right max-w-[60%]">{form.watch('secondDeliveryAddress')}</span>
                              </div>
                              {form.watch('secondDeliveryProvince') && (
                                <div className="flex justify-between">
                                  <span>استان:</span>
                                  <span className="font-medium">{form.watch('secondDeliveryProvince')}</span>
                                </div>
                              )}
                              {form.watch('secondDeliveryCity') && (
                                <div className="flex justify-between">
                                  <span>شهر:</span>
                                  <span className="font-medium">{form.watch('secondDeliveryCity')}</span>
                                </div>
                              )}
                              {form.watch('secondDeliveryPostalCode') && (
                                <div className="flex justify-between">
                                  <span>کد پستی:</span>
                                  <span className="font-medium">{form.watch('secondDeliveryPostalCode')}</span>
                                </div>
                              )}
                            </>
                          )}
                          {form.watch('recipientMobile') && (
                            <div className="flex justify-between">
                              <span>شماره تحویل‌گیرنده:</span>
                              <span className="font-medium">{form.watch('recipientMobile')}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                          <div className="text-xs text-green-600 dark:text-green-400 italic">
                            ✅ این اطلاعات برای تحویل سفارش استفاده خواهد شد
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-2">
                        خلاصه سفارش
                      </div>
                      <div className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
                        <div className="flex justify-between">
                          <span>تعداد اقلام:</span>
                          <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} عدد</span>
                        </div>
                        <div className="flex justify-between">
                          <span>وزن تقریبی:</span>
                          <span>{cartItems.reduce((sum, item) => sum + (parseFloat(item.weight || '1') * item.quantity), 0).toFixed(2)} کیلوگرم</span>
                        </div>
                        <div className="flex justify-between">
                          <span>تاریخ سفارش:</span>
                          <span>{new Date().toLocaleDateString('fa-IR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Second Address Option */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Second Address (Optional)</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowSecondAddress(!showSecondAddress)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 h-6 w-6 p-0"
                        >
                          {showSecondAddress ? '−' : '+'}
                        </Button>
                      </div>
                      
                      {showSecondAddress && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Delivery Address
                            </label>
                            <FormField
                              control={form.control}
                              name="secondDeliveryAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      placeholder="آدرس دوم برای تحویل کالا..."
                                      className="min-h-[60px] text-sm"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Province
                              </label>
                              <FormField
                                control={form.control}
                                name="secondDeliveryProvince"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input {...field} placeholder="Baghdad" className="text-sm" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                City
                              </label>
                              <FormField
                                control={form.control}
                                name="secondDeliveryCity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input {...field} placeholder="Erbil" className="text-sm" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Postal Code (Optional)
                              </label>
                              <FormField
                                control={form.control}
                                name="secondDeliveryPostalCode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input {...field} placeholder="1968913751" className="text-sm" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recipient Mobile */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recipient Mobile Number</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowRecipientMobile(!showRecipientMobile)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 h-6 w-6 p-0"
                        >
                          {showRecipientMobile ? '−' : '+'}
                        </Button>
                      </div>
                      
                      {showRecipientMobile && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Recipient Mobile Number
                            </label>
                            <FormField
                              control={form.control}
                              name="recipientMobile"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="09123456789"
                                      className="text-sm"
                                      type="tel"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            This number will be used for SMS delivery confirmation
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Second Delivery Address Section in Purchase Order */}
                    {isUserLoggedIn && (
                      <div className="space-y-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">آدرس دوم یا شماره موبایل متفاوت</h4>
                        
                        {/* Second Address Option */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">آدرس دوم (اختیاری)</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowSecondAddress(!showSecondAddress)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 h-6 w-6 p-0"
                            >
                              {showSecondAddress ? '−' : '+'}
                            </Button>
                          </div>
                          
                          {showSecondAddress && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border space-y-3">
                              <FormField
                                control={form.control}
                                name="secondDeliveryAddress"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm">آدرس کامل</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        {...field}
                                        placeholder="آدرس دوم برای تحویل کالا..."
                                        className="min-h-[60px]"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-3 gap-3">
                                <FormField
                                  control={form.control}
                                  name="secondDeliveryProvince"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-sm">استان</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="Baghdad" />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="secondDeliveryCity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-sm">شهر</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="Erbil" />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="secondDeliveryPostalCode"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-sm">کد پستی</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="12345" />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Recipient Mobile */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">شماره موبایل متفاوت</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowRecipientMobile(!showRecipientMobile)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 h-6 w-6 p-0"
                            >
                              {showRecipientMobile ? '−' : '+'}
                            </Button>
                          </div>
                          
                          {showRecipientMobile && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                              <FormField
                                control={form.control}
                                name="recipientMobile"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm">شماره موبایل گیرنده</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="09123456789"
                                        type="tel"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <p className="mt-2 text-sm text-gray-500">
                                این شماره برای تماس تحویل استفاده می‌شود
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-4">
                      کد سفارش پس از تکمیل خرید ارائه خواهد شد
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Cart Management Card */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setShowCartManagement(!showCartManagement)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-600">Cart Management</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">NEW</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {showCartManagement ? '−' : '+'}
                  </span>
                </CardTitle>
              </CardHeader>
              {showCartManagement && (
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              کد محصول: {item.sku || 'N/A'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                            onClick={() => {
                              // Remove item from cart logic would go here
                              toast({
                                title: "حذف از سبد خرید",
                                description: `${item.name} از سبد خرید حذف شد`,
                              });
                            }}
                          >
                            ×
                          </Button>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                // Decrease quantity logic
                              }}
                            >
                              −
                            </Button>
                            <span className="min-w-[20px] text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                // Increase quantity logic
                              }}
                            >
                              +
                            </Button>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              {item.quantity} × {parseFloat(item.price).toLocaleString()} IQD
                            </div>
                            <div className="font-medium">
                              {item.totalPrice.toLocaleString()} IQD
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  


                  {/* Second Delivery Address Section in Cart Management */}
                  {isUserLoggedIn && (
                    <div className="space-y-3 pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">آدرس دوم یا شماره موبایل متفاوت</h4>
                      
                      {/* Second Address Option */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">آدرس دوم (اختیاری)</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowSecondAddress(!showSecondAddress)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 h-5 w-5 p-0"
                          >
                            {showSecondAddress ? '−' : '+'}
                          </Button>
                        </div>
                        
                        {showSecondAddress && (
                          <div className="bg-white dark:bg-gray-700 p-2 rounded border text-xs space-y-2">
                            <FormField
                              control={form.control}
                              name="secondDeliveryAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">آدرس کامل</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      placeholder="آدرس دوم برای تحویل کالا..."
                                      className="min-h-[50px] text-xs"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-3 gap-1">
                              <FormField
                                control={form.control}
                                name="secondDeliveryProvince"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">استان</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Baghdad" className="text-xs h-7" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="secondDeliveryCity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">شهر</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Erbil" className="text-xs h-7" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="secondDeliveryPostalCode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">کد پستی</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="12345" className="text-xs h-7" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Recipient Mobile */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">شماره موبایل متفاوت</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowRecipientMobile(!showRecipientMobile)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 h-5 w-5 p-0"
                          >
                            {showRecipientMobile ? '−' : '+'}
                          </Button>
                        </div>
                        
                        {showRecipientMobile && (
                          <div className="bg-white dark:bg-gray-700 p-2 rounded border">
                            <FormField
                              control={form.control}
                              name="recipientMobile"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">شماره موبایل گیرنده</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="09123456789"
                                      className="text-xs h-7"
                                      type="tel"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              این شماره برای تماس تحویل استفاده می‌شود
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cart Actions */}
                  <div className="space-y-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setLocation("/shop")}
                    >
                      ادامه خرید
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs text-red-600 hover:text-red-700"
                      onClick={() => {
                        // Clear cart logic
                        toast({
                          title: "سبد خرید پاک شد",
                          description: "تمام محصولات از سبد خرید حذف شدند",
                        });
                      }}
                    >
                      پاک کردن سبد خرید
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>خلاصه پرداخت</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>جمع کالاها:</span>
                    <span>{subtotal.toLocaleString()} IQD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>هزینه ارسال:</span>
                    <span>{shippingCost === 0 ? "رایگان" : `${shippingCost.toLocaleString()} IQD`}</span>
                  </div>
                  {vatAmount > 0 && (
                    <div className="flex justify-between">
                      <span>مالیات بر ارزش افزوده ({(vatRate * 100).toFixed(0)}%):</span>
                      <span>{vatAmount.toLocaleString()} IQD</span>
                    </div>
                  )}
                  {dutiesAmount > 0 && (
                    <div className="flex justify-between">
                      <span>عوارض بر ارزش افزوده ({(dutiesRate * 100).toFixed(0)}%):</span>
                      <span>{dutiesAmount.toLocaleString()} IQD</span>
                    </div>
                  )}
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
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      🎉 شما واجد شرایط ارسال رایگان هستید!
                    </p>
                  </div>
                )}
                
                {actualWalletUsage >= beforeWalletTotal && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
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
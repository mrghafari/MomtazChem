import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MapPin, Globe, X, ShoppingCart, Plus, Minus, Trash2, Wallet, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";

// Language types
type Language = 'en' | 'ar';

// Translation system
const translations = {
  en: {
    // Form titles
    purchaseOrder: "Purchase Order",
    enterDetails: "Enter your details",
    customerName: "Customer Name",
    deliveryPhone: "Delivery Phone Number",
    deliveryAddress: "Delivery Address",
    city: "City",
    postalCode: "Postal Code (Optional)",
    gpsLocation: "GPS Location",
    findLocation: "Find My Location",
    orderNotes: "Order Notes",
    submitOrder: "Submit Order",
    cancel: "Cancel",
    loading: "Loading...",
    
    // Cart management
    cartManagement: "Cart Management",
    each: "each",
    subtotal: "Subtotal:",
    totalAmount: "Total Amount",
    removeItem: "Remove item",
    decreaseQuantity: "Decrease quantity",
    increaseQuantity: "Increase quantity",
    
    // Validation messages
    nameRequired: "Customer name is required",
    phoneRequired: "Phone number is required",
    addressRequired: "Complete delivery address is required",
    cityRequired: "City is required",
    
    // Placeholders
    namePlaceholder: "e.g. Ahmad Ali",
    phonePlaceholder: "Enter phone number",
    addressPlaceholder: "Enter complete address for delivery",
    cityPlaceholder: "Enter city name",
    postalCodePlaceholder: "Optional",
    notesPlaceholder: "Additional notes for the order",
    
    // Status messages
    locationFound: "Location found successfully",
    locationError: "Could not get location. Please enter manually.",
    orderSubmitted: "Order submitted successfully",
    orderError: "Failed to submit order",
    
    // Language switcher
    switchLanguage: "العربية",
    language: "Language",
    
    // Payment options
    paymentMethod: "Payment Method",
    walletPayment: "Pay from Wallet",
    traditionalPayment: "Traditional Payment",
    walletBalance: "Wallet Balance",
    useWalletFull: "Pay full amount from wallet",
    useWalletPartial: "Pay partial amount from wallet",
    walletAmount: "Amount from wallet",
    remainingAmount: "Remaining amount",
    insufficientWallet: "Insufficient wallet balance"
  },
  ar: {
    // Form titles
    purchaseOrder: "طلب شراء",
    enterDetails: "أدخل تفاصيلك",
    customerName: "اسم العميل",
    deliveryPhone: "رقم هاتف التوصيل",
    deliveryAddress: "عنوان التوصيل",
    city: "المدينة",
    postalCode: "الرمز البريدي (اختياري)",
    gpsLocation: "الموقع الجغرافي",
    findLocation: "العثور على موقعي",
    orderNotes: "ملاحظات الطلب",
    submitOrder: "إرسال الطلب",
    cancel: "إلغاء",
    loading: "جارٍ التحميل...",
    
    // Validation messages
    nameRequired: "اسم العميل مطلوب",
    phoneRequired: "رقم الهاتف مطلوب",
    addressRequired: "العنوان الكامل للتوصيل مطلوب",
    cityRequired: "المدينة مطلوبة",
    
    // Placeholders
    namePlaceholder: "مثل: أحمد علي",
    phonePlaceholder: "أدخل رقم الهاتف",
    addressPlaceholder: "أدخل العنوان الكامل للتوصيل",
    cityPlaceholder: "أدخل اسم المدينة",
    postalCodePlaceholder: "اختياري",
    notesPlaceholder: "ملاحظات إضافية للطلب",
    
    // Status messages
    locationFound: "تم العثور على الموقع بنجاح",
    locationError: "لا يمكن الحصول على الموقع. يرجى الإدخال يدوياً.",
    orderSubmitted: "تم إرسال الطلب بنجاح",
    orderError: "فشل في إرسال الطلب",
    
    // Language switcher
    switchLanguage: "English",
    language: "اللغة",
    
    // Cart management
    cartManagement: "إدارة السلة",
    each: "للوحدة",
    subtotal: "المجموع الفرعي:",
    totalAmount: "المبلغ الإجمالي",
    removeItem: "حذف العنصر",
    decreaseQuantity: "تقليل الكمية",
    increaseQuantity: "زيادة الكمية",
    
    // Payment options
    paymentMethod: "طريقة الدفع",
    walletPayment: "الدفع من المحفظة",
    traditionalPayment: "الدفع التقليدي",
    walletBalance: "رصيد المحفظة",
    useWalletFull: "دفع المبلغ كاملاً من المحفظة",
    useWalletPartial: "دفع مبلغ جزئي من المحفظة",
    walletAmount: "المبلغ من المحفظة",
    remainingAmount: "المبلغ المتبقي",
    insufficientWallet: "رصيد المحفظة غير كافي"
  }
};

// Dynamic form schema based on language
const createPurchaseSchema = (lang: Language) => z.object({
  customerName: z.string().min(2, translations[lang].nameRequired),
  phone: z.string().min(10, translations[lang].phoneRequired),
  address: z.string().min(10, translations[lang].addressRequired),
  city: z.string().min(2, translations[lang].cityRequired),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional(),
});

interface PurchaseFormProps {
  cart: {[key: number]: number};
  products: any[];
  onOrderComplete: () => void;
  onClose: () => void;
  existingCustomer?: any; // Customer data from parent component
  onUpdateQuantity?: (productId: number, newQuantity: number) => void;
  onRemoveItem?: (productId: number) => void;
}

// GPS location functionality
const getCurrentLocation = (): Promise<{latitude: number, longitude: number}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  });
};

export default function BilingualPurchaseForm({ cart, products, onOrderComplete, onClose, existingCustomer, onUpdateQuantity, onRemoveItem }: PurchaseFormProps) {
  const { toast } = useToast();
  const { language, direction } = useLanguage();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationData, setLocationData] = useState<{latitude: number, longitude: number} | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'traditional' | 'wallet_full' | 'wallet_partial'>('traditional');
  const [walletAmount, setWalletAmount] = useState<number>(0);

  // Fetch current customer data
  const { data: customerData, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['/api/customers/me'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/customers/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Customer API response:', result);
          if (result.success) {
            return result;
          }
        }
        
        console.log('Customer not authenticated or API failed');
        return null;
      } catch (error) {
        console.log('Error fetching customer data:', error);
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch wallet data for logged-in customers
  const { data: walletData } = useQuery({
    queryKey: ['/api/customers/wallet/summary'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/customers/wallet/summary', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            return result.data;
          }
        }
        return null;
      } catch (error) {
        console.log('Error fetching wallet data:', error);
        return null;
      }
    },
    enabled: !!(customerData?.success && customerData.customer),
    retry: false,
  });

  // Dynamic form based on current language
  const form = useForm({
    resolver: zodResolver(createPurchaseSchema(language)),
    defaultValues: {
      customerName: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      notes: "",
      gpsLatitude: undefined,
      gpsLongitude: undefined,
    },
  });

  // Pre-populate form with customer data when available
  useEffect(() => {
    console.log('=== BilingualPurchaseForm Debug ===');
    console.log('existingCustomer from parent:', existingCustomer);
    console.log('customerData from API:', customerData);
    console.log('isLoadingCustomer:', isLoadingCustomer);
    
    // Priority 1: Use existingCustomer passed from parent (shop page)
    let customerToUse = null;
    if (existingCustomer) {
      customerToUse = existingCustomer;
      console.log('Using existingCustomer from parent');
    } else if (customerData?.success && customerData.customer) {
      customerToUse = customerData.customer;
      console.log('Using customerData from API');
    }
    
    if (customerToUse) {
      console.log('Customer object found:', customerToUse);
      console.log('Customer firstName:', customerToUse.firstName);
      console.log('Customer lastName:', customerToUse.lastName);
      console.log('Customer phone:', customerToUse.phone);
      console.log('Customer address:', customerToUse.address);
      console.log('Customer city:', customerToUse.city);
      
      const fullName = `${customerToUse.firstName || ''} ${customerToUse.lastName || ''}`.trim();
      console.log('Full name constructed:', fullName);
      
      const formData = {
        customerName: fullName || customerToUse.name || "",
        phone: customerToUse.phone || "",
        address: customerToUse.address || "",
        city: customerToUse.city || "",
        postalCode: customerToUse.postalCode || "",
        notes: "",
        gpsLatitude: undefined,
        gpsLongitude: undefined,
      };
      
      console.log('Form data to reset:', formData);
      form.reset(formData);
      console.log('Form reset completed');
    } else {
      console.log('No customer data available');
    }
    console.log('=== End BilingualPurchaseForm Debug ===');
  }, [existingCustomer, customerData, form, isLoadingCustomer]);

  // Get current translations based on site language
  const t = translations[language] || translations['en']; // fallback to English
  const isRTL = direction === 'rtl';

  // Calculate discounted price based on quantity
  const getDiscountedPrice = (product: any, quantity: number) => {
    const basePrice = parseFloat(product.price);
    
    if (product.quantityDiscounts && Array.isArray(product.quantityDiscounts)) {
      // Sort discounts by minimum quantity (descending)
      const sortedDiscounts = product.quantityDiscounts
        .filter((d: any) => quantity >= d.minQty)
        .sort((a: any, b: any) => b.minQty - a.minQty);
      
      if (sortedDiscounts.length > 0) {
        const discount = sortedDiscounts[0];
        return basePrice * (1 - discount.discountPercent / 100);
      }
    }
    
    return basePrice;
  };
  




  // Calculate total amount with discounts
  const totalAmount = Object.entries(cart).reduce((sum, [productId, quantity]) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (product && product.price) {
      const discountedPrice = getDiscountedPrice(product, quantity);
      return sum + (discountedPrice * quantity);
    }
    return sum;
  }, 0);

  // Calculate wallet payment amounts
  const walletBalance = walletData?.wallet ? parseFloat(walletData.wallet.balance) : 0;
  const canUseWallet = walletBalance > 0 && customerData?.success;
  const maxWalletAmount = Math.min(walletBalance, totalAmount);
  const remainingAfterWallet = totalAmount - (paymentMethod === 'wallet_partial' ? walletAmount : (paymentMethod === 'wallet_full' ? totalAmount : 0));

  // Format currency in IQD by default
  const formatCurrency = (amount: number, currency = 'IQD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  // GPS location handler
  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      setLocationData(location);
      form.setValue('gpsLatitude', location.latitude as any);
      form.setValue('gpsLongitude', location.longitude as any);
      
      toast({
        title: t.locationFound,
        description: `Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}`
      });
    } catch (error) {
      toast({
        title: t.locationError,
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };



  // Submit order mutation
  const submitOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest("/api/customers/orders", "POST", {
        ...orderData,
        cart,
        totalAmount,
        currency: 'IQD',
        paymentMethod: paymentMethod,
        walletAmountUsed: paymentMethod === 'wallet_full' ? totalAmount : 
                         paymentMethod === 'wallet_partial' ? walletAmount : 0,
        remainingAmount: remainingAfterWallet
      });
    },
    onSuccess: () => {
      toast({
        title: t.orderSubmitted,
        description: "Your order has been received and will be processed."
      });
      onOrderComplete();
    },
    onError: () => {
      toast({
        title: t.orderError,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: any) => {
    submitOrderMutation.mutate(data);
  };



  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-md max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <CardTitle className="text-lg">{t.purchaseOrder}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Cart Management */}
          <div className="bg-muted p-3 rounded-lg">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              {t.cartManagement}
            </h3>
            <div className="space-y-3">
              {Object.entries(cart).map(([productId, quantity]) => {
                const product = products.find(p => p.id === parseInt(productId));
                if (!product) return null;
                
                const basePrice = parseFloat(product.price || '0');
                const discountedPrice = getDiscountedPrice(product, quantity);
                const itemTotal = discountedPrice * quantity;
                
                return (
                  <div key={productId} className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
                    <div className="flex items-start justify-between gap-3">
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{product.name}</h4>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                        <p className="text-sm font-medium mt-1">
                          {discountedPrice < basePrice && (
                            <span className="line-through text-gray-400 mr-2">{formatCurrency(basePrice)}</span>
                          )}
                          {formatCurrency(discountedPrice)} {t.each}
                        </p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, quantity - 1)}
                          className="h-7 w-7 p-0"
                          title={t.decreaseQuantity}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, quantity + 1)}
                          className="h-7 w-7 p-0"
                          title={t.increaseQuantity}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveItem && onRemoveItem(product.id)}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title={t.removeItem}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Item Total */}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                      <span className="text-sm text-muted-foreground">{t.subtotal}</span>
                      <span className="font-medium">{formatCurrency(itemTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Cart Total */}
            <div className="border-t mt-3 pt-3 flex justify-between font-semibold text-lg">
              <span>{t.totalAmount}</span>
              <span className="text-primary">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Customer Data Status */}
          {customerData?.success && customerData.customer && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                ✓ Customer information loaded from your account
              </p>
              <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                You can modify any details below if needed
              </p>
            </div>
          )}

          {/* Purchase Form */}
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              {customerData?.success && customerData.customer 
                ? "Review and modify your details if needed" 
                : t.enterDetails
              }
            </p>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Customer Name */}
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.customerName}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder={t.namePlaceholder}
                          className={isRTL ? 'text-right' : 'text-left'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Number */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.deliveryPhone}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="tel"
                          placeholder={t.phonePlaceholder}
                          className={isRTL ? 'text-right' : 'text-left'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Delivery Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.deliveryAddress}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={3}
                          placeholder={t.addressPlaceholder}
                          className={isRTL ? 'text-right' : 'text-left'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* City and Postal Code */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.city}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={t.cityPlaceholder}
                            className={isRTL ? 'text-right' : 'text-left'}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.postalCode}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={t.postalCodePlaceholder}
                            className={isRTL ? 'text-right' : 'text-left'}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* GPS Location */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{t.gpsLocation}</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGetLocation}
                      disabled={isGettingLocation}
                      className="flex items-center gap-1"
                    >
                      <MapPin className="w-4 h-4" />
                      {isGettingLocation ? t.loading : t.findLocation}
                    </Button>
                  </div>
                  {locationData && (
                    <Badge variant="secondary" className="text-xs">
                      Lat: {locationData.latitude.toFixed(6)}, Lng: {locationData.longitude.toFixed(6)}
                    </Badge>
                  )}
                </div>

                {/* Payment Method Selection */}
                {canUseWallet && customerData?.success && customerData.customer && (
                  <div className="space-y-3 border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-blue-600" />
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">{t.paymentMethod}</h3>
                    </div>
                    
                    {/* Wallet Balance Display */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t.walletBalance}:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(walletBalance)}</span>
                      </div>
                    </div>

                    {/* Payment Options */}
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="traditional" id="traditional" />
                        <Label htmlFor="traditional" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="w-4 h-4" />
                          {t.traditionalPayment}
                        </Label>
                      </div>
                      
                      {walletBalance >= totalAmount && (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <RadioGroupItem value="wallet_full" id="wallet_full" />
                          <Label htmlFor="wallet_full" className="flex items-center gap-2 cursor-pointer">
                            <Wallet className="w-4 h-4 text-green-600" />
                            {t.useWalletFull} ({formatCurrency(totalAmount)})
                          </Label>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="wallet_partial" id="wallet_partial" />
                        <Label htmlFor="wallet_partial" className="flex items-center gap-2 cursor-pointer">
                          <Wallet className="w-4 h-4 text-orange-600" />
                          {t.useWalletPartial}
                        </Label>
                      </div>
                    </RadioGroup>

                    {/* Partial Payment Amount Input */}
                    {paymentMethod === 'wallet_partial' && (
                      <div className="space-y-2">
                        <Label htmlFor="walletAmount">{t.walletAmount}</Label>
                        <Input
                          id="walletAmount"
                          type="number"
                          min="0"
                          max={maxWalletAmount}
                          value={walletAmount}
                          onChange={(e) => setWalletAmount(Math.min(parseFloat(e.target.value) || 0, maxWalletAmount))}
                          placeholder="0"
                          className={isRTL ? 'text-right' : 'text-left'}
                        />
                        <div className="text-sm text-muted-foreground">
                          {t.remainingAmount}: {formatCurrency(remainingAfterWallet)}
                        </div>
                      </div>
                    )}

                    {/* Payment Summary */}
                    {paymentMethod !== 'traditional' && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>{t.totalAmount}:</span>
                            <span>{formatCurrency(totalAmount)}</span>
                          </div>
                          <div className="flex justify-between text-green-600">
                            <span>{t.walletAmount}:</span>
                            <span>-{formatCurrency(paymentMethod === 'wallet_full' ? totalAmount : walletAmount)}</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-1">
                            <span>{t.remainingAmount}:</span>
                            <span>{formatCurrency(remainingAfterWallet)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Order Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.orderNotes}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={3}
                          placeholder={t.notesPlaceholder}
                          className={isRTL ? 'text-right' : 'text-left'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitOrderMutation.isPending}
                    className="flex-1"
                  >
                    {submitOrderMutation.isPending ? t.loading : t.submitOrder}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
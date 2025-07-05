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
import { MapPin, Globe, X, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/i18n";

// Format currency helper function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IQD', '').trim() + ' IQD';
};

// Language types
type Language = 'en' | 'ar';

// Dynamic form schema based on language  
const createPurchaseSchema = (lang: Language) => z.object({
  firstName: z.string().min(2, translate('name_required', lang)),
  lastName: z.string().min(2, translate('name_required', lang)),
  email: z.string().email(translate('email_required', lang)),
  company: z.string().optional(),
  phone: z.string().min(10, translate('phone_required', lang)),
  country: z.string().min(2, translate('country_required', lang)),
  city: z.string().min(2, translate('city_required', lang)),
  address: z.string().min(10, translate('address_required', lang)),
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

export default function BilingualPurchaseForm({ cart, products, onOrderComplete, onClose }: PurchaseFormProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationData, setLocationData] = useState<{latitude: number, longitude: number} | null>(null);
  const [useWalletPayment, setUseWalletPayment] = useState(false);
  const [walletAmount, setWalletAmount] = useState(0);

  // Fetch current customer data
  const { data: customerData, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['/api/customers/me'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/customers/me', 'GET');
      } catch (error) {
        // User not logged in, continue with empty form
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch wallet balance for logged-in users
  const { data: walletData } = useQuery({
    queryKey: ['/api/customers/wallet/balance'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/customers/wallet/balance', 'GET');
      } catch (error) {
        return { balance: 0 };
      }
    },
    enabled: !!customerData?.success,
    retry: false,
  });

  // Dynamic form based on current language
  const form = useForm({
    resolver: zodResolver(createPurchaseSchema(language)),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      phone: "",
      country: "",
      city: "",
      address: "",
      postalCode: "",
      notes: "",
      gpsLatitude: undefined,
      gpsLongitude: undefined,
    },
  });

  // Pre-populate form with customer data when available
  useEffect(() => {
    if (customerData?.success && customerData.customer) {
      const customer = customerData.customer;
      
      form.reset({
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        email: customer.email || "",
        company: customer.company || "",
        phone: customer.phone || "",
        country: customer.country || "",
        city: customer.city || "",
        address: customer.address || "",
        postalCode: customer.postalCode || "",
        notes: "",
        gpsLatitude: undefined,
        gpsLongitude: undefined,
      });
    }
  }, [customerData, form]);

  // Get current translations using i18n system
  const t = {
    purchaseOrder: translate('purchase_order', language),
    enterDetails: translate('enter_details', language),
    firstName: translate('first_name', language),
    lastName: translate('last_name', language),
    email: translate('email', language),
    company: translate('company', language),
    deliveryPhone: translate('delivery_phone', language),
    country: translate('country', language),
    deliveryAddress: translate('delivery_address', language),
    city: translate('city', language),
    postalCode: translate('postal_code', language),
    gpsLocation: translate('gps_location', language),
    getLocation: translate('get_location', language),
    orderSummary: translate('order_summary', language),
    walletPayment: translate('wallet_payment', language),
    orderNotes: translate('order_notes', language),
    submitOrder: translate('submit_order', language),
    cancel: translate('cancel', language),
    loading: translate('loading', language),
    
    // Placeholders
    firstNamePlaceholder: translate('first_name_placeholder', language),
    lastNamePlaceholder: translate('last_name_placeholder', language),
    emailPlaceholder: translate('email_placeholder', language),
    companyPlaceholder: translate('company_placeholder', language),
    phonePlaceholder: translate('phone_placeholder', language),
    countryPlaceholder: translate('country_placeholder', language),
    addressPlaceholder: translate('address_placeholder', language),
    cityPlaceholder: translate('city_placeholder', language),
    postalCodePlaceholder: translate('postal_code_placeholder', language),
    notesPlaceholder: translate('notes_placeholder', language),
    
    // Status messages
    locationFound: translate('location_found', language),
    locationError: translate('location_error', language),
    orderSubmitted: translate('order_submitted', language),
    orderError: translate('order_error', language),
    
    // Language switcher
    switchLanguage: language === 'ar' ? 'English' : 'العربية'
  };

  // RTL support
  const isRTL = language === 'ar';

  // Get wallet balance
  const walletBalance = walletData?.balance || 0;

  // Calculate total amount
  const totalAmount = Object.entries(cart).reduce((sum, [productId, quantity]) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (product && product.unitPrice) {
      return sum + (parseFloat(product.unitPrice) * quantity);
    }
    return sum;
  }, 0);

  // Calculate wallet payment amounts
  const maxWalletAmount = Math.min(walletBalance, totalAmount);
  const finalWalletAmount = useWalletPayment ? Math.min(walletAmount || maxWalletAmount, maxWalletAmount) : 0;
  const remainingAmount = totalAmount - finalWalletAmount;

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

  // Language toggle handler
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  // Submit order mutation
  const submitOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const orderPayload = {
        ...orderData,
        cart,
        totalAmount,
        currency: 'IQD',
        // Wallet payment information
        useWalletPayment,
        walletAmount: useWalletPayment ? finalWalletAmount : 0,
        remainingAmount: useWalletPayment ? remainingAmount : totalAmount,
        paymentMethod: useWalletPayment ? 'wallet_and_cash' : 'cash'
      };

      // If using wallet payment, also update wallet balance
      if (useWalletPayment && finalWalletAmount > 0) {
        await apiRequest("/api/customers/wallet/deduct", "POST", {
          amount: finalWalletAmount,
          description: `Order payment - ${new Date().toISOString()}`
        });
      }

      return apiRequest("/api/customers/orders", "POST", orderPayload);
    },
    onSuccess: () => {
      toast({
        title: t.orderSubmitted,
        description: useWalletPayment 
          ? `Order submitted. ${finalWalletAmount} IQD paid from wallet.`
          : "Your order has been received and will be processed."
      });
      onOrderComplete();
    },
    onError: (error: any) => {
      toast({
        title: t.orderError,
        description: error?.message || "Failed to submit order",
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
            {/* Language switcher */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-1"
            >
              <Globe className="w-4 h-4" />
              {t.switchLanguage}
            </Button>
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
          {/* Order Summary */}
          <div className="bg-muted p-3 rounded-lg">
            <h3 className="font-medium mb-2">Order Summary</h3>
            {Object.entries(cart).map(([productId, quantity]) => {
              const product = products.find(p => p.id === parseInt(productId));
              if (!product) return null;
              
              return (
                <div key={productId} className="flex justify-between text-sm">
                  <span>{product.name} × {quantity}</span>
                  <span>{formatCurrency(parseFloat(product.unitPrice || '0') * quantity)}</span>
                </div>
              );
            })}
            <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
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
                {/* Customer Name - First & Last */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{translate('first_name', language)}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={translate('first_name_placeholder', language)}
                            className={isRTL ? 'text-right' : 'text-left'}
                          />
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
                        <FormLabel>{translate('last_name', language)}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={translate('last_name_placeholder', language)}
                            className={isRTL ? 'text-right' : 'text-left'}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email Address */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translate('email', language)}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          placeholder={translate('email_placeholder', language)}
                          className={isRTL ? 'text-right' : 'text-left'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Company (Optional) */}
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translate('company', language)}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder={translate('company_placeholder', language)}
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
                      <FormLabel>{translate('phone', language)}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="tel"
                          placeholder={translate('phone_placeholder', language)}
                          className={isRTL ? 'text-right' : 'text-left'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Country */}
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translate('country', language)}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder={translate('country_placeholder', language)}
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
                      <FormLabel>{translate('address', language)}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={3}
                          placeholder={translate('address_placeholder', language)}
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
                        <FormLabel>{translate('city', language)}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={translate('city_placeholder', language)}
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
                        <FormLabel>{translate('postal_code', language)}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={translate('postal_code_placeholder', language)}
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
                    <label className="text-sm font-medium">{translate('gps_location', language)}</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGetLocation}
                      disabled={isGettingLocation}
                      className="flex items-center gap-1"
                    >
                      <MapPin className="w-4 h-4" />
                      {isGettingLocation ? translate('loading', language) : translate('find_location', language)}
                    </Button>
                  </div>
                  {locationData && (
                    <Badge variant="secondary" className="text-xs">
                      Lat: {locationData.latitude.toFixed(6)}, Lng: {locationData.longitude.toFixed(6)}
                    </Badge>
                  )}
                </div>

                {/* Wallet Payment Section - Only for logged-in users */}
                {customerData?.success && walletBalance > 0 && (
                  <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-green-800">{translate('wallet_payment', language)}</h3>
                      <div className="text-sm text-green-600">
                        {translate('wallet_balance', language)}: {formatCurrency(walletBalance)}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="useWallet"
                        checked={useWalletPayment}
                        onChange={(e) => {
                          setUseWalletPayment(e.target.checked);
                          if (e.target.checked) {
                            setWalletAmount(maxWalletAmount);
                          } else {
                            setWalletAmount(0);
                          }
                        }}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <label htmlFor="useWallet" className="text-sm text-green-700">
                        {translate('use_wallet', language)}
                      </label>
                    </div>

                    {useWalletPayment && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-green-700">
                              {translate('wallet_amount', language)}
                            </label>
                            <Input
                              type="number"
                              min="0"
                              max={maxWalletAmount}
                              value={walletAmount || ''}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                setWalletAmount(Math.min(value, maxWalletAmount));
                              }}
                              className="mt-1"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-green-700">
                              {translate('remaining_amount', language)}
                            </label>
                            <div className="mt-1 p-2 bg-white border rounded text-sm">
                              {formatCurrency(remainingAmount)}
                            </div>
                          </div>
                        </div>
                        
                        {walletBalance < totalAmount && (
                          <div className="text-xs text-orange-600">
                            {translate('insufficient_funds', language)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Order Summary */}
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{translate('total_amount', language)}:</span>
                    <span className="font-bold">{formatCurrency(totalAmount)}</span>
                  </div>
                  {useWalletPayment && finalWalletAmount > 0 && (
                    <>
                      <div className="flex justify-between items-center text-green-600">
                        <span>{translate('from_wallet', language)}:</span>
                        <span>-{formatCurrency(finalWalletAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="font-medium">{translate('remaining_to_pay', language)}:</span>
                        <span className="font-bold">{formatCurrency(remainingAmount)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Order Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translate('order_notes', language)}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={3}
                          placeholder={translate('notes_placeholder', language)}
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
                    {translate('cancel', language)}
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitOrderMutation.isPending}
                    className="flex-1"
                  >
                    {submitOrderMutation.isPending ? translate('loading', language) : translate('submit_order', language)}
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
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
    language: "Language"
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
    language: "اللغة"
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
  const [language, setLanguage] = useState<Language>('en');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationData, setLocationData] = useState<{latitude: number, longitude: number} | null>(null);

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
    console.log('Customer data in BilingualPurchaseForm:', customerData);
    if (customerData?.success && customerData.customer) {
      const customer = customerData.customer;
      console.log('Customer object:', customer);
      const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
      console.log('Full name constructed:', fullName);
      
      const formData = {
        customerName: fullName || customer.name || "",
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        postalCode: customer.postalCode || "",
        notes: "",
        gpsLatitude: undefined,
        gpsLongitude: undefined,
      };
      
      console.log('Form data to reset:', formData);
      form.reset(formData);
    }
  }, [customerData, form]);

  // Get current translations
  const t = translations[language];

  // Calculate total amount
  const totalAmount = Object.entries(cart).reduce((sum, [productId, quantity]) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (product && product.unitPrice) {
      return sum + (parseFloat(product.unitPrice) * quantity);
    }
    return sum;
  }, 0);

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

  // Language toggle handler
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  // Submit order mutation
  const submitOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest("/api/customers/orders", "POST", {
        ...orderData,
        cart,
        totalAmount,
        currency: 'IQD'
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

  // Set text direction based on language
  const isRTL = language === 'ar';

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
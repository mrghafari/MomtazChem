import { useState, useEffect, useMemo, useRef } from "react";
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
import { MapPin, Globe, X, ShoppingCart, Plus, Minus, Trash2, Wallet, CreditCard, Upload, Clock, Flame } from "lucide-react";
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
    insufficientWallet: "Insufficient wallet balance",
    discountApplied: "Discount Applied",
    bankTransferGrace: "Bank Transfer with 3-Day Grace Period",
    bankTransferGraceDesc: "Order locked - Receipt upload deadline: 3 days",
    
    // Shipping options
    deliveryMethod: "Delivery Method",
    selectDeliveryMethod: "Select delivery method",
    shippingCost: "Shipping Cost",
    freeShipping: "Free Shipping",
    
    // Second address and recipient mobile options
    secondDeliveryAddress: "Second Delivery Address",
    addSecondAddress: "Add Second Address",
    removeSecondAddress: "Remove Second Address",
    secondAddressPlaceholder: "Enter different delivery address...",
    secondAddressInstruction: "If delivery address differs from above, please enter new address",
    recipientMobileNumber: "Recipient Mobile Number",
    addRecipientMobile: "Add Recipient Mobile",
    removeRecipientMobile: "Remove Recipient Mobile",
    recipientMobilePlaceholder: "Enter recipient's mobile number...",
    recipientMobileInstruction: "If recipient is different person, enter their mobile number",
    crmAddressDisabled: "Default Address (Disabled)",
    crmPhoneDisabled: "Default Phone (Disabled)",

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
    insufficientWallet: "رصيد المحفظة غير كافي",
    discountApplied: "تم تطبيق الخصم",
    
    // Shipping options
    deliveryMethod: "طريقة التوصيل",
    selectDeliveryMethod: "اختر طريقة التوصيل",
    shippingCost: "تكلفة الشحن",
    freeShipping: "شحن مجاني",
    
    // Second address and recipient mobile options
    secondDeliveryAddress: "آدرس دوم تحویل",
    addSecondAddress: "افزودن آدرس دوم",
    removeSecondAddress: "حذف آدرس دوم", 
    secondAddressPlaceholder: "آدرس جایگزین برای تحویل (مثل: بغداد، خیابان الرشید)",
    secondAddressInstruction: "چنانچه آدرس دریافت کالا با آدرس بالا متفاوت است، آدرس جدید را بنویسید",
    recipientMobileNumber: "شماره موبایل گیرنده",
    addRecipientMobile: "افزودن شماره گیرنده",
    removeRecipientMobile: "حذف شماره گیرنده",
    recipientMobilePlaceholder: "شماره موبایل گیرنده برای تأیید تحویل (مثل: 0791XXXXXXX)",
    recipientMobileInstruction: "اگر گیرنده کالا شخص دیگری است، شماره موبایل ایشان را وارد کنید",
    crmAddressDisabled: "آدرس پیش‌فرض (غیرفعال)",
    crmPhoneDisabled: "شماره پیش‌فرض (غیرفعال)",
  }
};

// Dynamic form schema based on language
const createPurchaseSchema = (lang: Language) => z.object({
  customerName: z.string().min(2, translations[lang].nameRequired),
  phone: z.string().min(10, translations[lang].phoneRequired),
  address: z.string().min(10, translations[lang].addressRequired),
  city: z.string().optional(), // Make city optional to prevent validation failures
  country: z.string().default('Iraq'), // Add country field with default
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional(),
  deliveryMethod: z.string().optional(), // Add delivery method field
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
  const [paymentMethod, setPaymentMethod] = useState<'online_payment' | 'wallet_full' | 'wallet_partial' | 'bank_receipt' | 'bank_transfer_grace' | 'wallet_combined'>('online_payment');
  const [walletAmount, setWalletAmount] = useState<number>(0);
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(0);
  
  // Draggable states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const formRef = useRef<HTMLDivElement>(null);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Keep the new position - don't reset it
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  




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

  // Fetch complete CRM customer data for logged-in customers
  const { data: crmCustomerData } = useQuery({
    queryKey: ['/api/customer/crm-profile'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/customer/crm-profile', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('CRM Customer API response:', result);
          if (result.success) {
            return result.data;
          }
        }
        return null;
      } catch (error) {
        console.log('Error fetching CRM customer data:', error);
        return null;
      }
    },
    enabled: !!(customerData?.success && customerData.customer?.crmId),
    retry: false,
  });

  // Check wallet query conditions with stable memoization
  const walletQueryEnabled = useMemo(() => {
    const isEnabled = !!(existingCustomer || (customerData?.success && customerData.customer));
    console.log('💳 [WALLET QUERY] Enabled check:', { existingCustomer: !!existingCustomer, customerDataSuccess: !!customerData?.success, enabled: isEnabled });
    return isEnabled;
  }, [existingCustomer, customerData?.success]);

  // Fetch wallet data for logged-in customers using default query function
  const { data: walletData, isLoading: isLoadingWallet, error: walletError } = useQuery({
    queryKey: ['/api/customer/wallet'],
    enabled: walletQueryEnabled,
    retry: 1, // Try once on failure
    staleTime: 10000, // 10 seconds cache
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Always refetch on mount for fresh data
  });

  // State for second address province/city selection (must be declared before API queries)
  const [selectedSecondaryProvinceId, setSelectedSecondaryProvinceId] = useState<number | null>(null);
  const [secondProvince, setSecondProvince] = useState('');
  const [secondCity, setSecondCity] = useState('');
  const [secondPostalCode, setSecondPostalCode] = useState('');

  // Fetch Iraqi provinces for second address dropdowns
  const { data: provinces, isLoading: isLoadingProvinces } = useQuery({
    queryKey: ['/api/iraqi-provinces'],
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch cities for selected province in second address
  const { data: secondaryCities, isLoading: isLoadingSecondaryCities } = useQuery({
    queryKey: ['/api/iraqi-cities', selectedSecondaryProvinceId],
    queryFn: async () => {
      if (!selectedSecondaryProvinceId) return [];
      
      const response = await fetch('/api/iraqi-cities');
      if (!response.ok) throw new Error('Failed to fetch cities');
      
      const result = await response.json();
      if (result.success && result.data) {
        // Filter cities by selected province
        return result.data.filter((city: any) => city.provinceId === selectedSecondaryProvinceId);
      }
      return [];
    },
    enabled: !!selectedSecondaryProvinceId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch VAT settings from public endpoint
  const { data: vatData } = useQuery({
    queryKey: ['/api/tax-settings'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/tax-settings');
        
        if (response.ok) {
          const result = await response.json();
          console.log('💰 [VAT] Tax settings API response:', result);
          if (result.success && result.data) {
            // Convert to the expected format
            const vatSetting = result.data.find((setting: any) => 
              (setting.type === 'VAT' || setting.type === 'vat') && setting.isEnabled
            );
            const dutiesSetting = result.data.find((setting: any) => 
              setting.type === 'duties' && setting.isEnabled
            );
            
            return {
              vatEnabled: vatSetting ? true : false,
              vatRate: vatSetting ? vatSetting.rate : '0',
              dutiesEnabled: dutiesSetting ? true : false,
              dutiesRate: dutiesSetting ? dutiesSetting.rate : '0'
            };
          }
        }
        return {
          vatEnabled: false,
          vatRate: '0',
          dutiesEnabled: false,
          dutiesRate: '0'
        };
      } catch (error) {
        console.log('💰 [VAT] Error fetching tax settings:', error);
        return {
          vatEnabled: false,
          vatRate: '0',
          dutiesEnabled: false,
          dutiesRate: '0'
        };
      }
    },
    retry: false,
  });

  // Check if cart contains flammable materials - CRITICAL SAFETY CHECK
  const containsFlammableProducts = useMemo(() => {
    const flammableItems = Object.entries(cart).some(([productId, quantity]) => {
      if (quantity > 0) {
        const product = products.find(p => p.id === parseInt(productId));
        const isFlammable = product?.isFlammable === true;
        if (isFlammable) {
          console.log('🔥 [BILINGUAL FORM] Flammable product detected:', {
            productId,
            name: product?.name,
            isFlammable: true,
            quantity
          });
        }
        return isFlammable;
      }
      return false;
    });
    
    console.log('🔥 [BILINGUAL FORM] Cart flammable check result:', {
      containsFlammableProducts: flammableItems,
      cartItems: Object.keys(cart).length,
      totalQuantity: Object.values(cart).reduce((sum, qty) => sum + qty, 0)
    });
    
    return flammableItems;
  }, [cart, products]);

  // Fetch active shipping rates with FLAMMABLE MATERIALS FILTERING
  const { data: shippingRatesData, isLoading: isLoadingShippingRates, error: shippingRatesError } = useQuery({
    queryKey: ['/api/shipping-rates', containsFlammableProducts],
    queryFn: async () => {
      try {
        console.log('🚚 [BILINGUAL FORM] Fetching shipping rates with flammable filtering...', {
          containsFlammableProducts,
          cartProducts: Object.entries(cart).map(([id, qty]) => ({
            id,
            quantity: qty,
            name: products.find(p => p.id === parseInt(id))?.name,
            isFlammable: products.find(p => p.id === parseInt(id))?.isFlammable
          }))
        });
        
        const response = await fetch('/api/shipping-rates', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('📦 [BILINGUAL FORM] Raw shipping rates API response:', result);
          
          if (result.success && result.data) {
            let filteredRates = result.data;
            
            // CRITICAL SAFETY FILTER: Remove bus options for flammable materials
            if (containsFlammableProducts) {
              const originalCount = filteredRates.length;
              filteredRates = filteredRates.filter((rate: any) => {
                const deliveryMethod = rate.deliveryMethod || rate.delivery_method || '';
                const isBusMethod = deliveryMethod.includes('bus') || 
                                   deliveryMethod.includes('اتوبوس') || 
                                   rate.name?.includes('اتوبوس') ||
                                   rate.name?.includes('bus');
                
                if (isBusMethod) {
                  console.log('🚫 [SAFETY FILTER] Excluding bus option for flammable materials:', {
                    rateName: rate.name,
                    deliveryMethod: deliveryMethod,
                    rateId: rate.id,
                    reason: 'FLAMMABLE_MATERIALS_SAFETY'
                  });
                  return false; // EXCLUDE BUS FOR FLAMMABLE MATERIALS
                }
                return true; // ALLOW NON-BUS OPTIONS
              });
              
              console.log('🔥 [SAFETY COMPLIANCE] Shipping rates filtered for flammable materials:', {
                originalCount,
                filteredCount: filteredRates.length,
                excludedCount: originalCount - filteredRates.length,
                containsFlammableProducts: true
              });
            }
            
            console.log('✅ [BILINGUAL FORM] Successfully loaded shipping rates:', filteredRates.length, 'methods');
            return filteredRates;
          }
        }
        console.log('❌ [BILINGUAL FORM] Failed to load shipping rates');
        return [];
      } catch (error) {
        console.log('❌ [BILINGUAL FORM] Error fetching shipping rates:', error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });



  // Dynamic form based on current language
  const form = useForm({
    resolver: zodResolver(createPurchaseSchema(language as Language)),
    defaultValues: {
      customerName: "",
      phone: "",
      address: "",
      city: "",
      country: "Iraq", // Add country default
      postalCode: "",
      notes: "",
      gpsLatitude: undefined,
      gpsLongitude: undefined,
      deliveryMethod: "", // Add delivery method default
    },
  });

  // Pre-populate form with customer data when available
  useEffect(() => {
    console.log('=== BilingualPurchaseForm Address Debug ===');
    console.log('existingCustomer from parent:', existingCustomer);
    console.log('customerData from API:', customerData);
    console.log('crmCustomerData from API:', crmCustomerData);
    console.log('isLoadingCustomer:', isLoadingCustomer);
    
    // Priority 1: Use CRM customer data (most complete)
    // Priority 2: Use existingCustomer passed from parent (shop page)
    // Priority 3: Use basic customerData from API
    let customerToUse = null;
    if (crmCustomerData) {
      customerToUse = crmCustomerData;
      console.log('Using CRM customer data (most complete)');
    } else if (existingCustomer) {
      customerToUse = existingCustomer;
      console.log('Using existingCustomer from parent');
    } else if (customerData?.success && customerData.customer) {
      customerToUse = customerData.customer;
      console.log('Using basic customerData from API');
    }
    
    if (customerToUse) {
      console.log('Customer object found:', customerToUse);
      console.log('Customer firstName:', customerToUse.firstName);
      console.log('Customer lastName:', customerToUse.lastName);
      console.log('Customer phone:', customerToUse.phone);
      console.log('Customer address:', customerToUse.address);
      console.log('Customer secondaryAddress:', customerToUse.secondaryAddress);
      console.log('Customer city:', customerToUse.city);
      console.log('Customer country:', customerToUse.country);
      console.log('Customer postalCode:', customerToUse.postalCode);
      
      const fullName = `${customerToUse.firstName || ''} ${customerToUse.lastName || ''}`.trim();
      console.log('Full name constructed:', fullName);
      
      // Enhanced address mapping for CRM customers - check multiple address fields
      const customerAddress = customerToUse.address || 
                             customerToUse.secondaryAddress || 
                             customerToUse.primaryAddress ||
                             customerToUse.deliveryAddress ||
                             customerToUse.fullAddress ||
                             customerToUse.streetAddress ||
                             "";
      
      // Enhanced city mapping - check multiple city fields  
      const customerCity = customerToUse.cityRegion || 
                          customerToUse.city || 
                          customerToUse.cityName ||
                          customerToUse.province || 
                          "";
      
      // Enhanced province mapping - for separate province field if needed
      const customerProvince = customerToUse.province || 
                              customerToUse.cityRegion || 
                              customerToUse.city ||
                              "";

      console.log('🏠 [ADDRESS DEBUG] Enhanced address mapping result:', {
        originalCustomer: customerToUse,
        mappedAddress: customerAddress,
        mappedCity: customerCity,
        mappedProvince: customerProvince,
        addressSources: {
          address: customerToUse.address,
          secondaryAddress: customerToUse.secondaryAddress,
          primaryAddress: customerToUse.primaryAddress,
          deliveryAddress: customerToUse.deliveryAddress,
          fullAddress: customerToUse.fullAddress,
          streetAddress: customerToUse.streetAddress
        },
        citySources: {
          cityRegion: customerToUse.cityRegion,
          city: customerToUse.city,
          cityName: customerToUse.cityName,
          province: customerToUse.province
        },
        priorityMapping: {
          selectedCity: customerCity,
          selectedProvince: customerProvince,
          hasCityData: !!customerCity,
          hasProvinceData: !!customerProvince
        }
      });

      const formData = {
        customerName: fullName || customerToUse.name || "",
        phone: customerToUse.phone || "",
        address: customerAddress,
        city: customerCity || "Iraq",
        country: customerToUse.country || "Iraq", 
        postalCode: customerToUse.postalCode || "",
        notes: "",
        gpsLatitude: undefined,
        gpsLongitude: undefined,
        // Add province data for internal use even though form may not have separate field
        province: customerProvince || customerCity || "",
      };
      
      console.log('Form data to reset:', formData);
      form.reset(formData);
      console.log('Form reset completed');
    } else {
      console.log('No customer data available');
    }
    console.log('=== End BilingualPurchaseForm Debug ===');
  }, [existingCustomer, customerData, crmCustomerData, form, isLoadingCustomer]);

  // State for additional recipient fields - CRM conditional logic (must be declared before use)
  const [showSecondAddress, setShowSecondAddress] = useState(false);
  const [showRecipientMobile, setShowRecipientMobile] = useState(false);  
  const [secondAddress, setSecondAddress] = useState('');
  const [recipientMobile, setRecipientMobile] = useState('');

  // Get current translations based on site language
  const t = translations[language as keyof typeof translations] || translations.en;
  const isRTL = direction === 'rtl';
  
  // Conditional graying out logic for CRM fields
  const isPrimaryAddressDisabled = showSecondAddress && secondAddress.trim().length > 0;
  const isPrimaryMobileDisabled = showRecipientMobile && recipientMobile.trim().length > 0;
  const isPrimaryPostalCodeDisabled = secondPostalCode.trim().length > 0; // Separate logic for postal code
  const hasCrmData = !!(crmCustomerData || (customerData?.success && customerData.customer));



  // Calculate discounted price based on quantity
  const getDiscountedPrice = (product: any, quantity: number) => {
    const basePrice = parseFloat(product.price || '0');
    
    // Check if product has quantity discounts
    let discounts = product.quantityDiscounts;
    
    // If quantityDiscounts is a string, try to parse it
    if (typeof discounts === 'string') {
      try {
        discounts = JSON.parse(discounts);
      } catch (e) {
        console.log('Failed to parse quantityDiscounts:', discounts);
        return basePrice;
      }
    }
    
    if (discounts && Array.isArray(discounts) && discounts.length > 0) {
      // Sort discounts by minimum quantity (descending) to get highest applicable discount
      const sortedDiscounts = discounts
        .filter((d: any) => quantity >= parseInt(d.minQty || d.min_qty || 0))
        .sort((a: any, b: any) => parseInt(b.minQty || b.min_qty || 0) - parseInt(a.minQty || a.min_qty || 0));
      
      if (sortedDiscounts.length > 0) {
        const discount = sortedDiscounts[0];
        // Handle both discount formats: decimal (0.1) and percentage (10)
        const discountValue = discount.discount || (parseFloat(discount.discountPercent || discount.discount_percent || 0) / 100);
        const discountedPrice = basePrice * (1 - discountValue);
        console.log(`BilingualForm Product ${product.name}: quantity=${quantity}, basePrice=${basePrice}, discount=${discountValue}, discountedPrice=${discountedPrice}`);
        return discountedPrice;
      }
    }
    
    return basePrice;
  };
  




  // Calculate subtotal with discounts
  const subtotalAmount = Object.entries(cart).reduce((sum, [productId, quantity]) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (product && product.price) {
      const discountedPrice = getDiscountedPrice(product, quantity);
      return sum + (discountedPrice * quantity);
    }
    return sum;
  }, 0);

  // Calculate shipping cost based on selected method - Real-time update
  useEffect(() => {
    console.log('🚚 Shipping cost calculation:', { 
      selectedShippingMethod, 
      hasShippingData: !!shippingRatesData, 
      subtotalAmount: subtotalAmount.toFixed(2)
    });
    
    if (selectedShippingMethod && shippingRatesData && shippingRatesData.length > 0) {
      const selectedRate = shippingRatesData.find((rate: any) => rate.id === selectedShippingMethod);
      console.log('📦 Selected shipping rate:', selectedRate);
      
      if (selectedRate) {
        // Handle special delivery methods with zero cost
        if (selectedRate.deliveryMethod === 'smart_vehicle' || selectedRate.delivery_method === 'smart_vehicle' ||
            selectedRate.deliveryMethod === 'self_pickup' || selectedRate.delivery_method === 'self_pickup') {
          console.log('✅ SPECIAL DELIVERY METHOD: Zero cost for', selectedRate.deliveryMethod || selectedRate.delivery_method);
          setShippingCost(0);
          return;
        }
        
        // Parse threshold carefully for regular shipping methods
        const freeShippingThreshold = parseFloat(selectedRate.freeShippingThreshold || '0');
        const basePrice = parseFloat(selectedRate.basePrice || '0');
        
        console.log('💰 Free shipping check:', {
          threshold: freeShippingThreshold,
          orderAmount: subtotalAmount,
          qualifies: subtotalAmount >= freeShippingThreshold && freeShippingThreshold > 0
        });
        
        // Real-time free shipping check
        if (freeShippingThreshold > 0 && subtotalAmount >= freeShippingThreshold) {
          console.log('✅ FREE SHIPPING APPLIED! Threshold:', freeShippingThreshold, 'Order:', subtotalAmount);
          setShippingCost(0);
        } else {
          console.log('💳 Regular shipping cost applied:', basePrice);
          setShippingCost(basePrice);
        }
      } else {
        console.log('⚠️ Selected rate not found, resetting shipping cost');
        setShippingCost(0);
      }
    } else {
      console.log('🔄 No shipping method selected or no data, resetting cost');
      setShippingCost(0);
    }
  }, [selectedShippingMethod, shippingRatesData, subtotalAmount]);

  // Debug shipping rates loading
  useEffect(() => {
    console.log('Shipping rates state:', { 
      isLoadingShippingRates, 
      shippingRatesError, 
      dataLength: shippingRatesData?.length || 0,
      data: shippingRatesData 
    });
  }, [isLoadingShippingRates, shippingRatesError, shippingRatesData]);

  // Calculate VAT and duties amounts (only on product subtotal, not shipping)
  const vatRate = vatData?.vatEnabled ? parseFloat(vatData.vatRate || '0') : 0;
  const dutiesRate = vatData?.dutiesEnabled ? parseFloat(vatData.dutiesRate || '0') : 0;
  
  const vatAmount = vatData?.vatEnabled ? subtotalAmount * vatRate : 0;
  const dutiesAmount = vatData?.dutiesEnabled ? subtotalAmount * dutiesRate : 0;
  const totalTaxAmount = vatAmount + dutiesAmount;
  
  // Smart delivery cost calculation state
  const [smartDeliveryCost, setSmartDeliveryCost] = useState<number>(0);
  const [smartDeliveryLoading, setSmartDeliveryLoading] = useState<boolean>(false);
  const [smartDeliveryError, setSmartDeliveryError] = useState<string>('');
  const [optimalVehicle, setOptimalVehicle] = useState<any>(null);
  const [alternativeVehicles, setAlternativeVehicles] = useState<any[]>([]);

  // Auto-select smart vehicle when shipping methods load
  useEffect(() => {
    if (shippingRatesData && shippingRatesData.length > 0 && !selectedShippingMethod) {
      const smartVehicleMethod = shippingRatesData.find((rate: any) => 
        rate.deliveryMethod === 'smart_vehicle' || rate.delivery_method === 'smart_vehicle'
      );
      
      if (smartVehicleMethod) {
        console.log('🚚 [AUTO SELECT] Auto-selecting smart vehicle method:', smartVehicleMethod.id);
        setSelectedShippingMethod(smartVehicleMethod.id);
      }
    }
  }, [shippingRatesData, selectedShippingMethod]);

  console.log('💰 [PURCHASE FORM] Tax calculation:', {
    vatData,
    vatRate,
    dutiesRate,
    subtotalAmount,
    vatAmount,
    dutiesAmount,
    totalTaxAmount
  });
  
  // Calculate total weight of all products in cart
  const totalWeight = Object.entries(cart).reduce((sum, [productId, quantity]) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (product) {
      // Get weight from product data (use different weight fields as fallback)
      const productWeight = parseFloat(product.weight || product.weightKg || product.weight_kg || '0');
      return sum + (productWeight * quantity);
    }
    return sum;
  }, 0);

  // Calculate shipping cost - prioritize smart delivery over regular shipping
  const finalShippingCost = selectedShippingMethod && (shippingRatesData?.find((rate: any) => rate.id === selectedShippingMethod)?.deliveryMethod === 'smart_vehicle' || shippingRatesData?.find((rate: any) => rate.id === selectedShippingMethod)?.delivery_method === 'smart_vehicle')
    ? (optimalVehicle ? optimalVehicle.totalCost : smartDeliveryCost)
    : shippingCost;
  
  // Calculate total amount (subtotal + VAT + duties + final shipping cost - no double counting)
  const totalAmount = subtotalAmount + totalTaxAmount + finalShippingCost;
  
  // Debug total calculation
  console.log('💰 [TOTAL CALCULATION] Breakdown:', {
    subtotalAmount,
    totalTaxAmount,
    finalShippingCost,
    regularShippingCost: shippingCost,
    smartDeliveryCost: smartDeliveryCost,
    optimalVehicleCost: optimalVehicle?.totalCost,
    totalAmount,
    'Components': `${subtotalAmount} + ${totalTaxAmount} + ${finalShippingCost} = ${totalAmount}`
  });

  // Calculate wallet payment amounts
  const walletBalance = (walletData as any)?.data?.wallet ? parseFloat((walletData as any).data.wallet.balance) : 
                       (walletData as any)?.wallet ? parseFloat((walletData as any).wallet.balance) : 
                       (walletData as any)?.balance ? parseFloat((walletData as any).balance) : 0;
  const canUseWallet = walletBalance > 0 && (existingCustomer || (customerData as any)?.success);
  const maxWalletAmount = Math.min(walletBalance, totalAmount);
  const remainingAfterWallet = totalAmount - (paymentMethod === 'wallet_partial' ? walletAmount : (paymentMethod === 'wallet_full' ? totalAmount : 0));
  
  // Auto-set wallet amount when wallet_combined is selected (after walletBalance is defined)
  useEffect(() => {
    if (paymentMethod === 'wallet_combined') {
      const maxUsage = Math.min(walletBalance, totalAmount);
      setWalletAmount(maxUsage);
      console.log('🔄 [AUTO WALLET] wallet_combined selected - setting walletAmount:', {
        paymentMethod,
        walletBalance,
        totalAmount,
        maxUsage,
        autoSetValue: maxUsage
      });
    } else if (paymentMethod !== 'wallet_partial') {
      setWalletAmount(0);
    }
  }, [paymentMethod, walletBalance, totalAmount]);

  console.log('💳 [WALLET DEBUG] Complete wallet analysis:', { 
    walletData, 
    walletBalance, 
    canUseWallet, 
    totalAmount,
    existingCustomer: !!existingCustomer,
    customerDataSuccess: !!(customerData as any)?.success,
    walletDataStructure: walletData ? Object.keys(walletData) : 'no data',
    isLoadingWallet,
    walletError: walletError?.message,
    walletQueryEnabled,
    'Raw wallet response': walletData,
    'Wallet success flag': (walletData as any)?.success,
    'Wallet balance path 1': (walletData as any)?.data?.wallet?.balance,
    'Wallet balance path 2': (walletData as any)?.wallet?.balance,
    'Wallet balance path 3': (walletData as any)?.balance
  });



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

  // Calculate smart delivery cost
  const calculateSmartDeliveryCost = async (destinationCity: string, destinationProvince: string) => {
    if (!destinationCity || totalWeight <= 0) {
      console.log('🚚 [SMART DELIVERY] Skipping calculation - missing city or zero weight');
      return;
    }

    setSmartDeliveryLoading(true);
    setSmartDeliveryError('');
    
    try {
      console.log('🚚 [SMART DELIVERY] Calculating cost for:', {
        weight: totalWeight,
        city: destinationCity,
        province: destinationProvince,
        cartItems: Object.keys(cart).length
      });

      const response = await fetch('/api/calculate-delivery-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          weight: totalWeight,
          destinationCity: destinationCity,
          destinationProvince: destinationProvince,
          cart: cart,
          useSecondaryAddress: showSecondAddress && secondAddress.trim().length > 0,
          secondaryAddress: showSecondAddress ? {
            address: secondAddress,
            city: secondCity,
            province: secondProvince,
            postalCode: secondPostalCode
          } : null
        })
      });

      const data = await response.json();
      
      console.log('🚚 [SMART DELIVERY] API response:', data);
      console.log('🚚 [SMART DELIVERY] Response details:', {
        success: data.success,
        hasData: !!data.data,
        hasOptimalVehicle: !!(data.data?.optimalVehicle),
        optimalVehicle: data.data?.optimalVehicle
      });
      
      if (data.success && data.data) {
        // Handle standard vehicle selection response format from database templates
        const { optimalVehicle, alternatives } = data.data;
        
        // Check if optimalVehicle exists and has required properties
        if (optimalVehicle && optimalVehicle.totalCost !== undefined) {
          setOptimalVehicle(optimalVehicle);
          setAlternativeVehicles(alternatives || []);
          setSmartDeliveryCost(optimalVehicle.totalCost);
          
          console.log('✅ [SMART DELIVERY] Cost calculated:', {
            vehicle: optimalVehicle.vehicleName,
            cost: optimalVehicle.totalCost,
            estimatedTime: optimalVehicle.estimatedTime
          });
        } else {
          console.error('❌ [SMART DELIVERY] Invalid optimalVehicle data:', optimalVehicle);
          throw new Error('داده‌های وسیله نقلیه بهینه دریافت نشد');
        }
      } else {
        throw new Error(data.message || 'محاسبه هزینه ارسال ناموفق بود');
      }
    } catch (error) {
      console.error('❌ [SMART DELIVERY] Calculation error:', error);
      setSmartDeliveryError((error as any)?.message || 'خطا در محاسبه هزینه ارسال');
      setSmartDeliveryCost(0);
      setOptimalVehicle(null);
      setAlternativeVehicles([]);
    } finally {
      setSmartDeliveryLoading(false);
    }
  };

  // Watch for changes in destination to recalculate delivery cost
  useEffect(() => {
    // Determine final destination city and province
    const finalDestinationCity = showSecondAddress && secondCity.trim() ? 
      secondCity : 
      (crmCustomerData?.cityRegion || crmCustomerData?.city || customerData?.customer?.cityRegion || customerData?.customer?.city || form.watch('city'));
    
    const finalDestinationProvince = showSecondAddress && secondProvince.trim() ? 
      secondProvince : 
      (crmCustomerData?.province || customerData?.customer?.province);

    console.log('🚚 [DELIVERY CALCULATION] Final destination determined:', {
      showSecondAddress,
      secondCity,
      secondProvince,
      crmCityRegion: crmCustomerData?.cityRegion,
      crmCity: crmCustomerData?.city,
      crmProvince: crmCustomerData?.province,
      customerCityRegion: customerData?.customer?.cityRegion,
      customerCity: customerData?.customer?.city,
      customerProvince: customerData?.customer?.province,
      formCity: form.watch('city'),
      finalDestinationCity,
      finalDestinationProvince,
      totalWeight
    });

    if (finalDestinationCity && finalDestinationProvince && totalWeight > 0) {
      const debounceTimer = setTimeout(() => {
        calculateSmartDeliveryCost(finalDestinationCity, finalDestinationProvince);
      }, 1000); // 1 second debounce
      
      return () => clearTimeout(debounceTimer);
    } else {
      console.log('🚚 [DELIVERY CALCULATION] Missing required data for calculation:', {
        hasCity: !!finalDestinationCity,
        hasProvince: !!finalDestinationProvince,
        hasWeight: totalWeight > 0,
        cityValue: finalDestinationCity,
        provinceValue: finalDestinationProvince
      });
    }
  }, [showSecondAddress, secondCity, secondProvince, form.watch('city'), totalWeight, cart, crmCustomerData?.cityRegion, crmCustomerData?.province, customerData?.customer?.cityRegion, customerData?.customer?.province]);



  // Submit order mutation
  const submitOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      // Handle bank receipt upload separately if file is selected
      if (paymentMethod === 'bank_receipt' && selectedReceiptFile) {
        // First create the order
        const orderResponse = await apiRequest("/api/customers/orders", {
          method: "POST",
          body: orderData
        });
        
        // Then upload the receipt file
        if (orderResponse.orderId) {
          const formData = new FormData();
          formData.append('receipt', selectedReceiptFile);
          formData.append('orderId', orderResponse.orderId.toString());
          formData.append('notes', orderData.notes || '');
          
          try {
            const uploadResponse = await fetch('/api/payment/upload-receipt', {
              method: 'POST',
              body: formData,
              credentials: 'include'
            });
            
            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json();
              console.log('Receipt uploaded successfully:', uploadResult);
            } else {
              console.error('Failed to upload receipt');
            }
          } catch (error) {
            console.error('Error uploading receipt:', error);
          }
        }
        
        return orderResponse;
      } else {
        // Normal order without receipt - add timestamp to bypass cache
        const timestamp = Date.now();
        const endpoint = `/api/customers/orders?t=${timestamp}`;
        
        const response = await apiRequest(endpoint, {
          method: "POST",
          body: orderData
        });
        return response;
      }
    },
    onSuccess: (response: any) => {
      console.log('🎯 [ORDER SUCCESS] Order response received:', response);
      console.log('🎯 [ORDER SUCCESS] Response type:', typeof response);
      console.log('🎯 [ORDER SUCCESS] Response keys:', Object.keys(response || {}));
      
      // RESPECT CUSTOMER'S PAYMENT CHOICE - NO AUTO-SUBSTITUTION
      // Only consider wallet payment if customer explicitly chose wallet methods
      const remainingAmount = parseFloat(response.remainingAmount || 0);
      const customerChoseWallet = paymentMethod === 'wallet_full' || paymentMethod === 'wallet_partial' || paymentMethod === 'wallet_combined';
      const isFullyPaidByWallet = remainingAmount === 0 && customerChoseWallet;
      
      console.log('💳 [PAYMENT DECISION] RESPECTING CUSTOMER CHOICE:', {
        paymentMethod,
        customerChoseWallet,
        remainingAmount,
        isFullyPaidByWallet,
        requiresBankPayment: response.requiresBankPayment,
        paymentStatus: response.paymentStatus,
        walletAmountDeducted: response.walletAmountDeducted,
        'Decision': customerChoseWallet && isFullyPaidByWallet ? 'Complete order (wallet chosen)' : 'Respect customer payment method'
      });
      
      // Only auto-complete if customer EXPLICITLY chose wallet payment AND it's fully paid
      if (isFullyPaidByWallet && customerChoseWallet) {
        console.log('✅ [FULL WALLET PAYMENT] Order fully paid by wallet - completing without bank gateway');
        
        toast({
          title: "سفارش ثبت شد",
          description: `سفارش شما با موفقیت ثبت شد و کاملاً از کیف پول پرداخت شد. شماره سفارش: ${response.orderNumber || response.order?.orderNumber || 'N/A'}`,
        });
        
        // Complete the order without bank gateway
        setTimeout(() => {
          onOrderComplete();
          onClose();
        }, 1500);
        return;
      }
      
      // Check for hybrid payment redirect only if remaining amount > 0
      if (response.requiresBankPayment && response.redirectUrl && remainingAmount > 0) {
        console.log('🔄 [HYBRID PAYMENT] Redirecting to bank gateway:', response.redirectUrl);
        console.log('🔄 [HYBRID PAYMENT] Wallet amount deducted:', response.walletAmountDeducted);
        
        toast({
          title: "پرداخت ترکیبی",
          description: `${response.walletAmountDeducted?.toLocaleString()} IQD از کیف پول کسر شد. هدایت به درگاه بانکی...`,
        });
        
        // Force redirect to hybrid payment page
        setTimeout(() => {
          window.location.href = response.redirectUrl;
        }, 1500);
        return;
      }
      // Handle online_payment method - redirect to bank gateway
      else if (paymentMethod === 'online_payment' && response.redirectToPayment && response.paymentGatewayUrl) {
        console.log('🏦 [ONLINE PAYMENT] Redirecting to bank gateway:', response.paymentGatewayUrl);
        
        toast({
          title: "انتقال به درگاه بانکی",
          description: "در حال انتقال شما به درگاه پرداخت بانکی..."
        });
        
        // Redirect to payment gateway
        setTimeout(() => {
          window.location.href = response.paymentGatewayUrl;
        }, 1500);
        return;
      }
      // Check if payment gateway redirect is needed (legacy)
      else if (response.redirectToPayment && response.paymentGatewayUrl) {
        toast({
          title: "انتقال به درگاه پرداخت",
          description: "در حال انتقال شما به درگاه پرداخت..."
        });
        
        // Redirect to payment gateway
        setTimeout(() => {
          window.location.href = response.paymentGatewayUrl;
        }, 1500);
        return;
      } 
      // Check if bank receipt upload is needed
      else if (paymentMethod === 'bank_receipt') {
        if (selectedReceiptFile) {
          toast({
            title: "✅ سفارش و فیش بانکی ثبت شد",
            description: "سفارش شما با فیش بانکی با موفقیت ثبت شد"
          });
        } else {
          toast({
            title: "سفارش ثبت شد",
            description: "لطفاً فیش واریزی خود را آپلود کنید"
          });
          
          // Redirect to bank receipt upload page only if no file was uploaded
          setTimeout(() => {
            window.location.href = `/bank-receipt-upload/${response.orderId}`;
          }, 1500);
          return; // Don't call onOrderComplete if redirecting
        }
        onOrderComplete();
      }
      // Handle bank transfer with grace period
      else if (paymentMethod === 'bank_transfer_grace') {
        toast({
          title: "✅ سفارش با مهلت 3 روزه ثبت شد",
          description: "سفارش شما قفل شد. تا 3 روز آینده فیش واریزی خود را آپلود کنید"
        });
        onOrderComplete();
      }
      // Handle bank transfer - redirect to payment gateway  
      else if (response.paymentMethod === 'bank_transfer' || finalPaymentMethod === 'bank_transfer') {
        toast({
          title: "انتقال به درگاه بانک",
          description: "در حال هدایت شما به درگاه پرداخت بانکی..."
        });
        
        // Redirect to bank payment gateway
        setTimeout(() => {
          const totalAmount = response.totalAmount || response.remainingAmount || (products.reduce((sum, p) => sum + (parseFloat(p.price || '0') * (cart[p.id] || 0)), 0) + shippingCost);
          window.location.href = `/payment?orderId=${response.orderId || response.order?.id}&amount=${totalAmount}&method=bank`;
        }, 1500);
        return;
      }
      else {
        toast({
          title: t.orderSubmitted,
          description: "سفارش شما با موفقیت ثبت شد"
        });
        onOrderComplete();
      }
    },
    onError: () => {
      toast({
        title: t.orderError,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: any) => {
    console.log('🚀 [SUBMIT DEBUG] onSubmit function called');
    console.log('🚀 [SUBMIT DEBUG] Form data received:', data);
    console.log('🚀 [SUBMIT DEBUG] Selected shipping method:', selectedShippingMethod);
    console.log('🚀 [SUBMIT DEBUG] Payment method:', paymentMethod);
    console.log('🚀 [SUBMIT DEBUG] Form validation state:', form.formState);
    console.log('🚀 [SUBMIT DEBUG] Form errors:', form.formState.errors);
    console.log('🚀 [SUBMIT DEBUG] Mutation pending before submit:', submitOrderMutation.isPending);
    
    // Validate shipping method selection
    if (!selectedShippingMethod) {
      console.log('🚀 [SUBMIT DEBUG] Shipping method validation failed');
      toast({
        title: language === 'ar' ? "روش ارسال اجباری است" : "Shipping method is required",
        description: language === 'ar' ? "لطفاً روش ارسال را انتخاب کنید" : "Please select a shipping method",
        variant: "destructive"
      });
      return;
    }

    // Determine active delivery info based on conditional logic
    const activeDeliveryInfo = {
      // Address determination - use second address if provided, otherwise primary
      activeAddress: (showSecondAddress && secondAddress.trim()) 
        ? secondAddress.trim() 
        : data.address,
      activeCity: (showSecondAddress && secondCity.trim()) 
        ? secondCity.trim() 
        : data.city,
      activeProvince: (showSecondAddress && secondProvince.trim()) 
        ? secondProvince.trim() 
        : (crmCustomerData?.province || ''),
      activePostalCode: secondPostalCode.trim() 
        ? secondPostalCode.trim() 
        : data.postalCode,
      
      // Phone determination - use recipient mobile if provided, otherwise primary
      activePhone: (showRecipientMobile && recipientMobile.trim()) 
        ? recipientMobile.trim() 
        : data.phone,
      
      // Source tracking for logistics
      isUsingSecondAddress: !!(showSecondAddress && secondAddress.trim()),
      isUsingRecipientMobile: !!(showRecipientMobile && recipientMobile.trim()),
    };

    let orderData = {
      ...data,
      cart,
      totalAmount,
      subtotalAmount,
      shippingCost: finalShippingCost,
      vatAmount: totalTaxAmount,
      selectedShippingMethod,
      currency: 'IQD',
      paymentMethod,
      walletAmountUsed: Math.round(walletAmount), // Use actual wallet amount in integer format
      remainingAmount: Math.round(Math.max(0, totalAmount - walletAmount)), // Calculate remaining in integer format
      
      // Enhanced delivery information
      secondDeliveryAddress: showSecondAddress ? secondAddress : null,
      secondDeliveryCity: showSecondAddress ? secondCity : null, 
      secondDeliveryProvince: showSecondAddress ? secondProvince : null,
      secondDeliveryPostalCode: showSecondAddress ? secondPostalCode : null,
      recipientMobile: showRecipientMobile ? recipientMobile : null,
      
      // Active delivery logistics data
      activeDeliveryInfo,
      
      // Add warehouse notes for logistics clarity
      warehouseNotes: `تحویل فعال: ${activeDeliveryInfo.isUsingSecondAddress ? 'آدرس دوم' : 'آدرس اول'} | تماس فعال: ${activeDeliveryInfo.isUsingRecipientMobile ? 'موبایل گیرنده' : 'موبایل اصلی'}`
    };

    console.log('🚚 [DELIVERY LOGIC] Active delivery information:', activeDeliveryInfo);

    // Handle wallet payment calculations with smart wallet_combined conversion
    let finalPaymentMethod = paymentMethod;
    
    // Convert wallet_combined to appropriate wallet type based on wallet amount vs total
    console.log('🔍 [PAYMENT ANALYSIS] Before conversion:', {
      paymentMethod,
      walletAmount,
      totalAmount,
      walletBalance,
      canUseWallet,
      comparison: `${walletAmount} >= ${totalAmount} = ${walletAmount >= totalAmount}`
    });
    
    if (paymentMethod === 'wallet_combined') {
      if (walletAmount >= totalAmount) {
        finalPaymentMethod = 'wallet_full';
        console.log('🔄 [PAYMENT CONVERSION] wallet_combined → wallet_full (sufficient balance)');
      } else if (walletAmount > 0) {
        finalPaymentMethod = 'wallet_partial';
        console.log('🔄 [PAYMENT CONVERSION] wallet_combined → wallet_partial (insufficient balance)');
      }
    }

    orderData.paymentMethod = finalPaymentMethod;

    if (finalPaymentMethod === 'wallet_full') {
      orderData.walletAmountUsed = Math.round(totalAmount);
      orderData.remainingAmount = 0;
    } else if (finalPaymentMethod === 'wallet_partial') {
      orderData.walletAmountUsed = Math.round(walletAmount);
      orderData.remainingAmount = Math.round(Math.max(0, totalAmount - walletAmount));
    } else if (finalPaymentMethod === 'online_payment') {
      orderData.walletAmountUsed = 0;
      orderData.remainingAmount = Math.round(totalAmount);
    } else if (finalPaymentMethod === 'bank_receipt') {
      orderData.walletAmountUsed = 0;
      orderData.remainingAmount = Math.round(totalAmount);
    } else if (finalPaymentMethod === 'bank_transfer_grace') {
      orderData.walletAmountUsed = 0;
      orderData.remainingAmount = Math.round(totalAmount);
      orderData.paymentGracePeriod = true; // Flag for 3-day grace period
    }

    console.log('🚀 [ORDER SUBMIT] Submitting order with complete data:', {
      endpoint: '/api/customers/orders',
      originalPaymentMethod: paymentMethod,
      finalPaymentMethod: finalPaymentMethod,
      totalAmount,
      walletBalance,
      walletAmountUsed: orderData.walletAmountUsed,
      remainingAmount: orderData.remainingAmount,
      walletAmountInput: walletAmount,
      paymentMethodSelected: paymentMethod,
      finalPaymentMethodSent: finalPaymentMethod,
      shouldUseWallet: finalPaymentMethod === 'wallet_full' || finalPaymentMethod === 'wallet_partial',
      paymentConversionApplied: paymentMethod !== finalPaymentMethod,
      orderData
    });

    submitOrderMutation.mutate(orderData);
  };



  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center p-4 ${
        (isDragging || (position.x !== 0 || position.y !== 0)) 
          ? 'pointer-events-none z-50' 
          : 'bg-black/50 z-50'
      }`}
      style={{
        backgroundColor: (isDragging || (position.x !== 0 || position.y !== 0)) 
          ? 'transparent' 
          : 'rgba(0, 0, 0, 0.5)'
      }}
    >
      <Card 
        ref={formRef}
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'} ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } ${
          (isDragging || (position.x !== 0 || position.y !== 0)) 
            ? 'pointer-events-auto shadow-2xl border-2 border-blue-400' 
            : 'pointer-events-auto'
        }`}
        style={{
          position: (isDragging || (position.x !== 0 || position.y !== 0)) ? 'fixed' : 'relative',
          left: (isDragging || (position.x !== 0 || position.y !== 0)) ? position.x : 'auto',
          top: (isDragging || (position.x !== 0 || position.y !== 0)) ? position.y : 'auto',
          zIndex: isDragging ? 9999 : 1000,
          opacity: isDragging ? 0.8 : 1,
          transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          transition: isDragging ? 'none' : 'transform 0.2s ease',
          width: (isDragging || (position.x !== 0 || position.y !== 0)) ? '600px' : 'auto',
          maxWidth: (isDragging || (position.x !== 0 || position.y !== 0)) ? '600px' : '48rem',
        }}
        onMouseDown={handleMouseDown}
        title="کلیک و بکشید تا فرم را جابجا کنید!"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 drag-handle">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <CardTitle className="text-lg">{t.purchaseOrder}</CardTitle>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {isDragging ? '🖱️ در حال جابجایی...' : '🖱️ قابل جابجایی'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPosition({ x: 0, y: 0 })}
              title="بازگشت به مرکز"
            >
              📍
            </Button>
            <span className="text-xs text-gray-500">
              {(position.x !== 0 || position.y !== 0) ? 'صفحه زیرین قابل کلیک است' : 'حالت modal'}
            </span>
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
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{product.name}</h4>
                        </div>
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
                          disabled={quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Check stock availability before allowing increase
                            if (!product.inStock || (product.stockQuantity || 0) <= 0) return;
                            if (quantity >= (product.stockQuantity || 0)) return;
                            onUpdateQuantity && onUpdateQuantity(product.id, quantity + 1);
                          }}
                          className="h-7 w-7 p-0"
                          title={t.increaseQuantity}
                          disabled={!product.inStock || (product.stockQuantity || 0) <= 0 || quantity >= (product.stockQuantity || 0)}
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
                    
                    {/* Item Total with discount info */}
                    <div className="mt-2 pt-2 border-t space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Item Total</span>
                        <span className="font-medium">{formatCurrency(itemTotal)}</span>
                      </div>
                      {discountedPrice < basePrice && (
                        <div className="flex justify-between items-center text-xs text-green-600">
                          <span>{t.discountApplied}</span>
                          <span>-{formatCurrency((basePrice - discountedPrice) * quantity)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Cart Summary */}
            <div className="border-t mt-3 pt-3 space-y-2">
              {/* VAT */}
              {vatData?.vatEnabled && vatAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>مالیات بر ارزش افزوده ({(vatRate * 100).toFixed(0)}%)</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
              )}
              
              {/* Duties */}
              {vatData?.dutiesEnabled && dutiesAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>عوارض بر ارزش افزوده ({(dutiesRate * 100).toFixed(0)}%)</span>
                  <span>{formatCurrency(dutiesAmount)}</span>
                </div>
              )}
              
              {/* Total (without shipping) */}
              <div className="flex justify-between font-semibold text-base border-t pt-2">
                <span>مجموع (بدون هزینه حمل)</span>
                <span className="text-primary">{formatCurrency(subtotalAmount + totalTaxAmount)}</span>
              </div>
              
              {/* Delivery Method Selection */}
              <div className="space-y-3 border-t pt-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">{t.deliveryMethod} *</label>
                  <div className="text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md border">
                    ⚖️ وزن محموله: <span className="font-semibold text-gray-700 dark:text-gray-300">{totalWeight.toFixed(2)} کیلوگرم</span>
                  </div>
                </div>
                {isLoadingShippingRates ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    {language === 'en' ? 'Loading shipping methods...' : language === 'ar' ? 'جارٍ تحميل طرق الشحن...' : 'جارٍ تحميل طرق الشحن...'}
                  </div>
                ) : shippingRatesError ? (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-2 border border-red-200 dark:border-red-800">
                    {language === 'en' ? 'Failed to load shipping methods. Please refresh page.' : language === 'ar' ? 'فشل تحميل طرق الشحن. يرجى إعادة تحميل الصفحة.' : 'فشل تحميل طرق الشحن. يرجى إعادة تحميل الصفحة.'}
                  </div>
                ) : shippingRatesData && shippingRatesData.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={selectedShippingMethod || ''}
                      onChange={(e) => setSelectedShippingMethod(parseInt(e.target.value) || null)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                      required
                    >
                      <option value="">{t.selectDeliveryMethod}</option>
                      {shippingRatesData.map((rate: any) => {
                        // Handle smart_vehicle option specially
                        if (rate.deliveryMethod === 'smart_vehicle' || rate.delivery_method === 'smart_vehicle') {
                          return (
                            <option key={rate.id} value={rate.id} style={{backgroundColor: '#d1fae5', color: '#047857'}}>
                              🚚 انتخاب هوشمند خودرو - محاسبه خودکار بهترین گزینه
                            </option>
                          );
                        }
                        
                        // Handle self_pickup option specially
                        if (rate.deliveryMethod === 'self_pickup' || rate.delivery_method === 'self_pickup') {
                          return (
                            <option key={rate.id} value={rate.id} style={{backgroundColor: '#dbeafe', color: '#1d4ed8'}}>
                              🚶‍♂️ حمل توسط خودم - رایگان
                            </option>
                          );
                        }
                        
                        // Handle standard shipping rates
                        const freeShippingThreshold = parseFloat(rate.freeShippingThreshold || '0');
                        const qualifiesForFreeShipping = freeShippingThreshold > 0 && subtotalAmount >= freeShippingThreshold;
                        
                        return (
                          <option key={rate.id} value={rate.id}>
                            {rate.deliveryMethod || rate.delivery_method || rate.name} - {qualifiesForFreeShipping ? t.freeShipping : formatCurrency(parseFloat(rate.basePrice || rate.base_price || '0'))}
                            {rate.estimatedDays && ` (${rate.estimatedDays} ${language === 'en' ? 'days' : language === 'ar' ? 'أيام' : 'أيام'})`}
                          </option>
                        );
                      })}
                    </select>
                    
                    {/* Show shipping cost details */}
                    {selectedShippingMethod && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        {(() => {
                          const selectedRate = shippingRatesData.find((rate: any) => rate.id === selectedShippingMethod);
                          
                          // Handle smart_vehicle display
                          if (selectedRate && (selectedRate.deliveryMethod === 'smart_vehicle' || selectedRate.delivery_method === 'smart_vehicle')) {
                            return (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-emerald-700 font-medium">🚚 انتخاب هوشمند خودرو:</span>
                                  <div className="text-right">
                                    {optimalVehicle ? (
                                      <div>
                                        <div className="font-bold text-emerald-800">
                                          {optimalVehicle.vehicleType === 'multiple' 
                                            ? `${optimalVehicle.totalVehicles} خودرو` 
                                            : optimalVehicle.vehicleName}
                                        </div>
                                        <div className="text-xs text-emerald-600">{formatCurrency(optimalVehicle.totalCost)}</div>
                                      </div>
                                    ) : smartDeliveryLoading ? (
                                      <span className="font-bold text-emerald-800">در حال محاسبه...</span>
                                    ) : (
                                      <span className="font-bold text-orange-600">در انتظار آدرس مقصد...</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-200">
                                  ✓ سیستم بهترین خودرو را بر اساس وزن، مقصد و کمترین هزینه انتخاب می‌کند
                                  {optimalVehicle && (
                                    <div className="mt-1 font-medium">
                                      {optimalVehicle.vehicleType === 'multiple' ? (
                                        <div>
                                          راه‌حل انتخابی: {optimalVehicle.vehicleName}
                                          <div className="text-xs mt-1 space-y-1">
                                            {optimalVehicle.vehicles?.map((vehicle: any, index: number) => (
                                              <div key={index} className="flex justify-between">
                                                <span>خودرو {index + 1}: {vehicle.vehicleName}</span>
                                                <span>{vehicle.weight} کیلو</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <span>خودرو انتخابی: {optimalVehicle.vehicleName} - {optimalVehicle.vehicleType}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          
                          // Handle self_pickup display
                          if (selectedRate && (selectedRate.deliveryMethod === 'self_pickup' || selectedRate.delivery_method === 'self_pickup')) {
                            return (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-blue-700 font-medium">🚶‍♂️ حمل توسط خودم:</span>
                                  <span className="font-bold text-blue-800">رایگان</span>
                                </div>
                                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                                  ✓ شما خودتان کالا را از محل شرکت تحویل خواهید گرفت - بدون هزینه حمل
                                </div>
                              </div>
                            );
                          }
                          
                          // Handle standard shipping rates
                          return (
                            <div>
                              <div className="flex justify-between items-center text-sm">
                                <span>{t.shippingCost}:</span>
                                <span className="font-medium">
                                  {shippingCost === 0 ? t.freeShipping : formatCurrency(shippingCost)}
                                </span>
                              </div>
                              {(() => {
                                const freeShippingThreshold = parseFloat(selectedRate?.freeShippingThreshold || '0');
                                if (freeShippingThreshold > 0 && subtotalAmount >= freeShippingThreshold) {
                                  return (
                                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                      ✓ {language === 'en' ? 'Free shipping for orders over' : language === 'ar' ? 'شحن مجاني للطلبات فوق' : 'شحن مجاني للطلبات فوق'} {formatCurrency(freeShippingThreshold)}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 border border-amber-200 dark:border-amber-800">
                    {language === 'en' ? 'No shipping methods available at the moment.' : language === 'ar' ? 'لا توجد طرق شحن متاحة في الوقت الحالي.' : 'لا توجد طرق شحن متاحة في الوقت الحالي.'}
                  </div>
                )}
              </div>
              
              {/* Smart Delivery Cost Display */}
              {selectedShippingMethod && (
                <div className="flex justify-between text-sm">
                  <span>
                    {(() => {
                      const selectedRate = shippingRatesData?.find((rate: any) => rate.id === selectedShippingMethod);
                      
                      // Handle smart vehicle display
                      if (selectedRate && (selectedRate.deliveryMethod === 'smart_vehicle' || selectedRate.delivery_method === 'smart_vehicle')) {
                        return '🚚 هزینه ارسال هوشمند';
                      }
                      
                      // Handle self pickup display  
                      if (selectedRate && (selectedRate.deliveryMethod === 'self_pickup' || selectedRate.delivery_method === 'self_pickup')) {
                        return '🚶‍♂️ حمل توسط خودم';
                      }
                      
                      return selectedRate?.name || t.deliveryMethod;
                    })()}
                  </span>
                  <span>
                    {(() => {
                      const selectedRate = shippingRatesData?.find((rate: any) => rate.id === selectedShippingMethod);
                      
                      // Handle smart vehicle cost
                      if (selectedRate && (selectedRate.deliveryMethod === 'smart_vehicle' || selectedRate.delivery_method === 'smart_vehicle')) {
                        if (smartDeliveryLoading) {
                          return <span className="text-emerald-600">در حال محاسبه...</span>;
                        }
                        if (finalShippingCost > 0) {
                          return <span className="text-emerald-600 font-bold">{formatCurrency(finalShippingCost)}</span>;
                        }
                        return <span className="text-gray-500">در انتظار آدرس</span>;
                      }
                      
                      // Handle self pickup cost
                      if (selectedRate && (selectedRate.deliveryMethod === 'self_pickup' || selectedRate.delivery_method === 'self_pickup')) {
                        return <span className="text-blue-600 font-bold">رایگان</span>;
                      }
                      
                      return shippingCost === 0 ? t.freeShipping : formatCurrency(shippingCost);
                    })()}
                  </span>
                </div>
              )}
              
              {/* Final Amount */}
              <div className="flex justify-between font-bold text-lg border-t pt-2 bg-yellow-300 px-2 py-2 rounded-lg">
                <span>Final Amount</span>
                <span className="text-gray-900">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection - moved up below total */}
          {customerData?.success && (
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
              <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)} className="space-y-3">
                {/* اولویت اول: پرداخت آنلاین */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="online_payment" id="online_payment" />
                  <Label htmlFor="online_payment" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold">پرداخت آنلاین (کارت بانکی)</span>
                  </Label>
                </div>
                
                {/* دوم: پرداخت از کیف پول (تمام یا بخش از آن) */}
                {canUseWallet && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="wallet_combined" id="wallet_combined" />
                    <Label htmlFor="wallet_combined" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">استفاده از کیف پول (حداکثر {Math.min(walletBalance, totalAmount).toLocaleString()} IQD)</span>
                    </Label>
                  </div>
                )}
                
                {/* اضافی: والت جزئی - فقط برای نمایش */}
                {canUseWallet && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="wallet_partial" id="wallet_partial" />
                    <Label htmlFor="wallet_partial" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="w-4 h-4 text-orange-600" />
                      پرداخت بخشی از والت + بانک
                    </Label>
                  </div>
                )}
                
                {/* چهارم: واریز بانکی با مهلت 3 روزه */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem 
                    value="bank_transfer_grace" 
                    id="bank_transfer_grace"
                  />
                  <Label htmlFor="bank_transfer_grace" className="flex items-center gap-2 cursor-pointer">
                    <Clock className="w-4 h-4 text-amber-600" />
                    واریز بانکی با مهلت 3 روزه
                  </Label>
                  <span className="text-xs text-amber-600 mr-2">
                    برای ارسال حواله بانکی به پروفایل مراجعه کنید
                  </span>
                </div>


              </RadioGroup>

              {/* Partial Payment Amount Input */}
              {paymentMethod === 'wallet_partial' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="walletAmount">مبلغ از والت (حداکثر {Math.min(walletBalance, totalAmount).toLocaleString()} IQD)</Label>
                    <Input
                      id="walletAmount"
                      type="number"
                      min="0"
                      max={Math.min(walletBalance, totalAmount)}
                      value={walletAmount || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setWalletAmount(Math.min(value, Math.min(walletBalance, totalAmount)));
                      }}
                      placeholder="مقدار دلخواه از کیف پول"
                      className="text-right"
                    />
                  </div>
                  
                  {/* Payment Breakdown Table */}
                  {walletAmount > 0 && (
                    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody>
                          {/* Final Amount Row */}
                          <tr className="border-b">
                            <td className="px-4 py-3 text-right font-medium bg-gray-50">Final Amount</td>
                            <td className="px-4 py-3 text-center font-bold">{totalAmount.toLocaleString()}</td>
                            <td className="px-4 py-3 bg-gray-50"></td>
                            <td className="px-4 py-3 bg-gray-50"></td>
                          </tr>
                          
                          {/* Wallet Payment Row */}
                          <tr className="border-b">
                            <td className="px-4 py-3 text-right">مبلغ پرداخت از کیف پول</td>
                            <td className="px-4 py-3 text-center font-medium">{walletAmount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-medium bg-blue-50">محدودیت کیف پول</td>
                            <td className="px-4 py-3 text-center font-medium bg-blue-50 text-blue-700">{walletBalance.toLocaleString()}</td>
                          </tr>
                          
                          {/* Bank Payment Row */}
                          <tr>
                            <td className="px-4 py-3 text-right">پرداخت کارت بانکی</td>
                            <td className="px-4 py-3 text-center font-medium text-orange-600">{(totalAmount - walletAmount).toLocaleString()}</td>
                            <td className="px-4 py-3 bg-gray-50"></td>
                            <td className="px-4 py-3 bg-gray-50"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Summary */}
              {(paymentMethod === 'wallet_full' || paymentMethod === 'wallet_partial') && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>مبلغ کل:</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>پرداخت از والت:</span>
                      <span>-{formatCurrency(paymentMethod === 'wallet_full' ? totalAmount : walletAmount)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>مبلغ باقیمانده:</span>
                      <span>{formatCurrency(paymentMethod === 'wallet_full' ? 0 : totalAmount - walletAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
              {t.enterDetails}
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
                          className={`${isRTL ? 'text-right' : 'text-left'} bg-gray-100 dark:bg-gray-700`}
                          readOnly={!!(customerData?.success && customerData.customer)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone Number with conditional graying */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className={isPrimaryMobileDisabled ? 'opacity-60' : ''}>
                      <FormLabel className={isPrimaryMobileDisabled ? 'text-gray-500' : ''}>
                        {isPrimaryMobileDisabled ? t.crmPhoneDisabled : t.deliveryPhone}
                        {isPrimaryMobileDisabled && hasCrmData && (
                          <span className="text-orange-500 mr-2">⚠️</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="tel"
                          placeholder={t.phonePlaceholder}
                          className={`${isRTL ? 'text-right' : 'text-left'} ${
                            isPrimaryMobileDisabled 
                              ? 'bg-gray-100 text-gray-500 border-gray-300' 
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}
                          readOnly={!!(customerData?.success && customerData.customer) || isPrimaryMobileDisabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Primary Address Card from CRM */}
                {hasCrmData ? (
                  <div className={`space-y-3 p-4 rounded-lg border ${
                    isPrimaryAddressDisabled 
                      ? 'bg-gray-100 border-gray-300 opacity-60' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium ${
                        isPrimaryAddressDisabled ? 'text-gray-500' : 'text-green-800'
                      }`}>
                        📍 {isPrimaryAddressDisabled ? 'آدرس پیش‌فرض (غیرفعال)' : 'آدرس پیش‌فرض تحویل'}
                        {isPrimaryAddressDisabled && (
                          <span className="text-orange-500 mr-2">⚠️</span>
                        )}
                      </h4>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="bg-white rounded p-3 border border-green-100">
                        <p className={`text-sm font-medium ${
                          isPrimaryAddressDisabled ? 'text-gray-600' : 'text-green-800'
                        }`}>
                          {crmCustomerData?.firstName} {crmCustomerData?.lastName}
                        </p>
                        <p className={`text-sm ${
                          isPrimaryAddressDisabled ? 'text-gray-500' : 'text-green-700'
                        }`}>
                          {crmCustomerData?.address || 'آدرس ثبت نشده'}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <p className={`text-xs ${
                            isPrimaryAddressDisabled ? 'text-gray-500' : 'text-green-600'
                          }`}>
                            📞 {crmCustomerData?.phone}
                          </p>
                          <p className={`text-xs ${
                            isPrimaryAddressDisabled ? 'text-gray-500' : 'text-green-600'
                          }`}>
                            🏙️ {crmCustomerData?.cityRegion || crmCustomerData?.city || crmCustomerData?.province || 'شهر ثبت نشده'}
                          </p>
                          {crmCustomerData?.province && crmCustomerData?.province !== crmCustomerData?.cityRegion && (
                            <p className={`text-xs ${
                              isPrimaryAddressDisabled ? 'text-gray-500' : 'text-green-600'
                            }`}>
                              🏛️ استان: {crmCustomerData.province}
                            </p>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  /* Fallback for non-CRM users */
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
                )}

                {/* Second Address Option - Only show for CRM customers */}
                {hasCrmData && (
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg border">
                    {/* Instruction text */}
                    <div className={`text-sm text-blue-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span className="font-medium">📍 {t.secondAddressInstruction}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.secondDeliveryAddress}
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSecondAddress(!showSecondAddress)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-100"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {showSecondAddress ? t.removeSecondAddress : t.addSecondAddress}
                      </Button>
                    </div>
                    {showSecondAddress && (
                      <div className="space-y-3">
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              value={secondAddress}
                              onChange={(e) => setSecondAddress(e.target.value)}
                              rows={2}
                              placeholder={t.secondAddressPlaceholder}
                              className={`${isRTL ? 'text-right' : 'text-left'} bg-white`}
                            />
                          </FormControl>
                        </FormItem>
                        
                        {/* Province and City Dropdowns for Second Address */}
                        <div className="grid grid-cols-3 gap-3">
                          {/* Province Dropdown */}
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {language === 'ar' ? 'استان' : 'Province'}
                            </label>
                            <Select 
                              onValueChange={(value) => {
                                // Find the selected province object to get Arabic name
                                const selectedProvince = provinces?.data?.find((p: any) => 
                                  p.nameEnglish === value || p.name === value
                                );
                                
                                if (selectedProvince) {
                                  // Use Arabic name for delivery calculations
                                  const arabicProvinceName = selectedProvince.nameArabic || selectedProvince.name || value;
                                  setSecondProvince(arabicProvinceName); // Store Arabic name for API calls
                                  setSelectedSecondaryProvinceId(selectedProvince.id);
                                  // Clear city selection when province changes
                                  setSecondCity("");
                                  
                                  console.log('🏛️ [BILINGUAL] Province selected:', {
                                    displayValue: value,
                                    arabicName: arabicProvinceName,
                                    provinceId: selectedProvince.id
                                  });
                                }
                              }} 
                              value={
                                // Find the province with matching Arabic name to show English value
                                provinces?.data?.find((province: any) => 
                                  (province.nameArabic || province.name) === secondProvince
                                )?.nameEnglish || secondProvince
                              }
                              disabled={isLoadingProvinces}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  isLoadingProvinces 
                                    ? (language === 'ar' ? 'در حال بارگذاری...' : 'Loading...')
                                    : (language === 'ar' ? 'انتخاب استان' : 'Select Province')
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                {provinces?.data && Array.isArray(provinces.data) && provinces.data.map((province: any) => (
                                  <SelectItem key={province.id} value={province.nameEnglish || province.name}>
                                    {province.nameEnglish} / {province.nameArabic || province.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* City Dropdown */}
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {language === 'ar' ? 'شهر' : 'City'}
                            </label>
                            <Select 
                              onValueChange={(value) => {
                                // Find the selected city object to get Arabic name
                                const selectedCity = secondaryCities?.find((city: any) => 
                                  (city.nameEnglish || city.name) === value
                                );
                                
                                // Use Arabic name for delivery calculations, but display value for UI
                                const arabicCityName = selectedCity?.nameArabic || selectedCity?.name || value;
                                setSecondCity(arabicCityName); // Store Arabic name for API calls
                                
                                console.log('🏙️ [BILINGUAL] City selected:', {
                                  displayValue: value,
                                  arabicName: arabicCityName,
                                  selectedCity: selectedCity
                                });
                              }} 
                              value={
                                // Find the city with matching Arabic name to show English value
                                secondaryCities?.find((city: any) => 
                                  (city.nameArabic || city.name) === secondCity
                                )?.nameEnglish || secondCity
                              }
                              disabled={!selectedSecondaryProvinceId || isLoadingSecondaryCities}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  !selectedSecondaryProvinceId 
                                    ? (language === 'ar' ? 'ابتدا استان را انتخاب کنید' : 'Select province first')
                                    : isLoadingSecondaryCities
                                    ? (language === 'ar' ? 'در حال بارگذاری...' : 'Loading...')
                                    : (language === 'ar' ? 'انتخاب شهر' : 'Select City')
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                {secondaryCities && Array.isArray(secondaryCities) && secondaryCities.map((city: any) => (
                                  <SelectItem key={city.id} value={city.nameEnglish || city.name}>
                                    {city.nameEnglish} / {city.nameArabic || city.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Postal Code */}
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {language === 'ar' ? 'کد پستی' : 'Postal Code'}
                            </label>
                            <Input 
                              value={secondPostalCode}
                              onChange={(e) => setSecondPostalCode(e.target.value)}
                              placeholder="12345"
                              className={`${isRTL ? 'text-right' : 'text-left'} bg-white`}
                            />
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                )}

                {/* Recipient Mobile Number - Only show for CRM customers */}
                {hasCrmData && (
                  <div className="space-y-3 p-4 bg-purple-50 rounded-lg border">
                    {/* Instruction text */}
                    <div className={`text-sm text-purple-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span className="font-medium">📱 {t.recipientMobileInstruction}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.recipientMobileNumber}
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRecipientMobile(!showRecipientMobile)}
                        className="text-purple-600 border-purple-200 hover:bg-purple-100"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {showRecipientMobile ? t.removeRecipientMobile : t.addRecipientMobile}
                      </Button>
                    </div>
                    {showRecipientMobile && (
                      <div className="space-y-3">
                        <FormItem>
                          <FormControl>
                            <Input 
                              value={recipientMobile}
                              onChange={(e) => setRecipientMobile(e.target.value)}
                              type="tel"
                              placeholder={t.recipientMobilePlaceholder}
                              className={`${isRTL ? 'text-right' : 'text-left'} bg-white`}
                            />
                          </FormControl>
                        </FormItem>
                      </div>
                    )}
                  </div>
                )}



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
                    onClick={(e) => {
                      console.log('🔘 [BUTTON DEBUG] Submit button clicked');
                      console.log('🔘 [BUTTON DEBUG] Mutation pending:', submitOrderMutation.isPending);
                      console.log('🔘 [BUTTON DEBUG] Form valid:', form.formState.isValid);
                      console.log('🔘 [BUTTON DEBUG] Form errors:', form.formState.errors);
                      console.log('🔘 [BUTTON DEBUG] Selected shipping method:', selectedShippingMethod);
                      console.log('🔘 [BUTTON DEBUG] Payment method:', paymentMethod);
                      
                      // Don't prevent default - let form handle submission
                    }}
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
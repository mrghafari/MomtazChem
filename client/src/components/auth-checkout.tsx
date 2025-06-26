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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ShoppingCart, User, Lock, UserPlus, AlertCircle, MapPin, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Translation system
type Language = 'en' | 'ar';

const translations = {
  en: {
    // Form titles and navigation
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
    emailRequired: "Please enter a valid email address",
    passwordMin: "Password must be at least 6 characters",
    firstNameMin: "First name must be at least 2 characters",
    lastNameMin: "Last name must be at least 2 characters",
    phoneRequired: "Please enter a valid phone number",
    passwordMatch: "Password confirmation does not match",
    addressRequired: "Please enter complete address",
    cityRequired: "Please enter city",
    postalCodeRequired: "Please enter postal code",
    
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
    orderError: "Failed to submit order"
  },
  ar: {
    // Form titles and navigation
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
    emailRequired: "يرجى إدخال عنوان بريد إلكتروني صحيح",
    passwordMin: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    firstNameMin: "الاسم الأول يجب أن يكون حرفين على الأقل",
    lastNameMin: "اسم العائلة يجب أن يكون حرفين على الأقل",
    phoneRequired: "يرجى إدخال رقم هاتف صحيح",
    passwordMatch: "تأكيد كلمة المرور غير متطابق",
    addressRequired: "يرجى إدخال العنوان الكامل",
    cityRequired: "يرجى إدخال المدينة",
    postalCodeRequired: "يرجى إدخال الرمز البريدي",
    
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
    orderError: "فشل في إرسال الطلب"
  }
};

// Dynamic schemas based on language
const createLoginSchema = (lang: Language) => z.object({
  email: z.string().email(translations[lang].emailRequired),
  password: z.string().min(6, translations[lang].passwordMin),
});

const createRegisterSchema = (lang: Language) => z.object({
  email: z.string().email(translations[lang].emailRequired),
  password: z.string().min(6, translations[lang].passwordMin),
  confirmPassword: z.string(),
  firstName: z.string().min(2, translations[lang].firstNameMin),
  lastName: z.string().min(2, translations[lang].lastNameMin),
  phone: z.string().min(10, translations[lang].phoneRequired),
  company: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: translations[lang].passwordMatch,
  path: ["confirmPassword"],
});

const createCheckoutSchema = (lang: Language) => z.object({
  address: z.string().min(10, translations[lang].addressRequired),
  city: z.string().min(2, translations[lang].cityRequired),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  gpsLatitude: z.number().optional(),
  gpsLongitude: z.number().optional(),
});

interface AuthCheckoutProps {
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

export default function AuthCheckout({ cart, products, onOrderComplete, onClose }: AuthCheckoutProps) {
  const [currentStep, setCurrentStep] = useState<"auth" | "checkout" | "complete">("auth");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [customer, setCustomer] = useState<any>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [savedCartData, setSavedCartData] = useState<any>(null);
  const { toast } = useToast();

  // Save cart data to preserve during authentication
  useEffect(() => {
    if (cart && products) {
      const cartData = {
        cart,
        products,
        timestamp: Date.now(),
      };
      setSavedCartData(cartData);
      localStorage.setItem('pendingCart', JSON.stringify(cartData));
    }
  }, [cart, products]);

  // Check if customer is already logged in
  const { data: customerData, refetch: refetchCustomer } = useQuery<any>({
    queryKey: ["/api/customers/me"],
    retry: false,
  });

  useEffect(() => {
    if (customerData?.success && customerData.customer) {
      setCustomer(customerData.customer);
      setCurrentStep("checkout");
    }
  }, [customerData]);

  // Authentication forms
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema.extend({
      phone: z.string().min(1, "Phone number is required"),
      country: z.string().min(1, "Country is required"),
      city: z.string().min(1, "City is required"),
      address: z.string().min(1, "Address is required"),
    })),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      company: "",
      country: "",
      city: "",
      address: "",
      postalCode: "",
      alternatePhone: "",
      industry: "",
      businessType: "retail",
      communicationPreference: "email",
      preferredLanguage: "fa",
      marketingConsent: false,
    },
  });

  // Checkout form
  const checkoutForm = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      address: "",
      city: "",
      postalCode: "",
      notes: "",
    },
  });

  // Auto-fill checkout form when customer data is available
  useEffect(() => {
    if (customer) {
      if (customer.address) checkoutForm.setValue("address", customer.address);
      if (customer.city) checkoutForm.setValue("city", customer.city);
      if (customer.postalCode) checkoutForm.setValue("postalCode", customer.postalCode);
    }
  }, [customer, checkoutForm]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/customers/login", "POST", data);
    },
    onSuccess: async (data: any) => {
      if (data.success) {
        setCustomer(data.customer);
        setCurrentStep("checkout");
        setEmailExists(false);
        await refetchCustomer();
        toast({
          title: "ورود موفق",
          description: `خوش آمدید ${data.customer.firstName}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ورود",
        description: "ایمیل یا رمز عبور اشتباه است",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/customers/register", "POST", data);
    },
    onSuccess: async (data: any) => {
      if (data.success) {
        setCustomer(data.customer);
        setCurrentStep("checkout");
        setEmailExists(false);
        await refetchCustomer();
        toast({
          title: "ثبت نام موفق",
          description: `حساب کاربری شما ایجاد شد`,
        });
      }
    },
    onError: (error: any) => {
      if (error.message?.includes("already exists") || error.message?.includes("موجود") || error.message?.includes("duplicate")) {
        setEmailExists(true);
        toast({
          title: "ایمیل تکراری",
          description: "این ایمیل قبلاً ثبت شده است. لطفاً وارد شوید",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطا در ثبت نام",
          description: "مشکلی در ایجاد حساب کاربری رخ داده است",
          variant: "destructive",
        });
      }
    },
  });

  // Order creation mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest("/api/shop/orders", "POST", orderData);
    },
    onSuccess: (data: any) => {
      setOrderNumber(data.order.id);
      setCurrentStep("complete");
      // Clear saved cart data
      localStorage.removeItem('pendingCart');
      onOrderComplete();
      toast({
        title: "سفارش ثبت شد",
        description: `شماره سفارش: ${data.order.id}`,
      });
    },
    onError: () => {
      toast({
        title: "خطا در ثبت سفارش",
        description: "مشکلی در ثبت سفارش رخ داده است",
        variant: "destructive",
      });
    },
  });

  // Calculate cart totals using saved cart data or current cart
  const currentCart = savedCartData?.cart || cart;
  const currentProducts = savedCartData?.products || products;

  const cartItems = Object.entries(currentCart).map(([productId, quantity]) => {
    const product = currentProducts.find((p: any) => p.id === parseInt(productId));
    return product ? {
      ...product,
      quantity: quantity as number,
      totalPrice: parseFloat(product.price) * (quantity as number)
    } : null;
  }).filter(Boolean);

  const subtotal = cartItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
  const shippingCost = subtotal > 1000 ? 0 : 50;
  const totalAmount = subtotal + shippingCost;

  // Handle login form submission
  const onLogin = (data: any) => {
    loginMutation.mutate(data);
  };

  // Handle register form submission
  const onRegister = (data: any) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // Handle checkout form submission
  const onCheckout = (data: any) => {
    const orderData = {
      customerInfo: {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        company: customer.company || '',
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: 'Iran',
      },
      items: cartItems.map((item: any) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.price),
      })),
      totalAmount,
      notes: data.notes || '',
    };

    createOrderMutation.mutate(orderData);
  };

  // Switch to login when email exists
  const switchToLogin = () => {
    const email = registerForm.getValues("email");
    setAuthMode("login");
    loginForm.setValue("email", email);
    setEmailExists(false);
  };

  if (Object.keys(currentCart).length === 0) {
    return (
      <div className="text-center p-8">
        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">سبد خرید خالی است</h2>
        <p className="text-gray-500 mb-6">محصولاتی به سبد خرید اضافه کنید</p>
        <Button onClick={onClose}>ادامه خرید</Button>
      </div>
    );
  }

  if (currentStep === "complete") {
    return (
      <div className="text-center p-8">
        <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">سفارش تأیید شد!</h2>
        <p className="text-gray-600 mb-2">از خرید شما متشکریم</p>
        <p className="text-lg font-semibold text-gray-900 mb-6">
          شماره سفارش: #{orderNumber}
        </p>
        <div className="space-y-3">
          <Button onClick={onClose} className="w-full">
            ادامه خرید
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Authentication/Checkout Form */}
        <div>
          {currentStep === "auth" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  ورود یا ثبت نام برای تسویه حساب
                </CardTitle>
                <p className="text-sm text-gray-600">
                  برای تکمیل سفارش باید وارد حساب کاربری شوید
                </p>
              </CardHeader>
              <CardContent>
                {emailExists && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-yellow-800 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        این ایمیل قبلاً ثبت شده است
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mb-3">
                      با همین ایمیل حساب کاربری دارید. لطفاً وارد شوید تا سفارش شما حفظ شود.
                    </p>
                    <Button 
                      variant="outline"
                      size="sm" 
                      onClick={switchToLogin}
                      className="text-yellow-700 border-yellow-300"
                    >
                      انتقال به صفحه ورود
                    </Button>
                  </div>
                )}

                <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as any)}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">ورود</TabsTrigger>
                    <TabsTrigger value="register">ثبت نام</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ایمیل</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>رمز عبور</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "در حال ورود..." : "ورود و ادامه تسویه"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>نام</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>نام خانوادگی</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ایمیل</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>شماره تلفن *</FormLabel>
                              <FormControl>
                                <Input {...field} required />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نام شرکت *</FormLabel>
                              <FormControl>
                                <Input {...field} required />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>کشور *</FormLabel>
                                <FormControl>
                                  <Input {...field} required />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>شهر *</FormLabel>
                                <FormControl>
                                  <Input {...field} required />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={registerForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>آدرس *</FormLabel>
                              <FormControl>
                                <Input {...field} required />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="postalCode"
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
                        <FormField
                          control={registerForm.control}
                          name="alternatePhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تلفن دوم</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>صنعت</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="مثال: شیمیایی، نفت و گاز" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="businessType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>نوع کسب و کار</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="retail">خرده فروشی</SelectItem>
                                    <SelectItem value="wholesale">عمده فروشی</SelectItem>
                                    <SelectItem value="distributor">توزیع کننده</SelectItem>
                                    <SelectItem value="manufacturer">تولید کننده</SelectItem>
                                    <SelectItem value="end_user">مصرف کننده نهایی</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="communicationPreference"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>روش ارتباط ترجیحی</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="email">ایمیل</SelectItem>
                                    <SelectItem value="phone">تلفن</SelectItem>
                                    <SelectItem value="sms">پیامک</SelectItem>
                                    <SelectItem value="whatsapp">واتساپ</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <FormField
                            control={registerForm.control}
                            name="marketingConsent"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="rounded border-gray-300"
                                  />
                                </FormControl>
                                <FormLabel className="text-sm">
                                  موافقت با دریافت اطلاعیه‌های بازاریابی
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>رمز عبور</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>تکرار رمز عبور</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "در حال ثبت نام..." : "ثبت نام و ادامه تسویه"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {currentStep === "checkout" && customer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  اطلاعات تسویه حساب
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {customer.firstName} {customer.lastName}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...checkoutForm}>
                  <form onSubmit={checkoutForm.handleSubmit(onCheckout)} className="space-y-4">
                    <FormField
                      control={checkoutForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>آدرس کامل</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={checkoutForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>شهر</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={checkoutForm.control}
                        name="postalCode"
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
                    <FormField
                      control={checkoutForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>یادداشت (اختیاری)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={2} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={createOrderMutation.isPending}
                    >
                      {createOrderMutation.isPending ? "در حال ثبت سفارش..." : "تکمیل سفارش"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>خلاصه سفارش</CardTitle>
              <p className="text-sm text-gray-600">
                سفارش شما در طول فرآیند احراز هویت حفظ می‌شود
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">تعداد: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${item.totalPrice.toFixed(2)}</p>
                </div>
              ))}
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>جمع کل</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>هزینه ارسال</span>
                  <span>{shippingCost === 0 ? "رایگان" : `$${shippingCost}`}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>مجموع</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
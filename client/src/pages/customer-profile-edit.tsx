import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ArrowLeft, Save, Shield, Phone, Mail, Building, MapPin, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Schema for profile editing - includes all CRM fields
const createEditProfileSchema = (t: any) => z.object({
  firstName: z.string().min(1, t.firstName + " is required"),
  lastName: z.string().min(1, t.lastName + " is required"),
  phone: z.string().min(1, t.phone + " is required"),
  email: z.string().email("Invalid email").optional(),
  company: z.string().optional(),
  country: z.string().min(1, t.country + " is required"),
  province: z.string().min(1, "Province is required"),
  city: z.string().min(1, t.city + " is required"),
  address: z.string().min(1, t.address + " is required"),
  secondaryAddress: z.string().optional(),
  postalCode: z.string().optional(),
  alternatePhone: z.string().optional(),
  industry: z.string().optional(),
  businessType: z.string().optional(),
  companySize: z.string().optional(),
  communicationPreference: z.string().optional(),
  preferredLanguage: z.string().optional(),
  marketingConsent: z.boolean().optional(),
  notes: z.string().optional(),
  customerType: z.string().optional(),
  customerStatus: z.string().optional(),
  preferredPaymentMethod: z.string().optional(),
  creditLimit: z.string().optional(),
  website: z.string().optional(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  leadSource: z.string().optional(),
  assignedSalesRep: z.string().optional(),
  // Additional CRM fields
  annualRevenue: z.string().optional(),
  priceRange: z.string().optional(),
  orderFrequency: z.string().optional(),
  creditStatus: z.string().optional(),
  smsEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
});

const createSmsVerificationSchema = (t: any) => z.object({
  code: z.string().min(4, "Verification code must be at least 4 digits"),
});

export default function CustomerProfileEdit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, direction } = useLanguage();
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>(null);
  
  const editProfileSchema = createEditProfileSchema(t);
  const smsVerificationSchema = createSmsVerificationSchema(t);
  
  type EditProfileForm = z.infer<typeof editProfileSchema>;
  type SmsVerificationForm = z.infer<typeof smsVerificationSchema>;

  // Get parameters from query string
  const urlParams = new URLSearchParams(window.location.search);
  const customerId = urlParams.get('customerId');
  const mode = urlParams.get('mode'); // 'create' for new customer creation
  const isCreateMode = mode === 'create';
  
  // Fetch customer data - only if not in create mode
  const { data: customer, isLoading, error: customerError } = useQuery<any>({
    queryKey: customerId ? ["/api/crm/customers", customerId] : ["/api/customers/me"],
    queryFn: async () => {
      if (isCreateMode) return null; // Skip loading for create mode
      
      const endpoint = customerId ? `/api/crm/customers/${customerId}` : "/api/customers/me";
      const response = await fetch(endpoint, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch customer data');
      const result = await response.json();
      return customerId ? result.data : result;
    },
    retry: 1,
    enabled: !isCreateMode, // Only fetch if not in create mode
  });

  // Fetch provinces data
  const { data: provincesData } = useQuery({
    queryKey: ["/api/logistics/provinces"],
    retry: 1,
  });

  // State for selected province to filter cities
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);

  // Fetch cities data based on selected province
  const { data: citiesData } = useQuery({
    queryKey: ["/api/logistics/cities", selectedProvinceId],
    queryFn: () => {
      const url = selectedProvinceId 
        ? `/api/logistics/cities?provinceId=${selectedProvinceId}`
        : '/api/logistics/cities';
      return fetch(url).then(res => res.json());
    },
    retry: 1,
  });

  const provinces = (provincesData && typeof provincesData === 'object' && 'data' in provincesData) ? provincesData.data : [];
  const cities = (citiesData && typeof citiesData === 'object' && 'data' in citiesData) ? citiesData.data : [];

  const form = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      company: "",
      country: "",
      province: "",
      city: "",
      address: "",
      secondaryAddress: "",
      postalCode: "",
      alternatePhone: "",
      industry: "",
      businessType: "",
      companySize: "",
      communicationPreference: "",
      preferredLanguage: "",
      marketingConsent: false,
      notes: "",
      customerType: "",
      customerStatus: "",
      preferredPaymentMethod: "",
      creditLimit: "",
      website: "",
      taxId: "",
      registrationNumber: "",
      leadSource: "",
      assignedSalesRep: "",
      // Additional CRM fields
      annualRevenue: "",
      priceRange: "",
      orderFrequency: "",
      creditStatus: "",
      smsEnabled: false,
      emailEnabled: false,
    },
  });

  const smsForm = useForm<SmsVerificationForm>({
    resolver: zodResolver(smsVerificationSchema),
    defaultValues: {
      code: ""
    }
  });

  // Update form values when customer data is loaded
  useEffect(() => {
    if (customer?.customer) {
      const customerData = customer.customer;
      
      // Debug: Log customer data to check CRM fields
      console.log('🔍 [UI DEBUG] Customer data loaded');
      console.log('🔍 [CRM DEBUG] CRM Fields from API:', {
        annualRevenue: customerData.annualRevenue,
        priceRange: customerData.priceRange,
        orderFrequency: customerData.orderFrequency,
        creditStatus: customerData.creditStatus,
        smsEnabled: customerData.smsEnabled,
        emailEnabled: customerData.emailEnabled
      });
      console.log('🔍 [VALUES] Actual CRM values:', 
        'annualRevenue=' + customerData.annualRevenue,
        'priceRange=' + customerData.priceRange,
        'orderFrequency=' + customerData.orderFrequency,
        'creditStatus=' + customerData.creditStatus,
        'smsEnabled=' + customerData.smsEnabled,
        'emailEnabled=' + customerData.emailEnabled
      );
      
      // Debug: Tax ID and Registration Number specifically
      console.log('🏢 [TAX DEBUG] Tax & Registration from API:', {
        taxId: customerData.taxId,
        registrationNumber: customerData.registrationNumber
      });
      console.log('🏢 [TAX VALUES] Actual values:', 
        'taxId=' + customerData.taxId,
        'registrationNumber=' + customerData.registrationNumber
      );
      
      form.reset({
        firstName: customerData.firstName || "",
        lastName: customerData.lastName || "",
        phone: customerData.phone || "",
        email: customerData.email || "",
        company: customerData.company || "",
        country: customerData.country || "",
        province: customerData.province || "",
        city: customerData.city || "",
        address: customerData.address || "",
        secondaryAddress: customerData.state || customerData.secondaryAddress || "",
        postalCode: customerData.postalCode || "",
        alternatePhone: customerData.alternatePhone || "",
        industry: customerData.industry || "",
        businessType: customerData.businessType || "",
        companySize: customerData.companySize || "",
        communicationPreference: customerData.communicationPreference || "",
        preferredLanguage: customerData.preferredLanguage || "",
        marketingConsent: customerData.marketingConsent || false,
        notes: customerData.publicNotes || customerData.notes || "",
        customerType: customerData.customerType || "",
        customerStatus: customerData.customerStatus || "",
        preferredPaymentMethod: customerData.preferredPaymentMethod || "",
        creditLimit: customerData.creditLimit ? customerData.creditLimit.toString() : "",
        website: customerData.website || "",
        taxId: customerData.taxId || "",
        registrationNumber: customerData.registrationNumber || "",

        leadSource: customerData.customerSource || customerData.leadSource || "",
        assignedSalesRep: customerData.assignedSalesRep || "",
        // Additional CRM fields
        annualRevenue: customerData.annualRevenue || "",
        priceRange: customerData.priceRange || "",
        orderFrequency: customerData.orderFrequency || "",
        creditStatus: customerData.creditStatus || "",
        smsEnabled: customerData.smsEnabled || false,
        emailEnabled: customerData.emailEnabled || false,
      });
      
      console.log('✅ [UI DEBUG] Form reset completed with CRM values:', 
        'annualRevenue=' + (customerData.annualRevenue || ""),
        'priceRange=' + (customerData.priceRange || ""),
        'orderFrequency=' + (customerData.orderFrequency || ""),
        'creditStatus=' + (customerData.creditStatus || ""),
        'smsEnabled=' + (customerData.smsEnabled || false),
        'emailEnabled=' + (customerData.emailEnabled || false)
      );
      
      console.log('✅ [TAX DEBUG] Form reset completed with Tax values:', 
        'taxId=' + (customerData.taxId || ""),
        'registrationNumber=' + (customerData.registrationNumber || "")
      );
    }
  }, [customer, form]);

  // Set selected province ID when provinces data and customer data are loaded
  useEffect(() => {
    if (customer?.customer?.province && provinces.length > 0) {
      // Try to find by English name first, then by Persian name
      const customerProvince = provinces.find((p: any) => 
        p.nameEnglish === customer.customer.province || 
        p.name === customer.customer.province ||
        p.namePersian === customer.customer.province
      );
      if (customerProvince) {
        setSelectedProvinceId(customerProvince.id);
        // Set form value to the standardized name to ensure CRM integration
        form.setValue('province', customerProvince.nameEnglish || customerProvince.name);
        console.log('📍 Province found and set:', customerProvince);
      } else {
        console.log('📍 Province not found for:', customer.customer.province, 'Available provinces:', provinces.map((p: any) => p.nameEnglish || p.name));
      }
    }
  }, [customer, provinces, form]);

  // Set selected city when cities data and customer data are loaded
  useEffect(() => {
    if (customer?.customer?.city && cities.length > 0) {
      const customerCity = cities.find((c: any) => 
        c.nameEnglish === customer.customer.city || 
        c.name === customer.customer.city ||
        c.namePersian === customer.customer.city
      );
      if (customerCity) {
        // Use standardized name for CRM integration
        form.setValue('city', customerCity.nameEnglish || customerCity.name);
        console.log('🏙️ City found and set:', customerCity);
      } else {
        // If not found in current city list, preserve original value to prevent data loss
        console.log('🏙️ City not found for:', customer.customer.city, 'Preserving original value');
        form.setValue('city', customer.customer.city);
      }
    }
  }, [customer, cities, form]);

  // Send SMS verification code
  const sendSmsCodeMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await fetch('/api/sms/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.loading,
        description: "SMS verification code sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t.error,
        description: error.message || "Failed to send SMS verification",
      });
    }
  });

  // Update profile with SMS verification
  const verifySmsAndUpdateMutation = useMutation({
    mutationFn: async ({ code, profileData }: { code: string; profileData: EditProfileForm }) => {
      const response = await fetch('/api/customers/verify-and-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verificationCode: code, ...profileData }),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Verification failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.save,
        description: "Profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
      setShowSmsDialog(false);
      setPendingChanges(null);
      setLocation("/customer/profile");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t.error,
        description: error.message || "Profile update failed",
      });
    }
  });

  // Create new customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: EditProfileForm) => {
      console.log('📤 [FRONTEND] Creating new customer:', data);
      
      const response = await fetch('/api/crm/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Customer creation failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "مشتری جدید با موفقیت ایجاد شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/customers"] });
      setLocation("/admin/crm");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "ایجاد مشتری ناموفق بود",
      });
    }
  });

  // Update profile without SMS (if no phone change)
  const updateProfileMutation = useMutation({
    mutationFn: async (data: EditProfileForm) => {
      console.log('📤 [FRONTEND] Sending profile update data:', data);
      
      // Choose the appropriate endpoint based on whether we're editing from CRM or customer portal
      const endpoint = customerId ? `/api/crm/customers/${customerId}` : '/api/customers/profile';
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Update failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t.save,
        description: "Profile updated successfully",
      });
      // Invalidate appropriate cache
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/crm/customers", customerId] });
        queryClient.invalidateQueries({ queryKey: ["/api/crm/customers"] });
        setLocation("/admin/crm");
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
        setLocation("/customer/profile");
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t.error,
        description: error.message || "Profile update failed",
      });
    }
  });

  const onSubmit = (data: EditProfileForm) => {
    if (isCreateMode) {
      // Creating new customer
      createCustomerMutation.mutate(data);
    } else {
      // Updating existing customer
      // Check if phone number changed
      const currentPhone = customer?.customer?.phone;
      const newPhone = data.phone;
      
      if (currentPhone !== newPhone) {
        // Phone changed, require SMS verification
        setPendingChanges(data);
        sendSmsCodeMutation.mutate(newPhone);
        setShowSmsDialog(true);
      } else {
        // No phone change, update directly
        updateProfileMutation.mutate(data);
      }
    }
  };

  const onSmsVerify = (data: SmsVerificationForm) => {
    if (pendingChanges) {
      verifySmsAndUpdateMutation.mutate({
        code: data.code,
        profileData: pendingChanges
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`container mx-auto py-8 ${direction === 'rtl' ? 'rtl' : 'ltr'}`}>
        <div className="flex items-center justify-center">
          <div className="text-lg">{t.loading}</div>
        </div>
      </div>
    );
  }

  // Check for authentication errors or missing data
  if (customerError || (!isLoading && (!customer || !customer.success))) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${direction === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{t.error}</h2>
            <p className="text-gray-500 mb-6">{t.loginToAccessWallet}</p>
            <div className="space-y-3">
              <Button onClick={() => setLocation("/customer/login")} className="w-full">
                {t.login}
              </Button>
              <Button onClick={() => setLocation("/shop")} variant="outline" className="w-full">
                {t.continueShopping}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 py-8 ${direction === 'rtl' ? 'rtl' : 'ltr'}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(isCreateMode || customerId ? "/admin/crm" : "/customer/profile")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className={`h-4 w-4 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
            {isCreateMode || customerId ? "بازگشت به CRM" : t.cancel}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isCreateMode ? "ایجاد مشتری جدید (CRM)" : (customerId ? "ویرایش مشتری (CRM)" : t.editProfile)}
            </h1>
            <p className="text-gray-600">
              {isCreateMode ? "ایجاد مشتری جدید از طریق سیستم CRM" : (customerId ? "ویرایش اطلاعات مشتری از طریق سیستم CRM" : t.manageAccount)}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t.accountInformation}
            </CardTitle>
            <CardDescription>
              {t.manageAccount}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="نام" />
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
                        <FormLabel>نام خانوادگی</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="نام خانوادگی" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          شماره تلفن
                        </FormLabel>
                        <FormControl>
                          <Input {...field} readOnly={!isCreateMode} className={isCreateMode ? "" : "bg-gray-50"} placeholder={isCreateMode ? "شماره تلفن" : ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          ایمیل
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="آدرس ایمیل" readOnly={!isCreateMode} className={isCreateMode ? "" : "bg-gray-50"} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Company Field */}
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        نام شرکت
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="نام شرکت (اختیاری)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">اطلاعات آدرس</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>کشور</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="کشور" />
                          </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Province / محافظة</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            console.log('🏛️ Province changing to:', value);
                            field.onChange(value);
                            // Find the selected province to get its ID for city filtering
                            const selectedProvince = provinces.find((p: any) => p.nameEnglish === value || p.name === value);
                            if (selectedProvince) {
                              setSelectedProvinceId(selectedProvince.id);
                              console.log('🏛️ Province ID set to:', selectedProvince.id);
                            }
                            // Don't clear city automatically - preserve data integrity
                            console.log('🏛️ City preserved, will filter based on new province');
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select province / اختر المحافظة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {provinces.map((province: any) => (
                              <SelectItem key={province.id} value={province.nameEnglish}>
                                {province.nameEnglish} / {province.nameArabic}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City / مدينة</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select city / اختر المدينة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities.map((city: any) => (
                              <SelectItem key={city.id} value={city.nameEnglish}>
                                {city.nameEnglish} / {city.nameArabic}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          آدرس کامل
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="آدرس کامل" rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="secondaryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>آدرس دوم (اختیاری)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="آدرس دوم یا محل کار" />
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

                {/* Additional Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">اطلاعات تماس تکمیلی</h3>
                  
                  <FormField
                    control={form.control}
                    name="alternatePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شماره تلفن دوم (اختیاری)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="شماره تلفن ثابت یا همراه دوم" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">اطلاعات تجاری</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>صنعت فعالیت</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب صنعت" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="chemical">شیمیایی</SelectItem>
                              <SelectItem value="petrochemical">پتروشیمی</SelectItem>
                              <SelectItem value="pharmaceutical">دارویی</SelectItem>
                              <SelectItem value="agriculture">کشاورزی</SelectItem>
                              <SelectItem value="construction">ساختمان</SelectItem>
                              <SelectItem value="automotive">خودرویی</SelectItem>
                              <SelectItem value="textile">نساجی</SelectItem>
                              <SelectItem value="food">مواد غذایی</SelectItem>
                              <SelectItem value="water_treatment">تصفیه آب</SelectItem>
                              <SelectItem value="paint">رنگ و رزین</SelectItem>
                              <SelectItem value="other">سایر</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع کسب و کار</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب نوع کسب و کار" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="manufacturer">تولیدکننده</SelectItem>
                              <SelectItem value="distributor">توزیع کننده</SelectItem>
                              <SelectItem value="retailer">خرده فروش</SelectItem>
                              <SelectItem value="service_provider">ارائه دهنده خدمات</SelectItem>
                              <SelectItem value="research">تحقیق و توسعه</SelectItem>
                              <SelectItem value="consultant">مشاور</SelectItem>
                              <SelectItem value="end_user">مصرف کننده نهایی</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companySize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اندازه شرکت</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب اندازه شرکت" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1-10">1-10 نفر</SelectItem>
                              <SelectItem value="11-50">11-50 نفر</SelectItem>
                              <SelectItem value="51-200">51-200 نفر</SelectItem>
                              <SelectItem value="201-500">201-500 نفر</SelectItem>
                              <SelectItem value="500+">بیش از 500 نفر</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>وب سایت شرکت</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://www.example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>شناسه مالیاتی</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="شناسه مالیاتی شرکت" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>شماره ثبت شرکت</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="شماره ثبت رسمی شرکت" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Customer Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">تنظیمات مشتری</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع مشتری</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب نوع مشتری" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="regular">عادی</SelectItem>
                              <SelectItem value="vip">VIP</SelectItem>
                              <SelectItem value="wholesale">عمده فروشی</SelectItem>
                              <SelectItem value="retail">خرده فروشی</SelectItem>
                              <SelectItem value="industrial">صنعتی</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="preferredPaymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>روش پرداخت ترجیحی</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب روش پرداخت" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">نقدی</SelectItem>
                              <SelectItem value="bank_transfer">حواله بانکی</SelectItem>
                              <SelectItem value="check">چک</SelectItem>
                              <SelectItem value="credit">اعتباری</SelectItem>
                              <SelectItem value="installment">قسطی</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="creditLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>حد اعتبار (IQD)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="مقدار حد اعتبار" type="number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="leadSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>منبع مشتری</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="چگونه ما را پیدا کردید؟" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="website">وب سایت</SelectItem>
                              <SelectItem value="referral">معرفی</SelectItem>
                              <SelectItem value="social_media">شبکه های اجتماعی</SelectItem>
                              <SelectItem value="advertising">تبلیغات</SelectItem>
                              <SelectItem value="exhibition">نمایشگاه</SelectItem>
                              <SelectItem value="cold_call">تماس سرد</SelectItem>
                              <SelectItem value="other">سایر</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">تنظیمات کاربری</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="preferredLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>زبان ترجیحی</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب زبان" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="persian">فارسی</SelectItem>
                              <SelectItem value="arabic">عربی</SelectItem>
                              <SelectItem value="english">انگلیسی</SelectItem>
                              <SelectItem value="kurdish">کردی</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="communicationPreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>روش ارتباط ترجیحی</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب روش ارتباط" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="phone">تلفن</SelectItem>
                              <SelectItem value="email">ایمیل</SelectItem>
                              <SelectItem value="sms">پیامک</SelectItem>
                              <SelectItem value="whatsapp">واتساپ</SelectItem>
                              <SelectItem value="telegram">تلگرام</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="marketingConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mt-2"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            موافقت با دریافت اطلاعات بازاریابی
                          </FormLabel>
                          <FormDescription>
                            اگر موافق هستید، اطلاعات محصولات جدید و پیشنهادات ویژه را برای شما ارسال خواهیم کرد.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Additional CRM Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">اطلاعات تکمیلی CRM</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="annualRevenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>درآمد سالانه تقریبی</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب درآمد سالانه" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="under_100m">کمتر از 100 میلیون دینار</SelectItem>
                              <SelectItem value="100m_500m">100 تا 500 میلیون دینار</SelectItem>
                              <SelectItem value="500m_1b">500 میلیون تا 1 میلیارد دینار</SelectItem>
                              <SelectItem value="1b_5b">1 تا 5 میلیارد دینار</SelectItem>
                              <SelectItem value="over_5b">بیش از 5 میلیارد دینار</SelectItem>
                              <SelectItem value="confidential">محرمانه</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priceRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>بازه قیمت مورد علاقه</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب بازه قیمت" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="budget">اقتصادی (زیر 50 هزار دینار)</SelectItem>
                              <SelectItem value="mid_range">متوسط (50-200 هزار دینار)</SelectItem>
                              <SelectItem value="premium">بالا (200-500 هزار دینار)</SelectItem>
                              <SelectItem value="enterprise">سازمانی (بالای 500 هزار دینار)</SelectItem>
                              <SelectItem value="custom">قیمت مخصوص</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="orderFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تناوب سفارش</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب تناوب سفارش" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">هفتگی</SelectItem>
                              <SelectItem value="monthly">ماهیانه</SelectItem>
                              <SelectItem value="quarterly">فصلی</SelectItem>
                              <SelectItem value="yearly">سالانه</SelectItem>
                              <SelectItem value="as_needed">بر اساس نیاز</SelectItem>
                              <SelectItem value="seasonal">فصلی</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="creditStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>وضعیت اعتبار</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب وضعیت اعتبار" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="excellent">عالی</SelectItem>
                              <SelectItem value="good">خوب</SelectItem>
                              <SelectItem value="fair">متوسط</SelectItem>
                              <SelectItem value="poor">ضعیف</SelectItem>
                              <SelectItem value="no_credit">بدون اعتبار</SelectItem>
                              <SelectItem value="pending">در انتظار بررسی</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="smsEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-2"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              فعال‌سازی پیامک
                            </FormLabel>
                            <FormDescription>
                              دریافت اطلاعیه‌ها و پیام‌های مهم از طریق پیامک
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emailEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-2"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              فعال‌سازی ایمیل
                            </FormLabel>
                            <FormDescription>
                              دریافت اطلاعیه‌ها و فاکتورها از طریق ایمیل
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>یادداشت های اضافی</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="یادداشت ها، نیازهای خاص، یا توضیحات اضافی" rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Save Button */}
                <div className="flex gap-4 pt-6">
                  <Button 
                    type="submit" 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    disabled={isCreateMode ? createCustomerMutation.isPending : updateProfileMutation.isPending}
                  >
                    <Save className="h-4 w-4" />
                    {isCreateMode 
                      ? (createCustomerMutation.isPending ? 'در حال ایجاد...' : 'ایجاد مشتری')
                      : (updateProfileMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات')
                    }
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setLocation(isCreateMode || customerId ? "/admin/crm" : "/customer/profile")}
                  >
                    انصراف
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* SMS Verification Dialog */}
      <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأیید شماره تلفن</DialogTitle>
            <DialogDescription>
              کد تأیید به شماره جدید ارسال شد. لطفاً کد را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <Form {...smsForm}>
            <form onSubmit={smsForm.handleSubmit(onSmsVerify)} className="space-y-4">
              <FormField
                control={smsForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کد تأیید</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="کد 4 رقمی" maxLength={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={verifySmsAndUpdateMutation.isPending}>
                  {verifySmsAndUpdateMutation.isPending ? 'در حال تأیید...' : 'تأیید و ذخیره'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowSmsDialog(false)}>
                  انصراف
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

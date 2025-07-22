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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save, Shield, Phone, Mail, Building, MapPin, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Schema for profile editing - includes all registration fields
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

  // Fetch customer data
  const { data: customer, isLoading, error: customerError } = useQuery<any>({
    queryKey: ["/api/customers/me"],
    retry: 1,
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
      });
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
        console.log('📍 Province found and set:', customerProvince);
      } else {
        console.log('📍 Province not found for:', customer.customer.province, 'Available provinces:', provinces.map((p: any) => p.nameEnglish || p.name));
      }
    }
  }, [customer, provinces]);

  // Set selected city when cities data and customer data are loaded
  useEffect(() => {
    if (customer?.customer?.city && cities.length > 0 && selectedProvinceId) {
      const customerCity = cities.find((c: any) => 
        c.nameEnglish === customer.customer.city || 
        c.name === customer.customer.city ||
        c.namePersian === customer.customer.city
      );
      if (customerCity) {
        form.setValue('city', customerCity.nameEnglish || customerCity.name);
        console.log('🏙️ City found and set:', customerCity);
      } else {
        console.log('🏙️ City not found for:', customer.customer.city, 'Available cities:', cities.map((c: any) => c.nameEnglish || c.name));
      }
    }
  }, [customer, cities, selectedProvinceId, form]);

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

  // Update profile without SMS (if no phone change)
  const updateProfileMutation = useMutation({
    mutationFn: async (data: EditProfileForm) => {
      const response = await fetch('/api/customers/profile', {
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
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
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

  const onSubmit = (data: EditProfileForm) => {
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
            onClick={() => setLocation("/customer/profile")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className={`h-4 w-4 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
            {t.cancel}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t.editProfile}
            </h1>
            <p className="text-gray-600">
              {t.manageAccount}
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
                          <Input {...field} readOnly className="bg-gray-50" />
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
                          <Input {...field} type="email" placeholder="آدرس ایمیل" />
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
                            field.onChange(value);
                            // Find the selected province to get its ID for city filtering
                            const selectedProvince = provinces.find((p: any) => p.nameEnglish === value);
                            setSelectedProvinceId(selectedProvince ? selectedProvince.id : null);
                            // Clear city selection when province changes
                            form.setValue('city', '');
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
                </div>

                {/* Save Button */}
                <div className="flex gap-4 pt-6">
                  <Button 
                    type="submit" 
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    disabled={updateProfileMutation.isPending}
                  >
                    <Save className="h-4 w-4" />
                    {updateProfileMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setLocation("/customer/profile")}
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

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
import { ArrowLeft, Save, Shield, Phone, Mail } from "lucide-react";
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
  const { data: customer, isLoading, error: customerError } = useQuery({
    queryKey: ["/api/customers/me"],
    retry: 1,
  });

  // Fetch provinces data
  const { data: provincesData } = useQuery({
    queryKey: ["/api/logistics/provinces"],
    retry: 1,
  });

  // Fetch cities data
  const { data: citiesData } = useQuery({
    queryKey: ["/api/logistics/cities"],
    retry: 1,
  });

  const provinces = provincesData?.data || [];
  const cities = citiesData?.data || [];

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
        secondaryAddress: customerData.secondaryAddress || "",
        postalCode: customerData.postalCode || "",
        alternatePhone: customerData.alternatePhone || "",
        industry: customerData.industry || "",
        businessType: customerData.businessType || "",
        companySize: customerData.companySize || "",
        communicationPreference: customerData.communicationPreference || "",
        preferredLanguage: customerData.preferredLanguage || "",
        marketingConsent: customerData.marketingConsent || false,
        notes: customerData.notes || "",
        customerType: customerData.customerType || "",
        customerStatus: customerData.customerStatus || "",
        preferredPaymentMethod: customerData.preferredPaymentMethod || "",
        creditLimit: customerData.creditLimit || "",
        website: customerData.website || "",
        taxId: customerData.taxId || "",
        registrationNumber: customerData.registrationNumber || "",

        leadSource: customerData.leadSource || "",
        assignedSalesRep: customerData.assignedSalesRep || "",
      });
    }
  }, [customer, form]);

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
      const response = await fetch('/api/customers/me', {
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
                        <FormLabel>{t.firstName}</FormLabel>
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
                        <FormLabel>{t.lastName}</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          {t.phone}
                          <span className="text-xs text-gray-500">(Read-only)</span>
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
                    name="alternatePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alternate Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Alternative phone number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Company & Industry Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.company}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your industry" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email Field - Read Only */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                        <span className="text-xs text-gray-500">(Read-only)</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.country}</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Province / State</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select province" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {provinces.map((province: any) => (
                              <SelectItem key={province.id} value={province.name}>
                                {province.name}
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
                        <FormLabel>{t.city}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities.map((city: any) => (
                              <SelectItem key={city.id} value={city.name}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address Fields */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.address}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondaryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Secondary address (optional)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manufacturer">Manufacturer</SelectItem>
                            <SelectItem value="distributor">Distributor</SelectItem>
                            <SelectItem value="retailer">Retailer</SelectItem>
                            <SelectItem value="end_user">End User</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Company Size & Communication Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companySize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Size</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select company size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="small">Small (1-50 employees)</SelectItem>
                            <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                            <SelectItem value="large">Large (201-1000 employees)</SelectItem>
                            <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
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
                        <FormLabel>Communication Preference</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Language & Marketing Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="preferredLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Language</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fa">Persian (فارسی)</SelectItem>
                            <SelectItem value="ar">Arabic (العربية)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="marketingConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Marketing Consent</FormLabel>
                          <p className="text-sm text-gray-600">
                            I agree to receive marketing communications
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* CRM Additional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="vip">VIP</SelectItem>
                            <SelectItem value="wholesale">Wholesale</SelectItem>
                            <SelectItem value="partner">Partner</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
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
                    name="preferredPaymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="creditLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credit Limit</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 10000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID</FormLabel>
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
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preferredCommunication"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Communication</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select communication method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
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
                    name="leadSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Source</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select lead source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="social_media">Social Media</SelectItem>
                            <SelectItem value="advertising">Advertising</SelectItem>
                            <SelectItem value="trade_show">Trade Show</SelectItem>
                            <SelectItem value="cold_call">Cold Call</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assignedSalesRep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Sales Rep</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Sales representative name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/customer/profile")}
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateProfileMutation.isPending ? t.loading : t.save}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* SMS Verification Dialog */}
        <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SMS Verification
              </DialogTitle>
              <DialogDescription>
                Enter the verification code sent to your phone
              </DialogDescription>
            </DialogHeader>
            <Form {...smsForm}>
              <form onSubmit={smsForm.handleSubmit(onSmsVerify)} className="space-y-4">
                <FormField
                  control={smsForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter 4-digit code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSmsDialog(false)}
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={verifySmsAndUpdateMutation.isPending}
                  >
                    {verifySmsAndUpdateMutation.isPending ? t.loading : "Verify & Save"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
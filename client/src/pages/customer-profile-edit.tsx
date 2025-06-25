import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save, Shield, Phone } from "lucide-react";

const editProfileSchema = z.object({
  firstName: z.string().min(1, "نام الزامی است"),
  lastName: z.string().min(1, "نام خانوادگی الزامی است"),
  phone: z.string().min(1, "شماره تلفن الزامی است"),
  company: z.string().optional(),
  country: z.string().min(1, "کشور الزامی است"),
  city: z.string().min(1, "شهر الزامی است"),
  address: z.string().min(1, "آدرس الزامی است"),
  postalCode: z.string().optional(),
  businessType: z.string().optional(),
  notes: z.string().optional(),
});

const smsVerificationSchema = z.object({
  code: z.string().min(4, "کد تایید باید حداقل 4 رقم باشد"),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;
type SmsVerificationForm = z.infer<typeof smsVerificationSchema>;

export default function CustomerProfileEdit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<EditProfileForm | null>(null);

  // Fetch customer data
  const { data: customer, isLoading } = useQuery({
    queryKey: ["/api/customers/me"],
  });

  const form = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      company: "",
      country: "",
      city: "",
      address: "",
      postalCode: "",
      businessType: "",
      notes: "",
    },
  });

  const smsForm = useForm<SmsVerificationForm>({
    resolver: zodResolver(smsVerificationSchema),
    defaultValues: {
      code: ""
    }
  });

  // Update form values when customer data is loaded
  React.useEffect(() => {
    if (customer?.customer) {
      const customerData = customer.customer;
      form.reset({
        firstName: customerData.firstName || "",
        lastName: customerData.lastName || "",
        phone: customerData.phone || "",
        company: customerData.company || "",
        country: customerData.country || "",
        city: customerData.city || "",
        address: customerData.address || "",
        postalCode: customerData.postalCode || "",
        businessType: customerData.businessType || "",
        notes: customerData.notes || "",
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
        credentials: 'include',
        body: JSON.stringify({ phone, purpose: "profile_update" })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "کد تایید ارسال شد",
        description: "کد تایید به شماره تلفن شما ارسال شد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ارسال کد",
        description: error.message || "خطا در ارسال کد تایید",
        variant: "destructive",
      });
    },
  });

  // Verify SMS code and update profile
  const verifySmsAndUpdateMutation = useMutation({
    mutationFn: async ({ code, profileData }: { code: string; profileData: EditProfileForm }) => {
      // First verify the SMS code
      const verifyResponse = await fetch('/api/sms/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          phone: profileData.phone, 
          code, 
          purpose: "profile_update" 
        })
      });
      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        throw new Error(verifyData.message || "کد تایید اشتباه است");
      }

      // Then update the profile
      const updateResponse = await fetch('/api/customers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });
      return updateResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "پروفایل بروزرسانی شد",
        description: "اطلاعات پروفایل شما با موفقیت بروزرسانی شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
      setShowSmsDialog(false);
      setPendingChanges(null);
      setLocation("/customer/profile");
    },
    onError: (error: any) => {
      toast({
        title: "خطا در بروزرسانی",
        description: error.message || "خطا در بروزرسانی پروفایل",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: EditProfileForm) => {
    // Check if phone number has changed
    const phoneChanged = data.phone !== customer?.customer?.phone;
    
    if (phoneChanged) {
      // Store pending changes and send SMS
      setPendingChanges(data);
      await sendSmsCodeMutation.mutateAsync(data.phone);
      setShowSmsDialog(true);
    } else {
      // No SMS verification needed, update directly
      try {
        const response = await fetch('/api/customers/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (result.success) {
          toast({
            title: "پروفایل بروزرسانی شد",
            description: "اطلاعات پروفایل شما با موفقیت بروزرسانی شد",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
          setLocation("/customer/profile");
        }
      } catch (error: any) {
        toast({
          title: "خطا در بروزرسانی",
          description: error.message || "خطا در بروزرسانی پروفایل",
          variant: "destructive",
        });
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
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  if (!customer?.customer) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg text-red-600">خطا در دریافت اطلاعات مشتری</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation("/customer/profile")}
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          بازگشت
        </Button>
        <h1 className="text-2xl font-bold">ویرایش پروفایل</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            ویرایش اطلاعات شخصی
          </CardTitle>
          <CardDescription>
            در صورت تغییر شماره تلفن، کد تایید برای شما ارسال خواهد شد
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
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

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شماره تلفن</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="09xxxxxxxxx" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شرکت</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>کشور</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>آدرس</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>نوع کسب و کار</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  <Save className="h-4 w-4 ml-2" />
                  ذخیره تغییرات
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* SMS Verification Dialog */}
      <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              تایید شماره تلفن
            </DialogTitle>
            <DialogDescription>
              کد تایید به شماره {pendingChanges?.phone} ارسال شد
            </DialogDescription>
          </DialogHeader>
          
          <Form {...smsForm}>
            <form onSubmit={smsForm.handleSubmit(onSmsVerify)} className="space-y-4">
              <FormField
                control={smsForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کد تایید</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1234" maxLength={6} />
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
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={verifySmsAndUpdateMutation.isPending}
                >
                  تایید و ذخیره
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
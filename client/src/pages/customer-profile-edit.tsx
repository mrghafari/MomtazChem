import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Phone, Shield, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const editProfileSchema = z.object({
  firstName: z.string().min(2, "نام باید حداقل 2 کاراکتر باشد"),
  lastName: z.string().min(2, "نام خانوادگی باید حداقل 2 کاراکتر باشد"),
  phone: z.string().min(10, "شماره تلفن باید حداقل 10 رقم باشد"),
  company: z.string().optional(),
  country: z.string().min(2, "کشور الزامی است"),
  city: z.string().min(2, "شهر الزامی است"),
  address: z.string().min(10, "آدرس باید حداقل 10 کاراکتر باشد"),
  postalCode: z.string().optional(),
  website: z.string().optional(),
  businessType: z.string().optional(),
  notes: z.string().optional(),
});

const smsVerificationSchema = z.object({
  code: z.string().length(6, "کد باید 6 رقم باشد")
});

type EditProfileForm = z.infer<typeof editProfileSchema>;
type SmsVerificationForm = z.infer<typeof smsVerificationSchema>;

export default function CustomerProfileEdit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<EditProfileForm | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch current customer profile
  const { data: customer, isLoading } = useQuery({
    queryKey: ["/api/customers/me"],
  });

  const form = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: customer?.firstName || "",
      lastName: customer?.lastName || "",
      phone: customer?.phone || "",
      company: customer?.company || "",
      country: customer?.country || "",
      city: customer?.city || "",
      address: customer?.address || "",
      postalCode: customer?.postalCode || "",
      website: customer?.website || "",
      businessType: customer?.businessType || "",
      notes: customer?.notes || "",
    },
  });

  const smsForm = useForm<SmsVerificationForm>({
    resolver: zodResolver(smsVerificationSchema),
    defaultValues: {
      code: ""
    }
  });

  // Send SMS verification code
  const sendSmsCodeMutation = useMutation({
    mutationFn: async (phone: string) => {
      return await apiRequest(`/api/sms/send-verification`, {
        method: "POST",
        body: { phone, purpose: "profile_update" }
      });
    },
    onSuccess: () => {
      toast({
        title: "کد تایید ارسال شد",
        description: "کد 6 رقمی به شماره موبایل شما ارسال شد",
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
      const verifyResponse = await apiRequest(`/api/sms/verify-code`, {
        method: "POST",
        body: { 
          phone: profileData.phone, 
          code, 
          purpose: "profile_update" 
        }
      });

      if (!verifyResponse.success) {
        throw new Error(verifyResponse.message || "کد تایید اشتباه است");
      }

      // Then update the profile
      return await apiRequest(`/api/customers/profile`, {
        method: "PUT",
        body: profileData
      });
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
    const phoneChanged = data.phone !== customer?.phone;
    
    if (phoneChanged) {
      // Store pending changes and send SMS
      setPendingChanges(data);
      await sendSmsCodeMutation.mutateAsync(data.phone);
      setShowSmsDialog(true);
    } else {
      // No SMS verification needed, update directly
      try {
        const response = await apiRequest(`/api/customers/profile`, {
          method: "PUT",
          body: data
        });
        
        if (response.success) {
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/customer/profile")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت به پروفایل
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <User className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ویرایش پروفایل</h1>
            <p className="text-gray-600">اطلاعات شخصی و تجاری خود را بروزرسانی کنید</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            اطلاعات شخصی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام *</FormLabel>
                      <FormControl>
                        <Input placeholder="نام خود را وارد کنید" {...field} />
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
                      <FormLabel>نام خانوادگی *</FormLabel>
                      <FormControl>
                        <Input placeholder="نام خانوادگی خود را وارد کنید" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        شماره موبایل *
                        {field.value !== customer?.phone && (
                          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                            نیاز به تایید SMS
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="09123456789" {...field} />
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
                        <Input placeholder="نام شرکت" {...field} />
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
                      <FormLabel>کشور *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="کشور را انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Iran">ایران</SelectItem>
                          <SelectItem value="UAE">امارات متحده عربی</SelectItem>
                          <SelectItem value="Turkey">ترکیه</SelectItem>
                          <SelectItem value="Iraq">عراق</SelectItem>
                          <SelectItem value="Afghanistan">افغانستان</SelectItem>
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
                      <FormLabel>شهر *</FormLabel>
                      <FormControl>
                        <Input placeholder="شهر خود را وارد کنید" {...field} />
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
                        <Input placeholder="کد پستی" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وب‌سایت</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="نوع کسب و کار را انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Manufacturing">تولیدی</SelectItem>
                          <SelectItem value="Trading">بازرگانی</SelectItem>
                          <SelectItem value="Services">خدماتی</SelectItem>
                          <SelectItem value="Agriculture">کشاورزی</SelectItem>
                          <SelectItem value="Mining">معدنی</SelectItem>
                          <SelectItem value="Other">سایر</SelectItem>
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
                    <FormLabel>آدرس کامل *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="آدرس کامل خود را وارد کنید"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>یادداشت‌ها</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="توضیحات اضافی در مورد کسب و کار شما"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/customer/profile")}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={sendSmsCodeMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sendSmsCodeMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ارسال کد تایید...
                    </>
                  ) : (
                    "ذخیره تغییرات"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* SMS Verification Dialog */}
      <Dialog open={showSmsDialog} onOpenChange={setShowSmsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              تایید شماره موبایل
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              کد 6 رقمی ارسال شده به شماره {pendingChanges?.phone} را وارد کنید:
            </p>

            <Form {...smsForm}>
              <form onSubmit={smsForm.handleSubmit(onSmsVerify)} className="space-y-4">
                <FormField
                  control={smsForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>کد تایید</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123456" 
                          className="text-center text-2xl font-mono tracking-widest"
                          maxLength={6}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowSmsDialog(false);
                      setPendingChanges(null);
                    }}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={verifySmsAndUpdateMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {verifySmsAndUpdateMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        در حال تایید...
                      </>
                    ) : (
                      "تایید و ذخیره"
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="text-center">
              <Button
                variant="link"
                className="text-sm text-blue-600"
                onClick={() => {
                  if (pendingChanges) {
                    sendSmsCodeMutation.mutate(pendingChanges.phone);
                  }
                }}
                disabled={sendSmsCodeMutation.isPending}
              >
                ارسال مجدد کد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Store, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "wouter";

const vendorRegistrationSchema = z.object({
  vendorName: z.string().min(2, "اسم شرکت باید حداقل 2 حرف باشد"),
  vendorNameEn: z.string().optional(),
  vendorNameAr: z.string().optional(),
  vendorNameKu: z.string().optional(),
  vendorNameTr: z.string().optional(),
  contactEmail: z.string().email("ایمیل معتبر وارد کنید"),
  contactPhone: z.string().min(10, "شماره تلفن معتبر وارد کنید"),
  businessLicense: z.string().optional(),
  taxId: z.string().optional(),
  description: z.string().min(20, "توضیحات باید حداقل 20 حرف باشد"),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  descriptionKu: z.string().optional(),
  descriptionTr: z.string().optional(),
  address: z.string().min(10, "آدرس کامل وارد کنید"),
  city: z.string().min(2, "شهر را وارد کنید"),
  country: z.string().default("Iraq"),
  postalCode: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  iban: z.string().optional(),
});

type VendorRegistrationForm = z.infer<typeof vendorRegistrationSchema>;

export default function VendorRegistration() {
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<VendorRegistrationForm>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      vendorName: "",
      vendorNameEn: "",
      vendorNameAr: "",
      vendorNameKu: "",
      vendorNameTr: "",
      contactEmail: "",
      contactPhone: "",
      businessLicense: "",
      taxId: "",
      description: "",
      descriptionEn: "",
      descriptionAr: "",
      descriptionKu: "",
      descriptionTr: "",
      address: "",
      city: "",
      country: "Iraq",
      postalCode: "",
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
      iban: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: VendorRegistrationForm) => {
      const formData = new FormData();
      
      // Add all text fields
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      // Add logo file if selected
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      return apiRequest("/api/vendors/register", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "✅ ثبت نام موفق",
        description: "درخواست شما با موفقیت ارسال شد. پس از بررسی توسط تیم ما، از طریق ایمیل مطلع خواهید شد.",
        variant: "default",
      });
      form.reset();
      setLogoFile(null);
      setLogoPreview("");
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطا در ثبت نام",
        description: error.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "⚠️ حجم فایل بیش از حد مجاز",
          description: "لوگو باید کمتر از 5 مگابایت باشد",
          variant: "destructive",
        });
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: VendorRegistrationForm) => {
    registerMutation.mutate(data);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">ثبت نام موفق!</CardTitle>
            <CardDescription className="text-base mt-2">
              درخواست شما با موفقیت ارسال شد. تیم ما درخواست شما را بررسی کرده و از طریق ایمیل با شما تماس خواهند گرفت.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                📧 یک ایمیل تأیید به {form.watch("contactEmail")} ارسال شد
              </p>
              <Link href="/">
                <Button className="w-full" variant="outline">
                  بازگشت به صفحه اصلی
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
            <Store className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ثبت نام فروشنده
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            به بازار Momtazchem بپیوندید و محصولات خود را به فروش برسانید
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات شرکت</CardTitle>
            <CardDescription>
              لطفاً اطلاعات کامل شرکت خود را وارد کنید. تمام فیلدهای ستاره‌دار (*) الزامی هستند.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">لوگوی شرکت (اختیاری)</label>
                  <div className="flex items-center gap-4">
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="cursor-pointer"
                        data-testid="input-vendor-logo"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        حداکثر حجم: 5MB - فرمت‌های مجاز: JPG, PNG, WEBP
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company Name - Multilingual Tabs */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">نام شرکت *</label>
                  <Tabs defaultValue="main" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="main">اصلی</TabsTrigger>
                      <TabsTrigger value="en">English</TabsTrigger>
                      <TabsTrigger value="ar">العربية</TabsTrigger>
                      <TabsTrigger value="ku">کوردی</TabsTrigger>
                      <TabsTrigger value="tr">Türkçe</TabsTrigger>
                    </TabsList>
                    <TabsContent value="main">
                      <FormField
                        control={form.control}
                        name="vendorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="نام شرکت (زبان اصلی)" {...field} data-testid="input-vendor-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="en">
                      <FormField
                        control={form.control}
                        name="vendorNameEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Company Name (English)" {...field} data-testid="input-vendor-name-en" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="ar">
                      <FormField
                        control={form.control}
                        name="vendorNameAr"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="اسم الشركة (العربية)" {...field} data-testid="input-vendor-name-ar" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="ku">
                      <FormField
                        control={form.control}
                        name="vendorNameKu"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="ناوی کۆمپانیا (کوردی)" {...field} data-testid="input-vendor-name-ku" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="tr">
                      <FormField
                        control={form.control}
                        name="vendorNameTr"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Şirket Adı (Türkçe)" {...field} data-testid="input-vendor-name-tr" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ایمیل تماس *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="info@company.com" {...field} data-testid="input-contact-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شماره تلفن *</FormLabel>
                        <FormControl>
                          <Input placeholder="+964 XXX XXX XXXX" {...field} data-testid="input-contact-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Business Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="businessLicense"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شماره جواز کسب (اختیاری)</FormLabel>
                        <FormControl>
                          <Input placeholder="BL-XXXXX" {...field} data-testid="input-business-license" />
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
                        <FormLabel>شماره مالیاتی (اختیاری)</FormLabel>
                        <FormControl>
                          <Input placeholder="TAX-XXXXX" {...field} data-testid="input-tax-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description - Multilingual Tabs */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">توضیحات شرکت *</label>
                  <Tabs defaultValue="main" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="main">اصلی</TabsTrigger>
                      <TabsTrigger value="en">English</TabsTrigger>
                      <TabsTrigger value="ar">العربية</TabsTrigger>
                      <TabsTrigger value="ku">کوردی</TabsTrigger>
                      <TabsTrigger value="tr">Türkçe</TabsTrigger>
                    </TabsList>
                    <TabsContent value="main">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                placeholder="درباره شرکت خود بنویسید..." 
                                rows={4} 
                                {...field}
                                data-testid="textarea-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="en">
                      <FormField
                        control={form.control}
                        name="descriptionEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                placeholder="Write about your company..." 
                                rows={4} 
                                {...field}
                                data-testid="textarea-description-en"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="ar">
                      <FormField
                        control={form.control}
                        name="descriptionAr"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                placeholder="اكتب عن شركتك..." 
                                rows={4} 
                                {...field}
                                data-testid="textarea-description-ar"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="ku">
                      <FormField
                        control={form.control}
                        name="descriptionKu"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                placeholder="دەربارەی کۆمپانیاکەت بنووسە..." 
                                rows={4} 
                                {...field}
                                data-testid="textarea-description-ku"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="tr">
                      <FormField
                        control={form.control}
                        name="descriptionTr"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea 
                                placeholder="Şirketiniz hakkında yazın..." 
                                rows={4} 
                                {...field}
                                data-testid="textarea-description-tr"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Address Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>آدرس کامل *</FormLabel>
                        <FormControl>
                          <Input placeholder="خیابان، کوچه، پلاک" {...field} data-testid="input-address" />
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
                        <FormLabel>شهر *</FormLabel>
                        <FormControl>
                          <Input placeholder="بغداد، اربیل، ..." {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>کشور *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-country" />
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
                        <FormLabel>کد پستی (اختیاری)</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} data-testid="input-postal-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Bank Information */}
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-lg font-semibold">اطلاعات بانکی (اختیاری)</h3>
                  <p className="text-sm text-muted-foreground">
                    این اطلاعات برای پرداخت کمیسیون‌های شما مورد استفاده قرار می‌گیرد
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نام بانک</FormLabel>
                          <FormControl>
                            <Input placeholder="بانک..." {...field} data-testid="input-bank-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bankAccountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نام صاحب حساب</FormLabel>
                          <FormControl>
                            <Input placeholder="نام کامل" {...field} data-testid="input-bank-account-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankAccountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>شماره حساب</FormLabel>
                          <FormControl>
                            <Input placeholder="XXXX-XXXX-XXXX" {...field} data-testid="input-bank-account-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="iban"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>شماره شبا (IBAN)</FormLabel>
                          <FormControl>
                            <Input placeholder="IQ XX XXXX XXXX XXXX XXXX" {...field} data-testid="input-iban" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={registerMutation.isPending}
                    data-testid="button-submit-registration"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        در حال ارسال...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        ارسال درخواست
                      </>
                    )}
                  </Button>
                  <Link href="/">
                    <Button type="button" variant="outline" data-testid="button-cancel">
                      انصراف
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📝 نکات مهم:</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>تمام درخواست‌ها توسط تیم Momtazchem بررسی می‌شوند</li>
              <li>زمان بررسی معمولاً 2-3 روز کاری است</li>
              <li>پس از تأیید، اطلاعات ورود به پنل فروشنده برای شما ایمیل می‌شود</li>
              <li>نرخ کمیسیون پلتفرم 10% است که قابل مذاکره می‌باشد</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

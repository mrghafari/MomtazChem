import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/lib/queryClient';
import { MapPin, User, Globe, Building2 } from 'lucide-react';

// Translation system
const translations = {
  en: {
    title: "Complete Your Profile",
    subtitle: "Please provide the following information to complete your account setup",
    phone: "Phone Number",
    phonePlaceholder: "e.g., 0771234567",
    country: "Country",
    countryPlaceholder: "e.g., Iraq",
    province: "Province/State",
    provincePlaceholder: "e.g., Baghdad",
    city: "City/Region",
    cityPlaceholder: "e.g., Karrada",
    address: "Address",
    addressPlaceholder: "Complete delivery address",
    postalCode: "Postal Code (Optional)",
    postalCodePlaceholder: "Optional",
    whatsapp: "WhatsApp Number (Optional)",
    whatsappPlaceholder: "If different from phone number",
    submit: "Complete Profile",
    submitting: "Saving...",
    success: "Profile Completed!",
    successDesc: "Your profile has been updated successfully. Redirecting to dashboard...",
    error: "Error",
    errorDesc: "Failed to update profile. Please try again.",
    phoneRequired: "Phone number is required",
    countryRequired: "Country is required",
    provinceRequired: "Province is required",
    cityRequired: "City is required",
    addressRequired: "Address is required",
    welcome: "Welcome!",
    welcomeDesc: "We need a few more details to complete your account"
  },
  ar: {
    title: "إكمال ملفك الشخصي",
    subtitle: "يرجى تقديم المعلومات التالية لإكمال إعداد حسابك",
    phone: "رقم الهاتف",
    phonePlaceholder: "مثال: 0771234567",
    country: "الدولة",
    countryPlaceholder: "مثال: العراق",
    province: "المحافظة/الولاية",
    provincePlaceholder: "مثال: بغداد",
    city: "المدينة/المنطقة",
    cityPlaceholder: "مثال: الكرادة",
    address: "العنوان",
    addressPlaceholder: "عنوان التوصيل الكامل",
    postalCode: "الرمز البريدي (اختياري)",
    postalCodePlaceholder: "اختياري",
    whatsapp: "رقم واتساب (اختياري)",
    whatsappPlaceholder: "إذا كان مختلفًا عن رقم الهاتف",
    submit: "إكمال الملف الشخصي",
    submitting: "جارٍ الحفظ...",
    success: "تم إكمال الملف الشخصي!",
    successDesc: "تم تحديث ملفك الشخصي بنجاح. جارٍ التوجيه إلى لوحة التحكم...",
    error: "خطأ",
    errorDesc: "فشل تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.",
    phoneRequired: "رقم الهاتف مطلوب",
    countryRequired: "الدولة مطلوبة",
    provinceRequired: "المحافظة مطلوبة",
    cityRequired: "المدينة مطلوبة",
    addressRequired: "العنوان مطلوب",
    welcome: "أهلاً بك!",
    welcomeDesc: "نحتاج إلى بعض التفاصيل الإضافية لإكمال حسابك"
  }
};

// Form schema
const createProfileSchema = (lang: 'en' | 'ar') => z.object({
  phone: z.string().min(1, translations[lang].phoneRequired),
  country: z.string().min(1, translations[lang].countryRequired),
  province: z.string().min(1, translations[lang].provinceRequired),
  cityRegion: z.string().min(1, translations[lang].cityRequired),
  address: z.string().min(1, translations[lang].addressRequired),
  postalCode: z.string().optional(),
  whatsappNumber: z.string().optional()
});

export default function CompleteProfile() {
  const { language, direction } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(createProfileSchema(language as 'en' | 'ar')),
    defaultValues: {
      phone: '',
      country: 'Iraq',
      province: '',
      cityRegion: '',
      address: '',
      postalCode: '',
      whatsappNumber: ''
    }
  });

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/profile-status');
        const data = await response.json();

        if (!data.authenticated) {
          // Not logged in, redirect to login
          navigate('/customer/login');
          return;
        }

        if (data.profileCompleted) {
          // Profile already completed, redirect to dashboard
          navigate('/customer-dashboard');
          return;
        }

        setUserInfo(data.user);
      } catch (error) {
        console.error('Error checking auth status:', error);
        navigate('/customer/login');
      }
    }

    checkAuth();
  }, [navigate]);

  const onSubmit = async (values: z.infer<ReturnType<typeof createProfileSchema>>) => {
    setIsSubmitting(true);

    try {
      const response = await apiRequest('/api/auth/complete-profile', {
        method: 'POST',
        body: values
      });

      if (response.success) {
        toast({
          title: t.success,
          description: t.successDesc
        });

        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          navigate('/customer-dashboard');
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to complete profile');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      toast({
        title: t.error,
        description: t.errorDesc,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4" dir={direction}>
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            {userInfo.avatarUrl && (
              <img 
                src={userInfo.avatarUrl} 
                alt={userInfo.firstName} 
                className="w-20 h-20 rounded-full border-4 border-blue-500"
              />
            )}
          </div>
          <CardTitle className="text-3xl font-bold">{t.welcome}</CardTitle>
          <CardDescription className="text-base">{t.welcomeDesc}</CardDescription>
          <p className="text-sm text-muted-foreground">
            {userInfo.firstName} {userInfo.lastName} ({userInfo.email})
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {t.phone}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t.phonePlaceholder} data-testid="input-phone" />
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
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {t.country}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t.countryPlaceholder} data-testid="input-country" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Province & City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {t.province}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t.provincePlaceholder} data-testid="input-province" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cityRegion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {t.city}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t.cityPlaceholder} data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.address}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t.addressPlaceholder} data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Postal Code & WhatsApp */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.postalCode}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t.postalCodePlaceholder} data-testid="input-postal-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.whatsapp}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t.whatsappPlaceholder} data-testid="input-whatsapp" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting ? t.submitting : t.submit}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

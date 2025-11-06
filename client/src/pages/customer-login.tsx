import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';

const loginSchema = z.object({
  email: z.string().email('لطفاً ایمیل معتبر وارد کنید'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
});

type LoginForm = z.infer<typeof loginSchema>;

// OAuth button translations
const oauthTranslations = {
  en: {
    or: 'Or',
    continueWithGoogle: 'Continue with Google',
    continueWithFacebook: 'Continue with Facebook'
  },
  ar: {
    or: 'أو',
    continueWithGoogle: 'متابعة مع جوجل',
    continueWithFacebook: 'متابعة مع فيسبوك'
  }
};

export default function CustomerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Get translations for OAuth buttons
  const t = oauthTranslations[language as keyof typeof oauthTranslations] || oauthTranslations.en;

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      const response = await apiRequest('/api/customers/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.success) {
        toast({
          title: 'ورود موفق',
          description: 'شما با موفقیت وارد شده‌اید',
        });
        
        // Redirect to customer profile
        setLocation('/customer/profile');
      } else {
        setLoginError(response.message || 'خطا در ورود');
        toast({
          title: 'خطا در ورود',
          description: response.message || 'نام کاربری یا رمز عبور اشتباه است',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = 'خطا در اتصال به سرور. لطفاً دوباره تلاش کنید';
      setLoginError(errorMessage);
      toast({
        title: 'خطا در ورود',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error when user starts typing
  useEffect(() => {
    if (loginError) {
      setLoginError(null);
    }
  }, [form.watch('email'), form.watch('password')]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              بازگشت به صفحه اصلی
            </Button>
          </Link>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">M</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              ورود مشتریان
            </CardTitle>
            <CardDescription className="text-gray-600">
              به پنل مشتریان Momtaz Chem خوش آمدید
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Error Display */}
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-center">
                  <p className="text-red-600 text-sm">{loginError}</p>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-right block">
                  ایمیل
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  {...form.register('email')}
                  className="text-right"
                  dir="ltr"
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm text-right">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-right block">
                  رمز عبور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="رمز عبور خود را وارد کنید"
                    {...form.register('password')}
                    className="text-right pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-500 text-sm text-right">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
                disabled={isLoading}
              >
                {isLoading ? 'در حال ورود...' : 'ورود'}
              </Button>

              {/* OAuth Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">{t.or}</span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-3">
                <a
                  href="/api/auth/google"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  data-testid="button-google-login"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium">{t.continueWithGoogle}</span>
                </a>

                <a
                  href="/api/auth/facebook"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg transition-colors"
                  data-testid="button-facebook-login"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="font-medium">{t.continueWithFacebook}</span>
                </a>
              </div>

              {/* Links */}
              <div className="space-y-3 text-center">
                <Link href="/customer/forgot-password">
                  <Button variant="link" className="text-purple-600 hover:text-purple-700 p-0">
                    رمز عبور خود را فراموش کرده‌اید؟
                  </Button>
                </Link>
                
                <div className="text-gray-600 text-sm">
                  حساب کاربری ندارید؟{' '}
                  <Link href="/customer/register">
                    <span className="text-purple-600 hover:text-purple-700 cursor-pointer font-medium">
                      ثبت‌نام کنید
                    </span>
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>برای کمک و راهنمایی با ما تماس بگیرید:</p>
          <p className="font-medium">support@momtazchem.com</p>
        </div>
      </div>
    </div>
  );
}
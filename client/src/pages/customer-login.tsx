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

const loginSchema = z.object({
  email: z.string().email('لطفاً ایمیل معتبر وارد کنید'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function CustomerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "رمز عبور باید حداقل 6 کاراکتر باشد"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "رمز عبور و تکرار آن باید یکسان باشند",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function CustomerResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string>("");
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      setIsValidToken(true);
    } else {
      setIsValidToken(false);
    }
  }, []);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "توکن بازیابی معتبر نیست",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/customers/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "رمز عبور تغییر کرد",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "خطا",
          description: result.message || "مشکلی در تغییر رمز عبور رخ داده است",
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "مشکلی در تغییر رمز عبور رخ داده است",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md" dir="rtl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">لینک نامعتبر</h2>
            <p className="text-gray-600 mb-6">
              لینک بازیابی رمز عبور نامعتبر یا منقضی شده است.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setLocation("/customer/forgot-password")}
                className="flex-1"
              >
                درخواست مجدد
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/shop")}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                بازگشت
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md" dir="rtl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">رمز عبور تغییر کرد</h2>
            <p className="text-gray-600 mb-6">
              رمز عبور شما با موفقیت تغییر کرد. اکنون می‌توانید با رمز عبور جدید وارد شوید.
            </p>
            <Button
              onClick={() => setLocation("/shop")}
              className="w-full"
            >
              رفتن به فروشگاه و ورود
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بررسی...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md" dir="rtl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">تعیین رمز عبور جدید</CardTitle>
          <p className="text-gray-600">
            رمز عبور جدید خود را وارد کنید
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      رمز عبور جدید
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="رمز عبور جدید را وارد کنید" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      تکرار رمز عبور
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="رمز عبور جدید را مجدداً وارد کنید" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "در حال تغییر..." : "تغییر رمز عبور"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-6 border-t text-center">
            <Button
              variant="ghost"
              onClick={() => setLocation("/shop")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              بازگشت به فروشگاه
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
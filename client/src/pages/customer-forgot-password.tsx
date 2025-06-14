import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

const forgotPasswordSchema = z.object({
  email: z.string().email("ایمیل معتبر وارد کنید"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function CustomerForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetLink, setResetLink] = useState<string>("");

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/customers/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        if (result.resetLink) {
          setResetLink(result.resetLink);
        }
        toast({
          title: "درخواست بازیابی ارسال شد",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "خطا",
          description: result.message || "مشکلی در ارسال درخواست رخ داده است",
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "مشکلی در ارسال درخواست رخ داده است",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md" dir="rtl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">درخواست ارسال شد</h2>
            <p className="text-gray-600 mb-6">
              لینک بازیابی رمز عبور به ایمیل شما ارسال شد. لطفاً صندوق پست خود را بررسی کنید.
            </p>
            
            {resetLink && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>برای تست:</strong> روی لینک زیر کلیک کنید
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(resetLink)}
                  className="w-full"
                >
                  بازیابی رمز عبور
                </Button>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation("/shop")}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                بازگشت به فروشگاه
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md" dir="rtl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">فراموشی رمز عبور</CardTitle>
          <p className="text-gray-600">
            ایمیل خود را وارد کنید تا لینک بازیابی رمز عبور برای شما ارسال شود
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <Input 
                        type="email" 
                        placeholder="ایمیل خود را وارد کنید" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "در حال ارسال..." : "ارسال لینک بازیابی"}
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
              بازگشت به ورود
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
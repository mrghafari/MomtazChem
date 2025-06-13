import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, ArrowLeft, Check } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("/api/admin/forgot-password", "POST", { email });
      
      if (response.resetToken) {
        setResetToken(response.resetToken);
      }
      
      setIsSubmitted(true);
      toast({
        title: "Request Sent",
        description: "If an account with this email exists, a password reset link has been sent",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>درخواست ارسال شد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              اگر حساب کاربری با این ایمیل وجود داشته باشد، لینک بازیابی رمز عبور ارسال خواهد شد.
            </p>
            
            {resetToken && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>توکن بازیابی (فقط برای تست):</strong>
                </p>
                <code className="text-xs bg-yellow-100 p-2 rounded block break-all">
                  {resetToken}
                </code>
                <Button
                  className="w-full mt-3"
                  onClick={() => setLocation(`/reset-password?token=${resetToken}`)}
                >
                  بازیابی رمز عبور
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLocation("/admin/login")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                بازگشت به ورود
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                  setResetToken("");
                }}
              >
                ارسال مجدد
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Forgot Password</CardTitle>
          <p className="text-sm text-gray-600">
            Enter your email address to receive a password reset link
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ایمیل خود را وارد کنید"
                required
                dir="ltr"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "در حال ارسال..." : "ارسال لینک بازیابی"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/admin/login")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              بازگشت به ورود
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
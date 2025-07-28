import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, RefreshCw, AlertTriangle } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = "/admin/login" 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!requireAuth) {
      return;
    }

    if (!isLoading && !isAuthenticated) {
      // Show login prompt instead of immediate redirect
      const timer = setTimeout(() => {
        setShowLoginPrompt(true);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (isAuthenticated && showLoginPrompt) {
      setShowLoginPrompt(false);
      setRetryCount(0);
    }
  }, [isLoading, isAuthenticated, requireAuth, showLoginPrompt]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  const handleLoginRedirect = () => {
    window.location.href = redirectTo;
  };

  // Show loading state
  if (requireAuth && isLoading && !showLoginPrompt) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Show authentication required prompt
  if (requireAuth && (!isAuthenticated || showLoginPrompt)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">
              احراز هویت مورد نیاز
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-gray-600">
                جلسه کاری شما منقضی شده است. برای ادامه کار لطفاً دوباره وارد سیستم شوید.
              </p>
              {retryCount > 0 && (
                <div className="flex items-center justify-center gap-2 text-amber-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>تلاش شماره {retryCount + 1}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={handleLoginRedirect}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Lock className="h-4 w-4 mr-2" />
                ورود به سیستم
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleRetry}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    در حال بررسی...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    تلاش مجدد
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-gray-500 border-t pt-4">
              <p>برای حفظ امنیت، جلسات کاری بعد از مدت زمان معینی منقضی می‌شوند.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If authentication is not required or user is authenticated, render children
  return <>{children}</>;
}

export default AuthGuard;
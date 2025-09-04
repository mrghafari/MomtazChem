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
      // Direct redirect to login page without intermediate screen
      window.location.href = redirectTo;
      return;
    }

    if (isAuthenticated && showLoginPrompt) {
      setShowLoginPrompt(false);
      setRetryCount(0);
    }
  }, [isLoading, isAuthenticated, requireAuth, redirectTo, showLoginPrompt]);

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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated, redirect immediately
  if (requireAuth && !isLoading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If authentication is not required or user is authenticated, render children
  return <>{children}</>;
}

export default AuthGuard;
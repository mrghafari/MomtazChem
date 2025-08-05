import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, CreditCard, Building2, Clock, Wallet, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AuthGuard from "@/components/AuthGuard";

interface PaymentGateway {
  id: number;
  name: string;
  type: string;
  enabled: boolean;
  config?: any;
  createdAt?: string;
  updatedAt?: string;
}

export default function PaymentSettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payment gateways
  const { data: gateways, isLoading } = useQuery({
    queryKey: ['/api/payment/gateways'],
    queryFn: () => apiRequest('/api/payment/gateways', { method: 'GET' }),
  });

  // Toggle gateway status mutation
  const toggleGatewayMutation = useMutation({
    mutationFn: async ({ gatewayId }: { gatewayId: number }) => {
      return await apiRequest(`/api/payment/gateways/${gatewayId}/toggle`, { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment/gateways'] });
      toast({
        title: "موفقیت‌آمیز",
        description: "وضعیت درگاه پرداخت به‌روزرسانی شد",
      });
    },
    onError: (error) => {
      console.error('Gateway toggle error:', error);
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی وضعیت درگاه پرداخت",
        variant: "destructive",
      });
    },
  });

  const handleToggleGateway = (gatewayId: number) => {
    toggleGatewayMutation.mutate({ gatewayId });
  };

  const getGatewayIcon = (type: string) => {
    switch (type) {
      case 'iraqi_bank':
        return Building2;
      case 'international':
        return CreditCard;
      case 'mobile_payment':
        return Wallet;
      default:
        return CreditCard;
    }
  };

  const getGatewayTypeLabel = (type: string) => {
    switch (type) {
      case 'iraqi_bank':
        return 'بانک عراقی';
      case 'international':
        return 'بین‌المللی';
      case 'mobile_payment':
        return 'پرداخت موبایل';
      default:
        return 'نامشخص';
    }
  };

  return (
    <AuthGuard requireAuth={true} redirectTo="/admin/login">
      <div className="container mx-auto p-6 space-y-6 bg-white dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation("/admin/site-management")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            بازگشت به مدیریت سایت
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              تنظیمات درگاه‌های پرداخت
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              مدیریت و کنترل درگاه‌های پرداخت فعال
            </p>
          </div>
        </div>

        {/* Payment Gateways Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gateways?.map((gateway: PaymentGateway) => {
              const IconComponent = getGatewayIcon(gateway.type);
              
              return (
                <Card 
                  key={gateway.id} 
                  className={`transition-all duration-200 ${
                    gateway.enabled 
                      ? 'border-green-200 bg-green-50 dark:bg-green-900/10' 
                      : 'border-gray-200 bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconComponent className={`w-6 h-6 ${
                          gateway.enabled ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <div>
                          <CardTitle className="text-lg">{gateway.name}</CardTitle>
                          <CardDescription>
                            {getGatewayTypeLabel(gateway.type)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {gateway.enabled ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Gateway Details */}
                    <div className="space-y-2 text-sm">
                      {gateway.config?.merchantId && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">شناسه پذیرنده:</span>
                          <span className="font-mono">{gateway.config.merchantId}</span>
                        </div>
                      )}
                      {gateway.config?.apiUrl && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">API URL:</span>
                          <span className="font-mono text-xs truncate">
                            {gateway.config.apiUrl.length > 30 
                              ? gateway.config.apiUrl.substring(0, 30) + '...' 
                              : gateway.config.apiUrl
                            }
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">ایجاد شده:</span>
                        <span className="text-xs">
                          {gateway.createdAt ? new Date(gateway.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {gateway.enabled ? 'فعال' : 'غیرفعال'}
                        </span>
                      </div>
                      <Switch
                        checked={gateway.enabled}
                        onCheckedChange={() => handleToggleGateway(gateway.id)}
                        disabled={toggleGatewayMutation.isPending}
                      />
                    </div>

                    {/* Status Description */}
                    <div className="text-xs text-gray-500 bg-white dark:bg-gray-900 p-2 rounded border">
                      {gateway.enabled 
                        ? 'این درگاه برای مشتریان در دسترس است'
                        : 'این درگاه برای مشتریان مخفی است'
                      }
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              نکات مهم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">درگاه‌های فعال</h4>
                <p className="text-sm text-gray-600">
                  درگاه‌های فعال در صفحه پرداخت مشتریان نمایش داده می‌شوند و قابل استفاده هستند.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-600">درگاه‌های غیرفعال</h4>
                <p className="text-sm text-gray-600">
                  درگاه‌های غیرفعال از صفحه پرداخت مخفی شده و قابل استفاده نیستند.
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>توجه:</strong> حداقل یک درگاه پرداخت باید فعال باشد تا مشتریان بتوانند خرید انجام دهند.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
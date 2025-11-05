import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Clock, XCircle, ExternalLink, Copy, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FibPaymentPage() {
  const [, params] = useRoute('/payment/fib/:paymentId');
  const paymentId = params?.paymentId;
  const { toast } = useToast();
  const { language } = useLanguage();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [enablePolling, setEnablePolling] = useState<boolean>(false);

  const { data: paymentData, isLoading, error, refetch } = useQuery<{
    success: boolean;
    data: {
      paymentId: string;
      amount: string;
      currency: string;
      status: string;
      readableCode: string;
      qrCode: string;
      personalAppLink?: string;
      businessAppLink?: string;
      corporateAppLink?: string;
      validUntil: string;
      createdAt: string;
      paidAt?: string;
      description?: string;
    };
  }>({
    queryKey: [`/api/payment/fib/${paymentId}`],
    enabled: !!paymentId,
    refetchInterval: enablePolling ? 5000 : false, // Poll every 5 seconds only after 15-second wait
  });

  // FIB Best Practice: Wait 15 seconds for callback, then start polling
  useEffect(() => {
    if (!paymentId) return;
    
    console.log('🏦 [FIB] Waiting 15 seconds for callback before polling...');
    
    const timer = setTimeout(() => {
      console.log('🔄 [FIB] Starting status polling (every 5 seconds)');
      setEnablePolling(true);
    }, 15000); // Wait 15 seconds as per FIB best practices

    return () => clearTimeout(timer);
  }, [paymentId]);

  const payment = paymentData?.data;

  // Calculate time remaining
  useEffect(() => {
    if (!payment?.validUntil) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(payment.validUntil);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(language === 'ar' ? 'منتهية الصلاحية' : 'Expired');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [payment?.validUntil, language]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: language === 'ar' ? 'تم النسخ' : 'Copied',
      description: language === 'ar' ? 'تم نسخ الرمز إلى الحافظة' : 'Code copied to clipboard',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {language === 'ar' ? 'الدفعة غير موجودة' : 'Payment Not Found'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'لم نتمكن من العثور على معلومات الدفع'
                : 'We could not find the payment information'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">
              {language === 'ar' ? 'مدفوع' : 'Paid'}
            </span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">
              {language === 'ar' ? 'في انتظار الدفع' : 'Pending Payment'}
            </span>
          </div>
        );
      case 'expired':
      case 'cancelled':
        return (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircle className="h-5 w-5" />
            <span className="font-semibold">
              {language === 'ar' ? 'منتهية الصلاحية' : 'Expired'}
            </span>
          </div>
        );
      default:
        return <span className="text-muted-foreground">{status}</span>;
    }
  };

  const isPaid = payment.status === 'paid' || payment.status === 'completed';
  const isExpired = payment.status === 'expired' || payment.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center border-b">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Smartphone className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            {language === 'ar' ? 'دفع عبر FIB' : 'FIB Payment'}
          </CardTitle>
          <CardDescription className="text-lg">
            {language === 'ar' ? 'البنك العراقي الأول' : 'First Iraqi Bank'}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {/* Status */}
          <div className="flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">
              {language === 'ar' ? 'الحالة:' : 'Status:'}
            </span>
            {getStatusBadge(payment.status)}
          </div>

          {/* Amount */}
          <div className="text-center py-6 border-y">
            <p className="text-sm text-muted-foreground mb-2">
              {language === 'ar' ? 'المبلغ المطلوب' : 'Amount Due'}
            </p>
            <p className="text-5xl font-bold text-primary">
              {parseFloat(payment.amount).toLocaleString()} {payment.currency}
            </p>
          </div>

          {!isPaid && !isExpired && (
            <>
              {/* Timer */}
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription className="flex justify-between items-center">
                  <span>
                    {language === 'ar'
                      ? 'الوقت المتبقي لإتمام الدفع:'
                      : 'Time remaining to complete payment:'}
                  </span>
                  <span className="font-mono text-lg font-bold">{timeRemaining}</span>
                </AlertDescription>
              </Alert>

              {/* QR Code */}
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">
                  {language === 'ar' ? 'امسح رمز QR باستخدام تطبيق FIB' : 'Scan QR Code with FIB App'}
                </h3>
                <div className="flex justify-center">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                    <img
                      src={payment.qrCode}
                      alt="QR Code"
                      className="w-64 h-64"
                      data-testid="qr-code-image"
                    />
                  </div>
                </div>
              </div>

              {/* Readable Code */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === 'ar' ? 'أو أدخل الرمز يدويًا:' : 'Or enter code manually:'}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-2xl font-bold text-center tracking-wider">
                    {payment.readableCode}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(payment.readableCode)}
                    data-testid="button-copy-code"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* App Links */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-center">
                  {language === 'ar' ? 'افتح في تطبيق FIB:' : 'Open in FIB App:'}
                </h3>
                <div className="grid gap-3">
                  {payment.personalAppLink && (
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                      data-testid="button-personal-app"
                    >
                      <a href={payment.personalAppLink} target="_blank" rel="noopener noreferrer">
                        <Smartphone className="mr-2 h-4 w-4" />
                        {language === 'ar' ? 'حساب شخصي' : 'Personal Account'}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {payment.businessAppLink && (
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                      data-testid="button-business-app"
                    >
                      <a href={payment.businessAppLink} target="_blank" rel="noopener noreferrer">
                        <Smartphone className="mr-2 h-4 w-4" />
                        {language === 'ar' ? 'حساب تجاري' : 'Business Account'}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {payment.corporateAppLink && (
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                      data-testid="button-corporate-app"
                    >
                      <a href={payment.corporateAppLink} target="_blank" rel="noopener noreferrer">
                        <Smartphone className="mr-2 h-4 w-4" />
                        {language === 'ar' ? 'حساب شركات' : 'Corporate Account'}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {isPaid && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-500">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200 text-lg">
                {language === 'ar'
                  ? 'تم الدفع بنجاح! شكراً لك.'
                  : 'Payment successful! Thank you.'}
              </AlertDescription>
            </Alert>
          )}

          {isExpired && (
            <Alert className="bg-red-50 dark:bg-red-950 border-red-500">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {language === 'ar'
                  ? 'انتهت صلاحية هذه الدفعة. يرجى إنشاء دفعة جديدة.'
                  : 'This payment has expired. Please create a new payment.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Payment ID */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>
              {language === 'ar' ? 'معرف الدفع:' : 'Payment ID:'} {payment.paymentId}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

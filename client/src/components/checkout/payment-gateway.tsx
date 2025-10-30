import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CreditCard, Building2, Wallet, CheckCircle, Upload, FileText, QrCode, Copy, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import QRCode from "qrcode";

interface PaymentGatewayProps {
  paymentMethod: string;
  totalAmount: number;
  orderId: string;
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
  activeGateway?: any;
}

const PaymentGateway = ({ 
  paymentMethod, 
  totalAmount, 
  orderId, 
  onPaymentSuccess, 
  onPaymentError,
  activeGateway 
}: PaymentGatewayProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [fibPayment, setFibPayment] = useState<any>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");

  // Auto-redirect for online payment method
  useEffect(() => {
    console.log('🔍 [AUTO REDIRECT DEBUG] Payment method:', paymentMethod);
    console.log('🔍 [AUTO REDIRECT DEBUG] Active gateway:', activeGateway);
    console.log('🔍 [AUTO REDIRECT DEBUG] Is processing:', isProcessing);
    console.log('🔍 [AUTO REDIRECT DEBUG] Gateway config:', activeGateway?.config);
    
    if (paymentMethod === 'online_payment' && activeGateway && !isProcessing) {
      console.log('🔄 [AUTO REDIRECT] Triggering auto-redirect for online payment');
      console.log('🔄 [AUTO REDIRECT] Gateway config:', activeGateway.config);
      console.log('🔄 [AUTO REDIRECT] API Base URL:', activeGateway.config?.apiBaseUrl);
      
      // Small delay to ensure everything is loaded
      setTimeout(() => {
        handleOnlinePayment();
      }, 1000);
    }
  }, [paymentMethod, activeGateway, isProcessing]);

  // Fetch company banking information for dynamic banking details
  const { data: companyInfo, isLoading: isLoadingCompanyInfo } = useQuery({
    queryKey: ['/api/company/banking-info'],
    queryFn: async () => {
      const response = await fetch('/api/company/banking-info');
      const result = await response.json();
      return result.data;
    },
    retry: false,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IQD',
    }).format(amount);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // بررسی نوع فایل
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "نوع فایل نامعتبر",
        description: "لطفاً فقط فایل‌های JPG, PNG یا PDF آپلود کنید",
        variant: "destructive"
      });
      return;
    }

    // بررسی حجم فایل (حداکثر 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "حجم فایل زیاد",
        description: "حجم فایل نباید از 5 مگابایت بیشتر باشد",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('receipt', file);
      formData.append('orderId', orderId);

      // شبیه‌سازی پیشرفت آپلود
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await apiRequest('/api/payment/upload-receipt', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: "فیش بانکی آپلود شد",
        description: "فیش بانکی شما با موفقیت آپلود شد و در انتظار بررسی است"
      });

      // ذخیره مسیر فایل در فرم دیتا
      handleInputChange('receiptPath', response.filePath);
      
    } catch (error) {
      toast({
        title: "خطا در آپلود",
        description: "آپلود فیش بانکی با مشکل مواجه شد. دوباره تلاش کنید",
        variant: "destructive"
      });
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleOnlinePayment = async () => {
    if (!activeGateway) {
      onPaymentError('هیچ درگاه پرداخت فعالی موجود نیست');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Get gateway config and build redirect URL
      const gatewayConfig = activeGateway.config;
      console.log('🔍 [PAYMENT GATEWAY] Gateway config:', gatewayConfig);
      
      if (gatewayConfig && gatewayConfig.apiBaseUrl) {
        // Build payment URL with proper parameters for Shaparak
        const baseUrl = gatewayConfig.apiBaseUrl;
        const merchantId = gatewayConfig.merchantId || 'DEMO_MERCHANT';
        const paymentReference = `MOMTAZ_${orderId}_${Date.now()}`;
        
        const paymentUrl = `${baseUrl}?` +
          `merchantId=${encodeURIComponent(merchantId)}&` +
          `amount=${totalAmount}&` +
          `currency=IQD&` +
          `reference=${encodeURIComponent(paymentReference)}&` +
          `orderNumber=${encodeURIComponent(orderId)}&` +
          `returnUrl=${encodeURIComponent(window.location.origin + '/payment-callback')}&` +
          `cancelUrl=${encodeURIComponent(window.location.origin + '/payment-cancelled')}`;
        
        console.log('🚀 [PAYMENT GATEWAY] Redirecting to:', paymentUrl);
        
        // Redirect to external payment gateway
        window.location.href = paymentUrl;
        
      } else {
        throw new Error('آدرس درگاه پرداخت در تنظیمات موجود نیست');
      }
    } catch (error: any) {
      console.error('Online payment error:', error);
      onPaymentError(error.message || 'خطا در اتصال به درگاه پرداخت');
      setIsProcessing(false);
    }
  };

  const simulatePaymentProcessing = async () => {
    if (paymentMethod === 'online_payment') {
      await handleOnlinePayment();
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    const paymentData = {
      method: paymentMethod,
      transactionId,
      amount: totalAmount,
      orderId,
      timestamp: new Date().toISOString(),
      ...formData
    };

    setIsProcessing(false);
    onPaymentSuccess(paymentData);
  };

  const handleFibPayment = async () => {
    setIsProcessing(true);
    try {
      const response = await apiRequest('/api/fib/create-payment', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          amount: totalAmount,
          currency: 'IQD'
        })
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create FIB payment');
      }

      const payment = response.data;
      setFibPayment(payment);
      setPaymentStatus(payment.status);

      const qrUrl = await QRCode.toDataURL(payment.qrCode);
      setQrCodeDataUrl(qrUrl);

      const expiryTime = new Date(payment.validUntil).getTime();
      const now = Date.now();
      setTimeRemaining(Math.max(0, Math.floor((expiryTime - now) / 1000)));

      toast({
        title: "Payment Created",
        description: "Scan the QR code with your FIB mobile app to complete payment"
      });

    } catch (error: any) {
      console.error('FIB payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || 'Failed to create payment',
        variant: "destructive"
      });
      onPaymentError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const checkFibPaymentStatus = async () => {
    if (!fibPayment) return;

    try {
      const response = await apiRequest(`/api/fib/payment-status/${fibPayment.paymentId}`, {
        method: 'GET'
      });

      if (response.success && response.data) {
        const newStatus = response.data.status;
        setPaymentStatus(newStatus);

        if (newStatus === 'paid') {
          toast({
            title: "Payment Successful",
            description: "Your payment has been confirmed"
          });
          onPaymentSuccess({
            method: 'fib_online',
            transactionId: fibPayment.paymentId,
            amount: totalAmount,
            orderId,
            timestamp: new Date().toISOString()
          });
        } else if (newStatus === 'cancelled' || newStatus === 'expired') {
          toast({
            title: "Payment Failed",
            description: `Payment ${newStatus}`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  useEffect(() => {
    if (paymentMethod === 'fib_online' && fibPayment && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setPaymentStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentMethod, fibPayment, timeRemaining]);

  useEffect(() => {
    if (paymentMethod === 'fib_online' && fibPayment && paymentStatus === 'pending') {
      const statusChecker = setInterval(() => {
        checkFibPaymentStatus();
      }, 3000);

      return () => clearInterval(statusChecker);
    }
  }, [paymentMethod, fibPayment, paymentStatus]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Payment code copied to clipboard"
    });
  };

  const renderIraqiBankTransfer = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          Iraqi Bank Transfer (محول بانکی عراقی)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Bank Transfer Instructions</h4>
          {isLoadingCompanyInfo ? (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">در حال بارگذاری اطلاعات بانکی...</p>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Bank Name:</strong> {companyInfo?.bankName || 'Rasheed Bank (مصرف الرشید)'}</p>
              <p><strong>Account Number:</strong> {companyInfo?.bankAccount || '1234567890123456'}</p>
              <p><strong>Account Holder:</strong> {companyInfo?.bankAccountHolder || companyInfo?.companyNameAr || companyInfo?.companyNameEn || 'Momtaz Chemical Solutions Ltd'}</p>
              {companyInfo?.bankIban && <p><strong>IBAN:</strong> {companyInfo.bankIban}</p>}
              {companyInfo?.bankSwift && <p><strong>SWIFT Code:</strong> {companyInfo.bankSwift}</p>}
              <p><strong>Reference:</strong> Order #{orderId}</p>
            </div>
          )}
        </div>
        
        <div>
          <Label htmlFor="transferReference">Transfer Reference Number</Label>
          <Input
            id="transferReference"
            placeholder="Enter bank transfer reference number"
            onChange={(e) => handleInputChange('transferReference', e.target.value)}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="transferBank">Your Bank</Label>
          <Select onValueChange={(value) => handleInputChange('transferBank', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your bank" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rasheed">Rasheed Bank (مصرف الرشید)</SelectItem>
              <SelectItem value="rafidain">Rafidain Bank (مصرف الرافدین)</SelectItem>
              <SelectItem value="iraq_islamic">Iraq Islamic Bank (المصرف الاسلامی العراقی)</SelectItem>
              <SelectItem value="baghdad">Baghdad Bank (مصرف بغداد)</SelectItem>
              <SelectItem value="commercial_iraq">Commercial Bank of Iraq (المصرف التجاری العراقی)</SelectItem>
              <SelectItem value="other">Other Iraqi Bank</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="transferNotes">Additional Notes (Optional)</Label>
          <Textarea
            id="transferNotes"
            placeholder="Any additional information about the transfer..."
            onChange={(e) => handleInputChange('transferNotes', e.target.value)}
          />
        </div>

        {/* بخش آپلود فیش بانکی */}
        <div className="border-t pt-4">
          <Label className="text-base font-semibold mb-3 block">
            <FileText className="w-4 h-4 inline mr-2" />
            آپلود فیش بانکی (Bank Receipt Upload)
          </Label>
          
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full h-16 border-dashed border-2 hover:bg-gray-50"
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-sm">
                  {uploadedFile ? `انتخاب شده: ${uploadedFile.name}` : 'انتخاب فیش بانکی'}
                </span>
                <span className="text-xs text-gray-500">
                  JPG, PNG یا PDF - حداکثر 5MB
                </span>
              </div>
            </Button>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {uploadedFile && uploadProgress === 100 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      فیش بانکی آپلود شد
                    </p>
                    <p className="text-xs text-green-600">
                      {uploadedFile.name} - {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-amber-50 p-3 rounded-lg flex items-start">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Please ensure you include Order #{orderId} as reference when making the transfer.
            Processing may take 1-3 business days.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderCreditCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Credit/Debit Card (کارت ائتمانی/نقدی)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="cardNumber">Card Number</Label>
          <Input
            id="cardNumber"
            placeholder="1234 5678 9012 3456"
            onChange={(e) => handleInputChange('cardNumber', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              placeholder="MM/YY"
              onChange={(e) => handleInputChange('expiryDate', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              placeholder="123"
              type="password"
              onChange={(e) => handleInputChange('cvv', e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="cardName">Cardholder Name</Label>
          <Input
            id="cardName"
            placeholder="Name as shown on card"
            onChange={(e) => handleInputChange('cardName', e.target.value)}
            required
          />
        </div>

        <div className="bg-green-50 p-3 rounded-lg flex items-center">
          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
          <p className="text-sm text-green-800">
            We accept Visa, Mastercard, and local Iraqi bank cards.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderDigitalWallet = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="w-5 h-5 mr-2" />
          Digital Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="walletType">Wallet Type</Label>
          <Select onValueChange={(value) => handleInputChange('walletType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your wallet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="zain_cash">Zain Cash (زین کاش)</SelectItem>
              <SelectItem value="asia_pay">Asia Pay</SelectItem>
              <SelectItem value="fastpay">FastPay Iraq</SelectItem>
              <SelectItem value="other">Other Digital Wallet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="walletId">Wallet ID/Email</Label>
          <Input
            id="walletId"
            placeholder="Enter your wallet ID or email"
            onChange={(e) => handleInputChange('walletId', e.target.value)}
            required
          />
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            You will be redirected to your chosen wallet provider to complete the payment.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderInternationalBankTransfer = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          International Bank Transfer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">International Wire Transfer Details</h4>
          {isLoadingCompanyInfo ? (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">در حال بارگذاری اطلاعات بانکی...</p>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Beneficiary Bank:</strong> {companyInfo?.bankName || 'Trade Bank of Iraq (TBI)'}</p>
              {companyInfo?.bankSwift && <p><strong>SWIFT Code:</strong> {companyInfo.bankSwift}</p>}
              <p><strong>Account Number:</strong> {companyInfo?.bankAccount || '9876543210987654'}</p>
              <p><strong>Beneficiary Name:</strong> {companyInfo?.bankAccountHolder || companyInfo?.companyNameAr || companyInfo?.companyNameEn || 'Momtaz Chemical Solutions Ltd'}</p>
              {companyInfo?.bankIban && <p><strong>IBAN:</strong> {companyInfo.bankIban}</p>}
              <p><strong>Beneficiary Address:</strong> Baghdad, Iraq</p>
              <p><strong>Reference:</strong> Order #{orderId}</p>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="senderBank">Sender Bank Details</Label>
          <Input
            id="senderBank"
            placeholder="Your bank name and SWIFT code"
            onChange={(e) => handleInputChange('senderBank', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="wireReference">Wire Transfer Reference</Label>
          <Input
            id="wireReference"
            placeholder="Enter wire transfer reference number"
            onChange={(e) => handleInputChange('wireReference', e.target.value)}
            required
          />
        </div>

        <div className="bg-amber-50 p-3 rounded-lg flex items-start">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            International transfers may take 3-7 business days. Additional fees may apply.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderFibPayment = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          First Iraqi Bank - البنك العراقي الأول
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!fibPayment ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                Instant Payment via FIB Mobile App
                <br />
                الدفع الفوري عبر تطبيق FIB للهاتف المحمول
              </h4>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>Amount | المبلغ:</strong> {formatCurrency(totalAmount)}</p>
                <p><strong>Order | الطلب:</strong> #{orderId}</p>
                <p className="text-xs mt-3">
                  You will receive a QR code and payment code to complete your payment using FIB Personal, Business, or Corporate app.
                  <br />
                  ستحصل على رمز QR ورمز الدفع لإتمام عملية الدفع باستخدام تطبيق FIB الشخصي أو التجاري أو المؤسسي.
                </p>
              </div>
            </div>
            
            <Button 
              onClick={handleFibPayment}
              disabled={isProcessing}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700"
              data-testid="button-create-fib-payment"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Payment... | إنشاء الدفع...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  Generate Payment Code | إنشاء رمز الدفع
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {paymentStatus === 'paid' && (
              <div className="bg-green-50 border-2 border-green-500 p-4 rounded-lg text-center">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-green-800">
                  Payment Successful! | تم الدفع بنجاح!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Your order has been confirmed | تم تأكيد طلبك
                </p>
              </div>
            )}

            {paymentStatus === 'expired' && (
              <div className="bg-red-50 border-2 border-red-500 p-4 rounded-lg text-center">
                <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-red-800">
                  Payment Expired | انتهت صلاحية الدفع
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Please create a new payment | يرجى إنشاء دفعة جديدة
                </p>
                <Button 
                  onClick={() => {
                    setFibPayment(null);
                    setPaymentStatus('pending');
                    setQrCodeDataUrl('');
                  }}
                  className="mt-4"
                  data-testid="button-retry-fib-payment"
                >
                  Create New Payment | إنشاء دفع جديد
                </Button>
              </div>
            )}

            {paymentStatus === 'pending' && (
              <>
                <div className="flex items-center justify-between bg-amber-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-amber-600 mr-2" />
                    <span className="font-semibold text-amber-900">
                      Time Remaining | الوقت المتبقي
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-amber-900">
                    {formatTime(timeRemaining)}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 text-center">
                      Scan QR Code | امسح رمز QR
                    </h4>
                    {qrCodeDataUrl && (
                      <div className="bg-white p-4 rounded-lg border-2 border-blue-200 flex justify-center">
                        <img 
                          src={qrCodeDataUrl} 
                          alt="FIB Payment QR Code" 
                          className="w-64 h-64"
                          data-testid="img-fib-qr-code"
                        />
                      </div>
                    )}
                    <p className="text-xs text-center text-gray-600">
                      Open FIB app and scan this code
                      <br />
                      افتح تطبيق FIB وامسح هذا الرمز
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 text-center">
                      Or Enter Code Manually | أو أدخل الرمز يدويًا
                    </h4>
                    <div className="bg-white p-6 rounded-lg border-2 border-blue-200">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">
                          Payment Code | رمز الدفع
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <code 
                            className="text-3xl font-mono font-bold text-blue-900 tracking-wider"
                            data-testid="text-payment-code"
                          >
                            {fibPayment.readableCode}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(fibPayment.readableCode)}
                            data-testid="button-copy-code"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-center text-gray-600">
                      Enter this code in your FIB app
                      <br />
                      أدخل هذا الرمز في تطبيق FIB الخاص بك
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    How to Pay | كيفية الدفع
                  </h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Open your FIB mobile app (Personal/Business/Corporate)</li>
                    <li>Go to Pay/Transfer section | انتقل إلى قسم الدفع / التحويل</li>
                    <li>Scan the QR code or enter the payment code | امسح رمز QR أو أدخل رمز الدفع</li>
                    <li>Confirm the payment | قم بتأكيد الدفع</li>
                    <li>Wait for automatic confirmation | انتظر التأكيد التلقائي</li>
                  </ol>
                </div>

                <div className="flex items-center justify-center">
                  <div className="animate-pulse flex items-center text-blue-600">
                    <div className="w-3 h-3 bg-blue-600 rounded-full mr-2 animate-ping"></div>
                    <span className="text-sm font-medium">
                      Waiting for payment... | في انتظار الدفع...
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );


  const renderOnlinePayment = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          پرداخت آنلاین - Online Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeGateway ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">درگاه پرداخت فعال</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>درگاه:</strong> {activeGateway.name}</p>
                <p><strong>نوع:</strong> {activeGateway.type}</p>
                <p><strong>مبلغ قابل پرداخت:</strong> {formatCurrency(totalAmount)}</p>
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={handleOnlinePayment}
                disabled={isProcessing}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    در حال هدایت به درگاه پرداخت...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    هدایت به درگاه پرداخت
                  </>
                )}
              </Button>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <p className="text-sm text-green-800">
                پرداخت امن از طریق {activeGateway.name}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">درگاه پرداخت در دسترس نیست</h3>
            <p className="text-gray-500">در حال حاضر هیچ درگاه پرداخت آنلاینی فعال نیست.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPaymentMethod = () => {
    switch (paymentMethod) {
      case 'iraqi_bank':
        return renderIraqiBankTransfer();
      case 'credit_card':
        return renderCreditCard();
      case 'digital_wallet':
        return renderDigitalWallet();
      case 'bank_transfer':
        return renderInternationalBankTransfer();
      case 'online_payment':
        return renderOnlinePayment();
      case 'fib_online':
        return renderFibPayment();
      default:
        return (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Payment Method Not Available</h3>
              <p className="text-gray-500">The selected payment method is not currently supported.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payment Details</h2>
        <Badge variant="outline" className="text-lg font-semibold px-4 py-2">
          Total: {formatCurrency(totalAmount)}
        </Badge>
      </div>

      {renderPaymentMethod()}

      <div className="flex flex-col space-y-4">
        <Button 
          onClick={simulatePaymentProcessing}
          disabled={isProcessing}
          size="lg"
          className="w-full"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </>
          ) : (
            `Process Payment ${formatCurrency(totalAmount)}`
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>Your payment information is secure and encrypted.</p>
          <p>By proceeding, you agree to our terms and conditions.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
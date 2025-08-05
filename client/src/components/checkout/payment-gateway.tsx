import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CreditCard, Building2, Wallet, CheckCircle, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PaymentGatewayProps {
  paymentMethod: string;
  totalAmount: number;
  orderId: string;
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
  activeGateway?: any;
  walletAmount?: number;
}

const PaymentGateway = ({ 
  paymentMethod, 
  totalAmount, 
  orderId, 
  onPaymentSuccess, 
  onPaymentError,
  activeGateway,
  walletAmount: initialWalletAmount = 0
}: PaymentGatewayProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch wallet balance for hybrid payment calculations
  const { data: walletBalance } = useQuery({
    queryKey: ['/api/customers/wallet/balance'],
    enabled: paymentMethod === 'wallet_partial',
  });

  // Handle wallet-only payment (when remaining balance is 0)
  const handleWalletOnlyPayment = async () => {
    console.log('🔄 [WALLET ONLY] Processing wallet-only payment for order:', orderId);
    setIsProcessing(true);
    
    try {
      const response = await apiRequest('/api/customers/wallet/complete-payment', {
        method: 'POST',
        body: {
          orderId: orderId,
          totalAmount: totalAmount,
          paymentMethod: 'wallet_full'
        }
      });

      if (response.success) {
        console.log('✅ [WALLET ONLY] Payment completed successfully');
        
        // Clear cart after successful payment
        console.log('🧹 [CART CLEAR] Clearing cart after successful wallet payment');
        try {
          // Use fetch with credentials to ensure session is included
          const cartResponse = await fetch('/api/cart/clear', { 
            method: 'POST',
            body: JSON.stringify({}), 
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'  // Include session cookies
          });
          
          const cartResult = await cartResponse.json();
          console.log('✅ [CART CLEAR] Database cart cleared:', cartResult);
          
          // Also clear localStorage cart immediately
          localStorage.removeItem('cart');
          console.log('🧹 [CART CLEAR] Cleared localStorage cart');
        } catch (cartError) {
          console.warn('⚠️ [CART CLEAR] Failed to clear cart:', cartError);
          // Force clear localStorage even if database clear fails
          localStorage.removeItem('cart');
        }
        
        onPaymentSuccess({
          method: 'wallet_full',
          transactionId: response.transactionId,
          amount: totalAmount,
          walletDeducted: totalAmount,
          bankPaid: 0
        });
      } else {
        throw new Error(response.message || 'Wallet payment failed');
      }
    } catch (error) {
      console.error('❌ [WALLET ONLY] Payment failed:', error);
      onPaymentError('پرداخت از کیف پول با خطا مواجه شد');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle hybrid payment (wallet + bank)
  const handleHybridPayment = async (walletAmount: number, remainingAmount: number) => {
    console.log('🔄 [HYBRID PAYMENT] Processing hybrid payment for order:', orderId);
    console.log('🔄 [HYBRID PAYMENT] Wallet amount:', walletAmount, 'Remaining:', remainingAmount);
    
    // Critical check: If remaining amount is 0 or less, this is wallet-only payment
    if (remainingAmount <= 0) {
      console.log('💰 [HYBRID PAYMENT] Remaining amount is 0 - processing as wallet-only payment');
      handleWalletOnlyPayment();
      return;
    }
    
    console.log('🏦 [HYBRID PAYMENT] Starting wallet deduction first, then bank redirect');
    
    setIsProcessing(true);
    
    try {
      // Step 1: Immediately deduct from wallet
      console.log('💰 [WALLET DEDUCTION] Deducting', walletAmount, 'from wallet for order:', orderId);
      
      const walletResponse = await apiRequest('/api/customers/wallet/hybrid-deduction', {
        method: 'POST',
        body: {
          orderId: orderId,
          walletAmount: walletAmount,
          remainingAmount: remainingAmount,
          totalAmount: totalAmount
        }
      });

      if (walletResponse.success) {
        console.log('✅ [WALLET DEDUCTION] Wallet successfully deducted:', walletAmount);
        
        // Double-check: If remaining amount is actually 0, complete as wallet-only
        if (remainingAmount <= 0) {
          console.log('💰 [HYBRID PAYMENT] Remaining amount is 0 after deduction - completing as wallet-only');
          
          // Clear cart after successful wallet-only payment
          console.log('🧹 [CART CLEAR] Clearing cart after successful wallet-only payment');
          try {
            const customerId = localStorage.getItem('customerId');
            await apiRequest('/api/cart/clear', { 
              method: 'POST',
              body: { customerId: customerId ? parseInt(customerId) : undefined }
            });
            
            // Also clear localStorage cart immediately
            localStorage.removeItem('cart');
            console.log('🧹 [CART CLEAR] Cleared localStorage cart');
            
            console.log('✅ [CART CLEAR] Cart cleared successfully');
          } catch (cartError) {
            console.warn('⚠️ [CART CLEAR] Failed to clear cart:', cartError);
          }
          
          setIsProcessing(false);
          onPaymentSuccess({
            method: 'wallet_full',
            transactionId: walletResponse.transactionId,
            amount: totalAmount,
            walletDeducted: walletAmount,
            bankPaid: 0
          });
          return;
        }
        
        console.log('🏦 [BANK REDIRECT] Now redirecting to bank gateway for remaining:', remainingAmount);
        
        // Step 2: Update form data for bank gateway
        setFormData((prev: any) => ({
          ...prev,
          walletAmount,
          remainingAmount,
          paymentMethod: 'wallet_partial'
        }));
        
        // Reset processing state before triggering bank redirect
        setIsProcessing(false);
        
        // Small delay to ensure state is updated, then trigger bank gateway redirect
        setTimeout(() => {
          console.log('🚀 [BANK REDIRECT] Triggering handleOnlinePayment after wallet deduction');
          handleOnlinePayment();
        }, 100);
      } else {
        throw new Error(walletResponse.message || 'Wallet deduction failed');
      }
      
    } catch (error) {
      console.error('❌ [HYBRID PAYMENT] Error during wallet deduction:', error);
      onPaymentError('خطا در کسر از کیف پول. لطفاً دوباره تلاش کنید.');
      setIsProcessing(false);
    }
  };

  // Auto-redirect for online payment method
  useEffect(() => {
    console.log('🔍 [AUTO REDIRECT DEBUG] Payment method:', paymentMethod);
    console.log('🔍 [AUTO REDIRECT DEBUG] Active gateway:', activeGateway);
    console.log('🔍 [AUTO REDIRECT DEBUG] Is processing:', isProcessing);
    console.log('🔍 [AUTO REDIRECT DEBUG] Gateway config:', activeGateway?.config);
    
    // Check if we have remaining amount for wallet_partial payments
    const hasRemainingAmount = formData?.remainingAmount > 0;
    
    if (paymentMethod === 'online_payment' && activeGateway && !isProcessing) {
      console.log('🔄 [AUTO REDIRECT] Triggering auto-redirect for online payment');
      console.log('🔄 [AUTO REDIRECT] Gateway config:', activeGateway.config);
      
      setTimeout(() => {
        console.log('🚀 [AUTO REDIRECT] Executing handleOnlinePayment now');
        try {
          handleOnlinePayment();
        } catch (error) {
          console.error('❌ [AUTO REDIRECT] Error during auto redirect:', error);
        }
      }, 2000);
    } else if (paymentMethod === 'wallet_partial' && activeGateway && !isProcessing && hasRemainingAmount) {
      console.log('🔄 [AUTO REDIRECT] Triggering auto-redirect for wallet_partial with remaining amount:', formData?.remainingAmount);
      console.log('🔄 [AUTO REDIRECT] Gateway config:', activeGateway.config);
      
      setTimeout(() => {
        console.log('🚀 [AUTO REDIRECT] Executing handleOnlinePayment for remaining amount');
        try {
          handleOnlinePayment();
        } catch (error) {
          console.error('❌ [AUTO REDIRECT] Error during auto redirect:', error);
        }
      }, 2000);
    } else if (paymentMethod === 'wallet_partial' && !hasRemainingAmount) {
      console.log('💰 [AUTO REDIRECT] wallet_partial with 0 remaining - no bank redirect needed');
    }
  }, [paymentMethod, activeGateway, isProcessing, formData?.remainingAmount]);

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
    console.log('🚀 [HANDLE ONLINE PAYMENT] Function called');
    if (!activeGateway) {
      console.error('❌ [HANDLE ONLINE PAYMENT] No active gateway found');
      onPaymentError('هیچ درگاه پرداخت فعالی موجود نیست');
      return;
    }
    console.log('✅ [HANDLE ONLINE PAYMENT] Active gateway exists:', activeGateway);

    setIsProcessing(true);
    
    try {
      // Get gateway config and build redirect URL
      const gatewayConfig = activeGateway.config;
      console.log('🔍 [PAYMENT GATEWAY] Gateway config:', gatewayConfig);
      console.log('🔍 [PAYMENT GATEWAY] Form data:', formData);
      
      // Determine amount for gateway - use remainingAmount if hybrid, otherwise totalAmount
      const amountForGateway = formData.remainingAmount || totalAmount;
      const walletAmount = formData.walletAmount || 0;
      
      console.log('💰 [PAYMENT GATEWAY] Payment breakdown:', {
        totalAmount,
        walletAmount,
        amountForGateway,
        isHybrid: formData.paymentMethod === 'wallet_partial'
      });
      
      if (gatewayConfig && gatewayConfig.apiBaseUrl) {
        // Build payment URL with proper parameters for Shaparak
        const baseUrl = gatewayConfig.apiBaseUrl;
        const merchantId = gatewayConfig.merchantId || 'DEMO_MERCHANT';
        const paymentReference = `MOMTAZ_${orderId}_${Date.now()}`;
        
        const paymentUrl = `${baseUrl}?` +
          `merchantId=${encodeURIComponent(merchantId)}&` +
          `amount=${amountForGateway}&` +
          `currency=IQD&` +
          `reference=${encodeURIComponent(paymentReference)}&` +
          `orderNumber=${encodeURIComponent(orderId)}&` +
          `walletAmount=${walletAmount}&` +
          `paymentMethod=${encodeURIComponent(formData.paymentMethod || 'online_payment')}&` +
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

  const handleWalletPayment = async () => {
    try {
      setIsProcessing(true);
      
      console.log('💰 [WALLET PAYMENT] Processing wallet payment:', {
        orderId,
        totalAmount,
        paymentMethod
      });
      
      const response = await apiRequest('/api/customers/wallet/complete-payment', {
        method: 'POST',
        body: {
          orderId,
          totalAmount,
          paymentMethod: 'wallet_full'
        }
      });
      
      console.log('💰 [WALLET PAYMENT] Response:', response);
      
      if (response.success) {
        const paymentData = {
          method: 'wallet_full',
          transactionId: response.transactionId,
          amount: totalAmount,
          orderId,
          newWalletBalance: response.newWalletBalance,
          amountDeducted: response.amountDeducted,
          timestamp: new Date().toISOString()
        };
        
        setIsProcessing(false);
        onPaymentSuccess(paymentData);
      } else {
        throw new Error(response.message || 'خطا در پردازش پرداخت از کیف پول');
      }
    } catch (error: any) {
      console.error('💰 [WALLET PAYMENT] Error:', error);
      setIsProcessing(false);
      onPaymentError(error.message || 'خطا در پردازش پرداخت از کیف پول');
    }
  };

  const simulatePaymentProcessing = async () => {
    if (paymentMethod === 'online_payment') {
      await handleOnlinePayment();
      return;
    }

    if (paymentMethod === 'wallet_full' || paymentMethod === 'wallet_partial') {
      await handleWalletPayment();
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

  const renderWalletPartialPayment = () => {
    const currentBalance = (walletBalance as any)?.balance || 0;
    
    // Try to restore wallet amount from localStorage if available, or use passed prop
    const savedWalletAmount = localStorage.getItem(`wallet_amount_${orderId}`);
    const defaultWalletAmount = savedWalletAmount ? parseFloat(savedWalletAmount) : initialWalletAmount;
    
    // User specifies wallet amount - start with saved amount, prop value, or 0
    const [walletAmount, setWalletAmount] = useState(defaultWalletAmount);
    const remainingAmount = Math.max(0, totalAmount - walletAmount);
    
    // Auto-execute wallet-only payment when remaining is 0
    useEffect(() => {
      if (remainingAmount === 0 && walletAmount > 0 && !isProcessing) {
        console.log('🚀 [AUTO WALLET] Executing automatic wallet-only payment');
        console.log('🚀 [AUTO WALLET] Wallet amount:', walletAmount, 'Remaining:', remainingAmount);
        
        // Small delay to ensure UI is stable
        const timer = setTimeout(() => {
          handleWalletOnlyPayment();
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }, [remainingAmount, walletAmount, isProcessing]);
    
    console.log('🔍 [WALLET PARTIAL DEBUG] Current balance:', currentBalance);
    console.log('🔍 [WALLET PARTIAL DEBUG] Total amount:', totalAmount);
    console.log('🔍 [WALLET PARTIAL DEBUG] User wallet amount:', walletAmount);
    console.log('🔍 [WALLET PARTIAL DEBUG] Remaining amount:', remainingAmount);

    const handleWalletAmountChange = (value: string) => {
      const amount = parseFloat(value) || 0;
      const maxWallet = Math.min(currentBalance, totalAmount);
      const finalAmount = Math.min(Math.max(0, amount), maxWallet);
      setWalletAmount(finalAmount);
      
      // Save to localStorage for persistence across page loads
      localStorage.setItem(`wallet_amount_${orderId}`, finalAmount.toString());
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            پرداخت ترکیبی - Hybrid Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">جزئیات پرداخت ترکیبی</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>مبلغ کل سفارش:</span>
                <span className="font-semibold">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>موجودی کیف پول:</span>
                <span className="font-semibold text-green-600">{formatCurrency(currentBalance)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="walletAmount" className="text-sm font-medium">
                مقدار کسری از کیف پول (IQD)
              </Label>
              <Input
                id="walletAmount"
                type="number"
                value={walletAmount}
                onChange={(e) => handleWalletAmountChange(e.target.value)}
                min="0"
                max={Math.min(currentBalance, totalAmount)}
                step="0.01"
                className="mt-1"
                placeholder="مقدار از کیف پول"
              />
              <p className="text-xs text-gray-500 mt-1">
                حداکثر: {formatCurrency(Math.min(currentBalance, totalAmount))}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span>از کیف پول:</span>
                <span className="font-semibold text-blue-600">{formatCurrency(walletAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>مانده برای بانک:</span>
                <span className="font-semibold text-red-600">{formatCurrency(remainingAmount)}</span>
              </div>
            </div>
          </div>
          
          {remainingAmount === 0 ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold text-green-900 mb-2">پرداخت از کیف پول</h4>
                <p className="text-sm text-green-800">
                  پرداخت کامل از کیف پول انجام خواهد شد.
                </p>
              </div>
              
              <Button 
                onClick={handleWalletOnlyPayment}
                disabled={isProcessing}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    در حال پردازش...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5 mr-2" />
                    پرداخت از کیف پول ({formatCurrency(walletAmount)})
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg">
                <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-2" />
                <h4 className="font-semibold text-amber-900 mb-2">پرداخت ترکیبی</h4>
                <p className="text-sm text-amber-800">
                  {formatCurrency(walletAmount)} از کیف پول کسر و 
                  {formatCurrency(remainingAmount)} از طریق بانک پرداخت خواهد شد.
                </p>
              </div>
              
              <Button 
                onClick={() => handleHybridPayment(walletAmount, remainingAmount)}
                disabled={isProcessing || walletAmount <= 0}
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
                    ادامه پرداخت ترکیبی
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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
      case 'wallet_partial':
        return renderWalletPartialPayment();
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
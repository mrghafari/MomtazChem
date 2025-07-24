import { useState, useRef } from "react";
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
}

const PaymentGateway = ({ 
  paymentMethod, 
  totalAmount, 
  orderId, 
  onPaymentSuccess, 
  onPaymentError 
}: PaymentGatewayProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const simulatePaymentProcessing = async () => {
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
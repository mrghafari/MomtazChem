import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Building, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: ''
  });
  const [bankData, setBankData] = useState({
    bankName: '',
    accountNumber: '',
    transferReference: ''
  });
  const { toast } = useToast();

  // Iraqi Banks for local bank transfer
  const iraqiBanks = [
    { value: 'cbi', label: 'Central Bank of Iraq' },
    { value: 'rafidain', label: 'Rafidain Bank' },
    { value: 'rasheed', label: 'Al-Rasheed Bank' },
    { value: 'trade', label: 'Trade Bank of Iraq' },
    { value: 'development', label: 'Iraqi Islamic Bank for Investment and Development' },
    { value: 'commercial', label: 'Commercial Bank of Iraq' },
    { value: 'credit', label: 'Credit Bank of Iraq' },
    { value: 'kurdistan', label: 'Kurdistan International Islamic Bank' },
    { value: 'asiacell', label: 'Asia Hawala' },
    { value: 'fastpay', label: 'FastPay Iraq' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const processPayment = async () => {
    setIsProcessing(true);
    
    try {
      let paymentData;
      
      switch (paymentMethod) {
        case 'credit_card':
          paymentData = await processCreditCardPayment();
          break;
        case 'bank_transfer':
          paymentData = await processBankTransfer();
          break;
        case 'iraqi_bank':
          paymentData = await processIraqiBankTransfer();
          break;
        case 'digital_wallet':
          paymentData = await processDigitalWallet();
          break;
        default:
          throw new Error('Unsupported payment method');
      }
      
      onPaymentSuccess(paymentData);
    } catch (error) {
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const processCreditCardPayment = async () => {
    // Simulate credit card processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Validate card data
    if (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv || !cardData.cardHolderName) {
      throw new Error('Please fill in all card details');
    }
    
    // Simulate payment gateway response
    return {
      transactionId: `CC_${Date.now()}`,
      method: 'credit_card',
      status: 'completed',
      amount: totalAmount,
      currency: 'USD',
      cardLast4: cardData.cardNumber.slice(-4),
      timestamp: new Date().toISOString()
    };
  };

  const processBankTransfer = async () => {
    // For international bank transfers
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      transactionId: `BT_${Date.now()}`,
      method: 'bank_transfer',
      status: 'pending_verification',
      amount: totalAmount,
      currency: 'USD',
      bankName: bankData.bankName,
      accountNumber: bankData.accountNumber,
      transferReference: bankData.transferReference,
      timestamp: new Date().toISOString()
    };
  };

  const processIraqiBankTransfer = async () => {
    // For local Iraqi bank transfers
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!bankData.bankName || !bankData.transferReference) {
      throw new Error('Please select bank and provide transfer reference');
    }
    
    return {
      transactionId: `IQ_${Date.now()}`,
      method: 'iraqi_bank',
      status: 'pending_verification',
      amount: totalAmount,
      currency: 'USD',
      bankName: bankData.bankName,
      transferReference: bankData.transferReference,
      timestamp: new Date().toISOString()
    };
  };

  const processDigitalWallet = async () => {
    // For digital wallets (PayPal, etc.)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      transactionId: `DW_${Date.now()}`,
      method: 'digital_wallet',
      status: 'completed',
      amount: totalAmount,
      currency: 'USD',
      timestamp: new Date().toISOString()
    };
  };

  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case 'credit_card':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardData.cardNumber}
                onChange={(e) => setCardData(prev => ({ ...prev, cardNumber: e.target.value }))}
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={cardData.expiryDate}
                  onChange={(e) => setCardData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cardData.cvv}
                  onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value }))}
                  maxLength={4}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cardHolderName">Card Holder Name</Label>
              <Input
                id="cardHolderName"
                placeholder="John Doe"
                value={cardData.cardHolderName}
                onChange={(e) => setCardData(prev => ({ ...prev, cardHolderName: e.target.value }))}
              />
            </div>
          </div>
        );

      case 'iraqi_bank':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bankSelect">Select Your Bank</Label>
              <Select value={bankData.bankName} onValueChange={(value) => setBankData(prev => ({ ...prev, bankName: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your bank" />
                </SelectTrigger>
                <SelectContent>
                  {iraqiBanks.map((bank) => (
                    <SelectItem key={bank.value} value={bank.value}>
                      {bank.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transferRef">Transfer Reference Number</Label>
              <Input
                id="transferRef"
                placeholder="Enter transfer reference"
                value={bankData.transferReference}
                onChange={(e) => setBankData(prev => ({ ...prev, transferReference: e.target.value }))}
              />
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-2 font-medium">Bank Transfer Instructions:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Transfer Amount: {formatCurrency(totalAmount)}</li>
                <li>• Account Name: Momtazchem Solutions</li>
                <li>• Reference: Order #{orderId}</li>
                <li>• Please keep your transfer receipt</li>
              </ul>
            </div>
          </div>
        );

      case 'bank_transfer':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="Enter your bank name"
                value={bankData.bankName}
                onChange={(e) => setBankData(prev => ({ ...prev, bankName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="accountNumber">Account Number (Last 4 digits)</Label>
              <Input
                id="accountNumber"
                placeholder="****1234"
                value={bankData.accountNumber}
                onChange={(e) => setBankData(prev => ({ ...prev, accountNumber: e.target.value }))}
                maxLength={4}
              />
            </div>
            <div>
              <Label htmlFor="transferReference">Transfer Reference</Label>
              <Input
                id="transferReference"
                placeholder="Transfer reference number"
                value={bankData.transferReference}
                onChange={(e) => setBankData(prev => ({ ...prev, transferReference: e.target.value }))}
              />
            </div>
          </div>
        );

      case 'digital_wallet':
        return (
          <div className="space-y-4">
            <div className="text-center p-6 border border-dashed border-gray-300 rounded-lg">
              <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">You will be redirected to complete payment</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getPaymentMethodIcon = () => {
    switch (paymentMethod) {
      case 'credit_card':
        return <CreditCard className="w-5 h-5" />;
      case 'iraqi_bank':
      case 'bank_transfer':
        return <Building className="w-5 h-5" />;
      case 'digital_wallet':
        return <DollarSign className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getPaymentMethodName = () => {
    switch (paymentMethod) {
      case 'credit_card':
        return 'Credit/Debit Card';
      case 'iraqi_bank':
        return 'Iraqi Bank Transfer';
      case 'bank_transfer':
        return 'International Bank Transfer';
      case 'digital_wallet':
        return 'Digital Wallet';
      default:
        return 'Payment';
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getPaymentMethodIcon()}
          {getPaymentMethodName()}
        </CardTitle>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Order #{orderId}</span>
          <Badge variant="outline" className="text-lg font-bold">
            {formatCurrency(totalAmount)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderPaymentForm()}
        
        <Button 
          onClick={processPayment}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Pay {formatCurrency(totalAmount)}
            </>
          )}
        </Button>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Your payment is secured with 256-bit SSL encryption
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentGateway;
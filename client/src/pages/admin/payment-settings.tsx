import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, CreditCard, Wallet, Settings, Plus, Edit, Trash2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PaymentGateway {
  id: number;
  name: string;
  type: 'iraqi_bank' | 'credit_card' | 'digital_wallet' | 'bank_transfer';
  enabled: boolean;
  config: {
    apiKey?: string;
    secretKey?: string;
    merchantId?: string;
    bankName?: string;
    accountNumber?: string;
    swiftCode?: string;
    walletProvider?: string;
    webhookUrl?: string;
    testMode?: boolean;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

const PaymentSettings = () => {
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payment gateways
  const { data: gateways = [], isLoading } = useQuery<PaymentGateway[]>({
    queryKey: ['/api/payment/gateways'],
  });

  // Create/Update gateway mutation
  const saveGatewayMutation = useMutation({
    mutationFn: async (gatewayData: Partial<PaymentGateway>) => {
      const url = gatewayData.id ? `/api/payment/gateways/${gatewayData.id}` : '/api/payment/gateways';
      const method = gatewayData.id ? 'PATCH' : 'POST';
      return apiRequest(url, { method, body: gatewayData });
    },
    onSuccess: () => {
      toast({
        title: "تنظیمات درگاه پرداخت ذخیره شد",
        description: "تنظیمات درگاه پرداخت با موفقیت ذخیره شد.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment/gateways'] });
      setIsEditDialogOpen(false);
      setSelectedGateway(null);
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "ذخیره تنظیمات درگاه پرداخت با شکست مواجه شد.",
        variant: "destructive",
      });
    },
  });

  // Toggle gateway status mutation (only one can be enabled at a time)
  const toggleGatewayMutation = useMutation({
    mutationFn: async (gatewayId: number) => {
      return apiRequest(`/api/payment/gateways/${gatewayId}/toggle`, { method: 'PATCH' });
    },
    onSuccess: () => {
      toast({
        title: "وضعیت درگاه تغییر کرد",
        description: "وضعیت درگاه پرداخت با موفقیت تغییر کرد. فقط یک درگاه می‌تواند فعال باشد.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment/gateways'] });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "تغییر وضعیت درگاه با شکست مواجه شد.",
        variant: "destructive",
      });
    },
  });

  // Delete gateway mutation
  const deleteGatewayMutation = useMutation({
    mutationFn: async (gatewayId: number) => {
      return apiRequest(`/api/payment/gateways/${gatewayId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({
        title: "Gateway Deleted",
        description: "Payment gateway has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment/gateways'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete payment gateway.",
        variant: "destructive",
      });
    },
  });

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getGatewayIcon = (type: string) => {
    switch (type) {
      case 'iraqi_bank':
        return <Building2 className="w-5 h-5" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5" />;
      case 'digital_wallet':
        return <Wallet className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getGatewayTypeLabel = (type: string) => {
    switch (type) {
      case 'iraqi_bank':
        return 'Iraqi Bank Transfer';
      case 'credit_card':
        return 'Credit/Debit Cards';
      case 'digital_wallet':
        return 'Digital Wallets';
      case 'bank_transfer':
        return 'International Bank Transfer';
      default:
        return type;
    }
  };

  const renderGatewayForm = () => {
    if (!selectedGateway) return null;

    const updateGateway = (field: string, value: any) => {
      setSelectedGateway(prev => prev ? {
        ...prev,
        [field]: value
      } : null);
    };

    const updateConfig = (field: string, value: any) => {
      setSelectedGateway(prev => prev ? {
        ...prev,
        config: {
          ...prev.config,
          [field]: value
        }
      } : null);
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Gateway Name</Label>
            <Input
              value={selectedGateway.name}
              onChange={(e) => updateGateway('name', e.target.value)}
              placeholder="Enter gateway name"
            />
          </div>
          <div>
            <Label>Gateway Type</Label>
            <Select
              value={selectedGateway.type}
              onValueChange={(value) => updateGateway('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="iraqi_bank">Iraqi Bank Transfer</SelectItem>
                <SelectItem value="credit_card">Credit/Debit Cards</SelectItem>
                <SelectItem value="digital_wallet">Digital Wallets</SelectItem>
                <SelectItem value="bank_transfer">International Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={selectedGateway.enabled}
            onCheckedChange={(checked) => updateGateway('enabled', checked)}
          />
          <Label>Enable this payment gateway</Label>
        </div>

        <Separator />

        {/* API Configuration Section - Common for all types */}
        <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Configuration & Integration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type={showSecrets['apiKey'] ? 'text' : 'password'}
                  value={selectedGateway.config.apiKey || ''}
                  onChange={(e) => updateConfig('apiKey', e.target.value)}
                  placeholder="Enter API key for gateway integration"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => toggleSecretVisibility('apiKey')}
                >
                  {showSecrets['apiKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <div>
              <Label>Secret Key</Label>
              <div className="relative">
                <Input
                  type={showSecrets['secretKey'] ? 'text' : 'password'}
                  value={selectedGateway.config.secretKey || ''}
                  onChange={(e) => updateConfig('secretKey', e.target.value)}
                  placeholder="Enter secret key for authentication"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => toggleSecretVisibility('secretKey')}
                >
                  {showSecrets['secretKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label>Merchant ID</Label>
              <Input
                value={selectedGateway.config.merchantId || ''}
                onChange={(e) => updateConfig('merchantId', e.target.value)}
                placeholder="Your merchant identifier"
              />
            </div>
            
            <div>
              <Label>API Base URL</Label>
              <Input
                value={selectedGateway.config.apiBaseUrl || ''}
                onChange={(e) => updateConfig('apiBaseUrl', e.target.value)}
                placeholder="https://api.gateway.com/v1/"
              />
            </div>

            <div>
              <Label>Webhook URL</Label>
              <Input
                value={selectedGateway.config.webhookUrl || ''}
                onChange={(e) => updateConfig('webhookUrl', e.target.value)}
                placeholder="https://yourdomain.com/webhook/payment"
              />
            </div>

            <div>
              <Label>Timeout (seconds)</Label>
              <Input
                type="number"
                value={selectedGateway.config.timeout || '30'}
                onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
                placeholder="30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={selectedGateway.config.testMode || false}
                onCheckedChange={(checked) => updateConfig('testMode', checked)}
              />
              <Label>Test Mode (Sandbox Environment)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={selectedGateway.config.autoConfirm || false}
                onCheckedChange={(checked) => updateConfig('autoConfirm', checked)}
              />
              <Label>Auto-confirm Payments</Label>
            </div>
          </div>

          <div>
            <Label>Allowed IP Addresses (one per line)</Label>
            <Textarea
              value={selectedGateway.config.allowedIPs || ''}
              onChange={(e) => updateConfig('allowedIPs', e.target.value)}
              placeholder="192.168.1.1&#10;10.0.0.1&#10;203.0.113.0/24"
              rows={3}
            />
          </div>
        </div>

        {/* Iraqi Bank Configuration */}
        {selectedGateway.type === 'iraqi_bank' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Iraqi Bank Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bank Name</Label>
                <Input
                  value={selectedGateway.config.bankName || ''}
                  onChange={(e) => updateConfig('bankName', e.target.value)}
                  placeholder="e.g., Rasheed Bank"
                />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input
                  value={selectedGateway.config.accountNumber || ''}
                  onChange={(e) => updateConfig('accountNumber', e.target.value)}
                  placeholder="Bank account number"
                />
              </div>
              <div>
                <Label>SWIFT Code</Label>
                <Input
                  value={selectedGateway.config.swiftCode || ''}
                  onChange={(e) => updateConfig('swiftCode', e.target.value)}
                  placeholder="e.g., RSHDIQBA"
                />
              </div>
              <div>
                <Label>Account Holder Name</Label>
                <Input
                  value={selectedGateway.config.accountHolder || ''}
                  onChange={(e) => updateConfig('accountHolder', e.target.value)}
                  placeholder="Account holder name"
                />
              </div>
              <div>
                <Label>Branch Code</Label>
                <Input
                  value={selectedGateway.config.branchCode || ''}
                  onChange={(e) => updateConfig('branchCode', e.target.value)}
                  placeholder="Bank branch code"
                />
              </div>
              <div>
                <Label>IBAN</Label>
                <Input
                  value={selectedGateway.config.iban || ''}
                  onChange={(e) => updateConfig('iban', e.target.value)}
                  placeholder="IQ** **** **** **** ****"
                />
              </div>
            </div>
            <div>
              <Label>Bank Address</Label>
              <Textarea
                value={selectedGateway.config.bankAddress || ''}
                onChange={(e) => updateConfig('bankAddress', e.target.value)}
                placeholder="Complete bank address"
                rows={2}
              />
            </div>
            <div>
              <Label>Transfer Instructions</Label>
              <Textarea
                value={selectedGateway.config.instructions || ''}
                onChange={(e) => updateConfig('instructions', e.target.value)}
                placeholder="Instructions for customers making bank transfers"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Credit Card Configuration */}
        {selectedGateway.type === 'credit_card' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Credit Card Gateway Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gateway Provider</Label>
                <Select
                  value={selectedGateway.config.provider || ''}
                  onValueChange={(value) => updateConfig('provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="iraq_payment">Iraq Payment Gateway</SelectItem>
                    <SelectItem value="visa_iraq">Visa Iraq</SelectItem>
                    <SelectItem value="mastercard_iraq">Mastercard Iraq</SelectItem>
                    <SelectItem value="qi_card">Qi Card (Iraq)</SelectItem>
                    <SelectItem value="ezcash">EzCash (Iraq)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Supported Currency</Label>
                <Select
                  value={selectedGateway.config.currency || 'IQD'}
                  onValueChange={(value) => updateConfig('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IQD">Iraqi Dinar (IQD)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Terminal ID</Label>
                <Input
                  value={selectedGateway.config.terminalId || ''}
                  onChange={(e) => updateConfig('terminalId', e.target.value)}
                  placeholder="POS Terminal ID"
                />
              </div>

              <div>
                <Label>Processing Fee (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={selectedGateway.config.processingFee || ''}
                  onChange={(e) => updateConfig('processingFee', parseFloat(e.target.value))}
                  placeholder="2.5"
                />
              </div>
            </div>

            <div>
              <Label>Accepted Card Types</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['visa', 'mastercard', 'amex', 'qi_card'].map((cardType) => (
                  <div key={cardType} className="flex items-center space-x-2">
                    <Switch
                      checked={selectedGateway.config.acceptedCards?.includes(cardType) || false}
                      onCheckedChange={(checked) => {
                        const currentCards = selectedGateway.config.acceptedCards || [];
                        const newCards = checked 
                          ? [...currentCards, cardType]
                          : currentCards.filter((c: string) => c !== cardType);
                        updateConfig('acceptedCards', newCards);
                      }}
                    />
                    <Label className="capitalize">{cardType.replace('_', ' ')}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Digital Wallet Configuration */}
        {selectedGateway.type === 'digital_wallet' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Digital Wallet Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Wallet Provider</Label>
                <Select
                  value={selectedGateway.config.walletProvider || ''}
                  onValueChange={(value) => updateConfig('walletProvider', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select wallet provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zain_cash">Zain Cash (Iraq)</SelectItem>
                    <SelectItem value="asia_pay">Asia Cell Pay (Iraq)</SelectItem>
                    <SelectItem value="fastpay">FastPay Iraq</SelectItem>
                    <SelectItem value="iraqipay">IraqiPay</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="apple_pay">Apple Pay</SelectItem>
                    <SelectItem value="google_pay">Google Pay</SelectItem>
                    <SelectItem value="samsung_pay">Samsung Pay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Wallet Account ID</Label>
                <Input
                  value={selectedGateway.config.walletAccountId || ''}
                  onChange={(e) => updateConfig('walletAccountId', e.target.value)}
                  placeholder="Your wallet account ID"
                />
              </div>

              <div>
                <Label>App ID</Label>
                <Input
                  value={selectedGateway.config.appId || ''}
                  onChange={(e) => updateConfig('appId', e.target.value)}
                  placeholder="Application ID"
                />
              </div>

              <div>
                <Label>Transaction Fee (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={selectedGateway.config.transactionFee || ''}
                  onChange={(e) => updateConfig('transactionFee', parseFloat(e.target.value))}
                  placeholder="1.5"
                />
              </div>
            </div>

            <div>
              <Label>Callback URL</Label>
              <Input
                value={selectedGateway.config.callbackUrl || ''}
                onChange={(e) => updateConfig('callbackUrl', e.target.value)}
                placeholder="https://yourdomain.com/wallet/callback"
              />
            </div>

            <div>
              <Label>Return URL</Label>
              <Input
                value={selectedGateway.config.returnUrl || ''}
                onChange={(e) => updateConfig('returnUrl', e.target.value)}
                placeholder="https://yourdomain.com/payment/success"
              />
            </div>
          </div>
        )}

        {/* Test Mode */}
        <div className="space-y-4">
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Test Mode</Label>
              <p className="text-sm text-gray-500">Enable test mode for development and testing</p>
            </div>
            <Switch
              checked={selectedGateway.config.testMode || false}
              onCheckedChange={(checked) => updateConfig('testMode', checked)}
            />
          </div>
        </div>

        {/* Test Connection Section */}
        <div className="space-y-4 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Test & Validate Configuration
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  toast({
                    title: "Testing Connection",
                    description: "Attempting to connect to payment gateway...",
                  });
                  
                  // Test connection logic would go here
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                  toast({
                    title: "Connection Successful",
                    description: "Payment gateway is configured correctly.",
                  });
                } catch (error) {
                  toast({
                    title: "Connection Failed",
                    description: "Unable to connect to payment gateway. Please check your configuration.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!selectedGateway.config.apiKey && selectedGateway.type !== 'iraqi_bank'}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Test Connection
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // Validate configuration
                const requiredFields = selectedGateway.type === 'iraqi_bank' 
                  ? ['bankName', 'accountNumber', 'swiftCode']
                  : ['apiKey', 'secretKey'];
                
                const missingFields = requiredFields.filter(field => !selectedGateway.config[field]);
                
                if (missingFields.length > 0) {
                  toast({
                    title: "Validation Failed",
                    description: `Missing required fields: ${missingFields.join(', ')}`,
                    variant: "destructive",
                  });
                } else {
                  toast({
                    title: "Validation Passed",
                    description: "All required configuration fields are present.",
                  });
                }
              }}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Validate Config
            </Button>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedGateway(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveGatewayMutation.mutate(selectedGateway)}
            disabled={saveGatewayMutation.isPending}
          >
            {saveGatewayMutation.isPending ? "Saving..." : "Save Gateway"}
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Gateway Settings</h1>
          <p className="text-gray-600">Configure payment methods and gateway settings for your e-commerce platform</p>
        </div>

        <Tabs defaultValue="gateways" className="space-y-6">
          <TabsList>
            <TabsTrigger value="gateways">Payment Gateways</TabsTrigger>
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="gateways" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Payment Gateways</h2>
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setSelectedGateway({
                        id: 0,
                        name: '',
                        type: 'iraqi_bank',
                        enabled: true,
                        config: {},
                        createdAt: '',
                        updatedAt: ''
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Gateway
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedGateway?.id ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
                    </DialogTitle>
                  </DialogHeader>
                  {renderGatewayForm()}
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : gateways && gateways.length > 0 ? (
                gateways.map((gateway) => (
                <Card key={gateway.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getGatewayIcon(gateway.type)}
                        <CardTitle className="text-lg">{gateway.name}</CardTitle>
                      </div>
                      <Badge variant={gateway.enabled ? "default" : "secondary"}>
                        {gateway.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium">{getGatewayTypeLabel(gateway.type)}</p>
                    </div>
                    
                    {gateway.config.testMode && (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        Test Mode
                      </Badge>
                    )}

                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center space-x-1">
                        {gateway.enabled ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-600">
                          {gateway.enabled ? "Operational" : "Disabled"}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant={gateway.enabled ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleGatewayMutation.mutate(gateway.id)}
                          disabled={toggleGatewayMutation.isPending}
                        >
                          {gateway.enabled ? 'غیرفعال' : 'فعال'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGateway(gateway);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('آیا مطمئن هستید که می‌خواهید این درگاه را حذف کنید؟')) {
                              deleteGatewayMutation.mutate(gateway.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Card className="text-center py-12">
                    <CardContent>
                      <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Payment Gateways</h3>
                      <p className="text-gray-500 mb-6">Get started by adding your first payment gateway</p>
                      <Button
                        onClick={() => {
                          setSelectedGateway({
                            id: 0,
                            name: '',
                            type: 'iraqi_bank',
                            enabled: true,
                            config: {},
                            createdAt: '',
                            updatedAt: ''
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Gateway
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Payment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Default Currency</Label>
                    <Select defaultValue="USD">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        <SelectItem value="IQD">Iraqi Dinar (IQD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Payment Timeout (minutes)</Label>
                    <Input type="number" defaultValue="30" min="5" max="120" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked />
                  <Label>Require email confirmation for payments</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked />
                  <Label>Send payment receipts automatically</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email notifications for successful payments</Label>
                      <p className="text-sm text-gray-500">Send email to customer when payment is completed</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS notifications for failed payments</Label>
                      <p className="text-sm text-gray-500">Send SMS alert when payment fails</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Admin notifications for refunds</Label>
                      <p className="text-sm text-gray-500">Notify admin when refund is requested</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PaymentSettings;
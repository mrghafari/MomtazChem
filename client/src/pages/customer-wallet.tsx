import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCustomer } from "@/hooks/useCustomer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Plus, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle, DollarSign, CreditCard, Banknote, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface WalletSummary {
  wallet?: {
    id: number;
    balance: string;
    currency: string;
    status: string;
    creditLimit: string;
    lastActivityDate?: string;
  };
  recentTransactions: Array<{
    id: number;
    transactionType: string;
    amount: string;
    currency: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
  pendingRecharges: Array<{
    id: number;
    requestNumber: string;
    amount: string;
    currency: string;
    paymentMethod: string;
    status: string;
    createdAt: string;
  }>;
  totalSpent: number;
  totalRecharged: number;
}

interface RechargeRequest {
  id: number;
  requestNumber: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  paymentReference?: string;
  status: string;
  customerNotes?: string;
  adminNotes?: string;
  createdAt: string;
}

export default function CustomerWallet() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRechargeDialogOpen, setIsRechargeDialogOpen] = useState(false);
  const [rechargeForm, setRechargeForm] = useState({
    amount: "",
    currency: "IQD",
    paymentMethod: "",
    paymentReference: "",
    customerNotes: "",
    bankReference: "",
    bankReceipt: null as File | null
  });

  // Authentication
  const { customer, isAuthenticated, isLoading: authLoading } = useCustomer();
  const { isAuthenticated: isAdminAuthenticated } = useAuth();

  // Get language from centralized system
  const { language, t, direction } = useLanguage();
  const isRTL = direction === 'rtl';

  // Fetch wallet summary - only when authenticated
  const { data: walletData, isLoading } = useQuery<{ success: boolean; data: WalletSummary }>({
    queryKey: ['/api/customer/wallet'],
    enabled: isAuthenticated, // Only fetch when authenticated
    refetchInterval: 60000 // Refresh every 1 minute for wallet balance
  });

  // Fetch all recharge requests - only when authenticated
  const { data: rechargeRequestsData } = useQuery<{ success: boolean; data: RechargeRequest[] }>({
    queryKey: ['/api/customer/wallet/recharge-requests'],
    enabled: isAuthenticated, // Only fetch when authenticated
    refetchInterval: 30000
  });

  // Fetch all transactions - only when authenticated
  const { data: transactionsData } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['/api/customer/wallet/transactions'],
    enabled: isAuthenticated, // Only fetch when authenticated
    refetchInterval: 30000
  });

  // Create recharge request mutation
  const createRechargeMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/customer/wallet/recharge', 'POST', data),
    onSuccess: () => {
      toast({
        title: t.rechargeSuccess,
        description: t.requestSubmitted,
      });
      setIsRechargeDialogOpen(false);
      setRechargeForm({
        amount: "",
        currency: "IQD",
        paymentMethod: "",
        paymentReference: "",
        customerNotes: "",
        bankReference: "",
        bankReceipt: null
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/wallet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/wallet/recharge-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: t.requestError,
        description: error.message || t.errorCreatingRequest,
        variant: "destructive",
      });
    }
  });

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rechargeForm.amount || parseFloat(rechargeForm.amount) <= 0) {
      toast({
        title: t.inputError,
        description: t.validAmount,
        variant: "destructive",
      });
      return;
    }

    if (!rechargeForm.paymentMethod) {
      toast({
        title: t.inputError,
        description: t.selectPaymentMethod,
        variant: "destructive",
      });
      return;
    }

    // Validate bank transfer fields
    if (rechargeForm.paymentMethod === 'bank_transfer') {
      if (!rechargeForm.bankReference.trim()) {
        toast({
          title: t.inputError,
          description: t.bankReferenceRequired,
          variant: "destructive",
        });
        return;
      }
      
      if (!rechargeForm.bankReceipt) {
        toast({
          title: t.inputError,
          description: t.bankReceiptRequired,
          variant: "destructive",
        });
        return;
      }
    }

    // Prepare data for submission
    const submitData = {
      amount: parseFloat(rechargeForm.amount),
      currency: rechargeForm.currency,
      paymentMethod: rechargeForm.paymentMethod,
      customerNotes: rechargeForm.customerNotes,
      paymentReference: rechargeForm.paymentReference,
      bankReference: rechargeForm.bankReference
    };

    // Submit the data using the mutation
    createRechargeMutation.mutate(submitData);

    // Handle file upload separately if needed
    if (rechargeForm.paymentMethod === 'bank_transfer' && rechargeForm.bankReceipt) {
      const formData = new FormData();
      formData.append('bankReceipt', rechargeForm.bankReceipt);
      
      try {
        const response = await fetch('/api/customer/wallet/upload-receipt', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload receipt');
        }

        const result = await response.json();
        console.log('Receipt uploaded successfully:', result);
        
      } catch (error: any) {
        console.error('Error uploading receipt:', error);
        toast({
          title: t.requestError,
          description: error.message || 'Failed to upload receipt',
          variant: "destructive",
        });
      }
    }
  };

  const formatCurrency = (amount: string | number, currency: string = "IQD") => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const locale = language === 'en' ? 'en-US' : 'ar-IQ';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { labelEn: string; labelAr: string; variant: any }> = {
      'pending': { labelEn: 'Pending', labelAr: 'معلق', variant: 'secondary' },
      'approved': { labelEn: 'Approved', labelAr: 'موافق عليه', variant: 'default' },
      'completed': { labelEn: 'Completed', labelAr: 'مكتمل', variant: 'default' },
      'rejected': { labelEn: 'Rejected', labelAr: 'مرفوض', variant: 'destructive' },
      'active': { labelEn: 'Active', labelAr: 'نشط', variant: 'default' },
      'frozen': { labelEn: 'Frozen', labelAr: 'مجمد', variant: 'destructive' }
    };
    
    const config = statusConfig[status] || { labelEn: status, labelAr: status, variant: 'secondary' };
    const label = language === 'en' ? config.labelEn : config.labelAr;
    return <Badge variant={config.variant}>{label}</Badge>;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
      case 'debit':
        return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  // Show loading during authentication check
  if (authLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${isRTL ? 'rtl' : 'ltr'}`}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wallet className="h-6 w-6" />
              {t.walletTitle}
            </CardTitle>
            <CardDescription>
              {t.loginToAccessWallet}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/shop'} className="w-full">
              {t.goToLogin}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  const wallet = walletData?.data?.wallet;
  const recentTransactions = walletData?.data?.recentTransactions || [];
  const pendingRecharges = walletData?.data?.pendingRecharges || [];
  const allRechargeRequests = rechargeRequestsData?.data || [];
  const allTransactions = transactionsData?.data || [];

  return (
    <div className={`min-h-screen bg-gray-50 p-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={direction}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h1 className={`text-3xl font-bold text-gray-900 flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Wallet className="h-8 w-8 text-blue-600" />
              {t.walletTitle}
            </h1>
            
            {/* Admin Status Badge */}
            {isAdminAuthenticated && (
              <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full border border-red-200 dark:border-red-800">
                <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                  {isRTL ? 'مدیر' : 'Admin'}
                </span>
              </div>
            )}
          </div>
          <p className="text-gray-600 mt-2">{t.walletSubtitle}</p>
        </div>

        {/* Wallet Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">{t.currentBalance}</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {wallet ? formatCurrency(wallet.balance, wallet.currency) : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t.status}: {wallet ? getStatusBadge(wallet.status) : getStatusBadge('active')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">{t.totalSpent}</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(walletData?.data?.totalSpent || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t.totalWithdrawals}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">{t.totalRecharged}</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(walletData?.data?.totalRecharged || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {t.totalDeposits}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{t.quickActions}</CardTitle>
              <CardDescription>{t.manageWallet}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Dialog open={isRechargeDialogOpen} onOpenChange={setIsRechargeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Plus className="h-4 w-4" />
                      {t.addFunds}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={isRTL ? 'rtl' : 'ltr'} dir={direction}>
                    <DialogHeader>
                      <DialogTitle>{t.walletRechargeRequest}</DialogTitle>
                      <DialogDescription>
                        {t.fillRechargeDetails}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRechargeSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="amount">{t.amount} *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={rechargeForm.amount}
                          onChange={(e) => setRechargeForm({...rechargeForm, amount: e.target.value})}
                          placeholder={t.enterAmount}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="currency">{t.currency}</Label>
                        <Select 
                          value={rechargeForm.currency} 
                          onValueChange={(value) => setRechargeForm({...rechargeForm, currency: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IQD">
                              {t.iraqiDinar}
                            </SelectItem>
                            <SelectItem value="USD">
                              {t.usDollar}
                            </SelectItem>
                            <SelectItem value="EUR">
                              {t.euro}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="paymentMethod">{t.paymentMethod} *</Label>
                        <Select 
                          value={rechargeForm.paymentMethod} 
                          onValueChange={(value) => setRechargeForm({...rechargeForm, paymentMethod: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t.selectPaymentMethod} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">
                              {t.bankTransfer}
                            </SelectItem>
                            <SelectItem value="online_payment">
                              {t.onlinePayment}
                            </SelectItem>
                            <SelectItem value="cash">
                              {t.cashPayment}
                            </SelectItem>
                            <SelectItem value="mobile_wallet">
                              {t.mobileWallet}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Bank Transfer Fields */}
                      {rechargeForm.paymentMethod === 'bank_transfer' && (
                        <>
                          <div>
                            <Label htmlFor="bankReference">{t.bankReference} *</Label>
                            <Input
                              id="bankReference"
                              value={rechargeForm.bankReference}
                              onChange={(e) => setRechargeForm({...rechargeForm, bankReference: e.target.value})}
                              placeholder={t.enterBankReference}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="bankReceipt">{t.bankReceipt} *</Label>
                            <Input
                              id="bankReceipt"
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => setRechargeForm({...rechargeForm, bankReceipt: e.target.files?.[0] || null})}
                              required
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              {t.uploadBankReceipt}
                            </p>
                          </div>
                        </>
                      )}

                      {/* General Payment Reference (for non-bank transfers) */}
                      {rechargeForm.paymentMethod !== 'bank_transfer' && (
                        <div>
                          <Label htmlFor="paymentReference">{t.paymentReference} ({t.optional})</Label>
                          <Input
                            id="paymentReference"
                            value={rechargeForm.paymentReference}
                            onChange={(e) => setRechargeForm({...rechargeForm, paymentReference: e.target.value})}
                            placeholder={t.enterPaymentReference}
                          />
                        </div>
                      )}

                      <div>
                        <Label htmlFor="customerNotes">{t.notes} ({t.optional})</Label>
                        <Textarea
                          id="customerNotes"
                          value={rechargeForm.customerNotes}
                          onChange={(e) => setRechargeForm({...rechargeForm, customerNotes: e.target.value})}
                          placeholder={t.enterNotes}
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsRechargeDialogOpen(false)}>
                          {t.cancel}
                        </Button>
                        <Button type="submit" disabled={createRechargeMutation.isPending}>
                          {createRechargeMutation.isPending ? t.processing : t.submit}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Transactions and Recharge Requests */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">{t.allTransactions}</TabsTrigger>
            <TabsTrigger value="recharge-requests">{t.rechargeRequests}</TabsTrigger>
          </TabsList>

          {/* All Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>{t.allTransactions}</CardTitle>
                <CardDescription>
                  {language === 'en' ? 'View all your wallet transactions' : 'عرض جميع معاملات محفظتك'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {allTransactions.map((transaction, index) => (
                      <div key={index} className={`flex items-center justify-between p-4 border rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center space-x-4 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {getTransactionIcon(transaction.transactionType)}
                          <div className={isRTL ? 'text-right' : 'text-left'}>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-SA')}
                            </p>
                          </div>
                        </div>
                        <div className={`text-right ${isRTL ? 'text-left' : ''}`}>
                          <p className={`font-medium ${transaction.transactionType === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.transactionType === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">{t.noTransactions}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recharge Requests Tab */}
          <TabsContent value="recharge-requests">
            <Card>
              <CardHeader>
                <CardTitle>{t.rechargeRequests}</CardTitle>
                <CardDescription>
                  {language === 'en' ? 'View all your recharge requests' : 'عرض جميع طلبات الشحن الخاصة بك'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allRechargeRequests.length > 0 ? (
                  <div className="space-y-4">
                    {allRechargeRequests.map((request) => (
                      <div key={request.id} className={`flex items-center justify-between p-4 border rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center space-x-4 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <div className={isRTL ? 'text-right' : 'text-left'}>
                            <p className="font-medium">{t.requestNumber}: {request.requestNumber}</p>
                            <p className="text-sm text-gray-500">{request.paymentMethod}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-SA')}
                            </p>
                          </div>
                        </div>
                        <div className={`text-right ${isRTL ? 'text-left' : ''}`}>
                          <p className="font-medium text-blue-600">
                            {formatCurrency(request.amount, request.currency)}
                          </p>
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">{t.noRechargeRequests}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
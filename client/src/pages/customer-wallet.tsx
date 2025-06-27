import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Wallet, Plus, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle, DollarSign, CreditCard, Banknote, Globe } from "lucide-react";

// Bilingual translations (English/Arabic)
const translations = {
  en: {
    title: "Customer Wallet",
    subtitle: "Manage your account balance and transactions",
    balance: "Current Balance",
    creditLimit: "Credit Limit",
    status: "Status",
    lastActivity: "Last Activity",
    recharge: "Add Funds",
    transactions: "Transactions",
    rechargeRequests: "Recharge Requests",
    amount: "Amount",
    currency: "Currency",
    paymentMethod: "Payment Method",
    paymentReference: "Payment Reference",
    notes: "Notes",
    submit: "Submit Request",
    cancel: "Cancel",
    pending: "Pending",
    completed: "Completed",
    rejected: "Rejected",
    active: "Active",
    inactive: "Inactive",
    credit: "Credit",
    debit: "Debit",
    type: "Type",
    description: "Description",
    date: "Date",
    requestNumber: "Request #",
    totalSpent: "Total Spent",
    totalRecharged: "Total Recharged",
    loading: "Loading wallet...",
    noTransactions: "No transactions found",
    noRechargeRequests: "No recharge requests found",
    rechargeSuccess: "Recharge request submitted successfully",
    optional: "Optional",
    bankTransfer: "Bank Transfer",
    onlinePayment: "Online Payment",
    cash: "Cash Payment",
    mobileWallet: "Mobile Wallet",
    processing: "Processing...",
    allTransactions: "All Transactions",
    recentTransactions: "Recent Transactions"
  },
  ar: {
    title: "محفظة العميل",
    subtitle: "إدارة رصيد حسابك والمعاملات",
    balance: "الرصيد الحالي",
    creditLimit: "حد الائتمان",
    status: "الحالة",
    lastActivity: "آخر نشاط",
    recharge: "إضافة أموال",
    transactions: "المعاملات",
    rechargeRequests: "طلبات الشحن",
    amount: "المبلغ",
    currency: "العملة",
    paymentMethod: "طريقة الدفع",
    paymentReference: "مرجع الدفع",
    notes: "ملاحظات",
    submit: "إرسال الطلب",
    cancel: "إلغاء",
    pending: "معلق",
    completed: "مكتمل",
    rejected: "مرفوض",
    active: "نشط",
    inactive: "غير نشط",
    credit: "إيداع",
    debit: "سحب",
    type: "النوع",
    description: "الوصف",
    date: "التاريخ",
    requestNumber: "الطلب رقم",
    totalSpent: "إجمالي المنفق",
    totalRecharged: "إجمالي المشحون",
    loading: "جارٍ تحميل المحفظة...",
    noTransactions: "لا توجد معاملات",
    noRechargeRequests: "لا توجد طلبات شحن",
    rechargeSuccess: "تم إرسال طلب الشحن بنجاح",
    optional: "اختياري",
    bankTransfer: "تحويل بنكي",
    onlinePayment: "دفع إلكتروني",
    cash: "دفع نقدي",
    mobileWallet: "محفظة جوال",
    processing: "جارٍ المعالجة...",
    allTransactions: "جميع المعاملات",
    recentTransactions: "المعاملات الأخيرة"
  }
};

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
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>('en');
  const [rechargeForm, setRechargeForm] = useState({
    amount: "",
    currency: "IQD",
    paymentMethod: "",
    paymentReference: "",
    customerNotes: ""
  });

  // Get current translations
  const t = translations[currentLanguage];
  const isRTL = currentLanguage === 'ar';

  // Fetch wallet summary
  const { data: walletData, isLoading } = useQuery<{ success: boolean; data: WalletSummary }>({
    queryKey: ['/api/customer/wallet'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch all recharge requests
  const { data: rechargeRequestsData } = useQuery<{ success: boolean; data: RechargeRequest[] }>({
    queryKey: ['/api/customer/wallet/recharge-requests'],
    refetchInterval: 30000
  });

  // Fetch all transactions
  const { data: transactionsData } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['/api/customer/wallet/transactions'],
    refetchInterval: 30000
  });

  // Create recharge request mutation
  const createRechargeMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/customer/wallet/recharge', data),
    onSuccess: () => {
      toast({
        title: t.rechargeSuccess,
        description: currentLanguage === 'en' 
          ? "Your wallet recharge request has been submitted successfully and is pending approval."
          : "تم إرسال طلب شحن محفظتك بنجاح وهو في انتظار الموافقة.",
      });
      setIsRechargeDialogOpen(false);
      setRechargeForm({
        amount: "",
        currency: "IQD",
        paymentMethod: "",
        paymentReference: "",
        customerNotes: ""
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/wallet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/wallet/recharge-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: currentLanguage === 'en' ? "Request Error" : "خطأ في الطلب",
        description: error.message || (currentLanguage === 'en' ? "Error creating wallet recharge request" : "خطأ في إنشاء طلب شحن المحفظة"),
        variant: "destructive",
      });
    }
  });

  const handleRechargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rechargeForm.amount || parseFloat(rechargeForm.amount) <= 0) {
      toast({
        title: currentLanguage === 'en' ? "Input Error" : "خطأ في الإدخال",
        description: currentLanguage === 'en' ? "Please enter a valid amount" : "يرجى إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    if (!rechargeForm.paymentMethod) {
      toast({
        title: currentLanguage === 'en' ? "Input Error" : "خطأ في الإدخال",
        description: currentLanguage === 'en' ? "Please select a payment method" : "يرجى اختيار طريقة الدفع",
        variant: "destructive",
      });
      return;
    }

    createRechargeMutation.mutate(rechargeForm);
  };

  const formatCurrency = (amount: string | number, currency: string = "IQD") => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const locale = currentLanguage === 'en' ? 'en-US' : 'ar-IQ';
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
    const label = currentLanguage === 'en' ? config.labelEn : config.labelAr;
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
    <div className={`min-h-screen bg-gray-50 p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Language Toggle */}
        <div className={`mb-4 flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
          <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm">
            <Button
              size="sm"
              variant={currentLanguage === 'en' ? 'default' : 'ghost'}
              onClick={() => setCurrentLanguage('en')}
              className="text-xs"
            >
              <Globe className="h-3 w-3 mr-1" />
              English
            </Button>
            <Button
              size="sm"
              variant={currentLanguage === 'ar' ? 'default' : 'ghost'}
              onClick={() => setCurrentLanguage('ar')}
              className="text-xs"
            >
              <Globe className="h-3 w-3 mr-1" />
              العربية
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold text-gray-900 flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Wallet className="h-8 w-8 text-blue-600" />
            {t.title}
          </h1>
          <p className="text-gray-600 mt-2">{t.subtitle}</p>
        </div>

        {/* Wallet Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CardTitle className="text-sm font-medium">{t.balance}</CardTitle>
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
                {currentLanguage === 'en' ? 'Total withdrawals' : 'إجمالي السحوبات'}
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
                {currentLanguage === 'en' ? 'Total deposits' : 'إجمالي الإيداعات'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{currentLanguage === 'en' ? 'Quick Actions' : 'الإجراءات السريعة'}</CardTitle>
              <CardDescription>{currentLanguage === 'en' ? 'Manage your wallet' : 'إدارة محفظتك'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Dialog open={isRechargeDialogOpen} onOpenChange={setIsRechargeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Plus className="h-4 w-4" />
                      {t.recharge}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={isRTL ? 'rtl' : 'ltr'}>
                    <DialogHeader>
                      <DialogTitle>{currentLanguage === 'en' ? 'Wallet Recharge Request' : 'طلب شحن المحفظة'}</DialogTitle>
                      <DialogDescription>
                        {currentLanguage === 'en' 
                          ? 'Fill in the details below to request a wallet recharge'
                          : 'املأ التفاصيل أدناه لطلب شحن المحفظة'
                        }
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
                          placeholder={currentLanguage === 'en' ? 'Enter amount' : 'أدخل المبلغ'}
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
                              {currentLanguage === 'en' ? 'Iraqi Dinar (IQD)' : 'الدينار العراقي (IQD)'}
                            </SelectItem>
                            <SelectItem value="USD">
                              {currentLanguage === 'en' ? 'US Dollar (USD)' : 'الدولار الأمريكي (USD)'}
                            </SelectItem>
                            <SelectItem value="EUR">
                              {currentLanguage === 'en' ? 'Euro (EUR)' : 'اليورو (EUR)'}
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
                            <SelectValue placeholder={currentLanguage === 'en' ? 'Select payment method' : 'اختر طريقة الدفع'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">{t.bankTransfer}</SelectItem>
                            <SelectItem value="online_payment">{t.onlinePayment}</SelectItem>
                            <SelectItem value="cash">{t.cash}</SelectItem>
                            <SelectItem value="mobile_wallet">{t.mobileWallet}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="paymentReference">{t.paymentReference} ({t.optional})</Label>
                        <Input
                          id="paymentReference"
                          value={rechargeForm.paymentReference}
                          onChange={(e) => setRechargeForm({...rechargeForm, paymentReference: e.target.value})}
                          placeholder={currentLanguage === 'en' ? 'Reference number, card number or transaction ID' : 'رقم المرجع أو رقم البطاقة أو معرف المعاملة'}
                        />
                      </div>

                      <div>
                        <Label htmlFor="customerNotes">{t.notes}</Label>
                        <Textarea
                          id="customerNotes"
                          value={rechargeForm.customerNotes}
                          onChange={(e) => setRechargeForm({...rechargeForm, customerNotes: e.target.value})}
                          placeholder={currentLanguage === 'en' ? 'Additional notes (optional)' : 'ملاحظات إضافية (اختيارية)'}
                          rows={3}
                        />
                      </div>

                      <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} ${isRTL ? 'space-x-reverse' : ''} space-x-2 justify-end`}>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsRechargeDialogOpen(false)}
                        >
                          {t.cancel}
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createRechargeMutation.isPending}
                        >
                          {createRechargeMutation.isPending ? t.processing : t.submit}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {pendingRecharges.length > 0 && (
                  <Badge variant="secondary" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Clock className="h-4 w-4" />
                    {pendingRecharges.length} {currentLanguage === 'en' ? 'pending requests' : 'طلبات معلقة'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className={isRTL ? 'flex-row-reverse' : ''}>
            <TabsTrigger value="transactions">{t.recentTransactions}</TabsTrigger>
            <TabsTrigger value="recharge-requests">{t.rechargeRequests}</TabsTrigger>
            <TabsTrigger value="all-transactions">{t.allTransactions}</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>{t.recentTransactions}</CardTitle>
                <CardDescription>{currentLanguage === 'en' ? 'Last 10 wallet transactions' : 'آخر 10 معاملات في المحفظة'}</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">{t.noTransactions}</p>
                ) : (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          {getTransactionIcon(transaction.transactionType)}
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString('fa-IR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className={`font-bold ${
                            transaction.transactionType === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.transactionType === 'credit' ? '+' : '-'}
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recharge-requests">
            <Card>
              <CardHeader>
                <CardTitle>درخواست‌های شارژ</CardTitle>
                <CardDescription>تاریخچه درخواست‌های شارژ کیف پول</CardDescription>
              </CardHeader>
              <CardContent>
                {allRechargeRequests.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">هیچ درخواست شارژی یافت نشد</p>
                ) : (
                  <div className="space-y-4">
                    {allRechargeRequests.map((request) => (
                      <div key={request.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">درخواست #{request.requestNumber}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(request.createdAt).toLocaleDateString('fa-IR')}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-blue-600">
                              {formatCurrency(request.amount, request.currency)}
                            </p>
                            {getStatusBadge(request.status)}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>روش پرداخت: {request.paymentMethod}</p>
                          {request.paymentReference && (
                            <p>مرجع: {request.paymentReference}</p>
                          )}
                          {request.customerNotes && (
                            <p>توضیحات: {request.customerNotes}</p>
                          )}
                          {request.adminNotes && (
                            <p className="text-orange-600">نظر ادمین: {request.adminNotes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-transactions">
            <Card>
              <CardHeader>
                <CardTitle>همه تراکنش‌ها</CardTitle>
                <CardDescription>تاریخچه کامل تراکنش‌های کیف پول</CardDescription>
              </CardHeader>
              <CardContent>
                {allTransactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">هیچ تراکنشی یافت نشد</p>
                ) : (
                  <div className="space-y-4">
                    {allTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          {getTransactionIcon(transaction.transactionType)}
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString('fa-IR')} - {transaction.id}
                            </p>
                            {transaction.referenceType && (
                              <p className="text-xs text-gray-400">
                                نوع: {transaction.referenceType}
                                {transaction.referenceId && ` - شناسه: ${transaction.referenceId}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-left">
                          <p className={`font-bold ${
                            transaction.transactionType === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.transactionType === 'credit' ? '+' : '-'}
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </p>
                          <p className="text-xs text-gray-500">
                            موجودی: {formatCurrency(transaction.balanceAfter, transaction.currency)}
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
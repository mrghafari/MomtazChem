import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Wallet, CheckCircle, XCircle, Clock, Eye, Users, DollarSign, CreditCard, RefreshCw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

interface WalletRechargeRequest {
  id: number;
  requestNumber: string;
  customerId: number;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  amount: string;
  currency: string;
  paymentMethod: string;
  paymentReference?: string;
  status: string;
  customerNotes?: string;
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  processedAt?: string;
}

interface WalletStats {
  totalWallets: number;
  totalBalance: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalProcessed: number;
}

interface WalletHolder {
  customerId: number;
  customerName: string;
  customerEmail: string;
  walletId: number;
  balance: number;
  lastActivityDate: Date | null;
  isActive: boolean;
}

export default function WalletManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedRequest, setSelectedRequest] = useState<WalletRechargeRequest | null>(null);
  const [customerBalances, setCustomerBalances] = useState<{[key: number]: number}>({});
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Wallet modification states
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState(false);
  const [modifyCustomerId, setModifyCustomerId] = useState<number | null>(null);
  const [modifyCustomerEmail, setModifyCustomerEmail] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [modifyAmount, setModifyAmount] = useState("");
  const [modifyReason, setModifyReason] = useState("");
  const [modificationType, setModificationType] = useState<'credit' | 'debit' | 'set_balance'>('credit');
  
  // Inline modification states for wallet holders
  const [inlineModifications, setInlineModifications] = useState<{[key: number]: {amount: string, reason: string}}>({});

  // Check if user is super admin (id = 1)
  const isSuperAdmin = user?.id === 1;

  // Get refresh interval from global settings
  const getRefreshInterval = () => {
    const globalSettings = localStorage.getItem('global-refresh-settings');
    if (globalSettings) {
      const settings = JSON.parse(globalSettings);
      const crmSettings = settings.departments.crm;
      
      if (crmSettings?.autoRefresh) {
        const refreshInterval = settings.syncEnabled 
          ? settings.globalInterval 
          : crmSettings.interval;
        return refreshInterval * 1000; // Convert seconds to milliseconds
      }
    }
    return 300000; // Default 5 minutes if no settings found
  };

  // Fetch wallet statistics
  const { data: statsData, isLoading: statsLoading } = useQuery<{ success: boolean; data: WalletStats }>({
    queryKey: ['/api/wallet/stats'],
    refetchInterval: getRefreshInterval()
  });

  // Fetch pending recharge requests
  const { data: pendingRequestsData, isLoading: pendingLoading } = useQuery<{ success: boolean; data: WalletRechargeRequest[] }>({
    queryKey: ['/api/wallet/recharge-requests/pending'],
    refetchInterval: getRefreshInterval()
  });

  // Fetch all recharge requests
  const { data: allRequestsData, isLoading: allLoading } = useQuery<{ success: boolean; data: WalletRechargeRequest[] }>({
    queryKey: ['/api/wallet/recharge-requests'],
    refetchInterval: getRefreshInterval()
  });
  
  // Fetch all wallet holders
  const { data: walletHoldersData, isLoading: holdersLoading } = useQuery<{ success: boolean; data: WalletHolder[] }>({
    queryKey: ['/api/admin/wallet/holders'],
    refetchInterval: getRefreshInterval()
  });

  // Approve recharge request
  const approveMutation = useMutation({
    mutationFn: (data: { requestId: number; adminNotes?: string }) => 
      apiRequest(`/api/admin/wallet/recharge-requests/${data.requestId}/approve`, 'POST', { adminNotes: data.adminNotes }),
    onSuccess: () => {
      toast({ title: "Success", description: "Recharge request approved successfully" });
      setIsApprovalDialogOpen(false);
      setAdminNotes("");
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve recharge request", variant: "destructive" });
    }
  });

  // Reject recharge request
  const rejectMutation = useMutation({
    mutationFn: (data: { requestId: number; rejectionReason: string; adminNotes?: string }) => 
      apiRequest(`/api/admin/wallet/recharge-requests/${data.requestId}/reject`, 'POST', { 
        rejectionReason: data.rejectionReason,
        adminNotes: data.adminNotes 
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Recharge request rejected" });
      setIsApprovalDialogOpen(false);
      setRejectionReason("");
      setAdminNotes("");
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject recharge request", variant: "destructive" });
    }
  });

  // Search customers by email
  const searchCustomers = async (email: string) => {
    if (email.length < 3) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    try {
      const response = await apiRequest(`/api/admin/customers/search?email=${encodeURIComponent(email)}`);
      if (response.success) {
        setCustomerSearchResults(response.data || []);
        setShowCustomerDropdown(true);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
    }
  };

  // Handle email input change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCustomers(modifyCustomerEmail);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [modifyCustomerEmail]);

  // Fetch customer balances when data loads
  useEffect(() => {
    if (pendingRequestsData?.data && pendingRequestsData.data.length > 0) {
      const customerIds = pendingRequestsData.data.map(request => request.customerId);
      const uniqueCustomerIds = [...new Set(customerIds)];
      fetchCustomerBalances(uniqueCustomerIds);
    }
  }, [pendingRequestsData?.data]);

  useEffect(() => {
    if (allRequestsData?.data && allRequestsData.data.length > 0) {
      const customerIds = allRequestsData.data.map(request => request.customerId);
      const uniqueCustomerIds = [...new Set(customerIds)];
      fetchCustomerBalances(uniqueCustomerIds);
    }
  }, [allRequestsData?.data]);

  // Handle customer selection
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setModifyCustomerId(customer.id);
    setModifyCustomerEmail(customer.email);
    setShowCustomerDropdown(false);
  };

  // Fetch customer wallet balances
  const fetchCustomerBalances = async (customerIds: number[]) => {
    try {
      const balancePromises = customerIds.map(async (customerId) => {
        try {
          const response = await fetch(`/api/wallet/balance/${customerId}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const result = await response.json();
            return { customerId, balance: result.data.balance };
          }
          return { customerId, balance: 0 };
        } catch (error) {
          console.error(`Error fetching balance for customer ${customerId}:`, error);
          return { customerId, balance: 0 };
        }
      });

      const results = await Promise.all(balancePromises);
      const balancesMap: {[key: number]: number} = {};
      results.forEach(({ customerId, balance }) => {
        balancesMap[customerId] = balance;
      });
      setCustomerBalances(balancesMap);
    } catch (error) {
      console.error('Error fetching customer balances:', error);
    }
  };

  // Reset customer form
  const resetCustomerForm = () => {
    setModifyCustomerId(null);
    setModifyCustomerEmail("");
    setSelectedCustomer(null);
    setCustomerSearchResults([]);
    setShowCustomerDropdown(false);
    setModifyAmount("");
    setModifyReason("");
    setModificationType('credit');
  };
  
  // Handle inline balance modification
  const handleInlineModification = (customerId: number, amount: string, reason: string) => {
    if (!amount || !reason) {
      toast({
        title: "Error",
        description: "Please enter amount and reason",
        variant: "destructive"
      });
      return;
    }
    
    modifyBalanceMutation.mutate({
      customerId,
      amount,
      reason,
      modificationType: parseFloat(amount) >= 0 ? 'credit' : 'debit'
    });
    
    // Clear the inline modification fields
    setInlineModifications(prev => ({
      ...prev,
      [customerId]: { amount: '', reason: '' }
    }));
  };
  
  // Update inline modification fields
  const updateInlineModification = (customerId: number, field: 'amount' | 'reason', value: string) => {
    setInlineModifications(prev => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        [field]: value
      }
    }));
  };

  // Force wallet sync mutation
  const syncWalletMutation = useMutation({
    mutationFn: (customerId: number) => 
      apiRequest(`/api/wallet/force-sync/${customerId}`, { method: 'POST', body: {} }),
    onSuccess: (data) => {
      toast({ 
        title: "همگام‌سازی موفق", 
        description: "اطلاعات کیف پول با موفقیت همگام‌سازی شد" 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا در همگام‌سازی", 
        description: error?.message || "خطا در همگام‌سازی اطلاعات کیف پول", 
        variant: "destructive" 
      });
    }
  });

  // Modify wallet balance
  const modifyBalanceMutation = useMutation({
    mutationFn: (data: { customerId: number; amount: string; reason: string; modificationType: string }) => 
      apiRequest('/api/admin/wallet/modify-balance', { method: 'POST', body: data }),
    onSuccess: (data) => {
      toast({ 
        title: "Success", 
        description: data.message || "Wallet balance modified successfully" 
      });
      setIsModifyDialogOpen(false);
      resetCustomerForm();
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Error modifying wallet balance", 
        variant: "destructive" 
      });
    }
  });

  const formatCurrency = (amount: string | number, currency: string = "IQD") => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (request: WalletRechargeRequest) => {
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
  };

  const handleApprove = (request: WalletRechargeRequest) => {
    setSelectedRequest(request);
    setIsApprovalDialogOpen(true);
  };

  const handleReject = (request: WalletRechargeRequest) => {
    setSelectedRequest(request);
    setIsApprovalDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {isSuperAdmin && (
              <Button
                variant="ghost"
                onClick={() => setLocation("/site-management")}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Site Management
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Wallet Management
              </h1>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">
                Financial Department Module
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage customer wallet recharge requests and balances - Part of Financial Operations
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsModifyDialogOpen(true)}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              تغییر مقدار کیف پول
            </Button>
            <Button 
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
                toast({ title: "Refreshed", description: "Data refreshed successfully" });
              }}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData?.data?.totalWallets || 0}</div>
              <p className="text-xs text-muted-foreground">Active customer wallets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(statsData?.data?.totalBalance || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Combined wallet balances</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {statsData?.data?.pendingRequests || 0}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statsData?.data?.totalProcessed || 0}
              </div>
              <p className="text-xs text-muted-foreground">Approved & completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">Pending Requests</TabsTrigger>
            <TabsTrigger value="all">All Requests</TabsTrigger>
            <TabsTrigger value="wallet-holders">{t.walletHolders}</TabsTrigger>
          </TabsList>

          {/* Pending Requests Tab */}
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Wallet Recharge Requests</CardTitle>
                <CardDescription>
                  Review and approve customer wallet recharge requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>موجودی فعلی</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequestsData?.data?.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.requestNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {request.customer?.firstName || 'Unknown'} {request.customer?.lastName || 'Customer'}
                              </div>
                              <div className="text-sm text-gray-500">{request.customer?.email || 'No email'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-blue-600">
                              {customerBalances[request.customerId] !== undefined 
                                ? formatCurrency(customerBalances[request.customerId], 'IQD')
                                : <span className="text-gray-400">Loading...</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(request.amount, request.currency)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{request.paymentMethod}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(request.createdAt)}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(request)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => syncWalletMutation.mutate(request.customerId)}
                                disabled={syncWalletMutation.isPending}
                                title="همگام‌سازی کیف پول این مشتری"
                              >
                                <RefreshCw className={`w-4 h-4 mr-1 ${syncWalletMutation.isPending ? 'animate-spin' : ''}`} />
                                Sync
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleApprove(request)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleReject(request)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {pendingRequestsData?.data?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No pending requests found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Requests Tab */}
          <TabsContent value="all" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Wallet Recharge Requests</CardTitle>
                <CardDescription>
                  Complete history of wallet recharge requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>موجودی فعلی</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRequestsData?.data?.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.requestNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {request.customer?.firstName || 'Unknown'} {request.customer?.lastName || 'Customer'}
                              </div>
                              <div className="text-sm text-gray-500">{request.customer?.email || 'No email'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-blue-600">
                              {customerBalances[request.customerId] !== undefined 
                                ? formatCurrency(customerBalances[request.customerId], 'IQD')
                                : <span className="text-gray-400">Loading...</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(request.amount, request.currency)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{request.paymentMethod}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(request.createdAt)}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(request)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => syncWalletMutation.mutate(request.customerId)}
                                disabled={syncWalletMutation.isPending}
                                title="همگام‌سازی کیف پول این مشتری"
                              >
                                <RefreshCw className={`w-4 h-4 mr-1 ${syncWalletMutation.isPending ? 'animate-spin' : ''}`} />
                                Sync
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {allRequestsData?.data?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No requests found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Holders Tab */}
          <TabsContent value="wallet-holders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.walletManagement}</CardTitle>
                <CardDescription>
                  {t.allWalletHolders}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {holdersLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.customerName}</TableHead>
                        <TableHead>{t.email}</TableHead>
                        <TableHead>{t.currentBalance}</TableHead>
                        <TableHead>{t.lastActivity}</TableHead>
                        <TableHead>{t.status}</TableHead>
                        <TableHead>{t.changeAmount}</TableHead>
                        <TableHead>{t.reason}</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {walletHoldersData?.data?.map((holder) => (
                        <TableRow key={holder.customerId}>
                          <TableCell className="font-medium">{holder.customerName}</TableCell>
                          <TableCell>{holder.customerEmail}</TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">
                              {formatCurrency(holder.balance, 'IQD')}
                            </div>
                          </TableCell>
                          <TableCell>
                            {holder.lastActivityDate 
                              ? formatDate(holder.lastActivityDate.toString())
                              : t.noActivity
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant={holder.isActive ? "default" : "secondary"}>
                              {holder.isActive ? t.active : t.inactive}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder={t.addSubtractAmount}
                              value={inlineModifications[holder.customerId]?.amount || ''}
                              onChange={(e) => updateInlineModification(holder.customerId, 'amount', e.target.value)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder={t.reasonForChange}
                              value={inlineModifications[holder.customerId]?.reason || ''}
                              onChange={(e) => updateInlineModification(holder.customerId, 'reason', e.target.value)}
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => syncWalletMutation.mutate(holder.customerId)}
                                disabled={syncWalletMutation.isPending}
                                title={t.syncWallet}
                              >
                                <RefreshCw className={`w-4 h-4 mr-1 ${syncWalletMutation.isPending ? 'animate-spin' : ''}`} />
                                Sync
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleInlineModification(
                                  holder.customerId,
                                  inlineModifications[holder.customerId]?.amount || '',
                                  inlineModifications[holder.customerId]?.reason || ''
                                )}
                                disabled={
                                  modifyBalanceMutation.isPending ||
                                  !inlineModifications[holder.customerId]?.amount ||
                                  !inlineModifications[holder.customerId]?.reason
                                }
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                {t.apply}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {walletHoldersData?.data?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            {t.noWalletsFound}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Request Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Recharge Request Details</DialogTitle>
              <DialogDescription>
                Complete information about the wallet recharge request
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Request Number</Label>
                    <p className="text-sm text-gray-600">{selectedRequest.requestNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Customer</Label>
                    <p className="text-sm text-gray-600">
                      {selectedRequest.customer?.firstName || 'Unknown'} {selectedRequest.customer?.lastName || 'Customer'}
                    </p>
                    <p className="text-xs text-gray-500">{selectedRequest.customer?.email || 'No email'}</p>
                    <p className="text-xs text-gray-500">{selectedRequest.customer?.phone || 'No phone'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Amount</Label>
                    <p className="text-sm font-semibold text-green-600">
                      {formatCurrency(selectedRequest.amount, selectedRequest.currency)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Payment Method</Label>
                    <p className="text-sm text-gray-600">{selectedRequest.paymentMethod}</p>
                  </div>
                  {selectedRequest.paymentReference && (
                    <div>
                      <Label className="text-sm font-medium">Payment Reference</Label>
                      <p className="text-sm text-gray-600">{selectedRequest.paymentReference}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Created At</Label>
                    <p className="text-sm text-gray-600">{formatDate(selectedRequest.createdAt)}</p>
                  </div>
                  {selectedRequest.approvedAt && (
                    <div>
                      <Label className="text-sm font-medium">Approved At</Label>
                      <p className="text-sm text-gray-600">{formatDate(selectedRequest.approvedAt)}</p>
                    </div>
                  )}
                </div>
                {selectedRequest.customerNotes && (
                  <div>
                    <Label className="text-sm font-medium">Customer Notes</Label>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                      {selectedRequest.customerNotes}
                    </p>
                  </div>
                )}
                {selectedRequest.adminNotes && (
                  <div>
                    <Label className="text-sm font-medium">Admin Notes</Label>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border">
                      {selectedRequest.adminNotes}
                    </p>
                  </div>
                )}
                {selectedRequest.rejectionReason && (
                  <div>
                    <Label className="text-sm font-medium">Rejection Reason</Label>
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded border">
                      {selectedRequest.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approval/Rejection Dialog */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Recharge Request</DialogTitle>
              <DialogDescription>
                Approve or reject the wallet recharge request
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="font-medium">Request: {selectedRequest.requestNumber}</p>
                  <p className="text-sm text-gray-600">
                    {selectedRequest.customer?.firstName || 'Unknown'} {selectedRequest.customer?.lastName || 'Customer'} - {formatCurrency(selectedRequest.amount, selectedRequest.currency)}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this request..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this request is being rejected..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsApprovalDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      if (!rejectionReason.trim()) {
                        toast({ title: "Error", description: "Rejection reason is required", variant: "destructive" });
                        return;
                      }
                      rejectMutation.mutate({
                        requestId: selectedRequest.id,
                        rejectionReason,
                        adminNotes
                      });
                    }}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    className="text-green-600 hover:text-green-700"
                    onClick={() => {
                      approveMutation.mutate({
                        requestId: selectedRequest.id,
                        adminNotes
                      });
                    }}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Wallet Balance Modification Dialog */}
        <Dialog open={isModifyDialogOpen} onOpenChange={setIsModifyDialogOpen}>
          <DialogContent className="sm:max-w-[500px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                تغییر مقدار کیف پول مشتری
              </DialogTitle>
              <DialogDescription>
                می‌توانید مقدار کیف پول مشتری را تغییر دهید. تمام تغییرات در سابقه تراکنش‌ها ثبت می‌شود.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Label htmlFor="customerEmail" className="text-right">آدرس ایمیل مشتری</Label>
                <div className="relative">
                  <Input
                    id="customerEmail"
                    type="email"
                    value={modifyCustomerEmail}
                    onChange={(e) => {
                      setModifyCustomerEmail(e.target.value);
                      setSelectedCustomer(null);
                      setModifyCustomerId(null);
                    }}
                    placeholder="آدرس ایمیل مشتری را وارد کنید (حداقل 3 حرف)"
                    className="text-right pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                
                {/* Customer Search Results Dropdown */}
                {showCustomerDropdown && customerSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {customerSearchResults.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {customer.firstName} {customer.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            ایمیل: {customer.email}
                          </div>
                          <div className="text-sm text-gray-600">
                            موبایل: {customer.phone}
                          </div>
                          <div className="text-xs text-gray-500">
                            شناسه: {customer.id}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* No Results Message */}
                {showCustomerDropdown && customerSearchResults.length === 0 && modifyCustomerEmail.length >= 3 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 p-3 text-center text-gray-500 text-sm">
                    هیچ مشتری با این ایمیل پیدا نشد
                  </div>
                )}
              </div>

              {/* Selected Customer Display */}
              {selectedCustomer && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="text-right">
                    <div className="font-medium text-green-800">
                      مشتری انتخاب شده: {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                      ایمیل: {selectedCustomer.email} | موبایل: {selectedCustomer.phone}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="modificationType" className="text-right">نوع تغییر</Label>
                <select
                  id="modificationType"
                  value={modificationType}
                  onChange={(e) => setModificationType(e.target.value as 'credit' | 'debit' | 'set_balance')}
                  className="w-full p-2 border border-gray-300 rounded-md text-right"
                >
                  <option value="credit">افزایش موجودی (Credit)</option>
                  <option value="debit">کاهش موجودی (Debit)</option>
                  <option value="set_balance">تنظیم موجودی (Set Balance)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="amount" className="text-right">
                  {modificationType === 'set_balance' ? 'موجودی جدید' : 'مقدار تغییر'} (IQD)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={modifyAmount}
                  onChange={(e) => setModifyAmount(e.target.value)}
                  placeholder="مقدار را وارد کنید"
                  className="text-right"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="reason" className="text-right">علت تغییر</Label>
                <Input
                  id="reason"
                  value={modifyReason}
                  onChange={(e) => setModifyReason(e.target.value)}
                  placeholder="علت تغییر را وارد کنید"
                  className="text-right"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsModifyDialogOpen(false);
                  resetCustomerForm();
                }}
              >
                انصراف
              </Button>
              <Button
                onClick={() => {
                  if (!modifyCustomerId || !selectedCustomer || !modifyAmount || !modifyReason) {
                    toast({
                      title: "خطا",
                      description: "لطفاً مشتری را انتخاب کنید و تمام فیلدها را پر کنید",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  modifyBalanceMutation.mutate({
                    customerId: modifyCustomerId,
                    amount: modifyAmount,
                    reason: modifyReason,
                    modificationType: modificationType
                  });
                }}
                disabled={modifyBalanceMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {modifyBalanceMutation.isPending ? "در حال پردازش..." : "تایید تغییر"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
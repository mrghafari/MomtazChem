import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Search, Plus, Users, TrendingUp, DollarSign, ShoppingCart, Eye, Edit, Activity, Trash2, Download, FileText, UserCog, ArrowUpDown, ArrowUp, ArrowDown, Shield, Settings, MessageCircle, Mail } from "lucide-react";
import UnifiedCustomerProfile from "@/components/unified-customer-profile";
import { PasswordManagement } from "@/components/PasswordManagement";
import { apiRequest } from "@/lib/queryClient";

interface CrmCustomer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  secondaryAddress?: string;
  postalCode?: string;
  customerType: string;
  customerStatus: string;
  customerSource: string;
  preferredLanguage: string;
  communicationPreference: string;
  totalOrdersCount: number;
  totalSpent: string;
  averageOrderValue: string;
  lastOrderDate?: string;
  createdAt: string;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
}

interface CustomerActivity {
  id: number;
  activityType: string;
  description: string;
  performedBy: string;
  customerName?: string;
  createdAt: string;
  activityData?: any;
}

interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  totalRevenue: number;
  averageOrderValue: number;
  topCustomers: Array<{
    id: number;
    name: string;
    email: string;
    totalSpent: number;
    totalOrders: number;
  }>;
  customersByType: Array<{
    type: string;
    count: number;
  }>;
  recentActivities: CustomerActivity[];
}

export default function CRM() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CrmCustomer | null>(null);
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);
  const [isCustomerDetailDialogOpen, setIsCustomerDetailDialogOpen] = useState(false);
  const [isEditCustomerDialogOpen, setIsEditCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CrmCustomer | null>(null);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [bulkActionsLoading, setBulkActionsLoading] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
    country: "",
    city: "",
    address: "",
    secondaryAddress: "",
    postalCode: "",
    password: "",
    customerType: "retail",
    customerSource: "website",
    customerStatus: "active",
    preferredLanguage: "fa",
    communicationPreference: "email",
    internalNotes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/crm/dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/crm/dashboard", {
        credentials: 'include',
      });
      const result = await response.json();
      return result.data;
    },
    enabled: isAuthenticated,
  });

  // Fetch customers with search and sorting
  const { data: customers = [], isLoading: customersLoading } = useQuery<CrmCustomer[]>({
    queryKey: ["/api/crm/customers", { search: searchTerm, sortField, sortDirection }],
    queryFn: async () => {
      if (searchTerm.length >= 2) {
        const response = await fetch(`/api/crm/customers/search?q=${encodeURIComponent(searchTerm)}`, {
          credentials: 'include',
        });
        const result = await response.json();
        return result.data || [];
      } else {
        const response = await fetch("/api/crm/customers?limit=50", {
          credentials: 'include',
        });
        const result = await response.json();
        return result.data || [];
      }
    },
    enabled: isAuthenticated,
  });

  // Sort customers locally
  const sortedCustomers = customers.slice().sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case "name":
        aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
        bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
        break;
      case "email":
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case "company":
        aValue = (a.company || "").toLowerCase();
        bValue = (b.company || "").toLowerCase();
        break;
      case "totalSpent":
        aValue = parseFloat(a.totalSpent) || 0;
        bValue = parseFloat(b.totalSpent) || 0;
        break;
      case "totalOrdersCount":
        aValue = a.totalOrdersCount || 0;
        bValue = b.totalOrdersCount || 0;
        break;
      case "createdAt":
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case "customerStatus":
        aValue = a.customerStatus.toLowerCase();
        bValue = b.customerStatus.toLowerCase();
        break;
      default:
        aValue = a.createdAt;
        bValue = b.createdAt;
    }
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Handle sort click
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />;
  };

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const response = await fetch("/api/crm/customers", {
        method: "POST",
        body: JSON.stringify(customerData),
        headers: { "Content-Type": "application/json" },
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.message || "Failed to create customer");
        (error as any).response = { data: errorData };
        throw error;
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "New customer created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard"] });
      setIsNewCustomerDialogOpen(false);
      setNewCustomer({
        email: "",
        firstName: "",
        lastName: "",
        company: "",
        phone: "",
        country: "",
        city: "",
        address: "",
        secondaryAddress: "",
        postalCode: "",
        password: "",
        customerType: "retail",
        customerSource: "website",
        customerStatus: "active",
        internalNotes: ""
      });
    },
    onError: (error: any) => {
      // Extract error message from response
      const errorMessage = error?.response?.data?.message || error?.message || "خطا در ایجاد مشتری جدید";
      
      toast({ 
        title: "خطا", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/crm/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.message || "Failed to update customer");
        (error as any).response = { data: errorData };
        throw error;
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer information updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard"] });
      setIsEditCustomerDialogOpen(false);
      setEditingCustomer(null);
    },
    onError: (error: any) => {
      // Extract error message from response
      const errorMessage = error?.response?.data?.message || error?.message || "خطا در به‌روزرسانی اطلاعات مشتری";
      
      toast({ 
        title: "خطا", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/crm/customers/${id}`, {
        method: "DELETE",
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to delete customer");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/dashboard"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to delete customer",
        variant: "destructive" 
      });
    }
  });

  const handleCreateCustomer = () => {
    if (!newCustomer.email || !newCustomer.firstName || !newCustomer.lastName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    createCustomerMutation.mutate(newCustomer);
  };

  const handleEditCustomer = (customer: CrmCustomer) => {
    console.log("Loading customer for edit:", customer);
    console.log("Customer secondaryAddress from database:", customer.secondaryAddress);
    setEditingCustomer(customer);
    setIsEditCustomerDialogOpen(true);
  };

  const handleUpdateCustomer = () => {
    if (!editingCustomer || !editingCustomer.firstName || !editingCustomer.lastName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    console.log("Frontend editingCustomer secondaryAddress value:", editingCustomer.secondaryAddress);

    // Only send editable fields, exclude email and phone as they are read-only
    // Include all fields even if they are null/undefined to ensure they get updated
    const updateData = {
      firstName: editingCustomer.firstName,
      lastName: editingCustomer.lastName,
      company: editingCustomer.company || null,
      country: editingCustomer.country,
      city: editingCustomer.city,
      address: editingCustomer.address,
      secondaryAddress: editingCustomer.secondaryAddress || null,
      postalCode: editingCustomer.postalCode || null,
      customerType: editingCustomer.customerType,
      customerStatus: editingCustomer.customerStatus,
      customerSource: editingCustomer.customerSource,
    };

    console.log("Frontend updateData being sent:", updateData);
    updateCustomerMutation.mutate({ id: editingCustomer.id, data: updateData });
  };

  const handleDeleteCustomer = (id: number) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteCustomerMutation.mutate(id);
    }
  };

  const handleBulkToggleVerification = async (type: 'sms' | 'email', enabled: boolean) => {
    setBulkActionsLoading(true);
    try {
      const response = await fetch('/api/crm/customers/bulk-toggle-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type,
          enabled
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update verification settings');
      }

      // Refresh customers data
      await queryClient.invalidateQueries({ queryKey: ["/api/crm/customers"] });

      const actionText = enabled ? 'فعال' : 'غیرفعال';
      const typeText = type === 'sms' ? 'SMS' : 'ایمیل';
      
      toast({
        title: "موفقیت",
        description: `ارسال کد تایید ${typeText} برای ${result.updatedCount} مشتری ${actionText} شد`,
      });
    } catch (error) {
      console.error('Error bulk toggling verification:', error);
      toast({
        title: "خطا",
        description: error instanceof Error ? error.message : "خطا در تغییر تنظیمات",
        variant: "destructive"
      });
    } finally {
      setBulkActionsLoading(false);
    }
  };

  const handleExportAnalytics = async () => {
    try {
      const response = await fetch('/api/crm/analytics/export-pdf', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customer-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Customer analytics PDF downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export analytics to PDF",
        variant: "destructive"
      });
    }
  };

  const handleExportCustomer = async (customerId: number) => {
    try {
      const response = await fetch(`/api/crm/customers/${customerId}/export-pdf`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate customer PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customer-report-${customerId}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Customer report PDF downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export customer report to PDF",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: string | number, currency: string = 'IQD') => {
    const validCurrencies = ['USD', 'EUR', 'IQD'];
    const currencyCode = validCurrencies.includes(currency) ? currency : 'IQD';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(num);
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'blacklisted': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'retail': return 'bg-blue-100 text-blue-800';
      case 'wholesale': return 'bg-orange-100 text-orange-800';
      case 'b2b': return 'bg-green-100 text-green-800';
      case 'distributor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              CRM Dashboard
            </h1>
            <p className="text-lg text-blue-600 mt-1">
              Customer Relationship Management System
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => handleExportAnalytics()}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Analytics
          </Button>
          <Button onClick={() => setIsNewCustomerDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Customer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {statsLoading ? (
            <div className="text-center py-8">Loading statistics...</div>
          ) : (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats?.totalCustomers || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats?.activeCustomers || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats?.newCustomersThisMonth || 0}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Customers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Customers</CardTitle>
                  <CardDescription>Customers with highest purchase amounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Total Spent</TableHead>
                        <TableHead>Orders</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardStats?.topCustomers?.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
                          <TableCell>{customer.totalOrders}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, company, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Bulk SMS & Email Settings */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                تنظیمات کلی ارسال کد تایید
              </CardTitle>
              <CardDescription>
                فعال/غیرفعال کردن ارسال کد تایید ثبت‌نام اولیه برای همه مشتریان
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => handleBulkToggleVerification('sms', true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  disabled={bulkActionsLoading}
                >
                  <MessageCircle className="h-4 w-4" />
                  فعال کردن SMS برای همه
                </Button>
                
                <Button
                  onClick={() => handleBulkToggleVerification('sms', false)}
                  variant="outline"
                  className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50"
                  disabled={bulkActionsLoading}
                >
                  <MessageCircle className="h-4 w-4" />
                  غیرفعال کردن SMS برای همه
                </Button>
                
                <Button
                  onClick={() => handleBulkToggleVerification('email', true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  disabled={bulkActionsLoading}
                >
                  <Mail className="h-4 w-4" />
                  فعال کردن ایمیل برای همه
                </Button>
                
                <Button
                  onClick={() => handleBulkToggleVerification('email', false)}
                  variant="outline"
                  className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50"
                  disabled={bulkActionsLoading}
                >
                  <Mail className="h-4 w-4" />
                  غیرفعال کردن ایمیل برای همه
                </Button>
                
                {bulkActionsLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    در حال پردازش...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>Manage store customer information</CardDescription>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none py-2 px-3"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-2">
                          Name
                          {getSortIcon("name")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none py-2 px-3"
                        onClick={() => handleSort("email")}
                      >
                        <div className="flex items-center gap-2">
                          Email
                          {getSortIcon("email")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none py-2 px-3"
                        onClick={() => handleSort("company")}
                      >
                        <div className="flex items-center gap-2">
                          Company
                          {getSortIcon("company")}
                        </div>
                      </TableHead>
                      <TableHead className="py-2 px-3">Type</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none py-2 px-3"
                        onClick={() => handleSort("customerStatus")}
                      >
                        <div className="flex items-center gap-2">
                          Status
                          {getSortIcon("customerStatus")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none py-2 px-3"
                        onClick={() => handleSort("totalSpent")}
                      >
                        <div className="flex items-center gap-2">
                          Total Purchases
                          {getSortIcon("totalSpent")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none py-2 px-3"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center gap-2">
                          Registration Date
                          {getSortIcon("createdAt")}
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[140px] py-2 px-3">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCustomers.map((customer) => (
                      <TableRow key={customer.id} className="h-12">
                        <TableCell className="font-medium py-2 px-3">
                          <div className="truncate max-w-[120px]">
                            {customer.firstName} {customer.lastName}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="truncate max-w-[150px]">
                            {customer.email}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="truncate max-w-[100px]">
                            {customer.company || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Badge className={`${getTypeBadgeColor(customer.customerType)} text-xs px-2 py-1`}>
                            {customer.customerType}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Badge className={`${getStatusBadgeColor(customer.customerStatus)} text-xs px-2 py-1`}>
                            {customer.customerStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="truncate max-w-[100px]">
                            {formatCurrency(customer.totalSpent)}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="truncate max-w-[100px] text-sm">
                            {formatDate(customer.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[140px] py-2 px-3">
                          <div className="flex items-center gap-1 justify-start">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCustomer(customer)}
                              title="Edit customer"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setIsCustomerDetailDialogOpen(true);
                              }}
                              title="Manage customer password"
                              className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                            >
                              <Shield className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportCustomer(customer.id)}
                              title="Export customer report to PDF"
                              className="h-8 w-8 p-0"
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                              title="Delete customer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest CRM system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardStats?.recentActivities?.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.customerName && (
                          <span className="font-medium text-blue-600">{activity.customerName} - </span>
                        )}
                        By {activity.performedBy} on {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Customer Dialog */}
      <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
            <DialogDescription>Enter new customer information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newCustomer.firstName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newCustomer.lastName}
                  onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={newCustomer.company}
                onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="phone">Mobile Phone *</Label>
              <Input
                id="phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerType">Customer Type</Label>
                <Select value={newCustomer.customerType} onValueChange={(value) => setNewCustomer({ ...newCustomer, customerType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="b2b">B2B</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="customerSource">Customer Source</Label>
                <Select value={newCustomer.customerSource} onValueChange={(value) => setNewCustomer({ ...newCustomer, customerSource: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                    <SelectItem value="trade_show">Trade Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferredLanguage">Preferred Language</Label>
                <Select value={newCustomer.preferredLanguage} onValueChange={(value) => setNewCustomer({ ...newCustomer, preferredLanguage: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fa">فارسی (Persian)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية (Arabic)</SelectItem>
                    <SelectItem value="ku">کوردی (Kurdish)</SelectItem>
                    <SelectItem value="tr">Türkçe (Turkish)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="communicationPreference">Communication Preference</Label>
                <Select value={newCustomer.communicationPreference} onValueChange={(value) => setNewCustomer({ ...newCustomer, communicationPreference: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  required
                  placeholder="Customer's country"
                  value={newCustomer.country}
                  onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  required
                  placeholder="Customer's city"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                required
                placeholder="Full address"
                value={newCustomer.address || ""}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="secondaryAddress">Secondary Address</Label>
                <Input
                  id="secondaryAddress"
                  placeholder="Optional secondary address"
                  value={newCustomer.secondaryAddress || ""}
                  onChange={(e) => setNewCustomer({ ...newCustomer, secondaryAddress: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  placeholder="Postal code"
                  value={newCustomer.postalCode || ""}
                  onChange={(e) => setNewCustomer({ ...newCustomer, postalCode: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password (Optional)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Leave empty if creating from admin"
                value={newCustomer.password || ""}
                onChange={(e) => setNewCustomer({ ...newCustomer, password: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="internalNotes">Internal Notes</Label>
              <Textarea
                id="internalNotes"
                value={newCustomer.internalNotes}
                onChange={(e) => setNewCustomer({ ...newCustomer, internalNotes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsNewCustomerDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCustomer} disabled={createCustomerMutation.isPending}>
                {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Dialog */}
      <Dialog open={isCustomerDetailDialogOpen} onOpenChange={setIsCustomerDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>Complete customer information and management</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Customer Details</TabsTrigger>
                <TabsTrigger value="password">Password Management</TabsTrigger>
                <TabsTrigger value="profile">Unified Profile</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <p className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <Label>Company</Label>
                    <p className="font-medium">{selectedCustomer.company || '-'}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="font-medium">{selectedCustomer.phone || '-'}</p>
                  </div>
                  <div>
                    <Label>Total Purchases</Label>
                    <p className="font-medium">{formatCurrency(selectedCustomer.totalSpent)}</p>
                  </div>
                  <div>
                    <Label>Number of Orders</Label>
                    <p className="font-medium">{selectedCustomer.totalOrdersCount}</p>
                  </div>
                  <div>
                    <Label>Average Order Value</Label>
                    <p className="font-medium">{formatCurrency(selectedCustomer.averageOrderValue)}</p>
                  </div>
                  <div>
                    <Label>Join Date</Label>
                    <p className="font-medium">{formatDate(selectedCustomer.createdAt)}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="password" className="space-y-4">
                <PasswordManagement
                  customerId={selectedCustomer.id}
                  customerEmail={selectedCustomer.email}
                  customerName={`${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
                  customerPhone={selectedCustomer.phone}
                />
              </TabsContent>
              
              <TabsContent value="profile" className="space-y-4">
                <UnifiedCustomerProfile customerId={selectedCustomer.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditCustomerDialogOpen} onOpenChange={setIsEditCustomerDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Edit customer information</DialogDescription>
          </DialogHeader>
          {editingCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={editingCustomer.firstName}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={editingCustomer.lastName}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, lastName: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="editEmail">Email (Read Only)</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingCustomer.email}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <Label htmlFor="editCompany">Company</Label>
                <Input
                  id="editCompany"
                  value={editingCustomer.company || ""}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, company: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="editPhone">Phone (Read Only)</Label>
                <Input
                  id="editPhone"
                  value={editingCustomer.phone || ""}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editCountry">Country</Label>
                  <Input
                    id="editCountry"
                    value={editingCustomer.country || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, country: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editCity">City</Label>
                  <Input
                    id="editCity"
                    value={editingCustomer.city || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editAddress">Address</Label>
                <Input
                  id="editAddress"
                  value={editingCustomer.address || ""}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editSecondaryAddress">Secondary Address</Label>
                  <Input
                    id="editSecondaryAddress"
                    value={editingCustomer.secondaryAddress || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, secondaryAddress: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editPostalCode">Postal Code</Label>
                  <Input
                    id="editPostalCode"
                    value={editingCustomer.postalCode || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, postalCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editCustomerType">Customer Type</Label>
                  <Select value={editingCustomer.customerType} onValueChange={(value) => setEditingCustomer({ ...editingCustomer, customerType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                      <SelectItem value="b2b">B2B</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editCustomerStatus">Status</Label>
                  <Select value={editingCustomer.customerStatus} onValueChange={(value) => setEditingCustomer({ ...editingCustomer, customerStatus: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="blacklisted">Blacklisted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Authentication Settings */}
              <div className="border-t pt-4">
                <Label className="text-lg font-semibold">Authentication Settings</Label>
                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="sms-auth" className="font-medium">SMS Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable SMS verification for this customer
                      </p>
                    </div>
                    <Switch
                      id="sms-auth"
                      checked={editingCustomer.smsEnabled ?? true}
                      onCheckedChange={(checked) => setEditingCustomer({ ...editingCustomer, smsEnabled: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="email-auth" className="font-medium">Email Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable email verification for this customer
                      </p>
                    </div>
                    <Switch
                      id="email-auth"
                      checked={editingCustomer.emailEnabled ?? true}
                      onCheckedChange={(checked) => setEditingCustomer({ ...editingCustomer, emailEnabled: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditCustomerDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateCustomer}
                  disabled={updateCustomerMutation.isPending}
                >
                  {updateCustomerMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
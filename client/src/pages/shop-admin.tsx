import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Eye, 
  Edit, 
  Truck,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Percent,
  Calculator,
  TrendingDown,
  RefreshCw,
  BarChart3,
  CreditCard,
  FileText,
  User,
  Receipt,
  Building,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ShopProduct, Customer, Order } from "@shared/shop-schema";
import SalesReport from "@/pages/sales-report";

// Invoice Management Component
const InvoiceManagementTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showOfficialForm, setShowOfficialForm] = useState(false);
  const [officialData, setOfficialData] = useState({
    companyInfo: '',
    taxInfo: ''
  });

  // Fetch all invoices
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['/api/invoices'],
  });

  // Fetch invoice statistics
  const { data: statsData } = useQuery({
    queryKey: ['/api/invoices/stats'],
  });

  // Process official invoice mutation
  const processOfficialMutation = useMutation({
    mutationFn: async ({ invoiceId, companyInfo, taxInfo }: { invoiceId: number; companyInfo: any; taxInfo: any }) => {
      return apiRequest(`/api/invoices/${invoiceId}/process-official`, {
        method: 'POST',
        body: JSON.stringify({ companyInfo, taxInfo }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Official invoice processed",
        description: "Official invoice has been processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      setShowOfficialForm(false);
      setSelectedInvoice(null);
    },
    onError: () => {
      toast({
        title: "Error processing official invoice",
        description: "Failed to process official invoice",
        variant: "destructive",
      });
    },
  });

  // Mark invoice as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      return apiRequest(`/api/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
        body: JSON.stringify({ paymentDate: new Date().toISOString() }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Invoice marked as paid",
        description: "Invoice status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    },
    onError: () => {
      toast({
        title: "Error updating invoice",
        description: "Failed to mark invoice as paid",
        variant: "destructive",
      });
    },
  });

  // Download invoice PDF function
  const handleDownloadInvoice = async (invoice: any) => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait...",
      });

      const response = await fetch(`/api/invoices/${invoice.id}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download successful",
        description: "Invoice PDF downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Download failed",
        description: "Could not download invoice PDF",
        variant: "destructive"
      });
    }
  };

  const handleProcessOfficial = () => {
    if (!selectedInvoice) return;
    
    try {
      const companyInfo = JSON.parse(officialData.companyInfo || '{}');
      const taxInfo = JSON.parse(officialData.taxInfo || '{}');
      
      processOfficialMutation.mutate({
        invoiceId: selectedInvoice.id,
        companyInfo,
        taxInfo
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your company info and tax info format",
        variant: "destructive",
      });
    }
  };

  const invoices = invoicesData?.data || [];
  const stats = statsData?.data || {
    totalInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    officialInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  if (invoicesLoading) {
    return (
      <Card>
        <CardContent className="text-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading invoices...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invoice Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
                <p className="text-2xl font-bold text-green-600">{stats.paidInvoices}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Official Invoices</p>
                <p className="text-2xl font-bold text-purple-600">{stats.officialInvoices}</p>
              </div>
              <Building className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Invoice #</th>
                  <th className="text-left p-3 font-semibold">Order ID</th>
                  <th className="text-left p-3 font-semibold">Customer ID</th>
                  <th className="text-left p-3 font-semibold">Amount</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Type</th>
                  <th className="text-left p-3 font-semibold">Created</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice: any) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{invoice.invoiceNumber}</td>
                    <td className="p-3">{invoice.orderId}</td>
                    <td className="p-3">{invoice.customerId}</td>
                    <td className="p-3 font-semibold text-green-600">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="p-3">
                      <Badge variant={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={invoice.isOfficial ? 'default' : 'outline'}>
                          {invoice.isOfficial ? 'Official' : 'Standard'}
                        </Badge>
                        {invoice.officialRequestedAt && !invoice.isOfficial && (
                          <Clock className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadInvoice(invoice)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {invoice.status !== 'paid' && (
                          <Button 
                            size="sm" 
                            onClick={() => markPaidMutation.mutate(invoice.id)}
                            disabled={markPaidMutation.isPending}
                          >
                            Mark Paid
                          </Button>
                        )}
                        {invoice.officialRequestedAt && !invoice.isOfficial && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowOfficialForm(true);
                            }}
                          >
                            <Building className="w-4 h-4 mr-1" />
                            Process Official
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Official Invoice Processing Modal */}
      {showOfficialForm && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Process Official Invoice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyInfo">Company Information (JSON)</Label>
                <textarea
                  id="companyInfo"
                  className="w-full h-32 p-3 border rounded-md"
                  placeholder='{"name": "Company Name", "address": "Address", "taxId": "123456"}'
                  value={officialData.companyInfo}
                  onChange={(e) => setOfficialData(prev => ({ ...prev, companyInfo: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="taxInfo">Tax Information (JSON)</Label>
                <textarea
                  id="taxInfo"
                  className="w-full h-32 p-3 border rounded-md"
                  placeholder='{"rate": 0.1, "type": "VAT"}'
                  value={officialData.taxInfo}
                  onChange={(e) => setOfficialData(prev => ({ ...prev, taxInfo: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleProcessOfficial}
                  disabled={processOfficialMutation.isPending}
                  className="flex-1"
                >
                  {processOfficialMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Building className="w-4 h-4 mr-2" />
                  )}
                  Process Official Invoice
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowOfficialForm(false);
                    setSelectedInvoice(null);
                    setOfficialData({ companyInfo: '', taxInfo: '' });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Discount Form Component
const DiscountForm = ({ discount, products, onSave, onCancel }: {
  discount?: any;
  products: ShopProduct[];
  onSave: (data: any) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: discount?.name || "",
    discountPercentage: discount?.discountPercentage || "",
    minQuantity: discount?.minQuantity || 1,
    description: discount?.description || "",
    isActive: discount?.isActive ?? true,
    applyToAllProducts: discount?.applyToAllProducts ?? true,
    applicableProducts: discount?.applicableProducts || [],
  });

  const handleProductSelection = (productId: number, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        applicableProducts: [...prev.applicableProducts, productId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        applicableProducts: prev.applicableProducts.filter((id: number) => id !== productId)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Discount Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Bulk Discount 10+"
            required
          />
        </div>
        <div>
          <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
          <Input
            id="discountPercentage"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.discountPercentage}
            onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minQuantity">Minimum Quantity</Label>
          <Input
            id="minQuantity"
            type="number"
            min="1"
            value={formData.minQuantity}
            onChange={(e) => setFormData(prev => ({ ...prev, minQuantity: parseInt(e.target.value) }))}
            required
          />
        </div>
        <div className="flex items-center space-x-2 mt-6">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of this discount"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="applyToAllProducts"
            checked={formData.applyToAllProducts}
            onCheckedChange={(checked) => {
              setFormData(prev => ({ 
                ...prev, 
                applyToAllProducts: !!checked,
                applicableProducts: !!checked ? [] : prev.applicableProducts
              }));
            }}
          />
          <Label htmlFor="applyToAllProducts">Apply to all products</Label>
        </div>

        {!formData.applyToAllProducts && (
          <div>
            <Label>Select Products for Discount</Label>
            <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg p-4">
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={formData.applicableProducts.includes(product.id)}
                      onCheckedChange={(checked) => handleProductSelection(product.id, !!checked)}
                    />
                    <Label htmlFor={`product-${product.id}`} className="flex-1 cursor-pointer">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {product.sku} - ${product.price}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {formData.applicableProducts.length > 0 && (
              <div className="mt-2 text-sm text-blue-600">
                {formData.applicableProducts.length} product(s) selected
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {discount ? "Update Discount" : "Create Discount"}
        </Button>
      </div>
    </form>
  );
};

const ShopAdmin = () => {
  // All hooks must be declared at the top before any conditional logic
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // All queries and mutations
  const { data: stats = {} } = useQuery({
    queryKey: ["/api/shop/statistics"],
    enabled: isAuthenticated,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/shop/orders"],
    enabled: isAuthenticated,
  });

  const { data: products = [] } = useQuery<ShopProduct[]>({
    queryKey: ["/api/shop/products"],
    enabled: isAuthenticated,
  });

  const { data: discounts = [] } = useQuery({
    queryKey: ["/api/shop/discounts"],
    enabled: isAuthenticated,
  });

  const { data: accountingStats = {} } = useQuery({
    queryKey: ["/api/shop/accounting-stats"],
    enabled: isAuthenticated,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/shop/financial-transactions"],
    enabled: isAuthenticated,
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: number; updates: any }) => {
      return apiRequest(`/api/shop/orders/${orderId}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/statistics"] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    },
  });

  // Update discount mutation
  const updateDiscountMutation = useMutation({
    mutationFn: async ({ discountId, updates }: { discountId: number; updates: any }) => {
      console.log("Frontend: Updating discount", discountId, "with updates:", updates);
      return apiRequest(`/api/shop/discounts/${discountId}`, "PATCH", updates);
    },
    onSuccess: (data) => {
      console.log("Frontend: Discount update successful:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/shop/discounts"] });
      // Also invalidate shop products to refresh discount information on product cards
      queryClient.invalidateQueries({ queryKey: ["/api/shop/products"] });
      queryClient.invalidateQueries({ queryKey: ["shopSearch"] });
      setIsDiscountDialogOpen(false);
      setEditingDiscount(null);
      toast({
        title: "Discount Updated",
        description: "Discount settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Frontend: Discount update failed:", error);
      toast({
        title: "Update Failed",
        description: `Failed to update discount settings: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Create discount mutation
  const createDiscountMutation = useMutation({
    mutationFn: async (discountData: any) => {
      return apiRequest("/api/shop/discounts", "POST", discountData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/discounts"] });
      // Also invalidate shop products to refresh discount information on product cards
      queryClient.invalidateQueries({ queryKey: ["/api/shop/products"] });
      queryClient.invalidateQueries({ queryKey: ["shopSearch"] });
      setIsDiscountDialogOpen(false);
      toast({
        title: "Discount Created",
        description: "New discount has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create new discount.",
        variant: "destructive",
      });
    },
  });

  // Delete discount mutation
  const deleteDiscountMutation = useMutation({
    mutationFn: async (discountId: number) => {
      return apiRequest(`/api/shop/discounts/${discountId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shop/discounts"] });
      toast({
        title: "Discount Deleted",
        description: "Discount has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete discount.",
        variant: "destructive",
      });
    },
  });

  // Export sales report handler
  const handleExportSalesReport = async () => {
    try {
      const response = await fetch('/api/analytics/sales/export?format=csv', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate sales report');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Sales report exported successfully",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export sales report",
        variant: "destructive",
      });
    }
  };

  // Generate monthly report handler
  const handleGenerateMonthlyReport = async () => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const response = await fetch(`/api/analytics/sales/export?format=json&month=${currentMonth}&year=${currentYear}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate monthly report');
      }

      const data = await response.json();
      
      // Create a formatted report
      const reportContent = `Monthly Sales Report - ${currentMonth}/${currentYear}
      
Total Orders: ${data.summary.totalOrders}
Total Revenue: $${data.summary.totalRevenue.toFixed(2)}
Report Date: ${data.summary.reportDate}

Detailed Sales Data:
${data.data.map((item: any) => 
  `${item.orderDate} - ${item.productName} (Qty: ${item.quantity}) - $${item.itemTotal.toFixed(2)}`
).join('\n')}`;

      // Download as text file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `monthly-report-${currentMonth}-${currentYear}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Monthly report generated successfully",
      });
    } catch (error) {
      console.error('Monthly report error:', error);
      toast({
        title: "Error",
        description: "Failed to generate monthly report",
        variant: "destructive",
      });
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }



  // Filter orders
  const filteredOrders = orders ? orders.filter(order => {
    const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
    const matchesSearch = searchTerm === "" || 
                         order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  }) : [];

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, Shop Manager!
              </h1>
              <p className="text-lg text-blue-600 mt-1">
                Your e-commerce control center is active
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-700">Shop Management</h2>
              <p className="text-gray-600">Manage orders, inventory, and discount settings</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats as any)?.totalOrders || 0}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${(stats as any)?.totalRevenue || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats as any)?.pendingOrders || 0}</p>
                </div>
                <Package className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Shipped Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats as any)?.shippedOrders || 0}</p>
                </div>
                <Truck className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">Orders Management</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
            <TabsTrigger value="discounts">Discount Settings</TabsTrigger>
            <TabsTrigger value="invoices">Invoice Management</TabsTrigger>
            <TabsTrigger value="accounting">Accounting</TabsTrigger>
            <TabsTrigger value="reports">Sales Reports</TabsTrigger>
          </TabsList>

          {/* Orders Management */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Orders</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ordersLoading ? (
                    <div className="text-center py-8">Loading orders...</div>
                  ) : filteredOrders.length > 0 ? (
                    <div className="space-y-3">
                      {filteredOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          {/* Left section: Order details and customer */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">#{order.orderNumber}</h3>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {formatDate(order.createdAt.toString())}
                            </p>
                            {(order as any).customer && (
                              <p className="text-sm text-blue-600">
                                {(order as any).customer.firstName} {(order as any).customer.lastName}
                              </p>
                            )}
                          </div>

                          {/* Center section: Payment and shipping */}
                          <div className="flex-1 text-center">
                            {(order as any).paymentMethod && (
                              <p className="text-sm text-purple-600 font-medium mb-1">
                                {(order as any).paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 
                                 (order as any).paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' :
                                 (order as any).paymentMethod === 'company_credit' ? 'Company Credit' : (order as any).paymentMethod}
                              </p>
                            )}
                            {(order as any).carrier && (
                              <p className="text-sm text-green-600 font-medium">
                                {(order as any).carrier}
                              </p>
                            )}
                          </div>

                          {/* Right section: Amount and actions */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold text-lg">${order.totalAmount}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Select
                                value={order.status}
                                onValueChange={(newStatus) => {
                                  updateOrderMutation.mutate({
                                    orderId: order.id,
                                    updates: { status: newStatus }
                                  });
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No orders found.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Management */}
          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Inventory Management
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/shop/products"] });
                        toast({ title: "Refreshed", description: "Inventory data refreshed" });
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products && products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product: any) => (
                        <Card key={product.id} className="p-4 hover:shadow-md transition-shadow">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold text-gray-900 leading-tight">{product.name}</h3>
                              <Badge variant={product.isActive ? "default" : "secondary"}>
                                {product.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p className="text-gray-600">SKU: <span className="font-medium">{product.sku}</span></p>
                              <p className="text-gray-600">
                                Stock: <span className={`font-medium ${
                                  product.stockQuantity <= 10 ? 'text-red-600' : 
                                  product.stockQuantity <= 50 ? 'text-orange-600' : 
                                  'text-green-600'
                                }`}>
                                  {product.stockQuantity}
                                </span>
                              </p>
                              <p className="text-gray-600">Price: <span className="font-medium text-green-600">${product.price}</span></p>
                              {product.category && (
                                <p className="text-gray-600">Category: <span className="font-medium">{product.category}</span></p>
                              )}
                            </div>
                            {product.stockQuantity <= 10 && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-xs text-red-600 font-medium">Low Stock Alert</p>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No products found</p>
                      <p className="text-gray-400 text-sm">Add products to manage inventory</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discount Settings */}
          <TabsContent value="discounts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="w-5 h-5" />
                    Discount Settings
                  </CardTitle>
                  <Button 
                    onClick={() => {
                      setEditingDiscount(null);
                      setIsDiscountDialogOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Discount
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(discounts) && discounts.length > 0 ? (
                    <div className="space-y-3">
                      {discounts.map((discount: any) => (
                        <div key={discount.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{discount.name}</h3>
                              <Badge variant={discount.isActive ? "default" : "secondary"}>
                                {discount.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {discount.discountPercentage}% off for {discount.minQuantity}+ items
                            </div>
                            {discount.description && (
                              <div className="text-sm text-gray-500 mt-1">
                                {discount.description}
                              </div>
                            )}
                            {discount.applicableProducts && discount.applicableProducts.length > 0 && (
                              <div className="text-sm text-blue-600 mt-1">
                                Applied to {discount.applicableProducts.length} selected products
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingDiscount(discount);
                                setIsDiscountDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete the discount "${discount.name}"?`)) {
                                  deleteDiscountMutation.mutate(discount.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No discount rules found. Click "Add Discount" to create your first discount.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Discount Edit/Create Dialog */}
            <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingDiscount ? "Edit Discount" : "Create New Discount"}
                  </DialogTitle>
                </DialogHeader>
                <DiscountForm
                  discount={editingDiscount}
                  products={products}
                  onSave={(discountData: any) => {
                    if (editingDiscount) {
                      updateDiscountMutation.mutate({
                        discountId: editingDiscount.id,
                        updates: discountData
                      });
                    } else {
                      createDiscountMutation.mutate(discountData);
                    }
                  }}
                  onCancel={() => {
                    setIsDiscountDialogOpen(false);
                    setEditingDiscount(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Accounting Dashboard */}
          <TabsContent value="accounting">
            <div className="space-y-6">
              {/* Accounting Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${(accountingStats as any)?.todaySales || 0}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Today's Returns</p>
                        <p className="text-2xl font-bold text-red-600">
                          ${(accountingStats as any)?.todayReturns || 0}
                        </p>
                      </div>
                      <TrendingDown className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${(accountingStats as any)?.monthlyRevenue || 0}
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Net Profit</p>
                        <p className="text-2xl font-bold text-purple-600">
                          ${(accountingStats as any)?.netProfit || 0}
                        </p>
                      </div>
                      <Calculator className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Financial Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray(transactions) && transactions.length > 0 ? (
                      <div className="space-y-3">
                        {transactions.slice(0, 10).map((transaction: any) => (
                          <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className={`w-3 h-3 rounded-full ${
                                transaction.type === 'sale' ? 'bg-green-500' :
                                transaction.type === 'refund' ? 'bg-red-500' :
                                transaction.type === 'return' ? 'bg-orange-500' :
                                'bg-gray-500'
                              }`} />
                              <div>
                                <h4 className="font-semibold">{transaction.description}</h4>
                                <p className="text-sm text-gray-600">
                                  {new Date(transaction.processingDate).toLocaleDateString('fa-IR')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${
                                transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'sale' ? '+' : '-'}${transaction.amount}
                              </p>
                              <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No financial transactions found. Transactions will appear here after orders are processed.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      className="flex items-center gap-2" 
                      variant="outline"
                      onClick={handleExportSalesReport}
                    >
                      <Download className="w-4 h-4" />
                      Export Sales Report
                    </Button>
                    <Button 
                      className="flex items-center gap-2" 
                      variant="outline"
                      onClick={handleGenerateMonthlyReport}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Generate Monthly Report
                    </Button>
                    <Button 
                      className="flex items-center gap-2" 
                      variant="outline"
                      onClick={() => setLocation("/analytics/sales")}
                    >
                      <BarChart3 className="w-4 h-4" />
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Invoice Management */}
          <TabsContent value="invoices">
            <InvoiceManagementTab />
          </TabsContent>

          {/* Sales Reports */}
          <TabsContent value="reports">
            <SalesReport />
          </TabsContent>
        </Tabs>

        {/* Order Details Dialog */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Order Details - #{selectedOrder.orderNumber}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">
                        {selectedOrder.customer?.firstName || 'N/A'} {selectedOrder.customer?.lastName || ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedOrder.customer?.email || 'N/A'}</p>
                    </div>
                    {selectedOrder.customer?.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{selectedOrder.customer.phone}</p>
                      </div>
                    )}
                    {selectedOrder.customer?.company && (
                      <div>
                        <p className="text-sm text-gray-600">Company</p>
                        <p className="font-medium">{selectedOrder.customer.company}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Order Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-bold text-lg text-green-600">${selectedOrder.totalAmount}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Order Items ({selectedOrder.items?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.productName || 'Product Name'}</p>
                            <p className="text-sm text-gray-600">SKU: {item.productSku || 'N/A'}</p>
                            <p className="text-sm text-blue-600">Unit Price: ${item.price || 0}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">Qty: {item.quantity || 1}</p>
                            <p className="text-lg font-bold text-green-600">
                              ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No items found for this order</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Information */}
                {(selectedOrder.shippingAddress || selectedOrder.shippingCity) && (
                  <div className="border rounded-lg p-4 bg-orange-50">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Shipping Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedOrder.shippingAddress && (
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium">{selectedOrder.shippingAddress}</p>
                        </div>
                      )}
                      {selectedOrder.shippingCity && (
                        <div>
                          <p className="text-sm text-gray-600">City</p>
                          <p className="font-medium">{selectedOrder.shippingCity}</p>
                        </div>
                      )}
                      {selectedOrder.shippingCountry && (
                        <div>
                          <p className="text-sm text-gray-600">Country</p>
                          <p className="font-medium">{selectedOrder.shippingCountry}</p>
                        </div>
                      )}
                      {selectedOrder.postalCode && (
                        <div>
                          <p className="text-sm text-gray-600">Postal Code</p>
                          <p className="font-medium">{selectedOrder.postalCode}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                <div className="border rounded-lg p-4 bg-purple-50">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-medium">
                        {selectedOrder.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 
                         selectedOrder.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' :
                         selectedOrder.paymentMethod === 'company_credit' ? 'Company Credit' : 
                         selectedOrder.paymentMethod || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <Badge variant={selectedOrder.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                        {selectedOrder.paymentStatus || 'pending'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="border rounded-lg p-4 bg-yellow-50">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Order Notes
                    </h3>
                    <p className="text-gray-700 bg-white p-3 rounded border">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default ShopAdmin;
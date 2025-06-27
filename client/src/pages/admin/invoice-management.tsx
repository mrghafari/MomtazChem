import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Plus,
  Filter
} from 'lucide-react';

interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId: number;
  customerId: number;
  status: string;
  type: string;
  isOfficial: boolean;
  totalAmount: string;
  currency: string;
  officialRequestedAt?: string;
  officialProcessedAt?: string;
  createdAt: string;
}

interface InvoiceStats {
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  officialInvoices: number;
  totalAmount: number;
  paidAmount: number;
}

export default function InvoiceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
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
    mutationFn: async ({ invoiceId, companyInfo, taxInfo }: {
      invoiceId: number;
      companyInfo: any;
      taxInfo: any;
    }) => {
      return apiRequest(`/api/invoices/${invoiceId}/process-official`, {
        method: 'POST',
        body: JSON.stringify({ companyInfo, taxInfo }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Official invoice processed",
        description: "Official invoice has been generated successfully",
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

  const invoices: Invoice[] = invoicesData?.data || [];
  const stats: InvoiceStats = statsData?.data || {
    totalInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    officialInvoices: 0,
    totalAmount: 0,
    paidAmount: 0
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US').format(num) + ' IQD';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'sent': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
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

  if (invoicesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading invoices...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Invoice Management</h1>
        <p className="text-gray-600">Manage customer invoices and official invoice requests</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalInvoices}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.paidInvoices}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Official Invoices</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.officialInvoices}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
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
                {invoices.map((invoice) => (
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
                        <Button size="sm" variant="outline">
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
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Process Official Invoice</CardTitle>
              <p className="text-sm text-gray-600">
                Invoice: {selectedInvoice.invoiceNumber}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyInfo">Company Information (JSON)</Label>
                <Textarea
                  id="companyInfo"
                  placeholder='{"name": "Company Name", "address": "Address", "phone": "Phone"}'
                  value={officialData.companyInfo}
                  onChange={(e) => setOfficialData(prev => ({
                    ...prev,
                    companyInfo: e.target.value
                  }))}
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="taxInfo">Tax Information (JSON)</Label>
                <Textarea
                  id="taxInfo"
                  placeholder='{"taxId": "Tax ID", "registrationNumber": "Registration Number"}'
                  value={officialData.taxInfo}
                  onChange={(e) => setOfficialData(prev => ({
                    ...prev,
                    taxInfo: e.target.value
                  }))}
                  rows={4}
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
}
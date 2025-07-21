import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, FileText, Calculator, Download, Edit, Trash2, Eye, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface Invoice {
  id: number;
  customer_name: string;
  date: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface NewInvoice {
  customer_name: string;
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'total'>[];
}

export default function AccountingManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState<NewInvoice>({
    customer_name: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }]
  });

  // Check if user has access to accounting module
  if (!user || user.roleId !== 1) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">دسترسی غیرمجاز</CardTitle>
            <CardDescription>
              شما مجوز دسترسی به ماژول حسابداری را ندارید.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Fetch invoices
  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['/api/accounting/invoices'],
    queryFn: async () => {
      const response = await fetch('/api/accounting/invoices');
      if (!response.ok) throw new Error('Failed to fetch invoices');
      return response.json();
    }
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: NewInvoice) => {
      const response = await apiRequest('/api/accounting/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "فاکتور جدید ایجاد شد",
        description: "فاکتور با موفقیت در سیستم حسابداری ثبت شد.",
      });
      setIsCreateDialogOpen(false);
      setNewInvoice({
        customer_name: '',
        items: [{ description: '', quantity: 1, unit_price: 0 }]
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ایجاد فاکتور",
        description: error.message || "خطای غیرمنتظره‌ای رخ داد.",
        variant: "destructive",
      });
    }
  });

  const addInvoiceItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeInvoiceItem = (index: number) => {
    if (newInvoice.items.length > 1) {
      setNewInvoice(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotal = () => {
    return newInvoice.items.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      draft: { label: 'پیش‌نویس', className: 'bg-gray-100 text-gray-800' },
      sent: { label: 'ارسال شده', className: 'bg-blue-100 text-blue-800' },
      paid: { label: 'پرداخت شده', className: 'bg-green-100 text-green-800' },
      overdue: { label: 'معوقه', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/admin/site-management')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            بازگشت به مدیریت سایت
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">مدیریت حسابداری</h1>
            <p className="text-gray-600">مدیریت فاکتورها و حسابداری کسب‌وکار</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              فاکتور جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ایجاد فاکتور جدید</DialogTitle>
              <DialogDescription>
                فاکتور جدید برای مشتری ایجاد کنید
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-2">
                <Label htmlFor="customer_name">نام مشتری</Label>
                <Input
                  id="customer_name"
                  value={newInvoice.customer_name}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="نام مشتری را وارد کنید"
                />
              </div>

              {/* Invoice Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>آیتم‌های فاکتور</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    افزودن آیتم
                  </Button>
                </div>
                
                {newInvoice.items.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <Label>شرح کالا/خدمات</Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          placeholder="شرح آیتم"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>تعداد</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>قیمت واحد (دینار)</Label>
                        <div className="flex">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateInvoiceItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="mt-1"
                          />
                          {newInvoice.items.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeInvoiceItem(index)}
                              className="mt-1 mr-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-sm text-gray-600">
                        جمع: {(item.quantity * item.unit_price).toLocaleString('fa-IR')} دینار
                      </span>
                    </div>
                  </Card>
                ))}

                {/* Total */}
                <div className="flex justify-end">
                  <Card className="p-4 bg-blue-50">
                    <div className="text-lg font-semibold">
                      مجموع کل: {calculateTotal().toLocaleString('fa-IR')} دینار
                    </div>
                  </Card>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  انصراف
                </Button>
                <Button 
                  onClick={() => createInvoiceMutation.mutate(newInvoice)}
                  disabled={createInvoiceMutation.isPending || !newInvoice.customer_name}
                >
                  {createInvoiceMutation.isPending ? 'در حال ایجاد...' : 'ایجاد فاکتور'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل فاکتورها</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices?.length || 0}</div>
            <p className="text-xs text-muted-foreground">تعداد کل فاکتورهای صادر شده</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فاکتورهای پرداخت شده</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {invoices?.filter((inv: Invoice) => inv.status === 'paid')?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">فاکتورهای دریافت شده</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فاکتورهای معوقه</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {invoices?.filter((inv: Invoice) => inv.status === 'overdue')?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">فاکتورهای سررسید گذشته</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموع درآمد</CardTitle>
            <Calculator className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {invoices?.filter((inv: Invoice) => inv.status === 'paid')
                ?.reduce((total: number, inv: Invoice) => total + inv.total_amount, 0)
                ?.toLocaleString('fa-IR') || '0'} د
            </div>
            <p className="text-xs text-muted-foreground">درآمد از فاکتورهای پرداخت شده</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست فاکتورها</CardTitle>
          <CardDescription>تمام فاکتورهای صادر شده در سیستم</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">در حال بارگیری...</div>
          ) : invoices?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              هیچ فاکتوری یافت نشد. اولین فاکتور خود را ایجاد کنید.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره فاکتور</TableHead>
                  <TableHead>نام مشتری</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>مبلغ کل</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.map((invoice: Invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono">INV-{invoice.id.toString().padStart(4, '0')}</TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>
                      {new Date(invoice.date).toLocaleDateString('fa-IR')}
                    </TableCell>
                    <TableCell>{invoice.total_amount.toLocaleString('fa-IR')} دینار</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2 space-x-reverse">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
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
    </div>
  );
}
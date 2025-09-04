import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Eye, Search, Filter, Receipt, Calendar, Building, CheckCircle, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import PaymentMethodBadge from '@/components/PaymentMethodBadge';

interface PaidOrder {
  id: number;
  orderNumber: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: string;
  currency: string;
  paymentMethod: string;
  paymentDate: string;
  createdAt: string;
  status: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
}

interface InvoiceStats {
  totalPaidOrders: number;
  totalInvoiceAmount: number;
  averageOrderValue: number;
  thisMonthInvoices: number;
}

export default function ShopInvoiceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<PaidOrder | null>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  // Fetch paid orders only (completed payments) - NEW API PATH
  const { data: ordersResponse, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/invoices/paid'],
    queryFn: async () => {
      const response = await fetch('/api/invoices/paid', {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch invoice statistics
  const { data: statsResponse } = useQuery({
    queryKey: ['/api/shop/invoices/stats'],
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch company information for logo
  const { data: companyInfo } = useQuery({
    queryKey: ['/api/admin/company-information'],
    queryFn: () => fetch('/api/admin/company-information', { credentials: 'include' }).then(res => res.json()),
    staleTime: 300000, // Cache for 5 minutes
  });

  const paidOrders: PaidOrder[] = ordersResponse || [];
  const stats: InvoiceStats = statsResponse || {
    totalPaidOrders: 0,
    totalInvoiceAmount: 0,
    averageOrderValue: 0,
    thisMonthInvoices: 0
  };

  // Filter orders based on search and status
  const filteredOrders = paidOrders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.customerFirstName} ${order.customerLastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Format currency for display
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US').format(num) + ' دینار عراقی';
  };

  // Format Gregorian date
  const formatGregorianDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // Get customer display name with fallback
  const getCustomerDisplayName = (order: PaidOrder) => {
    const firstName = order.customerFirstName?.trim();
    const lastName = order.customerLastName?.trim();
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return 'مشتری گرامی';
    }
  };

  // Get customer address display
  const getCustomerAddress = (order: any) => {
    const parts = [];
    if (order.customerAddress) parts.push(order.customerAddress);
    if (order.customerCity) parts.push(order.customerCity);
    if (order.customerProvince) parts.push(order.customerProvince);
    return parts.length > 0 ? parts.join(', ') : '';
  };

  // Print invoice
  const handlePrintInvoice = async (order: PaidOrder) => {
    try {
      toast({
        title: '🖨️ آماده‌سازی چاپ',
        description: 'در حال آماده‌سازی فاکتور برای چاپ...',
      });

      // Generate invoice HTML content with company info
      const invoiceHTML = generateInvoiceHTML(order, companyInfo);
      
      // Open print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('امکان باز کردن پنجره چاپ وجود ندارد');
      }

      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      toast({
        title: '✅ آماده چاپ',
        description: `فاکتور سفارش ${order.orderNumber} آماده چاپ شد`,
      });
    } catch (error) {
      console.error('خطا در چاپ فاکتور:', error);
      toast({
        title: '❌ خطا در چاپ',
        description: 'امکان چاپ فاکتور وجود ندارد',
        variant: 'destructive'
      });
    }
  };

  // Download invoice as HTML file
  const handleDownloadInvoice = async (order: PaidOrder) => {
    try {
      toast({
        title: '📄 تولید فایل',
        description: 'در حال تولید فایل فاکتور...',
      });

      // Generate invoice HTML content with company info
      const invoiceHTML = generateInvoiceHTML(order, companyInfo);
      
      // Create blob and download
      const blob = new Blob([invoiceHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.orderNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: '✅ فایل دانلود شد',
        description: `فاکتور ${order.orderNumber} دانلود شد`,
      });
    } catch (error) {
      console.error('خطا در دانلود فاکتور:', error);
      toast({
        title: '❌ خطا در دانلود',
        description: 'امکان دانلود فاکتور وجود ندارد',
        variant: 'destructive'
      });
    }
  };

  // Generate professional invoice HTML with company logo
  const generateInvoiceHTML = (order: PaidOrder, companyInfo?: any) => {
    const currentDate = formatGregorianDate(new Date().toISOString());
    const orderDate = formatGregorianDate(order.createdAt);
    const paymentDate = formatGregorianDate(order.paymentDate);
    const customerName = getCustomerDisplayName(order);

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>فاکتور سفارش ${order.orderNumber}</title>
        <style>
          body { 
            font-family: 'Tahoma', 'Arial', sans-serif; 
            margin: 0; 
            padding: 20px; 
            direction: rtl; 
            background: white;
            font-size: 14px;
            line-height: 1.6;
          }
          .invoice-container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white;
            border: 2px solid #2563eb;
            border-radius: 10px;
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white; 
            padding: 30px; 
            text-align: center; 
            position: relative;
          }
          .company-logo { 
            width: 120px; 
            height: auto; 
            margin-bottom: 15px;
            border-radius: 8px;
            background: white;
            padding: 10px;
          }
          .company-name { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 8px;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
          }
          .invoice-title { 
            font-size: 20px; 
            margin-bottom: 15px;
            background: rgba(255,255,255,0.2);
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
          }
          .invoice-info { 
            padding: 25px; 
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 20px;
          }
          .info-item { 
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .info-label { 
            font-weight: bold; 
            color: #374151; 
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
            letter-spacing: 0.5px;
          }
          .info-value { 
            color: #1f2937; 
            font-size: 16px;
            font-weight: 600;
          }
          .items-section { 
            padding: 25px;
          }
          .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            color: #2563eb;
            margin-bottom: 15px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 8px;
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .items-table th { 
            background: #2563eb; 
            color: white; 
            padding: 15px; 
            text-align: right;
            font-weight: bold;
            font-size: 14px;
          }
          .items-table td { 
            padding: 12px 15px; 
            border-bottom: 1px solid #e2e8f0;
            text-align: right;
          }
          .items-table tr:nth-child(even) { 
            background-color: #f8fafc; 
          }
          .items-table tr:hover { 
            background-color: #e0f2fe; 
          }
          .total-section { 
            background: #1e293b;
            color: white;
            padding: 25px;
            text-align: center;
          }
          .total-amount { 
            font-size: 24px; 
            font-weight: bold;
            margin-bottom: 10px;
          }
          .payment-info { 
            font-size: 14px;
            opacity: 0.9;
          }
          .footer { 
            background: #f1f5f9;
            padding: 20px; 
            text-align: center; 
            font-size: 12px; 
            color: #64748b;
            border-top: 1px solid #e2e8f0;
          }
          .print-date { 
            margin-top: 10px;
            font-weight: bold;
            color: #2563eb;
          }
          @media print { 
            body { margin: 0; padding: 0; }
            .invoice-container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <img src="${companyInfo?.data?.logoUrl || '/uploads/Logo_1753245273579.jpeg'}" alt="لوگوی شرکت" class="company-logo" onerror="this.src='/uploads/Logo_1753245273579.jpeg'" />
            <div class="company-name">${companyInfo?.data?.companyNameAr || companyInfo?.data?.companyNameEn || 'شرکت ممتاز شیمی'}</div>
            <div class="invoice-title">فاکتور فروش</div>
          </div>

          <div class="invoice-info">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">شماره فاکتور</div>
                <div class="info-value">${order.orderNumber}</div>
              </div>
              <div class="info-item">
                <div class="info-label">تاریخ صدور</div>
                <div class="info-value">${orderDate}</div>
              </div>
              <div class="info-item">
                <div class="info-label">تاریخ پرداخت</div>
                <div class="info-value">${paymentDate}</div>
              </div>
              <div class="info-item">
                <div class="info-label">روش پرداخت</div>
                <div class="info-value">${getPaymentMethodName(order.paymentMethod)}</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">نام مشتری</div>
                <div class="info-value">${customerName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">شماره تماس</div>
                <div class="info-value">${order.customerPhone || 'ثبت نشده'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">ایمیل</div>
                <div class="info-value">${order.customerEmail || 'ثبت نشده'}</div>
              </div>
              ${getCustomerAddress(order) ? `
              <div class="info-item" style="grid-column: 1 / -1;">
                <div class="info-label">آدرس مشتری</div>
                <div class="info-value">${getCustomerAddress(order)}</div>
              </div>` : ''}
            </div>
          </div>

          <div class="items-section">
            <div class="section-title">🛒 جزئیات اقلام</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>نام محصول</th>
                  <th>تعداد</th>
                  <th>قیمت واحد</th>
                  <th>مبلغ کل</th>
                </tr>
              </thead>
              <tbody>
                ${order.items?.map(item => `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td>${formatCurrency(item.totalPrice)}</td>
                  </tr>
                `).join('') || '<tr><td colspan="4">اطلاعات اقلام در دسترس نیست</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="total-section">
            <div class="total-amount">
              💰 مبلغ کل: ${formatCurrency(order.totalAmount)}
            </div>
            <div class="payment-info">
              ✅ پرداخت تکمیل شده در تاریخ ${paymentDate}
            </div>
          </div>

          <div class="footer">
            <p>🏢 این فاکتور توسط سیستم فروشگاه آنلاین ممتاز شیمی تولید شده است</p>
            <div class="company-contact" style="font-size: 11px; color: #666; margin: 10px 0; text-align: center; line-height: 1.4;">
              ${companyInfo?.data?.address ? `📍 آدرس: ${companyInfo.data.address}` : ''}
              ${companyInfo?.data?.phoneNumber ? ` | 📞 تلفن: ${companyInfo.data.phoneNumber}` : ''}
              ${companyInfo?.data?.email ? ` | 📧 ایمیل: ${companyInfo.data.email}` : ''}
              ${companyInfo?.data?.website ? ` | 🌐 وبسایت: ${companyInfo.data.website}` : ''}
            </div>
            <div class="print-date">تاریخ چاپ: ${currentDate}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Get payment method display name
  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'bank_transfer': 'انتقال بانکی',
      'wallet_full': 'کیف پول کامل',
      'wallet': 'کیف پول دیجیتال',
      'cash_on_delivery': 'پرداخت در محل',
      'credit_card': 'کارت اعتباری'
    };
    return methods[method] || method;
  };

  // Preview invoice in modal
  const handlePreviewInvoice = (order: PaidOrder) => {
    setSelectedOrder(order);
    setShowInvoicePreview(true);
  };

  // Download all invoices as ZIP
  const handleDownloadAllInvoices = async () => {
    try {
      toast({
        title: '📦 تولید فایل‌های گروهی',
        description: 'در حال تولید تمامی فاکتورها...',
      });

      // Create a simple CSV report for now
      const csvContent = [
        'شماره فاکتور,مشتری,مبلغ,روش پرداخت,تاریخ پرداخت',
        ...filteredOrders.map(order => 
          `${order.orderNumber},"${order.customerFirstName} ${order.customerLastName}",${order.totalAmount},${getPaymentMethodName(order.paymentMethod)},${formatGregorianDate(order.paymentDate)}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoices-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: '✅ گزارش دانلود شد',
        description: `گزارش ${filteredOrders.length} فاکتور دانلود شد`,
      });
    } catch (error) {
      console.error('خطا در دانلود گزارش:', error);
      toast({
        title: '❌ خطا در دانلود گزارش',
        description: 'امکان دانلود گزارش وجود ندارد',
        variant: 'destructive'
      });
    }
  };

  if (ordersLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-3">در حال بارگذاری فاکتورها...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">مدیریت فاکتور فروش</h2>
          <p className="text-sm text-gray-600 mt-1">فاکتورهای سفارشات تسویه شده</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadAllInvoices}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            disabled={filteredOrders.length === 0}
          >
            <Download className="w-4 h-4" />
            دانلود گزارش CSV ({filteredOrders.length})
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Receipt className="w-8 h-8 text-green-600" />
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">کل فاکتورها</p>
                <p className="text-xl font-bold text-green-600">{stats.totalPaidOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-blue-600" />
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">مبلغ کل</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalInvoiceAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-purple-600" />
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">میانگین سفارش</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.averageOrderValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-600" />
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-600">این ماه</p>
                <p className="text-xl font-bold text-orange-600">{stats.thisMonthInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="جستجو بر اساس شماره سفارش، نام مشتری یا شماره تماس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="فیلتر وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه سفارشات</SelectItem>
            <SelectItem value="completed">تکمیل شده</SelectItem>
            <SelectItem value="delivered">تحویل شده</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            فاکتورهای قابل صدور ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-right p-3 font-semibold">شماره سفارش</th>
                  <th className="text-right p-3 font-semibold">مشتری</th>
                  <th className="text-right p-3 font-semibold">مبلغ</th>
                  <th className="text-right p-3 font-semibold">روش پرداخت</th>
                  <th className="text-right p-3 font-semibold">تاریخ پرداخت</th>
                  <th className="text-right p-3 font-semibold">وضعیت</th>
                  <th className="text-right p-3 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-blue-600">{order.orderNumber}</td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{order.customerFirstName} {order.customerLastName}</div>
                        <div className="text-sm text-gray-500">{order.customerPhone}</div>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-green-600">{formatCurrency(order.totalAmount)}</td>
                    <td className="p-3">
                      <PaymentMethodBadge 
                        paymentMethod={order.paymentMethod}
                        showIcon={true}
                        className="text-xs"
                      />
                    </td>
                    <td className="p-3 text-sm">{formatGregorianDate(order.paymentDate)}</td>
                    <td className="p-3">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        تسویه شده
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewInvoice(order)}
                          className="text-blue-600 hover:text-blue-800"
                          title="پیش‌نمایش فاکتور"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm" 
                          onClick={() => handlePrintInvoice(order)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          title="چاپ فاکتور"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm" 
                          onClick={() => handleDownloadInvoice(order)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          title="دانلود فاکتور"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">هیچ فاکتور قابل صدوری یافت نشد</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
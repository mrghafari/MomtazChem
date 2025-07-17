import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FileText, Package, TrendingUp, AlertTriangle, Download, Upload, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Types based on Excel structure
interface WarehouseLocation {
  id: number;
  name: string;
  code: string;
  description?: string;
  address?: string;
  capacity?: number;
  currentUtilization?: number;
  isActive: boolean;
}

interface WarehouseItem {
  id: number;
  productCode: string;
  productName: string;
  productType: string; // محصول نهایی، ماده اولیه، بسته‌بندی
  unit: string;
  initialStock: number;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  warehouseLocationId?: number;
  unitPrice: number;
  totalValue: number;
  category?: string;
  subcategory?: string;
  isActive: boolean;
  warehouseLocation?: WarehouseLocation;
}

interface WarehouseReceipt {
  id: number;
  receiptNumber: string;
  receiptDate: string;
  warehouseItemId: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  source: string; // تولید، خرید، انتقال
  supplierName?: string;
  supplierCode?: string;
  batchNumber?: string;
  productionDate?: string;
  expiryDate?: string;
  registeredBy: string;
  approvedBy?: string;
  notes?: string;
  status: string;
  warehouseItem?: WarehouseItem;
}

interface WarehouseIssue {
  id: number;
  issueNumber: string;
  issueDate: string;
  warehouseItemId: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  destination: string; // مشتری، تولید، انتقال، ضایعات
  reference: string; // فاکتور فروش، درخواست تولید
  customerName?: string;
  customerCode?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  registeredBy: string;
  approvedBy?: string;
  notes?: string;
  status: string;
  warehouseItem?: WarehouseItem;
}

interface WarehouseStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  pendingReceipts: number;
  pendingIssues: number;
  monthlyReceipts: number;
  monthlyIssues: number;
}

const WarehouseExcelManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState("items");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch warehouse locations
  const { data: locations = [] } = useQuery<WarehouseLocation[]>({
    queryKey: ['/api/warehouse/locations'],
    queryFn: () => apiRequest('/api/warehouse/locations')
  });

  // Fetch warehouse items (کالاها)
  const { data: items = [], isLoading: itemsLoading } = useQuery<WarehouseItem[]>({
    queryKey: ['/api/warehouse/items'],
    queryFn: () => apiRequest('/api/warehouse/items')
  });

  // Fetch warehouse receipts (ورود به انبار)
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery<WarehouseReceipt[]>({
    queryKey: ['/api/warehouse/receipts'],
    queryFn: () => apiRequest('/api/warehouse/receipts')
  });

  // Fetch warehouse issues (خروج از انبار)
  const { data: issues = [], isLoading: issuesLoading } = useQuery<WarehouseIssue[]>({
    queryKey: ['/api/warehouse/issues'],
    queryFn: () => apiRequest('/api/warehouse/issues')
  });

  // Fetch warehouse statistics
  const { data: stats } = useQuery<WarehouseStats>({
    queryKey: ['/api/warehouse/stats'],
    queryFn: () => apiRequest('/api/warehouse/stats')
  });

  // Filter items based on search and filters
  const filteredItems = items.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.productCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'all' || item.warehouseLocationId?.toString() === selectedLocation;
    const matchesType = selectedType === 'all' || item.productType === selectedType;
    return matchesSearch && matchesLocation && matchesType;
  });

  // Filter receipts based on search
  const filteredReceipts = receipts.filter(receipt => {
    return receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           receipt.warehouseItem?.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           receipt.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
  });

  // Filter issues based on search
  const filteredIssues = issues.filter(issue => {
    return issue.issueNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           issue.warehouseItem?.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           issue.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
  });

  const getStockStatus = (item: WarehouseItem) => {
    if (item.currentStock <= 0) return 'out-of-stock';
    if (item.currentStock <= item.minStockLevel) return 'low-stock';
    return 'in-stock';
  };

  const getStockBadge = (item: WarehouseItem) => {
    const status = getStockStatus(item);
    const statusConfig = {
      'out-of-stock': { label: 'ناموجود', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      'low-stock': { label: 'موجودی کم', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
      'in-stock': { label: 'موجود', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
    };
    
    const config = statusConfig[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🏭 سیستم انبارداری ممتاز شیمی
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            مدیریت جامع کالاها، ورود و خروج انبار مطابق استاندارد Excel
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 ml-2" />
            گزارش Excel
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 ml-2" />
            بارگذاری Excel
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">کل کالاها</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <p className="text-xs text-muted-foreground">
                کل اقلام ثبت شده در انبار
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">موجودی کم</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">
                کالاهای نیازمند تأمین
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ارزش کل انبار</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                ارزش کل موجودی انبار
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">حرکات ماهانه</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.monthlyReceipts + stats.monthlyIssues}
              </div>
              <p className="text-xs text-muted-foreground">
                ورود: {stats.monthlyReceipts} | خروج: {stats.monthlyIssues}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="جستجوی کالا، کد، تأمین‌کننده یا مشتری..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="انتخاب انبار" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه انبارها</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id.toString()}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="نوع کالا" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه انواع</SelectItem>
            <SelectItem value="محصول نهایی">محصول نهایی</SelectItem>
            <SelectItem value="ماده اولیه">ماده اولیه</SelectItem>
            <SelectItem value="بسته‌بندی">بسته‌بندی</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">📦 کالاها</TabsTrigger>
          <TabsTrigger value="receipts">📥 ورود به انبار</TabsTrigger>
          <TabsTrigger value="issues">📤 خروج از انبار</TabsTrigger>
        </TabsList>

        {/* Items Tab - کالاها */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">فهرست کالاها</h3>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              افزودن کالای جدید
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">کد کالا</TableHead>
                      <TableHead className="text-right">نام کالا</TableHead>
                      <TableHead className="text-right">نوع</TableHead>
                      <TableHead className="text-right">واحد</TableHead>
                      <TableHead className="text-right">موجودی فعلی</TableHead>
                      <TableHead className="text-right">حداقل موجودی</TableHead>
                      <TableHead className="text-right">محل انبار</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">ارزش کل</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productCode}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.productName}</div>
                            {item.category && (
                              <div className="text-sm text-gray-500">{item.category}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.productType}</Badge>
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="font-bold">
                          {new Intl.NumberFormat('fa-IR').format(item.currentStock)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {new Intl.NumberFormat('fa-IR').format(item.minStockLevel)}
                        </TableCell>
                        <TableCell>
                          {item.warehouseLocation?.name || 'نامشخص'}
                        </TableCell>
                        <TableCell>{getStockBadge(item)}</TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(item.totalValue)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipts Tab - ورود به انبار */}
        <TabsContent value="receipts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">فهرست ورودی‌های انبار</h3>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              ثبت ورود جدید
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">شماره رسید</TableHead>
                      <TableHead className="text-right">تاریخ ورود</TableHead>
                      <TableHead className="text-right">کالا</TableHead>
                      <TableHead className="text-right">مقدار</TableHead>
                      <TableHead className="text-right">مرجع</TableHead>
                      <TableHead className="text-right">تأمین‌کننده</TableHead>
                      <TableHead className="text-right">شماره بچ</TableHead>
                      <TableHead className="text-right">مسئول ثبت</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">مبلغ کل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell className="font-medium">{receipt.receiptNumber}</TableCell>
                        <TableCell>{formatDate(receipt.receiptDate)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{receipt.warehouseItem?.productName}</div>
                            <div className="text-sm text-gray-500">{receipt.warehouseItem?.productCode}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">
                          {new Intl.NumberFormat('fa-IR').format(receipt.quantity)} {receipt.warehouseItem?.unit}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{receipt.source}</Badge>
                        </TableCell>
                        <TableCell>{receipt.supplierName || '-'}</TableCell>
                        <TableCell>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {receipt.batchNumber || '-'}
                          </code>
                        </TableCell>
                        <TableCell>{receipt.registeredBy}</TableCell>
                        <TableCell>
                          <Badge className={
                            receipt.status === 'approved' ? 'bg-green-100 text-green-800' :
                            receipt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {receipt.status === 'approved' ? 'تأیید شده' :
                             receipt.status === 'pending' ? 'در انتظار' : 'رد شده'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(receipt.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab - خروج از انبار */}
        <TabsContent value="issues" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">فهرست خروجی‌های انبار</h3>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              ثبت خروج جدید
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">شماره حواله</TableHead>
                      <TableHead className="text-right">تاریخ خروج</TableHead>
                      <TableHead className="text-right">کالا</TableHead>
                      <TableHead className="text-right">مقدار</TableHead>
                      <TableHead className="text-right">مقصد</TableHead>
                      <TableHead className="text-right">مرجع</TableHead>
                      <TableHead className="text-right">مشتری</TableHead>
                      <TableHead className="text-right">مسئول ثبت</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">مبلغ کل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIssues.map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">{issue.issueNumber}</TableCell>
                        <TableCell>{formatDate(issue.issueDate)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{issue.warehouseItem?.productName}</div>
                            <div className="text-sm text-gray-500">{issue.warehouseItem?.productCode}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">
                          {new Intl.NumberFormat('fa-IR').format(issue.quantity)} {issue.warehouseItem?.unit}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{issue.destination}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{issue.reference}</Badge>
                        </TableCell>
                        <TableCell>{issue.customerName || '-'}</TableCell>
                        <TableCell>{issue.registeredBy}</TableCell>
                        <TableCell>
                          <Badge className={
                            issue.status === 'completed' ? 'bg-green-100 text-green-800' :
                            issue.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            issue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {issue.status === 'completed' ? 'تکمیل شده' :
                             issue.status === 'approved' ? 'تأیید شده' :
                             issue.status === 'pending' ? 'در انتظار' : 'رد شده'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-red-600">
                          {formatCurrency(issue.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WarehouseExcelManagement;
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Barcode, Scan, Download, Printer, Code, Plus, ArrowLeft, Settings, CheckCircle, AlertTriangle, Search, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import BarcodeGenerator from "@/components/ui/barcode-generator";
import VisualBarcode from "@/components/ui/visual-barcode";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BarcodeScanner from "@/components/ui/barcode-scanner";

interface Product {
  id: number;
  name: string;
  category: string;
  stockQuantity: number;
  minStockLevel: number;
  barcode?: string;
  qrCode?: string;
  sku?: string;
  stockUnit: string;
  warehouseLocation?: string;
  batchNumber?: string;
  price?: number;
  priceUnit?: string;
  unitPrice?: number;
  currency?: string;
}

interface InventoryTransaction {
  id: number;
  productId: number;
  transactionType: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  scannedBarcode?: string;
  createdAt: string;
}

export default function BarcodeInventory() {
  const [, setLocation] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>('');
  const [transactionQuantity, setTransactionQuantity] = useState<number>(0);
  const [transactionReason, setTransactionReason] = useState<string>('');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [labelOptions, setLabelOptions] = useState({
    includePrice: true,
    includeSKU: true,
    includeWebsite: true,
    size: 'standard'
  });
  const [productToUpdate, setProductToUpdate] = useState<Product | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth');
        if (!response.ok) {
          window.location.href = '/admin/login';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/admin/login';
      }
    };
    checkAuth();
  }, []);

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch inventory transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery<InventoryTransaction[]>({
    queryKey: ["/api/inventory/transactions"],
    queryFn: async () => {
      const response = await fetch('/api/inventory/transactions');
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Inventory update mutation
  const inventoryUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update inventory');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/transactions"] });
      setShowUpdateDialog(false);
      toast({
        title: "موفق",
        description: "موجودی با موفقیت به‌روزرسانی شد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی موجودی",
        variant: "destructive"
      });
    }
  });

  // Iraq format barcode generation mutation
  const iraqBarcodeGeneration = useMutation({
    mutationFn: () => apiRequest("/api/barcode/generate-iraq-format", "POST"),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "تولید بارکد عراق موفق",
        description: `${result.summary}`,
      });
    },
    onError: (error) => {
      toast({
        title: "خطا در تولید بارکد",
        description: "عدم موفقیت در تولید بارکدهای عراق",
        variant: "destructive"
      });
    },
  });

  const generateIraqBarcodes = () => {
    iraqBarcodeGeneration.mutate();
  };

  // Filter and sort products
  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.price && product.price.toString().includes(searchTerm)) ||
    (product.priceUnit && product.priceUnit.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: any = a[sortField as keyof Product];
    let bValue: any = b[sortField as keyof Product];
    
    // Handle null/undefined values
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';
    
    // Convert to string for comparison if needed
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  const handleBarcodeGenerated = (barcode: string, type: string = 'default') => {
    if (selectedProduct) {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "بارکد تولید شد",
        description: `بارکد ${type} برای ${selectedProduct.name} ایجاد شد`,
      });
    }
  };

  const handleProductScan = (product: Product) => {
    setSelectedProduct(product);
    setProductToUpdate(product);
    setShowUpdateDialog(true);
  };

  const handleUpdateInventory = () => {
    if (!productToUpdate || !selectedTransactionType || transactionQuantity <= 0) {
      toast({
        title: "داده‌های ناکافی",
        description: "لطفاً تمام فیلدهای مورد نیاز را پر کنید",
        variant: "destructive"
      });
      return;
    }

    const data = {
      productId: productToUpdate.id,
      transactionType: selectedTransactionType,
      quantity: transactionQuantity,
      reason: transactionReason,
      reference: transactionReference,
      scannedBarcode: productToUpdate.barcode
    };

    inventoryUpdateMutation.mutate(data);
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    const allIds = sortedProducts.map(p => p.id);
    if (selectedProducts.length === allIds.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(allIds);
    }
  };

  const exportCSVData = async () => {
    try {
      const response = await fetch('/api/barcode/export-all');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barcode-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "موفق",
        description: "فایل CSV با موفقیت دانلود شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در دانلود فایل CSV",
        variant: "destructive"
      });
    }
  };

  const generateLabelZPL = () => {
    const selectedProductsList = selectedProducts.length > 0 
      ? products?.filter(p => selectedProducts.includes(p.id)) 
      : products?.filter(p => p.barcode);

    if (!selectedProductsList || selectedProductsList.length === 0) {
      toast({
        title: "محصولی یافت نشد",
        description: "محصولی برای تولید برچسب انتخاب نشده",
        variant: "destructive"
      });
      return;
    }

    const zplCommands = selectedProductsList.map(product => 
      generateLabelZPLForProduct(product)
    ).join('\n');

    const blob = new Blob([zplCommands], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labels-${new Date().toISOString().split('T')[0]}.zpl`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "موفق",
      description: "فایل ZPL با موفقیت دانلود شد",
    });
  };

  const generateLabelZPLForProduct = (product: Product) => {
    const price = product.price || product.unitPrice || 0;
    const priceText = price > 0 ? `${Math.round(price).toLocaleString()} ${product.priceUnit || product.currency || 'IQD'}` : 'قیمت تعریف نشده';
    
    return `
^XA
^FO50,50^A0N,30,30^FD${product.name}^FS
^FO50,100^BY2,3,47
^BCN,100,Y,N,N
^FD${product.barcode || ''}^FS
^FO50,220^A0N,20,20^FD${priceText}^FS
^FO50,250^A0N,20,20^FD${product.sku || ''}^FS
^FO50,280^A0N,20,20^FDmomtazchem.com^FS
^XZ`;
  };

  const getStockStatusColor = (product: Product) => {
    if (product.stockQuantity <= 0) return 'bg-red-500';
    if (product.stockQuantity <= (product.minStockLevel || 5)) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStockStatusIcon = (product: Product) => {
    if (product.stockQuantity <= 0) return <AlertTriangle className="h-4 w-4" />;
    if (product.stockQuantity <= (product.minStockLevel || 5)) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  if (productsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/admin/site-management")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            بازگشت
          </Button>
          <h1 className="text-2xl font-bold">مدیریت موجودی و بارکد</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="جستجو محصول..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="scanner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="generator">Barcode Generator</TabsTrigger>
        </TabsList>

        {/* Scanner Tab */}
        <TabsContent value="scanner" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  Barcode Scanner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarcodeScanner onProductScanned={handleProductScan} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedProduct ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-900">{selectedProduct.name}</h3>
                      <p className="text-sm text-blue-700">موجودی فعلی: {selectedProduct.stockQuantity} {selectedProduct.stockUnit}</p>
                      <p className="text-sm text-blue-700">دسته: {selectedProduct.category}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">نوع تراکنش</label>
                      <Select value={selectedTransactionType} onValueChange={setSelectedTransactionType}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب نوع تراکنش" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in">ورود کالا</SelectItem>
                          <SelectItem value="out">خروج کالا</SelectItem>
                          <SelectItem value="adjust">تعدیل موجودی</SelectItem>
                          <SelectItem value="transfer">انتقال</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">مقدار</label>
                      <Input
                        type="number"
                        value={transactionQuantity}
                        onChange={(e) => setTransactionQuantity(parseInt(e.target.value))}
                        placeholder="مقدار"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">دلیل</label>
                      <Input
                        value={transactionReason}
                        onChange={(e) => setTransactionReason(e.target.value)}
                        placeholder="دلیل تراکنش"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">مرجع</label>
                      <Input
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                        placeholder="شماره مرجع"
                      />
                    </div>

                    <Button 
                      onClick={handleUpdateInventory}
                      disabled={inventoryUpdateMutation.isPending}
                      className="w-full"
                    >
                      {inventoryUpdateMutation.isPending ? 'در حال پردازش...' : 'به‌روزرسانی موجودی'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Scan className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Scan a Product</h3>
                    <p className="text-gray-500">Use the scanner to select a product for inventory operations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Generator Tab */}
        <TabsContent value="generator" className="space-y-6">
          <BarcodeGenerator
            productId={selectedProduct?.id}
            productName={selectedProduct?.name}
            sku={selectedProduct?.sku}
            onBarcodeGenerated={handleBarcodeGenerated}
          />
        </TabsContent>
      </Tabs>

      {/* Bulk Operations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>عملیات انبوه</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Checkbox 
              id="select-all"
              checked={selectedProducts.length === sortedProducts.length}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              انتخاب همه ({sortedProducts.length} محصول)
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => exportCSVData()}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => {
                if (selectedProducts.length === 0) {
                  toast({
                    title: "انتخاب محصول",
                    description: "لطفاً حداقل یک محصول انتخاب کنید",
                    variant: "destructive"
                  });
                  return;
                }
                setShowLabelPreview(true);
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Labels for Selected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>فهرست محصولات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 border border-gray-200">انتخاب</th>
                  <th 
                    className="text-left p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      محصول
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-2">
                      دسته
                      {getSortIcon('category')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('stockQuantity')}
                  >
                    <div className="flex items-center gap-2">
                      موجودی
                      {getSortIcon('stockQuantity')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center gap-2">
                      قیمت
                      {getSortIcon('price')}
                    </div>
                  </th>
                  <th 
                    className="text-left p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('barcode')}
                  >
                    <div className="flex items-center gap-2">
                      بارکد
                      {getSortIcon('barcode')}
                    </div>
                  </th>
                  <th className="text-left p-3 border border-gray-200">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="p-3 border border-gray-200">
                      <Checkbox 
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => handleSelectProduct(product.id)}
                      />
                    </td>
                    <td className="p-3 border border-gray-200">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="p-3 border border-gray-200">
                      <Badge variant="secondary">{product.category}</Badge>
                    </td>
                    <td className="p-3 border border-gray-200">
                      <div className={`flex items-center gap-2 p-2 rounded ${getStockStatusColor(product)} text-white`}>
                        {getStockStatusIcon(product)}
                        <span>{product.stockQuantity} {product.stockUnit}</span>
                      </div>
                    </td>
                    <td className="p-3 border border-gray-200">
                      <div className="font-medium">
                        {product.price ? 
                          `${Math.round(product.price).toLocaleString()} ${product.priceUnit || 'IQD'}` 
                          : 'قیمت تعریف نشده'
                        }
                      </div>
                    </td>
                    <td className="p-3 border border-gray-200">
                      {product.barcode ? (
                        <div className="space-y-2">
                          <div className="font-mono text-sm">{product.barcode}</div>
                          <VisualBarcode 
                            value={product.barcode} 
                            productName={product.name}
                            sku={product.sku}
                            price={product.price}
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400">No barcode</span>
                      )}
                    </td>
                    <td className="p-3 border border-gray-200">
                      {product.barcode ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          فعال
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          بدون بارکد
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Label Preview Dialog */}
      <Dialog open={showLabelPreview} onOpenChange={setShowLabelPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>پیش‌نمایش برچسب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {selectedProducts.length} محصول انتخاب شده
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {selectedProducts.map(productId => {
                const product = products?.find(p => p.id === productId);
                if (!product) return null;
                
                const price = product.price || product.unitPrice || 0;
                const priceText = price > 0 ? `${Math.round(price).toLocaleString()} ${product.priceUnit || product.currency || 'IQD'}` : 'قیمت تعریف نشده';
                
                return (
                  <div key={productId} className="border rounded-lg p-4 bg-white">
                    <div className="text-sm font-medium truncate">{product.name}</div>
                    <div className="flex justify-center my-2">
                      <VisualBarcode 
                        value={product.barcode || ''} 
                        productName={product.name}
                        sku={product.sku}
                        price={price}
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>{priceText}</div>
                      <div>SKU: {product.sku || 'N/A'}</div>
                      <div>momtazchem.com</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLabelPreview(false)}>
                بستن
              </Button>
              <Button onClick={() => generateLabelZPL()}>
                <Code className="h-4 w-4 mr-2" />
                Generate ZPL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
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
import html2canvas from 'html2canvas';
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



export default function BarcodeInventory() {
  const [, setLocation] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [labelOptions, setLabelOptions] = useState({
    includePrice: true,
    includeSKU: true,
    includeWebsite: true,
    websiteText: 'www.momtazchem.com',
    size: 'standard'
  });

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

  const downloadCustomizedLabels = async () => {
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

    try {
      // Get HTML content first
      const response = await fetch('/api/barcode/generate-custom-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: selectedProductsList,
          options: labelOptions,
          format: 'html'
        })
      });

      if (!response.ok) throw new Error('Failed to generate labels');
      
      const htmlContent = await response.text();
      
      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = htmlContent;
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '800px';
      tempContainer.style.background = 'white';
      tempContainer.style.padding = '20px';
      document.body.appendChild(tempContainer);
      
      // Convert to canvas and download
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: 'white',
        scale: 2,
        width: 800,
        height: tempContainer.scrollHeight,
        useCORS: true
      });
      
      // Remove temporary container
      document.body.removeChild(tempContainer);
      
      // Download the image
      const link = document.createElement('a');
      link.download = `customized-labels-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast({
        title: "موفق",
        description: "برچسب‌های سفارشی به فرمت عکس دانلود شد",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "خطا",
        description: "خطا در تولید برچسب‌های سفارشی",
        variant: "destructive"
      });
    }
  };

  const printCustomizedLabels = async () => {
    const selectedProductsList = selectedProducts.length > 0 
      ? products?.filter(p => selectedProducts.includes(p.id)) 
      : products?.filter(p => p.barcode);

    if (!selectedProductsList || selectedProductsList.length === 0) {
      toast({
        title: "محصولی یافت نشد",
        description: "محصولی برای پرینت برچسب انتخاب نشده",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/barcode/generate-custom-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: selectedProductsList,
          options: labelOptions,
          format: 'html'
        })
      });

      if (!response.ok) throw new Error('Failed to generate labels');
      
      const htmlText = await response.text();
      
      // باز کردن HTML در پنجره جدید برای پرینت
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlText);
        printWindow.document.close();
        
        // انتظار برای لود شدن محتوا و سپس پرینت
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
        
        toast({
          title: "موفق",
          description: "صفحه پرینت برچسب‌های سفارشی باز شد",
        });
      } else {
        throw new Error('Could not open print window');
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در باز کردن صفحه پرینت برچسب‌ها",
        variant: "destructive"
      });
    }
  };

  const generateLabelZPLForProduct = (product: Product) => {
    const price = product.price || product.unitPrice || 0;
    const priceText = price > 0 ? `${Math.round(price).toLocaleString()} ${product.priceUnit || product.currency || 'IQD'}` : 'قیمت تعریف نشده';
    
    let yPosition = 220;
    let optionalFields = '';
    
    // Add price if enabled
    if (labelOptions.includePrice) {
      optionalFields += `^FO50,${yPosition}^A0N,20,20^FD${priceText}^FS\n`;
      yPosition += 30;
    }
    
    // Add SKU if enabled
    if (labelOptions.includeSKU && product.sku) {
      optionalFields += `^FO50,${yPosition}^A0N,20,20^FDSKU: ${product.sku}^FS\n`;
      yPosition += 30;
    }
    
    // Add website if enabled
    if (labelOptions.includeWebsite) {
      optionalFields += `^FO50,${yPosition}^A0N,20,20^FD${labelOptions.websiteText}^FS\n`;
    }
    
    return `
^XA
^FO50,50^A0N,30,30^FD${product.name}^FS
^FO50,100^BY2,3,47
^BCN,100,Y,N,N
^FD${product.barcode || ''}^FS
${optionalFields}^XZ`;
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
                <CardTitle>Product Information</CardTitle>
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
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>SKU:</strong> {selectedProduct.sku || 'تعریف نشده'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>بارکد:</strong> {selectedProduct.barcode || 'ندارد'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>حداقل موجودی:</strong> {selectedProduct.minStockLevel || 5} {selectedProduct.stockUnit}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Scan className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Scan a Product</h3>
                    <p className="text-gray-500">Use the scanner to view detailed product information</p>
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
                        <VisualBarcode 
                          value={product.barcode} 
                          productName={product.name}
                          sku={product.sku}
                          price={product.price}
                          showPrice={true}
                          showWebsite={true}
                        />
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تنظیمات و پیش‌نمایش برچسب</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            
            {/* Customization Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تنظیمات برچسب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Content Options */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">محتوای برچسب</h4>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id="includePrice"
                        checked={labelOptions.includePrice}
                        onCheckedChange={(checked) => 
                          setLabelOptions(prev => ({ ...prev, includePrice: !!checked }))
                        }
                      />
                      <label htmlFor="includePrice" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        نمایش قیمت
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id="includeSKU"
                        checked={labelOptions.includeSKU}
                        onCheckedChange={(checked) => 
                          setLabelOptions(prev => ({ ...prev, includeSKU: !!checked }))
                        }
                      />
                      <label htmlFor="includeSKU" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        نمایش SKU
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox
                        id="includeWebsite"
                        checked={labelOptions.includeWebsite}
                        onCheckedChange={(checked) => 
                          setLabelOptions(prev => ({ ...prev, includeWebsite: !!checked }))
                        }
                      />
                      <label htmlFor="includeWebsite" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        نمایش آدرس وب‌سایت
                      </label>
                    </div>
                  </div>
                  
                  {/* Website Text Edit */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">تنظیمات وب‌سایت</h4>
                    
                    <div>
                      <label htmlFor="websiteText" className="text-sm font-medium text-gray-700 block mb-1">
                        متن آدرس وب‌سایت
                      </label>
                      <Input
                        id="websiteText"
                        value={labelOptions.websiteText}
                        onChange={(e) => 
                          setLabelOptions(prev => ({ ...prev, websiteText: e.target.value }))
                        }
                        placeholder="www.momtazchem.com"
                        className="text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="labelSize" className="text-sm font-medium text-gray-700 block mb-1">
                        اندازه برچسب
                      </label>
                      <Select
                        value={labelOptions.size}
                        onValueChange={(value) => 
                          setLabelOptions(prev => ({ ...prev, size: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">کوچک</SelectItem>
                          <SelectItem value="standard">استاندارد</SelectItem>
                          <SelectItem value="large">بزرگ</SelectItem>
                          <SelectItem value="roll">رول</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  پیش‌نمایش برچسب‌ها ({selectedProducts.length} محصول انتخاب شده)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                  {selectedProducts.map(productId => {
                    const product = products?.find(p => p.id === productId);
                    if (!product) return null;
                    
                    const price = product.price || product.unitPrice || 0;
                    const priceText = price > 0 ? `${Math.round(price).toLocaleString()} ${product.priceUnit || product.currency || 'IQD'}` : 'قیمت تعریف نشده';
                    
                    return (
                      <div key={productId} className="border rounded-lg p-3 bg-white shadow-sm">
                        <div className="text-sm font-medium truncate mb-2">{product.name}</div>
                        <div className="flex justify-center my-3">
                          <VisualBarcode 
                            value={product.barcode || ''} 
                            productName={product.name}
                            sku={labelOptions.includeSKU ? product.sku : undefined}
                            price={labelOptions.includePrice ? price : undefined}
                            showPrice={labelOptions.includePrice}
                            showWebsite={labelOptions.includeWebsite}
                            websiteText={labelOptions.websiteText}
                          />
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          {labelOptions.includePrice && (
                            <div className="font-medium text-green-600">{priceText}</div>
                          )}
                          {labelOptions.includeSKU && (
                            <div>SKU: {product.sku || 'N/A'}</div>
                          )}
                          {labelOptions.includeWebsite && (
                            <div className="text-blue-600">{labelOptions.websiteText}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setShowLabelPreview(false)}>
                بستن
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => generateLabelZPL()}>
                  <Code className="h-4 w-4 mr-2" />
                  Generate ZPL
                </Button>
                <Button onClick={() => downloadCustomizedLabels()}>
                  <Download className="h-4 w-4 mr-2" />
                  دانلود عکس برچسب‌ها
                </Button>
                <Button variant="outline" onClick={() => printCustomizedLabels()}>
                  <Printer className="h-4 w-4 mr-2" />
                  پرینت برچسب‌ها
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
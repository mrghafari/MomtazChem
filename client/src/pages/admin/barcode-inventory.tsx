import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { generateEAN13Barcode, validateEAN13, parseEAN13Barcode } from "@shared/barcode-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import BarcodeScanner from "@/components/ui/barcode-scanner";
import BarcodeGenerator from "@/components/ui/barcode-generator";
import EAN13Generator from "@/components/ui/ean13-generator";
import VisualBarcode from "@/components/ui/visual-barcode";

import { 
  Package, 
  Scan, 
  Plus, 
  Minus, 
  BarChart3, 
  History,
  QrCode,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Download,
  Upload,
  Barcode,
  Printer,
  FileText,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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

const BarcodeInventory = () => {
  const [, setLocation] = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockOperation, setStockOperation] = useState<'in' | 'out' | 'audit'>('in');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [scanMode, setScanMode] = useState<'lookup' | 'inventory_in' | 'inventory_out' | 'audit'>('lookup');
  const [showGenerator, setShowGenerator] = useState(false);
  // Label printing options
  const [includePrice, setIncludePrice] = useState(true);
  const [includeSKU, setIncludeSKU] = useState(true);
  const [includeWebsite, setIncludeWebsite] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

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

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<InventoryTransaction[]>({
    queryKey: ["/api/inventory/transactions"],
    queryFn: () => fetch("/api/inventory/transactions").then(res => res.json()),
  });

  const inventoryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/inventory/transaction", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/transactions"] });
      toast({
        title: "Success",
        description: "Inventory updated successfully",
        variant: "default"
      });
      setSelectedProduct(null);
      setQuantity(1);
      setReason('');
      setReference('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive"
      });
    },
  });

  const generateBarcodeMutation = useMutation({
    mutationFn: (data: { productId: number; barcode: string; qrCode?: string; sku?: string }) =>
      apiRequest(`/api/products/${data.productId}/barcode`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Barcode assigned to product",
        variant: "default"
      });
      setShowGenerator(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign barcode",
        variant: "destructive"
      });
    },
  });

  const handleScanSuccess = (barcode: string, productData?: any) => {
    if (productData) {
      setSelectedProduct(productData);
      setScanMode(stockOperation === 'in' ? 'inventory_in' : stockOperation === 'out' ? 'inventory_out' : 'audit');
    } else {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode: ${barcode}`,
        variant: "destructive"
      });
    }
  };

  const handleInventoryUpdate = () => {
    if (!selectedProduct) return;

    const transactionData = {
      productId: selectedProduct.id,
      transactionType: stockOperation,
      quantity: stockOperation === 'out' ? -quantity : quantity,
      reason,
      reference,
      scannedBarcode: selectedProduct.barcode,
    };

    inventoryMutation.mutate(transactionData);
  };

  const handleBarcodeGenerated = (barcode: string, type: string) => {
    if (!selectedProduct) return;

    const data = {
      productId: selectedProduct.id,
      barcode: type !== 'QR' ? barcode : selectedProduct.barcode || '',
      qrCode: type === 'QR' ? barcode : undefined,
      sku: selectedProduct.sku || `SKU${selectedProduct.id.toString().padStart(4, '0')}`,
    };

    generateBarcodeMutation.mutate(data);
  };

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

  // EAN-13 bulk generation function
  const generateBulkEAN13 = async () => {
    try {
      const productsWithoutEAN13 = products?.filter(p => !p.barcode || p.barcode.length !== 13) || [];
      if (productsWithoutEAN13.length === 0) {
        toast({
          title: "No Products",
          description: "All products already have EAN-13 barcodes",
        });
        return;
      }

      const response = await fetch('/api/ean13/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: productsWithoutEAN13.map(p => p.id) })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Bulk Generation Complete",
          description: `Generated ${result.generated} EAN-13 barcodes`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      } else {
        throw new Error('Bulk generation failed');
      }
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate bulk EAN-13 barcodes",
        variant: "destructive"
      });
    }
  };

  // Unified CSV export function with complete data and multilingual support
  const exportCSVData = async () => {
    try {
      const response = await fetch('/api/barcode/export-all');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Barcode_Export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "خروجی CSV تکمیل شد",
        description: "فایل شامل کلیه اطلاعات محصولات، بارکدها و قیمت‌ها"
      });
    } catch (error) {
      toast({
        title: "خطا در خروجی گیری",
        description: "عدم موفقیت در ایجاد فایل CSV",
        variant: "destructive"
      });
    }
  };

  const generateLabelZPL = (product: Product) => {
    const sku = product.sku || `SKU${product.id.toString().padStart(4, '0')}`;
    const price = product.price ? `${Math.round(product.price)} IQD` : '';
    
    // Define label dimensions (compact 50mm x 30mm label)
    let labelCommands = `^XA\n^LL240\n^PW400\n`;
    
    // Product name (top)
    labelCommands += `^FO10,8^A0N,20,15^FD${product.name.substring(0, 30)}^FS\n`;
    let yPosition = 30;
    
    // Add SKU if selected
    if (includeSKU) {
      labelCommands += `^FO10,${yPosition}^A0N,15,12^FDSKU: ${sku.substring(0, 15)}^FS\n`;
      yPosition += 18;
    }
    
    // Add barcode (compact size)
    labelCommands += `^FO10,${yPosition}^BY1,2,50^BCN,50,Y,N,N^FD${product.barcode}^FS\n`;
    yPosition += 60;
    
    // Add price if selected (compact)
    if (includePrice) {
      const priceText = price || 'قیمت تعریف نشده';
      labelCommands += `^FO10,${yPosition}^A0N,14,10^FD${priceText}^FS\n`;
      yPosition += 15;
    }
    
    // Add website if selected (compact)
    if (includeWebsite) {
      labelCommands += `^FO10,${yPosition}^A0N,10,8^FDmomtazchem.com^FS\n`;
    }
    
    labelCommands += '^XZ';
    return labelCommands;
  };

  const handlePrintLabels = async () => {
    try {
      const productsWithBarcodes = products?.filter(p => p.barcode) || [];
      
      if (productsWithBarcodes.length === 0) {
        toast({
          title: "هیچ محصولی یافت نشد",
          description: "هیچ محصولی با بارکد برای چاپ برچسب وجود ندارد",
          variant: "destructive"
        });
        return;
      }

      // Filter selected products or use all
      const targetProducts = selectedProducts.length > 0 
        ? productsWithBarcodes.filter(p => selectedProducts.includes(p.id))
        : productsWithBarcodes;

      if (targetProducts.length === 0) {
        toast({
          title: "هیچ محصولی انتخاب نشده",
          description: "لطفاً محصولات مورد نظر را انتخاب کنید",
          variant: "destructive"
        });
        return;
      }

      // Generate continuous label format for standard printers
      const continuousLabels = targetProducts.map(product => generateLabelZPL(product)).join('\n\n');

      // Create downloadable ZPL file for continuous printing
      const blob = new Blob([continuousLabels], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Continuous_Labels_${new Date().toISOString().split('T')[0]}.zpl`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "فایل چاپ پیوسته تولید شد",
        description: `${targetProducts.length} برچسب ZPL برای دستگاه‌های حرفه‌ای آماده شد`
      });
    } catch (error) {
      console.error('Print labels error:', error);
      toast({
        title: "خطا در تولید فایل چاپ",
        description: "عدم موفقیت در تولید برچسب‌های پیوسته",
        variant: "destructive"
      });
    }
  };

  const getStockStatusColor = (product: Product) => {
    if (product.stockQuantity <= 0) return 'bg-red-100 text-red-800';
    if (product.stockQuantity <= product.minStockLevel) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockStatusIcon = (product: Product) => {
    if (product.stockQuantity <= 0) return <AlertTriangle className="h-4 w-4" />;
    if (product.stockQuantity <= product.minStockLevel) return <TrendingDown className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const lowStockProducts = products?.filter(p => p.stockQuantity <= p.minStockLevel) || [];
  const outOfStockProducts = products?.filter(p => p.stockQuantity <= 0) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Barcode Inventory Management</h1>
          <p className="text-gray-600 mt-2">Scan barcodes to manage inventory efficiently</p>
        </div>
        <Button onClick={() => setLocation("/admin")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{products?.length || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Barcodes</p>
                <p className="text-2xl font-bold text-green-600">
                  {products?.filter(p => p.barcode).length || 0}
                </p>
              </div>
              <QrCode className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Iraq Format Barcode Generation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            تولید بارکد با فرمت عراق (Iraq Format Barcodes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">فرمت: 864-96771-XXXXX-C (کد کشور عراق + کد شرکت + کد محصول + چک دیجیت)</p>
              <p className="text-sm text-gray-500">Generate EAN-13 barcodes with Iraq country code (864) for all products</p>
            </div>
            <Button 
              onClick={generateIraqBarcodes}
              disabled={iraqBarcodeGeneration.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {iraqBarcodeGeneration.isPending ? 'در حال تولید...' : 'تولید بارکد عراق'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="scanner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="generator">Barcode Generator</TabsTrigger>
          <TabsTrigger value="ean13">EAN-13 Retail</TabsTrigger>
        </TabsList>

        {/* Scanner Tab */}
        <TabsContent value="scanner" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanner Panel */}
            <BarcodeScanner
              onScanSuccess={handleScanSuccess}
              scanMode={scanMode}
              className="h-fit"
            />

            {/* Inventory Operations */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedProduct ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold">{selectedProduct.name}</h3>
                      <p className="text-sm text-gray-600">Current Stock: {selectedProduct.stockQuantity} {selectedProduct.stockUnit}</p>
                      {selectedProduct.barcode && (
                        <div className="mt-2">
                          <p className="text-xs font-mono text-gray-500 mb-1">{selectedProduct.barcode}</p>
                          <VisualBarcode 
                            value={selectedProduct.barcode} 
                            width={1.5}
                            height={35}
                            fontSize={9}
                            className="max-w-full"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Operation Type</Label>
                      <Select value={stockOperation} onValueChange={(value: any) => setStockOperation(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in">Stock In</SelectItem>
                          <SelectItem value="out">Stock Out</SelectItem>
                          <SelectItem value="audit">Audit Adjustment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Select value={reason} onValueChange={setReason}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {stockOperation === 'in' && (
                            <>
                              <SelectItem value="purchase">Purchase</SelectItem>
                              <SelectItem value="return">Customer Return</SelectItem>
                              <SelectItem value="production">Production</SelectItem>
                            </>
                          )}
                          {stockOperation === 'out' && (
                            <>
                              <SelectItem value="sale">Sale</SelectItem>
                              <SelectItem value="damage">Damage</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                              <SelectItem value="transfer">Transfer</SelectItem>
                            </>
                          )}
                          {stockOperation === 'audit' && (
                            <>
                              <SelectItem value="audit">Inventory Audit</SelectItem>
                              <SelectItem value="correction">Stock Correction</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Reference (Optional)</Label>
                      <Input
                        placeholder="Order ID, PO Number, etc."
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                      />
                    </div>

                    <Button 
                      onClick={handleInventoryUpdate}
                      disabled={inventoryMutation.isPending || !reason}
                      className="w-full"
                    >
                      {stockOperation === 'in' && <Plus className="h-4 w-4 mr-2" />}
                      {stockOperation === 'out' && <Minus className="h-4 w-4 mr-2" />}
                      {stockOperation === 'audit' && <BarChart3 className="h-4 w-4 mr-2" />}
                      {inventoryMutation.isPending ? 'Processing...' : `Update Inventory`}
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

        {/* EAN-13 Retail Tab */}
        <TabsContent value="ean13" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EAN-13 Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Barcode className="h-5 w-5" />
                  EAN-13 Generator
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Generate GS1-compliant EAN-13 barcodes for retail distribution
                </p>
              </CardHeader>
              <CardContent>
                <EAN13Generator onBarcodeGenerated={(barcode) => handleBarcodeGenerated(barcode, 'EAN13')} />
              </CardContent>
            </Card>

            {/* EAN-13 Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>EAN-13 Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">With EAN-13</p>
                        <p className="text-2xl font-bold text-green-600">
                          {products?.filter(p => p.barcode?.length === 13).length || 0}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-800">Without EAN-13</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {products?.filter(p => !p.barcode || p.barcode.length !== 13).length || 0}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Bulk Operations</h4>
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/barcode/batch-generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include'
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            toast({
                              title: "تولید بارکد انبوه کامل شد",
                              description: `${result.summary.successful} بارکد ایجاد شد از مجموع ${result.summary.total} محصول`
                            });
                            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                          } else {
                            throw new Error('Batch generation failed');
                          }
                        } catch (error) {
                          toast({
                            title: "خطا در تولید بارکد",
                            description: "امکان تولید بارکدها وجود ندارد",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <Barcode className="h-4 w-4 mr-2" />
                      تولید بارکد برای محصولات موجود
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => generateBulkEAN13()}
                    >
                      Generate EAN-13 for All Products
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => exportCSVData()}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    {/* Label Printing Options */}
                    <div className="border-t pt-4 space-y-3">
                      <h4 className="text-sm font-medium">آپشن‌های چاپ برچسب</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="include-price"
                            checked={includePrice}
                            onCheckedChange={(checked) => setIncludePrice(checked === true)}
                          />
                          <Label htmlFor="include-price" className="text-sm">نمایش قیمت</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="include-sku"
                            checked={includeSKU}
                            onCheckedChange={(checked) => setIncludeSKU(checked === true)}
                          />
                          <Label htmlFor="include-sku" className="text-sm">نمایش SKU</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="include-website"
                            checked={includeWebsite}
                            onCheckedChange={(checked) => setIncludeWebsite(checked === true)}
                          />
                          <Label htmlFor="include-website" className="text-sm">نمایش وب‌سایت</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        variant="outline"
                        onClick={() => setShowPreview(true)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        پیش‌نمایش
                      </Button>
                      <Button 
                        className="flex-1" 
                        variant="outline"
                        onClick={() => handlePrintLabels()}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        چاپ ZPL
                      </Button>
                    </div>

                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products List with EAN-13 Status */}
          <Card>
            <CardHeader>
              <CardTitle>Products EAN-13 Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">
                        <Checkbox 
                          checked={selectedProducts.length === products?.length && products?.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProducts(products?.map(p => p.id) || []);
                            } else {
                              setSelectedProducts([]);
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Current Barcode</th>
                      <th className="text-left p-2">EAN-13 Status</th>

                    </tr>
                  </thead>
                  <tbody>
                    {products?.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <Checkbox 
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProducts(prev => [...prev, product.id]);
                              } else {
                                setSelectedProducts(prev => prev.filter(id => id !== product.id));
                              }
                            }}
                          />
                        </td>
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{product.category}</Badge>
                        </td>
                        <td className="p-2">
                          {product.barcode ? (
                            <div className="flex justify-center">
                              <VisualBarcode 
                                value={product.barcode}
                                productName={product.name}
                                sku={product.sku || undefined}
                                price={product.price}
                                width={3}
                                height={80}
                                fontSize={14}
                                showDownload={true}
                                showPrint={true}
                                showCopy={true}
                                className="bg-white p-4 border rounded"
                              />
                            </div>
                          ) : (
                            <span className="text-gray-400">No barcode</span>
                          )}
                        </td>
                        <td className="p-2">
                          {product.barcode?.length === 13 ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valid EAN-13
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Needs EAN-13
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
        </TabsContent>
      </Tabs>

      {/* Label Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>پیش‌نمایش برچسب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {selectedProducts.length > 0 
                ? `${selectedProducts.length} محصول انتخاب شده` 
                : `${products?.filter(p => p.barcode)?.length || 0} محصول با بارکد`}
            </div>
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {(() => {
                const targetProducts = selectedProducts.length > 0 
                  ? products?.filter(p => selectedProducts.includes(p.id) && p.barcode)
                  : products?.filter(p => p.barcode);
                
                return targetProducts?.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 bg-white">
                    <div className="font-medium text-sm mb-2">{product.name.substring(0, 30)}</div>
                    {includeSKU && (
                      <div className="text-xs text-gray-600 mb-1">
                        SKU: {product.sku || `SKU${product.id.toString().padStart(4, '0')}`}
                      </div>
                    )}
                    <div className="my-2">
                      <VisualBarcode 
                        value={product.barcode} 
                        format="CODE128" 
                        width={1.5} 
                        height={30}
                        fontSize={10}
                      />
                    </div>
                    {includePrice && (
                      <div className="text-xs text-green-600 font-medium">
                        {product.price ? `${Math.round(product.price)} IQD` : 'قیمت تعریف نشده'}
                      </div>
                    )}
                    {includeWebsite && (
                      <div className="text-xs text-blue-600 mt-1">
                        momtazchem.com
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generator Dialog */}
      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Barcode for {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <BarcodeGenerator
            productId={selectedProduct?.id}
            productName={selectedProduct?.name}
            sku={selectedProduct?.sku}
            onBarcodeGenerated={handleBarcodeGenerated}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BarcodeInventory;
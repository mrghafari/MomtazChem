import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { generateEAN13Barcode, validateEAN13, parseEAN13Barcode } from "@shared/barcode-utils";
import JsBarcode from "jsbarcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Printer
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
  const [selectedProductsForBatch, setSelectedProductsForBatch] = useState<number[]>([]);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [batchPrintOpen, setBatchPrintOpen] = useState(false);
  const [priceConfirmOpen, setPriceConfirmOpen] = useState(false);
  const [includePrice, setIncludePrice] = useState(false);
  const [pendingPrintProducts, setPendingPrintProducts] = useState<Product[]>([]);
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

  // EAN-13 CSV export function
  const exportEAN13Data = async () => {
    try {
      const response = await fetch('/api/ean13/export', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export error:', errorText);
        throw new Error(`Export failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `EAN13_Export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "تصدیر موفق",
        description: "فایل CSV دیتای EAN-13 با موفقیت دانلود شد"
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: "خطا در تصدیر",
        description: "امکان تصدیر فایل CSV وجود ندارد",
        variant: "destructive"
      });
    }
  };

  // Download CSV for label printers
  const downloadLabelPrinterCSV = async () => {
    try {
      const response = await fetch('/api/barcode/download-all?format=csv');
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `label-printer-barcodes-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "دانلود موفق",
        description: "فایل CSV برای لیبل پرینتر دانلود شد"
      });
    } catch (error) {
      toast({
        title: "خطا در دانلود",
        description: "امکان دانلود فایل CSV وجود ندارد",
        variant: "destructive"
      });
    }
  };

  // Show price confirmation dialog
  const showPriceConfirmation = (products: Product[]) => {
    setPendingPrintProducts(products);
    setPriceConfirmOpen(true);
  };

  // Execute print with price preference
  const executePrint = () => {
    const printContent = generateLabelHTML(pendingPrintProducts, includePrice);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    toast({
      title: "چاپ لیبل",
      description: `${pendingPrintProducts.length} لیبل آماده چاپ است`
    });

    setPriceConfirmOpen(false);
    setPendingPrintProducts([]);
  };

  // Single label printing function
  const printSingleLabel = (product: Product) => {
    if (!product.barcode) {
      toast({
        title: "خطا",
        description: "این محصول بارکد ندارد",
        variant: "destructive"
      });
      return;
    }

    showPriceConfirmation([product]);
  };

  // Batch printing function  
  const printBatchLabels = () => {
    const selectedProducts = products?.filter(p => 
      selectedProductsForBatch.includes(p.id) && p.barcode
    ) || [];

    if (selectedProducts.length === 0) {
      toast({
        title: "خطا",
        description: "هیچ محصولی با بارکد انتخاب نشده",
        variant: "destructive"
      });
      return;
    }

    showPriceConfirmation(selectedProducts);
    setBatchPrintOpen(false);
    setSelectedProductsForBatch([]);
  };

  // Generate HTML for label printing
  const generateLabelHTML = (productList: Product[], includePrice: boolean = false) => {
    // Generate barcode data URL for each product
    const generateBarcodeDataURL = (barcode: string) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 220;
        canvas.height = 100;
        
        // Get canvas context
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');
        
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Generate barcode using JsBarcode with canvas
        JsBarcode(canvas, barcode, {
          format: barcode.length === 13 ? "EAN13" : "CODE128",
          width: 2,
          height: 70,
          displayValue: true,
          fontSize: 14,
          background: '#ffffff',
          lineColor: '#000000',
          margin: 10
        });
        
        return canvas.toDataURL('image/png');
      } catch (error) {
        console.error('Barcode generation error:', error);
        // Create a simple barcode-like pattern manually if JsBarcode fails
        const canvas = document.createElement('canvas');
        canvas.width = 220;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // White background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw simple barcode pattern
          ctx.fillStyle = '#000000';
          for (let i = 0; i < barcode.length; i++) {
            const x = 20 + (i * 12);
            const width = parseInt(barcode[i]) % 2 === 0 ? 2 : 4;
            ctx.fillRect(x, 20, width, 50);
          }
          
          // Draw text
          ctx.fillStyle = '#000000';
          ctx.font = '12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(barcode, canvas.width / 2, 85);
        }
        
        return canvas.toDataURL('image/png');
      }
    };

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <title>چاپ لیبل بارکد</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 10px;
          background: white;
          direction: rtl;
        }
        
        .label-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 10px;
          width: 100%;
        }
        
        .label {
          border: 2px solid #333;
          padding: 8px;
          margin-bottom: 10px;
          background: white;
          box-sizing: border-box;
          text-align: center;
          page-break-inside: avoid;
          width: 250px;
          height: 150px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .company-name {
          font-size: 10px;
          font-weight: bold;
          color: #0066cc;
          margin-bottom: 2px;
          text-align: center;
          letter-spacing: 0.5px;
        }
        
        .product-name {
          font-size: 12px;
          font-weight: bold;
          color: #333;
          margin-bottom: 4px;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .product-info {
          font-size: 10px;
          color: #666;
          margin-bottom: 4px;
        }
        
        .barcode-section {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-grow: 1;
        }
        
        .barcode-image {
          max-width: 200px;
          max-height: 80px;
          border: none;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          image-rendering: pixelated;
        }
        
        .barcode-number {
          font-size: 10px;
          font-family: monospace;
          color: #333;
          margin-top: 2px;
          letter-spacing: 1px;
        }
        
        @media print {
          body { margin: 0; padding: 5px; }
          .label { margin-bottom: 5px; }
          @page { margin: 0.5cm; }
        }
      </style>
    </head>
    <body>
      <div class="label-container">
        ${productList.map(product => `
          <div class="label">
            <div>
              <div class="company-name">Momtazchem</div>
              <div class="product-name">${product.name}</div>
              <div class="product-info">
                کد کالا: ${product.sku || 'ندارد'} | 
                دسته: ${product.category}
                ${includePrice && product.unitPrice ? ` | قیمت: ${product.unitPrice} ${product.currency || 'IQD'}` : ''}
              </div>
            </div>
            <div class="barcode-section">
              <img src="${generateBarcodeDataURL(product.barcode!)}" class="barcode-image" alt="Barcode: ${product.barcode}" />
            </div>
            <div class="barcode-number">${product.barcode}</div>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
    `;
  };

  // Toggle product selection for batch printing
  const toggleProductSelection = (productId: number) => {
    setSelectedProductsForBatch(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Select all products with barcodes
  const selectAllProductsWithBarcodes = () => {
    const productsWithBarcodes = products?.filter(p => p.barcode).map(p => p.id) || [];
    setSelectedProductsForBatch(productsWithBarcodes);
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedProductsForBatch([]);
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="generator">Barcode Generator</TabsTrigger>
          <TabsTrigger value="ean13">EAN-13 Retail</TabsTrigger>
          <TabsTrigger value="printing">چاپ لیبل</TabsTrigger>
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

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {products?.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-gray-600">{product.category}</p>
                          {product.barcode && (
                            <div className="mt-2">
                              <p className="text-xs font-mono text-gray-500 mb-1">{product.barcode}</p>
                              <VisualBarcode 
                                value={product.barcode} 
                                width={1.5}
                                height={40}
                                fontSize={10}
                                className="max-w-full"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={getStockStatusColor(product)}>
                            {getStockStatusIcon(product)}
                            <span className="ml-1">{product.stockQuantity} {product.stockUnit}</span>
                          </Badge>
                          <Button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowGenerator(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(transactions) && transactions.length > 0 ? (
                    transactions.slice(0, 20).map((transaction) => {
                      const product = products?.find(p => p.id === transaction.productId);
                      return (
                        <div key={transaction.id} className="border-l-4 border-gray-200 pl-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{product?.name || `Product ${transaction.productId}`}</p>
                              <p className="text-sm text-gray-600">
                                {transaction.transactionType === 'in' ? '+' : transaction.transactionType === 'out' ? '-' : ''}
                                {Math.abs(transaction.quantity)} units - {transaction.reason}
                              </p>
                              {transaction.reference && (
                                <p className="text-xs text-gray-500">Ref: {transaction.reference}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono">
                                {transaction.previousStock} → {transaction.newStock}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Transactions</h3>
                      <p className="text-gray-500">No inventory transactions found</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
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
                      onClick={() => exportEAN13Data()}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      تصدیر CSV بارکدهای EAN-13
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => downloadLabelPrinterCSV()}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      دانلود CSV برای لیبل پرینتر
                    </Button>
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
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Current Barcode</th>
                      <th className="text-left p-2">EAN-13 Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products?.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
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
                            <div className="space-y-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded block cursor-pointer hover:bg-gray-200 transition-colors"
                                    title="کلیک کنید تا کپی شود"
                                    onClick={() => {
                                      navigator.clipboard.writeText(product.barcode!);
                                      toast({
                                        title: "بارکد کپی شد",
                                        description: `${product.barcode} کپی شد`
                                      });
                                    }}>
                                {product.barcode}
                              </code>
                              <div className="flex justify-center">
                                <VisualBarcode 
                                  value={product.barcode}
                                  productName={product.name}
                                  sku={product.sku || undefined}
                                  width={1.5}
                                  height={40}
                                  fontSize={10}
                                  showDownload={true}
                                  showPrint={true}
                                  showCopy={true}
                                  className="bg-white p-1 border rounded"
                                />
                              </div>
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
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowGenerator(true);
                              }}
                            >
                              {product.barcode?.length === 13 ? 'Update' : 'Generate'} EAN-13
                            </Button>
                            {product.barcode && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => printSingleLabel(product)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Printer className="h-3 w-3 mr-1" />
                                Print Label
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
        </TabsContent>

        {/* Label Printing Tab */}
        <TabsContent value="printing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batch Printing Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  چاپ دسته‌جمعی لیبل‌ها
                </CardTitle>
                <p className="text-sm text-gray-600">
                  انتخاب محصولات برای چاپ دسته‌جمعی لیبل‌های بارکد
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button 
                    variant="outline"
                    onClick={selectAllProductsWithBarcodes}
                    className="flex-1"
                  >
                    انتخاب همه محصولات
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={clearAllSelections}
                    className="flex-1"
                  >
                    پاک کردن انتخاب‌ها
                  </Button>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    تعداد انتخاب شده: {selectedProductsForBatch.length} محصول
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    فقط محصولاتی که بارکد دارند قابل چاپ هستند
                  </p>
                </div>

                <Button 
                  className="w-full"
                  onClick={printBatchLabels}
                  disabled={selectedProductsForBatch.length === 0}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print {selectedProductsForBatch.length} Selected Labels
                </Button>
              </CardContent>
            </Card>

            {/* Printing Preview */}
            <Card>
              <CardHeader>
                <CardTitle>پیش‌نمایش لیبل</CardTitle>
                <p className="text-sm text-gray-600">
                  نمونه لیبل برای چاپ
                </p>
              </CardHeader>
              <CardContent>
                {products && products.length > 0 && products[0].barcode ? (
                  <div className="border-2 border-gray-300 p-4 rounded-lg bg-white text-center max-w-xs mx-auto">
                    <div className="text-xs font-bold text-blue-600 mb-1">
                      Momtazchem
                    </div>
                    <div className="font-bold text-sm mb-2 text-gray-800 truncate">
                      {products[0].name}
                    </div>
                    <div className="text-xs text-gray-600 mb-3">
                      کد کالا: {products[0].sku || 'ندارد'} | دسته: {products[0].category}
                    </div>
                    <div className="mb-2">
                      <VisualBarcode 
                        value={products[0].barcode}
                        productName={products[0].name}
                        sku={products[0].sku || undefined}
                        width={1.5}
                        height={40}
                        fontSize={10}
                        className="bg-white"
                      />
                    </div>
                    <div className="text-xs font-mono text-gray-700 tracking-wide">
                      {products[0].barcode}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    هیچ محصولی با بارکد برای نمایش پیش‌نمایش وجود ندارد
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Selection List */}
          <Card>
            <CardHeader>
              <CardTitle>انتخاب محصولات برای چاپ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">انتخاب</th>
                      <th className="text-right p-2">نام محصول</th>
                      <th className="text-right p-2">دسته</th>
                      <th className="text-right p-2">کد کالا</th>
                      <th className="text-right p-2">بارکد</th>
                      <th className="text-right p-2">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products?.filter(p => p.barcode).map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedProductsForBatch.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2">
                          <div className="font-medium">{product.name}</div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{product.category}</Badge>
                        </td>
                        <td className="p-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {product.sku || 'ندارد'}
                          </code>
                        </td>
                        <td className="p-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {product.barcode}
                          </code>
                        </td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => printSingleLabel(product)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Print Label
                          </Button>
                        </td>
                      </tr>
                    )) || []}
                  </tbody>
                </table>
                {(!products || products.filter(p => p.barcode).length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    هیچ محصولی با بارکد برای چاپ وجود ندارد
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Price Confirmation Dialog */}
      <Dialog open={priceConfirmOpen} onOpenChange={setPriceConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تنظیمات چاپ لیبل</DialogTitle>
            <p className="text-sm text-gray-600">
              آیا می‌خواهید قیمت محصولات در لیبل‌ها نمایش داده شود؟
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includePrice"
                checked={includePrice}
                onChange={(e) => setIncludePrice(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="includePrice" className="text-sm font-medium text-gray-700">
                نمایش قیمت در لیبل
              </label>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                تعداد لیبل برای چاپ: {pendingPrintProducts.length}
              </p>
              {includePrice && (
                <p className="text-xs text-blue-600 mt-1">
                  قیمت محصولات در لیبل‌ها نمایش داده خواهد شد
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPriceConfirmOpen(false)}
            >
              لغو
            </Button>
            <Button
              onClick={executePrint}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              چاپ لیبل‌ها
            </Button>
          </DialogFooter>
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
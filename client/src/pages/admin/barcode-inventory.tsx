import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BarcodeScanner from "@/components/ui/barcode-scanner";
import BarcodeGenerator from "@/components/ui/barcode-generator";
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
  Upload
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

      <Tabs defaultValue="scanner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="generator">Barcode Generator</TabsTrigger>
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
                        <p className="text-xs font-mono">{selectedProduct.barcode}</p>
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
                            <p className="text-xs font-mono text-gray-500">{product.barcode}</p>
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
                  {transactions?.slice(0, 20).map((transaction) => {
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
                  })}
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
      </Tabs>

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
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Package, Plus, Edit, Download, Barcode, CheckCircle, AlertTriangle, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { useLocation } from 'wouter';
import EAN13Generator from '@/components/ui/ean13-generator';

interface Product {
  id: number;
  name: string;
  category: string;
  sku: string;
  barcode?: string;
  price: number;
  stockQuantity: number;
  description?: string;
}

interface EAN13Record {
  id: number;
  productId: number;
  productName: string;
  ean13: string;
  countryCode: string;
  companyPrefix: string;
  productCode: string;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
}

export default function EAN13Management() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showBulkGenerator, setShowBulkGenerator] = useState(false);
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

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch EAN-13 records
  const { data: ean13Records, isLoading: recordsLoading } = useQuery<EAN13Record[]>({
    queryKey: ["/api/ean13/records"],
    queryFn: async () => {
      const response = await fetch('/api/ean13/records');
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Update product barcode mutation
  const updateProductBarcodeMutation = useMutation({
    mutationFn: async ({ productId, barcode }: { productId: number; barcode: string }) => {
      const response = await fetch(`/api/products/${productId}/barcode`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode })
      });
      if (!response.ok) throw new Error('Failed to update product barcode');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ean13/records"] });
      toast({
        title: "Success",
        description: "Product barcode updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product barcode",
        variant: "destructive"
      });
    }
  });

  // Generate bulk EAN-13 mutation
  const generateBulkEAN13Mutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      const response = await fetch('/api/ean13/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds })
      });
      if (!response.ok) throw new Error('Failed to generate bulk EAN-13');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ean13/records"] });
      toast({
        title: "Bulk Generation Complete",
        description: `Generated ${data.generated} EAN-13 barcodes successfully`
      });
      setShowBulkGenerator(false);
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Generation Failed",
        description: error.message || "Failed to generate bulk EAN-13",
        variant: "destructive"
      });
    }
  });

  // Export EAN-13 data
  const exportEAN13Data = async () => {
    try {
      const response = await fetch('/api/ean13/export');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `EAN13_Export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "EAN-13 data exported successfully"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export EAN-13 data",
        variant: "destructive"
      });
    }
  };

  const handleBarcodeGenerated = (barcode: string) => {
    if (selectedProduct) {
      updateProductBarcodeMutation.mutate({
        productId: selectedProduct.id,
        barcode
      });
      setShowGenerator(false);
      setSelectedProduct(null);
    }
  };

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const productsWithEAN13 = filteredProducts.filter(p => p.barcode?.length === 13);
  const productsWithoutEAN13 = filteredProducts.filter(p => !p.barcode || p.barcode.length !== 13);

  const validateEAN13 = (barcode: string): boolean => {
    if (barcode.length !== 13 || !/^\d+$/.test(barcode)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString() === barcode[12];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">EAN-13 Barcode Management</h1>
          <p className="text-gray-600 mt-2">GS1-compliant barcodes for retail distribution</p>
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
                <p className="text-sm font-medium text-gray-600">With EAN-13</p>
                <p className="text-2xl font-bold text-green-600">{productsWithEAN13.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Without EAN-13</p>
                <p className="text-2xl font-bold text-orange-600">{productsWithoutEAN13.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valid EAN-13</p>
                <p className="text-2xl font-bold text-blue-600">
                  {productsWithEAN13.filter(p => validateEAN13(p.barcode!)).length}
                </p>
              </div>
              <Barcode className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Dialog open={showBulkGenerator} onOpenChange={setShowBulkGenerator}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Bulk Generate EAN-13
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Generate EAN-13 Barcodes</DialogTitle>
              <DialogDescription>
                Generate EAN-13 barcodes for all products without valid barcodes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This will generate EAN-13 barcodes for {productsWithoutEAN13.length} products.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => generateBulkEAN13Mutation.mutate(productsWithoutEAN13.map(p => p.id))}
                  disabled={generateBulkEAN13Mutation.isPending}
                  className="flex-1"
                >
                  {generateBulkEAN13Mutation.isPending ? 'Generating...' : 'Generate All'}
                </Button>
                <Button
                  onClick={() => setShowBulkGenerator(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={exportEAN13Data} variant="outline">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export CSV
        </Button>

        <Button onClick={exportEAN13Data} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Labels
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products by name, SKU, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="generator">EAN-13 Generator</TabsTrigger>
          <TabsTrigger value="records">Barcode Records</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product EAN-13 Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Current Barcode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const hasEAN13 = product.barcode?.length === 13;
                    const isValid = hasEAN13 ? validateEAN13(product.barcode!) : false;
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.category}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {product.sku}
                          </code>
                        </TableCell>
                        <TableCell>
                          {product.barcode ? (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {product.barcode}
                            </code>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasEAN13 ? (
                            <Badge variant={isValid ? "default" : "destructive"}>
                              {isValid ? "Valid EAN-13" : "Invalid EAN-13"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No EAN-13</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowGenerator(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {hasEAN13 ? 'Edit' : 'Generate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generator Tab */}
        <TabsContent value="generator" className="space-y-6">
          <EAN13Generator onBarcodeGenerated={handleBarcodeGenerated} />
        </TabsContent>

        {/* Records Tab */}
        <TabsContent value="records" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>EAN-13 Barcode Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 mb-4">
                This feature will be available when backend EAN-13 record tracking is implemented.
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>EAN-13</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Product Code</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsWithEAN13.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {product.barcode}
                        </code>
                      </TableCell>
                      <TableCell>{product.barcode?.substring(0, 3)}</TableCell>
                      <TableCell>{product.barcode?.substring(3, 8)}</TableCell>
                      <TableCell>{product.barcode?.substring(8, 12)}</TableCell>
                      <TableCell>
                        <span className="text-gray-400">N/A</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generator Dialog */}
      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Generate EAN-13 for {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>
              Create a GS1-compliant EAN-13 barcode for retail distribution
            </DialogDescription>
          </DialogHeader>
          <EAN13Generator
            productId={selectedProduct?.id}
            productName={selectedProduct?.name}
            onBarcodeGenerated={handleBarcodeGenerated}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
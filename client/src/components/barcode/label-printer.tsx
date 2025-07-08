import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Printer, Settings, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VisualBarcode from "@/components/ui/visual-barcode";

interface Product {
  id: number;
  name: string;
  barcode?: string;
  sku?: string;
  price?: string | number;
  priceUnit?: string;
  currency?: string;
  category: string;
}

interface LabelPrinterProps {
  products: Product[];
  selectedProducts?: number[];
}

const LabelPrinter: React.FC<LabelPrinterProps> = ({ products, selectedProducts = [] }) => {
  const [showPrice, setShowPrice] = useState(true);
  const [showWebsite, setShowWebsite] = useState(true);
  const [showSKU, setShowSKU] = useState(false);
  const [labelSize, setLabelSize] = useState('standard'); // standard, small, large, roll
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>(selectedProducts);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter products that have barcodes
  const productsWithBarcodes = products.filter(p => p.barcode);

  const handleProductToggle = (productId: number) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProductIds.length === productsWithBarcodes.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(productsWithBarcodes.map(p => p.id));
    }
  };

  const formatPrice = (product: Product) => {
    if (!product.price) return '';
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    const currency = product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : 'IQD';
    const unit = product.priceUnit || 'Unit';
    return `${unit} / ${price.toFixed(2)} ${currency}`;
  };

  const generateLabels = async (format: 'pdf' | 'print') => {
    setIsGenerating(true);
    try {
      const selectedProducts = productsWithBarcodes.filter(p => selectedProductIds.includes(p.id));
      
      const labelConfig = {
        products: selectedProducts,
        showPrice,
        showWebsite,
        showSKU,
        labelSize,
        website: 'www.momtazchem.com'
      };

      // Generate labels
      const response = await fetch('/api/barcode/generate-labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(labelConfig),
      });

      if (response.ok) {
        if (format === 'pdf') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `Product_Labels_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          // For print, open in new window
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const printWindow = window.open(url);
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print();
            };
          }
        }
      }
    } catch (error) {
      console.error('خطا در تولید لیبل:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const LabelPreview = ({ product }: { product: Product }) => {
    // Calculate optimal sizing based on label size and selected elements
    const elementCount = 1 + (showSKU ? 1 : 0) + (showPrice ? 1 : 0) + (showWebsite ? 1 : 0); // +1 for barcode
    
    const getDimensions = () => {
      switch (labelSize) {
        case 'small':
          return { width: 'w-48', height: 'h-32', padding: 'p-2' };
        case 'large':
          return { width: 'w-80', height: 'h-48', padding: 'p-4' };
        case 'roll':
          return { width: 'w-52', height: 'h-24', padding: 'p-1' };
        default:
          return { width: 'w-64', height: 'h-40', padding: 'p-3' };
      }
    };

    const dims = getDimensions();
    const isCompact = labelSize === 'roll' || labelSize === 'small';
    
    return (
      <div className={`border rounded-lg bg-white text-center ${dims.width} ${dims.height} ${dims.padding} shadow-sm overflow-hidden`}>
        <div className="h-full flex flex-col justify-between">
          {/* Product Name - Always at top, truncated */}
          <div className={`font-semibold truncate leading-tight ${
            isCompact ? 'text-xs mb-1' : 'text-sm mb-2'
          }`}>
            {isCompact && product.name.length > 20 ? 
              product.name.substring(0, 17) + '...' : 
              product.name
            }
          </div>

          {/* Middle section - Barcode and SKU */}
          <div className="flex-1 flex flex-col justify-center items-center">
            {showSKU && product.sku && (
              <div className={`text-gray-600 font-mono truncate mb-1 ${
                isCompact ? 'text-xs' : 'text-xs'
              }`}>
                SKU: {isCompact && product.sku.length > 12 ? 
                  product.sku.substring(0, 9) + '...' : 
                  product.sku
                }
              </div>
            )}
            
            <div className="flex-shrink-0">
              <VisualBarcode 
                value={product.barcode!} 
                width={
                  labelSize === 'small' ? 1.2 : 
                  labelSize === 'large' ? 2.2 : 
                  labelSize === 'roll' ? 1.5 : 1.8
                }
                height={
                  labelSize === 'small' ? 25 : 
                  labelSize === 'large' ? 45 : 
                  labelSize === 'roll' ? 20 : 35
                }
                fontSize={
                  labelSize === 'small' ? 8 : 
                  labelSize === 'large' ? 12 : 
                  labelSize === 'roll' ? 6 : 10
                }
              />
            </div>
          </div>

          {/* Bottom section - Price and Website */}
          <div className="space-y-1">
            {showPrice && product.price && (
              <div className={`font-bold text-green-600 truncate ${
                isCompact ? 'text-xs' : 'text-xs'
              }`}>
                {formatPrice(product)}
              </div>
            )}
            {showWebsite && (
              <div className={`text-gray-500 ${
                isCompact ? 'text-xs' : 'text-xs'
              }`}>
                www.momtazchem.com
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Printer className="w-4 h-4" />
          چاپ لیبل
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            سیستم چاپ لیبل محصولات
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-4 h-4" />
                  تنظیمات لیبل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox 
                      id="showPrice" 
                      checked={showPrice}
                      onCheckedChange={setShowPrice}
                    />
                    <Label htmlFor="showPrice">نمایش قیمت</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox 
                      id="showSKU" 
                      checked={showSKU}
                      onCheckedChange={setShowSKU}
                    />
                    <Label htmlFor="showSKU">نمایش SKU</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox 
                      id="showWebsite" 
                      checked={showWebsite}
                      onCheckedChange={setShowWebsite}
                    />
                    <Label htmlFor="showWebsite">نمایش آدرس سایت</Label>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>اندازه لیبل</Label>
                  <Select value={labelSize} onValueChange={setLabelSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">کوچک (48x32mm)</SelectItem>
                      <SelectItem value="standard">استاندارد (64x40mm)</SelectItem>
                      <SelectItem value="large">بزرگ (80x48mm)</SelectItem>
                      <SelectItem value="roll">پرینتر رولی (50x25mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>انتخاب محصولات</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedProductIds.length === productsWithBarcodes.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {selectedProductIds.length} از {productsWithBarcodes.length} محصول انتخاب شده
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button 
                    onClick={() => generateLabels('pdf')}
                    disabled={selectedProductIds.length === 0 || isGenerating}
                    className="w-full gap-2"
                  >
                    <Download className="w-4 h-4" />
                    دانلود PDF
                  </Button>
                  
                  <Button 
                    onClick={() => generateLabels('print')}
                    disabled={selectedProductIds.length === 0 || isGenerating}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    چاپ مستقیم
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Selection */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>لیست محصولات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {productsWithBarcodes.map(product => (
                    <div key={product.id} className="flex items-center space-x-2 space-x-reverse p-2 border rounded">
                      <Checkbox 
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={() => handleProductToggle(product.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{product.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Badge variant="outline">{product.category}</Badge>
                          {product.barcode && (
                            <span className="font-mono text-xs">{product.barcode}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>پیش‌نمایش لیبل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedProductIds.slice(0, 3).map(productId => {
                    const product = productsWithBarcodes.find(p => p.id === productId);
                    return product ? (
                      <LabelPreview key={product.id} product={product} />
                    ) : null;
                  })}
                  
                  {selectedProductIds.length > 3 && (
                    <div className="text-center text-gray-500 text-sm">
                      و {selectedProductIds.length - 3} محصول دیگر...
                    </div>
                  )}
                  
                  {selectedProductIds.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      محصولی انتخاب نشده
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelPrinter;
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
    // Fixed dimensions based on actual label paper sizes with grid layout
    const getLabelConfig = () => {
      switch (labelSize) {
        case 'small':
          return {
            container: 'w-40 h-28',
            padding: 'p-1',
            nameFont: 'text-xs',
            barcodeWidth: 1.0,
            barcodeHeight: 18,
            barcodeFontSize: 6,
            skuFont: 'text-xs',
            priceFont: 'text-xs',
            websiteFont: 'text-xs',
            nameMaxLength: 15,
            skuMaxLength: 10
          };
        case 'large':
          return {
            container: 'w-72 h-44',
            padding: 'p-3',
            nameFont: 'text-base',
            barcodeWidth: 2.0,
            barcodeHeight: 40,
            barcodeFontSize: 10,
            skuFont: 'text-sm',
            priceFont: 'text-sm',
            websiteFont: 'text-sm',
            nameMaxLength: 35,
            skuMaxLength: 18
          };
        case 'roll':
          return {
            container: 'w-48 h-20',
            padding: 'p-1',
            nameFont: 'text-xs',
            barcodeWidth: 1.3,
            barcodeHeight: 15,
            barcodeFontSize: 5,
            skuFont: 'text-xs',
            priceFont: 'text-xs',
            websiteFont: 'text-xs',
            nameMaxLength: 18,
            skuMaxLength: 12
          };
        default: // standard
          return {
            container: 'w-56 h-36',
            padding: 'p-2',
            nameFont: 'text-sm',
            barcodeWidth: 1.6,
            barcodeHeight: 28,
            barcodeFontSize: 8,
            skuFont: 'text-xs',
            priceFont: 'text-xs',
            websiteFont: 'text-xs',
            nameMaxLength: 25,
            skuMaxLength: 15
          };
      }
    };

    const config = getLabelConfig();
    
    // Text truncation helpers
    const truncateText = (text: string, maxLength: number) => {
      return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    };
    
    return (
      <div className={`border-2 border-gray-400 bg-white ${config.container} ${config.padding} relative overflow-hidden`}>
        {/* Fixed layout grid - 4 equal sections */}
        <div className="h-full grid grid-rows-4 gap-1">
          {/* Row 1: Product Name (always shown) */}
          <div className="flex items-center justify-center text-center min-h-0">
            <span className={`font-semibold ${config.nameFont} leading-tight truncate px-1`}>
              {truncateText(product.name, config.nameMaxLength)}
            </span>
          </div>

          {/* Row 2: SKU (if enabled) */}
          <div className="flex items-center justify-center min-h-0">
            {showSKU && product.sku ? (
              <span className={`text-gray-600 font-mono ${config.skuFont} truncate`}>
                SKU: {truncateText(product.sku, config.skuMaxLength)}
              </span>
            ) : (
              <div className="h-4"></div>
            )}
          </div>

          {/* Row 3: Barcode (always shown) - takes center space */}
          <div className="flex items-center justify-center min-h-0">
            <div className="flex-shrink-0">
              <VisualBarcode 
                value={product.barcode!} 
                width={config.barcodeWidth}
                height={config.barcodeHeight}
                fontSize={config.barcodeFontSize}
              />
            </div>
          </div>

          {/* Row 4: Price and Website (bottom section) */}
          <div className="flex flex-col items-center justify-center min-h-0 gap-0.5">
            {showPrice && product.price && (
              <span className={`font-bold text-green-600 ${config.priceFont} truncate text-center`}>
                {formatPrice(product)}
              </span>
            )}
            {showWebsite && (
              <span className={`text-gray-500 ${config.websiteFont} truncate`}>
                momtazchem.com
              </span>
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
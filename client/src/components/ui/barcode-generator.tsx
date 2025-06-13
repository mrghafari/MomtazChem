import { useState, useRef, useEffect } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, BarChart3, Download, Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeGeneratorProps {
  productId?: number;
  productName?: string;
  sku?: string;
  onBarcodeGenerated?: (barcode: string, type: string) => void;
  className?: string;
}

export const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  productId,
  productName,
  sku,
  onBarcodeGenerated,
  className = ""
}) => {
  const [barcodeText, setBarcodeText] = useState(sku || '');
  const [barcodeFormat, setBarcodeFormat] = useState('CODE128');
  const [qrText, setQrText] = useState('');
  const [customBarcode, setCustomBarcode] = useState('');
  const [generatedBarcodes, setGeneratedBarcodes] = useState<{barcode?: string, qr?: string}>({});
  
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (productId && productName) {
      // Generate default QR code data
      const qrData = JSON.stringify({
        productId,
        name: productName,
        sku: sku || `SKU${productId.toString().padStart(4, '0')}`,
        type: 'product'
      });
      setQrText(qrData);
      
      // Set default barcode if SKU exists
      if (sku) {
        setBarcodeText(sku);
      } else {
        setBarcodeText(`${productId.toString().padStart(10, '0')}`);
      }
    }
  }, [productId, productName, sku]);

  const generateRandomBarcode = (format: string) => {
    let code = '';
    const digits = format === 'EAN13' ? 12 : format === 'EAN8' ? 7 : 10;
    
    for (let i = 0; i < digits; i++) {
      code += Math.floor(Math.random() * 10);
    }
    
    // Add check digit for EAN codes
    if (format === 'EAN13' || format === 'EAN8') {
      const checkDigit = calculateEANCheckDigit(code);
      code += checkDigit;
    }
    
    return code;
  };

  const calculateEANCheckDigit = (code: string) => {
    let sum = 0;
    for (let i = 0; i < code.length; i++) {
      const digit = parseInt(code[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    return (10 - (sum % 10)) % 10;
  };

  const generateBarcode = async () => {
    if (!barcodeCanvasRef.current || !barcodeText.trim()) return;

    try {
      JsBarcode(barcodeCanvasRef.current, barcodeText, {
        format: barcodeFormat,
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 12,
        textMargin: 5,
      });

      setGeneratedBarcodes(prev => ({ ...prev, barcode: barcodeText }));
      
      toast({
        title: "Barcode Generated",
        description: `${barcodeFormat} barcode created successfully`,
        variant: "default"
      });
    } catch (error) {
      console.error('Barcode generation error:', error);
      toast({
        title: "Generation Error",
        description: "Failed to generate barcode. Check the format and input.",
        variant: "destructive"
      });
    }
  };

  const generateQRCode = async () => {
    if (!qrCanvasRef.current || !qrText.trim()) return;

    try {
      await QRCode.toCanvas(qrCanvasRef.current, qrText, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setGeneratedBarcodes(prev => ({ ...prev, qr: qrText }));
      
      toast({
        title: "QR Code Generated",
        description: "QR code created successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('QR code generation error:', error);
      toast({
        title: "Generation Error",
        description: "Failed to generate QR code",
        variant: "destructive"
      });
    }
  };

  const downloadBarcode = (type: 'barcode' | 'qr') => {
    const canvas = type === 'barcode' ? barcodeCanvasRef.current : qrCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${productName || 'product'}-${type}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Code copied to clipboard",
        variant: "default"
      });
    });
  };

  const assignToProduct = (type: 'barcode' | 'qr') => {
    const code = type === 'barcode' ? generatedBarcodes.barcode : generatedBarcodes.qr;
    if (code && onBarcodeGenerated) {
      onBarcodeGenerated(code, type === 'barcode' ? barcodeFormat : 'QR');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Barcode Generator
          {productName && <Badge variant="outline">{productName}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="barcode" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="barcode">Barcode</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          </TabsList>

          {/* Barcode Tab */}
          <TabsContent value="barcode" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode-format">Barcode Format</Label>
                  <Select value={barcodeFormat} onValueChange={setBarcodeFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CODE128">Code 128</SelectItem>
                      <SelectItem value="CODE39">Code 39</SelectItem>
                      <SelectItem value="EAN13">EAN-13</SelectItem>
                      <SelectItem value="EAN8">EAN-8</SelectItem>
                      <SelectItem value="UPC">UPC-A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode-text">Barcode Data</Label>
                  <Input
                    id="barcode-text"
                    value={barcodeText}
                    onChange={(e) => setBarcodeText(e.target.value)}
                    placeholder="Enter barcode data"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={generateBarcode} className="flex-1">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setBarcodeText(generateRandomBarcode(barcodeFormat))}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {customBarcode && (
                  <div className="space-y-2">
                    <Label>Custom Barcode</Label>
                    <Input
                      value={customBarcode}
                      onChange={(e) => setCustomBarcode(e.target.value)}
                      placeholder="Enter custom barcode"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setBarcodeText(customBarcode)}
                      className="w-full"
                    >
                      Use Custom Code
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-white">
                  <canvas
                    ref={barcodeCanvasRef}
                    className="w-full h-auto"
                  />
                </div>

                {generatedBarcodes.barcode && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                        {generatedBarcodes.barcode}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedBarcodes.barcode!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBarcode('barcode')}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {onBarcodeGenerated && (
                        <Button
                          size="sm"
                          onClick={() => assignToProduct('barcode')}
                          className="flex-1"
                        >
                          Assign to Product
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qrcode" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-text">QR Code Data</Label>
                  <textarea
                    id="qr-text"
                    value={qrText}
                    onChange={(e) => setQrText(e.target.value)}
                    placeholder="Enter QR code data (URL, text, JSON, etc.)"
                    className="w-full p-2 border rounded-md resize-none"
                    rows={4}
                  />
                </div>

                <Button onClick={generateQRCode} className="w-full">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code
                </Button>

                <div className="space-y-2">
                  <Label>Quick Templates</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQrText(`https://example.com/product/${productId}`)}
                    >
                      Product URL
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQrText(JSON.stringify({
                        productId,
                        name: productName,
                        sku: sku || `SKU${productId?.toString().padStart(4, '0')}`,
                        type: 'product'
                      }, null, 2))}
                    >
                      Product Info JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQrText(sku || `SKU${productId?.toString().padStart(4, '0')}`)}
                    >
                      Simple SKU
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-white flex items-center justify-center">
                  <canvas
                    ref={qrCanvasRef}
                    className="max-w-full h-auto"
                  />
                </div>

                {generatedBarcodes.qr && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-gray-100 rounded text-xs font-mono max-h-20 overflow-y-auto">
                        {generatedBarcodes.qr.length > 100 
                          ? `${generatedBarcodes.qr.substring(0, 100)}...` 
                          : generatedBarcodes.qr
                        }
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generatedBarcodes.qr!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBarcode('qr')}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {onBarcodeGenerated && (
                        <Button
                          size="sm"
                          onClick={() => assignToProduct('qr')}
                          className="flex-1"
                        >
                          Assign to Product
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Usage Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Usage Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Code 128: Best for alphanumeric data, variable length</li>
            <li>• EAN-13/EAN-8: Standard retail barcodes with check digits</li>
            <li>• QR Codes: Can store URLs, JSON data, or plain text</li>
            <li>• Use "Assign to Product" to link codes to inventory items</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeGenerator;
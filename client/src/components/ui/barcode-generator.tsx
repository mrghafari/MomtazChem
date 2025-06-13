import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, RefreshCw, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarcodeGeneratorProps {
  productId?: number;
  productName?: string;
  sku?: string;
  onBarcodeGenerated?: (barcode: string, type: string) => void;
  className?: string;
}

export const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  productId,
  productName = '',
  sku = '',
  onBarcodeGenerated,
  className = ''
}) => {
  const [barcodeType, setBarcodeType] = useState<'EAN13' | 'CODE128' | 'QR'>('EAN13');
  const [barcodeValue, setBarcodeValue] = useState('');
  const [generatedBarcode, setGeneratedBarcode] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-generate barcode for new products
    if (productId && !barcodeValue) {
      generateProductBarcode();
    }
  }, [productId]);

  const generateProductBarcode = () => {
    const timestamp = Date.now().toString();
    const productPrefix = productId ? productId.toString().padStart(4, '0') : '0001';
    
    if (barcodeType === 'EAN13') {
      // Generate EAN13: Country(2) + Company(5) + Product(5) + Check(1)
      const countryCode = '98'; // Iran country code
      const companyCode = '12345'; // Company identifier
      const productCode = productPrefix + timestamp.slice(-1);
      const partial = countryCode + companyCode + productCode;
      const checkDigit = calculateEAN13CheckDigit(partial);
      const ean13 = partial + checkDigit;
      setBarcodeValue(ean13);
      setGeneratedBarcode(ean13);
    } else if (barcodeType === 'CODE128') {
      const code128 = `MCH${productPrefix}${timestamp.slice(-4)}`;
      setBarcodeValue(code128);
      setGeneratedBarcode(code128);
    } else if (barcodeType === 'QR') {
      const qrData = JSON.stringify({
        productId,
        productName,
        sku: sku || `SKU${productPrefix}`,
        timestamp: new Date().toISOString(),
        type: 'product'
      });
      setQrCodeData(qrData);
      setBarcodeValue(qrData);
      setGeneratedBarcode(qrData);
    }
  };

  const calculateEAN13CheckDigit = (partial: string): string => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(partial[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  };

  const generateBarcode = () => {
    if (!barcodeValue) {
      generateProductBarcode();
      return;
    }

    try {
      if (barcodeType === 'QR') {
        generateQRCode();
      } else {
        generateLinearBarcode();
      }
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate barcode",
        variant: "destructive"
      });
    }
  };

  const generateLinearBarcode = () => {
    if (!barcodeCanvasRef.current) return;

    try {
      JsBarcode(barcodeCanvasRef.current, barcodeValue, {
        format: barcodeType,
        displayValue: true,
        fontSize: 12,
        textMargin: 8,
        margin: 10,
        width: 2,
        height: 60
      });

      if (onBarcodeGenerated) {
        onBarcodeGenerated(barcodeValue, barcodeType);
      }

      toast({
        title: "Barcode Generated",
        description: `${barcodeType} barcode created successfully`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Invalid barcode format or value",
        variant: "destructive"
      });
    }
  };

  const generateQRCode = async () => {
    if (!qrCanvasRef.current) return;

    try {
      await QRCode.toCanvas(qrCanvasRef.current, qrCodeData || barcodeValue, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      if (onBarcodeGenerated) {
        onBarcodeGenerated(qrCodeData || barcodeValue, 'QR');
      }

      toast({
        title: "QR Code Generated",
        description: "QR code created successfully",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate QR code",
        variant: "destructive"
      });
    }
  };

  const downloadBarcode = () => {
    const canvas = barcodeType === 'QR' ? qrCanvasRef.current : barcodeCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${barcodeType}_${productName || 'product'}_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const copyBarcodeValue = () => {
    navigator.clipboard.writeText(generatedBarcode);
    toast({
      title: "Copied",
      description: "Barcode value copied to clipboard",
      variant: "default"
    });
  };

  useEffect(() => {
    if (generatedBarcode) {
      generateBarcode();
    }
  }, [generatedBarcode, barcodeType]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Barcode Generator
          {productName && <Badge variant="outline">{productName}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barcode Type Selection */}
        <div className="space-y-2">
          <Label>Barcode Type</Label>
          <Select value={barcodeType} onValueChange={(value: any) => setBarcodeType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EAN13">EAN-13 (Standard Product)</SelectItem>
              <SelectItem value="CODE128">Code 128 (Alphanumeric)</SelectItem>
              <SelectItem value="QR">QR Code (Product Info)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Manual Value Input */}
        <div className="space-y-2">
          <Label>Barcode Value</Label>
          <div className="flex gap-2">
            <Input
              placeholder={barcodeType === 'QR' ? 'Product information JSON' : 'Barcode number'}
              value={barcodeType === 'QR' ? qrCodeData : barcodeValue}
              onChange={(e) => {
                if (barcodeType === 'QR') {
                  setQrCodeData(e.target.value);
                } else {
                  setBarcodeValue(e.target.value);
                }
              }}
            />
            <Button onClick={generateProductBarcode} variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Generate Button */}
        <Button onClick={generateBarcode} className="w-full">
          Generate {barcodeType} {barcodeType === 'QR' ? 'Code' : 'Barcode'}
        </Button>

        {/* Generated Barcode Display */}
        <div className="space-y-4">
          {/* Linear Barcode Canvas */}
          {barcodeType !== 'QR' && (
            <div className="flex justify-center p-4 border rounded-lg bg-white">
              <canvas ref={barcodeCanvasRef}></canvas>
            </div>
          )}

          {/* QR Code Canvas */}
          {barcodeType === 'QR' && (
            <div className="flex justify-center p-4 border rounded-lg bg-white">
              <canvas ref={qrCanvasRef}></canvas>
            </div>
          )}

          {/* Generated Value Display */}
          {generatedBarcode && (
            <div className="space-y-2">
              <Label>Generated Value</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedBarcode}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={copyBarcodeValue} variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {generatedBarcode && (
            <div className="flex gap-2">
              <Button onClick={downloadBarcode} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeGenerator;
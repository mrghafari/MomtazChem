import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, CheckCircle, AlertCircle, Info } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { generateEAN13Barcode, validateEAN13, parseEAN13Barcode, getCategoryCode } from '@shared/barcode-utils';

interface EAN13GeneratorProps {
  productId?: number;
  productName?: string;
  onBarcodeGenerated?: (barcode: string) => void;
}

// GS1 Country Codes (Common ones)
const GS1_COUNTRY_CODES = {
  '020': 'United States',
  '021': 'United States', 
  '022': 'United States',
  '023': 'United States',
  '024': 'United States',
  '025': 'United States',
  '026': 'United States',
  '027': 'United States',
  '028': 'United States',
  '029': 'United States',
  '690': 'China',
  '691': 'China',
  '692': 'China',
  '693': 'China',
  '694': 'China',
  '695': 'China',
  '696': 'China',
  '697': 'China',
  '698': 'China',
  '699': 'China',
  '786': 'Turkey',
  '787': 'Turkey',
  '788': 'Turkey',
  '789': 'Turkey',
  '621': 'Jordan',
  '628': 'Saudi Arabia',
  '629': 'United Arab Emirates', 
  '864': 'Iraq',
  '865': 'Iraq (alternate)'
};

export default function EAN13Generator({ productId, productName, onBarcodeGenerated }: EAN13GeneratorProps) {
  const [countryCode, setCountryCode] = useState('864'); // Iraq default
  const [companyPrefix, setCompanyPrefix] = useState('12345'); // Should be assigned by GS1
  const [productCode, setProductCode] = useState('');
  const [generatedBarcode, setGeneratedBarcode] = useState('');
  const [isValid, setIsValid] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Calculate EAN-13 check digit
  const calculateCheckDigit = (barcode12: string): string => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode12[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  };

  // Validate EAN-13 barcode
  const validateEAN13 = (barcode: string): boolean => {
    if (barcode.length !== 13) return false;
    if (!/^\d+$/.test(barcode)) return false;
    
    const calculatedCheck = calculateCheckDigit(barcode.substring(0, 12));
    return calculatedCheck === barcode[12];
  };

  // Generate EAN-13 barcode
  const generateEAN13 = useCallback(() => {
    if (!countryCode || !companyPrefix || !productCode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (companyPrefix.length < 4 || companyPrefix.length > 7) {
      toast({
        title: "Invalid Company Prefix",
        description: "Company prefix should be 4-7 digits (assigned by GS1)",
        variant: "destructive"
      });
      return;
    }

    if (productCode.length < 1 || productCode.length > 5) {
      toast({
        title: "Invalid Product Code",
        description: "Product code should be 1-5 digits",
        variant: "destructive"
      });
      return;
    }

    // Build 12-digit code (without check digit)
    const totalProductDigits = 12 - countryCode.length - companyPrefix.length;
    const paddedProductCode = productCode.padStart(totalProductDigits, '0');
    const barcode12 = countryCode + companyPrefix + paddedProductCode;

    if (barcode12.length !== 12) {
      toast({
        title: "Invalid Configuration",
        description: "Total digits must equal 12 before check digit",
        variant: "destructive"
      });
      return;
    }

    // Calculate check digit
    const checkDigit = calculateCheckDigit(barcode12);
    const fullBarcode = barcode12 + checkDigit;

    // Validate generated barcode
    if (!validateEAN13(fullBarcode)) {
      toast({
        title: "Generation Error",
        description: "Generated barcode failed validation",
        variant: "destructive"
      });
      return;
    }

    setGeneratedBarcode(fullBarcode);
    setIsValid(true);

    // Generate barcode image
    if (canvasRef.current) {
      try {
        JsBarcode(canvasRef.current, fullBarcode, {
          format: "EAN13",
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 14,
          textMargin: 8,
          marginTop: 10,
          marginBottom: 10,
          marginLeft: 10,
          marginRight: 10,
        });

        toast({
          title: "EAN-13 Generated",
          description: `Barcode ${fullBarcode} created successfully`,
          variant: "default"
        });
      } catch (error) {
        console.error('Barcode generation error:', error);
        toast({
          title: "Generation Error",
          description: "Failed to generate barcode image",
          variant: "destructive"
        });
      }
    }
  }, [countryCode, companyPrefix, productCode, toast]);

  // Copy barcode to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Barcode copied to clipboard",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  // Download barcode as image
  const downloadBarcode = () => {
    if (!canvasRef.current || !generatedBarcode) return;

    const link = document.createElement('a');
    link.download = `EAN13_${generatedBarcode}_${productName || 'product'}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  // Assign barcode to product
  const assignToProduct = () => {
    if (onBarcodeGenerated && generatedBarcode) {
      onBarcodeGenerated(generatedBarcode);
      toast({
        title: "Assigned",
        description: "Barcode assigned to product successfully",
        variant: "default"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Info className="h-5 w-5" />
            EAN-13 GS1 Standard Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-600">
          <ul className="space-y-1">
            <li>• Country Code: Assigned by GS1 (Iraq: 864-865)</li>
            <li>• Company Prefix: Must be obtained from GS1 organization</li>
            <li>• Product Code: Unique identifier for each product</li>
            <li>• Check Digit: Automatically calculated for validation</li>
          </ul>
        </CardContent>
      </Card>

      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle>EAN-13 Barcode Generator</CardTitle>
          {productName && (
            <p className="text-sm text-gray-600">Product: {productName}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Country Code */}
          <div className="space-y-2">
            <Label htmlFor="country-code">Country Code (GS1)</Label>
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GS1_COUNTRY_CODES).map(([code, country]) => (
                  <SelectItem key={code} value={code}>
                    {code} - {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company Prefix */}
          <div className="space-y-2">
            <Label htmlFor="company-prefix">
              Company Prefix (4-7 digits)
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="company-prefix"
              value={companyPrefix}
              onChange={(e) => setCompanyPrefix(e.target.value.replace(/\D/g, '').substring(0, 7))}
              placeholder="12345"
              maxLength={7}
            />
            <p className="text-xs text-gray-500">
              Must be obtained from GS1 organization in your country
            </p>
          </div>

          {/* Product Code */}
          <div className="space-y-2">
            <Label htmlFor="product-code">Product Code (1-5 digits)</Label>
            <Input
              id="product-code"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value.replace(/\D/g, '').substring(0, 5))}
              placeholder="001"
              maxLength={5}
            />
            <p className="text-xs text-gray-500">
              Available digits: {12 - countryCode.length - companyPrefix.length}
            </p>
          </div>

          {/* Generate Button */}
          <Button onClick={generateEAN13} className="w-full">
            Generate EAN-13 Barcode
          </Button>
        </CardContent>
      </Card>

      {/* Generated Barcode */}
      {generatedBarcode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Generated EAN-13 Barcode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Barcode Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Country:</span> {GS1_COUNTRY_CODES[countryCode as keyof typeof GS1_COUNTRY_CODES]}
              </div>
              <div>
                <span className="font-medium">Company:</span> {companyPrefix}
              </div>
              <div>
                <span className="font-medium">Product:</span> {productCode.padStart(12 - countryCode.length - companyPrefix.length, '0')}
              </div>
              <div>
                <span className="font-medium">Check Digit:</span> {generatedBarcode[12]}
              </div>
            </div>

            {/* Barcode Number */}
            <div className="space-y-2">
              <Label>Barcode Number</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-gray-100 rounded text-lg font-mono text-center">
                  {generatedBarcode}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedBarcode)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Barcode Image */}
            <div className="space-y-2">
              <Label>Barcode Image</Label>
              <div className="flex justify-center p-4 bg-white border rounded-lg">
                <canvas ref={canvasRef} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadBarcode}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
              {onBarcodeGenerated && (
                <Button
                  onClick={assignToProduct}
                  className="flex-1"
                >
                  Assign to Product
                </Button>
              )}
            </div>

            {/* Validation Status */}
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700 font-medium">Valid EAN-13 Barcode</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
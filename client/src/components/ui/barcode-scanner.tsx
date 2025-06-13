import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Camera, 
  CameraOff, 
  Package, 
  CheckCircle, 
  AlertCircle, 
  X,
  Search,
  Scan
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string, productData?: any) => void;
  onScanError?: (error: string) => void;
  scanMode?: 'lookup' | 'inventory_in' | 'inventory_out' | 'audit';
  className?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
  onScanError,
  scanMode = 'lookup',
  className = ''
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [scanHistory, setScanHistory] = useState<Array<{code: string, timestamp: Date, result: string}>>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();

  const startScanner = async () => {
    try {
      setIsScanning(true);
      
      const scanner = new Html5QrcodeScanner(
        "barcode-scanner-container",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true
        },
        false
      );

      scanner.render(
        (decodedText) => {
          handleScanSuccess(decodedText);
          scanner.pause(true);
        },
        (errorMessage) => {
          // Handle scan errors silently - most are just "no code found"
          console.debug('Scan error:', errorMessage);
        }
      );

      scannerRef.current = scanner;
    } catch (error) {
      setIsScanning(false);
      const errorMsg = 'Failed to start camera scanner';
      toast({
        title: "Scanner Error",
        description: errorMsg,
        variant: "destructive"
      });
      if (onScanError) onScanError(errorMsg);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanSuccess = async (scannedCode: string) => {
    setLastScannedCode(scannedCode);
    
    // Add to scan history
    setScanHistory(prev => [
      { code: scannedCode, timestamp: new Date(), result: 'success' },
      ...prev.slice(0, 9) // Keep last 10 scans
    ]);

    // Log the scan
    try {
      await fetch('/api/barcode/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: scannedCode,
          scanType: scanMode,
          scanResult: 'success'
        })
      });
    } catch (error) {
      console.error('Failed to log barcode scan:', error);
    }

    // Look up product information
    try {
      const response = await fetch(`/api/products/barcode/${encodeURIComponent(scannedCode)}`);
      if (response.ok) {
        const productData = await response.json();
        toast({
          title: "Product Found",
          description: `${productData.name} - Stock: ${productData.stockQuantity}`,
          variant: "default"
        });
        onScanSuccess(scannedCode, productData);
      } else {
        toast({
          title: "Product Not Found",
          description: `Barcode: ${scannedCode}`,
          variant: "destructive"
        });
        onScanSuccess(scannedCode, null);
      }
    } catch (error) {
      toast({
        title: "Lookup Error",
        description: "Failed to lookup product information",
        variant: "destructive"
      });
      onScanSuccess(scannedCode, null);
    }

    stopScanner();
  };

  const handleManualEntry = () => {
    if (!manualBarcode.trim()) return;
    
    handleScanSuccess(manualBarcode.trim());
    setManualBarcode('');
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const getScanModeLabel = () => {
    switch (scanMode) {
      case 'inventory_in': return 'Stock In';
      case 'inventory_out': return 'Stock Out';
      case 'audit': return 'Inventory Audit';
      default: return 'Product Lookup';
    }
  };

  const getScanModeColor = () => {
    switch (scanMode) {
      case 'inventory_in': return 'bg-green-100 text-green-800';
      case 'inventory_out': return 'bg-red-100 text-red-800';
      case 'audit': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Barcode Scanner
          </div>
          <Badge className={getScanModeColor()}>
            {getScanModeLabel()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scanner Controls */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button onClick={startScanner} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Start Scanner
            </Button>
          ) : (
            <Button onClick={stopScanner} variant="destructive" className="flex-1">
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Scanner
            </Button>
          )}
        </div>

        {/* Camera Scanner Container */}
        {isScanning && (
          <div className="border rounded-lg p-4">
            <div id="barcode-scanner-container" className="w-full"></div>
          </div>
        )}

        {/* Manual Entry */}
        <div className="space-y-2">
          <Label htmlFor="manual-barcode">Manual Barcode Entry</Label>
          <div className="flex gap-2">
            <Input
              id="manual-barcode"
              placeholder="Enter barcode manually..."
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
            />
            <Button onClick={handleManualEntry} disabled={!manualBarcode.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Last Scanned Code */}
        {lastScannedCode && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">Last Scanned:</span>
              <code className="bg-white px-2 py-1 rounded text-xs">
                {lastScannedCode}
              </code>
            </div>
          </div>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="space-y-2">
            <Label>Recent Scans</Label>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {scanHistory.map((scan, index) => (
                <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                  <code className="font-mono">{scan.code}</code>
                  <span className="text-gray-500">
                    {scan.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BarcodeScanner;
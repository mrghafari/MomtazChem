import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Square, CheckCircle, AlertTriangle, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string, productData?: any) => void;
  onScanError?: (error: string) => void;
  scanMode?: 'lookup' | 'inventory_in' | 'inventory_out' | 'audit';
  className?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanSuccess,
  onScanError,
  scanMode = 'lookup',
  className = ""
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{code: string, timestamp: Date, result: string}>>([]);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const scannerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check camera permission on component mount
    navigator.permissions?.query({ name: 'camera' as PermissionName })
      .then(permission => {
        setCameraPermission(permission.state as any);
        permission.addEventListener('change', () => {
          setCameraPermission(permission.state as any);
        });
      })
      .catch(() => setCameraPermission('prompt'));

    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!scannerRef.current) return;

    try {
      setIsScanning(true);
      
      const newScanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 300, height: 200 },
          supportedScanTypes: [
            Html5QrcodeScanType.SCAN_TYPE_CAMERA,
          ],
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ],
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
        },
        false
      );

      newScanner.render(
        async (decodedText, decodedResult) => {
          // Handle successful scan
          setLastScanResult(decodedText);
          
          try {
            // Look up product by barcode
            const response = await fetch(`/api/products/barcode/${encodeURIComponent(decodedText)}`);
            
            let productData = null;
            let scanResult = 'not_found';
            
            if (response.ok) {
              productData = await response.json();
              scanResult = 'found';
              
              toast({
                title: "Product Found",
                description: `Scanned: ${productData.name}`,
                variant: "default"
              });
            } else {
              toast({
                title: "Product Not Found",
                description: `No product found for barcode: ${decodedText}`,
                variant: "destructive"
              });
            }

            // Add to scan history
            setScanHistory(prev => [{
              code: decodedText,
              timestamp: new Date(),
              result: scanResult
            }, ...prev.slice(0, 9)]);

            // Log the scan
            await fetch('/api/barcode/log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                barcode: decodedText,
                scanType: scanMode,
                scanResult,
                location: 'inventory_scanner'
              })
            });

            onScanSuccess(decodedText, productData);
            
          } catch (error) {
            console.error('Error processing scan:', error);
            onScanError?.('Failed to process barcode scan');
          }
        },
        (errorMessage) => {
          // Handle scan error (but don't spam the console)
          if (!errorMessage.includes('QR code parse error')) {
            console.warn('Scanner error:', errorMessage);
          }
        }
      );

      setScanner(newScanner);
    } catch (error) {
      console.error('Failed to start scanner:', error);
      setIsScanning(false);
      toast({
        title: "Scanner Error",
        description: "Failed to start camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setIsScanning(false);
  };

  const getScanModeColor = () => {
    switch (scanMode) {
      case 'inventory_in': return 'bg-green-100 text-green-800';
      case 'inventory_out': return 'bg-red-100 text-red-800';
      case 'audit': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScanModeLabel = () => {
    switch (scanMode) {
      case 'inventory_in': return 'Stock In';
      case 'inventory_out': return 'Stock Out';
      case 'audit': return 'Audit';
      default: return 'Lookup';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Barcode Scanner
          </div>
          <Badge className={getScanModeColor()}>
            {getScanModeLabel()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera Permission Status */}
        {cameraPermission === 'denied' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Camera access is denied. Please enable camera permissions in your browser settings.
            </AlertDescription>
          </Alert>
        )}

        {/* Scanner Controls */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button 
              onClick={startScanning}
              disabled={cameraPermission === 'denied'}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Scanning
            </Button>
          ) : (
            <Button 
              onClick={stopScanning}
              variant="outline"
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Scanning
            </Button>
          )}
        </div>

        {/* Scanner Area */}
        <div className="relative">
          <div 
            id="qr-reader" 
            ref={scannerRef}
            className={`rounded-lg overflow-hidden ${isScanning ? 'block' : 'hidden'}`}
          />
          
          {!isScanning && (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Click "Start Scanning" to begin</p>
              </div>
            </div>
          )}
        </div>

        {/* Last Scan Result */}
        {lastScanResult && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Last Scanned:</span>
            </div>
            <code className="text-sm font-mono text-green-700 block mt-1">
              {lastScanResult}
            </code>
          </div>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <History className="h-4 w-4" />
              Recent Scans
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {scanHistory.slice(0, 5).map((scan, index) => (
                <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                  <code className="font-mono">{scan.code.substring(0, 20)}...</code>
                  <div className="flex items-center gap-1">
                    {scan.result === 'found' ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-gray-500">
                      {scan.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scanner Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Position the barcode within the scanning area</p>
          <p>• Ensure good lighting for best results</p>
          <p>• Supports QR codes, Code128, Code39, EAN, and UPC formats</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeScanner;
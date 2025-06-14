import { useState, useEffect, useRef, useCallback } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Square, CheckCircle, AlertTriangle, History, Zap, Keyboard } from "lucide-react";
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
  const [scannerMode, setScannerMode] = useState<'camera' | 'laser' | 'manual'>('camera');
  const [manualBarcode, setManualBarcode] = useState('');
  const [isLaserListening, setIsLaserListening] = useState(false);
  const [laserBuffer, setLaserBuffer] = useState('');
  const scannerRef = useRef<HTMLDivElement>(null);
  const laserInputRef = useRef<HTMLInputElement>(null);
  const laserTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Shared barcode processing function
  const processScannedBarcode = useCallback(async (barcode: string) => {
    setLastScanResult(barcode);
    
    try {
      // Look up product by barcode
      const response = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`);
      
      let productData = null;
      let scanResult = 'not_found';
      
      if (response.ok) {
        productData = await response.json();
        scanResult = 'found';
        
        toast({
          title: "محصول پیدا شد",
          description: `اسکن شده: ${productData.name}`,
          variant: "default"
        });
      } else {
        toast({
          title: "محصول پیدا نشد",
          description: `هیچ محصولی برای بارکد یافت نشد: ${barcode}`,
          variant: "destructive"
        });
      }

      // Add to scan history
      setScanHistory(prev => [{
        code: barcode,
        timestamp: new Date(),
        result: scanResult
      }, ...prev.slice(0, 9)]);

      // Log the scan
      await fetch('/api/barcode/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode,
          scanType: scanMode,
          scanResult,
          location: 'inventory_scanner'
        })
      });

      onScanSuccess(barcode, productData);
      
    } catch (error) {
      console.error('Error processing scan:', error);
      onScanError?.('Failed to process barcode scan');
    }
  }, [scanMode, onScanSuccess, onScanError, toast]);

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
      if (laserTimeoutRef.current) {
        clearTimeout(laserTimeoutRef.current);
      }
    };
  }, [scanner]);

  // Laser scanner keyboard event listener
  useEffect(() => {
    if (!isLaserListening) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore modifier keys and function keys
      if (event.ctrlKey || event.altKey || event.metaKey || event.key.length > 1) {
        if (event.key !== 'Enter') return;
      }

      event.preventDefault();

      if (event.key === 'Enter') {
        // Process the accumulated barcode
        if (laserBuffer.trim().length > 0) {
          processScannedBarcode(laserBuffer.trim());
          setLaserBuffer('');
        }
      } else {
        // Accumulate characters
        const char = event.key;
        setLaserBuffer(prev => prev + char);

        // Clear timeout and set new one
        if (laserTimeoutRef.current) {
          clearTimeout(laserTimeoutRef.current);
        }

        // Auto-submit after 100ms of inactivity (typical for laser scanners)
        laserTimeoutRef.current = setTimeout(() => {
          if (laserBuffer.length > 3) { // Minimum barcode length
            processScannedBarcode(laserBuffer);
            setLaserBuffer('');
          }
        }, 100);
      }
    };

    // Focus on the laser input to capture events
    if (laserInputRef.current) {
      laserInputRef.current.focus();
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (laserTimeoutRef.current) {
        clearTimeout(laserTimeoutRef.current);
      }
    };
  }, [isLaserListening, laserBuffer, processScannedBarcode]);

  // Laser scanner functions
  const startLaserListening = () => {
    setIsLaserListening(true);
    toast({
      title: "لیزر اسکنر فعال شد",
      description: "اکنون محصولات را با لیزر اسکن کنید",
      variant: "default"
    });
  };

  const stopLaserListening = () => {
    setIsLaserListening(false);
    setLaserBuffer('');
    toast({
      title: "لیزر اسکنر غیرفعال شد",
      description: "اسکن با لیزر متوقف شد",
      variant: "default"
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      processScannedBarcode(manualBarcode.trim());
      setManualBarcode('');
    }
  };

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
          processScannedBarcode(decodedText);
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
        title: "خطا در اسکنر",
        description: "شروع دوربین ناموفق بود. لطفاً مجوزها را بررسی کنید.",
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
      case 'inventory_in': return 'ورود کالا';
      case 'inventory_out': return 'خروج کالا';
      case 'audit': return 'بررسی';
      default: return 'جستجو';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            اسکنر بارکد
          </div>
          <Badge className={getScanModeColor()}>
            {getScanModeLabel()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scanner Mode Tabs */}
        <Tabs value={scannerMode} onValueChange={(value) => setScannerMode(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              دوربین
            </TabsTrigger>
            <TabsTrigger value="laser" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              لیزر
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              دستی
            </TabsTrigger>
          </TabsList>

          {/* Camera Scanner Tab */}
          <TabsContent value="camera" className="space-y-4">
            {/* Camera Permission Status */}
            {cameraPermission === 'denied' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  دسترسی به دوربین رد شده است. لطفاً در تنظیمات مرورگر، مجوز دوربین را فعال کنید.
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
                  شروع اسکن
                </Button>
              ) : (
                <Button 
                  onClick={stopScanning}
                  variant="outline"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  توقف اسکن
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
                    <p>برای شروع "شروع اسکن" را کلیک کنید</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Laser Scanner Tab */}
          <TabsContent value="laser" className="space-y-4">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                لیزر اسکنر را به محصول نشانه گیری کرده و اسکن کنید. بارکد به طور خودکار پردازش می‌شود.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              {!isLaserListening ? (
                <Button 
                  onClick={startLaserListening}
                  className="flex-1"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  فعال کردن لیزر اسکنر
                </Button>
              ) : (
                <Button 
                  onClick={stopLaserListening}
                  variant="outline"
                  className="flex-1"
                >
                  <Square className="h-4 w-4 mr-2" />
                  غیرفعال کردن لیزر اسکنر
                </Button>
              )}
            </div>

            {/* Laser Input Field (Hidden but focused for capturing scanner input) */}
            <input
              ref={laserInputRef}
              type="text"
              value={laserBuffer}
              onChange={() => {}} // Controlled by keyboard events
              className="opacity-0 absolute -top-10 left-0 w-1 h-1"
              autoFocus={isLaserListening}
            />

            {/* Laser Status */}
            {isLaserListening && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">لیزر اسکنر فعال است</span>
                </div>
                {laserBuffer && (
                  <div className="mt-2">
                    <span className="text-xs text-yellow-700">در حال دریافت: </span>
                    <code className="text-xs font-mono bg-yellow-100 px-1 rounded">
                      {laserBuffer}
                    </code>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Manual Input Tab */}
          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-barcode">بارکد محصول</Label>
                <Input
                  id="manual-barcode"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="بارکد را وارد کنید..."
                  className="font-mono"
                />
              </div>
              <Button type="submit" className="w-full" disabled={!manualBarcode.trim()}>
                <CheckCircle className="h-4 w-4 mr-2" />
                پردازش بارکد
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Last Scan Result */}
        {lastScanResult && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">آخرین اسکن:</span>
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
              اسکن‌های اخیر
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
                      {scan.timestamp.toLocaleTimeString('fa-IR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scanner Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• بارکد را در محدوده اسکن قرار دهید</p>
          <p>• برای بهترین نتیجه نور کافی تأمین کنید</p>
          <p>• پشتیبانی از QR، Code128، Code39، EAN و UPC</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeScanner;
import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { Copy, Check, Download, Printer } from 'lucide-react';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';

interface VisualBarcodeProps {
  value: string;
  productName?: string;
  sku?: string;
  price?: number;
  width?: number;
  height?: number;
  format?: string;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
  showDownload?: boolean;
  showPrint?: boolean;
  showCopy?: boolean;
}

const VisualBarcode = ({
  value,
  productName,
  sku,
  price,
  width = 2,
  height = 60,
  format = "EAN13",
  displayValue = true,
  fontSize = 12,
  className = "",
  showDownload = false,
  showPrint = false,
  showCopy = false
}: VisualBarcodeProps) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        // Clear previous content
        canvasRef.current.innerHTML = '';
        setError(null);
        
        JsBarcode(canvasRef.current, value, {
          format: format,
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: fontSize,
          margin: 5,
          background: "#ffffff",
          lineColor: "#000000",
          textMargin: 3,
          valid: function(valid) {
            if (!valid) {
              setError('Invalid barcode format');
            } else {
              setIsGenerated(true);
            }
          }
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
        setError(error instanceof Error ? error.message : 'Failed to generate barcode');
        setIsGenerated(false);
      }
    }
  }, [value, width, height, format, displayValue, fontSize]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({
        title: "کپی شد",
        description: "بارکد در کلیپ‌بورد کپی شد",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "خطا در کپی",
        description: "امکان کپی بارکد وجود ندارد",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    try {
      // Create a temporary canvas to convert SVG to image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 400;
      canvas.height = 200;
      
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(canvasRef.current);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      // Create image from SVG
      const img = new Image();
      img.onload = () => {
        // Draw SVG image centered on canvas
        const scale = Math.min(canvas.width / img.width, (canvas.height - 40) / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = 20; // Top margin
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        // Add product name if available
        if (productName) {
          ctx.font = '16px Arial';
          ctx.fillStyle = 'black';
          ctx.textAlign = 'center';
          ctx.fillText(productName, canvas.width / 2, 15);
        }
        
        // Download the image
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `barcode_${value}_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
            
            toast({
              title: "دانلود موفق",
              description: "بارکد به صورت عکس دانلود شد",
            });
          }
        }, 'image/png');
        
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "خطا در دانلود",
        description: "امکان دانلود بارکد وجود ندارد",
        variant: "destructive"
      });
    }
  };

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        Error: {error}
      </div>
    );
  }

  if (!isGenerated && !error) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        Generating barcode...
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* Barcode Display */}
      <div 
        className="cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleDownload}
        title="کلیک کنید تا بارکد را دانلود کنید"
      >
        <svg 
          ref={canvasRef}
          className="border border-gray-200 rounded bg-white p-2"
        />
      </div>
      
      {/* Product Info */}
      {productName && (
        <div className="text-sm font-medium text-gray-800 text-center">
          {productName}
        </div>
      )}
      
      {sku && (
        <div className="text-xs text-gray-600 font-mono">
          SKU: {sku}
        </div>
      )}
      
      {price && (
        <div className="text-sm font-medium text-green-600">
          {Math.round(price).toLocaleString()} IQD
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex space-x-2 mt-2">
        {showCopy && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center space-x-1"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "کپی شد" : "کپی"}</span>
          </Button>
        )}
        
        {showDownload && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>دانلود</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default VisualBarcode;
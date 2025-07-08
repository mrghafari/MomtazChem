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
  const printCanvasRef = useRef<SVGSVGElement>(null);
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
        
        // Validate barcode format
        if (value.length !== 13) {
          throw new Error('EAN-13 barcode must be exactly 13 digits');
        }
        
        if (!/^\d+$/.test(value)) {
          throw new Error('Barcode must contain only digits');
        }
        
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

        // Generate print version only when download/print is actually triggered
        // Don't auto-generate to avoid duplication
      } catch (error) {
        console.error("Error generating barcode:", error);
        setError(error instanceof Error ? error.message : 'Failed to generate barcode');
        setIsGenerated(false);
      }
    }
  }, [value, width, height, format, displayValue, fontSize, showDownload, showPrint]);

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

  const generatePrintVersion = () => {
    if (!printCanvasRef.current) return;
    
    // Clear existing content
    printCanvasRef.current.innerHTML = '';
    
    // Create container div
    const container = document.createElement('div');
    container.style.cssText = `
      background: white;
      padding: 20px;
      font-family: Arial, sans-serif;
      text-align: center;
      border: 1px solid #ccc;
      width: 300px;
      margin: 0 auto;
    `;
    
    // Add product name if available
    if (productName) {
      const nameDiv = document.createElement('div');
      nameDiv.style.cssText = 'font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333;';
      nameDiv.textContent = productName;
      container.appendChild(nameDiv);
    }
    
    // Add barcode SVG
    const barcodeContainer = document.createElement('div');
    barcodeContainer.style.cssText = 'margin: 15px 0;';
    
    const barcodeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(barcodeSvg, value, {
      format: format,
      width: 3,
      height: 80,
      displayValue: true,
      fontSize: 14,
      margin: 10,
      background: "#ffffff",
      lineColor: "#000000",
      textMargin: 8
    });
    
    barcodeContainer.appendChild(barcodeSvg);
    container.appendChild(barcodeContainer);
    
    // Add SKU if available
    if (sku) {
      const skuDiv = document.createElement('div');
      skuDiv.style.cssText = 'font-size: 12px; color: #666; margin: 5px 0; font-family: monospace;';
      skuDiv.textContent = `SKU: ${sku}`;
      container.appendChild(skuDiv);
    }
    
    // Add price if available
    if (price) {
      const priceDiv = document.createElement('div');
      priceDiv.style.cssText = 'font-size: 14px; color: #28a745; font-weight: bold; margin: 5px 0;';
      priceDiv.textContent = `${Math.round(price)} IQD`;
      container.appendChild(priceDiv);
    }
    
    // Add website info
    const websiteDiv = document.createElement('div');
    websiteDiv.style.cssText = 'font-size: 10px; color: #999; margin-top: 10px;';
    websiteDiv.textContent = 'www.momtazchem.com';
    container.appendChild(websiteDiv);
    
    printCanvasRef.current.appendChild(container);
  };

  const handleDownload = () => {
    if (!printCanvasRef.current) return;
    
    // Generate comprehensive print version
    generatePrintVersion();
    
    try {
      // Create a temporary canvas to convert SVG to image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Set canvas size for label printing (typically 4x6 inches at 300 DPI)
      canvas.width = 600;  // 2 inches at 300 DPI
      canvas.height = 400; // 1.33 inches at 300 DPI
      
      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(printCanvasRef.current);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        if (ctx) {
          // White background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Center the barcode
          const imgWidth = 400;
          const imgHeight = 120;
          const x = (canvas.width - imgWidth) / 2;
          const y = 50;
          
          ctx.drawImage(img, x, y, imgWidth, imgHeight);
          
          // Add product name if provided
          if (productName) {
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(productName, canvas.width / 2, y - 20);
          }
          
          // Add SKU if provided
          if (sku) {
            ctx.fillStyle = '#666666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`SKU: ${sku}`, canvas.width / 2, y + imgHeight + 30);
          }
          
          // Download the image
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `barcode-${value}-${sku || 'product'}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
              toast({
                title: "دانلود موفق",
                description: "فایل بارکد دانلود شد",
              });
            }
          }, 'image/png', 1.0);
        }
        
        URL.revokeObjectURL(svgUrl);
      };
      
      img.src = svgUrl;
    } catch (error) {
      toast({
        title: "خطا در دانلود",
        description: "امکان دانلود بارکد وجود ندارد",
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    if (!printCanvasRef.current) return;
    
    // Generate comprehensive print version
    generatePrintVersion();
    
    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const svgContent = printCanvasRef.current.outerHTML;
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Print Barcode - ${value}</title>
            <style>
              @page {
                size: 4in 2in;
                margin: 0.2in;
              }
              body {
                margin: 0;
                padding: 10px;
                font-family: Arial, sans-serif;
                text-align: center;
                background: white;
              }
              .barcode-container {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
              }
              .product-name {
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #000;
              }
              .sku {
                font-size: 10px;
                margin-top: 10px;
                color: #666;
              }
              svg {
                max-width: 100%;
                height: auto;
              }
              @media print {
                body { -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              ${productName ? `<div class="product-name">${productName}</div>` : ''}
              ${svgContent}
              ${sku ? `<div class="sku">SKU: ${sku}</div>` : ''}
              ${price ? `<div class="price" style="color: #16a34a; font-weight: 500; text-align: center; margin-top: 4px;">${Math.round(price)} IQD</div>` : ''}
            </div>
          </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
        
        toast({
          title: "چاپ آماده",
          description: "پنجره چاپ باز شد",
        });
      }
    } catch (error) {
      toast({
        title: "خطا در چاپ",
        description: "امکان چاپ بارکد وجود ندارد",
        variant: "destructive"
      });
    }
  };

  if (!value) {
    return (
      <div className={`text-gray-400 text-sm p-2 border border-gray-200 rounded ${className}`}>
        بارکد موجود نیست
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-500 text-sm p-2 border border-red-200 rounded bg-red-50 ${className}`}>
        خطا در تولید بارکد: {error}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="barcode-display bg-white border border-gray-200 rounded p-1">
        {/* Main barcode display */}
        <svg ref={canvasRef} className="mx-auto"></svg>
        
        {/* SKU display under barcode */}
        {sku && (
          <div className="text-center mt-1 text-xs text-gray-600 font-mono">
            SKU: {sku}
          </div>
        )}
        
        {/* Price display */}
        {price && (
          <div className="text-center mt-0.5 text-xs text-green-600 font-medium">
            {Math.round(price)} IQD
          </div>
        )}
        
        {/* Hidden print version */}
        <svg ref={printCanvasRef} style={{ display: 'none' }}></svg>
      </div>
      
      {/* Action buttons */}
      {(showCopy || showDownload || showPrint) && isGenerated && (
        <div className="flex gap-2 mt-2 justify-center">
          {showCopy && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'کپی شد' : 'کپی'}
            </Button>
          )}
          
          {showDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              دانلود
            </Button>
          )}
          
          {showPrint && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1"
            >
              <Printer className="w-3 h-3" />
              چاپ لیبل
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VisualBarcode;
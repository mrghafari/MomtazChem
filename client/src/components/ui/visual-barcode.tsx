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
    
    // Create container div styled like label preview
    const container = document.createElement('div');
    container.style.cssText = `
      background: white;
      border: 2px solid #666;
      padding: 8px;
      font-family: Arial, sans-serif;
      width: 240px;
      height: 160px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    `;
    
    // Row 1: Product Name (always shown)
    if (productName) {
      const nameDiv = document.createElement('div');
      nameDiv.style.cssText = 'display: flex; align-items: center; justify-content: center; text-align: center; min-height: 30px;';
      const nameSpan = document.createElement('span');
      nameSpan.style.cssText = 'font-weight: bold; font-size: 14px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; padding: 0 4px;';
      nameSpan.textContent = productName.length > 25 ? productName.substring(0, 22) + '...' : productName;
      nameDiv.appendChild(nameSpan);
      container.appendChild(nameDiv);
    }

    // Row 2: SKU (if available)
    const skuDiv = document.createElement('div');
    skuDiv.style.cssText = 'display: flex; align-items: center; justify-content: center; min-height: 20px;';
    if (sku) {
      const skuSpan = document.createElement('span');
      skuSpan.style.cssText = 'color: #666; font-family: monospace; font-size: 10px; overflow: hidden; text-overflow: ellipsis;';
      skuSpan.textContent = `SKU: ${sku.length > 15 ? sku.substring(0, 12) + '...' : sku}`;
      skuDiv.appendChild(skuSpan);
    }
    container.appendChild(skuDiv);

    // Row 3: Barcode (always shown)
    const barcodeDiv = document.createElement('div');
    barcodeDiv.style.cssText = 'display: flex; align-items: center; justify-content: center; min-height: 50px; flex-shrink: 0;';
    
    const barcodeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(barcodeSvg, value, {
      format: format,
      width: 1.5,
      height: 40,
      displayValue: true,
      fontSize: 8,
      margin: 2,
      background: "#ffffff",
      lineColor: "#000000",
      textMargin: 2
    });
    
    barcodeDiv.appendChild(barcodeSvg);
    container.appendChild(barcodeDiv);

    // Row 4: Price and Website (bottom section)
    const bottomDiv = document.createElement('div');
    bottomDiv.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 30px; gap: 2px;';
    
    if (price) {
      const priceSpan = document.createElement('span');
      priceSpan.style.cssText = 'font-weight: bold; color: #16a34a; font-size: 10px; overflow: hidden; text-overflow: ellipsis; text-align: center;';
      priceSpan.textContent = `${Math.round(price)} IQD`;
      bottomDiv.appendChild(priceSpan);
    }
    
    const websiteSpan = document.createElement('span');
    websiteSpan.style.cssText = 'color: #6b7280; font-size: 8px; overflow: hidden; text-overflow: ellipsis;';
    websiteSpan.textContent = 'momtazchem.com';
    bottomDiv.appendChild(websiteSpan);
    
    container.appendChild(bottomDiv);
    
    printCanvasRef.current.appendChild(container);
  };

  const handleDownload = () => {
    if (!printCanvasRef.current) return;
    
    // Generate comprehensive print version
    generatePrintVersion();
    
    try {
      // Use html2canvas approach for better DOM to image conversion
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match label dimensions
      canvas.width = 240 * 2;  // Double resolution for better quality
      canvas.height = 160 * 2;
      
      if (ctx) {
        // Scale for higher quality
        ctx.scale(2, 2);
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 240, 160);
        
        // Get the container element
        const container = printCanvasRef.current.firstChild as HTMLElement;
        if (container) {
          // Convert HTML to canvas manually for better control
          const drawElement = (element: HTMLElement, x: number, y: number, width: number, height: number) => {
            const computedStyle = window.getComputedStyle(element);
            
            // Draw background
            ctx.fillStyle = computedStyle.backgroundColor || '#ffffff';
            ctx.fillRect(x, y, width, height);
            
            // Draw border
            if (computedStyle.borderWidth && computedStyle.borderWidth !== '0px') {
              ctx.strokeStyle = computedStyle.borderColor || '#666666';
              ctx.lineWidth = parseInt(computedStyle.borderWidth) || 2;
              ctx.strokeRect(x, y, width, height);
            }
            
            // Draw text content
            const textContent = element.textContent?.trim();
            if (textContent && !element.querySelector('svg')) {
              ctx.fillStyle = computedStyle.color || '#000000';
              ctx.font = `${computedStyle.fontWeight || 'normal'} ${computedStyle.fontSize || '12px'} ${computedStyle.fontFamily || 'Arial'}`;
              ctx.textAlign = 'center';
              ctx.fillText(textContent, x + width/2, y + height/2 + 5);
            }
          };
          
          // Draw main container
          drawElement(container, 0, 0, 240, 160);
          
          // Simple text-based rendering for label elements
          let yOffset = 20;
          
          // Product name
          if (productName) {
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            const truncatedName = productName.length > 25 ? productName.substring(0, 22) + '...' : productName;
            ctx.fillText(truncatedName, 120, yOffset);
            yOffset += 25;
          }
          
          // SKU
          if (sku) {
            ctx.fillStyle = '#666666';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            const truncatedSku = sku.length > 15 ? sku.substring(0, 12) + '...' : sku;
            ctx.fillText(`SKU: ${truncatedSku}`, 120, yOffset);
            yOffset += 20;
          }
          
          // Barcode text representation (since SVG is complex to render)
          ctx.fillStyle = '#000000';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(value, 120, yOffset + 25);
          yOffset += 45;
          
          // Price
          if (price) {
            ctx.fillStyle = '#16a34a';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(price)} IQD`, 120, yOffset);
            yOffset += 15;
          }
          
          // Website
          ctx.fillStyle = '#6b7280';
          ctx.font = '8px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('momtazchem.com', 120, yOffset);
        }
        
        // Download the image
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `label-${productName || 'product'}-${value}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast({
              title: "دانلود موفق",
              description: "لیبل محصول دانلود شد",
            });
          }
        }, 'image/png', 1.0);
      }
    } catch (error) {
      toast({
        title: "خطا در دانلود",
        description: "امکان دانلود لیبل وجود ندارد",
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
        <svg 
          ref={canvasRef} 
          className="mx-auto cursor-pointer hover:bg-gray-50 transition-colors rounded p-1" 
          onClick={handleDownload}
          title="کلیک برای دانلود لیبل کامل"
        ></svg>
        
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
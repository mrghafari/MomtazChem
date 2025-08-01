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
  showPrice?: boolean;
  showWebsite?: boolean;
  websiteText?: string;
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
  showCopy = false,
  showPrice = true,
  showWebsite = true,
  websiteText = "www.momtazchem.com"
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
        // Clear previous content safely
        while (canvasRef.current.firstChild) {
          canvasRef.current.removeChild(canvasRef.current.firstChild);
        }
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
    
    // Clear existing content safely
    while (printCanvasRef.current.firstChild) {
      printCanvasRef.current.removeChild(printCanvasRef.current.firstChild);
    }
    
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
    if (!canvasRef.current) return;
    
    try {
      // Create a canvas for the complete label
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match label dimensions with higher resolution
      canvas.width = 240 * 3;  // Triple resolution for better quality
      canvas.height = 160 * 3;
      
      if (ctx) {
        // Scale for higher quality
        ctx.scale(3, 3);
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 240, 160);
        
        // Draw border like label preview
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 8, 224, 144);
        
        let yOffset = 25;
        
        // Row 1: Product Name (always shown)
        if (productName) {
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          const truncatedName = productName.length > 25 ? productName.substring(0, 22) + '...' : productName;
          ctx.fillText(truncatedName, 120, yOffset);
        }
        yOffset += 25;

        // Row 2: SKU (if available)
        if (sku) {
          ctx.fillStyle = '#666666';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          const truncatedSku = sku.length > 15 ? sku.substring(0, 12) + '...' : sku;
          ctx.fillText(`SKU: ${truncatedSku}`, 120, yOffset);
        }
        yOffset += 20;

        // Row 3: Generate and draw actual barcode
        if (value) {
          // Create a temporary SVG for barcode generation
          const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          tempSvg.setAttribute('width', '180');
          tempSvg.setAttribute('height', '50');
          
          try {
            JsBarcode(tempSvg, value, {
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
            
            // Convert SVG to image and draw it
            const svgData = new XMLSerializer().serializeToString(tempSvg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            
            const barcodeImg = new Image();
            barcodeImg.onload = () => {
              // Draw the barcode image
              ctx.drawImage(barcodeImg, 30, yOffset, 180, 50);
              
              yOffset += 60;
              
              // Row 4: Price and Website
              if (showPrice && price) {
                ctx.fillStyle = '#16a34a';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.round(price)} IQD`, 120, yOffset);
                yOffset += 15;
              }
              
              // Website
              if (showWebsite) {
                ctx.fillStyle = '#6b7280';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('momtazchem.com', 120, yOffset);
              }
              
              // Download the final image
              canvas.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `label-${productName || 'product'}-${value}.png`;
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                    if (document.body.contains(a)) {
                      document.body.removeChild(a);
                    }
                  }, 100);
                  URL.revokeObjectURL(url);
                  
                  toast({
                    title: "دانلود موفق",
                    description: "لیبل کامل با بارکد دانلود شد",
                  });
                }
              }, 'image/png', 1.0);
              
              URL.revokeObjectURL(svgUrl);
            };
            
            barcodeImg.src = svgUrl;
          } catch (barcodeError) {
            console.error('Barcode generation error:', barcodeError);
            // Fallback: draw barcode as text if generation fails
            ctx.fillStyle = '#000000';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(value, 120, yOffset + 25);
            
            yOffset += 45;
            
            // Continue with price and website
            if (showPrice && price) {
              ctx.fillStyle = '#16a34a';
              ctx.font = 'bold 10px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(`${Math.round(price)} IQD`, 120, yOffset);
              yOffset += 15;
            }
            
            if (showWebsite) {
              ctx.fillStyle = '#6b7280';
              ctx.font = '8px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('momtazchem.com', 120, yOffset);
            }
            
            // Download without barcode image
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `label-${productName || 'product'}-${value}.png`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                  if (document.body.contains(a)) {
                    document.body.removeChild(a);
                  }
                }, 100);
                URL.revokeObjectURL(url);
                
                toast({
                  title: "دانلود موفق",
                  description: "لیبل دانلود شد (بدون بارکد نموداری)",
                });
              }
            }, 'image/png', 1.0);
          }
        }
      }
    } catch (error) {
      console.error('Download error:', error);
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
                size: A4;
                margin: 0.5in;
              }
              * {
                box-sizing: border-box;
              }
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                background: white;
                color: black;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .label {
                width: 300px;
                height: 200px;
                border: 2px solid #000;
                padding: 15px;
                margin: 0 auto;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
                text-align: center;
                background: white;
                page-break-inside: avoid;
              }
              .product-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 8px;
                color: black;
                line-height: 1.2;
                max-height: 40px;
                overflow: hidden;
              }
              .sku-info {
                font-size: 12px;
                color: #444;
                margin-bottom: 10px;
                font-family: monospace;
              }
              .barcode-section {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                max-height: 80px;
              }
              .barcode-section svg {
                max-width: 250px;
                max-height: 70px;
                width: auto;
                height: auto;
              }
              .bottom-info {
                margin-top: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .price {
                font-size: 14px;
                font-weight: bold;
                color: #008000;
                margin-bottom: 5px;
              }
              .website {
                font-size: 10px;
                color: #666;
              }
              @media print {
                body { 
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .label {
                  box-shadow: none;
                  border: 2px solid black !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="label">
              ${productName ? `<div class="product-name">${productName}</div>` : ''}
              ${sku ? `<div class="sku-info">SKU: ${sku}</div>` : ''}
              <div class="barcode-section">
                ${svgContent}
              </div>
              <div class="bottom-info">
                ${price ? `<div class="price">${Math.round(price)} IQD</div>` : ''}
                ${showWebsite ? `<div class="website">momtazchem.com</div>` : ''}
              </div>
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